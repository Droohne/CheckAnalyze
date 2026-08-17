kubectl apply -f postgres_statefull_set.yaml
kubectl apply -f client_deployment.yaml
kubectl apply -f api_deployment.yaml
kubectl apply -f ingress.yaml