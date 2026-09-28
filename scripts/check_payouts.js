const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`
    SELECT p.id, p."bookingId", p.amount, p."commissionPaid", p.status, p."batchRef", p."walletBalanceIncluded",
           b."rentAmount", b."securityDeposit", b."extensionFee", b."lateReturnPenalty",
           l.title
    FROM "Payout" p
    JOIN "Booking" b ON p."bookingId" = b.id
    JOIN "Listing" l ON b."listingId" = l.id
    ORDER BY p."createdAt" DESC;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run();
