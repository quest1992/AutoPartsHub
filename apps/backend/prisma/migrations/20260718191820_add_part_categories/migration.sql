-- CreateTable
CREATE TABLE "PartCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartCategory_parentId_idx" ON "PartCategory"("parentId");

-- CreateIndex
CREATE INDEX "PartCategory_isActive_idx" ON "PartCategory"("isActive");

-- CreateIndex
CREATE INDEX "PartCategory_sortOrder_idx" ON "PartCategory"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PartCategory_parentId_slug_key" ON "PartCategory"("parentId", "slug");

-- AddForeignKey
ALTER TABLE "PartCategory" ADD CONSTRAINT "PartCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
