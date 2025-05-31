#!/bin/bash
# Build script for Render deployment
npm install --include=dev
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist