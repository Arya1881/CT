/**
 * Minimal structured logger. Swap for Winston/Pino later without touching callers.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function ts(): string {
  return new Date().toISOString();
}

function write(level: Level, msg: string, meta?: unknown) {
  const line = `[${ts()}] [${level.toUpperCase()}] ${msg}${meta !== undefined ? ` ${stringify(meta)}` : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

function stringify(meta: unknown): string {
  if (meta instanceof Error) return meta.stack || meta.message;
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => write('debug', msg, meta),
  info: (msg: string, meta?: unknown) => write('info', msg, meta),
  warn: (msg: string, meta?: unknown) => write('warn', msg, meta),
  error: (msg: string, meta?: unknown) => write('error', msg, meta),
};
