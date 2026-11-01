const path = require('path');

const SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

/**
 * Check if a file can be analyzed for dependencies
 */
const isAnalyzableFile = (filePath) => {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
};

const getSupportedExtensions = () => [...SUPPORTED_EXTENSIONS];

/**
 * Remove multi-line and single-line comments from JavaScript/TypeScript source code
 */
const stripComments = (content) => {
  if (!content) return '';
  // Strip block comments /* ... */
  let clean = content.replace(/\/\*[\s\S]*?\*\//g, (match) => ' '.repeat(match.length));
  // Strip line comments // ... but preserve newlines
  clean = clean.replace(/(^|[^:])\/\/.*$/gm, '$1');
  return clean;
};

/**
 * Extract ES imports and re-exports from code content
 */
const extractESImports = (code) => {
  const imports = [];
  const clean = stripComments(code);

  // 1. Static imports:
  // e.g. import defaultMember from 'module-name';
  // e.g. import * as name from 'module-name';
  // e.g. import { member } from 'module-name';
  // e.g. import { member as alias } from 'module-name';
  // e.g. import 'module-name';
  const importRegex = /import\s+(?:(?:(\*\s+as\s+[\w$]+|[\w$]+|\{[^}]*\})\s+from\s+)?['"]([^'"]+)['"]|['"]([^'"]+)['"])/g;
  let match;

  while ((match = importRegex.exec(clean)) !== null) {
    const clause = match[1] ? match[1].trim() : '';
    const rawPath = match[2] || match[3];
    if (!rawPath) continue;

    const symbols = [];
    if (!clause) {
      // side-effect import: import 'style.css'
      symbols.push('*side-effect*');
    } else if (clause.startsWith('* as')) {
      const ns = clause.replace(/^\*\s+as\s+/, '').trim();
      symbols.push(`* as ${ns}`);
    } else if (clause.startsWith('{')) {
      // named imports: { a, b as c }
      const inner = clause.slice(1, -1);
      inner.split(',').forEach((s) => {
        const item = s.trim();
        if (item) {
          const parts = item.split(/\s+as\s+/);
          symbols.push(parts[0].trim());
        }
      });
    } else {
      // default import: import React from 'react' or mixed: React, { useState }
      if (clause.includes('{')) {
        const [defPart, namedPart] = clause.split('{');
        const defSymbol = defPart.replace(/,/g, '').trim();
        if (defSymbol) symbols.push(defSymbol);
        if (namedPart) {
          const namedClean = namedPart.replace('}', '');
          namedClean.split(',').forEach((s) => {
            const item = s.trim();
            if (item) {
              const parts = item.split(/\s+as\s+/);
              symbols.push(parts[0].trim());
            }
          });
        }
      } else {
        symbols.push(clause);
      }
    }

    imports.push({
      rawPath,
      type: 'import',
      symbols: symbols.length > 0 ? symbols : ['default'],
    });
  }

  // 2. Dynamic imports: import('path')
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(clean)) !== null) {
    if (match[1]) {
      imports.push({
        rawPath: match[1],
        type: 'dynamic-import',
        symbols: ['*dynamic*'],
      });
    }
  }

  // 3. Re-exports: export { x } from 'path'; export * from 'path';
  const reExportRegex = /export\s+(?:(\*|\{[^}]*\})\s+from\s+)?['"]([^'"]+)['"]/g;
  while ((match = reExportRegex.exec(clean)) !== null) {
    const clause = match[1] ? match[1].trim() : '';
    const rawPath = match[2];
    if (!rawPath) continue;

    const symbols = [];
    if (clause === '*' || clause.startsWith('* as')) {
      symbols.push(clause);
    } else if (clause.startsWith('{')) {
      const inner = clause.slice(1, -1);
      inner.split(',').forEach((s) => {
        const item = s.trim();
        if (item) {
          const parts = item.split(/\s+as\s+/);
          symbols.push(parts[0].trim());
        }
      });
    }

    imports.push({
      rawPath,
      type: 're-export',
      symbols: symbols.length > 0 ? symbols : ['*'],
    });
  }

  return imports;
};

/**
 * Extract CommonJS require calls from code content
 */
const extractCommonJSRequires = (code) => {
  const requires = [];
  const clean = stripComments(code);

  // const x = require('y') or require('y')
  const requireRegex = /(?:(?:const|let|var)\s+([\w$,\s{}]+)\s*=\s*)?require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = requireRegex.exec(clean)) !== null) {
    const lhs = match[1] ? match[1].trim() : '';
    const rawPath = match[2];
    if (!rawPath) continue;

    const symbols = [];
    if (lhs) {
      if (lhs.startsWith('{') && lhs.endsWith('}')) {
        const inner = lhs.slice(1, -1);
        inner.split(',').forEach((s) => {
          const item = s.trim();
          if (item) {
            const parts = item.split(':');
            symbols.push(parts[0].trim());
          }
        });
      } else {
        symbols.push(lhs);
      }
    } else {
      symbols.push('*require*');
    }

    requires.push({
      rawPath,
      type: 'require',
      symbols: symbols.length > 0 ? symbols : ['default'],
    });
  }

  return requires;
};

/**
 * Extract defined exports from code content
 */
const extractExports = (code) => {
  const exports = [];
  const clean = stripComments(code);

  // export default ...
  if (/export\s+default\s+/g.test(clean) || /module\.exports\s*=/g.test(clean)) {
    exports.push({ symbol: 'default', isDefault: true });
  }

  // export const/let/var/function/class name
  const namedExportRegex = /export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([\w$]+)/g;
  let match;
  while ((match = namedExportRegex.exec(clean)) !== null) {
    if (match[1]) {
      exports.push({ symbol: match[1], isDefault: false });
    }
  }

  // export { a, b as c }
  const blockExportRegex = /export\s+\{([^}]+)\}(?!\s*from)/g;
  while ((match = blockExportRegex.exec(clean)) !== null) {
    const inner = match[1];
    inner.split(',').forEach((s) => {
      const item = s.trim();
      if (item) {
        const parts = item.split(/\s+as\s+/);
        const name = parts[parts.length - 1].trim();
        if (name) {
          exports.push({ symbol: name, isDefault: name === 'default' });
        }
      }
    });
  }

  return exports;
};

/**
 * Resolve relative or alias import paths into an actual repository file path
 * @param {string} rawPath - The import string, e.g. './Button' or '@/components/Button'
 * @param {string} currentFile - Relative path of the file containing the import, e.g. 'src/pages/Home.jsx'
 * @param {Set<string>|Array<string>} allFiles - All known file paths in the repo
 */
const resolveImportPath = (rawPath, currentFile, allFiles) => {
  if (!rawPath || !currentFile) return null;

  // External package imports (e.g. 'react', 'lodash', 'axios')
  const isRelative = rawPath.startsWith('./') || rawPath.startsWith('../');
  const isAlias = rawPath.startsWith('@/') || rawPath.startsWith('~/');

  if (!isRelative && !isAlias) {
    return null; // External package
  }

  const allFilesSet = allFiles instanceof Set ? allFiles : new Set(allFiles);
  // Lowercase lookup map for case-insensitive matching
  const lookupMap = new Map();
  for (const f of allFilesSet) {
    lookupMap.set(f.toLowerCase(), f);
  }

  const currentDir = path.posix.dirname(currentFile);
  let basePathCandidate;

  if (isRelative) {
    basePathCandidate = path.posix.normalize(path.posix.join(currentDir, rawPath));
  } else if (isAlias) {
    // Resolve @/ or ~/ relative to 'src' or root
    const stripped = rawPath.slice(2);
    // Find if the project has a src folder or uses root
    const hasSrcPrefix = Array.from(allFilesSet).some((f) => f.startsWith('src/') || f.includes('/src/'));
    if (hasSrcPrefix) {
      // Find candidate in src/ or client/src/
      const srcMatch = Array.from(allFilesSet).find((f) => f.includes('/src/') || f.startsWith('src/'));
      if (srcMatch) {
        const rootIndex = srcMatch.indexOf('src/');
        const prefix = srcMatch.slice(0, rootIndex + 4);
        basePathCandidate = path.posix.normalize(path.posix.join(prefix, stripped));
      } else {
        basePathCandidate = path.posix.normalize(path.posix.join('src', stripped));
      }
    } else {
      basePathCandidate = path.posix.normalize(stripped);
    }
  }

  if (!basePathCandidate) return null;

  // Potential extensions and index files to test
  const candidates = [
    basePathCandidate,
    `${basePathCandidate}.js`,
    `${basePathCandidate}.jsx`,
    `${basePathCandidate}.ts`,
    `${basePathCandidate}.tsx`,
    `${basePathCandidate}.mjs`,
    `${basePathCandidate}.cjs`,
    path.posix.join(basePathCandidate, 'index.js'),
    path.posix.join(basePathCandidate, 'index.jsx'),
    path.posix.join(basePathCandidate, 'index.ts'),
    path.posix.join(basePathCandidate, 'index.tsx'),
  ];

  for (const cand of candidates) {
    if (allFilesSet.has(cand)) {
      return cand;
    }
    const lower = cand.toLowerCase();
    if (lookupMap.has(lower)) {
      return lookupMap.get(lower);
    }
  }

  return null;
};

/**
 * Complete analysis for a single file
 */
const analyzeFile = (content, filePath, allFiles = []) => {
  if (!content || !isAnalyzableFile(filePath)) {
    return {
      filePath,
      imports: [],
      exports: [],
    };
  }

  const esImports = extractESImports(content);
  const cjsRequires = extractCommonJSRequires(content);
  const rawImports = [...esImports, ...cjsRequires];

  const imports = rawImports.map((imp) => {
    const resolvedPath = resolveImportPath(imp.rawPath, filePath, allFiles);
    return {
      rawPath: imp.rawPath,
      resolvedPath,
      type: imp.type,
      symbols: imp.symbols,
      isInternal: resolvedPath !== null,
    };
  });

  const exports = extractExports(content);

  return {
    filePath,
    imports,
    exports,
  };
};

module.exports = {
  isAnalyzableFile,
  getSupportedExtensions,
  stripComments,
  extractESImports,
  extractCommonJSRequires,
  extractExports,
  resolveImportPath,
  analyzeFile,
};

