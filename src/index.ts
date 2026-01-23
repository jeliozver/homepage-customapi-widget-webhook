export interface IServerError {
  400?: { message: string };
  401?: { message: string };
  403?: { message: string };
  404?: { message: string };
  500?: { message: string };
}

export interface IReplyFail2Ban extends IServerError {
  200: {
    total: number;
    failed: number;
    banned: number;
  }
}

export interface IReplyWireGuard extends IServerError {
  200: {
    connected: number;
    enabled: number;
    disabled: number;
    total: number;
  }
}

export interface IReplyWatchYourLan extends IServerError {
  200: {
    known: number;
    offline: number;
    online: number;
    total: number;
    unknown: number;
  }
}

export interface IReplyGoAccess extends IServerError {
  200: {
    total_requests: number;
    valid_requests: number;
    failed_requests: number;
    unique_visitors: number;
    unique_referrers: number;
    bandwidth: number;
  }
}

export interface IReplyCrossSeed extends IServerError {
  200: {
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
}

export interface IBodyCrossSeed {
  username: string;
  password: string;
  url: string;
}

export interface IReplyRestic extends IServerError {
  200: {
    total_snapshots: number;
    total_size: number;
  }
}

export interface IReplyDockhand extends IServerError {
  200: {
    id: number;
    name: string;
    host: string;
    port: number;
    icon: string;
    socketPath: string;
    collectActivity: boolean;
    collectMetrics: boolean;
    scannerEnabled: boolean | null;
    updateCheckEnabled: boolean;
    updateCheckAutoUpdate: boolean;
    labels: string[];
    connectionType: string;
    online: boolean;
    containers: {
      total: number;
      running: number;
      stopped: number;
      paused: number;
      restarting: number;
      unhealthy: number;
      pendingUpdates: number;
    };
    images: {
      total: number;
      totalSize: number;
    };
    volumes: {
      total: number;
      totalSize: number;
    };
    containersSize: number;
    buildCacheSize: number;
    networks: {
      total: number;
    };
    stacks: {
      total: number;
      running: number;
      partial: number;
      stopped: number;
    };
    metrics: {
      cpuPercent: number;
      memoryPercent: number;
      memoryUsed: number;
      memoryTotal: number;
    };
    events: {
      total: number;
      today: number;
    };
    topContainers: unknown[];
  }
}

export interface IBodyDockhand {
  username: string;
  password: string;
  url: string;
  env: number;
}