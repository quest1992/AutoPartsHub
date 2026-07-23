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
exports.PartCompatibilitiesController = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var swagger_1 = require("@nestjs/swagger");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var roles_guard_1 = require("../../common/guards/roles.guard");
var require_permissions_decorator_1 = require("../../common/permissions/require-permissions.decorator");
var permission_enum_1 = require("../../common/permissions/permission.enum");
var permissions_guard_1 = require("../../common/permissions/permissions.guard");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var PartCompatibilitiesController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Part Compatibilities'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER, client_1.UserRole.VIEWER), (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Требуется действующий JWT' }), (0, swagger_1.ApiForbiddenResponse)({ description: 'Доступно только SUPER_ADMIN' }), (0, common_1.Controller)('part-catalog/:partId/compatibilities')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var PartCompatibilitiesController = _classThis = /** @class */ (function () {
        function PartCompatibilitiesController_1(partCatalogService) {
            this.partCatalogService = (__runInitializers(this, _instanceExtraInitializers), partCatalogService);
        }
        PartCompatibilitiesController_1.prototype.create = function (partId, dto) {
            return this.partCatalogService.createCompatibility(partId, dto);
        };
        PartCompatibilitiesController_1.prototype.findAll = function (partId) {
            return this.partCatalogService.findCompatibilities(partId);
        };
        PartCompatibilitiesController_1.prototype.findOne = function (partId, compatibilityId) {
            return this.partCatalogService.findCompatibility(partId, compatibilityId);
        };
        PartCompatibilitiesController_1.prototype.update = function (partId, compatibilityId, dto) {
            return this.partCatalogService.updateCompatibility(partId, compatibilityId, dto);
        };
        PartCompatibilitiesController_1.prototype.remove = function (partId, compatibilityId) {
            return this.partCatalogService.removeCompatibility(partId, compatibilityId);
        };
        return PartCompatibilitiesController_1;
    }());
    __setFunctionName(_classThis, "PartCompatibilitiesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({
                summary: 'Добавить совместимость детали с поколением автомобиля',
            }), (0, swagger_1.ApiCreatedResponse)({ description: 'Совместимость создана' }), (0, swagger_1.ApiBadRequestResponse)({
                description: 'Деталь универсальна, отключена или диапазон лет недопустим',
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь либо поколение не найдены' }), (0, swagger_1.ApiConflictResponse)({ description: 'Совместимость уже существует' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Получить compatibility детали' }), (0, swagger_1.ApiOkResponse)({ description: 'Список compatibility с цепочкой автомобиля' })];
        _findOne_decorators = [(0, common_1.Get)(':compatibilityId'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Получить одну compatibility детали' }), (0, swagger_1.ApiNotFoundResponse)({
                description: 'Совместимость не найдена для указанной детали',
            })];
        _update_decorators = [(0, common_1.Patch)(':compatibilityId'), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Изменить compatibility детали' }), (0, swagger_1.ApiBadRequestResponse)({
                description: 'Диапазон лет или активность связанного автомобиля недопустимы',
            }), (0, swagger_1.ApiConflictResponse)({ description: 'Совместимость уже существует' })];
        _remove_decorators = [(0, common_1.Delete)(':compatibilityId'), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({
                summary: 'Удалить compatibility',
                description: 'Связь удаляется физически; сама деталь не изменяется',
            }), (0, swagger_1.ApiNotFoundResponse)({
                description: 'Совместимость не найдена для указанной детали',
            })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartCompatibilitiesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartCompatibilitiesController = _classThis;
}();
exports.PartCompatibilitiesController = PartCompatibilitiesController;
