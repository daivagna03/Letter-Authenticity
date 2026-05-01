-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MAIN_USER', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('ORGANIZATION', 'POLITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MAIN_USER',
    "email" TEXT NOT NULL,
    "employeeId" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mode" "Mode" NOT NULL DEFAULT 'ORGANIZATION',
    "designation" TEXT,
    "department" TEXT,
    "organization" TEXT,
    "defaultAddress" TEXT,
    "constituency" TEXT,
    "state" TEXT,
    "houseType" TEXT,
    "signatureUrl" TEXT,
    "sealUrl" TEXT,
    "parentUserId" TEXT,
    "operatorRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mode" "Mode" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "draftedById" TEXT,
    "templateId" TEXT,
    "refNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "signatureBlock" TEXT NOT NULL,
    "copyTo" TEXT,
    "mplaadTableData" TEXT,
    "memoNo" TEXT,
    "orderCopyList" TEXT,
    "hash" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "pdfData" BYTEA,
    "createdByType" TEXT,
    "creatorIpAddress" TEXT,
    "creatorLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "location" TEXT,
    "deviceInfo" TEXT,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Letter_refNo_key" ON "Letter"("refNo");

-- CreateIndex
CREATE UNIQUE INDEX "Letter_qrToken_key" ON "Letter"("qrToken");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "Letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
