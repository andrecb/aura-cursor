import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

export default {
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
    typescript({ useTsconfigDeclarationDir: true }),
    terser()
  ]
};
