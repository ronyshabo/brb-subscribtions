# BRB Subscriptions

Barista-facing subscription lookup tool at `subscriptions.brbcoffee-atx.com`.

Baristas can search a customer by phone number, see their remaining drinks, and redeem one drink at a time. No admin reset or renew capability.

## Business rules

- Max **3 drinks per day** per subscriber
- Counts down `drinksRemaining` on each redemption
- Depletion / daily-limit states are clearly shown — no silent failures

## Local development

```bash
cp .env.example .env   # fill in Firebase values
npm install
npm run dev
```

## Build & Deploy on EC2

### 1. Copy to server

```bash
scp -i brb-key.pem -r ./brb-subscriptions ubuntu@18.191.96.186:~/brb-subscriptions
```

### 2. Create the secrets files on the server

```bash
ssh -i brb-key.pem ubuntu@18.191.96.186
mkdir -p ~/secrets
echo -n "YOUR_VALUE" > ~/secrets/VITE_FIREBASE_API_KEY
echo -n "YOUR_VALUE" > ~/secrets/VITE_FIREBASE_AUTH_DOMAIN
echo -n "YOUR_VALUE" > ~/secrets/VITE_FIREBASE_PROJECT_ID
echo -n "YOUR_VALUE" > ~/secrets/VITE_FIREBASE_STORAGE_BUCKET
echo -n "YOUR_VALUE" > ~/secrets/VITE_FIREBASE_MESSAGING_SENDER_ID
echo -n "YOUR_VALUE" > ~/secrets/VITE_FIREBASE_APP_ID
```

> The secrets directory is shared with the other BRB containers — reuse the same files if they already exist.

### 3. Build the image

```bash
cd ~/brb-subscriptions
docker build \
  --secret id=VITE_FIREBASE_API_KEY,src=~/secrets/VITE_FIREBASE_API_KEY \
  --secret id=VITE_FIREBASE_AUTH_DOMAIN,src=~/secrets/VITE_FIREBASE_AUTH_DOMAIN \
  --secret id=VITE_FIREBASE_PROJECT_ID,src=~/secrets/VITE_FIREBASE_PROJECT_ID \
  --secret id=VITE_FIREBASE_STORAGE_BUCKET,src=~/secrets/VITE_FIREBASE_STORAGE_BUCKET \
  --secret id=VITE_FIREBASE_MESSAGING_SENDER_ID,src=~/secrets/VITE_FIREBASE_MESSAGING_SENDER_ID \
  --secret id=VITE_FIREBASE_APP_ID,src=~/secrets/VITE_FIREBASE_APP_ID \
  -t brb-subscriptions .
```

### 4. Run the container

```bash
docker run -d --name brb-subscriptions --restart unless-stopped -p 3004:80 brb-subscriptions
```

> Use an unused port (e.g. 3004). Adjust if 3004 is already taken.

### 5. Point your reverse proxy

In your Caddy / Nginx reverse proxy config on the EC2, add a block for `subscriptions.brbcoffee-atx.com` that proxies to `localhost:3004`.

**Caddy example:**
```
subscriptions.brbcoffee-atx.com {
    reverse_proxy localhost:3004
}
```

**Nginx example:**
```nginx
server {
    listen 80;
    server_name subscriptions.brbcoffee-atx.com;
    location / {
        proxy_pass http://localhost:3004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. DNS

Add an **A record** for `subscriptions.brbcoffee-atx.com` pointing to `18.191.96.186`.
