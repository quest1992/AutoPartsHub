"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var prisma_module_1 = require("./prisma/prisma.module");
var shops_module_1 = require("./modules/shops/shops.module");
var users_module_1 = require("./modules/users/users.module");
var auth_module_1 = require("./modules/auth/auth.module");
var categories_module_1 = require("./modules/categories/categories.module");
var manufacturers_module_1 = require("./modules/manufacturers/manufacturers.module");
var vehicle_models_module_1 = require("./modules/vehicle-models/vehicle-models.module");
var vehicle_generations_module_1 = require("./modules/vehicle-generations/vehicle-generations.module");
var part_categories_module_1 = require("./modules/part-categories/part-categories.module");
var part_catalog_module_1 = require("./modules/part-catalog/part-catalog.module");
var inventory_items_module_1 = require("./modules/inventory-items/inventory-items.module");
var inventory_movements_module_1 = require("./modules/inventory-movements/inventory-movements.module");
var sales_module_1 = require("./modules/sales/sales.module");
var purchases_module_1 = require("./modules/purchases/purchases.module");
var inventory_search_module_1 = require("./modules/inventory-search/inventory-search.module");
var inventory_import_module_1 = require("./modules/inventory-import/inventory-import.module");
var dashboard_module_1 = require("./modules/dashboard/dashboard.module");
var permissions_module_1 = require("./common/permissions/permissions.module");
var employees_module_1 = require("./modules/employees/employees.module");
var AppModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                prisma_module_1.PrismaModule,
                permissions_module_1.PermissionsModule,
                employees_module_1.EmployeesModule,
                shops_module_1.ShopsModule,
                users_module_1.UsersModule,
                auth_module_1.AuthModule,
                categories_module_1.CategoriesModule,
                manufacturers_module_1.ManufacturersModule,
                vehicle_models_module_1.VehicleModelsModule,
                vehicle_generations_module_1.VehicleGenerationsModule,
                part_categories_module_1.PartCategoriesModule,
                part_catalog_module_1.PartCatalogModule,
                inventory_items_module_1.InventoryItemsModule,
                inventory_movements_module_1.InventoryMovementsModule,
                sales_module_1.SalesModule,
                purchases_module_1.PurchasesModule,
                inventory_search_module_1.InventorySearchModule,
                inventory_import_module_1.InventoryImportModule,
                dashboard_module_1.DashboardModule,
            ],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AppModule = _classThis = /** @class */ (function () {
        function AppModule_1() {
        }
        return AppModule_1;
    }());
    __setFunctionName(_classThis, "AppModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
}();
exports.AppModule = AppModule;
