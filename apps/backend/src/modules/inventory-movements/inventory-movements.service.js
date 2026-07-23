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
exports.InventoryMovementsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var include = {
    shop: { select: { id: true, name: true } },
    user: { select: { id: true, phone: true, firstName: true, lastName: true } },
    inventoryItem: {
        include: {
            partCatalogItem: {
                select: {
                    id: true,
                    internalCode: true,
                    name: true,
                    side: true,
                    position: true,
                    category: { include: { parent: true } },
                },
            },
        },
    },
};
var InventoryMovementsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var InventoryMovementsService = _classThis = /** @class */ (function () {
        function InventoryMovementsService_1(prisma) {
            this.prisma = prisma;
        }
        InventoryMovementsService_1.prototype.admin = function (a) {
            return a.role === client_1.UserRole.SUPER_ADMIN;
        };
        InventoryMovementsService_1.prototype.shop = function (a) {
            if (!a.shopId)
                throw new common_1.ForbiddenException('Пользователь не привязан к магазину');
            return a.shopId;
        };
        InventoryMovementsService_1.prototype.findAll = function (q, a) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, shopId, where, _a, data, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            page = (_b = q.page) !== null && _b !== void 0 ? _b : 1, limit = (_c = q.limit) !== null && _c !== void 0 ? _c : 20, shopId = this.admin(a) ? q.shopId : this.shop(a);
                            where = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (shopId && { shopId: shopId })), (q.inventoryItemId && { inventoryItemId: q.inventoryItemId })), (q.partCatalogItemId && {
                                inventoryItem: { partCatalogItemId: q.partCatalogItemId },
                            })), (q.userId && { userId: q.userId })), (q.type && { type: q.type })), (q.reference && {
                                reference: { contains: q.reference, mode: 'insensitive' },
                            })), ((q.dateFrom || q.dateTo) && {
                                createdAt: __assign(__assign({}, (q.dateFrom && { gte: new Date(q.dateFrom) })), (q.dateTo && { lte: new Date("".concat(q.dateTo, "T23:59:59.999Z")) })),
                            })), (q.search && {
                                OR: [
                                    { reference: { contains: q.search, mode: 'insensitive' } },
                                    { notes: { contains: q.search, mode: 'insensitive' } },
                                    {
                                        inventoryItem: { sku: { contains: q.search, mode: 'insensitive' } },
                                    },
                                    {
                                        inventoryItem: {
                                            partCatalogItem: {
                                                name: { contains: q.search, mode: 'insensitive' },
                                            },
                                        },
                                    },
                                ],
                            }));
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.inventoryMovement.findMany({
                                        where: where,
                                        include: include,
                                        orderBy: { createdAt: 'desc' },
                                        skip: (page - 1) * limit,
                                        take: limit,
                                    }),
                                    this.prisma.inventoryMovement.count({ where: where }),
                                ])];
                        case 1:
                            _a = _d.sent(), data = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    data: data,
                                    meta: { page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit) },
                                }];
                    }
                });
            });
        };
        InventoryMovementsService_1.prototype.findOne = function (id, a) {
            return __awaiter(this, void 0, void 0, function () {
                var m;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.inventoryMovement.findUnique({
                                where: { id: id },
                                include: include,
                            })];
                        case 1:
                            m = _a.sent();
                            if (!m || (!this.admin(a) && m.shopId !== this.shop(a)))
                                throw new common_1.NotFoundException('Движение склада не найдено');
                            return [2 /*return*/, m];
                    }
                });
            });
        };
        InventoryMovementsService_1.prototype.byItem = function (id, a) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.findAll({ inventoryItemId: id }, a)];
                });
            });
        };
        return InventoryMovementsService_1;
    }());
    __setFunctionName(_classThis, "InventoryMovementsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InventoryMovementsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InventoryMovementsService = _classThis;
}();
exports.InventoryMovementsService = InventoryMovementsService;
