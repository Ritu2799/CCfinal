# 🚀 Complete AWS Deployment Guide for Beginners

**Step-by-step guide to deploy your AI Predictive Autoscaling System on AWS - No prior AWS knowledge required!**

---

## 📚 Table of Contents

1. [Understanding What We're Building](#understanding-what-were-building)
2. [Part 0: AWS Account Setup](#part-0-aws-account-setup)
3. [Part 1: Database Setup (MongoDB)](#part-1-database-setup-mongodb)
4. [Part 2: Backend Server Setup (EC2)](#part-2-backend-server-setup-ec2)
5. [Part 3: Frontend Setup (S3 + CloudFront)](#part-3-frontend-setup-s3--cloudfront)
6. [Part 4: Testing Your Deployment](#part-4-testing-your-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Understanding What We're Building

### What is AWS?
AWS (Amazon Web Services) is like renting a computer in the cloud. Instead of buying a physical server, you rent one from Amazon that runs on the internet.

### What We're Deploying:
- **Backend Server**: The brain of your application (runs on EC2 - a virtual computer)
- **Frontend Website**: What users see (stored on S3 - like a storage box, delivered via CloudFront - like a fast delivery service)
- **Database**: Where data is stored (MongoDB Atlas or DocumentDB)

### AWS Services We'll Use:
1. **EC2**: Virtual computer to run your backend code
2. **S3**: Storage for your frontend files
3. **CloudFront**: Fast content delivery network
4. **DocumentDB** (optional): Database service
5. **SNS** (optional): For SMS/email notifications

---

## Part 0: AWS Account Setup

### Step 1: Create AWS Account

1. **Go to AWS Website**
   - Open your web browser
   - Go to: https://aws.amazon.com/
   - Click the **"Create an AWS Account"** button (top right)

2. **Sign Up Process**
   - Enter your email address
   - Choose a password
   - Choose an account name (e.g., "My Autoscaling App")
   - Click **"Continue"**

3. **Contact Information**
   - Fill in your name, phone number, and address
   - Click **"Create Account and Continue"**

4. **Payment Information**
   - Enter credit/debit card details
   - **Don't worry**: AWS Free Tier gives you $300 credit for 12 months
   - You won't be charged unless you exceed free tier limits
   - Click **"Secure Submit"**

5. **Phone Verification**
   - AWS will call you with a verification code
   - Enter the code when prompted
   - Click **"Continue"**

6. **Support Plan Selection**
   - Choose **"Basic Plan"** (Free) - this is fine for learning
   - Click **"Complete sign up"**

7. **Wait for Account Activation**
   - Usually takes a few minutes
   - You'll receive an email when ready

### Step 2: Sign In to AWS Console

1. **Go to AWS Console**
   - Visit: https://console.aws.amazon.com/
   - Click **"Sign in to the Console"**

2. **Enter Credentials**
   - Enter your email/account ID
   - Enter your password
   - Click **"Sign in"**

3. **Select Region**
   - In the top right, you'll see a region dropdown (e.g., "US East (N. Virginia)")
   - **Important**: Choose a region close to you:
     - **US**: `us-east-1` (N. Virginia) or `us-west-2` (Oregon)
     - **India**: `ap-south-1` (Mumbai)
     - **Europe**: `eu-west-1` (Ireland)
   - **Note**: Write down your region - you'll need it later!

### Step 3: Understand AWS Console

**What you'll see:**
- **Top bar**: Search box, region selector, account info
- **Left sidebar**: List of AWS services
- **Main area**: Service dashboards

**Key Services We'll Use:**
- **EC2**: Find it by typing "EC2" in the search box
- **S3**: Find it by typing "S3" in the search box
- **CloudFront**: Find it by typing "CloudFront" in the search box

---

## Part 1: Database Setup (MongoDB)

You have two options. Choose the one that fits your needs:

**Option A: MongoDB Atlas** 
- ✅ **FREE** (free tier available)
- ✅ Easier to set up
- ✅ No AWS-specific configuration needed
- ✅ Good for beginners and small projects

**Option B: AWS DocumentDB**
- ⚠️ **Costs money** (~$200-300/month)
- ✅ Fully managed by AWS
- ✅ Better integration with AWS services
- ✅ Good for production workloads
- ⚠️ Requires certificate file setup

**Recommendation**: Start with **Option A (MongoDB Atlas)** if you're learning. Use **Option B (DocumentDB)** if you need AWS-native database or have budget for production.

### Option A: MongoDB Atlas (Recommended - FREE & Easy)

#### Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Click **"Try Free"** or **"Sign Up"**

2. **Sign Up**
   - Enter your email
   - Create a password
   - Click **"Create your Atlas account"**

3. **Verify Email**
   - Check your email for verification link
   - Click the link to verify

#### Step 2: Create Free Cluster

1. **Choose Setup Type**
   - Select **"Build a Database"** (free tier)

2. **Choose Cloud Provider**
   - Select **AWS** (recommended)
   - Choose the **same region** as your AWS account (e.g., `ap-south-1` for Mumbai)

3. **Choose Cluster Tier**
   - Select **M0 Sandbox** (FREE tier)
   - Click **"Create"**

4. **Wait for Cluster Creation**
   - Takes 3-5 minutes
   - You'll see "Your cluster is being created..."

#### Step 3: Create Database User

1. **Database Access Page**
   - In the left sidebar, click **"Database Access"**
   - Click **"Add New Database User"**

2. **Authentication Method**
   - Select **"Password"**

3. **User Details**
   - **Username**: Enter a username (e.g., `admin` or `appuser`)
   - **Password**: Click **"Autogenerate Secure Password"** OR create your own
   - **⚠️ IMPORTANT**: Copy and save the password! You won't see it again!

4. **User Privileges**
   - Select **"Read and write to any database"**
   - Click **"Add User"**

#### Step 4: Configure Network Access

1. **Network Access Page**
   - In the left sidebar, click **"Network Access"**
   - Click **"Add IP Address"**

2. **Add IP Address**
   - For now, click **"Allow Access from Anywhere"**
     - This adds `0.0.0.0/0` (allows all IPs)
   - **Note**: For production, you should restrict this to specific IPs
   - Click **"Confirm"**

#### Step 5: Get Connection String

1. **Go to Clusters**
   - In the left sidebar, click **"Database"** or **"Clusters"**
   - You'll see your cluster (e.g., "Cluster0")

2. **Connect to Cluster**
   - Click the **"Connect"** button on your cluster

3. **Choose Connection Method**
   - Click **"Connect your application"**

4. **Copy Connection String**
   - You'll see a connection string like:
     ```
     mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **Replace `<password>`** with the password you saved in Step 3
   - **Add database name** at the end:
     ```
     mongodb+srv://username:YourPassword@cluster0.xxxxx.mongodb.net/autoscaling_db?retryWrites=true&w=majority
     ```
   - **Copy the complete string** - you'll need it later!

5. **Save Your Connection String**
   - Save it in a text file or password manager
   - Format: `MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/autoscaling_db?retryWrites=true&w=majority`

**✅ Database Setup Complete!**

---

### Option B: AWS DocumentDB (If You Prefer AWS Native Database)

**Note**: DocumentDB is not free (costs ~$200-300/month), but it's fully managed by AWS and integrates well with other AWS services.

#### Step 1: Create DocumentDB Cluster

1. **Go to DocumentDB Console**
   - In AWS Console, search for **"DocumentDB"**
   - Click **"Amazon DocumentDB"** service

2. **Create Cluster**
   - Click orange **"Create cluster"** button

3. **Cluster Configuration**
   - **Cluster identifier**: Type `autoscaling-db-cluster`
   - **Engine version**: Keep default (latest)
   - **Instance class**: 
     - **Minimum**: `db.t3.medium` (~$200/month)
     - **For testing**: `db.t4g.medium` (cheaper option if available)
   - **Number of instances**: `1` (for development) or `3` (for production)
   - **Master username**: Enter username (e.g., `admin` or `ritesh`)
   - **Master password**: Create a strong password
     - **⚠️ IMPORTANT**: Save this password! You'll need it for connection string!
   - **Confirm password**: Re-enter the same password

4. **Network Settings**
   - **VPC**: Select your VPC (or use default VPC)
   - **Subnet group**: 
     - If you see an existing one, select it
     - Otherwise, DocumentDB will create one automatically
   - **Availability zone**: Leave default (or choose specific AZ)
   - **VPC security group**: 
     - Select **"Create new"**
     - **Security group name**: `documentdb-sg`
     - **Description**: `Security group for DocumentDB cluster`

5. **Backup**
   - **Backup retention period**: `7 days` (or your preference)
   - **Backup window**: Leave default
   - **Enable encryption**: Recommended (check the box)

6. **Maintenance**
   - **Maintenance window**: Leave default

7. **Create Cluster**
   - Click **"Create cluster"** button (bottom)
   - **Wait 10-15 minutes** for cluster creation
   - You'll see status: "Creating" → "Available"

#### Step 2: Configure Security Group

1. **Go to Security Groups**
   - In AWS Console, search for **"VPC"** or **"EC2"**
   - Click **"Security Groups"** (left sidebar)

2. **Find Your DocumentDB Security Group**
   - Look for `documentdb-sg` (or the name you created)
   - Click on it

3. **Edit Inbound Rules**
   - Click **"Edit inbound rules"** tab
   - Click **"Add rule"**

4. **Add Rule for EC2 Access**
   - **Type**: Select **"Custom TCP"**
   - **Port**: `27017` (MongoDB default port)
   - **Source**: 
     - **Option 1**: Select **"Custom"** and enter your EC2 security group ID
       - To find it: EC2 Console → Your Instance → Security tab → Security group ID
     - **Option 2**: Select **"My IP"** (for testing from your computer)
     - **Option 3**: Enter your VPC CIDR (e.g., `10.0.0.0/16`)
   - **Description**: `Allow access from EC2 instances`
   - Click **"Save rules"**

#### Step 3: Download Certificate File

DocumentDB requires a certificate file for secure connections.

**On your EC2 instance (after you create it):**

```bash
# Download the global certificate bundle
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Verify download
ls -la global-bundle.pem

# Move to a safe location (optional)
mkdir -p ~/certs
mv global-bundle.pem ~/certs/
```

**Or download on your local computer first:**

1. **Download Certificate**
   - Visit: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   - Or use command: `wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem`
   - Save the file as `global-bundle.pem`

2. **Upload to EC2 Later**
   - We'll upload this when we set up the backend

#### Step 4: Get Connection String

1. **Go to DocumentDB Clusters**
   - In DocumentDB Console, click **"Clusters"** (left sidebar)
   - You'll see your cluster: `autoscaling-db-cluster`

2. **Get Endpoint**
   - Click on your cluster name
   - Scroll to **"Connectivity & security"** section
   - Copy the **"Endpoint"** (e.g., `autoscaling-db-cluster.cluster-xxxxx.docdb.amazonaws.com`)
   - **Note**: This is your cluster endpoint!

3. **Build Connection String**
   - Format:
     ```
     mongodb://username:password@endpoint:27017/?tls=true&tlsCAFile=/path/to/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
     ```
   - **Example** (replace with your actual values):
     ```
     mongodb://ritesh:YourPassword@autoscaling-db-cluster.cluster-croa2u86k3y9.ap-south-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=/home/ubuntu/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
     ```

4. **Connection String Components Explained:**
   - `mongodb://` - Protocol
   - `ritesh` - Your master username
   - `YourPassword` - Your master password (replace this!)
   - `autoscaling-db-cluster.cluster-xxxxx.docdb.amazonaws.com` - Your cluster endpoint
   - `27017` - Port (MongoDB default)
   - `tls=true` - Enable TLS/SSL (required for DocumentDB)
   - `tlsCAFile=/path/to/global-bundle.pem` - Path to certificate file
   - `replicaSet=rs0` - DocumentDB replica set name
   - `readPreference=secondaryPreferred` - Read from secondary if available
   - `retryWrites=false` - Required for DocumentDB

5. **Save Your Connection String**
   - Save it in a text file
   - Format: `MONGO_URL=mongodb://username:password@endpoint:27017/?tls=true&tlsCAFile=/path/to/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`
   - **⚠️ Important**: Replace `YourPassword` with your actual password!

#### Step 5: Test Connection (Optional)

**After you set up your EC2 instance, you can test the connection:**

```bash
# Install MongoDB client tools (optional)
sudo apt install mongodb-database-tools -y

# Test connection (replace with your connection string)
mongosh "mongodb://ritesh:YourPassword@your-endpoint:27017/?tls=true&tlsCAFile=/home/ubuntu/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
```

**✅ DocumentDB Setup Complete!**

**Important Notes:**
- DocumentDB costs money (~$200-300/month for db.t3.medium)
- Make sure your EC2 security group can access DocumentDB (port 27017)
- Keep your certificate file (`global-bundle.pem`) safe - you'll need it for connections
- Your connection string will be used in the backend `.env` file

---

## Part 2: Backend Server Setup (EC2)

This is the most important part. We'll create a virtual computer (EC2 instance) to run your backend code.

### Step 1: Launch EC2 Instance

#### 1.1: Open EC2 Console

1. **Search for EC2**
   - In AWS Console, type **"EC2"** in the search box (top)
   - Click on **"EC2"** service

2. **EC2 Dashboard**
   - You'll see the EC2 dashboard
   - Click the orange **"Launch Instance"** button (top right)

#### 1.2: Name Your Instance

1. **Name and Tags**
   - In the **"Name"** field, type: `autoscaling-backend`
   - This helps you identify it later

#### 1.3: Choose Operating System (AMI)

1. **Application and OS Images**
   - You'll see different operating systems
   - **Recommended**: Click **"Ubuntu"**
   - Select **"Ubuntu Server 22.04 LTS"** (free tier eligible)
   - **Why Ubuntu?** It's easy to use and well-documented

#### 1.4: Choose Instance Type

1. **Instance Type**
   - This determines how powerful your virtual computer is
   - **For Free Tier**: Select **"t2.micro"** (FREE for 12 months)
   - **For Production**: Select **"t3.medium"** or **"t3.small"** (costs ~$15-30/month)
   - Click on the instance type to select it

2. **What Each Type Means:**
   - **t2.micro**: 1 CPU, 1GB RAM (FREE, good for testing)
   - **t3.small**: 2 CPU, 2GB RAM (~$15/month, minimum for production)
   - **t3.medium**: 2 CPU, 4GB RAM (~$30/month, recommended for production)

#### 1.5: Create Key Pair (SSH Access)

**What is a Key Pair?**
- Like a password to access your server
- You download a file (.pem) that acts as your key

1. **Key Pair Settings**
   - Find the **"Key pair (login)"** section
   - Click **"Create new key pair"**

2. **Key Pair Details**
   - **Name**: Type `autoscaling-backend-key` (or any name you like)
   - **Key pair type**: Select **"RSA"**
   - **Private key file format**: 
     - **macOS/Linux**: Select **".pem"**
     - **Windows**: Select **".ppk"** (for PuTTY) or **".pem"** (for WSL/Git Bash)
   - Click **"Create key pair"**

3. **Download Key File**
   - A file will automatically download (e.g., `autoscaling-backend-key.pem`)
   - **⚠️ CRITICAL**: Save this file in a safe place!
   - **You cannot download it again!**
   - **Recommended location**: 
     - macOS/Linux: `~/.ssh/autoscaling-backend-key.pem`
     - Windows: `C:\Users\YourName\.ssh\autoscaling-backend-key.pem`

4. **Set Permissions (macOS/Linux only)**
   ```bash
   # Open Terminal and run:
   chmod 400 ~/.ssh/autoscaling-backend-key.pem
   ```
   - This makes the key file secure (only you can read it)

#### 1.6: Configure Network Settings

**What are Security Groups?**
- Like a firewall - controls what traffic can reach your server

1. **Network Settings Section**
   - Scroll down to **"Network settings"**
   - Click **"Edit"** button

2. **Configure Firewall Rules**

   **Rule 1: SSH (to access your server)**
   - Click **"Add security group rule"**
   - **Type**: Select **"SSH"**
   - **Port**: Should auto-fill to `22`
   - **Source type**: Select **"My IP"** (this automatically adds your current IP)
   - **Description**: `Allow SSH from my computer`

   **Rule 2: HTTP (for web traffic)**
   - Click **"Add security group rule"** again
   - **Type**: Select **"HTTP"**
   - **Port**: Should auto-fill to `80`
   - **Source type**: Select **"Anywhere-IPv4"** (this adds `0.0.0.0/0`)
   - **Description**: `Allow HTTP from anywhere`

   **Rule 3: HTTPS (for secure web traffic)**
   - Click **"Add security group rule"** again
   - **Type**: Select **"HTTPS"**
   - **Port**: Should auto-fill to `443`
   - **Source type**: Select **"Anywhere-IPv4"**
   - **Description**: `Allow HTTPS from anywhere`

   **Rule 4: Custom Port 8000 (for your backend API)**
   - Click **"Add security group rule"** again
   - **Type**: Select **"Custom TCP"**
   - **Port**: Type `8000`
   - **Source type**: Select **"Anywhere-IPv4"** (or **"My IP"** for more security)
   - **Description**: `Allow backend API on port 8000`

3. **⚠️ Important Notes:**
   - **SSH (port 22)**: Only allow from "My IP" for security
   - **HTTP/HTTPS (80/443)**: Allow from anywhere so users can access your website
   - **Port 8000**: Your backend API port

#### 1.7: Configure Storage

1. **Configure Storage Section**
   - Scroll to **"Configure storage"**
   - **Volume size**: Change to `20` GB (minimum recommended)
   - **Volume type**: Keep **"gp3"** (General Purpose SSD)
   - **Delete on termination**: Leave checked (deletes storage when instance is deleted)

#### 1.8: Launch Instance

1. **Review Summary**
   - Scroll to the bottom
   - Review your settings:
     - Name: `autoscaling-backend`
     - AMI: Ubuntu 22.04
     - Instance type: t2.micro (or t3.small)
     - Key pair: Your key name
     - Security groups: 4 rules (SSH, HTTP, HTTPS, Custom 8000)

2. **Launch**
   - Click the orange **"Launch Instance"** button (bottom right)

3. **Success Message**
   - You'll see: "Successfully initiated launch of instance..."
   - Click **"View all instances"** (bottom right)

#### 1.9: Wait for Instance to Start

1. **Instance Status**
   - You'll see your instance in a table
   - **Instance State**: Will show "Pending" → "Running" (takes 1-2 minutes)
   - **Status Checks**: Will show "Initializing" → "2/2 checks passed"

2. **Get Your Instance Details**
   - Once status is **"Running"**, note these details:
     - **Instance ID**: e.g., `i-1234567890abcdef0`
     - **Public IPv4 address**: e.g., `54.123.45.67` (this is your server's address!)
     - **IPv4 DNS**: e.g., `ec2-54-123-45-67.compute-1.amazonaws.com`

3. **Save These Details**
   - Write down your **Public IPv4 address** - you'll need it to connect!

**✅ EC2 Instance Created!**

---

### Step 2: Connect to Your EC2 Instance

Now we'll connect to your server and set it up.

#### 2.1: Connect via SSH (macOS/Linux)

1. **Open Terminal**
   - On macOS: Press `Cmd + Space`, type "Terminal", press Enter
   - On Linux: Press `Ctrl + Alt + T`

2. **Navigate to Key File Location**
   ```bash
   cd ~/.ssh
   # Or wherever you saved your .pem file
   ```

3. **Connect to Instance**
   ```bash
   ssh -i autoscaling-backend-key.pem ubuntu@YOUR_PUBLIC_IP
   ```
   - Replace `YOUR_PUBLIC_IP` with your actual Public IPv4 address
   - Example: `ssh -i autoscaling-backend-key.pem ubuntu@54.123.45.67`

4. **First Time Connection**
   - You'll see: "The authenticity of host... Are you sure you want to continue?"
   - Type: `yes` and press Enter

5. **You're In!**
   - You should see: `ubuntu@ip-xxx-xxx-xxx-xxx:~$`
   - This means you're connected to your server!

#### 2.2: Connect via SSH (Windows)

**Option A: Using Windows Subsystem for Linux (WSL)**
1. Install WSL if not installed
2. Open WSL terminal
3. Follow macOS/Linux instructions above

**Option B: Using PuTTY**
1. Download PuTTY: https://www.putty.org/
2. Convert .pem to .ppk using PuTTYgen:
   - Open PuTTYgen
   - Click "Load" → Select your .pem file
   - Click "Save private key" → Save as .ppk
3. Open PuTTY:
   - **Host Name**: `ubuntu@YOUR_PUBLIC_IP`
   - **Port**: `22`
   - **Connection Type**: SSH
   - **Auth**: Browse and select your .ppk file
   - Click "Open"

#### 2.3: Update System

Once connected, run these commands:

```bash
# Update package list
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# This may take a few minutes
```

---

### Step 3: Install Required Software

Run these commands one by one:

```bash
# Install Python 3.10 and pip
sudo apt install python3.10 python3.10-venv python3-pip -y

# Install Git (to clone your code)
sudo apt install git -y

# Install Nginx (web server for reverse proxy)
sudo apt install nginx -y

# Install build tools (needed for some Python packages)
sudo apt install build-essential -y

# Verify installations
python3 --version  # Should show Python 3.10.x
git --version      # Should show git version
nginx -v           # Should show nginx version
```

---

### Step 4: Upload Your Backend Code

You have two options:

#### Option A: Clone from GitHub (Recommended)

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual GitHub URL)
git clone https://github.com/your-username/your-repo-name.git

# Navigate to backend directory
cd your-repo-name/backend

# List files to verify
ls -la
```

#### Option B: Upload Files via SCP (from your local computer)

**On your local computer (in a new terminal):**

```bash
# Navigate to your project directory
cd /path/to/your/project

# Upload backend folder to EC2
scp -i ~/.ssh/autoscaling-backend-key.pem -r backend/ ubuntu@YOUR_PUBLIC_IP:~/

# Replace YOUR_PUBLIC_IP with your actual IP
```

**Then on EC2:**

```bash
# Navigate to uploaded files
cd ~/backend
```

---

### Step 5: Download DocumentDB Certificate (If Using DocumentDB)

**Only do this if you're using DocumentDB (Option B from Part 1). Skip if using MongoDB Atlas.**

```bash
# Download the global certificate bundle
cd ~
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Verify download
ls -la global-bundle.pem

# You should see the file listed
# The file will be at: /home/ubuntu/global-bundle.pem
```

**Note**: Remember this path (`/home/ubuntu/global-bundle.pem`) - you'll need it in your connection string!

---

### Step 6: Set Up Python Environment

```bash
# Make sure you're in the backend directory
cd ~/your-repo-name/backend
# OR
cd ~/backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# You should see (.venv) in your prompt now
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# This will take 5-10 minutes, be patient!
```

---

### Step 7: Configure Environment Variables

```bash
# Create .env file
nano .env
```

**In the nano editor, paste this (replace with your actual values):**

**If using MongoDB Atlas:**
```env
# MongoDB Atlas Connection (use the connection string from Part 1, Option A)
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/autoscaling_db?retryWrites=true&w=majority
DB_NAME=autoscaling_db
```

**If using AWS DocumentDB:**
```env
# AWS DocumentDB Connection (use the connection string from Part 1, Option B)
# Make sure global-bundle.pem is in /home/ubuntu/global-bundle.pem (or update the path)
MONGO_URL=mongodb://ritesh:YourPassword@autoscaling-db-cluster.cluster-xxxxx.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=/home/ubuntu/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
DB_NAME=autoscaling_db
```

**Common settings (use for both MongoDB Atlas and DocumentDB):**
```env

# AWS Configuration (optional - for auto-scaling)
# Get these from AWS Console → IAM → Users → Security Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_ASG_NAME=your-autoscaling-group-name

# CORS Configuration (your frontend URL - we'll update this later)
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Optional: Calendarific API
CALENDARIFIC_API_KEY=your_api_key_here
```

**To save and exit nano:**
1. Press `Ctrl + X`
2. Press `Y` to confirm
3. Press `Enter` to save

**Verify the file was created:**
```bash
cat .env
```

---

### Step 8: Test Backend Locally

```bash
# Make sure virtual environment is activated
source .venv/bin/activate

# Start the server
python -m uvicorn server:app --host 0.0.0.0 --port 8000

# You should see: "Application startup complete"
# Keep this terminal open!
```

**Test from your local computer:**
```bash
# Open a new terminal on your local computer
curl http://YOUR_PUBLIC_IP:8000/api/health

# Replace YOUR_PUBLIC_IP with your EC2 public IP
# You should see a JSON response with "status": "healthy"
```

**If it works, press `Ctrl + C` to stop the server.**

---

### Step 9: Set Up Backend as a Service (Auto-Start)

We'll configure the backend to start automatically when the server reboots.

```bash
# Create systemd service file
sudo nano /etc/systemd/system/autoscaling-backend.service
```

**Paste this content (adjust paths if needed):**

```ini
[Unit]
Description=AI Predictive Autoscaling Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/your-repo-name/backend
Environment="PATH=/home/ubuntu/your-repo-name/backend/.venv/bin"
ExecStart=/home/ubuntu/your-repo-name/backend/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Important**: Replace `/home/ubuntu/your-repo-name/backend` with your actual path!

**Save and exit** (Ctrl+X, Y, Enter)

**Enable and start the service:**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable autoscaling-backend

# Start the service
sudo systemctl start autoscaling-backend

# Check status
sudo systemctl status autoscaling-backend

# You should see "active (running)" in green
```

**View logs:**
```bash
# View real-time logs
sudo journalctl -u autoscaling-backend -f

# Press Ctrl+C to exit logs
```

---

### Step 10: Set Up Nginx Reverse Proxy

Nginx will forward requests from port 80/443 to your backend on port 8000.

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/autoscaling-backend
```

**Paste this:**

```nginx
server {
    listen 80;
    server_name YOUR_PUBLIC_IP_OR_DOMAIN;

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

**Replace `YOUR_PUBLIC_IP_OR_DOMAIN` with your EC2 public IP or domain name.**

**Enable the site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/autoscaling-backend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Should see: "syntax is ok" and "test is successful"

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

**Test your backend through Nginx:**

```bash
# From your local computer
curl http://YOUR_PUBLIC_IP/api/health

# Should return JSON response
```

**✅ Backend is now running and accessible!**

---

## Part 3: Frontend Setup (S3 + CloudFront)

Now we'll deploy your React frontend to AWS S3 and CloudFront.

### Step 1: Build Frontend for Production

**On your local computer:**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
yarn install
# OR
npm install

# Create .env file for production
echo "REACT_APP_BACKEND_URL=http://YOUR_PUBLIC_IP" > .env
# Replace YOUR_PUBLIC_IP with your EC2 public IP

# Build for production
yarn build
# OR
npm run build

# This creates a 'build' folder with production files
```

---

### Step 2: Create S3 Bucket

1. **Go to S3 Console**
   - In AWS Console, search for **"S3"**
   - Click **"S3"** service

2. **Create Bucket**
   - Click orange **"Create bucket"** button

3. **General Configuration**
   - **Bucket name**: Enter a unique name (e.g., `my-autoscaling-frontend-2025`)
     - **Rules**: 
       - Must be globally unique (no one else can have this name)
       - Only lowercase letters, numbers, and hyphens
       - Must start and end with letter or number
   - **AWS Region**: Select the **same region** as your EC2 instance

4. **Object Ownership**
   - Keep default: **"ACLs disabled"**

5. **Block Public Access Settings**
   - **⚠️ IMPORTANT**: Uncheck **"Block all public access"**
   - Check the warning box to acknowledge
   - **Why?** We need public read access for the website

6. **Bucket Versioning**
   - **Enable versioning**: Optional (recommended for production)

7. **Default Encryption**
   - Keep default settings

8. **Create Bucket**
   - Click **"Create bucket"** (bottom)
   - You'll see: "Successfully created bucket"

---

### Step 3: Configure S3 for Static Website Hosting

1. **Select Your Bucket**
   - Click on your bucket name

2. **Properties Tab**
   - Click **"Properties"** tab (top)

3. **Static Website Hosting**
   - Scroll to **"Static website hosting"**
   - Click **"Edit"**

4. **Enable Static Website Hosting**
   - **Static website hosting**: Select **"Enable"**
   - **Hosting type**: Select **"Host a static website"**
   - **Index document**: Type `index.html`
   - **Error document**: Type `index.html` (for React Router)
   - Click **"Save changes"**

5. **Note the Website Endpoint**
   - You'll see a URL like: `http://bucket-name.s3-website-region.amazonaws.com`
   - Save this URL - you'll need it later!

---

### Step 4: Set Bucket Policy (Allow Public Access)

1. **Permissions Tab**
   - Click **"Permissions"** tab

2. **Bucket Policy**
   - Scroll to **"Bucket policy"**
   - Click **"Edit"**

3. **Add Policy**
   - Click **"Policy generator"** (or paste directly)

4. **Policy JSON** (replace `your-bucket-name` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

5. **Save Policy**
   - Click **"Save changes"**

---

### Step 5: Upload Frontend Files to S3

1. **Objects Tab**
   - Click **"Objects"** tab

2. **Upload Files**
   - Click **"Upload"** button

3. **Add Files**
   - Click **"Add files"** or drag and drop
   - Navigate to your `frontend/build/` folder
   - Select **ALL files and folders** inside `build/`
   - Click **"Upload"**

4. **Upload Settings**
   - **Permissions**: 
     - **Predefined ACLs**: Select **"Grant public-read access"**
   - Click **"Upload"** (bottom)

5. **Wait for Upload**
   - You'll see progress bars
   - Wait for "Upload succeeded" message

---

### Step 6: Test S3 Website

1. **Get Website URL**
   - Go to **Properties** tab
   - Scroll to **"Static website hosting"**
   - Copy the **"Bucket website endpoint"** URL

2. **Open in Browser**
   - Paste the URL in your browser
   - Your frontend should load!

**✅ Frontend is now on S3!**

---

### Step 7: Set Up CloudFront (Optional but Recommended)

CloudFront makes your website load faster worldwide.

1. **Go to CloudFront**
   - Search for **"CloudFront"** in AWS Console
   - Click **"CloudFront"**

2. **Create Distribution**
   - Click **"Create distribution"**

3. **Origin Settings**
   - **Origin domain**: 
     - Click the dropdown
     - Select your S3 bucket (the one ending with `.s3-website-...`)
     - **Important**: Choose the website endpoint, not the regular S3 endpoint!
   - **Origin path**: Leave empty
   - **Name**: Auto-filled (leave as is)

4. **Default Cache Behavior**
   - **Viewer protocol policy**: Select **"Redirect HTTP to HTTPS"**
   - **Allowed HTTP methods**: Select **"GET, HEAD, OPTIONS"**
   - **Cache policy**: Select **"CachingOptimized"**

5. **Distribution Settings**
   - **Price class**: Select based on your needs (cheapest: "Use only North America and Europe")
   - **Alternate domain names (CNAMEs)**: Leave empty (unless you have a domain)
   - **Default root object**: Type `index.html`
   - **Custom SSL certificate**: Leave default (unless you have a domain)

6. **Custom Error Responses**
   - Click **"Add custom error response"**
   - **HTTP error code**: `403`
   - **Response page path**: `/index.html`
   - **HTTP response code**: `200`
   - Click **"Add custom error response"** again
   - **HTTP error code**: `404`
   - **Response page path**: `/index.html`
   - **HTTP response code**: `200`

7. **Create Distribution**
   - Click **"Create distribution"** (bottom)
   - **Wait 15-30 minutes** for deployment

8. **Get CloudFront URL**
   - Once deployed, copy the **"Distribution domain name"** (e.g., `d1234abcd.cloudfront.net`)
   - This is your website URL!

**✅ Frontend is now on CloudFront!**

---

## Part 4: Testing Your Deployment

### Test Backend

```bash
# Health check
curl http://YOUR_PUBLIC_IP/api/health

# Should return: {"status":"healthy",...}

# Test predictions
curl -X POST http://YOUR_PUBLIC_IP/api/predict \
  -H "Content-Type: application/json" \
  -d '{"start_time": "2025-01-20T00:00:00Z", "hours": 24, "model_name": "catboost"}'
```

### Test Frontend

1. **Open in Browser**
   - S3 URL: `http://your-bucket.s3-website-region.amazonaws.com`
   - CloudFront URL: `https://d1234abcd.cloudfront.net`

2. **Check Functionality**
   - Try making predictions
   - Check if it connects to backend
   - Verify all features work

---

## Troubleshooting

### Backend Not Responding

1. **Check if service is running:**
   ```bash
   sudo systemctl status autoscaling-backend
   ```

2. **Check logs:**
   ```bash
   sudo journalctl -u autoscaling-backend -n 50
   ```

3. **Check if port 8000 is listening:**
   ```bash
   sudo netstat -tlnp | grep 8000
   ```

4. **Restart service:**
   ```bash
   sudo systemctl restart autoscaling-backend
   ```

### Can't Connect via SSH

1. **Check Security Group:**
   - EC2 Console → Your Instance → Security tab
   - Verify SSH (port 22) rule allows your IP

2. **Check Key File Permissions (macOS/Linux):**
   ```bash
   chmod 400 ~/.ssh/your-key.pem
   ```

3. **Verify Public IP:**
   - Make sure you're using the correct Public IPv4 address

### Frontend Not Loading

1. **Check S3 Bucket Policy:**
   - Verify public access is allowed
   - Check bucket policy is correct

2. **Check File Upload:**
   - Verify all files in `build/` folder are uploaded
   - Check file permissions

3. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Database Connection Issues

1. **Check MongoDB Connection String:**
   - Verify username and password are correct
   - Check network access allows your EC2 IP

2. **Test Connection from EC2:**
   ```bash
   # Install MongoDB client (optional)
   sudo apt install mongodb-clients -y
   
   # Test connection (replace with your connection string)
   mongo "mongodb+srv://username:password@cluster.mongodb.net/autoscaling_db"
   ```

---

## Next Steps

1. **Set Up Domain (Optional)**
   - Buy a domain from Route 53 or other registrar
   - Point it to your CloudFront distribution

2. **Set Up SSL Certificate**
   - Use AWS Certificate Manager (ACM)
   - Attach to CloudFront distribution

3. **Set Up Auto Scaling (Advanced)**
   - Create Auto Scaling Group
   - Configure scaling policies
   - Set up load balancer

4. **Set Up Monitoring**
   - CloudWatch alarms
   - SNS notifications
   - Log aggregation

---

## Cost Estimation

### Free Tier (First 12 Months)
- **EC2 t2.micro**: FREE (750 hours/month)
- **S3**: FREE (5GB storage, 20,000 GET requests)
- **CloudFront**: FREE (50GB data transfer out)
- **MongoDB Atlas**: FREE (M0 cluster)

### After Free Tier (Estimated Monthly)
- **EC2 t3.small**: ~$15/month
- **S3**: ~$1-5/month (depending on usage)
- **CloudFront**: ~$5-20/month (depending on traffic)
- **Data Transfer**: ~$10-50/month
- **Total**: ~$30-90/month

---

## 🎉 Congratulations!

You've successfully deployed your application to AWS!

**Your URLs:**
- Backend API: `http://YOUR_PUBLIC_IP/api`
- Frontend (S3): `http://your-bucket.s3-website-region.amazonaws.com`
- Frontend (CloudFront): `https://d1234abcd.cloudfront.net`

**Need Help?**
- Check AWS documentation
- Review troubleshooting section
- Check CloudWatch logs for errors

---

**Last Updated**: January 2025
**Version**: 1.0

