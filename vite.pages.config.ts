import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  base: './',
  plugins: [react()],
  css: {postcss:{plugins:[tailwindcss()]}},
  resolve: {alias:[
    {find:'@/lib/board-client',replacement:fileURLToPath(new URL('./lib/board-client.pages.ts',import.meta.url))},
    {find:'@',replacement:fileURLToPath(new URL('./',import.meta.url))},
  ]},
  build: {outDir:'dist-pages'},
});
