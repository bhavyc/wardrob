const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const b = await client.query('SELECT * FROM "Booking" WHERE id = $1', ['7cb1900b-068d-47fa-87c2-7131247448da']);
  const d = await client.query('SELECT * FROM "DamageReport" WHERE "bookingId" = $1', ['7cb1900b-068d-47fa-87c2-7131247448da']);
  const p = await client.query('SELECT * FROM "Payout" WHERE "bookingId" = $1', ['7cb1900b-068d-47fa-87c2-7131247448da']);
  console.log('BOOKING:', b.rows);
  console.log('DAMAGE REPORTS:', d.rows);
  console.log('PAYOUT:', p.rows);
  await client.end();
}

run();
