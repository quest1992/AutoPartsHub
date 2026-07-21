-- Preserve existing users while aligning role names with the access policy.
ALTER TYPE "UserRole" RENAME VALUE 'SHOP_OWNER' TO 'SHOP_ADMIN';
ALTER TYPE "UserRole" RENAME VALUE 'SHOP_MANAGER' TO 'MANAGER';
ALTER TYPE "UserRole" RENAME VALUE 'SHOP_EMPLOYEE' TO 'SELLER';
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';
