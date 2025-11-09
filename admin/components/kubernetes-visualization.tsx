"use client"

import { useRef, useState } from "react"
import { Pod, Service, Deployment } from "@/components/k8s-icons"
import { PortForwardDialog } from "./port-forward-dialog"
import useClusterStatus from "../hooks/use-cluster-status"
import { Badge } from "./ui/badge"

// Remove props since we'll use the hook
interface KubernetesVisualizationProps {}

export function KubernetesVisualization({}: KubernetesVisualizationProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showPortForwardDialog, setShowPortForwardDialog] = useState(false)
  
  const { 
    clusterStatus: data,
    isConnected,
    reconnectCount,
    error 
  } = useClusterStatus()

  // Define positions for different resource types
  const positions = {
    deployments: [
      { x: 100, y: 80 },
      { x: 300, y: 80 },
      { x: 500, y: 80 },
    ],
    services: [
      { x: 100, y: 250 },
      { x: 300, y: 250 },
      { x: 500, y: 250 },
    ],
    pods: [
      { x: 50, y: 380 },
      { x: 150, y: 380 },
      { x: 250, y: 380 },
      { x: 350, y: 380 },
    ],
  }

  const handlePortForward = (service: any) => {
    setSelectedService(service)
    setShowPortForwardDialog(true)
  }

  if (!data) {
    return (
      <div className="relative bg-muted/50 rounded-lg border border-border overflow-hidden flex items-center justify-center" style={{ height: "500px" }}>
        <div className="text-center">
          <div className="mb-2">{error ? '❌ Connection Error' : '🔄 Connecting to cluster...'}</div>
          {reconnectCount > 0 && <div className="text-sm text-muted-foreground">Attempt {reconnectCount}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-muted/50 rounded-lg border border-border overflow-hidden" style={{ height: "500px" }}>
      <div className="absolute top-2 right-2 z-10">
        <div className={`px-2 py-1 rounded-full text-xs ${
          error ? 'bg-red-100 text-red-800' :
          isConnected ? 'bg-green-100 text-green-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {error ? 'Connection Error' :
           isConnected ? 'Connected' :
           `Connecting${reconnectCount > 0 ? ` (${reconnectCount})` : ''}`}
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        {/* Flow lines connecting resources */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(148, 163, 184, 0.3)" />
          </marker>
        </defs>

        {/* Deployments to Services */}
        {data?.deployments?.map((dep: any, idx: number) => (
          <line
            key={`line-dep-svc-${idx}`}
            x1={positions.deployments[idx]?.x || 0}
            y1={(positions.deployments[idx]?.y || 0) + 60}
            x2={positions.services[idx]?.x || 0}
            y2={positions.services[idx]?.y || 0}
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            strokeDasharray="5,5"
            style={{
              animation: "flow 2s infinite linear",
            }}
          />
        ))}

        {/* Services to Pods */}
        {data?.services?.slice(1).map((svc: any, svcIdx: number) => (
          <g key={`svc-pods-${svcIdx}`}>
            {[0, 1, 2, 3].map((podIdx) => (
              <line
                key={`line-svc-pod-${svcIdx}-${podIdx}`}
                x1={positions.services[svcIdx]?.x || 0}
                y1={(positions.services[svcIdx]?.y || 0) + 30}
                x2={positions.pods[podIdx]?.x || 0}
                y2={positions.pods[podIdx]?.y || 0}
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1"
                opacity={0.5}
              />
            ))}
          </g>
        ))}

        <style>{`
          @keyframes flow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 10; }
          }
          @keyframes pulse {
            0%, 100% { r: 24; }
            50% { r: 28; }
          }
        `}</style>
      </svg>

      {/* Deployments */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="text-xs font-semibold text-muted-foreground absolute left-6 top-0">DEPLOYMENTS</div>
        {data?.deployments?.map((dep: any, idx: number) => (
          <div
            key={`dep-${idx}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
            style={{
              left: `${(positions.deployments[idx]?.x || 0) / 6}%`,
              top: `${(positions.deployments[idx]?.y || 0) / 5}%`,
            }}
          >
            <Deployment {...dep} />
          </div>
        ))}

        {/* Services */}
        <div className="text-xs font-semibold text-muted-foreground absolute left-6 top-1/3">SERVICES</div>
        {data?.services?.map((svc: any, idx: number) => (
          <div
            key={`svc-${idx}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
            style={{
              left: `${(positions.services[idx]?.x || 0) / 6}%`,
              top: `${(positions.services[idx]?.y || 0) / 5}%`,
            }}
          >
            <Service {...svc} onPortForward={handlePortForward} />
          </div>
        ))}

        {/* Pods */}
        <div className="text-xs font-semibold text-muted-foreground absolute left-6 bottom-8">PODS</div>
        {data?.pods?.map((pod: any, idx: number) => (
          <div
            key={`pod-${idx}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
            style={{
              left: `${(positions.pods[idx]?.x || 0) / 6}%`,
              top: `${(positions.pods[idx]?.y || 0) / 5}%`,
            }}
          >
            <Pod {...pod} />
          </div>
        ))}
      </div>

      <PortForwardDialog
        service={selectedService}
        isOpen={showPortForwardDialog}
        onClose={() => setShowPortForwardDialog(false)}
      />
    </div>
  )
}
