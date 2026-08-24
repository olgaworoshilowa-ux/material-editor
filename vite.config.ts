import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Needed so assets load correctly on GitHub Pages (site lives at /material-editor/)
  base: '/material-editor/',
})
