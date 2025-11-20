/*
  Warnings:

  - You are about to drop the column `outsourcingPartnerId` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "outsourcing_partners" ADD COLUMN "contractPdfName" TEXT;
ALTER TABLE "outsourcing_partners" ADD COLUMN "contractPdfPath" TEXT;
ALTER TABLE "outsourcing_partners" ADD COLUMN "email" TEXT;
ALTER TABLE "outsourcing_partners" ADD COLUMN "notes" TEXT;
ALTER TABLE "outsourcing_partners" ADD COLUMN "portfolioUrl" TEXT;

-- CreateTable
CREATE TABLE "project_outsourcing_partners" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "outsourcingPartnerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_outsourcing_partners_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_outsourcing_partners_outsourcingPartnerId_fkey" FOREIGN KEY ("outsourcingPartnerId") REFERENCES "outsourcing_partners" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "regular_contact_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "regular_contact_histories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "regular_contact_histories_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "regular_contact_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "contactPerson" TEXT,
    "status" TEXT NOT NULL DEFAULT '未接触',
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
INSERT INTO "new_clients" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
CREATE TABLE "new_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" INTEGER NOT NULL,
    "salesStatus" TEXT NOT NULL DEFAULT 'CONSULTING',
    "progressStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "consultationDate" DATETIME,
    "orderDate" DATETIME,
    "startDate" DATETIME,
    "firstDraftDate" DATETIME,
    "deliveryDate" DATETIME,
    "hasOutsourcing" BOOLEAN NOT NULL DEFAULT false,
    "outsourcingPartnerSheetUrl" TEXT,
    "clientSheetUrl" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "outsourcingCost" INTEGER NOT NULL DEFAULT 0,
    "invoiceIssued" BOOLEAN NOT NULL DEFAULT false,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentDueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("amount", "clientId", "clientSheetUrl", "consultationDate", "createdAt", "deliveryDate", "description", "firstDraftDate", "hasOutsourcing", "id", "invoiceIssued", "name", "orderDate", "outsourcingPartnerSheetUrl", "paymentConfirmed", "paymentDueDate", "progressStatus", "salesStatus", "startDate", "updatedAt") SELECT "amount", "clientId", "clientSheetUrl", "consultationDate", "createdAt", "deliveryDate", "description", "firstDraftDate", "hasOutsourcing", "id", "invoiceIssued", "name", "orderDate", "outsourcingPartnerSheetUrl", "paymentConfirmed", "paymentDueDate", "progressStatus", "salesStatus", "startDate", "updatedAt" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "project_outsourcing_partners_projectId_outsourcingPartnerId_key" ON "project_outsourcing_partners"("projectId", "outsourcingPartnerId");

-- CreateIndex
CREATE UNIQUE INDEX "regular_contact_histories_templateId_year_month_key" ON "regular_contact_histories"("templateId", "year", "month");
