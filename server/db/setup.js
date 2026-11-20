/**
 * Creates the Supabase tables automatically — no manual SQL editor step.
 * Run with:  npm run db:setup   (inside server/)
 *
 * Needs DATABASE_URL in server/.env (Supabase → Project Settings → Database
 * → Connection string → URI, the "Session pooler" one works best).
 * Falls back to SUPABASE_DB_URL / POSTGRES_URL if present.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL || '';

if (!connectionString) {
  console.error(
    '\n✗ DATABASE_URL is missing in server/.env\n' +
      '  Supabase → Project Settings → Database → Connection string → URI\n' +
      '  Example: postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres\n' +
      '  (URL-encode special characters in the password, e.g. @ → %40)\n'
  );
  process.exit(1);
}

const needsSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
const client = new pg.Client({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 20000
});

const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

try {
  console.log('→ Connecting to Postgres…');
  await client.connect();
  console.log('✓ Connected');

  console.log('→ Applying schema.sql…');
  await client.query(sql);
  console.log('✓ Schema applied (extensions, tables, triggers, RLS policies, grants)');

  const { rows } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('profiles','items','bookings')
    order by table_name
  `);
  const found = rows.map((r) => r.table_name);
  console.log('✓ Tables present:', found.join(', ') || '(none!)');

  const { rows: pol } = await client.query(`
    select tablename, count(*)::int as policies
    from pg_policies where schemaname = 'public'
    group by tablename order by tablename
  `);
  console.log('✓ RLS policies:', pol.map((p) => `${p.tablename}(${p.policies})`).join(' ') || '(none)');

  const { rows: rls } = await client.query(`
    select relname, relrowsecurity
    from pg_class where relname in ('profiles','items','bookings') and relkind = 'r'
  `);
  console.log('✓ RLS enabled:', rls.map((r) => `${r.relname}=${r.relrowsecurity}`).join(' '));

  if (found.length !== 3) {
    console.error('✗ Some tables are missing — check the schema output above.');
    process.exitCode = 1;
  } else {
    console.log('\n💧 Database ready. Start the API with: npm start\n');
  }
} catch (err) {
  console.error('✗ Database setup failed:', err.message);
  if (/password authentication failed/i.test(err.message)) {
    console.error('  → The database password in DATABASE_URL looks wrong (or needs URL-encoding).');
  }
  if (/ENOTFOUND|getaddrinfo/i.test(err.message)) {
    console.error('  → Host not reachable. Use the pooler host from Supabase (aws-0-<region>.pooler.supabase.com).');
  }
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
