-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_outsourcing_partners" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DESIGNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_outsourcing_partners" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "outsourcing_partners";
DROP TABLE "outsourcing_partners";
ALTER TABLE "new_outsourcing_partners" RENAME TO "outsourcing_partners";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
