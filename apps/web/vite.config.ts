import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: __dirname,
  envDir: path.resolve(__dirname, '../..'),
  plugins: [react()],
  resolve: {
    alias: {
      '@convex': path.resolve(__dirname, '../../packages/shared/convex'),
    },
  },
  css: {
    postcss: __dirname,
  },
})
