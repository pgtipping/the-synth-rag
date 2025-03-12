-- CreateTable
CREATE TABLE "InboundEmail" (
  "id" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "textContent" TEXT NOT NULL,
  "htmlContent" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "threadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundEmail" (
  "id" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "textContent" TEXT NOT NULL,
  "htmlContent" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "inReplyTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OutboundEmail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OutboundEmail" ADD CONSTRAINT "OutboundEmail_inReplyTo_fkey" FOREIGN KEY ("inReplyTo") REFERENCES "InboundEmail"("id") ON DELETE SET NULL ON UPDATE CASCADE; 