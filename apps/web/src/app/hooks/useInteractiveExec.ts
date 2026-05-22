import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { resolveSocketNamespace } from '../lib/socket-url';

export interface TerminalLine {
  type: 'stdout' | 'stderr' | 'stdin' | 'system' | 'error';
  text: string;
}

export function useInteractiveExec() {
  const socketRef = useRef<Socket | null>(null);
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);

  // Connect lazily on first exec
  const getSocket = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;
    socketRef.current?.disconnect();

    const url = resolveSocketNamespace('/interactive');
    const socket = io(url, { transports: ['websocket'] });

    socket.on('exec_stdout', (data: { data: string }) => {
      setLines(prev => [...prev, { type: 'stdout', text: data.data }]);
    });

    socket.on('exec_stderr', (data: { data: string }) => {
      setLines(prev => [...prev, { type: 'stderr', text: data.data }]);
    });

    socket.on('exec_error', (data: { message: string }) => {
      setLines(prev => [...prev, { type: 'error', text: data.message }]);
      setRunning(false);
    });

    socket.on('exec_exit', (data: { code: number; signal?: string; phase?: string }) => {
      const msg = data.phase === 'compile'
        ? `\nCompilation failed with exit code ${data.code}`
        : `\n...Program finished with exit code ${data.code}${data.signal ? ` (${data.signal})` : ''}`;
      setLines(prev => [...prev, { type: 'system', text: msg }]);
      setRunning(false);
    });

    socket.on('exec_started', () => {
      /* process started, nothing extra needed */
    });

    socket.on('disconnect', () => {
      setRunning(false);
    });

    socketRef.current = socket;
    return socket;
  }, []);

  const start = useCallback((language: string, code: string) => {
    const socket = getSocket();
    setLines([{ type: 'system', text: `Compiling ${language}...\n` }]);
    setRunning(true);
    socket.emit('exec_start', { language, code });
  }, [getSocket]);

  const sendStdin = useCallback((input: string) => {
    socketRef.current?.emit('exec_stdin', { input });
    setLines(prev => [...prev, { type: 'stdin', text: input + '\n' }]);
  }, []);

  const kill = useCallback(() => {
    socketRef.current?.emit('exec_kill');
    setRunning(false);
  }, []);

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { running, lines, start, sendStdin, kill, clearLines };
}
