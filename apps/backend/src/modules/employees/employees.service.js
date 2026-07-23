"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var bcrypt = require("bcryptjs");
var employeeRoles = [client_1.UserRole.SHOP_ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.SELLER, client_1.UserRole.VIEWER];
var select = { id: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, shopId: true, createdAt: true, updatedAt: true, shop: { select: { id: true, name: true, isActive: true } } };
var EmployeesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EmployeesService = _classThis = /** @class */ (function () {
        function EmployeesService_1(prisma) {
            this.prisma = prisma;
        }
        EmployeesService_1.prototype.shop = function (actor_1, requested_1) {
            return __awaiter(this, arguments, void 0, function (actor, requested, active) {
                var shop;
                if (active === void 0) { active = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (actor.role === client_1.UserRole.SHOP_ADMIN) {
                                if (!actor.shopId || (requested && requested !== actor.shopId))
                                    throw new common_1.ForbiddenException('Нет доступа к магазину');
                                requested = actor.shopId;
                            }
                            else if (actor.role !== client_1.UserRole.SUPER_ADMIN)
                                throw new common_1.ForbiddenException('Нет доступа к сотрудникам');
                            if (!requested)
                                throw new common_1.BadRequestException('Для SUPER_ADMIN требуется shopId');
                            return [4 /*yield*/, this.prisma.shop.findUnique({ where: { id: requested } })];
                        case 1:
                            shop = _a.sent();
                            if (!shop)
                                throw new common_1.NotFoundException('Магазин не найден');
                            if (active && !shop.isActive)
                                throw new common_1.BadRequestException('Магазин отключён');
                            return [2 /*return*/, requested];
                    }
                });
            });
        };
        EmployeesService_1.prototype.allowed = function (actor, role) {
            if (!employeeRoles.includes(role) || role === client_1.UserRole.SUPER_ADMIN)
                throw new common_1.BadRequestException('Недопустимая роль сотрудника');
            if (actor.role === client_1.UserRole.SHOP_ADMIN && role === client_1.UserRole.SHOP_ADMIN)
                throw new common_1.ForbiddenException('SHOP_ADMIN не может назначать администратора');
        };
        EmployeesService_1.prototype.list = function (actor, q) {
            return __awaiter(this, void 0, void 0, function () { var shopId, page, limit, search, where, _a, items, total; var _b, _c, _d; return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.shop(actor, q.shopId)];
                    case 1:
                        shopId = _e.sent();
                        page = (_b = q.page) !== null && _b !== void 0 ? _b : 1, limit = (_c = q.limit) !== null && _c !== void 0 ? _c : 20, search = (_d = q.search) === null || _d === void 0 ? void 0 : _d.trim();
                        where = __assign(__assign(__assign({ shopId: shopId, role: { not: client_1.UserRole.SUPER_ADMIN } }, (q.role ? { role: q.role } : {})), (q.isActive !== undefined ? { isActive: q.isActive } : {})), (search ? { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } }] } : {}));
                        return [4 /*yield*/, Promise.all([this.prisma.user.findMany({ where: where, select: select, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.user.count({ where: where })])];
                    case 2:
                        _a = _e.sent(), items = _a[0], total = _a[1];
                        return [2 /*return*/, { items: items, page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit) }];
                }
            }); });
        };
        EmployeesService_1.prototype.create = function (actor, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var shopId, phone, _a, _b, e_1;
                var _c, _d;
                var _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.shop(actor, dto.shopId, true)];
                        case 1:
                            shopId = _f.sent();
                            this.allowed(actor, dto.role);
                            phone = dto.phone.trim();
                            return [4 /*yield*/, this.prisma.user.findUnique({ where: { phone: phone } })];
                        case 2:
                            if (_f.sent())
                                throw new common_1.ConflictException('Пользователь с таким телефоном уже существует');
                            _f.label = 3;
                        case 3:
                            _f.trys.push([3, 6, , 7]);
                            _b = (_a = this.prisma.user).create;
                            _c = {};
                            _d = { firstName: dto.firstName.trim(), lastName: (_e = dto.lastName) === null || _e === void 0 ? void 0 : _e.trim(), phone: phone, role: dto.role, shopId: shopId };
                            return [4 /*yield*/, bcrypt.hash(dto.temporaryPassword, 12)];
                        case 4: return [4 /*yield*/, _b.apply(_a, [(_c.data = (_d.passwordHash = _f.sent(), _d), _c.select = select, _c)])];
                        case 5: return [2 /*return*/, _f.sent()];
                        case 6:
                            e_1 = _f.sent();
                            if (e_1.code === 'P2002')
                                throw new common_1.ConflictException('Пользователь с таким телефоном уже существует');
                            throw e_1;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        EmployeesService_1.prototype.findOne = function (actor, id, shopId) {
            return __awaiter(this, void 0, void 0, function () { var sid, user; return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.shop(actor, shopId)];
                    case 1:
                        sid = _a.sent();
                        return [4 /*yield*/, this.prisma.user.findFirst({ where: { id: id, shopId: sid, role: { not: client_1.UserRole.SUPER_ADMIN } }, select: select })];
                    case 2:
                        user = _a.sent();
                        if (!user)
                            throw new common_1.NotFoundException('Сотрудник не найден');
                        return [2 /*return*/, user];
                }
            }); });
        };
        EmployeesService_1.prototype.update = function (actor, id, dto, shopId) {
            return __awaiter(this, void 0, void 0, function () {
                var sid;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.shop(actor, shopId)];
                        case 1:
                            sid = _a.sent();
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () { var target, others, phone, exists; var _a; return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, tx.user.findFirst({ where: { id: id, shopId: sid, role: { not: client_1.UserRole.SUPER_ADMIN } } })];
                                        case 1:
                                            target = _b.sent();
                                            if (!target)
                                                throw new common_1.NotFoundException('Сотрудник не найден');
                                            if (target.id === actor.id && (dto.isActive === false || dto.role && dto.role !== target.role))
                                                throw new common_1.ForbiddenException('Нельзя менять свою роль или отключать себя');
                                            if (actor.role === client_1.UserRole.SHOP_ADMIN && (target.role === client_1.UserRole.SHOP_ADMIN || dto.role === client_1.UserRole.SHOP_ADMIN))
                                                throw new common_1.ForbiddenException('SHOP_ADMIN не может управлять администраторами');
                                            if (dto.role)
                                                this.allowed(actor, dto.role);
                                            if (!(target.role === client_1.UserRole.SHOP_ADMIN && target.isActive && (dto.isActive === false || (dto.role && dto.role !== client_1.UserRole.SHOP_ADMIN)))) return [3 /*break*/, 3];
                                            return [4 /*yield*/, tx.user.count({ where: { shopId: sid, id: { not: id }, role: client_1.UserRole.SHOP_ADMIN, isActive: true } })];
                                        case 2:
                                            others = _b.sent();
                                            if (!others)
                                                throw new common_1.ConflictException('Нельзя деактивировать или изменить роль последнего администратора магазина');
                                            _b.label = 3;
                                        case 3:
                                            phone = (_a = dto.phone) === null || _a === void 0 ? void 0 : _a.trim();
                                            if (!phone) return [3 /*break*/, 5];
                                            return [4 /*yield*/, tx.user.findFirst({ where: { phone: phone, id: { not: id } } })];
                                        case 4:
                                            exists = _b.sent();
                                            if (exists)
                                                throw new common_1.ConflictException('Пользователь с таким телефоном уже существует');
                                            _b.label = 5;
                                        case 5: return [2 /*return*/, tx.user.update({ where: { id: id }, data: __assign(__assign({}, dto), (phone ? { phone: phone } : {})), select: select })];
                                    }
                                }); }); }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable })];
                    }
                });
            });
        };
        EmployeesService_1.prototype.resetPassword = function (actor, id, dto, shopId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, _a, _b;
                var _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.findOne(actor, id, shopId)];
                        case 1:
                            user = _e.sent();
                            if (actor.role === client_1.UserRole.SHOP_ADMIN && user.role === client_1.UserRole.SHOP_ADMIN)
                                throw new common_1.ForbiddenException('Нельзя сбрасывать пароль администратора');
                            _b = (_a = this.prisma.user).update;
                            _c = { where: { id: id } };
                            _d = {};
                            return [4 /*yield*/, bcrypt.hash(dto.temporaryPassword, 12)];
                        case 2: return [4 /*yield*/, _b.apply(_a, [(_c.data = (_d.passwordHash = _e.sent(), _d), _c)])];
                        case 3:
                            _e.sent();
                            return [2 /*return*/, { success: true, message: 'Пароль сотрудника обновлён' }];
                    }
                });
            });
        };
        return EmployeesService_1;
    }());
    __setFunctionName(_classThis, "EmployeesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmployeesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmployeesService = _classThis;
}();
exports.EmployeesService = EmployeesService;
