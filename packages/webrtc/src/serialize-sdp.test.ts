import { describe, it, expect } from 'vitest';
import {
  serializeOffer,
  deserializeOffer,
  serializeAnswer,
  deserializeAnswer,
  serializeIceCandidate,
  deserializeIceCandidate,
} from './helpers/serialize-sdp.js';

describe('serialize-sdp', () => {
  describe('serializeOffer', () => {
    it('should serialize an offer', () => {
      const offer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'v=0\r\n' };
      const serialized = serializeOffer(offer);
      expect(serialized).toBe(JSON.stringify(offer));
    });
  });

  describe('deserializeOffer', () => {
    it('should deserialize an offer', () => {
      const offer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'v=0\r\n' };
      const serialized = JSON.stringify(offer);
      const deserialized = deserializeOffer(serialized);
      expect(deserialized).toEqual(offer);
    });
  });

  describe('serializeAnswer', () => {
    it('should serialize an answer', () => {
      const answer: RTCSessionDescriptionInit = { type: 'answer', sdp: 'v=0\r\n' };
      const serialized = serializeAnswer(answer);
      expect(serialized).toBe(JSON.stringify(answer));
    });
  });

  describe('deserializeAnswer', () => {
    it('should deserialize an answer', () => {
      const answer: RTCSessionDescriptionInit = { type: 'answer', sdp: 'v=0\r\n' };
      const serialized = JSON.stringify(answer);
      const deserialized = deserializeAnswer(serialized);
      expect(deserialized).toEqual(answer);
    });
  });

  describe('serializeIceCandidate', () => {
    it('should serialize an ICE candidate', () => {
      const candidate = { candidate: 'candidate:1 1 UDP 2130379007 192.168.1.1 12345 typ host', sdpMid: 'data', sdpMLineIndex: 0 };
      const serialized = serializeIceCandidate(candidate);
      expect(serialized).toBe(JSON.stringify(candidate));
    });
  });

  describe('deserializeIceCandidate', () => {
    it('should deserialize an ICE candidate', () => {
      const candidate = { candidate: 'candidate:1 1 UDP 2130379007 192.168.1.1 12345 typ host', sdpMid: 'data', sdpMLineIndex: 0 };
      const serialized = JSON.stringify(candidate);
      const deserialized = deserializeIceCandidate(serialized);
      expect(deserialized).toEqual(candidate);
    });
  });
});
