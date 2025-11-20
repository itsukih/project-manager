-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "outsourcing_partners" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
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
    "outsourcingPartnerId" INTEGER,
    "outsourcingPartnerSheetUrl" TEXT,
    "clientSheetUrl" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "invoiceIssued" BOOLEAN NOT NULL DEFAULT false,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentDueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "projects_outsourcingPartnerId_fkey" FOREIGN KEY ("outsourcingPartnerId") REFERENCES "outsourcing_partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
