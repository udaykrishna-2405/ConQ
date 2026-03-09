/**
 * server.js — Render Production Entry Point
 *
 * This file wraps the ConQ backend for deployment on Render (or any Node host).
 * It runs `tsc` to compile the TypeScript source and then starts the Express server
 * that is defined in src/devServer.ts (compiled to dist/devServer.js).
 *
 * Render build command : npm install
 * Render start command : npm start   →  "node server.js"
 *
 * All routes, middleware, security headers, and business logic live in
 * src/devServer.ts — nothing is duplicated here.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── 1. Compile TypeScript if dist/ is missing or stale ───────────────────────
const distDir = path.join(__dirname, 'dist');
const distEntry = path.join(distDir, 'devServer.js');

if (!fs.existsSync(distEntry)) {
  console.log('📦 Building TypeScript...');
  try {
    execSync('npx tsc --project tsconfig.json', {
      cwd: __dirname,
      stdio: 'inherit',
    });
    console.log('✅ Build complete.');
  } catch (err) {
    console.error('❌ TypeScript build failed:', err.message);
    process.exit(1);
  }
}

// ── 2. Load .env so env vars are available before the server starts ───────────
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (_) {
  // dotenv is optional; Render injects env vars natively
}

// ── 3. Boot the compiled Express server ──────────────────────────────────────
require(distEntry);
