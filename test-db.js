const { Client } = require('pg');

const regions = [
  'aws-0-us-east-1',
  'aws-0-us-west-1',
  'aws-0-us-west-2',
  'aws-0-us-east-2',
  'aws-0-ca-central-1'
];

async function testConnection(region) {
  const connectionString = `postgresql://postgres.vebwxcezwrrbirsiyyur:pYCjlz1nfsdAUUJW@${region}.pooler.supabase.com:6543/postgres`;
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('SELECT NOW()');
    console.log(`[${region}] SUCCESS!`);
    await client.end();
  } catch (err) {
    if (err.message.includes('Tenant or user not found')) {
      console.log(`[${region}] Tenant not found`);
    } else {
      console.log(`[${region}] FAILED with: ${err.message}`);
    }
  }
}

async function run() {
  await Promise.all(regions.map(r => testConnection(r)));
}

run();
