#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ?? dirname(fileURLToPath(new URL('..', import.meta.url)));
const pluginData = process.env.CLAUDE_PLUGIN_DATA ?? join(homedir(), '.claude', 'plugins', 'data', 'google-slides-mcp');

const sameText = (left, right) =>
  existsSync(left) && existsSync(right) && readFileSync(left, 'utf8') === readFileSync(right, 'utf8');

const runQuiet = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: ['ignore', process.stderr, process.stderr],
  });
  return result.status ?? 1;
};

const installDeps = () => {
  mkdirSync(pluginData, { recursive: true });
  const srcPkg = join(pluginRoot, 'package.json');
  const dstPkg = join(pluginData, 'package.json');
  const srcLock = join(pluginRoot, 'package-lock.json');
  const dstLock = join(pluginData, 'package-lock.json');
  if (sameText(srcPkg, dstPkg) && sameText(srcLock, dstLock) && existsSync(join(pluginData, 'node_modules'))) {
    return;
  }
  copyFileSync(srcPkg, dstPkg);
  copyFileSync(srcLock, dstLock);
  const status = runQuiet('npm', ['ci'], pluginData);
  if (status !== 0) {
    process.exit(status);
  }
};

const compile = () => {
  const tsc = join(pluginData, 'node_modules', '.bin', 'tsc');
  const status = runQuiet(
    tsc,
    [
      '-p',
      join(pluginRoot, 'tsconfig.json'),
      '--outDir',
      join(pluginData, 'build'),
      '--rootDir',
      join(pluginRoot, 'src'),
    ],
    pluginRoot
  );
  if (status !== 0) {
    process.exit(status);
  }
};

installDeps();
compile();
const child = spawn(process.execPath, [join(pluginData, 'build', 'index.js')], {
  stdio: 'inherit',
});
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
