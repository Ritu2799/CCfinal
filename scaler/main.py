import time, boto3, requests

ASG_NAME = "k8s-worker-group"
MODEL_URL = "http://ml-api.example.com/predict"

autoscaling = boto3.client("autoscaling")

while True:
    try:
        required = requests.get(MODEL_URL, timeout=5).json()["required_ec2"]
        resp = autoscaling.update_auto_scaling_group(
            AutoScalingGroupName=ASG_NAME,
            MinSize=max(2, required),
            DesiredCapacity=required,
            MaxSize=10
        )
        print(f"Scaled EC2 ASG to {required} instances")
    except Exception as e:
        print("Error:", e)
    time.sleep(60)
