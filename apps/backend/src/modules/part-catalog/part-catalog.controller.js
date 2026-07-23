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
exports.PartCatalogController = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var swagger_1 = require("@nestjs/swagger");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var roles_guard_1 = require("../../common/guards/roles.guard");
var require_permissions_decorator_1 = require("../../common/permissions/require-permissions.decorator");
var permission_enum_1 = require("../../common/permissions/permission.enum");
var permissions_guard_1 = require("../../common/permissions/permissions.guard");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var PartCatalogController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Part Catalog'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Требуется действующий JWT' }), (0, swagger_1.ApiForbiddenResponse)({ description: 'Доступно только SUPER_ADMIN' }), (0, common_1.Controller)('part-catalog')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findCandidates_decorators;
    var _getPartNumbers_decorators;
    var _addPartNumber_decorators;
    var _deletePartNumber_decorators;
    var _getPartAliases_decorators;
    var _addPartAlias_decorators;
    var _deletePartAlias_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var PartCatalogController = _classThis = /** @class */ (function () {
        function PartCatalogController_1(partCatalogService) {
            this.partCatalogService = (__runInitializers(this, _instanceExtraInitializers), partCatalogService);
        }
        PartCatalogController_1.prototype.create = function (dto) {
            return this.partCatalogService.create(dto);
        };
        PartCatalogController_1.prototype.findAll = function (query) {
            return this.partCatalogService.findAll(query);
        };
        PartCatalogController_1.prototype.findCandidates = function (query) {
            return this.partCatalogService.findCandidates(query);
        };
        PartCatalogController_1.prototype.getPartNumbers = function (partCatalogItemId) {
            return this.partCatalogService.getPartNumbers(partCatalogItemId);
        };
        PartCatalogController_1.prototype.addPartNumber = function (partCatalogItemId, dto) {
            return this.partCatalogService.addPartNumber(partCatalogItemId, dto);
        };
        PartCatalogController_1.prototype.deletePartNumber = function (partCatalogItemId, partNumberId) {
            return this.partCatalogService.deletePartNumber(partCatalogItemId, partNumberId);
        };
        PartCatalogController_1.prototype.getPartAliases = function (partCatalogItemId) {
            return this.partCatalogService.getPartAliases(partCatalogItemId);
        };
        PartCatalogController_1.prototype.addPartAlias = function (partCatalogItemId, dto) {
            return this.partCatalogService.addPartAlias(partCatalogItemId, dto);
        };
        PartCatalogController_1.prototype.deletePartAlias = function (partCatalogItemId, partAliasId) {
            return this.partCatalogService.deletePartAlias(partCatalogItemId, partAliasId);
        };
        PartCatalogController_1.prototype.findOne = function (id) {
            return this.partCatalogService.findOne(id);
        };
        PartCatalogController_1.prototype.update = function (id, dto) {
            return this.partCatalogService.update(id, dto);
        };
        PartCatalogController_1.prototype.remove = function (id) {
            return this.partCatalogService.remove(id);
        };
        return PartCatalogController_1;
    }());
    __setFunctionName(_classThis, "PartCatalogController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({
                summary: 'Создать запись центрального каталога деталей',
                description: 'internalCode генерируется сервером и не принимается во входных данных',
            }), (0, swagger_1.ApiCreatedResponse)({
                description: 'Деталь создана вместе с внутренним кодом',
            }), (0, swagger_1.ApiBadRequestResponse)({
                description: 'Категория неактивна или не является конечной',
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Категория не найдена' }), (0, swagger_1.ApiConflictResponse)({ description: 'Дубликат детали в категории' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER), (0, swagger_1.ApiOperation)({ summary: 'Получить центральный каталог деталей' }), (0, swagger_1.ApiOkResponse)({ description: 'Список с фильтрами и пагинацией' })];
        _findCandidates_decorators = [(0, common_1.Get)('candidates'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER, client_1.UserRole.VIEWER), (0, swagger_1.ApiOperation)({
                summary: 'Найти возможные совпадения канонической детали',
                description: 'Возвращает кандидатов для ручной проверки; записи не объединяются автоматически',
            }), (0, swagger_1.ApiOkResponse)({ description: 'Кандидаты с причиной совпадения' }), (0, swagger_1.ApiBadRequestResponse)({ description: 'Некорректный поисковый запрос' })];
        _getPartNumbers_decorators = [(0, common_1.Get)(':partCatalogItemId/numbers'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER, client_1.UserRole.VIEWER), (0, swagger_1.ApiOperation)({ summary: 'Получить номера канонической запчасти' }), (0, swagger_1.ApiParam)({ name: 'partCatalogItemId', format: 'uuid' }), (0, swagger_1.ApiOkResponse)({ description: 'Номера запчасти в предсказуемом порядке' }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь каталога не найдена' })];
        _addPartNumber_decorators = [(0, common_1.Post)(':partCatalogItemId/numbers'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Добавить номер к канонической запчасти' }), (0, swagger_1.ApiParam)({ name: 'partCatalogItemId', format: 'uuid' }), (0, swagger_1.ApiCreatedResponse)({ description: 'Номер добавлен к запчасти' }), (0, swagger_1.ApiBadRequestResponse)({ description: 'Номер пуст после нормализации' }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь каталога не найдена' }), (0, swagger_1.ApiConflictResponse)({ description: 'Такой номер уже добавлен к запчасти' })];
        _deletePartNumber_decorators = [(0, common_1.Delete)(':partCatalogItemId/numbers/:partNumberId'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Удалить номер канонической запчасти' }), (0, swagger_1.ApiParam)({ name: 'partCatalogItemId', format: 'uuid' }), (0, swagger_1.ApiParam)({ name: 'partNumberId', format: 'uuid' }), (0, swagger_1.ApiOkResponse)({ description: 'Номер удалён' }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Номер не найден у указанной запчасти' })];
        _getPartAliases_decorators = [(0, common_1.Get)(':partCatalogItemId/aliases'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER, client_1.UserRole.VIEWER), (0, swagger_1.ApiOperation)({ summary: 'Получить варианты названия канонической запчасти' }), (0, swagger_1.ApiParam)({ name: 'partCatalogItemId', format: 'uuid' }), (0, swagger_1.ApiOkResponse)({ description: 'Варианты названия в предсказуемом порядке' }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь каталога не найдена' })];
        _addPartAlias_decorators = [(0, common_1.Post)(':partCatalogItemId/aliases'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Добавить вариант названия канонической запчасти' }), (0, swagger_1.ApiParam)({ name: 'partCatalogItemId', format: 'uuid' }), (0, swagger_1.ApiCreatedResponse)({ description: 'Вариант названия добавлен' }), (0, swagger_1.ApiBadRequestResponse)({
                description: 'Вариант названия пуст после нормализации',
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь каталога не найдена' }), (0, swagger_1.ApiConflictResponse)({
                description: 'Такой вариант названия уже добавлен к запчасти',
            })];
        _deletePartAlias_decorators = [(0, common_1.Delete)(':partCatalogItemId/aliases/:partAliasId'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Удалить вариант названия канонической запчасти' }), (0, swagger_1.ApiParam)({ name: 'partCatalogItemId', format: 'uuid' }), (0, swagger_1.ApiParam)({ name: 'partAliasId', format: 'uuid' }), (0, swagger_1.ApiOkResponse)({ description: 'Вариант названия удалён' }), (0, swagger_1.ApiNotFoundResponse)({
                description: 'Вариант названия не найден у указанной запчасти',
            })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER), (0, swagger_1.ApiOperation)({
                summary: 'Получить деталь и её совместимости с автомобилями',
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь каталога не найдена' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({
                summary: 'Изменить запись каталога',
                description: 'internalCode изменить нельзя',
            }), (0, swagger_1.ApiBadRequestResponse)({
                description: 'Категория неактивна, не конечная либо нельзя сделать деталь универсальной',
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь или категория не найдены' }), (0, swagger_1.ApiConflictResponse)({ description: 'Дубликат детали в категории' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({
                summary: 'Мягко отключить деталь каталога',
                description: 'Устанавливает isActive=false, compatibility сохраняются',
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Деталь каталога не найдена' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findCandidates_decorators, { kind: "method", name: "findCandidates", static: false, private: false, access: { has: function (obj) { return "findCandidates" in obj; }, get: function (obj) { return obj.findCandidates; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPartNumbers_decorators, { kind: "method", name: "getPartNumbers", static: false, private: false, access: { has: function (obj) { return "getPartNumbers" in obj; }, get: function (obj) { return obj.getPartNumbers; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addPartNumber_decorators, { kind: "method", name: "addPartNumber", static: false, private: false, access: { has: function (obj) { return "addPartNumber" in obj; }, get: function (obj) { return obj.addPartNumber; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deletePartNumber_decorators, { kind: "method", name: "deletePartNumber", static: false, private: false, access: { has: function (obj) { return "deletePartNumber" in obj; }, get: function (obj) { return obj.deletePartNumber; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPartAliases_decorators, { kind: "method", name: "getPartAliases", static: false, private: false, access: { has: function (obj) { return "getPartAliases" in obj; }, get: function (obj) { return obj.getPartAliases; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addPartAlias_decorators, { kind: "method", name: "addPartAlias", static: false, private: false, access: { has: function (obj) { return "addPartAlias" in obj; }, get: function (obj) { return obj.addPartAlias; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deletePartAlias_decorators, { kind: "method", name: "deletePartAlias", static: false, private: false, access: { has: function (obj) { return "deletePartAlias" in obj; }, get: function (obj) { return obj.deletePartAlias; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartCatalogController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartCatalogController = _classThis;
}();
exports.PartCatalogController = PartCatalogController;
