import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser'//压缩代码
import strip from '@rollup/plugin-strip'; //删除log
import vue from 'rollup-plugin-vue'
import postcss from 'rollup-plugin-postcss'
import RollupClear from 'rollup-plugin-clear'//打包前删除
import cleanup from 'rollup-plugin-cleanup';//删除注释
// import autoprefixer from 'autoprefixer'

export default {
  input: 'src/modules/index.js',
  output: [{
    file: './lib/index.min.js',
    format: 'es',
    plugins: [terser()],
    name: 'vue-reader',
    global: {
      vue: "Vue"
    }
  }],
  plugins: [
    RollupClear({
      targets: ['lib'],
      watch: true,
    }),
    strip({
      labels: ['unittest']
    }),
    resolve(),
    commonjs(),
    vue({
      css: true,
    }),
    babel({
      exclude: '**/node_modules/**',
      babelHelpers: 'bundled'
    }),
    postcss(),
    cleanup()
    // autoprefixer()
  ],
  external: ['vue', 'Epub']
};