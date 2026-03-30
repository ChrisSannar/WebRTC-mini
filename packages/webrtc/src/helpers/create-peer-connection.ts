import type { IceServerConfig } from '../config/ice-servers';

export interface PeerConnectionOptions {
  iceServersConfig: IceServerConfig;
  onIceCandidate: (_candidate: RTCIceCandidate) => void;
  onConnectionStateChange: (_state: RTCPeerConnectionState) => void;
}

export function createPeerConnection(options: PeerConnectionOptions): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: options.iceServersConfig.getIceServers(),
  });

  pc.onicecandidate = (_event) => {
    if (_event.candidate) {
      options.onIceCandidate(_event.candidate);
    }
  };

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    options.onConnectionStateChange(state);
  };

  return pc;
}
