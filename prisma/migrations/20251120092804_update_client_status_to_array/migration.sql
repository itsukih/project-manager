-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "contactPerson" TEXT,
    "status" TEXT NOT NULL DEFAULT '[]',
    "rank" TEXT NOT NULL DEFAULT 'C',
    "history" TEXT,
    "salesIdea" TEXT,
    "needs" TEXT,
    "approach" TEXT,
    "messageToClient" TEXT,
    "firstContact" DATETIME,
    "meetingDate" DATETIME,
    "contractDate" DATETIME,
    "contactType" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "salesText" TEXT,
    "salesTextUpdated" BOOLEAN NOT NULL DEFAULT false,
    "salesTextUpdatedMonth" TEXT,
    "regularContact" BOOLEAN NOT NULL DEFAULT false,
    "regularContactMonth" TEXT,
    "lastContact" DATETIME,
    "contractPdfPath" TEXT,
    "contractPdfName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_clients" ("approach", "contactPerson", "contactType", "contractDate", "contractPdfName", "contractPdfPath", "createdAt", "email", "firstContact", "history", "homepageUrl", "id", "lastContact", "meetingDate", "messageToClient", "name", "needs", "notes", "rank", "regularContact", "regularContactMonth", "salesIdea", "salesText", "salesTextUpdated", "salesTextUpdatedMonth", "status", "updatedAt") SELECT "approach", "contactPerson", "contactType", "contractDate", "contractPdfName", "contractPdfPath", "createdAt", "email", "firstContact", "history", "homepageUrl", "id", "lastContact", "meetingDate", "messageToClient", "name", "needs", "notes", "rank", "regularContact", "regularContactMonth", "salesIdea", "salesText", "salesTextUpdated", "salesTextUpdatedMonth", "status", "updatedAt" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
