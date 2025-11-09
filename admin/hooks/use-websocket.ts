import { useCallback, useEffect, useRef, useState } from "react";

// /Users/ritesh/Desktop/1111/admin/hooks/use-websocket.ts

export type ReadyState = typeof WebSocket.OPEN | typeof WebSocket.CONNECTING | typeof WebSocket.CLOSING | typeof WebSocket.CLOSED;

export interface UseWebsocketOptions {
    protocols?: string | string[];
    autoConnect?: boolean; // connect immediately
    reconnect?: boolean; // automatically reconnect
    maxReconnectAttempts?: number; // -1 for unlimited
    reconnectInterval?: number; // base ms
    reconnectDecay?: number; // multiplier
    maxReconnectInterval?: number; // cap ms
    heartbeatInterval?: number; // ms, 0 to disable
    heartbeatMessage?: string; // message to send for heartbeat
    onOpen?: (ev: Event) => void;
    onClose?: (ev: CloseEvent) => void;
    onMessage?: (ev: MessageEvent) => void;
    onError?: (ev: Event) => void;
}

const defaultOptions: Required<UseWebsocketOptions> = {
    protocols: undefined as any,
    autoConnect: true,
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectInterval: 1000,
    reconnectDecay: 1.5,
    maxReconnectInterval: 30000,
    heartbeatInterval: 0,
    heartbeatMessage: "ping",
    onOpen: () => {},
    onClose: () => {},
    onMessage: () => {},
    onError: () => {},
};

export default function useWebsocket(url: string | (() => string), opts?: UseWebsocketOptions) {
    const options = { ...defaultOptions, ...(opts || {}) };

    const wsRef = useRef<WebSocket | null>(null);
    const manuallyClosedRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimerRef = useRef<number | null>(null);
    const heartbeatTimerRef = useRef<number | null>(null);
    const queueRef = useRef<Array<string | ArrayBufferLike | Blob | ArrayBufferView>>([]);

    const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
    const [error, setError] = useState<Event | null>(null);
    const [readyState, setReadyState] = useState<ReadyState>(WebSocket.CLOSED);
    const [reconnectCount, setReconnectCount] = useState(0);

    const getUrl = useCallback(() => (typeof url === "function" ? url() : url), [url]);

    const clearTimers = useCallback(() => {
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (heartbeatTimerRef.current) {
            window.clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
    }, []);

    const flushQueue = useCallback(() => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        while (queueRef.current.length) {
            try {
                ws.send(queueRef.current.shift() as any);
            } catch {
                // if send fails, push back and break
                break;
            }
        }
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (!options.reconnect) return;
        if (options.maxReconnectAttempts >= 0 && reconnectAttemptsRef.current >= options.maxReconnectAttempts) return;

        const base = options.reconnectInterval;
        const decay = options.reconnectDecay;
        const attempt = reconnectAttemptsRef.current;
        let delay = Math.min(base * Math.pow(decay, attempt), options.maxReconnectInterval);

        // small jitter
        delay = delay + Math.floor(Math.random() * 1000);

        reconnectTimerRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            setReconnectCount(reconnectAttemptsRef.current);
            connect();
        }, delay);
    }, [options.reconnect, options.reconnectInterval, options.reconnectDecay, options.maxReconnectInterval, options.maxReconnectAttempts]);

    const startHeartbeat = useCallback(() => {
        if (options.heartbeatInterval > 0 && options.heartbeatMessage) {
            heartbeatTimerRef.current = window.setInterval(() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    try {
                        wsRef.current.send(options.heartbeatMessage);
                    } catch {
                        // ignore
                    }
                }
            }, options.heartbeatInterval);
        }
    }, [options.heartbeatInterval, options.heartbeatMessage]);

    const connect = useCallback(() => {
        clearTimers();
        const address = getUrl();

        try {
            const ws = options.protocols ? new WebSocket(address, options.protocols) : new WebSocket(address);
            wsRef.current = ws;
            manuallyClosedRef.current = false;
            setReadyState(ws.readyState as ReadyState);

            ws.onopen = (ev) => {
                reconnectAttemptsRef.current = 0;
                setReconnectCount(0);
                setReadyState(ws.readyState as ReadyState);
                setError(null);
                flushQueue();
                startHeartbeat();
                options.onOpen(ev);
            };

            ws.onmessage = (ev) => {
                setLastMessage(ev);
                options.onMessage(ev);
            };

            ws.onerror = (ev) => {
                setError(ev);
                options.onError(ev);
            };

            ws.onclose = (ev) => {
                setReadyState(ws.readyState as ReadyState);
                options.onClose(ev);
                clearTimers();

                if (!manuallyClosedRef.current && options.reconnect) {
                    scheduleReconnect();
                }
            };
        } catch (err) {
            setError(err as Event);
            if (options.reconnect) scheduleReconnect();
        }
    }, [clearTimers, getUrl, options, flushQueue, scheduleReconnect, startHeartbeat]);

    const send = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
            return true;
        }
        // queue if not open
        queueRef.current.push(data);
        return false;
    }, []);

    const close = useCallback((code?: number, reason?: string) => {
        manuallyClosedRef.current = true;
        clearTimers();
        if (wsRef.current) {
            try {
                wsRef.current.close(code, reason);
            } catch {
                // ignore
            } finally {
                wsRef.current = null;
                setReadyState(WebSocket.CLOSED);
            }
        }
        queueRef.current = [];
        reconnectAttemptsRef.current = 0;
        setReconnectCount(0);
    }, [clearTimers]);

    useEffect(() => {
        if (options.autoConnect) connect();
        return () => {
            manuallyClosedRef.current = true;
            clearTimers();
            if (wsRef.current) {
                try {
                    wsRef.current.close();
                } catch {}
                wsRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once

    return {
        connect,
        send,
        close,
        lastMessage,
        error,
        readyState,
        isConnected: readyState === WebSocket.OPEN,
        reconnectCount,
    };
}