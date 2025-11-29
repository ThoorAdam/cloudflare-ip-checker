# Cloudflare IP Checker

Continuously monitors your server's public IP address and automatically updates Cloudflare DNS records when it changes.

## Features

- Runs continuously with configurable check intervals
- Automatically fetches DNS records from Cloudflare
- Updates only specified record names
- Preserves existing DNS settings (TTL, proxy status)
- No cron setup required

## Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure:
   - `CLOUDFLARE_API_TOKEN` - Create at https://dash.cloudflare.com/profile/api-tokens (use "Edit zone DNS" template)
   - `CLOUDFLARE_ZONE_ID` - Found on your domain's overview page
   - `CLOUDFLARE_ALLOWED_RECORDS` - JSON array of domain names to update
   - `CHECK_INTERVAL_MINUTES` - How often to check (default: 5 minutes)

## Usage

```bash
bun run index.ts
```

The script will run continuously, checking for IP changes at the configured interval.

### Running in Background

```bash
# Using nohup
nohup bun run index.ts > ip-checker.log 2>&1 &

# Using screen
screen -S ip-checker
bun run index.ts

# Using systemd (create service file)
sudo systemctl start cloudflare-ip-checker
```

## Example Output

```
🔄 Running checks every 5 minute(s)
Press Ctrl+C to stop

Cloudflare IP Checker - Starting...
Looking for records: home.thoor.me, *.home.thoor.me
Current server IP: 203.0.113.42

Fetching DNS records from Cloudflare...
Found 2 matching record(s)

Checking record: home.thoor.me (A)
  Current DNS IP: 203.0.113.42
  ✓ IP is up to date

Checking record: *.home.thoor.me (A)
  Current DNS IP: 203.0.113.42
  ✓ IP is up to date

✅ IP check completed

⏰ Next check at: 11/29/2025, 2:35:00 PM
---
```

## Security

- Never commit `.env` to version control
- Use minimal API token permissions (DNS edit only)
- Keep API credentials secure
