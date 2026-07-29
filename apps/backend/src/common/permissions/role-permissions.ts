import { Permission } from './permission.enum';

const allPermissions = Object.values(Permission);

export const rolePermissions: Record<string, readonly Permission[]> = {
  SUPER_ADMIN: allPermissions,
  SHOP_ADMIN: allPermissions.filter(
    (permission) =>
      permission !== Permission.CATALOG_MANAGE &&
      permission !== Permission.SHOPS_MANAGE,
  ),
  MANAGER: [
    Permission.DASHBOARD_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_IMPORT,
    Permission.INVENTORY_QUANTITY_UPDATE,
    Permission.SALES_VIEW,
    Permission.SALES_CREATE,
    Permission.SALES_CANCEL,
    Permission.PURCHASES_VIEW,
    Permission.PURCHASES_CREATE,
    Permission.PURCHASES_CANCEL,
    Permission.CATALOG_VIEW,
    Permission.ORDER_MANAGE,
    Permission.ORDER_PAYMENT_MANAGE,
    Permission.SHOP_PAYOUT_MANAGE,
    Permission.FINANCE_VIEW,
  ],
  SELLER: [
    Permission.DASHBOARD_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.SALES_VIEW,
    Permission.SALES_CREATE,
    Permission.CATALOG_VIEW,
    Permission.ORDER_MANAGE,
  ],
  VIEWER: [
    Permission.DASHBOARD_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.SALES_VIEW,
    Permission.PURCHASES_VIEW,
    Permission.CATALOG_VIEW,
  ],
};

export function hasPermissions(
  role: string,
  requiredPermissions: readonly Permission[],
): boolean {
  const granted = rolePermissions[role] ?? [];
  return requiredPermissions.every((permission) =>
    granted.includes(permission),
  );
}
