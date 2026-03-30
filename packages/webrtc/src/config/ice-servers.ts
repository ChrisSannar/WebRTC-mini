export interface IceServerConfig {
  getIceServers(): RTCIceServer[];
}

export const defaultIceServers: IceServerConfig = {
  getIceServers(): RTCIceServer[] {
    return [{ urls: 'stun:stun.l.google.com:19302' }];
  },
};
