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
exports.VehicleGenerationsController = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var swagger_1 = require("@nestjs/swagger");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var roles_guard_1 = require("../../common/guards/roles.guard");
var require_permissions_decorator_1 = require("../../common/permissions/require-permissions.decorator");
var permission_enum_1 = require("../../common/permissions/permission.enum");
var permissions_guard_1 = require("../../common/permissions/permissions.guard");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var VehicleGenerationsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Поколения автомобилей'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER, client_1.UserRole.VIEWER), (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Требуется действующий JWT' }), (0, swagger_1.ApiForbiddenResponse)({ description: 'Доступен только SUPER_ADMIN' }), (0, common_1.Controller)('vehicle-generations')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var VehicleGenerationsController = _classThis = /** @class */ (function () {
        function VehicleGenerationsController_1(vehicleGenerationsService) {
            this.vehicleGenerationsService = (__runInitializers(this, _instanceExtraInitializers), vehicleGenerationsService);
        }
        VehicleGenerationsController_1.prototype.create = function (createVehicleGenerationDto) {
            return this.vehicleGenerationsService.create(createVehicleGenerationDto);
        };
        VehicleGenerationsController_1.prototype.findAll = function (query) {
            return this.vehicleGenerationsService.findAll(query);
        };
        VehicleGenerationsController_1.prototype.findOne = function (id) {
            return this.vehicleGenerationsService.findOne(id);
        };
        VehicleGenerationsController_1.prototype.update = function (id, updateVehicleGenerationDto) {
            return this.vehicleGenerationsService.update(id, updateVehicleGenerationDto);
        };
        VehicleGenerationsController_1.prototype.remove = function (id) {
            return this.vehicleGenerationsService.remove(id);
        };
        return VehicleGenerationsController_1;
    }());
    __setFunctionName(_classThis, "VehicleGenerationsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Создать поколение автомобиля' }), (0, swagger_1.ApiCreatedResponse)({ description: 'Поколение автомобиля создано' }), (0, swagger_1.ApiBadRequestResponse)({
                description: 'Данные некорректны или связанная запись отключена',
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Модель автомобиля не найдена' }), (0, swagger_1.ApiConflictResponse)({ description: 'Название или slug уже заняты у модели' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Получить список поколений автомобилей' }), (0, swagger_1.ApiOkResponse)({ description: 'Список поколений автомобилей получен' }), (0, swagger_1.ApiBadRequestResponse)({ description: 'Параметры фильтрации некорректны' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Получить поколение автомобиля по ID' }), (0, swagger_1.ApiOkResponse)({ description: 'Поколение автомобиля получено' }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Поколение автомобиля не найдено' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Обновить поколение автомобиля' }), (0, swagger_1.ApiOkResponse)({ description: 'Поколение автомобиля обновлено' }), (0, swagger_1.ApiBadRequestResponse)({
                description: 'Данные некорректны или связанная запись отключена',
            }), (0, swagger_1.ApiNotFoundResponse)({
                description: 'Поколение или модель автомобиля не найдены',
            }), (0, swagger_1.ApiConflictResponse)({ description: 'Название или slug уже заняты у модели' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.CATALOG_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Отключить поколение автомобиля' }), (0, swagger_1.ApiOkResponse)({ description: 'Поколение автомобиля отключено' }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Поколение автомобиля не найдено' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VehicleGenerationsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VehicleGenerationsController = _classThis;
}();
exports.VehicleGenerationsController = VehicleGenerationsController;
