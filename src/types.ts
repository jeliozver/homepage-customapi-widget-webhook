export interface IServerError {
  400?: { message: string };
  401?: { message: string };
  403?: { message: string };
  404?: { message: string };
  500?: { message: string };
}

export interface ISchemaFail2Ban {
  total: number;
  failed: number;
  banned: number;
}

export interface IReplyFail2Ban extends IServerError {
  200: ISchemaFail2Ban;
}

export interface ISchemaWireGuard {
  connected: number;
  enabled: number;
  disabled: number;
  total: number;
}

export interface IReplyWireGuard extends IServerError {
  200: ISchemaWireGuard;
}

export interface ISchemaWatchYourLan {
  known: number;
  offline: number;
  online: number;
  total: number;
  unknown: number;
}

export interface IReplyWatchYourLan extends IServerError {
  200: ISchemaWatchYourLan;
}

export interface ISchemaGoAccess {
  total_requests: number;
  valid_requests: number;
  failed_requests: number;
  unique_visitors: number;
  unique_referrers: number;
  bandwidth: number;
}

export interface IReplyGoAccess extends IServerError {
  200: ISchemaGoAccess;
}

export interface ISchemaCrossSeed {
  totalSearchees: number;
  totalMatches: number;
  totalIndexers: number;
  healthyIndexers: number;
  recentMatches: number;
  matchRate: number;
  matchesPerSnatch: number;
  matchesPerQuery: number;
  matchesPerQueryIndexer: number;
  snatchCount: number;
  queryCount: number;
  queryIndexerCount: number;
  wastedSnatchCount: number;
  wastedSnatchRate: number;
  unhealthyIndexers: number;
  allIndexersHealthy: boolean;
}

export interface IReplyCrossSeed extends IServerError {
  200: ISchemaCrossSeed;
}

export interface IBodyCrossSeed {
  username: string;
  password: string;
  url: string;
}

export interface ISchemaRestic {
  total_snapshots: number;
  total_size: number;
}

export interface IReplyRestic extends IServerError {
  200: ISchemaRestic;
}

export interface IResponseAuthentikUsers {
  pagination: {
    count: number;
  }
}

export interface IResponseAuthentikEventAction {
  time: string;
  action: string;
  count: number;
}

export interface ISchemaAuthentik {
  users: number;
  loginsLast24H: number;
  failedLoginsLast24H: number;
  authorizationsLast24H: number;
}

export interface IReplyAuthentik extends IServerError {
  200: ISchemaAuthentik;
}

export interface IBodyAuthentik {
  url: string;
  key: string;
}