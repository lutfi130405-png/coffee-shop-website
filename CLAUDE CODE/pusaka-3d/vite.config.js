import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: true, // akses dari HP di jaringan yang sama untuk tes 60 FPS
    open: true,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0, // biarkan .glb / video jadi file terpisah, bukan base64
  },
});
