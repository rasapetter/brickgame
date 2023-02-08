'use strict';
import { build } from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';

build({
  entryPoints: [
    'src/js/app.js',
    'src/css/style.scss',
  ],
  bundle: true,
  outdir: 'dist',
  plugins: [
    sassPlugin(),
  ],
}).catch(() => process.exit(1));
