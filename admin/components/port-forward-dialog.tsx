"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

interface PortForwardDialogProps {
  service: any
  isOpen: boolean
  onClose: () => void
}

export function PortForwardDialog({ service, isOpen, onClose }: PortForwardDialogProps) {
  const [localPort, setLocalPort] = useState("8080")
  const [remotePort, setRemotePort] = useState("80")
  const [isForwarding, setIsForwarding] = useState(false)
  const [forwardedPorts, setForwardedPorts] = useState<string[]>([])

  const handlePortForward = async () => {
    setIsForwarding(true)
    const command = `kubectl port-forward svc/${service.name} ${localPort}:${remotePort}`

    // Simulate port forwarding
    const forwardId = `${service.name}-${localPort}-${remotePort}`
    setForwardedPorts([...forwardedPorts, forwardId])

    // Show success message
    setTimeout(() => {
      setIsForwarding(false)
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-card border-border w-96 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Port Forward: {service.name}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Service Details */}
            <div className="bg-muted/50 rounded p-3 space-y-2">
              <div className="text-xs">
                <span className="font-semibold text-foreground">Type: </span>
                <span className="text-muted-foreground">{service.type}</span>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground">Cluster IP: </span>
                <span className="font-mono text-muted-foreground">{service.clusterIP}</span>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground">Ports: </span>
                <span className="font-mono text-muted-foreground">{service.ports}</span>
              </div>
              {service.externalIP && service.externalIP !== "pending" && (
                <div className="text-xs">
                  <span className="font-semibold text-foreground">External IP: </span>
                  <span className="font-mono text-green-600">{service.externalIP}</span>
                </div>
              )}
            </div>

            {/* Port Configuration */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">Local Port</label>
                <input
                  type="number"
                  value={localPort}
                  onChange={(e) => setLocalPort(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="8080"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">Remote Port</label>
                <input
                  type="number"
                  value={remotePort}
                  onChange={(e) => setRemotePort(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="80"
                />
              </div>
            </div>

            {/* Command Display */}
            <div className="bg-background rounded p-3 border border-border">
              <p className="text-xs font-mono text-muted-foreground break-all">
                kubectl port-forward svc/{service.name} {localPort}:{remotePort}
              </p>
            </div>

            {/* Forwarded Ports List */}
            {forwardedPorts.length > 0 && (
              <div className="bg-muted/50 rounded p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Active Forwards</p>
                <div className="space-y-1">
                  {forwardedPorts.map((port) => (
                    <div key={port} className="text-xs text-green-600 font-mono flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      localhost:{port.split("-")[1]}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handlePortForward}
                disabled={isForwarding}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isForwarding ? "Forwarding..." : "Start Forwarding"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
