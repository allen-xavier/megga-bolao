const ts = require('typescript');
const espree = require('espree');
const { analyze } = require('eslint-scope');
const { KEYS } = require('eslint-visitor-keys');

function transpile(code, filePath) {
  const compilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.Preserve,
    sourceMap: false,
  };

  const transpiled = ts.transpileModule(code, {
    fileName: filePath,
    compilerOptions,
    reportDiagnostics: false,
  });

  return transpiled.outputText;
}

function buildParseOptions(options = {}) {
  return {
    ecmaVersion: options.ecmaVersion ?? 2022,
    sourceType: options.sourceType ?? 'module',
    ecmaFeatures: { jsx: true, ...(options.ecmaFeatures || {}) },
    loc: true,
    range: true,
    tokens: true,
    comment: true,
  };
}

function parse(code, options = {}) {
  const js = transpile(code, options.filePath);
  const parseOptions = buildParseOptions(options);
  return espree.parse(js, parseOptions);
}

function parseForESLint(code, options = {}) {
  const js = transpile(code, options.filePath);
  const parseOptions = buildParseOptions(options);
  const ast = espree.parse(js, parseOptions);

  const scopeManager = analyze(ast, {
    ecmaVersion: parseOptions.ecmaVersion,
    sourceType: parseOptions.sourceType,
    ecmaFeatures: parseOptions.ecmaFeatures,
  });

  return {
    ast,
    services: {
      getTranspiledCode() {
        return js;
      },
    },
    scopeManager,
    visitorKeys: KEYS,
  };
}

module.exports = {
  parse,
  parseForESLint,
};
