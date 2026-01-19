import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        electron({
            main: {
                entry: 'src/main/index.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron', 'path', 'fs', 'node:path', 'node:fs', 'node-pty', 'ssh2', 'keytar', 'electron-store'],
                            input: {
                                index: path.resolve(__dirname, 'src/main/index.ts'),
                                worker: path.resolve(__dirname, 'src/worker/index.ts'),
                                preload: path.resolve(__dirname, 'src/preload/index.ts')
                            },
                            output: {
                                entryFileNames: '[name].js'
                            }
                        }
                    },
                },
            },
            preload: {
                // Shortcut of `build.lib.entry`.
                input: 'src/preload/index.ts',
            },

            // Ployfill the Electron and Node.js built-in modules for Renderer process.
            // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
            renderer: {},
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
})
