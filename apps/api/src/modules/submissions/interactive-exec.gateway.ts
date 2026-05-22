import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { spawn, execSync, ChildProcess } from 'child_process';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/** Piston Docker container name */
const CONTAINER = process.env.PISTON_CONTAINER || 'piston_api';
/** Path to Piston-installed GCC */
const GCC_BIN = '/piston/packages/gcc/10.2.0/bin/g++';
/** Path to Piston-installed Python */
const PYTHON_BIN = '/piston/packages/python/3.10.0/bin/python3';
/** Path to Piston-installed Java */
const JAVA_HOME = '/piston/packages/java/15.0.2';

/**
 * Language configuration for compilation and execution inside the Piston container.
 * All paths are container-internal paths.
 */
const LANG_CONFIG: Record<string, {
  ext: string;
  compile?: (containerDir: string) => string[];
  run: (containerDir: string) => string[];
}> = {
  cpp: {
    ext: 'cpp',
    compile: (dir) => [GCC_BIN, '-std=c++20', '-O2', '-o', `${dir}/main`, `${dir}/main.cpp`],
    run: (dir) => [`${dir}/main`],
  },
  'c++': {
    ext: 'cpp',
    compile: (dir) => [GCC_BIN, '-std=c++20', '-O2', '-o', `${dir}/main`, `${dir}/main.cpp`],
    run: (dir) => [`${dir}/main`],
  },
  python: {
    ext: 'py',
    run: (dir) => [PYTHON_BIN, `${dir}/main.py`],
  },
  py: {
    ext: 'py',
    run: (dir) => [PYTHON_BIN, `${dir}/main.py`],
  },
  java: {
    ext: 'java',
    compile: (dir) => [`${JAVA_HOME}/bin/javac`, `${dir}/Main.java`],
    run: (dir) => [`${JAVA_HOME}/bin/java`, '-cp', dir, 'Main'],
  },
  javascript: {
    ext: 'js',
    run: (dir) => ['node', `${dir}/main.js`],
  },
  js: {
    ext: 'js',
    run: (dir) => ['node', `${dir}/main.js`],
  },
};

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/interactive',
})
export class InteractiveExecGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(InteractiveExecGateway.name);
  /** Active processes per client socket */
  private processes = new Map<string, ChildProcess>();
  /** Temp dirs to clean up */
  private tmpDirs = new Map<string, string>();

  handleDisconnect(client: Socket) {
    this.killProcess(client.id);
  }

  @SubscribeMessage('exec_start')
  async handleExecStart(
    @MessageBody() data: { language: string; code: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Kill any existing process for this client
    this.killProcess(client.id);

    const langKey = data.language?.toLowerCase();
    const config = LANG_CONFIG[langKey];
    if (!config) {
      client.emit('exec_error', { message: `Unsupported language: ${data.language}` });
      return;
    }

    // Use Java-specific filename if needed
    const fileName = langKey === 'java' ? `Main.${config.ext}` : `main.${config.ext}`;

    // 1. Write source to a local temp file
    const localTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exec_'));
    const localSrcFile = path.join(localTmpDir, fileName);
    fs.writeFileSync(localSrcFile, data.code, 'utf-8');

    // 2. Create a directory inside the container and copy the source file
    const containerDir = `/tmp/exec_${client.id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    try {
      execSync(`docker exec ${CONTAINER} mkdir -p ${containerDir}`, { timeout: 5000 });
      execSync(`docker cp ${localSrcFile} ${CONTAINER}:${containerDir}/${fileName}`, { timeout: 5000 });
    } catch (err: any) {
      client.emit('exec_error', { message: `Failed to prepare container: ${err.message}` });
      this.cleanupLocal(localTmpDir);
      return;
    }

    // Clean up local temp immediately — file is now in container
    this.cleanupLocal(localTmpDir);
    this.tmpDirs.set(client.id, containerDir);

    try {
      // ── Compile phase ──────────────────────────────────────────
      if (config.compile) {
        const compileArgs = config.compile(containerDir);
        client.emit('exec_stdout', { data: `Compiling...\n` });

        const compileResult = await new Promise<{ code: number; stderr: string }>((resolve) => {
          let stderr = '';
          const proc = spawn('docker', ['exec', CONTAINER, ...compileArgs], {
            timeout: 30000,
          });
          proc.stdout.on('data', (chunk: Buffer) => {
            // Some compilers write to stdout too
            stderr += chunk.toString();
          });
          proc.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
          });
          proc.on('close', (code) => resolve({ code: code ?? 1, stderr }));
          proc.on('error', (e) => resolve({ code: 1, stderr: e.message }));
        });

        if (compileResult.code !== 0) {
          client.emit('exec_stderr', { data: compileResult.stderr });
          client.emit('exec_exit', { code: compileResult.code, phase: 'compile' });
          this.cleanupContainer(containerDir);
          this.tmpDirs.delete(client.id);
          return;
        }
      }

      // ── Run phase (interactive — stdin piped) ──────────────────
      const runArgs = config.run(containerDir);
      const proc = spawn('docker', ['exec', '-i', CONTAINER, ...runArgs], {
        timeout: 60000, // 60s max for interactive sessions
      });

      this.processes.set(client.id, proc);

      proc.stdout.on('data', (chunk: Buffer) => {
        client.emit('exec_stdout', { data: chunk.toString() });
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        client.emit('exec_stderr', { data: chunk.toString() });
      });

      proc.on('close', (code, signal) => {
        client.emit('exec_exit', { code: code ?? -1, signal });
        this.processes.delete(client.id);
        this.cleanupContainer(containerDir);
        this.tmpDirs.delete(client.id);
      });

      proc.on('error', (err) => {
        client.emit('exec_error', { message: err.message });
        this.processes.delete(client.id);
        this.cleanupContainer(containerDir);
        this.tmpDirs.delete(client.id);
      });

      client.emit('exec_started', {});
    } catch (err: any) {
      client.emit('exec_error', { message: err.message || 'Unknown error' });
      this.cleanupContainer(containerDir);
      this.tmpDirs.delete(client.id);
    }
  }

  @SubscribeMessage('exec_stdin')
  handleStdin(
    @MessageBody() data: { input: string },
    @ConnectedSocket() client: Socket,
  ) {
    const proc = this.processes.get(client.id);
    if (proc && proc.stdin && !proc.stdin.destroyed) {
      proc.stdin.write(data.input + '\n');
    }
  }

  @SubscribeMessage('exec_kill')
  handleKill(@ConnectedSocket() client: Socket) {
    this.killProcess(client.id);
  }

  private killProcess(clientId: string) {
    const proc = this.processes.get(clientId);
    if (proc) {
      proc.kill('SIGKILL');
      this.processes.delete(clientId);
    }
    // Cleanup container dir
    const containerDir = this.tmpDirs.get(clientId);
    if (containerDir) {
      this.cleanupContainer(containerDir);
      this.tmpDirs.delete(clientId);
    }
  }

  private cleanupLocal(dir: string) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  private cleanupContainer(containerDir: string) {
    try {
      execSync(`docker exec ${CONTAINER} rm -rf ${containerDir}`, { timeout: 5000 });
    } catch {
      // ignore cleanup errors
    }
  }
}
