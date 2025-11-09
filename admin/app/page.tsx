"use client"

import { useState, useCallback } from "react"
import { KubernetesVisualization } from "@/components/kubernetes-visualization"
import { DataStreamPanel } from "@/components/data-stream-panel"
import useClusterStatus from "@/hooks/use-cluster-status"
import { Card } from "@/components/ui/card"
import type { ClusterStatus } from "@/types/cluster-status"

const DEMO_DATA: ClusterStatus = {
  pods: [
    { name: "orders-7697b6b748-6b4b8", status: "Running", ready: "1/1", restarts: "0", age: "21m" },
    { name: "orders-7697b6b748-zxrmq", status: "Running", ready: "1/1", restarts: "0", age: "21m" },
    { name: "postgres-77b77ffdf5-lw5f5", status: "Running", ready: "1/1", restarts: "0", age: "23m" },
    { name: "redis-5c54dd6c44-kp9mb", status: "Running", ready: "1/1", restarts: "0", age: "23m" },
  ],
  services: [
    { name: "kubernetes", type: "ClusterIP", clusterIP: "10.96.0.1", externalIP: "", ports: "443/TCP", age: "23m" },
    {
      name: "orders",
      type: "LoadBalancer",
      clusterIP: "10.96.152.23",
      externalIP: "pending",
      ports: "4001:31001/TCP",
      age: "21m"
    },
    { name: "postgres", type: "ClusterIP", clusterIP: "10.96.250.136", externalIP: "", ports: "5432/TCP", age: "23m" },
    { name: "redis", type: "ClusterIP", clusterIP: "10.96.171.97", externalIP: "", ports: "6379/TCP", age: "23m" },
  ],
  deployments: [
    { name: "orders", ready: "2/2", upToDate: "2", available: "2", age: "21m" },
    { name: "postgres", ready: "1/1", upToDate: "1", available: "1", age: "23m" },
    { name: "redis", ready: "1/1", upToDate: "1", available: "1", age: "23m" },
  ],
  replicaSets: [],
  hpa: []
};

export default function Home() {
  const [useDemoData, setUseDemoData] = useState(true);
  
  // Only connect to WebSocket when not in demo mode
  const {
    clusterStatus,
    isConnected,
    error,
    connect,
    close
  } = useClusterStatus(
    'ws://localhost:8080',
    {
      autoConnect: !useDemoData,
      onError: () => setUseDemoData(true)
    }
  );

  const handleConnect = useCallback(() => {
    setUseDemoData(false);
    connect();
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    setUseDemoData(true);
    close();
  }, [close]);

  // Use either live cluster status or demo data
  const currentData = useDemoData ? DEMO_DATA : clusterStatus;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Kubernetes Cluster Visualizer</h1>
          <p className="text-muted-foreground">
            Real-time dynamic visualization of your K8s cluster with live data streaming
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${
              error ? "bg-red-500" :
              isConnected ? "bg-green-500" :
              "bg-orange-500"
            }`} />
            <span className="text-sm text-muted-foreground">
              {error ? "Connection Error" :
               isConnected ? "Connected to WebSocket" :
               useDemoData ? 'Using demo data (Click "Connect Stream" to enable real-time)' :
               'Connecting...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main visualization */}
          <div className="lg:col-span-3">
            <Card className="p-6 bg-card border-border shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Cluster Architecture</h2>
              {currentData && <KubernetesVisualization />}
            </Card>
          </div>

          {/* Data stream panel */}
          <div className="lg:col-span-1">
            <DataStreamPanel
              clusterData={currentData}
              isConnected={isConnected && !useDemoData}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
