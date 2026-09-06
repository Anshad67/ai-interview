import * as esbuild from 'esbuild-wasm';
import fs from 'fs';
import path from 'path';

async function build() {
  await esbuild.initialize({});

  const result = await esbuild.build({
    entryPoints: ['src/main.jsx'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/assets/app.js',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.css': 'css',
      '.svg': 'dataurl',
      '.png': 'dataurl',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || ''),
    }
  });

  // Ensure dist index.html exists
  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'/><path d='M19 10v2a7 7 0 0 1-14 0v-2'/><line x1='12' x2='12' y1='19' y2='22'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Interview Coach — Intelligent Mock Interview & Evaluation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/app.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              slate: {
                950: '#070b14',
                900: '#0f172a',
                800: '#1e293b',
                700: '#334155',
              }
            }
          }
        }
      }
    </script>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>`;

  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  console.log('✅ esbuild-wasm bundled frontend successfully into dist/assets/app.js (ESM format)!');
}

build().catch(err => {
  console.error('Build error:', err);
  process.exit(1);
});
