import postgres from "postgres";
async function main() {
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
try {
 console.log(JSON.stringify(await sql`select id,hash,created_at from drizzle.__drizzle_migrations order by id`));
 console.log(JSON.stringify(await sql`select column_name,data_type from information_schema.columns where table_schema='public' and table_name='membership_requests' order by ordinal_position`));
 console.log(JSON.stringify(await sql`select enumlabel from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='membership_request_status' order by enumsortorder`));
} catch { console.error("Inspection failed; details suppressed"); process.exitCode=1; } finally { await sql.end(); }

}
main();
