import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const base = '/Unlimited-aircraft/';

function copyAndFixRuntimeImages() {
  return {
    name: 'copy-and-fix-runtime-images',
    apply: 'build' as const,
    closeBundle() {
      const root = path.resolve(__dirname, '.');
      const sourceImages = path.join(root, 'src', 'assets', 'images');
      const outputImages = path.join(root, 'dist', 'src', 'assets', 'images');

      // This app uses image paths as runtime strings, so Vite does not bundle them
      // automatically. Copy them into the deployed site and account for Pages' subpath.
      if (fs.existsSync(sourceImages)) {
        fs.mkdirSync(path.dirname(outputImages), { recursive: true });
        fs.cpSync(sourceImages, outputImages, { recursive: true });
      }

      const outputRoot = path.join(root, 'dist');
      const visit = (directory: string) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const filePath = path.join(directory, entry.name);
          if (entry.isDirectory()) {
            visit(filePath);
          } else if (/\\.(?:js|css|html|json)$/i.test(entry.name)) {
            const original = fs.readFileSync(filePath, 'utf8');
            const fixed = original.replaceAll('/src/assets/images/', `${base}src/assets/images/`);
            if (fixed !== original) fs.writeFileSync(filePath, fixed);
          }
        }
      };
      if (fs.existsSync(outputRoot)) visit(outputRoot);
    },
  };
}

export default defineConfig(() => ({
  // GitHub Pages serves this project from /Unlimited-aircraft/
  base,
  plugins: [copyAndFixRuntimeImages(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
