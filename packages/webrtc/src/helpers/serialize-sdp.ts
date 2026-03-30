export function serializeOffer(sessionDescription: RTCSessionDescriptionInit): string {
  return JSON.stringify(sessionDescription);
}

export function deserializeOffer(serialized: string): RTCSessionDescriptionInit {
  return JSON.parse(serialized);
}

export function serializeAnswer(sessionDescription: RTCSessionDescriptionInit): string {
  return JSON.stringify(sessionDescription);
}

export function deserializeAnswer(serialized: string): RTCSessionDescriptionInit {
  return JSON.parse(serialized);
}

export function serializeIceCandidate(candidate: RTCIceCandidateInit): string {
  return JSON.stringify(candidate);
}

export function deserializeIceCandidate(serialized: string): RTCIceCandidateInit {
  return JSON.parse(serialized);
}
