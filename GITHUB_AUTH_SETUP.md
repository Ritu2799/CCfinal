# GitHub Authentication Setup Guide

## Option 1: Personal Access Token (PAT) - Recommended for HTTPS

### Step 1: Create Personal Access Token

1. **Go to GitHub**
   - Visit: https://github.com/settings/tokens
   - Or: GitHub → Your Profile (top right) → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token**
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - **Note**: Give it a name like "Autoscaling Project"
   - **Expiration**: Choose your preference (90 days, 1 year, or no expiration)
   - **Select scopes**: Check these boxes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (if you use GitHub Actions)

3. **Generate Token**
   - Click **"Generate token"** at the bottom
   - **⚠️ IMPORTANT**: Copy the token immediately! You won't see it again!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Use Token for Push**
   - When you run `git push`, it will ask for username and password
   - **Username**: `Ritu2799`
   - **Password**: Paste your Personal Access Token (NOT your GitHub password!)

### Step 2: Push Your Code

```bash
cd /Users/ritesh/Desktop/1111
git push -u origin main
```

When prompted:
- **Username**: `Ritu2799`
- **Password**: `ghp_your_token_here` (the token you just created)

---

## Option 2: SSH Keys (More Secure, No Password Needed)

### Step 1: Check if you have SSH keys

```bash
ls -la ~/.ssh
```

If you see `id_rsa.pub` or `id_ed25519.pub`, you already have SSH keys. Skip to Step 3.

### Step 2: Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "bagalritu72@gmail.com"

# Press Enter to accept default file location
# Enter a passphrase (optional but recommended)
# Enter passphrase again
```

### Step 3: Add SSH Key to GitHub

1. **Copy your public key**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Or if you used RSA:
   # cat ~/.ssh/id_rsa.pub
   ```

2. **Add to GitHub**
   - Go to: https://github.com/settings/keys
   - Click **"New SSH key"**
   - **Title**: "My MacBook" (or any name)
   - **Key**: Paste the content from step 1
   - Click **"Add SSH key"**

### Step 4: Change Remote to SSH

```bash
cd /Users/ritesh/Desktop/1111
git remote set-url origin git@github.com:Ritu2799/autoscaling-.git
```

### Step 5: Test SSH Connection

```bash
ssh -T git@github.com
```

You should see: "Hi Ritu2799! You've successfully authenticated..."

### Step 6: Push Your Code

```bash
git push -u origin main
```

No password needed!

---

## Quick Fix: Use GitHub CLI (Easiest)

If you have GitHub CLI installed:

```bash
# Install GitHub CLI (if not installed)
brew install gh

# Login to GitHub
gh auth login

# Follow the prompts:
# - Choose GitHub.com
# - Choose HTTPS
# - Authenticate with web browser
# - Login with GitHub account

# Then push
git push -u origin main
```

---

## Current Status

Your git is configured with:
- **Username**: Ritu2799
- **Email**: bagalritu72@gmail.com
- **Remote**: https://github.com/Ritu2799/autoscaling-.git

**Next Step**: Choose one of the authentication methods above and push your code!

---

## Troubleshooting

### "Authentication failed" error
- Make sure you're using Personal Access Token (not password) for HTTPS
- Or switch to SSH (Option 2)

### "Permission denied" error
- Check that your GitHub username is correct: Ritu2799
- Verify the repository exists: https://github.com/Ritu2799/autoscaling-
- Make sure you have write access to the repository

### "Repository not found" error
- Verify the repository URL is correct
- Make sure the repository exists on GitHub
- Check that you're logged into the correct GitHub account

