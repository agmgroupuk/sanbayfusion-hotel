const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const baselineMigration = "20261004000000_legacy_schema_baseline";
const prismaCli = path.resolve(__dirname, "../node_modules/prisma/build/index.js");

async function main() {
  const db = new PrismaClient();
  let schemaState;

  try {
    [schemaState] = await db.$queryRaw`
      SELECT
        to_regclass('public._prisma_migrations') IS NOT NULL AS "hasMigrationHistory",
        EXISTS (
          SELECT 1
          FROM pg_catalog.pg_tables
          WHERE schemaname = 'public'
            AND tablename <> '_prisma_migrations'
        ) AS "hasExistingTables"
    `;
  } finally {
    await db.$disconnect();
  }

  if (!schemaState.hasMigrationHistory && schemaState.hasExistingTables) {
    execFileSync(
      process.execPath,
      [prismaCli, "migrate", "resolve", "--applied", baselineMigration],
      { stdio: "inherit" },
    );
  }

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    stdio: "inherit",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
