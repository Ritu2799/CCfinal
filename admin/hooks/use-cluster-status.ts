import { useState, useEffect, useCallback } from 'react';
import useWebsocket from './use-websocket';
import type { ClusterStatus, WebSocketMessage } from '../types/cluster-status';

export interface UseClusterStatusOptions {
    autoConnect?: boolean;
    onError?: (error: string) => void;
}

const defaultOptions: Required<UseClusterStatusOptions> = {
    autoConnect: true,
    onError: () => {},
};

export default function useClusterStatus(
    wsUrl: string = 'ws://localhost:8080',
    opts?: UseClusterStatusOptions
) {
    const options = { ...defaultOptions, ...(opts || {}) };
    const [clusterStatus, setClusterStatus] = useState<ClusterStatus | null>(null);

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            
            if (message.type === 'cluster-status') {
                setClusterStatus(message.data);
            } else if (message.type === 'error') {
                options.onError(message.data);
            }
        } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
        }
    }, [options]);

    const {
        connect,
        close,
        readyState,
        error,
        isConnected,
        reconnectCount
    } = useWebsocket(wsUrl, {
        autoConnect: options.autoConnect,
        reconnect: true,
        reconnectInterval: 2000,
        maxReconnectAttempts: -1,
        onMessage: handleMessage,
        onError: (ev) => {
            console.error('WebSocket error:', ev);
            options.onError('Failed to connect to cluster status service');
        }
    });

    // Clean up on unmount
    useEffect(() => {
        return () => {
            close();
        };
    }, [close]);

    return {
        clusterStatus,
        connect,
        close,
        readyState,
        error,
        isConnected,
        reconnectCount,
    };
}