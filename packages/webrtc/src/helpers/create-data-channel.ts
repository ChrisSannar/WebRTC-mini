export interface DataChannelOptions {
  peerConnection: RTCPeerConnection;
  label: string;
  onMessage: (_data: string) => void;
  onOpen: () => void;
  onClose: () => void;
}

export function createDataChannel(options: DataChannelOptions): RTCDataChannel {
  const channel = options.peerConnection.createDataChannel(options.label);

  channel.onmessage = (event) => {
    options.onMessage(event.data);
  };

  channel.onopen = () => {
    options.onOpen();
  };

  channel.onclose = () => {
    options.onClose();
  };

  return channel;
}
