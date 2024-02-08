import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'

// https://cn.vitejs.dev/
export default defineConfig({
  base: '/',
  build: {
    lib: {
      entry: 'index.js', // The entry file for your library
      name: 'VueReader', // The global variable name in UMD builds
      fileName: (format) => `vue-reader-plugin.${format}.js` // The output file name
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue'
        }
      }
    }
  },
  plugins: [
    vue(),
    tsconfigPaths({
      root: __dirname,
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'types/auto-import.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'types/components.d.ts',
    }),
    visualizer() as PluginOption,
  ],
  publicDir: 'public',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: 'comps', replacement: resolve(__dirname, 'src/components') },
    ],
  },
  optimizeDeps: {
    exclude: ['vue-demi'],
  },
  server: {
    port: 8025,
  },
})
