import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const LIB = new URL("../../src/lib/", import.meta.url);

/**
 * Loads a src/lib module with its real relative imports, replacing only the
 * packages and modules named in `mocks`, so tests exercise behavior through the
 * module's public exports.
 */
export function loadLib(name, { mocks = {}, env = {}, globals = {} } = {}) {
  const cache = new Map();
  const sandboxProcess = { env: { ...env } };

  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const source = ts.transpileModule(readFileSync(new URL(`${file}.ts`, LIB), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const mod = { exports: {} };
    cache.set(file, mod);
    runInNewContext(source, {
      exports: mod.exports,
      module: mod,
      process: sandboxProcess,
      Buffer,
      URL,
      URLSearchParams,
      AbortSignal,
      console,
      ...globals,
      require: (request) => {
        if (request in mocks) return mocks[request];
        if (request.startsWith("./")) return load(request.slice(2));
        return require(request);
      },
    });
    return mod.exports;
  }

  return load(name);
}
