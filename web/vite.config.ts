import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        {
            name: 'preserve-go-embed-directory',
            generateBundle() {
                this.emitFile({
                    type: 'asset',
                    fileName: 'placeholder.txt',
                    source: 'This directory is used as the embed target for frontend build artifacts.\n' +
                        'Docker builds replace this placeholder with the generated Vite dist files before compiling the Go binary.\n\n',
                });
            },
        },
    ],
    build: {
        outDir: '../internal/app/webdist',
        emptyOutDir: true,
    },
})
