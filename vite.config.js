import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Set base to './' for Vercel/GitHub Pages compatibility
  // This helps ensure all paths are treated as relative.
  base: './', 
});