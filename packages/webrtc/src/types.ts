export type PeerId = string;

export type Message =
  | { type: 'ping'; from: PeerId; timestamp: number }
  | { type: 'pong'; from: PeerId; timestamp: number };

export interface PeerInfo {
  id: PeerId;
  connected: boolean;
  lastPing?: number;
}
