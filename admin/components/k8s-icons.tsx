"use client"

interface ResourceProps {
  name: string
  [key: string]: any
}

const getStatusColor = (status: string): { gradient: string; bg: string; text: string; badge: string } => {
  const statusMap: Record<string, { gradient: string; bg: string; text: string; badge: string }> = {
    Running: {
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-500/10",
      text: "text-emerald-600",
      badge: "bg-emerald-300",
    },
    Succeeded: {
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-500/10",
      text: "text-emerald-600",
      badge: "bg-emerald-300",
    },
    CrashLoopBackOff: {
      gradient: "from-red-600 to-red-700",
      bg: "bg-red-500/10",
      text: "text-red-600",
      badge: "bg-red-400",
    },
    Failed: {
      gradient: "from-red-600 to-red-700",
      bg: "bg-red-500/10",
      text: "text-red-600",
      badge: "bg-red-400",
    },
    ContainerCreating: {
      gradient: "from-yellow-500 to-orange-600",
      bg: "bg-yellow-500/10",
      text: "text-yellow-600",
      badge: "bg-yellow-300",
    },
    Pending: {
      gradient: "from-slate-500 to-slate-600",
      bg: "bg-slate-500/10",
      text: "text-slate-600",
      badge: "bg-slate-300",
    },
    ImagePullBackOff: {
      gradient: "from-orange-600 to-orange-700",
      bg: "bg-orange-500/10",
      text: "text-orange-600",
      badge: "bg-orange-400",
    },
    CreateContainerConfigError: {
      gradient: "from-red-600 to-red-700",
      bg: "bg-red-500/10",
      text: "text-red-600",
      badge: "bg-red-400",
    },
    Error: {
      gradient: "from-red-600 to-red-700",
      bg: "bg-red-500/10",
      text: "text-red-600",
      badge: "bg-red-400",
    },
  }
  return statusMap[status] || statusMap["Pending"]
}

export function Deployment({ name, ready, upToDate, available, age, onPortForward }: ResourceProps) {
  const [readyCount, totalCount] = ready.split("/").map(Number)
  const isReady = readyCount === totalCount

  return (
    <div className="group">
      <div
        className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 w-max`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">⚙</span>
          </div>
          <span className="text-xs font-semibold">{name}</span>
        </div>
        <div className="text-xs mt-1 opacity-90">{ready}</div>
      </div>
      <div className="hidden group-hover:block absolute bg-popover text-popover-foreground text-xs rounded p-3 mt-1 w-56 z-50 shadow-lg border border-border">
        <p className="font-semibold text-foreground mb-2">{name}</p>
        <div className="space-y-1 text-muted-foreground">
          <p>
            Ready: <span className="text-foreground">{ready}</span>
          </p>
          <p>
            Up to Date: <span className="text-foreground">{upToDate || "N/A"}</span>
          </p>
          <p>
            Available: <span className="text-foreground">{available || "N/A"}</span>
          </p>
          <p>
            Age: <span className="text-foreground">{age || "N/A"}</span>
          </p>
          <p>
            Type: <span className="text-foreground">Deployment</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export function Service({ name, type, clusterIP, ports, externalIP, onPortForward }: ResourceProps) {
  const typeColors: Record<string, string> = {
    LoadBalancer: "from-purple-500 to-purple-600",
    ClusterIP: "from-green-500 to-green-600",
    NodePort: "from-orange-500 to-orange-600",
  }

  return (
    <div className="group">
      <div
        className={`bg-gradient-to-br ${typeColors[type] || "from-gray-500 to-gray-600"} text-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 w-max`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">◈</span>
          </div>
          <span className="text-xs font-semibold">{name}</span>
        </div>
        <div className="text-xs mt-1 opacity-90">{type}</div>
      </div>
      <div className="hidden group-hover:block absolute bg-popover text-popover-foreground text-xs rounded p-3 mt-1 w-72 z-50 shadow-lg border border-border space-y-3">
        <div>
          <p className="font-semibold text-foreground mb-1">{name}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>
              Type: <span className="text-foreground">{type}</span>
            </p>
            <p>
              Cluster IP: <span className="font-mono text-foreground">{clusterIP || "N/A"}</span>
            </p>
            <p>
              Ports: <span className="font-mono text-foreground">{ports || "N/A"}</span>
            </p>
            {externalIP && externalIP !== "pending" && (
              <p>
                External IP: <span className="font-mono text-green-500">{externalIP}</span>
              </p>
            )}
            {externalIP === "pending" && (
              <p>
                External IP: <span className="text-yellow-500">Pending</span>
              </p>
            )}
          </div>
        </div>
        {onPortForward && (
          <button
            onClick={() => onPortForward({ name, type, clusterIP, ports, externalIP })}
            className="w-full px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors text-xs font-medium"
          >
            ↔ Port Forward
          </button>
        )}
      </div>
    </div>
  )
}

export function Pod({ name, status, ready, restarts, age, onPortForward }: ResourceProps) {
  const statusColors = getStatusColor(status)
  const isHealthy = status === "Running" || status === "Succeeded"

  return (
    <div className="group">
      <div
        className={`bg-gradient-to-br ${statusColors.gradient} text-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 w-max`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColors.badge} ${isHealthy ? "animate-pulse" : ""}`} />
          <span className="text-xs font-semibold truncate max-w-[100px]">{name.split("-")[0]}</span>
        </div>
      </div>
      <div className="hidden group-hover:block absolute bg-popover text-popover-foreground text-xs rounded p-3 mt-1 w-72 z-50 shadow-lg border border-border space-y-2">
        <p className="font-semibold text-foreground truncate mb-2">{name}</p>
        <div className="space-y-1">
          <div className={`px-2 py-1 rounded font-mono text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}>
            Status: {status}
          </div>
          <div className="text-muted-foreground space-y-1">
            <p>
              Ready: <span className="text-foreground">{ready || "N/A"}</span>
            </p>
            <p>
              Restarts:{" "}
              <span className={restarts > 2 ? "text-red-500 font-semibold" : "text-foreground"}>{restarts || 0}</span>
            </p>
            <p>
              Age: <span className="text-foreground">{age || "N/A"}</span>
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-border text-muted-foreground text-xs">
          {status === "CrashLoopBackOff" && (
            <p className="text-red-500">Pod is crashing repeatedly. Check logs for errors.</p>
          )}
          {status === "ContainerCreating" && (
            <p className="text-yellow-600">Container image is being pulled and started.</p>
          )}
          {status === "Pending" && <p className="text-slate-600">Waiting for resources or image pull to complete.</p>}
          {status === "ImagePullBackOff" && (
            <p className="text-orange-600">Failed to pull container image. Check image name and credentials.</p>
          )}
          {status === "Running" && <p className="text-emerald-600">Pod is running and ready to serve traffic.</p>}
        </div>
      </div>
    </div>
  )
}
