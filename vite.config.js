import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Define the root directory relative to the current file
const projectRoot = path.resolve(__dirname, './'); 

export default defineConfig({
  plugins: [react()],
  // 1. Ensures all assets and paths are referenced relatively.
  base: './', 

  // 2. Explicitly define the build settings to locate the input HTML file
  build: {
    rollupOptions: {
      input: {
        // Tells Rollup/Vite that the entry point is the index.html file 
        // located right in the project root.
        main: path.resolve(projectRoot, 'index.html'),
      },
    },
  },
  
  // 3. Define the project root directory
  root: projectRoot,
});