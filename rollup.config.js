import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import { renameSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const rewriteImportPlugin = () => ({
  name: 'rewrite-import',
  renderChunk(code, chunk) {
    if (chunk.fileName.includes('react.')) {
      const modifiedCode = code
        .replace(/from\s*['"]\.\/aura-cursor['"]/g, "from 'aura-cursor'")
        .replace(/from\s*["']\.\/aura-cursor["']/g, "from 'aura-cursor'")
        .replace(/require\s*\(\s*['"]\.\/aura-cursor['"]\s*\)/g, "require('aura-cursor')");
      return {
        code: modifiedCode,
        map: null
      };
    }
    return null;
  }
});

const moveDeclarationFilesPlugin = () => ({
  name: 'move-declaration-files',
  writeBundle() {
    const auraCursorSrcPath = join(process.cwd(), 'dist/src/aura-cursor.d.ts');
    const auraCursorDestPath = join(process.cwd(), 'dist/aura-cursor.d.ts');
    if (existsSync(auraCursorSrcPath) && !existsSync(auraCursorDestPath)) {
      let content = readFileSync(auraCursorSrcPath, 'utf-8');
      writeFileSync(auraCursorDestPath, content);
    }

    const indexSrcPath = join(process.cwd(), 'dist/src/index.d.ts');
    const indexDestPath = join(process.cwd(), 'dist/index.d.ts');
    if (existsSync(indexSrcPath)) {
      let content = readFileSync(indexSrcPath, 'utf-8');
      content = content.replace(/from\s+['"]\.\/aura-cursor['"]/g, "from './aura-cursor'");
      content = content.replace(/from\s+['"]\.\/react['"]/g, "from './react'");
      writeFileSync(indexDestPath, content);
    }

    const reactSrcPath = join(process.cwd(), 'dist/src/react.d.ts');
    const reactDestPath = join(process.cwd(), 'dist/react.d.ts');
    if (existsSync(reactSrcPath)) {
      let content = readFileSync(reactSrcPath, 'utf-8');
      content = content.replace(/from\s+['"]\.\/aura-cursor['"]/g, "from './aura-cursor'");
      writeFileSync(reactDestPath, content);
    }

    const reactIndexSrcPath = join(process.cwd(), 'dist/src/react-index.d.ts');
    const reactIndexDestPath = join(process.cwd(), 'dist/react-index.d.ts');
    if (existsSync(reactIndexSrcPath)) {
      let content = readFileSync(reactIndexSrcPath, 'utf-8');
      writeFileSync(reactIndexDestPath, content);
    }
  }
});

export default [
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom'],
    output: [
      { file: 'dist/index.esm.js', format: 'es', exports: 'named' },
      { file: 'dist/index.cjs.js', format: 'cjs', exports: 'named' },
      { file: 'dist/index.umd.js', format: 'umd', name: 'AuraCursor', exports: 'named', globals: { react: 'React', 'react-dom': 'ReactDOM' } }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ 
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            declarationDir: 'dist'
          }
        }
      }),
      terser(),
      moveDeclarationFilesPlugin()
    ]
  },
  {
    input: 'src/react-index.ts',
    external: ['react', 'react-dom', 'aura-cursor', './aura-cursor'],
    output: [
      { file: 'dist/react.esm.js', format: 'es', exports: 'named' },
      { file: 'dist/react.cjs.js', format: 'cjs', exports: 'named' }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ 
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            declarationDir: 'dist'
          }
        }
      }),
      rewriteImportPlugin(),
      terser(),
      moveDeclarationFilesPlugin()
    ]
  }
];
