export interface ServerStatus {
  name: string;
  platform: string;
  version: string;
  onlineClients: number;
  maxClients: number;
  uptime: number;
  channelsOnline: number;
  ping: number;
}

export interface ConnectedClient {
  clid: string;
  databaseId: string;
  nickname: string;
  channelId: string;
  channelName: string;
  connectionTime: number;
  idleTime: number;
  ip: string;
  uniqueIdentifier: string;
  serverGroups: string[];
  country: string;
  platform: string;
}

export interface Channel {
  cid: string;
  name: string;
  parentId: string;
  order: string;
  totalClients: number;
  neededSubscribePower: number;
  codec: number;
  codecQuality: number;
  permanent: boolean;
  semiPermanent: boolean;
  default: boolean;
}

export interface ServerLog {
  timestamp: string;
  level: number;
  message: string;
}

export interface BanEntry {
  banId: string;
  ip: string;
  uid: string;
  name: string;
  reason: string;
  created: number;
  duration: number;
  invokerName: string;
}

export interface ServerGroup {
  sgid: string;
  name: string;
  type: number;
  iconId: number;
  memberCount: number;
}

export interface GroupPermission {
  permname: string;
  permvalue: number;
  permnegated: boolean;
  permskip: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
}
