import { loadPyodide } from '/assets/pyodide/pyodide.mjs';

const games = {
  'space-adventure': {
    root: '/games/space-adventure',
    module: 'space_adventure_adapter',
    paths: ['/games/space-adventure', '/games/space-adventure/custom_type'],
    files: [
      ['space_adventure_text_game.py', 'space_adventure_text_game.py'],
      ['space_adventure_adapter.py', 'space_adventure_adapter.py'],
      ['custom_type/__init__.py', 'custom_type/__init__.py'],
      ['custom_type/command.py', 'custom_type/command.py'],
      ['custom_type/direction.py', 'custom_type/direction.py'],
      ['custom_type/item.py', 'custom_type/item.py'],
      ['custom_type/key.py', 'custom_type/key.py'],
      ['custom_type/room.py', 'custom_type/room.py'],
    ],
  },
  'guessing-game': {
    root: '/games/guessing-game',
    module: 'guessing_game_adapter',
    paths: ['/games/guessing-game'],
    files: [
      ['guessing_game.py', 'guessing_game.py'],
      ['guessing_game_adapter.py', 'guessing_game_adapter.py'],
    ],
  },
};

let pyodidePromise;
let pyodide;
let currentGame;

self.addEventListener('message', (event) => {
  handleMessage(event.data).catch((error) => {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  });
});

async function handleMessage(message) {
  if (message.type === 'load') {
    await loadGame(message.gameId);
    postResult(runAdapter('start'));
    self.postMessage({ type: 'ready' });
    return;
  }

  if (!currentGame) {
    throw new Error('No game is loaded.');
  }

  if (message.type === 'input') {
    const result = runAdapter('submit', message.value);
    postResult(result);
    self.postMessage({ type: result.done ? 'done' : 'ready' });
    return;
  }

  if (message.type === 'reset') {
    postResult(runAdapter('start'));
    self.postMessage({ type: 'ready' });
  }
}

async function loadGame(gameId) {
  const game = games[gameId];
  if (!game) {
    throw new Error(`Unknown game: ${gameId}`);
  }

  pyodide = await loadPyodideRuntime();
  await writeFiles(gameId, game);
  const paths = JSON.stringify(game.paths);
  pyodide.runPython(`
import importlib
import sys
for path in ${paths}:
    if path not in sys.path:
        sys.path.insert(0, path)
adapter = importlib.import_module("${game.module}")
adapter = importlib.reload(adapter)
`);
  currentGame = game;
}

async function loadPyodideRuntime() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: '/assets/pyodide/',
      stdout: () => undefined,
      stderr: () => undefined,
    });
  }
  return pyodidePromise;
}

async function writeFiles(gameId, game) {
  pyodide.FS.mkdirTree(game.root);
  for (const [source, target] of game.files) {
    const response = await fetch(`/assets/python-games/${gameId}/${source}`);
    if (!response.ok) {
      throw new Error(`Unable to load ${source}`);
    }
    const targetPath = `${game.root}/${target}`;
    ensureDirectory(targetPath);
    pyodide.FS.writeFile(targetPath, await response.text());
  }
}

function ensureDirectory(path) {
  const parts = path.split('/').slice(0, -1);
  let current = '';
  for (const part of parts) {
    if (!part) {
      continue;
    }
    current += `/${part}`;
    try {
      pyodide.FS.mkdir(current);
    } catch {
      // Directory already exists.
    }
  }
}

function runAdapter(method, value) {
  const argument = value === undefined ? '' : JSON.stringify(value);
  const call = value === undefined ? `adapter.${method}()` : `adapter.${method}(${argument})`;
  const json = pyodide.runPython(`
import json
json.dumps(${call})
`);
  return JSON.parse(json);
}

function postResult(result) {
  if (result.output) {
    self.postMessage({ type: 'output', text: result.output });
  }
  self.postMessage({ type: 'prompt', text: result.prompt || '' });
}
