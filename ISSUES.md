# Issue: ES Module Loading in Browser

## Problem

The WebRTC module cannot be loaded in the browser via ES modules when served from a static file server (serve).

### Error

```
GET http://localhost:3000/dist/webrtc-peer net::ERR_ABORTED 404 (Not Found)
config:1 Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".
```

### Root Cause

When importing `./dist/index.js`, the browser tries to resolve relative imports inside that file:
- `index.js` imports from `./webrtc-peer.js`
- But the browser requests `/dist/webrtc-peer` (without `.js` extension)

The static file server (`serve`) doesn't recognize this as a JavaScript file and returns 404.

### What We Tried

1. Added `.js` extensions to all imports in source files - didn't fix it
2. Copied dist files to `apps/example/dist/` - still broken

### The Real Issue

The bundler resolution (TypeScript/tsc) outputs files that expect a bundler to resolve imports. When loading directly in the browser without a bundler:

- Browser sees: `import { WebRTCPeer } from './dist/index.js'`
- Browser reads `index.js`, sees: `export { WebRTCPeer } from './webrtc-peer.js'`
- Browser requests: `/dist/webrtc-peer` (not `/dist/webrtc-peer.js`)
- Server returns 404

### Possible Solutions

1. **Use a bundler** (esbuild, rollup, vite) - recommended
2. **Use a simple script to inline/rewrite imports** - complex
3. **Use import maps** - modern, but may have same resolution issues
4. **Single-file output** - concatenate all modules into one file

### Recommended Fix

Add a simple bundler (esbuild) to bundle the webrtc module into a single file that can be loaded in the browser.

Example esbuild config:
```js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['packages/webrtc/src/index.ts'],
  bundle: true,
  outfile: 'apps/example/dist/webrtc.js',
  format: 'esm',
  platform: 'browser',
});
```

Then update index.html to import from `./dist/webrtc.js`.
