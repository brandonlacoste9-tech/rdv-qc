const { Client } = require("pg");

async function run() {
  const client = new Client({
    host: "aws-1-us-west-1.pooler.supabase.com", port: 6543,
    user: "postgres.vebwxcezwrrbirsiyyur", password: "P2jUFAHE0ZSXT9jX",
    database: "postgres", ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query(`ALTER TABLE "EventType" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false`);
    console.log("Added EventType.isPrivate");
  } catch (err) {
    if (err.message.includes("already exists")) console.log("isPrivate already exists");
    else throw err;
  }

  await client.end();
}
run();
