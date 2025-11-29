// Cloudflare IP Checker
// Monitors server IP and updates Cloudflare DNS records when it changes

interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
  allowedRecords: string[];
  checkIntervalMinutes: number;
}

interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

// Load configuration from environment variables
const config: CloudflareConfig = {
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
  allowedRecords: JSON.parse(process.env.CLOUDFLARE_ALLOWED_RECORDS || '[]'),
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '5', 10),
};

// Validate configuration
if (!config.apiToken) {
  console.error('Error: CLOUDFLARE_API_TOKEN environment variable is required');
  process.exit(1);
}

if (!config.zoneId) {
  console.error('Error: CLOUDFLARE_ZONE_ID environment variable is required');
  process.exit(1);
}

if (config.allowedRecords.length === 0) {
  console.error(
    'Error: CLOUDFLARE_ALLOWED_RECORDS environment variable is required',
  );
  console.error('Format: ["home.thoor.me","*.home.thoor.me"]');
  process.exit(1);
}

// Get current public IP address
async function getCurrentIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = (await response.json()) as { ip: string };
    return data.ip;
  } catch (error) {
    throw new Error(`Failed to get current IP: ${error}`);
  }
}

// Get all DNS records from Cloudflare zone
async function getAllDNSRecords(): Promise<DNSRecord[]> {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records?per_page=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = (await response.json()) as {
    success: boolean;
    result: DNSRecord[];
    errors: any[];
  };

  if (!data.success) {
    throw new Error(
      `Failed to get DNS records: ${JSON.stringify(data.errors)}`,
    );
  }

  return data.result;
}

// Get DNS record from Cloudflare
async function getDNSRecord(recordId: string): Promise<DNSRecord> {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = (await response.json()) as {
    success: boolean;
    result: DNSRecord;
    errors: any[];
  };

  if (!data.success) {
    throw new Error(`Failed to get DNS record: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

// Update DNS record in Cloudflare
async function updateDNSRecord(
  recordId: string,
  name: string,
  type: string,
  ip: string,
): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`;

  // Get current record to preserve settings
  const currentRecord = await getDNSRecord(recordId);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: type,
      name: name,
      content: ip,
      ttl: currentRecord.ttl,
      proxied: currentRecord.proxied,
    }),
  });

  const data = (await response.json()) as { success: boolean; errors: any[] };

  if (!data.success) {
    throw new Error(
      `Failed to update DNS record: ${JSON.stringify(data.errors)}`,
    );
  }
}

// Main function
async function checkAndUpdateIP(): Promise<void> {
  console.log('Cloudflare IP Checker - Starting...');
  console.log(`Looking for records: ${config.allowedRecords.join(', ')}`);

  try {
    // Get current public IP
    const currentIP = await getCurrentIP();
    console.log(`Current server IP: ${currentIP}`);

    // Fetch all DNS records from Cloudflare
    console.log('\nFetching DNS records from Cloudflare...');
    const allRecords = await getAllDNSRecords();

    // Filter to only allowed records
    const allowedRecords = allRecords.filter((record) =>
      config.allowedRecords.includes(record.name),
    );

    if (allowedRecords.length === 0) {
      console.log(
        `\n⚠️  No records matching allowed list found: ${config.allowedRecords.join(
          ', ',
        )}`,
      );
      return;
    }

    console.log(`Found ${allowedRecords.length} matching record(s)`);

    // Check each DNS record
    for (const record of allowedRecords) {
      console.log(`\nChecking record: ${record.name} (${record.type})`);

      try {
        const dnsRecord = await getDNSRecord(record.id);
        const recordIP = dnsRecord.content;

        console.log(`  Current DNS IP: ${recordIP}`);

        if (recordIP !== currentIP) {
          console.log(`  ⚠️  IP mismatch detected! Updating...`);
          await updateDNSRecord(record.id, record.name, record.type, currentIP);
          console.log(
            `  ✅ Successfully updated ${record.name} to ${currentIP}`,
          );
        } else {
          console.log(`  ✓ IP is up to date`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing record ${record.name}:`, error);
      }
    }

    console.log('\n✅ IP check completed');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run continuously
console.log(
  `\n🔄 Running checks every ${config.checkIntervalMinutes} minute(s)`,
);
console.log('Press Ctrl+C to stop\n');

while (true) {
  await checkAndUpdateIP();

  const nextCheck = new Date(
    Date.now() + config.checkIntervalMinutes * 60 * 1000,
  );
  console.log(`\n⏰ Next check at: ${nextCheck.toLocaleString()}`);
  console.log('---\n');

  // Wait for the specified interval
  await new Promise((resolve) =>
    setTimeout(resolve, config.checkIntervalMinutes * 60 * 1000),
  );
}
