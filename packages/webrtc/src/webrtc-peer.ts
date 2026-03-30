import type { PeerId, Message, PeerInfo } from './types.js';
import { defaultIceServers, type IceServerConfig } from './config/index.js';
import { createPeerConnection, serializeOffer, deserializeOffer, serializeAnswer, deserializeAnswer } from './helpers/index.js';

interface PeerState {
  id: PeerId;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  connected: boolean;
  lastPing?: number;
}

export class WebRTCPeer {
  private peers: Map<PeerId, PeerState> = new Map();
  private localId: PeerId;
  private iceServers: IceServerConfig;
  private peerUpdateCallbacks: ((_peers: PeerInfo[]) => void)[] = [];
  private messageCallbacks: ((_peerId: PeerId, _message: Message) => void)[] = [];
  private pendingIceCandidates: Map<PeerId, RTCIceCandidateInit[]> = new Map();

  constructor(iceServers: IceServerConfig = defaultIceServers) {
    this.localId = generatePeerId();
    this.iceServers = iceServers;
  }

  getLocalId(): PeerId {
    return this.localId;
  }

  async createOffer(): Promise<string> {
    const peerId = generatePeerId();
    const pc = this.createPeerConnection(peerId);

    const dataChannel = pc.createDataChannel('data');
    this.setupDataChannel(peerId, dataChannel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return serializeOffer(offer);
  }

  async acceptOffer(offer: string): Promise<string> {
    const peerId = generatePeerId();
    const pc = this.createPeerConnection(peerId);

    pc.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel);
    };

    const offerDesc = deserializeOffer(offer);
    await pc.setRemoteDescription(offerDesc);

    const pendingCandidates = this.pendingIceCandidates.get(peerId) || [];
    for (const candidate of pendingCandidates) {
      await pc.addIceCandidate(candidate);
    }
    this.pendingIceCandidates.delete(peerId);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return serializeAnswer(answer);
  }

  async acceptAnswer(answer: string): Promise<void> {
    const peerState = this.findPendingPeer();
    if (!peerState) {
      throw new Error('No pending peer connection found');
    }

    const answerDesc = deserializeAnswer(answer);
    await peerState.connection.setRemoteDescription(answerDesc);

    const pendingCandidates = this.pendingIceCandidates.get(peerState.id) || [];
    for (const candidate of pendingCandidates) {
      await peerState.connection.addIceCandidate(candidate);
    }
    this.pendingIceCandidates.delete(peerState.id);
  }

  getPeers(): PeerInfo[] {
    const peers: PeerInfo[] = [];
    for (const [id, state] of this.peers) {
      peers.push({
        id,
        connected: state.connected,
        lastPing: state.lastPing,
      });
    }
    return peers;
  }

  send(peerId: PeerId, message: Message): void {
    const state = this.peers.get(peerId);
    if (!state || !state.connected) {
      throw new Error('Peer not connected');
    }
    state.dataChannel.send(JSON.stringify(message));
  }

  onPeerUpdate(cb: (_peers: PeerInfo[]) => void): void {
    this.peerUpdateCallbacks.push(cb);
  }

  onMessage(cb: (_peerId: PeerId, _message: Message) => void): void {
    this.messageCallbacks.push(cb);
  }

  private createPeerConnection(peerId: PeerId): RTCPeerConnection {
    const pc = createPeerConnection({
      iceServersConfig: this.iceServers,
      onIceCandidate: (candidate) => {
        console.warn('ICE candidate for', peerId, candidate);
      },
      onConnectionStateChange: (state) => {
        this.handleConnectionStateChange(peerId, state);
      },
    });

    const state: PeerState = {
      id: peerId,
      connection: pc,
      dataChannel: null as unknown as RTCDataChannel,
      connected: false,
    };

    this.peers.set(peerId, state);
    return pc;
  }

  private setupDataChannel(peerId: PeerId, channel: RTCDataChannel): void {
    const state = this.peers.get(peerId);
    if (!state) return;

    state.dataChannel = channel;

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as Message;
        this.handleMessage(peerId, message);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    channel.onopen = () => {
      state.connected = true;
      this.notifyPeerUpdate();
    };

    channel.onclose = () => {
      state.connected = false;
      this.notifyPeerUpdate();
    };
  }

  private handleConnectionStateChange(peerId: PeerId, state: RTCPeerConnectionState): void {
    const peerState = this.peers.get(peerId);
    if (!peerState) return;

    if (state === 'connected') {
      peerState.connected = true;
    } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      peerState.connected = false;
    }

    this.notifyPeerUpdate();
  }

  private handleMessage(peerId: PeerId, message: Message): void {
    if (message.type === 'ping') {
      const peerState = this.peers.get(peerId);
      if (peerState) {
        peerState.lastPing = message.timestamp;
        this.notifyPeerUpdate();
      }
    }

    for (const cb of this.messageCallbacks) {
      cb(peerId, message);
    }
  }

  private notifyPeerUpdate(): void {
    const peers = this.getPeers();
    for (const cb of this.peerUpdateCallbacks) {
      cb(peers);
    }
  }

  private findPendingPeer(): PeerState | undefined {
    for (const state of this.peers.values()) {
      if (!state.connected && state.dataChannel) {
        return state;
      }
    }
    return undefined;
  }
}

function generatePeerId(): PeerId {
  return crypto.randomUUID();
}
