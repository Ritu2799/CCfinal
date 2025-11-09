echo "Starting Kubernetes cluster with kind..."
kind create cluster --name dev-cluster

echo "Applying Kubernetes manifests..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl -n kube-system patch deployment metrics-server --type='json' -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

echo "Prometheus setup in progress..."

kubectl apply -f prometheus

kubectl apply -f mongo

kubectl apply -f backend

kubectl apply -f stress-client

echo "Kubernetes cluster started and manifests applied."