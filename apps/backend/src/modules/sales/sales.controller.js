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
exports.SalesController = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var swagger_1 = require("@nestjs/swagger");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var require_permissions_decorator_1 = require("../../common/permissions/require-permissions.decorator");
var permission_enum_1 = require("../../common/permissions/permission.enum");
var permissions_guard_1 = require("../../common/permissions/permissions.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var SalesController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Sales'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard), (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER, client_1.UserRole.VIEWER), (0, common_1.Controller)('sales')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _all_decorators;
    var _one_decorators;
    var _cancel_decorators;
    var SalesController = _classThis = /** @class */ (function () {
        function SalesController_1(s) {
            this.s = (__runInitializers(this, _instanceExtraInitializers), s);
        }
        SalesController_1.prototype.create = function (d, r) {
            return this.s.create(d, r.user);
        };
        SalesController_1.prototype.all = function (q, r) {
            return this.s.all(r.user, q);
        };
        SalesController_1.prototype.one = function (id, r) {
            return this.s.one(id, r.user);
        };
        SalesController_1.prototype.cancel = function (id, d, r) {
            return this.s.cancel(id, d, r.user);
        };
        return SalesController_1;
    }());
    __setFunctionName(_classThis, "SalesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SALES_CREATE), (0, swagger_1.ApiOperation)({ summary: 'Создать продажу' })];
        _all_decorators = [(0, common_1.Get)(), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SALES_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Список продаж' })];
        _one_decorators = [(0, common_1.Get)(':id'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SALES_VIEW), (0, swagger_1.ApiOperation)({ summary: 'Продажа по ID' })];
        _cancel_decorators = [(0, common_1.Post)(':id/cancel'), (0, require_permissions_decorator_1.RequirePermissions)(permission_enum_1.Permission.SALES_CANCEL), (0, swagger_1.ApiOperation)({ summary: 'Отменить продажу' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _all_decorators, { kind: "method", name: "all", static: false, private: false, access: { has: function (obj) { return "all" in obj; }, get: function (obj) { return obj.all; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _one_decorators, { kind: "method", name: "one", static: false, private: false, access: { has: function (obj) { return "one" in obj; }, get: function (obj) { return obj.one; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: function (obj) { return "cancel" in obj; }, get: function (obj) { return obj.cancel; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SalesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SalesController = _classThis;
}();
exports.SalesController = SalesController;
