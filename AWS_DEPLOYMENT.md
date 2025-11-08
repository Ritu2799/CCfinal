# AWS Deployment Guide - Step by Step

Complete guide to deploy the AI Predictive Autoscaling System on AWS.

> **👋 New to AWS?** Check out **[AWS_DEPLOYMENT_BEGINNER.md](./AWS_DEPLOYMENT_BEGINNER.md)** for a complete beginner-friendly guide with detailed step-by-step instructions!

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Domain name (optional, but recommended)
- MongoDB Atlas account (or AWS DocumentDB)
- Basic knowledge of AWS services

## 🏗️ Architecture Overview

- **Backend**: EC2 Instance or ECS Fargate
- **Frontend**: S3 + CloudFront
- **Database**: MongoDB Atlas (recommended) or AWS DocumentDB
- **Auto-scaling**: AWS Auto Scaling Groups
- **Load Balancer**: Application Load Balancer (optional)
- **Notifications**: AWS SNS (Simple Notification Service) for SMS/Email alerts

---

## Part 1: MongoDB Setup (Database)

### Option A: MongoDB Atlas (Recommended - Free Tier Available)

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account
   - Create a new cluster (Free tier: M0)

2. **Configure Database Access**
   - Go to **Database Access** → **Add New Database User**
   - Create user with username and password
   - Set privileges: **Read and write to any database**
   - Save credentials securely

3. **Configure Network Access**
   - Go to **Network Access** → **Add IP Address**
   - For development: Add `0.0.0.0/0` (allow all IPs) - **Not recommended for production**
   - For production: Add specific IP ranges or VPC CIDR blocks
   - Click **Confirm**

4. **Get Connection String**
   - Go to **Clusters** → Click **Connect**
   - Choose **Connect your application**
   - Copy connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Save this for backend configuration

### Option B: AWS DocumentDB

1. **Create DocumentDB Cluster**
   - Go to AWS Console → **Amazon DocumentDB**
   - Click **Create Cluster**
   - Choose instance class (db.t3.medium minimum)
   - Set master username and password
   - Configure VPC and security groups
   - Create cluster

2. **Get Connection String**
   - After cluster creation, note the endpoint
   - Connection format: `mongodb://username:password@cluster-endpoint:27017/`

mongodb://ritesh:<insertYourPassword>@docdb-2025-11-08-13-35-39.cluster-croa2u86k3y9.ap-south-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
## Part 2: Backend Deployment on AWS EC2

### Step 1: Launch EC2 Instance

1. **Go to EC2 Console**
   - AWS Console → **EC2** → **Instances** → **Launch Instances**

2. **Configure Instance**
   - **Name**: `autoscaling-backend`
   - **AMI**: Ubuntu Server 22.04 LTS (or Amazon Linux 2023)
   - **Instance Type**: `t3.medium` or `t3.large` (minimum 2GB RAM)
   - **Key Pair**: Create new or select existing SSH key pair
     - Click **"Create new key pair"**
     - Name: `autoscaling-backend-key`
     - Type: RSA, Format: .pem (macOS/Linux) or .ppk (Windows)
     - **⚠️ IMPORTANT**: Download and save the .pem file securely!
   - **Network Settings**: Click **"Edit"** to configure:
     - **SSH (port 22)**: 
       - Type: SSH
       - Port: 22
       - Source: **My IP** (automatically adds your current IP)
     - **HTTP (port 80)**: 
       - Type: HTTP
       - Port: 80
       - Source: **Anywhere-IPv4** (adds `0.0.0.0/0`)
     - **HTTPS (port 443)**: 
       - Type: HTTPS
       - Port: 443
       - Source: **Anywhere-IPv4** (adds `0.0.0.0/0`)
     - **Custom TCP (port 8000)**: 
       - Type: Custom TCP
       - Port: 8000
       - Source: **Anywhere-IPv4** (adds `0.0.0.0/0`) OR your VPC CIDR (e.g., `10.0.0.0/16`)
       - **⚠️ Important**: Do NOT enter "8000" in the Source/CIDR field! Use `0.0.0.0/0` or your VPC CIDR block
   - **Configure Storage**: 20GB gp3 (minimum)
   - **Launch Instance**

### Step 2: Configure Security Group

1. **Edit Security Group**
   - Go to **Security Groups** → Select your instance's security group
   - **Inbound Rules**:
     - SSH (22) from your IP
     - HTTP (80) from 0.0.0.0/0
     - HTTPS (443) from 0.0.0.0/0
     - Custom TCP (8000) from your VPC CIDR (for internal access)
   - **Save rules**

### Step 3: Connect to EC2 Instance

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### Step 4: Install Dependencies

```bash
# Install Python 3.9+
sudo apt install python3.9 python3.9-venv python3-pip -y

# Install Git
sudo apt install git -y

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install other dependencies
sudo apt install build-essential -y
```

### Step 5: Deploy Backend Code

```bash
# Clone your repository (or upload files)
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend

# OR: Upload files using SCP from local machine
# scp -r -i your-key.pem backend/ ubuntu@your-ec2-ip:~/

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 6: Configure Environment Variables

```bash
# Create .env file
cd ~/your-repo/backend
nano .env
```

**Add these variables:**
```env
# MongoDB Connection
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/autoscaling_db
DB_NAME=autoscaling_db

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_ASG_NAME=your-autoscaling-group-name

# CORS Configuration (your frontend domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Calendarific API
CALENDARIFIC_API_KEY=your_api_key
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Step 7: Set Up Systemd Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/autoscaling-backend.service
```

**Add this content:**
```ini
[Unit]
Description=AI Predictive Autoscaling Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/your-repo/backend
Environment="PATH=/home/ubuntu/your-repo/backend/.venv/bin"
ExecStart=/home/ubuntu/your-repo/backend/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save and exit**, then:
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable autoscaling-backend

# Start the service
sudo systemctl start autoscaling-backend

# Check status
sudo systemctl status autoscaling-backend

# View logs
sudo journalctl -u autoscaling-backend -f
```

### Step 8: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/autoscaling-backend
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/autoscaling-backend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### Step 9: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 10: Verify Backend is Running

```bash
# Test from EC2 instance
curl http://localhost:8000/api/health

# Test from your local machine (replace with your domain or EC2 IP)
curl http://your-domain.com/api/health
# Or
curl http://your-ec2-public-ip/api/health
```

---

## Part 3: Frontend Deployment on S3 + CloudFront

### Step 1: Build Frontend for Production

**On your local machine:**
```bash
cd frontend

# Update .env file for production
echo "REACT_APP_BACKEND_URL=https://your-domain.com" > .env
# Or: echo "REACT_APP_BACKEND_URL=https://api.your-domain.com" > .env

# Install dependencies
yarn install

# Build for production
yarn build

# This creates a 'build' folder with production files
```

### Step 2: Create S3 Bucket

1. **Go to S3 Console**
   - AWS Console → **S3** → **Create bucket**

2. **Configure Bucket**
   - **Bucket name**: `your-app-frontend` (must be globally unique)
   - **Region**: Same as your backend (e.g., `us-east-1`)
   - **Block Public Access**: Uncheck **Block all public access** (we need public read access)
   - Acknowledge the warning
   - **Bucket Versioning**: Enable (optional but recommended)
   - **Create bucket**

### Step 3: Configure S3 Bucket for Static Website Hosting

1. **Go to your bucket** → **Properties** tab
2. Scroll to **Static website hosting**
3. Click **Edit**
4. **Enable** static website hosting
5. **Hosting type**: Host a static website
6. **Index document**: `index.html`
7. **Error document**: `index.html` (for React Router)
8. **Save changes**

### Step 4: Configure S3 Bucket Policy

1. **Go to your bucket** → **Permissions** tab
2. Click **Bucket policy**
3. **Add this policy** (replace `your-app-frontend` with your bucket name):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-app-frontend/*"
        }
    ]
}
```
4. **Save changes**

### Step 5: Upload Frontend Build to S3

**Option A: Using AWS Console**
1. Go to your bucket → **Objects** tab
2. Click **Upload**
3. Drag and drop all files from `frontend/build/` folder
4. Click **Upload**

**Option B: Using AWS CLI**
```bash
# Install AWS CLI if not installed
# Configure AWS CLI: aws configure

# Upload build files
aws s3 sync frontend/build/ s3://your-app-frontend --delete

# Set correct content types
aws s3 cp s3://your-app-frontend s3://your-app-frontend --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE
aws s3 cp s3://your-app-frontend s3://your-app-frontend --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE
aws s3 cp s3://your-app-frontend s3://your-app-frontend --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE
```

### Step 6: Set Up CloudFront Distribution

1. **Go to CloudFront Console**
   - AWS Console → **CloudFront** → **Create Distribution**

2. **Configure Origin**
   - **Origin domain**: Select your S3 bucket (should show `your-app-frontend.s3.amazonaws.com`)
   - **Origin access**: **Use website endpoint** (select the one ending with `.s3-website-...`)
   - **Origin path**: Leave empty

3. **Configure Default Cache Behavior**
   - **Viewer protocol policy**: **Redirect HTTP to HTTPS**
   - **Allowed HTTP methods**: **GET, HEAD, OPTIONS**
   - **Cache policy**: **CachingOptimized** or **CachingDisabled** (for development)
   - **Origin request policy**: **CORS-S3Origin**

4. **Configure Distribution Settings**
   - **Price class**: Choose based on your needs
   - **Alternate domain names (CNAMEs)**: Add your domain (`your-domain.com`, `www.your-domain.com`)
   - **SSL certificate**: Request or import a certificate in **AWS Certificate Manager (ACM)**
   - **Default root object**: `index.html`
   - **Custom error responses**:
     - HTTP Error Code: `403`
     - Response Page Path: `/index.html`
     - HTTP Response Code: `200`
     - Do the same for `404`

5. **Create Distribution**
   - Click **Create Distribution**
   - Wait for distribution to deploy (15-30 minutes)

### Step 7: Configure DNS for CloudFront

1. **Get CloudFront Distribution URL**
   - Go to CloudFront → Your distribution
   - Copy **Distribution domain name** (e.g., `d1234abcd.cloudfront.net`)

2. **Update DNS Records**
   - Go to your domain registrar (Route 53, GoDaddy, etc.)
   - Create **CNAME record**:
     - **Name**: `@` or `www` (depending on your setup)
     - **Value**: Your CloudFront distribution domain name
     - **TTL**: 300 (or default)

### Step 8: Set Up Custom Domain with Route 53 (Optional)

1. **Request SSL Certificate in ACM**
   - Go to **AWS Certificate Manager**
   - Request a public certificate
   - Add domain names: `your-domain.com`, `www.your-domain.com`
   - Validate domain ownership (DNS or email)
   - Wait for certificate to be issued

2. **Update CloudFront Distribution**
   - Edit distribution → **Alternate domain names (CNAMEs)**
   - Add: `your-domain.com`, `www.your-domain.com`
   - **SSL certificate**: Select your ACM certificate
   - Save changes

3. **Create Route 53 Hosted Zone**
   - Go to **Route 53** → **Hosted zones**
   - Create hosted zone for your domain
   - Create **A record** (Alias):
     - **Name**: `@` (root domain)
     - **Alias**: Yes
     - **Alias target**: Your CloudFront distribution
     - Create record

---

## Part 4: AWS Auto Scaling Group Setup

### Step 1: Create Launch Template

1. **Go to EC2 Console** → **Launch Templates** → **Create launch template**

2. **Configure Template**
   - **Name**: `autoscaling-backend-template`
   - **AMI**: Use the same AMI as your current EC2 instance
   - **Instance type**: `t3.medium`
   - **Key pair**: Your SSH key pair
   - **Security group**: Your backend security group
   - **IAM instance profile**: Create one with EC2 Auto Scaling permissions
   - **User data** (startup script):
```bash
#!/bin/bash
# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y python3.9 python3.9-venv python3-pip git nginx build-essential

# Clone repository (or use your deployment method)
git clone https://github.com/your-username/your-repo.git /opt/app
cd /opt/app/backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file (use AWS Systems Manager Parameter Store for secrets)
# aws ssm get-parameter --name /app/mongo-url --with-decryption --query Parameter.Value --output text

# Set up systemd service
cat > /etc/systemd/system/autoscaling-backend.service << EOF
[Unit]
Description=AI Predictive Autoscaling Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/app/backend
Environment="PATH=/opt/app/backend/.venv/bin"
ExecStart=/opt/app/backend/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable autoscaling-backend
systemctl start autoscaling-backend
```

3. **Create Launch Template**

### Step 2: Create Auto Scaling Group

1. **Go to EC2 Console** → **Auto Scaling Groups** → **Create Auto Scaling group**

2. **Configure Group**
   - **Name**: `autoscaling-backend-asg`
   - **Launch template**: Select your template
   - **VPC**: Your VPC
   - **Subnets**: Select multiple subnets (for high availability)
   - **Load balancer**: Attach to Application Load Balancer (optional)

3. **Configure Group Size**
   - **Desired capacity**: 2
   - **Minimum capacity**: 1
   - **Maximum capacity**: 10

4. **Configure Scaling Policies**
   - **Scaling policy type**: Target tracking scaling policy
   - **Metric type**: Average CPU utilization
   - **Target value**: 70%
   - **Instances need**: 300 seconds warm up

5. **Add Notifications** (optional)
   - Set up SNS notifications for scaling events (see Part 11 for detailed SMS setup)

6. **Create Auto Scaling Group**

### Step 3: Create Application Load Balancer (Optional but Recommended)

1. **Go to EC2 Console** → **Load Balancers** → **Create Load Balancer**

2. **Choose Load Balancer Type**: **Application Load Balancer**

3. **Configure**
   - **Name**: `autoscaling-backend-alb`
   - **Scheme**: Internet-facing
   - **IP address type**: IPv4
   - **VPC**: Your VPC
   - **Subnets**: Select multiple availability zones
   - **Security groups**: Allow HTTP (80) and HTTPS (443)

4. **Configure Listeners**
   - **HTTP (80)**: Redirect to HTTPS (443)
   - **HTTPS (443)**: Forward to target group
   - **SSL certificate**: Select your ACM certificate

5. **Configure Target Group**
   - **Name**: `autoscaling-backend-targets`
   - **Target type**: Instances
   - **Protocol**: HTTP
   - **Port**: 8000
   - **Health checks**: 
     - Path: `/api/health`
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5 seconds
     - Interval: 30 seconds

6. **Register Targets**: Auto Scaling Group will automatically register instances

7. **Create Load Balancer**

### Step 4: Update Backend Environment Variables

Update your backend `.env` or use AWS Systems Manager Parameter Store:

```bash
# Store secrets in Parameter Store (more secure)
aws ssm put-parameter --name /app/mongo-url --value "mongodb+srv://..." --type "SecureString"
aws ssm put-parameter --name /app/db-name --value "autoscaling_db" --type "String"
aws ssm put-parameter --name /app/aws-access-key --value "..." --type "SecureString"
aws ssm put-parameter --name /app/aws-secret-key --value "..." --type "SecureString"
```

Then update your user data script to retrieve these values.

---

## Part 5: Security Best Practices

### 1. Use AWS Secrets Manager or Parameter Store
- Store sensitive data (MongoDB credentials, API keys) in AWS Secrets Manager
- Update application to retrieve secrets at runtime

### 2. Set Up IAM Roles
- Create IAM role for EC2 instances with minimal permissions
- Attach role to Auto Scaling Group launch template

### 3. Configure Security Groups
- Use least privilege principle
- Only allow necessary ports
- Use VPC security groups for internal communication

### 4. Enable CloudWatch Logs
```bash
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure and start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
```

### 5. Set Up VPC and Subnets
- Create private subnets for backend instances
- Use public subnets only for load balancer
- Set up NAT Gateway for outbound internet access

---

## Part 6: Monitoring and Maintenance

### 1. Set Up CloudWatch Alarms
- CPU utilization
- Memory usage
- Disk space
- Application errors
- Auto Scaling events

### 2. Set Up CloudWatch Dashboards
- Create dashboard for backend metrics
- Monitor API response times
- Track prediction accuracy

### 3. Set Up SNS Notifications (See Part 11 for detailed SMS setup)
- Alerts for scaling events
- Alerts for health check failures
- Alerts for high error rates

### 4. Regular Backups
- Backup MongoDB (Atlas automated backups or manual)
- Backup EC2 instance snapshots
- Backup S3 bucket versioning

---

## Part 7: Cost Optimization

### 1. Use Reserved Instances
- For predictable workloads, use Reserved Instances (1-3 year terms)
- Can save up to 72% compared to On-Demand

### 2. Use Spot Instances
- For non-critical workloads, use Spot Instances
- Can save up to 90% compared to On-Demand

### 3. Right-Size Instances
- Monitor actual resource usage
- Downsize if consistently underutilized
- Use CloudWatch metrics to guide decisions

### 4. Use S3 Intelligent-Tiering
- Automatically moves objects to most cost-effective access tier

### 5. CloudFront Caching
- Configure appropriate cache TTLs
- Reduce origin requests and data transfer costs

---

## Part 8: Deployment Checklist

### Pre-Deployment
- [ ] MongoDB Atlas cluster created and configured
- [ ] EC2 instance launched and configured
- [ ] Security groups configured correctly
- [ ] Environment variables set up
- [ ] SSL certificates obtained
- [ ] Domain DNS configured

### Backend Deployment
- [ ] Backend code deployed to EC2
- [ ] Dependencies installed
- [ ] Systemd service configured and running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Health endpoint responding
- [ ] API endpoints tested

### Frontend Deployment
- [ ] Frontend built for production
- [ ] Environment variables set for production backend URL
- [ ] S3 bucket created and configured
- [ ] Frontend files uploaded to S3
- [ ] CloudFront distribution created
- [ ] DNS records updated
- [ ] SSL certificate configured
- [ ] Frontend accessible via domain

### Auto Scaling
- [ ] Launch template created
- [ ] Auto Scaling Group created
- [ ] Scaling policies configured
- [ ] Load Balancer configured (if using)
- [ ] Health checks working
- [ ] Auto scaling tested

### Security
- [ ] IAM roles configured
- [ ] Security groups tightened
- [ ] Secrets stored in Parameter Store/Secrets Manager
- [ ] CloudWatch logging enabled
- [ ] Backup strategy in place

### Monitoring
- [ ] CloudWatch alarms configured
- [ ] CloudWatch dashboards created
- [ ] SNS topic created (see Part 11)
- [ ] SMS subscriptions configured and confirmed
- [ ] Email subscriptions configured (optional)
- [ ] Monthly SMS spending limit set
- [ ] SNS notifications integrated with Auto Scaling Group
- [ ] SNS notifications integrated with CloudWatch alarms
- [ ] Backend SNS integration code added
- [ ] Environment variable `SNS_TOPIC_ARN` configured
- [ ] Test SMS sent and verified
- [ ] Log aggregation configured

---

## Part 9: Troubleshooting

### Backend Not Responding
1. Check EC2 instance status
2. Check systemd service: `sudo systemctl status autoscaling-backend`
3. Check logs: `sudo journalctl -u autoscaling-backend -f`
4. Check security groups
5. Check Nginx: `sudo nginx -t` and `sudo systemctl status nginx`

### Frontend Not Loading
1. Check S3 bucket public access
2. Check CloudFront distribution status
3. Check DNS propagation
4. Check SSL certificate validity
5. Check browser console for errors

### Auto Scaling Not Working
1. Check Auto Scaling Group activity
2. Check CloudWatch alarms
3. Check target group health
4. Check launch template
5. Check IAM permissions

### Database Connection Issues
1. Check MongoDB network access rules
2. Check connection string
3. Check security groups (if using DocumentDB)
4. Check VPC peering (if applicable)

---

## Part 10: Post-Deployment

### 1. Test All Endpoints
```bash
# Health check
curl https://your-domain.com/api/health

# Predictions
curl -X POST https://your-domain.com/api/predict \
  -H "Content-Type: application/json" \
  -d '{"start_time": "2025-01-20T00:00:00Z", "hours": 24, "model_name": "catboost"}'
```

### 2. Monitor Performance
- Check CloudWatch metrics
- Monitor API response times
- Check error rates
- Monitor auto scaling events

### 3. Set Up Automated Deployments
- Use AWS CodePipeline for CI/CD
- Set up GitHub Actions for automated deployments
- Implement blue-green deployments

### 4. Document Your Setup
- Document all configuration values
- Document deployment process
- Document troubleshooting steps
- Create runbooks for common issues

---

## Estimated Costs (Monthly)

### Small Scale (Development/Testing)
- EC2 t3.medium: ~$30
- MongoDB Atlas M0 (Free tier): $0
- S3 + CloudFront: ~$5
- Data Transfer: ~$10
- **Total: ~$45/month**

### Medium Scale (Production)
- EC2 t3.large (2 instances): ~$120
- Application Load Balancer: ~$20
- MongoDB Atlas M10: ~$57
- S3 + CloudFront: ~$20
- Data Transfer: ~$50
- CloudWatch: ~$10
- **Total: ~$277/month**

### Large Scale (High Traffic)
- EC2 instances (Auto Scaling): ~$500-1000
- Application Load Balancer: ~$20
- MongoDB Atlas M30: ~$320
- S3 + CloudFront: ~$100
- Data Transfer: ~$200
- CloudWatch: ~$30
- **Total: ~$1170-1670/month**

---

## Part 11: AWS SNS (Simple Notification Service) Setup for SMS Alerts

This section provides detailed step-by-step instructions for setting up SMS notifications using AWS SNS for scaling events, health check failures, and other critical alerts.

### Step 1: Create SNS Topic

1. **Go to SNS Console**
   - AWS Console → **Simple Notification Service (SNS)** → **Topics**
   - Click **Create topic**

2. **Configure Topic**
   - **Type**: **Standard** (for SMS)
   - **Name**: `autoscaling-alerts` (or your preferred name)
   - **Display name**: `AutoScaling Alerts` (optional, for email notifications)
   - Click **Create topic**

3. **Note the Topic ARN**
   - Copy the **Topic ARN** (e.g., `arn:aws:sns:us-east-1:123456789012:autoscaling-alerts`)
   - Save this for later configuration

### Step 2: Subscribe Phone Numbers to Topic (SMS)

1. **Create Subscription**
   - Go to your topic → **Subscriptions** tab
   - Click **Create subscription**

2. **Configure Subscription**
   - **Protocol**: Select **SMS**
   - **Endpoint**: Enter phone number in E.164 format
     - **Format**: `+1234567890` (include country code, no spaces or dashes)
     - **Examples**:
       - US: `+12025551234`
       - India: `+919876543210`
       - UK: `+447911123456`
   - Click **Create subscription**

3. **Verify Phone Number**
   - AWS will send a verification code via SMS
   - Enter the code in the AWS Console to confirm subscription
   - Status will change from **Pending confirmation** to **Confirmed**

4. **Add Multiple Phone Numbers** (Optional)
   - Repeat steps 1-3 for each phone number
   - You can have multiple SMS subscriptions on one topic

### Step 3: Subscribe Email Addresses (Optional)

1. **Create Email Subscription**
   - Go to your topic → **Subscriptions** tab
   - Click **Create subscription**

2. **Configure Email Subscription**
   - **Protocol**: Select **Email**
   - **Endpoint**: Enter your email address (e.g., `admin@yourdomain.com`)
   - Click **Create subscription**

3. **Confirm Email**
   - AWS will send a confirmation email
   - Click the confirmation link in the email
   - Status will change to **Confirmed**

### Step 4: Set Up SMS Spending Limits (Important!)

**⚠️ Important**: SMS messages can incur costs. Set spending limits to avoid unexpected charges.

1. **Go to SNS Console**
   - AWS Console → **SNS** → **Text messaging (SMS)** → **Account preferences**

2. **Set Monthly Spending Limit**
   - Click **Edit**
   - **Monthly spending limit**: Set a limit (e.g., `$10` or `$50`)
   - Click **Save changes**

3. **Set Delivery Status Logging** (Optional)
   - Enable **Delivery status logging** for tracking
   - Select S3 bucket for logs (or create new one)

### Step 5: Configure Auto Scaling Group Notifications

1. **Go to Auto Scaling Groups**
   - AWS Console → **EC2** → **Auto Scaling Groups**
   - Select your Auto Scaling Group

2. **Add Notification**
   - Go to **Notifications** tab
   - Click **Create notification configuration**

3. **Configure Notification**
   - **SNS topic**: Select your topic (`autoscaling-alerts`)
   - **Notification types**: Select events to monitor:
     - ✅ **Instance launch**
     - ✅ **Instance launch error**
     - ✅ **Instance terminate**
     - ✅ **Instance terminate error**
     - ✅ **Test notification** (optional, for testing)
   - Click **Create notification configuration**

### Step 6: Set Up CloudWatch Alarms with SNS

1. **Create CloudWatch Alarm for High CPU**
   - Go to **CloudWatch** → **Alarms** → **Create alarm**

2. **Select Metric**
   - Click **Select metric**
   - Choose **EC2** → **Per-Instance Metrics**
   - Select **CPUUtilization** metric
   - Select your instance(s) or Auto Scaling Group

3. **Configure Alarm**
   - **Alarm name**: `high-cpu-alert`
   - **Threshold**: 
     - **Whenever CPUUtilization is...**: Greater than 80
     - **for at least**: 2 datapoints within 5 minutes
   - Click **Next**

4. **Configure Actions**
   - **Alarm state trigger**: **In alarm**
   - **SNS topic**: Select your topic (`autoscaling-alerts`)
   - Click **Next**

5. **Add Name and Description**
   - **Alarm name**: `high-cpu-alert`
   - **Alarm description**: `Alert when CPU exceeds 80%`
   - Click **Next**

6. **Preview and Create**
   - Review configuration
   - Click **Create alarm**

### Step 7: Create Additional CloudWatch Alarms

Create alarms for other critical metrics:

#### A. Health Check Failures

1. **Create Alarm**
   - **Metric**: **ApplicationELB** → **TargetResponseTime** or **UnHealthyHostCount**
   - **Alarm name**: `health-check-failure`
   - **Threshold**: UnHealthyHostCount > 0
   - **SNS topic**: Your topic

#### B. High Memory Usage

1. **Create Alarm**
   - **Metric**: **EC2** → **MemoryUtilization** (requires CloudWatch agent)
   - **Alarm name**: `high-memory-alert`
   - **Threshold**: MemoryUtilization > 85%
   - **SNS topic**: Your topic

#### C. Scaling Events

1. **Create Alarm**
   - **Metric**: **Auto Scaling** → **GroupDesiredCapacity** or **GroupInServiceInstances**
   - **Alarm name**: `scaling-event-alert`
   - **Threshold**: Configure based on your needs
   - **SNS topic**: Your topic

### Step 8: Configure Backend to Send SMS via SNS

Update your backend to send SMS notifications programmatically:

1. **Install Boto3** (if not already installed)
   ```bash
   pip install boto3
   ```

2. **Add SNS Function to Backend**

   Add this to your `server.py`:

   ```python
   import boto3
   from botocore.exceptions import ClientError

   def send_sns_notification(message: str, topic_arn: str = None):
       """Send SMS notification via SNS"""
       try:
           sns_client = boto3.client(
               'sns',
               aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
               aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
               region_name=os.environ.get('AWS_REGION', 'us-east-1')
           )
           
           # Use topic ARN from environment or default
           topic = topic_arn or os.environ.get('SNS_TOPIC_ARN')
           
           if not topic:
               logger.warning("SNS topic ARN not configured")
               return False
           
           # Publish to topic (all subscribers will receive SMS)
           response = sns_client.publish(
               TopicArn=topic,
               Message=message,
               Subject='AutoScaling Alert'  # For email subscribers
           )
           
           logger.info(f"SMS notification sent: {response['MessageId']}")
           return True
           
       except ClientError as e:
           logger.error(f"Failed to send SMS: {e}")
           return False
   ```

3. **Add Environment Variable**

   Add to your `.env` file:
   ```bash
   SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:autoscaling-alerts
   ```

4. **Use in Scaling Function**

   Update your `scale_ec2_instances` function:

   ```python
   def scale_ec2_instances(predicted_load: float, asg_name: str) -> Dict[str, Any]:
       """Scale EC2 Auto Scaling Group based on predicted load"""
       try:
           client = get_aws_autoscaling_client()
           desired = calculate_recommended_instances(predicted_load)
           
           # ... existing scaling code ...
           
           # Send SMS notification
           message = f"🚀 Auto Scaling Event\n\n"
           message += f"Predicted Load: {predicted_load:.0f}\n"
           message += f"Desired Capacity: {desired} instances\n"
           message += f"ASG: {asg_name}\n"
           message += f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
           
           send_sns_notification(message)
           
           return {
               'success': True,
               'desired_capacity': desired,
               'message': f'Scaled {asg_name} to {desired} instances'
           }
       except Exception as e:
           # Send error notification
           error_message = f"❌ Scaling Error\n\nError: {str(e)}\nASG: {asg_name}"
           send_sns_notification(error_message)
           raise
   ```

### Step 9: Test SMS Notifications

1. **Test via AWS Console**
   - Go to your SNS topic
   - Click **Publish message**
   - **Subject**: `Test Alert`
   - **Message**: `This is a test notification from AutoScaling System`
   - Click **Publish message**
   - Check your phone for SMS

2. **Test via Backend API**
   ```bash
   # Test scaling endpoint (will trigger SMS if configured)
   curl -X POST https://your-domain.com/api/scale \
     -H "Content-Type: application/json" \
     -d '{
       "predicted_load": 2500,
       "asg_name": "your-asg-name"
     }'
   ```

3. **Test CloudWatch Alarm**
   - Manually trigger alarm (or wait for actual event)
   - Verify SMS is received

### Step 10: SMS Best Practices and Costs

#### Cost Considerations

- **SMS Pricing** (varies by region):
  - US: ~$0.00645 per SMS
  - India: ~$0.00645 per SMS
  - Other regions: Check AWS pricing page

- **Monthly Spending Limit**: Always set a limit to avoid unexpected charges

#### Best Practices

1. **Use Topics for Multiple Recipients**
   - Don't send individual SMS to each person
   - Use one topic with multiple subscriptions

2. **Message Length**
   - SMS has 160 character limit
   - Keep messages concise and actionable

3. **Rate Limiting**
   - AWS has rate limits for SMS (varies by country)
   - Don't send too many messages too quickly

4. **Opt-Out Handling**
   - Users can reply "STOP" to opt out
   - Handle opt-outs gracefully in your application

5. **Use Email for Non-Critical Alerts**
   - Reserve SMS for critical alerts only
   - Use email for informational messages

### Step 11: Advanced SNS Configuration

#### A. Filter Policies (Send Different Messages to Different Subscribers)

1. **Create Subscription with Filter**
   - When creating subscription, expand **Subscription filter policy**
   - Add JSON filter:
   ```json
   {
     "severity": ["critical", "high"]
   }
   ```

2. **Publish with Attributes**
   ```python
   sns_client.publish(
       TopicArn=topic_arn,
       Message=message,
       MessageAttributes={
           'severity': {
               'DataType': 'String',
               'StringValue': 'critical'
           }
       }
   )
   ```

#### B. Delivery Status Logging

1. **Enable Delivery Status**
   - Go to SNS → **Text messaging (SMS)** → **Account preferences**
   - Enable **Delivery status logging**
   - Select S3 bucket for logs

2. **Monitor Delivery Status**
   - Check S3 bucket for delivery logs
   - Track failed deliveries

#### C. Set Up Dead Letter Queue (DLQ)

1. **Create SQS Queue**
   - Go to **SQS** → **Create queue**
   - **Name**: `sns-dlq`
   - Create queue

2. **Configure Topic with DLQ**
   - Go to your SNS topic
   - **Edit** → **Redrive policy**
   - Select your DLQ
   - Save

### Step 12: Integration with Auto Scaling Events

The Auto Scaling Group notifications (configured in Step 5) will automatically send SMS for:
- ✅ Instance launch events
- ✅ Instance termination events
- ✅ Launch errors
- ✅ Termination errors

**Example SMS Messages You'll Receive:**

```
🚀 Auto Scaling Event

Event: Instance Launch
Instance ID: i-1234567890abcdef0
ASG: autoscaling-backend-asg
Time: 2025-01-20 14:30:00
```

```
⚠️ Auto Scaling Error

Event: Instance Launch Error
ASG: autoscaling-backend-asg
Error: Insufficient capacity
Time: 2025-01-20 14:35:00
```

### Step 13: Troubleshooting SMS Issues

#### SMS Not Received

1. **Check Subscription Status**
   - Go to SNS → Your topic → Subscriptions
   - Verify status is **Confirmed** (not Pending)

2. **Check Phone Number Format**
   - Must be in E.164 format: `+1234567890`
   - Include country code

3. **Check Spending Limits**
   - Verify monthly limit not exceeded
   - Check AWS billing dashboard

4. **Check CloudWatch Logs**
   - Go to CloudWatch → Logs
   - Check SNS delivery logs (if enabled)

5. **Test with AWS Console**
   - Try publishing test message from console
   - If console works but code doesn't, check IAM permissions

#### IAM Permissions Required

Your IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:Subscribe",
        "sns:CreateTopic",
        "sns:GetTopicAttributes"
      ],
      "Resource": "arn:aws:sns:*:*:*"
    }
  ]
}
```

### Step 14: SMS Notification Checklist

- [ ] SNS topic created
- [ ] Phone numbers subscribed and confirmed
- [ ] Email addresses subscribed (optional)
- [ ] Monthly spending limit set
- [ ] Auto Scaling Group notifications configured
- [ ] CloudWatch alarms configured with SNS
- [ ] Backend code updated with SNS integration
- [ ] Environment variable `SNS_TOPIC_ARN` set
- [ ] IAM permissions configured
- [ ] Test SMS sent and received
- [ ] Delivery status logging enabled (optional)
- [ ] Dead letter queue configured (optional)

---

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS Auto Scaling Documentation](https://docs.aws.amazon.com/autoscaling/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [AWS SNS SMS Pricing](https://aws.amazon.com/sns/sms-pricing/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## Support

For issues or questions:
1. Check AWS CloudWatch logs
2. Check application logs
3. Review this guide's troubleshooting section
4. Consult AWS documentation
5. Contact AWS support (if you have support plan)

