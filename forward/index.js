const WebSocket = require('ws');
const { exec } = require('child_process');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    const parseKubectlOutput = (stdout) => {
        const lines = stdout.trim().split('\n');
        const result = {
            pods: [],
            services: [],
            deployments: [],
            replicaSets: [],
            hpa: []
        };

        let currentSection = '';
        lines.slice(1).forEach(line => {
            if (line.startsWith('pod/')) {
                const [name, ready, status, restarts, age] = line.split(/\s+/);
                result.pods.push({ name: name.replace('pod/', ''), ready, status, restarts, age });
            } else if (line.startsWith('service/')) {
                const [name, type, clusterIP, externalIP, ports, age] = line.split(/\s+/);
                result.services.push({ name: name.replace('service/', ''), type, clusterIP, externalIP, ports, age });
            } else if (line.includes('deployment.apps/')) {
                const [name, ready, upToDate, available, age] = line.split(/\s+/);
                result.deployments.push({ 
                    name: name.replace('deployment.apps/', ''), 
                    ready, 
                    upToDate, 
                    available, 
                    age 
                });
            } else if (line.includes('replicaset.apps/')) {
                const [name, desired, current, ready, age] = line.split(/\s+/);
                result.replicaSets.push({ 
                    name: name.replace('replicaset.apps/', ''), 
                    desired, 
                    current, 
                    ready, 
                    age 
                });
            } else if (line.includes('horizontalpodautoscaler.autoscaling/')) {
                const [name, reference, targets, minPods, maxPods, replicas, age] = line.split(/\s+/);
                result.hpa.push({ 
                    name: name.replace('horizontalpodautoscaler.autoscaling/', ''), 
                    reference, 
                    targets, 
                    minPods, 
                    maxPods, 
                    replicas, 
                    age 
                });
            }
        });

        return result;
    };

    const sendKubectlInfo = () => {
        exec('kubectl get all', (error, stdout, stderr) => {
            if (error) {
                ws.send(JSON.stringify({ type: 'error', data: error.message }));
                return;
            }
            const parsedData = parseKubectlOutput(stdout);
            ws.send(JSON.stringify({ type: 'cluster-status', data: parsedData }));
        });
    };

    sendKubectlInfo();
    const interval = setInterval(sendKubectlInfo, 5000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

console.log('WebSocket server started on port 8080');