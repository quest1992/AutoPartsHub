"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = void 0;
exports.hasPermissions = hasPermissions;
var permission_enum_1 = require("./permission.enum");
var allPermissions = Object.values(permission_enum_1.Permission);
exports.rolePermissions = {
    SUPER_ADMIN: allPermissions,
    SHOP_ADMIN: allPermissions.filter(function (permission) {
        return permission !== permission_enum_1.Permission.CATALOG_MANAGE &&
            permission !== permission_enum_1.Permission.SHOPS_MANAGE;
    }),
    MANAGER: [
        permission_enum_1.Permission.DASHBOARD_VIEW,
        permission_enum_1.Permission.INVENTORY_VIEW,
        permission_enum_1.Permission.INVENTORY_CREATE,
        permission_enum_1.Permission.INVENTORY_UPDATE,
        permission_enum_1.Permission.INVENTORY_IMPORT,
        permission_enum_1.Permission.INVENTORY_QUANTITY_UPDATE,
        permission_enum_1.Permission.SALES_VIEW,
        permission_enum_1.Permission.SALES_CREATE,
        permission_enum_1.Permission.SALES_CANCEL,
        permission_enum_1.Permission.PURCHASES_VIEW,
        permission_enum_1.Permission.PURCHASES_CREATE,
        permission_enum_1.Permission.PURCHASES_CANCEL,
        permission_enum_1.Permission.CATALOG_VIEW,
    ],
    SELLER: [
        permission_enum_1.Permission.DASHBOARD_VIEW,
        permission_enum_1.Permission.INVENTORY_VIEW,
        permission_enum_1.Permission.SALES_VIEW,
        permission_enum_1.Permission.SALES_CREATE,
        permission_enum_1.Permission.CATALOG_VIEW,
    ],
    VIEWER: [
        permission_enum_1.Permission.DASHBOARD_VIEW,
        permission_enum_1.Permission.INVENTORY_VIEW,
        permission_enum_1.Permission.SALES_VIEW,
        permission_enum_1.Permission.PURCHASES_VIEW,
        permission_enum_1.Permission.CATALOG_VIEW,
    ],
};
function hasPermissions(role, requiredPermissions) {
    var _a;
    var granted = (_a = exports.rolePermissions[role]) !== null && _a !== void 0 ? _a : [];
    return requiredPermissions.every(function (permission) { return granted.includes(permission); });
}
