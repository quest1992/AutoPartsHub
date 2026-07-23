"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryImportController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var require_permissions_decorator_1 = require("../../common/permissions/require-permissions.decorator");
var permission_enum_1 = require("../../common/permissions/permission.enum");
var permissions_guard_1 = require("../../common/permissions/permissions.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var InventoryImportController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Inventory Import'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER), (0, common_1.Controller)('inventory-import')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _preview_decorators;
    var _confirm_decorators;
    var InventoryImportController = _classThis = /** @class */ (function () {
        function InventoryImportController_1(service) {
            this.service = (__runInitializers(this, _instanceExtraInitializers), service);
        }
        InventoryImportController_1.prototype.preview = function (file, dto, req) {
            return this.service.preview(file, req.user, dto.shopId, {
                partNumberColumn: dto.partNumberColumn,
                nameColumn: dto.nameColumn,
                priceColumn: dto.priceColumn,
                quantityColumn: dto.quantityColumn,
            });
        };
        InventoryImportController_1.prototype.confirm = function (file, dto, req) {
            return this.service.confirm(file, req.user, dto.shopId, {
                partNumberColumn: dto.partNumberColumn,
                nameColumn: dto.nameColumn,
                priceColumn: dto.priceColumn,
                quantityColumn: dto.quantityColumn,
            });
        };
        return InventoryImportController_1;
    }());
    __setFunctionName(_classThis, "InventoryImportController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _preview_decorators = [(0, common_1.Post)('preview'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.INVENTORY_IMPORT), (0, swagger_1.ApiOperation)({
                summary: 'Предпросмотр Excel-импорта без записи в базу данных',
            }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: {
                    type: 'object',
                    required: ['file'],
                    properties: {
                        file: { type: 'string', format: 'binary' },
                        shopId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Обязателен для SUPER_ADMIN',
                        },
                        partNumberColumn: { type: 'string' },
                        nameColumn: { type: 'string' },
                        priceColumn: { type: 'string' },
                        quantityColumn: { type: 'string' },
                    },
                },
            }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Результат предпросмотра' }), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 10 * 1024 * 1024 } }))];
        _confirm_decorators = [(0, common_1.Post)('confirm'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.INVENTORY_IMPORT), (0, swagger_1.ApiOperation)({ summary: 'Подтвердить импорт Excel с выбранным сопоставлением колонок' }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: {
                    type: 'object',
                    required: ['file', 'nameColumn', 'priceColumn', 'quantityColumn'],
                    properties: {
                        file: { type: 'string', format: 'binary' },
                        shopId: { type: 'string', format: 'uuid' },
                        partNumberColumn: { type: 'string' },
                        nameColumn: { type: 'string' },
                        priceColumn: { type: 'string' },
                        quantityColumn: { type: 'string' },
                    },
                },
            }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Статистика импорта' }), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 10 * 1024 * 1024 } }))];
        __esDecorate(_classThis, null, _preview_decorators, { kind: "method", name: "preview", static: false, private: false, access: { has: function (obj) { return "preview" in obj; }, get: function (obj) { return obj.preview; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _confirm_decorators, { kind: "method", name: "confirm", static: false, private: false, access: { has: function (obj) { return "confirm" in obj; }, get: function (obj) { return obj.confirm; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InventoryImportController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InventoryImportController = _classThis;
}();
exports.InventoryImportController = InventoryImportController;
