# Complete DocumentDB Setup Guide - Step by Step

This guide walks you through setting up Amazon DocumentDB for the AI Predictive Autoscaling System.

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS Console access
- Basic understanding of AWS networking (VPC, Subnets, Security Groups)

---

## Part 1: Create VPC and Networking (If Not Already Set Up)

### Step 1: Create VPC

1. **Go to AWS Console**
   - Navigate to **VPC** → **Your VPCs** → **Create VPC**

2. **Configure VPC**
   - **Name tag**: `documentdb-vpc`
   - **IPv4 CIDR block**: `10.0.0.0/16` (or your preferred CIDR)
   - **IPv6 CIDR block**: No IPv6 CIDR block (optional)
   - **Tenancy**: Default
   - Click **Create VPC**

### Step 2: Create Subnets

**Create Public Subnet (for EC2 instance):**

1. **Go to Subnets** → **Create Subnet**
   - **VPC**: Select `documentdb-vpc`
   - **Subnet name**: `public-subnet-1`
   - **Availability Zone**: `us-east-1a` (choose your preferred AZ)
   - **IPv4 CIDR block**: `10.0.1.0/24`
   - Click **Create Subnet**

2. **Create Second Public Subnet** (for high availability)
   - **Subnet name**: `public-subnet-2`
   - **Availability Zone**: `us-east-1b` (different AZ)
   - **IPv4 CIDR block**: `10.0.2.0/24`
   - Click **Create Subnet**

**Create Private Subnet (for DocumentDB):**

1. **Create Private Subnet 1**
   - **Subnet name**: `private-subnet-1`
   - **Availability Zone**: `us-east-1a`
   - **IPv4 CIDR block**: `10.0.3.0/24`
   - Click **Create Subnet**

2. **Create Private Subnet 2**
   - **Subnet name**: `private-subnet-2`
   - **Availability Zone**: `us-east-1b`
   - **IPv4 CIDR block**: `10.0.4.0/24`
   - Click **Create Subnet**

### Step 3: Create Internet Gateway

1. **Go to Internet Gateways** → **Create Internet Gateway**
   - **Name tag**: `documentdb-igw`
   - Click **Create Internet Gateway**

2. **Attach to VPC**
   - Select the Internet Gateway → **Actions** → **Attach to VPC**
   - Select `documentdb-vpc`
   - Click **Attach**

### Step 4: Create Route Tables

**Public Route Table:**

1. **Go to Route Tables** → **Create Route Table**
   - **Name tag**: `public-route-table`
   - **VPC**: Select `documentdb-vpc`
   - Click **Create Route Table**

2. **Add Route to Internet Gateway**
   - Select `public-route-table` → **Routes** tab → **Edit Routes**
   - Click **Add Route**
   - **Destination**: `0.0.0.0/0`
   - **Target**: Select Internet Gateway (`documentdb-igw`)
   - Click **Save Changes**

3. **Associate Public Subnets**
   - Select `public-route-table` → **Subnet Associations** tab
   - Click **Edit Subnet Associations**
   - Select `public-subnet-1` and `public-subnet-2`
   - Click **Save Associations**

**Private Route Table:**

1. **Create Private Route Table**
   - **Name tag**: `private-route-table`
   - **VPC**: Select `documentdb-vpc`
   - Click **Create Route Table**

2. **Associate Private Subnets**
   - Select `private-route-table` → **Subnet Associations** tab
   - Click **Edit Subnet Associations`
   - Select `private-subnet-1` and `private-subnet-2`
   - Click **Save Associations**

### Step 5: Create NAT Gateway (For Private Subnet Internet Access)

1. **Allocate Elastic IP**
   - Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP Address**
   - Click **Allocate**

2. **Create NAT Gateway**
   - Go to **VPC** → **NAT Gateways** → **Create NAT Gateway**
   - **Name tag**: `documentdb-nat-gw`
   - **Subnet**: Select `public-subnet-1`
   - **Elastic IP**: Select the Elastic IP you just allocated
   - Click **Create NAT Gateway**
   - **Wait 2-3 minutes** for it to become available

3. **Update Private Route Table**
   - Go to **Route Tables** → Select `private-route-table`
   - **Routes** tab → **Edit Routes**
   - Click **Add Route**
   - **Destination**: `0.0.0.0/0`
   - **Target**: Select NAT Gateway (`documentdb-nat-gw`)
   - Click **Save Changes**

---

## Part 2: Create DB Subnet Group

### Step 1: Create DB Subnet Group

1. **Go to DocumentDB Console**
   - AWS Console → **Amazon DocumentDB** → **Subnet Groups** → **Create**

2. **Configure Subnet Group**
   - **Name**: `documentdb-subnet-group`
   - **Description**: `Subnet group for DocumentDB cluster`
   - **VPC**: Select `documentdb-vpc`

3. **Add Subnets**
   - **Availability Zones**: Select `us-east-1a` and `us-east-1b`
   - **Subnets**: 
     - Select `private-subnet-1` (10.0.3.0/24)
     - Select `private-subnet-2` (10.0.4.0/24)
   - Click **Create**

---

## Part 3: Create Security Group for DocumentDB

### Step 1: Create Security Group

1. **Go to EC2 Console** → **Security Groups** → **Create Security Group**

2. **Configure Security Group**
   - **Name**: `documentdb-sg`
   - **Description**: `Security group for DocumentDB cluster`
   - **VPC**: Select `documentdb-vpc`

3. **Add Inbound Rules**
   - Click **Add Rule**
   - **Type**: Custom TCP
   - **Port**: `27017` (MongoDB default port)
   - **Source**: Custom → Select the security group that will be used by your EC2 instance
     - **OR** for testing: Select `My IP` (your current IP address)
     - **OR** for production: Select the EC2 security group (we'll create this next)
   - **Description**: `Allow MongoDB access from EC2 instances`
   - Click **Create Security Group**

4. **Note the Security Group ID** (e.g., `sg-xxxxxxxxxxxxx`) - you'll need this later

---

## Part 4: Create Security Group for EC2 Instance

### Step 1: Create EC2 Security Group

1. **Go to EC2 Console** → **Security Groups** → **Create Security Group**

2. **Configure Security Group**
   - **Name**: `backend-ec2-sg`
   - **Description**: `Security group for backend EC2 instance`
   - **VPC**: Select `documentdb-vpc`

3. **Add Inbound Rules**
   - **SSH (22)**: From `My IP` (for SSH access)
   - **HTTP (80)**: From `0.0.0.0/0` (for public access)
   - **HTTPS (443)**: From `0.0.0.0/0` (for public access)
   - **Custom TCP (8000)**: From `0.0.0.0/0` (for API access, or restrict to your VPC)

4. **Add Outbound Rules** (default is usually sufficient)
   - Allow all outbound traffic (default)

5. Click **Create Security Group**

6. **Note the Security Group ID** (e.g., `sg-yyyyyyyyyyyyy`) - you'll need this later

### Step 2: Update DocumentDB Security Group

1. **Go back to DocumentDB Security Group** (`documentdb-sg`)
2. **Edit Inbound Rules**
3. **Add Rule**:
   - **Type**: Custom TCP
   - **Port**: `27017`
   - **Source**: Custom → Select `backend-ec2-sg` (the EC2 security group)
   - **Description**: `Allow access from backend EC2 instances`
4. **Save Rules**

---

## Part 5: Create DocumentDB Cluster

### Step 1: Create DocumentDB Cluster

1. **Go to DocumentDB Console**
   - AWS Console → **Amazon DocumentDB** → **Clusters** → **Create**

2. **Configure Cluster**
   - **Engine**: DocumentDB (should be selected by default)
   - **Engine version**: Latest available (e.g., `5.0.0`)

3. **Templates**
   - Choose **Production** for production workload
   - OR **Dev/Test** for development/testing (cheaper)

4. **Cluster Settings**
   - **Cluster identifier**: `autoscaling-documentdb-cluster`
   - **Master username**: `admin` (or your preferred username)
   - **Master password**: 
     - Enter a strong password (minimum 8 characters)
     - **IMPORTANT**: Save this password securely! You'll need it for connections.
   - **Confirm password**: Re-enter the password

5. **Instance Configuration**
   - **Instance class**: 
     - **Dev/Test**: `db.t3.medium` (cheaper, ~$90/month)
     - **Production**: `db.r5.large` or higher (better performance, ~$250/month)
   - **Number of instances**: 
     - **Dev/Test**: `1` (single instance)
     - **Production**: `2` or `3` (for high availability)

6. **Storage**
   - **Storage encryption**: Enable (recommended for production)
   - **Backup retention period**: 
     - **Dev/Test**: `1` day
     - **Production**: `7` days (or more)

7. **Network & Security**
   - **VPC**: Select `documentdb-vpc`
   - **Subnet group**: Select `documentdb-subnet-group`
   - **VPC security group**: Select `documentdb-sg`
   - **Availability Zone**: Leave as default (will use multiple AZs)

8. **Database Authentication**
   - **Database authentication**: Enable (recommended)
   - This uses AWS IAM database authentication (optional but recommended)

9. **Backup**
   - **Backup window**: Choose a time when traffic is low (e.g., `03:00-04:00 UTC`)
   - **Preferred backup window**: Select your preference

10. **Maintenance**
    - **Maintenance window**: Choose a time for updates (e.g., `sun:04:00-sun:05:00 UTC`)
    - **Auto minor version upgrade**: Enable (recommended)

11. **Monitoring**
    - **Enable Enhanced Monitoring**: Optional (adds cost but provides better metrics)
    - **Performance Insights**: Optional (useful for production)

12. **Tags** (Optional)
    - Add tags like:
      - Key: `Name`, Value: `autoscaling-documentdb`
      - Key: `Environment`, Value: `production` or `development`

13. **Review and Create**
    - Review all settings
    - Click **Create**

14. **Wait for Cluster Creation**
    - This takes **10-15 minutes**
    - You'll see the status change from "Creating" to "Available"
    - **Do not close the browser** - wait for completion

---

## Part 6: Get DocumentDB Connection Details

### Step 1: Get Cluster Endpoint

1. **Go to DocumentDB Console** → **Clusters**
2. **Click on your cluster**: `autoscaling-documentdb-cluster`
3. **Note the following information:**
   - **Cluster endpoint**: Something like `autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017`
   - **Reader endpoint**: Something like `autoscaling-documentdb-cluster.cluster-ro-xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017`
   - **Port**: `27017` (default MongoDB port)

### Step 2: Get Connection String

**DocumentDB Connection String Format:**
```
mongodb://<username>:<password>@<cluster-endpoint>:27017/<database-name>?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

**For your setup:**
```
mongodb://admin:your-password@autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017/autoscaling_db?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

**Simplified version (without TLS for testing - NOT recommended for production):**
```
mongodb://admin:your-password@autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017/autoscaling_db
```

---

## Part 7: Download DocumentDB Certificate

### Step 1: Download CA Certificate

DocumentDB requires TLS/SSL connections. You need to download the CA certificate.

1. **Download the certificate bundle:**
```bash
# On your local machine or EC2 instance
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

2. **Or download from AWS:**
   - Go to: https://docs.amazonaws.cn/en_us/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html
   - Download the `rds-combined-ca-bundle.pem` file

3. **Save the certificate:**
   - Save it to your backend directory: `backend/rds-combined-ca-bundle.pem`
   - Or save to: `/etc/ssl/certs/rds-combined-ca-bundle.pem` on your EC2 instance

---

## Part 8: Update Backend Configuration

### Step 1: Update Backend .env File

**On your local machine (for testing) or EC2 instance:**

```bash
cd backend
nano .env
```

**Update the MongoDB connection:**
```env
# DocumentDB Connection
MONGO_URL=mongodb://admin:your-password@autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017/autoscaling_db?tls=true&tlsCAFile=/path/to/rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

# Database Name
DB_NAME=autoscaling_db

# Other configurations...
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Important Notes:**
- Replace `your-password` with your actual DocumentDB master password
- Replace `xxxxxxxxxxxx` with your actual cluster endpoint
- Replace `/path/to/rds-combined-ca-bundle.pem` with the actual path to the certificate file
- The `tls=true` parameter is required for DocumentDB
- The `replicaSet=rs0` parameter is required for DocumentDB
- The `readPreference=secondaryPreferred` helps with read scaling
- The `retryWrites=false` is required for DocumentDB

### Step 2: Install Certificate on EC2 Instance

**When you deploy to EC2:**

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Download certificate
cd /opt/app/backend
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O rds-combined-ca-bundle.pem

# Or copy from local machine
# scp -i your-key.pem rds-combined-ca-bundle.pem ubuntu@your-ec2-ip:/opt/app/backend/
```

### Step 3: Update Python Code (if needed)

**Check if your backend code needs updates for DocumentDB:**

The `motor` library (async MongoDB driver) should work with DocumentDB, but you may need to update the connection string format.

**In `server.py`, the connection should work with:**
```python
from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
```

**If you encounter connection issues, you may need to add SSL options:**
```python
from motor.motor_asyncio import AsyncIOMotorClient
import ssl
import os

mongo_url = os.environ['MONGO_URL']
# DocumentDB requires SSL/TLS
client = AsyncIOMotorClient(
    mongo_url,
    tls=True,
    tlsCAFile='/path/to/rds-combined-ca-bundle.pem',
    retryWrites=False
)
db = client[os.environ['DB_NAME']]
```

---

## Part 9: Test DocumentDB Connection

### Step 1: Test from Local Machine (If in Same VPC)

**If your local machine can access the VPC (via VPN or bastion host):**

```bash
# Install MongoDB client
# On macOS:
brew install mongodb/brew/mongodb-community

# On Ubuntu:
sudo apt install mongodb-clients

# Test connection
mongo "mongodb://admin:your-password@autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017/autoscaling_db?tls=true&tlsCAFile=./rds-combined-ca-bundle.pem&replicaSet=rs0" --ssl
```

### Step 2: Test from EC2 Instance

**SSH into your EC2 instance:**

```bash
# Install MongoDB client
sudo apt update
sudo apt install -y mongodb-clients

# Test connection
mongo "mongodb://admin:your-password@autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017/autoscaling_db?tls=true&tlsCAFile=./rds-combined-ca-bundle.pem&replicaSet=rs0" --ssl

# If connection successful, you should see:
# MongoDB shell version...
# rs0:PRIMARY>
```

**Test basic operations:**
```javascript
// In MongoDB shell
show dbs
use autoscaling_db
db.status_checks.insertOne({test: "connection"})
db.status_checks.find()
```

### Step 3: Test from Python Backend

**On your EC2 instance or local machine:**

```bash
cd backend
source .venv/bin/activate
python3 -c "
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio

async def test_connection():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'autoscaling_db')]
    try:
        # Test connection
        await client.admin.command('ping')
        print('✅ Successfully connected to DocumentDB!')
        
        # List databases
        dbs = await client.list_database_names()
        print(f'📊 Available databases: {dbs}')
        
        # Test collection
        collection = db.status_checks
        count = await collection.count_documents({})
        print(f'📝 Documents in status_checks: {count}')
    except Exception as e:
        print(f'❌ Error: {e}')
    finally:
        client.close()

asyncio.run(test_connection())
"
```

---

## Part 10: Deploy Backend to EC2 with DocumentDB

### Step 1: Launch EC2 Instance in Correct VPC

1. **Go to EC2 Console** → **Launch Instance**

2. **Configure Instance**
   - **Name**: `autoscaling-backend`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: `t3.medium` or `t3.large`
   - **Key Pair**: Your SSH key pair
   - **Network Settings**:
     - **VPC**: Select `documentdb-vpc`
     - **Subnet**: Select `public-subnet-1`
     - **Auto-assign Public IP**: Enable
     - **Security Group**: Select `backend-ec2-sg`
   - **Launch Instance**

### Step 2: Deploy Backend Code

**SSH into EC2:**
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

**Install dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install -y python3.9 python3.9-venv python3-pip git build-essential

# Install MongoDB client (for testing)
sudo apt install -y mongodb-clients
```

**Deploy code:**
```bash
# Clone repository or upload files
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend

# Or upload via SCP from local machine
# scp -r -i your-key.pem backend/ ubuntu@your-ec2-ip:~/

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**Download DocumentDB certificate:**
```bash
cd /home/ubuntu/your-repo/backend
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O rds-combined-ca-bundle.pem
```

**Create .env file:**
```bash
nano .env
```

**Add configuration:**
```env
# DocumentDB Connection
MONGO_URL=mongodb://admin:your-password@autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017/autoscaling_db?tls=true&tlsCAFile=/home/ubuntu/your-repo/backend/rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

DB_NAME=autoscaling_db

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_ASG_NAME=your-autoscaling-group-name

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Optional
CALENDARIFIC_API_KEY=your_api_key
```

**Test connection:**
```bash
# Test MongoDB connection
mongo "mongodb://admin:your-password@autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com:27017/autoscaling_db?tls=true&tlsCAFile=./rds-combined-ca-bundle.pem&replicaSet=rs0" --ssl

# Test Python connection
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    await client.admin.command('ping')
    print('✅ Connected!')
    client.close()

asyncio.run(test())
"
```

**Start backend:**
```bash
# Test run
python -m uvicorn server:app --host 0.0.0.0 --port 8000

# If successful, set up systemd service (see AWS_DEPLOYMENT.md)
```

---

## Part 11: Security Best Practices

### Step 1: Enable Encryption at Rest

1. **Go to DocumentDB Console** → **Clusters**
2. **Select your cluster** → **Modify**
3. **Enable encryption**: Already enabled if you selected it during creation
4. **Apply changes**

### Step 2: Enable Encryption in Transit

- DocumentDB uses TLS/SSL by default
- Always use `tls=true` in connection strings
- Always provide the CA certificate file

### Step 3: Restrict Network Access

1. **Update Security Group** (`documentdb-sg`)
   - Only allow access from `backend-ec2-sg`
   - Remove any rules allowing access from `0.0.0.0/0`

### Step 4: Use IAM Database Authentication (Optional)

1. **Enable IAM Authentication** in DocumentDB cluster settings
2. **Create IAM policy** for database access
3. **Create IAM user** and attach policy
4. **Generate auth token** for connections

### Step 5: Regular Backups

- DocumentDB automatically creates backups
- Set appropriate backup retention period (7+ days for production)
- Test restore procedures regularly

### Step 6: Monitor and Alert

1. **Enable CloudWatch Monitoring**
2. **Set up CloudWatch Alarms** for:
   - CPU utilization
   - Memory usage
   - Connection count
   - Database errors

---

## Part 12: Troubleshooting

### Issue 1: Cannot Connect to DocumentDB

**Symptoms:** Connection timeout or "Network unreachable"

**Solutions:**
1. **Check Security Group Rules**
   - Verify `documentdb-sg` allows port 27017 from `backend-ec2-sg`
   - Verify both security groups are in the same VPC

2. **Check Network Configuration**
   - Verify EC2 instance is in the same VPC as DocumentDB
   - Verify DocumentDB is in private subnets
   - Verify route tables are correct

3. **Test from EC2 Instance**
   ```bash
   # Test network connectivity
   telnet autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com 27017
   
   # Test DNS resolution
   nslookup autoscaling-documentdb-cluster.xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com
   ```

### Issue 2: SSL/TLS Connection Errors

**Symptoms:** "SSL handshake failed" or "certificate verification failed"

**Solutions:**
1. **Verify Certificate File**
   - Ensure `rds-combined-ca-bundle.pem` exists
   - Verify file path in connection string is correct
   - Check file permissions: `chmod 644 rds-combined-ca-bundle.pem`

2. **Verify Connection String**
   - Ensure `tls=true` is included
   - Ensure `tlsCAFile` path is correct
   - Ensure `replicaSet=rs0` is included

### Issue 3: Authentication Failed

**Symptoms:** "Authentication failed" or "Invalid credentials"

**Solutions:**
1. **Verify Credentials**
   - Check username and password in connection string
   - Verify master username matches cluster configuration
   - Reset password if needed (DocumentDB Console → Modify)

2. **Check Database Name**
   - Verify database name exists or can be created
   - DocumentDB will create the database automatically on first connection

### Issue 4: High Latency or Slow Queries

**Solutions:**
1. **Check Instance Size**
   - Consider upgrading to larger instance class
   - Monitor CloudWatch metrics for CPU and memory

2. **Optimize Queries**
   - Add indexes to frequently queried fields
   - Use connection pooling
   - Consider read replicas for read-heavy workloads

3. **Network Optimization**
   - Ensure EC2 and DocumentDB are in same region
   - Use VPC endpoints for better performance

### Issue 5: Connection Pool Exhausted

**Symptoms:** "Too many connections" errors

**Solutions:**
1. **Increase Connection Limit**
   - Upgrade to larger instance class
   - DocumentDB connection limit is based on instance class

2. **Implement Connection Pooling**
   - Use connection pooling in your application
   - Close connections properly
   - Reuse connections where possible

---

## Part 13: Monitoring DocumentDB

### Step 1: Enable Enhanced Monitoring

1. **Go to DocumentDB Console** → **Clusters**
2. **Select your cluster** → **Monitoring** tab
3. **Enable Enhanced Monitoring** (optional, adds cost)

### Step 2: Set Up CloudWatch Alarms

1. **Go to CloudWatch** → **Alarms** → **Create Alarm**

2. **Create Alarms for:**
   - **CPU Utilization**: Alarm if > 80% for 5 minutes
   - **Database Connections**: Alarm if > 80% of max connections
   - **Freeable Memory**: Alarm if < 1GB
   - **Read Latency**: Alarm if > 100ms
   - **Write Latency**: Alarm if > 100ms

### Step 3: Monitor Key Metrics

**Important CloudWatch Metrics:**
- `CPUUtilization`: CPU usage percentage
- `DatabaseConnections`: Number of database connections
- `FreeableMemory`: Available memory
- `ReadLatency`: Average read latency
- `WriteLatency`: Average write latency
- `ReadIOPS`: Read operations per second
- `WriteIOPS`: Write operations per second

---

## Part 14: Cost Optimization

### DocumentDB Pricing

**Instance Classes:**
- `db.t3.medium`: ~$90/month (2 vCPU, 4GB RAM) - Good for dev/test
- `db.r5.large`: ~$250/month (2 vCPU, 16GB RAM) - Good for production
- `db.r5.xlarge`: ~$500/month (4 vCPU, 32GB RAM) - For high traffic

**Storage:**
- $0.10 per GB/month for storage
- $0.20 per GB for I/O requests

**Backup:**
- Included backup storage: 100% of allocated storage
- Additional backup storage: $0.095 per GB/month

### Cost Optimization Tips

1. **Right-Size Instances**
   - Start with smaller instances and scale up as needed
   - Use CloudWatch metrics to guide sizing decisions

2. **Use Reserved Instances**
   - Save up to 52% with 1-year Reserved Instances
   - Save up to 68% with 3-year Reserved Instances

3. **Optimize Storage**
   - Delete unnecessary backups
   - Adjust backup retention period based on needs

4. **Monitor Costs**
   - Set up AWS Cost Explorer
   - Set up billing alerts
   - Review monthly costs regularly

---

## Part 15: Quick Reference

### Connection String Template

```
mongodb://<username>:<password>@<cluster-endpoint>:27017/<database-name>?tls=true&tlsCAFile=/path/to/rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

### Important Ports

- **27017**: MongoDB/DocumentDB default port
- **443**: HTTPS (for AWS Console)
- **22**: SSH (for EC2 access)

### Important Files

- **Certificate**: `rds-combined-ca-bundle.pem`
- **Connection String**: Stored in `.env` file as `MONGO_URL`
- **Security Groups**: `documentdb-sg` and `backend-ec2-sg`

### Common Commands

```bash
# Test connection
mongo "mongodb://admin:password@cluster-endpoint:27017/dbname?tls=true&tlsCAFile=./rds-combined-ca-bundle.pem&replicaSet=rs0" --ssl

# Download certificate
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O rds-combined-ca-bundle.pem

# Test from Python
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; client = AsyncIOMotorClient(os.environ['MONGO_URL']); print('Connected')"
```

---

## Checklist

### Setup Complete
- [ ] VPC and subnets created
- [ ] DB subnet group created
- [ ] Security groups configured
- [ ] DocumentDB cluster created
- [ ] Certificate downloaded
- [ ] Backend .env file updated
- [ ] Connection tested
- [ ] Backend deployed to EC2
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Security hardened

### Next Steps
- [ ] Deploy frontend to S3 + CloudFront
- [ ] Set up Auto Scaling Group
- [ ] Configure Load Balancer
- [ ] Set up domain and SSL
- [ ] Configure monitoring and alerts
- [ ] Test end-to-end functionality

---

## Support Resources

- [DocumentDB User Guide](https://docs.aws.amazon.com/documentdb/latest/developerguide/)
- [DocumentDB Best Practices](https://docs.aws.amazon.com/documentdb/latest/developerguide/best-practices.html)
- [DocumentDB Pricing](https://aws.amazon.com/documentdb/pricing/)
- [MongoDB Compatibility](https://docs.aws.amazon.com/documentdb/latest/developerguide/mongo-apis.html)

---

**You're all set!** Your DocumentDB cluster is now ready to use with your backend application.

