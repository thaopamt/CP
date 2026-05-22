import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Language configuration for compilation and execution inside the Piston container.
 * We use `docker exec -i piston_api` to run commands directly.
 */
const LANG_CONFIG: Record<string, {
  ext: string;
  compile?: (src: string, out: string) => string[];
  run: (src: string, out: string) => string[];
}> = {
  cpp: {
    ext: 'cpp',
    compile: (src, out) => ['g++', '-std=c++20', '-O2', '-o', out, src],
    run: (_src, out) => [out],
  },
  'c++': {
    ext: 'cpp',
    compile: (src, out) => ['g++', '-std=c++20', '-O2', '-o', out, src],
    run: (_src, out) => [out],
  },
  java: {
    ext: 'java',
    compile: (src, _out) => ['javac', src],
    run: (src, _out) => ['java', '-cp', path.dirname(src), 'Main'],
  },
  python: {
    ext: 'py',
    run: (src) => ['python3', src],
  },
  py: {
    ext: 'py',
    run: (src) => ['python3', src],
  },
  javascript: {
    ext: 'js',
    run: (src) => ['node', src],
  },
  js: {
    ext: 'js',
    run: (src) => ['node', src],
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

    // Create a temp directory for the source file
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exec_'));
    const srcFile = path.join(tmpDir, `main.${config.ext}`);
    const outFile = path.join(tmpDir, 'main');
    fs.writeFileSync(srcFile, data.code, 'utf-8');

    try {
      // ── Compile phase ──────────────────────────────────────────
      if (config.compile) {
        const compileCmd = config.compile(srcFile, outFile);
        client.emit('exec_stdout', { data: `Compiling...\n` });

        const compileResult = await new Promise<{ code: number; stderr: string }>((resolve) => {
          let stderr = '';
          const proc = spawn(compileCmd[0], compileCmd.slice(1), {
            timeout: 15000,
          });
          proc.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
          });
          proc.on('close', (code) => resolve({ code: code ?? 1, stderr }));
          proc.on('error', () => resolve({ code: 1, stderr: 'Compilation process error' }));
        });

        if (compileResult.code !== 0) {
          client.emit('exec_stderr', { data: compileResult.stderr });
          client.emit('exec_exit', { code: compileResult.code, phase: 'compile' });
          this.cleanup(tmpDir);
          return;
        }
      }

      // ── Run phase ──────────────────────────────────────────────
      const runCmd = config.run(srcFile, outFile);
      const proc = spawn(runCmd[0], runCmd.slice(1), {
        cwd: tmpDir,
        timeout: 30000, // 30s max
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
        this.cleanup(tmpDir);
      });

      proc.on('error', (err) => {
        client.emit('exec_error', { message: err.message });
        this.processes.delete(client.id);
        this.cleanup(tmpDir);
      });

      client.emit('exec_started', {});
    } catch (err: any) {
      client.emit('exec_error', { message: err.message || 'Unknown error' });
      this.cleanup(tmpDir);
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
  }

  private cleanup(dir: string) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
