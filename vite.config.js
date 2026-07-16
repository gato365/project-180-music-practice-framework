import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages project path:
// https://gato365.github.io/project-180-music-practice-framework/
export default defineConfig({
  plugins: [react()],
  base: '/project-180-music-practice-framework/',
})
