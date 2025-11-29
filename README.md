# Cloudflare IP Checker

A lightweight service that monitors your server's public IP address and automatically updates Cloudflare DNS records when the IP changes. Perfect for dynamic DNS scenarios where your server IP may change periodically.

## Features

- Fetches current public IP address
- Compares with Cloudflare DNS records
- Automatically updates records when IP changes
- Supports multiple DNS records
- Preserves existing DNS record settings (TTL, proxy status)
- Clean console output with status indicators

## Installation

```bash
bun install
```

## Configuration

Set the following environment variables:

### Required Variables

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with DNS edit permissions
- `CLOUDFLARE_ZONE_ID` - The zone ID for your domain
- `CLOUDFLARE_RECORDS` - JSON array of DNS records to update

### Example Configuration

```bash
export CLOUDFLARE_API_TOKEN="your_api_token_here"
export CLOUDFLARE_ZONE_ID="your_zone_id_here"
export CLOUDFLARE_RECORDS='[{"id":"record_id_1","name":"example.com","type":"A"},{"id":"record_id_2","name":"subdomain.example.com","type":"A"}]'
```

### Getting Your Cloudflare Credentials

1. **API Token**: Create at https://dash.cloudflare.com/profile/api-tokens

   - Use "Edit zone DNS" template
   - Grant permissions for the specific zone

2. **Zone ID**: Found on your domain's overview page in Cloudflare dashboard

3. **Record IDs**: Get via Cloudflare API or dashboard developer tools

## Usage

Run once:

```bash
bun run index.ts
```

### Automated Scheduling

Use cron to run periodically:

```bash
# Check every 5 minutes
*/5 * * * * cd /path/to/cloudflare-ip-checker && /usr/local/bin/bun run index.ts >> /var/log/ip-checker.log 2>&1
```

Or use systemd timer:

Create `/etc/systemd/system/cloudflare-ip-checker.service`:

```ini
[Unit]
Description=Cloudflare IP Checker
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/path/to/cloudflare-ip-checker
Environment=CLOUDFLARE_API_TOKEN=your_token
Environment=CLOUDFLARE_ZONE_ID=your_zone_id
Environment=CLOUDFLARE_RECORDS=[{"id":"record_id","name":"example.com","type":"A"}]
ExecStart=/usr/local/bin/bun run index.ts
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/cloudflare-ip-checker.timer`:

```ini
[Unit]
Description=Run Cloudflare IP Checker every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl enable cloudflare-ip-checker.timer
sudo systemctl start cloudflare-ip-checker.timer
```

## Example Output

```
Cloudflare IP Checker - Starting...
Checking 2 DNS record(s)
Current server IP: 203.0.113.42

Checking record: example.com (A)
  Current DNS IP: 198.51.100.10
  ⚠️  IP mismatch detected! Updating...
  ✅ Successfully updated example.com to 203.0.113.42

Checking record: subdomain.example.com (A)
  Current DNS IP: 203.0.113.42
  ✓ IP is up to date

✅ IP check completed
```

## Security Notes

- Keep your API token secure and never commit it to version control
- Use environment variables or a secure secret management system
- Grant minimal permissions to the API token (DNS edit only)
- Consider using `.env` file (add to `.gitignore`)

## Built With

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Cloudflare API](https://api.cloudflare.com/) - DNS management

## License

Private
