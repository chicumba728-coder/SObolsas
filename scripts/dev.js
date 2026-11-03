// Arranca a API (porta 3001) e o Vite (porta 3000) em paralelo; Ctrl+C termina ambos.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const vite = process.platform === 'win32' ? 'node_modules/.bin/vite.cmd' : 'node_modules/.bin/vite';
const apiArgs = ['--watch', 'server/index.js'];
if (existsSync('.env')) apiArgs.unshift('--env-file=.env');

const processes = [
  ['api', spawn(process.execPath, apiArgs, { stdio: 'inherit' })],
  ['web', spawn(vite, ['--host', '0.0.0.0', '--port', '3000', '--strictPort'], { stdio: 'inherit', shell: process.platform === 'win32' })],
];

const stop = (code = 0) => {
  processes.forEach(([, child]) => { if (child.exitCode === null) child.kill('SIGTERM'); });
  process.exit(code);
};
processes.forEach(([name, child]) => child.on('exit', (code) => {
  if (code) console.error(`[dev] o processo ${name} terminou com código ${code}`);
  stop(code ?? 0);
}));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
