-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "checkedOutById" TEXT;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
