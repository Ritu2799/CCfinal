export interface Pod {
    name: string;
    ready: string;
    status: string;
    restarts: string;
    age: string;
}

export interface Service {
    name: string;
    type: string;
    clusterIP: string;
    externalIP: string;
    ports: string;
    age: string;
}

export interface Deployment {
    name: string;
    ready: string;
    upToDate: string;
    available: string;
    age: string;
}

export interface ReplicaSet {
    name: string;
    desired: string;
    current: string;
    ready: string;
    age: string;
}

export interface HPA {
    name: string;
    reference: string;
    targets: string;
    minPods: string;
    maxPods: string;
    replicas: string;
    age: string;
}

export interface ClusterStatus {
    pods: Pod[];
    services: Service[];
    deployments: Deployment[];
    replicaSets: ReplicaSet[];
    hpa: HPA[];
}

export interface ClusterStatusMessage {
    type: 'cluster-status';
    data: ClusterStatus;
}

export interface ErrorMessage {
    type: 'error';
    data: string;
}

export type WebSocketMessage = ClusterStatusMessage | ErrorMessage;