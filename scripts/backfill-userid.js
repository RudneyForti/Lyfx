// Backfill userId using raw SQLite (Prisma v7 generates TS-only client)
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../dev.db"));

const user = db.prepare("SELECT id FROM User LIMIT 1").get();
if (!user) { console.log("No user found"); process.exit(0); }

const uid = user.id;
console.log("Backfilling userId:", uid);

const tables = ["Transaction", "Tag", "Budget", "Goal", "Liability", "Settings"];
for (const table of tables) {
  const result = db.prepare(`UPDATE "${table}" SET userId = ? WHERE userId = ''`).run(uid);
  console.log(`  ${table}: ${result.changes} rows updated`);
}

db.close();
console.log("Done.");
