# 🔧 CloudCP Calendar - Configuration Setup Guide

## 📋 Required Configuration

### 1. AWS Credentials (for Real Instance Scaling)

To enable real AWS EC2 instance scaling, you need to provide AWS credentials in the `.env` file:

**Location:** `/app/backend/.env`

```env
# AWS Credentials
AWS_ACCESS_KEY_ID="your-aws-access-key-id-here"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key-here"
AWS_REGION="us-east-1"  # Change to your preferred region

# AWS Auto Scaling Group Name
AWS_ASG_NAME="my-web-asg"  # Change to your ASG name
```

### 2. How to Get AWS Credentials

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to IAM**:
   - Go to Services → Security, Identity, & Compliance → IAM
3. **Create Access Key**:
   - Click on your username (top right) → Security Credentials
   - Scroll to "Access keys" section
   - Click "Create access key"
   - Select "Application running outside AWS"
   - Download the credentials (CSV file)
   - Copy **Access Key ID** and **Secret Access Key**

### 3. Required IAM Permissions

Your AWS IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:UpdateAutoScalingGroup",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Calendarific API Key (Already Configured)

The Calendarific API key is already set in `.env`:
```env
CALENDARIFIC_API_KEY="baa9dc110aa712sd3a9fa2a3dwb6c01d4c875950dc32vs"
```

If you need a new key:
1. Visit: https://calendarific.com/
2. Sign up for free account
3. Get your API key from dashboard
4. Replace in `.env` file

---

## 📊 Instance Scaling Logic

The system automatically scales instances based on predicted traffic:

| Traffic Load | Instances | Logic |
|-------------|-----------|-------|
| < 700 | 1 | Light traffic |
| 700 - 1,400 | 2 | Moderate traffic |
| 1,400 - 2,100 | 3 | High traffic |
| 2,100 - 3,000 | 4 | Very high traffic |
| 3,000 - 5,000 | 5 | Peak traffic |
| > 5,000 | 10 | Festival/Campaign traffic |

---

## 🎯 Features Enabled with Configuration

### With AWS Credentials:
- ✅ Real-time EC2 instance scaling
- ✅ Auto Scaling Group management
- ✅ Instance health monitoring
- ✅ Automatic scale-up/down based on predictions

### Without AWS Credentials (Mock Mode):
- ⚠️ Simulated scaling responses
- ⚠️ Prediction calculations work
- ⚠️ No real AWS changes

---

## 🚀 Quick Setup Steps

### Step 1: Update Backend .env
```bash
cd /app/backend
nano .env  # or vim .env
```

Add your AWS credentials:
```env
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-east-1"
AWS_ASG_NAME="your-actual-asg-name"
```

### Step 2: Restart Backend
```bash
sudo supervisorctl restart backend
```

### Step 3: Verify Configuration
Visit: `https://your-app-url.preview.emergentagent.com/api/health`

Response should show:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "aws_configured": true
}
```

---

## 🎉 2025 Festival Calendar

The system includes all major Indian festivals for 2025:

- **January 26** - Republic Day
- **March 14** - Holi
- **April 6** - Ram Navami
- **August 15** - Independence Day
- **October 2** - Dussehra
- **October 20-21** - Diwali
- **December 25** - Christmas
- **December 31** - New Year's Eve

Plus many more regional and religious festivals!

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
2. **Use IAM roles instead of access keys when possible**
3. **Rotate access keys regularly (every 90 days)**
4. **Use AWS Secrets Manager for production**
5. **Restrict IAM permissions to minimum required**

---

## 📞 Support

If you encounter issues:
1. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Verify AWS credentials are valid
3. Ensure ASG name is correct
4. Check IAM permissions

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|---------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | No* | "" | AWS access key for authentication |
| `AWS_SECRET_ACCESS_KEY` | No* | "" | AWS secret key for authentication |
| `AWS_REGION` | No | "us-east-1" | AWS region for resources |
| `AWS_ASG_NAME` | No | "my-web-asg" | Auto Scaling Group name |
| `CALENDARIFIC_API_KEY` | Yes | (set) | API key for festival data |
| `MONGO_URL` | Yes | (set) | MongoDB connection string |
| `DB_NAME` | Yes | (set) | Database name |
| `CORS_ORIGINS` | No | "*" | Allowed CORS origins |

*Required only for real AWS scaling. System works in mock mode without them.

---

**Last Updated:** January 2025
**Version:** 2.0
