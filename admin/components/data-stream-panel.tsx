"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

import type { ClusterStatus } from "@/types/cluster-status"

interface DataStreamPanelProps {
  clusterData: ClusterStatus | null
  isConnected: boolean
  onConnect: () => void
  onDisconnect: () => void
}

const getStatusColor = (status: string) => {
  const statusColorMap: Record<string, string> = {
    Running: "text-emerald-600",
    Succeeded: "text-emerald-600",
    CrashLoopBackOff: "text-red-600",
    Failed: "text-red-600",
    ContainerCreating: "text-yellow-600",
    Pending: "text-slate-600",
    ImagePullBackOff: "text-orange-600",
    Error: "text-red-600",
  }
  return statusColorMap[status] || "text-slate-600"
}

const getStatusBgColor = (status: string) => {
  const statusBgMap: Record<string, string> = {
    Running: "bg-emerald-500/10",
    Succeeded: "bg-emerald-500/10",
    CrashLoopBackOff: "bg-red-500/10",
    Failed: "bg-red-500/10",
    ContainerCreating: "bg-yellow-500/10",
    Pending: "bg-slate-500/10",
    ImagePullBackOff: "bg-orange-500/10",
    Error: "bg-red-500/10",
  }
  return statusBgMap[status] || "bg-slate-500/10"
}

const getPodStatistics = (pods: any[]) => {
  const stats = {
    running: 0,
    crashed: 0,
    creating: 0,
    pending: 0,
    failed: 0,
    other: 0,
  }
  pods?.forEach((pod) => {
    if (pod.status === "Running" || pod.status === "Succeeded") stats.running++
    else if (pod.status === "CrashLoopBackOff") stats.crashed++
    else if (pod.status === "ContainerCreating") stats.creating++
    else if (pod.status === "Pending") stats.pending++
    else if (pod.status === "Failed") stats.failed++
    else stats.other++
  })
  return stats
}

export function DataStreamPanel({ clusterData, isConnected, onConnect, onDisconnect }: DataStreamPanelProps) {
  const [showLogs, setShowLogs] = useState(false)
  const [detailedView, setDetailedView] = useState<"pods" | "services" | "deployments">("pods")

  const stats = {
    pods: clusterData?.pods?.length || 0,
    services: clusterData?.services?.length || 0,
    deployments: clusterData?.deployments?.length || 0,
  }

  const podStats = getPodStatistics(clusterData?.pods || [])

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Connection</h3>
        <div className="space-y-2">
          <button
            onClick={isConnected ? onDisconnect : onConnect}
            className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isConnected
                ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
            }`}
          >
            {isConnected ? "Disconnect" : "Connect Stream"}
          </button>
        </div>
      </Card>

      {/* Statistics */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Cluster Stats</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-xs text-muted-foreground">Pods</span>
            <span className="font-semibold text-sm">{stats.pods}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-xs text-muted-foreground">Services</span>
            <span className="font-semibold text-sm">{stats.services}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
            <span className="text-xs text-muted-foreground">Deployments</span>
            <span className="font-semibold text-sm">{stats.deployments}</span>
          </div>
        </div>
      </Card>

      {/* Pod Status Breakdown */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Pod Status Breakdown</h3>
        <div className="space-y-2">
          {podStats.running > 0 && (
            <div className="flex justify-between items-center p-2 bg-emerald-500/10 rounded">
              <span className="text-xs text-emerald-700">Running</span>
              <span className="font-semibold text-sm text-emerald-600">{podStats.running}</span>
            </div>
          )}
          {podStats.crashed > 0 && (
            <div className="flex justify-between items-center p-2 bg-red-500/10 rounded">
              <span className="text-xs text-red-700">Crashed (CrashLoopBackOff)</span>
              <span className="font-semibold text-sm text-red-600">{podStats.crashed}</span>
            </div>
          )}
          {podStats.creating > 0 && (
            <div className="flex justify-between items-center p-2 bg-yellow-500/10 rounded">
              <span className="text-xs text-yellow-700">Creating</span>
              <span className="font-semibold text-sm text-yellow-600">{podStats.creating}</span>
            </div>
          )}
          {podStats.pending > 0 && (
            <div className="flex justify-between items-center p-2 bg-slate-500/10 rounded">
              <span className="text-xs text-slate-700">Pending</span>
              <span className="font-semibold text-sm text-slate-600">{podStats.pending}</span>
            </div>
          )}
          {podStats.failed > 0 && (
            <div className="flex justify-between items-center p-2 bg-red-500/10 rounded">
              <span className="text-xs text-red-700">Failed</span>
              <span className="font-semibold text-sm text-red-600">{podStats.failed}</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Details</h3>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-3 border-b border-border">
          {(["pods", "services", "deployments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailedView(tab)}
              className={`px-3 py-1 text-xs font-medium transition-colors border-b-2 ${
                detailedView === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Resource Details */}
        <div className="text-xs space-y-2 max-h-64 overflow-y-auto">
          {detailedView === "pods" &&
            clusterData?.pods?.map((pod: any) => (
              <div key={pod.name} className={`p-2 rounded border border-border/50 ${getStatusBgColor(pod.status)}`}>
                <p className="font-mono font-semibold text-foreground truncate">{pod.name}</p>
                <div className="mt-1 space-y-0.5">
                  <p>
                    Status: <span className={`font-semibold ${getStatusColor(pod.status)}`}>{pod.status}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Ready: <span className="text-foreground">{pod.ready || "N/A"}</span>
                  </p>
                  <p className={`${pod.restarts > 2 ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                    Restarts: <span className="text-foreground">{pod.restarts || 0}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Age: <span className="text-foreground">{pod.age || "N/A"}</span>
                  </p>
                </div>
              </div>
            ))}

          {detailedView === "services" &&
            clusterData?.services?.map((svc: any) => (
              <div key={svc.name} className="p-2 bg-muted/50 rounded border border-border/50">
                <p className="font-mono font-semibold text-foreground truncate">{svc.name}</p>
                <div className="text-muted-foreground mt-1 space-y-0.5">
                  <p>Type: {svc.type}</p>
                  <p>Cluster IP: {svc.clusterIP || "N/A"}</p>
                  <p>Ports: {svc.ports || "N/A"}</p>
                  {svc.externalIP && svc.externalIP !== "pending" && <p>External: {svc.externalIP}</p>}
                </div>
              </div>
            ))}

          {detailedView === "deployments" &&
            clusterData?.deployments?.map((dep: any) => (
              <div key={dep.name} className="p-2 bg-muted/50 rounded border border-border/50">
                <p className="font-mono font-semibold text-foreground truncate">{dep.name}</p>
                <div className="text-muted-foreground mt-1 space-y-0.5">
                  <p>Ready: {dep.ready || "N/A"}</p>
                  <p>Up to Date: {dep.upToDate || "N/A"}</p>
                  <p>Available: {dep.available || "N/A"}</p>
                  <p>Age: {dep.age || "N/A"}</p>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Stream Instructions */}
      <Card className="p-4 bg-muted/50 border border-border text-xs">
        <p className="font-semibold mb-2 text-foreground">Bash Script:</p>
        <code className="text-muted-foreground block p-2 bg-background rounded font-mono text-xs overflow-x-auto">
          {`while true; do\n  kubectl get all -o json | \\\n  jq '{pods: .items[] | select(.kind=="Pod")}'\n  sleep 2\ndone`}
        </code>
      </Card>
    </div>
  )
}
