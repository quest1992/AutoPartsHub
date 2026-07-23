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
exports.ShopsController = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var swagger_1 = require("@nestjs/swagger");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var roles_guard_1 = require("../../common/guards/roles.guard");
var permission_enum_1 = require("../../common/permissions/permission.enum");
var permissions_guard_1 = require("../../common/permissions/permissions.guard");
var require_permissions_decorator_1 = require("../../common/permissions/require-permissions.decorator");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var ShopsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Магазины'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN), (0, common_1.Controller)('shops')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _findAll_decorators;
    var _create_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _deactivate_decorators;
    var ShopsController = _classThis = /** @class */ (function () {
        function ShopsController_1(shopsService) {
            this.shopsService = (__runInitializers(this, _instanceExtraInitializers), shopsService);
        }
        ShopsController_1.prototype.findAll = function (query) { return this.shopsService.findAll(query.includeInactive); };
        ShopsController_1.prototype.create = function (dto) { return this.shopsService.create(dto); };
        ShopsController_1.prototype.findOne = function (id) { return this.shopsService.findOne(id); };
        ShopsController_1.prototype.update = function (id, dto) { return this.shopsService.update(id, dto); };
        ShopsController_1.prototype.deactivate = function (id) { return this.shopsService.deactivate(id); };
        return ShopsController_1;
    }());
    __setFunctionName(_classThis, "ShopsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [(0, common_1.Get)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SHOPS_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Список магазинов' }), (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }), (0, swagger_1.ApiOkResponse)(), (0, swagger_1.ApiUnauthorizedResponse)(), (0, swagger_1.ApiForbiddenResponse)()];
        _create_decorators = [(0, common_1.Post)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SHOPS_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Создать магазин' }), (0, swagger_1.ApiCreatedResponse)(), (0, swagger_1.ApiBadRequestResponse)(), (0, swagger_1.ApiUnauthorizedResponse)(), (0, swagger_1.ApiForbiddenResponse)()];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SHOPS_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Получить магазин' }), (0, swagger_1.ApiOkResponse)(), (0, swagger_1.ApiUnauthorizedResponse)(), (0, swagger_1.ApiForbiddenResponse)(), (0, swagger_1.ApiNotFoundResponse)()];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SHOPS_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Обновить магазин' }), (0, swagger_1.ApiOkResponse)(), (0, swagger_1.ApiBadRequestResponse)(), (0, swagger_1.ApiUnauthorizedResponse)(), (0, swagger_1.ApiForbiddenResponse)(), (0, swagger_1.ApiNotFoundResponse)()];
        _deactivate_decorators = [(0, common_1.Post)(':id/deactivate'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SHOPS_MANAGE), (0, swagger_1.ApiOperation)({ summary: 'Деактивировать магазин' }), (0, swagger_1.ApiOkResponse)(), (0, swagger_1.ApiUnauthorizedResponse)(), (0, swagger_1.ApiForbiddenResponse)(), (0, swagger_1.ApiNotFoundResponse)()];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deactivate_decorators, { kind: "method", name: "deactivate", static: false, private: false, access: { has: function (obj) { return "deactivate" in obj; }, get: function (obj) { return obj.deactivate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ShopsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ShopsController = _classThis;
}();
exports.ShopsController = ShopsController;
