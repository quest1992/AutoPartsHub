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
exports.SalesService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var SalesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SalesService = _classThis = /** @class */ (function () {
        function SalesService_1(p) {
            this.p = p;
        }
        SalesService_1.prototype.shop = function (a, id) {
            if (a.role === client_1.UserRole.SUPER_ADMIN) {
                if (!id)
                    throw new common_1.BadRequestException('Необходимо указать shopId');
                return id;
            }
            if (!a.shopId)
                throw new common_1.ForbiddenException('Пользователь не привязан к магазину');
            if (id && id !== a.shopId)
                throw new common_1.ForbiddenException('Нельзя создать продажу другого магазина');
            return a.shopId;
        };
        SalesService_1.prototype.create = function (d, a) {
            return __awaiter(this, void 0, void 0, function () {
                var shopId;
                var _this = this;
                return __generator(this, function (_a) {
                    shopId = this.shop(a, d.shopId);
                    if (new Set(d.items.map(function (x) { return x.inventoryItemId; })).size !== d.items.length)
                        throw new common_1.BadRequestException('Складская позиция указана дважды');
                    return [2 /*return*/, this.p.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var seq, items, subtotal, _loop_1, _i, _a, l, discount, number, sale, _loop_2, _b, _c, l;
                            var _d, _e, _f, _g;
                            return __generator(this, function (_h) {
                                switch (_h.label) {
                                    case 0: return [4 /*yield*/, tx.appSequence.upsert({
                                            where: { key: 'SALE' },
                                            create: { key: 'SALE', value: 1 },
                                            update: { value: { increment: 1 } },
                                        })];
                                    case 1:
                                        seq = _h.sent();
                                        return [4 /*yield*/, tx.shopInventoryItem.findMany({
                                                where: { id: { in: d.items.map(function (x) { return x.inventoryItemId; }) } },
                                                include: { partCatalogItem: true },
                                            })];
                                    case 2:
                                        items = _h.sent();
                                        if (items.length !== d.items.length)
                                            throw new common_1.NotFoundException('Складская позиция не найдена');
                                        if (items.some(function (i) { return i.shopId !== shopId; }))
                                            throw new common_1.ForbiddenException('Складская позиция принадлежит другому магазину');
                                        if (items.some(function (i) { return !i.isActive; }))
                                            throw new common_1.BadRequestException('Нельзя продать неактивную складскую позицию');
                                        if (new Set(items.map(function (i) { return i.currency; })).size !== 1)
                                            throw new common_1.BadRequestException('Все позиции продажи должны иметь одинаковую валюту');
                                        subtotal = new client_1.Prisma.Decimal(0);
                                        _loop_1 = function (l) {
                                            var i = items.find(function (x) { return x.id === l.inventoryItemId; });
                                            subtotal = subtotal.plus(i.price.mul(l.quantity));
                                        };
                                        for (_i = 0, _a = d.items; _i < _a.length; _i++) {
                                            l = _a[_i];
                                            _loop_1(l);
                                        }
                                        discount = new client_1.Prisma.Decimal((_d = d.discount) !== null && _d !== void 0 ? _d : 0);
                                        if (discount.gt(subtotal))
                                            throw new common_1.BadRequestException('Скидка не может превышать сумму продажи');
                                        number = "SALE-".concat(String(seq.value).padStart(6, '0'));
                                        return [4 /*yield*/, tx.sale.create({
                                                data: {
                                                    number: number,
                                                    shopId: shopId,
                                                    userId: a.id,
                                                    customerName: ((_e = d.customerName) === null || _e === void 0 ? void 0 : _e.trim()) || null,
                                                    customerPhone: ((_f = d.customerPhone) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                                                    notes: ((_g = d.notes) === null || _g === void 0 ? void 0 : _g.trim()) || null,
                                                    currency: items[0].currency,
                                                    subtotal: subtotal,
                                                    discount: discount,
                                                    totalAmount: subtotal.minus(discount),
                                                },
                                            })];
                                    case 3:
                                        sale = _h.sent();
                                        _loop_2 = function (l) {
                                            var i;
                                            return __generator(this, function (_j) {
                                                switch (_j.label) {
                                                    case 0:
                                                        i = items.find(function (x) { return x.id === l.inventoryItemId; });
                                                        return [4 /*yield*/, tx.shopInventoryItem.updateMany({
                                                                where: {
                                                                    id: i.id,
                                                                    quantity: { gte: l.quantity },
                                                                    isActive: true,
                                                                },
                                                                data: { quantity: { decrement: l.quantity } },
                                                            })];
                                                    case 1:
                                                        if (!(_j.sent()).count)
                                                            throw new common_1.ConflictException('Недостаточно товара на складе');
                                                        return [4 /*yield*/, tx.saleItem.create({
                                                                data: {
                                                                    saleId: sale.id,
                                                                    inventoryItemId: i.id,
                                                                    partCatalogItemId: i.partCatalogItemId,
                                                                    itemName: i.partCatalogItem.name,
                                                                    brand: i.brand,
                                                                    sku: i.sku,
                                                                    oemNumber: i.oemNumber,
                                                                    quantity: l.quantity,
                                                                    unitPrice: i.price,
                                                                    lineTotal: i.price.mul(l.quantity),
                                                                },
                                                            })];
                                                    case 2:
                                                        _j.sent();
                                                        return [4 /*yield*/, tx.inventoryMovement.create({
                                                                data: {
                                                                    shopId: shopId,
                                                                    inventoryItemId: i.id,
                                                                    userId: a.id,
                                                                    type: client_1.InventoryMovementType.SALE,
                                                                    change: -l.quantity,
                                                                    quantityBefore: i.quantity,
                                                                    quantityAfter: i.quantity - l.quantity,
                                                                    reference: number,
                                                                    notes: "\u041F\u0440\u043E\u0434\u0430\u0436\u0430 ".concat(number),
                                                                },
                                                            })];
                                                    case 3:
                                                        _j.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _b = 0, _c = d.items;
                                        _h.label = 4;
                                    case 4:
                                        if (!(_b < _c.length)) return [3 /*break*/, 7];
                                        l = _c[_b];
                                        return [5 /*yield**/, _loop_2(l)];
                                    case 5:
                                        _h.sent();
                                        _h.label = 6;
                                    case 6:
                                        _b++;
                                        return [3 /*break*/, 4];
                                    case 7: return [2 /*return*/, sale];
                                }
                            });
                        }); }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable })];
                });
            });
        };
        SalesService_1.prototype.all = function (a, query) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, minTotal, maxTotal, search, where, allowed, sortBy, sortOrder, _a, data, total;
                var _b;
                var _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            page = (_c = query.page) !== null && _c !== void 0 ? _c : 1;
                            limit = (_d = query.limit) !== null && _d !== void 0 ? _d : 20;
                            if (query.dateFrom &&
                                query.dateTo &&
                                new Date(query.dateFrom) > new Date(query.dateTo))
                                throw new common_1.BadRequestException('dateFrom не может быть позже dateTo');
                            minTotal = query.minTotal === undefined
                                ? undefined
                                : new client_1.Prisma.Decimal(query.minTotal);
                            maxTotal = query.maxTotal === undefined
                                ? undefined
                                : new client_1.Prisma.Decimal(query.maxTotal);
                            if (minTotal === null || minTotal === void 0 ? void 0 : minTotal.gt(maxTotal !== null && maxTotal !== void 0 ? maxTotal : minTotal))
                                throw new common_1.BadRequestException('minTotal не может быть больше maxTotal');
                            if (a.role !== client_1.UserRole.SUPER_ADMIN &&
                                query.shopId &&
                                query.shopId !== this.shop(a))
                                throw new common_1.ForbiddenException('Нельзя просматривать продажи другого магазина');
                            search = (_e = query.search) === null || _e === void 0 ? void 0 : _e.trim();
                            where = __assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (a.role === client_1.UserRole.SUPER_ADMIN
                                ? query.shopId
                                    ? { shopId: query.shopId }
                                    : {}
                                : { shopId: this.shop(a) })), (query.status && { status: query.status })), (query.userId && { userId: query.userId })), (query.customerPhone && {
                                customerPhone: { contains: query.customerPhone, mode: 'insensitive' },
                            })), (search && {
                                OR: [
                                    { number: { contains: search, mode: 'insensitive' } },
                                    { customerName: { contains: search, mode: 'insensitive' } },
                                    { customerPhone: { contains: search, mode: 'insensitive' } },
                                    { notes: { contains: search, mode: 'insensitive' } },
                                ],
                            })), ((query.dateFrom || query.dateTo) && {
                                createdAt: __assign(__assign({}, (query.dateFrom && { gte: new Date(query.dateFrom) })), (query.dateTo && {
                                    lte: new Date("".concat(query.dateTo, "T23:59:59.999Z")),
                                })),
                            })), ((minTotal || maxTotal) && {
                                totalAmount: __assign(__assign({}, (minTotal && { gte: minTotal })), (maxTotal && { lte: maxTotal })),
                            }));
                            allowed = [
                                'createdAt',
                                'number',
                                'subtotal',
                                'discount',
                                'totalAmount',
                            ];
                            sortBy = allowed.includes(query.sortBy)
                                ? query.sortBy
                                : 'createdAt';
                            sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
                            return [4 /*yield*/, Promise.all([
                                    this.p.sale.findMany({
                                        where: where,
                                        include: {
                                            shop: { select: { id: true, name: true } },
                                            user: {
                                                select: { id: true, phone: true, firstName: true, lastName: true },
                                            },
                                            cancelledBy: {
                                                select: { id: true, phone: true, firstName: true, lastName: true },
                                            },
                                            _count: { select: { items: true } },
                                        },
                                        orderBy: (_b = {}, _b[sortBy] = sortOrder, _b),
                                        skip: (page - 1) * limit,
                                        take: limit,
                                    }),
                                    this.p.sale.count({ where: where }),
                                ])];
                        case 1:
                            _a = _f.sent(), data = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    data: data,
                                    meta: { page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit) },
                                }];
                    }
                });
            });
        };
        SalesService_1.prototype.one = function (id, a) {
            return __awaiter(this, void 0, void 0, function () {
                var s;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.p.sale.findUnique({
                                where: { id: id },
                                include: {
                                    items: {
                                        include: {
                                            inventoryItem: true,
                                            partCatalogItem: { include: { category: true } },
                                        },
                                    },
                                    shop: true,
                                    user: true,
                                    cancelledBy: true,
                                },
                            })];
                        case 1:
                            s = _a.sent();
                            if (!s || (a.role !== client_1.UserRole.SUPER_ADMIN && s.shopId !== this.shop(a)))
                                throw new common_1.NotFoundException('Продажа не найдена');
                            return [2 /*return*/, s];
                    }
                });
            });
        };
        SalesService_1.prototype.cancel = function (id, d, a) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (a.role === client_1.UserRole.SELLER)
                        throw new common_1.ForbiddenException('Отменять продажу может только администратор или менеджер магазина');
                    return [2 /*return*/, this.p.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var s, _i, _a, x, i;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, tx.sale.findUnique({
                                            where: { id: id },
                                            include: { items: true },
                                        })];
                                    case 1:
                                        s = _b.sent();
                                        if (!s ||
                                            (a.role !== client_1.UserRole.SUPER_ADMIN && s.shopId !== this.shop(a)))
                                            throw new common_1.NotFoundException('Продажа не найдена');
                                        if (s.status === client_1.SaleStatus.CANCELLED)
                                            throw new common_1.ConflictException('Продажа уже отменена');
                                        _i = 0, _a = s.items;
                                        _b.label = 2;
                                    case 2:
                                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                                        x = _a[_i];
                                        return [4 /*yield*/, tx.shopInventoryItem.findUniqueOrThrow({
                                                where: { id: x.inventoryItemId },
                                            })];
                                    case 3:
                                        i = _b.sent();
                                        return [4 /*yield*/, tx.shopInventoryItem.update({
                                                where: { id: i.id },
                                                data: { quantity: { increment: x.quantity } },
                                            })];
                                    case 4:
                                        _b.sent();
                                        return [4 /*yield*/, tx.inventoryMovement.create({
                                                data: {
                                                    shopId: s.shopId,
                                                    inventoryItemId: i.id,
                                                    userId: a.id,
                                                    type: client_1.InventoryMovementType.SALE_CANCEL,
                                                    change: x.quantity,
                                                    quantityBefore: i.quantity,
                                                    quantityAfter: i.quantity + x.quantity,
                                                    reference: s.number,
                                                    notes: "\u041E\u0442\u043C\u0435\u043D\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0438 ".concat(s.number, ": ").concat(d.reason),
                                                },
                                            })];
                                    case 5:
                                        _b.sent();
                                        _b.label = 6;
                                    case 6:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 7: return [2 /*return*/, tx.sale.update({
                                            where: { id: id },
                                            data: {
                                                status: client_1.SaleStatus.CANCELLED,
                                                cancelledAt: new Date(),
                                                cancelledById: a.id,
                                                cancelReason: d.reason,
                                            },
                                        })];
                                }
                            });
                        }); }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable })];
                });
            });
        };
        return SalesService_1;
    }());
    __setFunctionName(_classThis, "SalesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SalesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SalesService = _classThis;
}();
exports.SalesService = SalesService;
