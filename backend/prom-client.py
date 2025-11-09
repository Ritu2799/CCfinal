import os
import time
import threading
import random
from typing import List
from prometheus_client import start_http_server, Gauge

# /Users/ritesh/Desktop/1111/backend/prom-client.py
"""
Prometheus client that exposes a custom metric "instances_needed".
Run this file and visit http://localhost:8000/metrics to see the metric.
"""



# Metric: number of instances needed per service
INSTANCES_NEEDED = Gauge(
    "instances_needed",
    "Number of instances needed for the service",
    ["service"],
)


def update_instances_needed(service: str, needed: int) -> None:
    """
    Set the number of instances needed for a given service.
    """
    INSTANCES_NEEDED.labels(service=service).set(needed)


def compute_needed_instances(service: str) -> int:
    """
    Placeholder function to compute how many instances are needed for a service.
    Replace this with real logic (e.g., based on load, queue length, desired concurrency).
    For demo purposes this returns a pseudo-random value.
    """
    # Example: read from environment override if present
    env_key = f"NEEDED_{service.upper()}"
    if env_key in os.environ:
        try:
            return int(os.environ[env_key])
        except ValueError:
            pass

    # Fallback/demo behavior
    base = {"web": 3, "worker": 2}.get(service, 1)
    jitter = random.randint(-1, 2)
    return max(0, base + jitter)


def metrics_loop(services: List[str], interval: int = 10) -> None:
    """
    Periodically compute and update the instances_needed metric for each service.
    """
    while True:
        for svc in services:
            needed = compute_needed_instances(svc)
            update_instances_needed(svc, needed)
        time.sleep(interval)


def main() -> None:
    port = int(os.environ.get("METRICS_PORT", "8000"))
    services = os.environ.get("SERVICES", "web,worker").split(",")
    start_http_server(port)
    thread = threading.Thread(target=metrics_loop, args=(services,), daemon=True)
    thread.start()

    # Keep main thread alive. In a real app, integrate metrics_loop into your app lifecycle.
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()