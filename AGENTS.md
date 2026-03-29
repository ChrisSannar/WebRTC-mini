# WebRTC-mini Agent Guidelines

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Watch mode |
| `npm run start` | Serve web app |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code |
| `npm run test` | Test watch mode |
| `npm run test:run` | Run all tests once |
| `npx vitest run <file>` | Run single test file |

## Code Style

- TypeScript only, ES modules, `strict: true`
- No `any` - use `unknown` if needed
- 100 char line width, single quotes, semicolons, trailing commas, 2 space indent
- Run `npm run format` before committing

### Naming
- Files: kebab-case (`service-worker.ts`)
- Classes: PascalCase (`WebRTCPeer`)
- Functions: camelCase, verb-prefixed (`createOffer`)
- Constants: SCREAMING_SNAKE_CASE

### Imports
Order: external libs → internal packages → relative paths.
```ts
import { describe, it, expect } from 'vitest';
import { WebRTCPeer } from '@webrtc-mini/webrtc';
import { manifest } from './manifest';
```

### Types
Explicit return types on public functions, infer for locals.
```ts
function createOffer(): Promise<string> { return peer.createOffer(); }
function handleMessage(data: unknown): void { const msg = data as Message; }
```

### Error Handling
Use try/catch for async ops, log with context, propagate when caller handles.
```ts
try {
  await peer.acceptAnswer(answer);
} catch (err) {
  console.error('Failed to accept answer:', err);
  throw new Error('Invalid answer token');
}
```

### Testing
- Files: `*.test.ts` or `*.spec.ts` next to source
- Use Vitest, one describe per function/module

### Function Design
- Heavily divide code into small, single-purpose functions
- Each function should do one thing well
- Keep functions minimal (under ~30 lines)
- Every function must have an appropriate testing suite

### Bug Prevention
- Any bug or problem encountered must have a test written to ensure it doesn't repeat
- Run existing tests before committing to verify no regressions

### Demo App
- Single demo file: `apps/example/index.html`
- Minimal, self-contained, no build step required

### Additional Best Practices
- Single Responsibility Principle: one function = one task
- No global state - use dependency injection
- Pure functions where possible
- Explicit return types on all public functions
- Keep modules small and focused

## Project Structure

```
/apps/example    -> Demo app (single index.html)
/packages/webrtc -> reusable WebRTC module
/packages/pwa    -> service worker + manifest
```

---

# WebRTC-mini Project Spec (Reference)

## Goal
Minimal P2P connection system using WebRTC (no backend, manual signaling).

## Architecture
- `packages/webrtc`: WebRTCPeer class with createOffer, acceptOffer, acceptAnswer, send, getPeers
- `packages/pwa`: manifest.json + service-worker.ts
- `apps/example`: Single demo HTML file

## Public API (packages/webrtc)

```ts
export type PeerId = string;
export type Message = { type: 'ping' | 'pong'; from: PeerId; timestamp: number };
export interface PeerInfo { id: PeerId; connected: boolean; lastPing?: number; }

export class WebRTCPeer {
  createOffer(): Promise<string>;
  acceptOffer(offer: string): Promise<string>;
  acceptAnswer(answer: string): Promise<void>;
  getPeers(): PeerInfo[];
  send(peerId: PeerId, message: Message): void;
  onPeerUpdate(cb: (peers: PeerInfo[]) => void): void;
  onMessage(cb: (peerId: PeerId, message: Message) => void): void;
}
```

## UI Sections
1. Local token (textarea + Generate Offer button)
2. Remote token input (textarea + Connect button)
3. Online/Offline status
4. Peer list (id, status, last ping, Ping button)

## Signaling Flow
1. Device A: Generate Offer → copy token
2. Device B: Paste offer → generate answer → copy answer
3. Device A: Paste answer → connection established
