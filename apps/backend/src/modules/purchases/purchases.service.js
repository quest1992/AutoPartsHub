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
exports.PurchasesService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var PurchasesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PurchasesService = _classThis = /** @class */ (function () {
        function PurchasesService_1(p) {
            this.p = p;
        }
        PurchasesService_1.prototype.shop = function (a, id) {
            if (a.role === client_1.UserRole.SUPER_ADMIN) {
                if (!id)
                    throw new common_1.BadRequestException('Необходимо указать shopId');
                return id;
            }
            if (!a.shopId)
                throw new common_1.ForbiddenException('Пользователь не привязан к магазину');
            if (id && id !== a.shopId)
                throw new common_1.ForbiddenException('Нельзя работать с другим магазином');
            return a.shopId;
        };
        PurchasesService_1.prototype.serializable = function (work) {
            return __awaiter(this, void 0, void 0, function () {
                var attempt, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            attempt = 1;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.p.$transaction(work, {
                                    isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
                                })];
                        case 2: return [2 /*return*/, _a.sent()];
                        case 3:
                            error_1 = _a.sent();
                            if (error_1.code !== 'P2034' || attempt >= 3)
                                throw error_1;
                            return [3 /*break*/, 4];
                        case 4:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        PurchasesService_1.prototype.detail = function (id, a, tx) {
            var _this = this;
            var db = tx !== null && tx !== void 0 ? tx : this.p;
            return db.purchase
                .findUnique({
                where: { id: id },
                include: {
                    shop: true,
                    user: {
                        select: { id: true, phone: true, firstName: true, lastName: true },
                    },
                    cancelledBy: {
                        select: { id: true, phone: true, firstName: true, lastName: true },
                    },
                    items: {
                        include: {
                            inventoryItem: true,
                            partCatalogItem: { include: { category: true } },
                        },
                    },
                },
            })
                .then(function (x) {
                if (!x ||
                    (a.role !== client_1.UserRole.SUPER_ADMIN && x.shopId !== _this.shop(a)))
                    throw new common_1.NotFoundException('Закупка не найдена');
                return x;
            });
        };
        PurchasesService_1.prototype.create = function (d, a) {
            return __awaiter(this, void 0, void 0, function () {
                var shopId;
                var _this = this;
                return __generator(this, function (_a) {
                    shopId = this.shop(a, d.shopId);
                    if (new Set(d.items.map(function (x) { return x.inventoryItemId; })).size !== d.items.length)
                        throw new common_1.BadRequestException('Складская позиция указана дважды');
                    return [2 /*return*/, this.serializable(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var shop, items, subtotal, _i, _a, line, discount, seq, number, purchase, _loop_1, _b, _c, line;
                            var _d, _e, _f, _g, _h;
                            return __generator(this, function (_j) {
                                switch (_j.label) {
                                    case 0: return [4 /*yield*/, tx.shop.findUnique({ where: { id: shopId } })];
                                    case 1:
                                        shop = _j.sent();
                                        if (!shop)
                                            throw new common_1.NotFoundException('Магазин не найден');
                                        if (!shop.isActive)
                                            throw new common_1.BadRequestException('Магазин отключён');
                                        return [4 /*yield*/, tx.shopInventoryItem.findMany({
                                                where: { id: { in: d.items.map(function (x) { return x.inventoryItemId; }) } },
                                                include: { partCatalogItem: true },
                                            })];
                                    case 2:
                                        items = _j.sent();
                                        if (items.length !== d.items.length)
                                            throw new common_1.NotFoundException('Складская позиция не найдена');
                                        if (items.some(function (i) { return i.shopId !== shopId; }))
                                            throw new common_1.ForbiddenException('Складская позиция принадлежит другому магазину');
                                        if (items.some(function (i) { return !i.isActive; }))
                                            throw new common_1.BadRequestException('Нельзя принять неактивную складскую позицию');
                                        if (new Set(items.map(function (i) { return i.currency; })).size !== 1)
                                            throw new common_1.BadRequestException('Все позиции закупки должны иметь одинаковую валюту');
                                        subtotal = new client_1.Prisma.Decimal(0);
                                        for (_i = 0, _a = d.items; _i < _a.length; _i++) {
                                            line = _a[_i];
                                            subtotal = subtotal.plus(new client_1.Prisma.Decimal(line.purchasePrice).mul(line.quantity));
                                        }
                                        discount = new client_1.Prisma.Decimal((_d = d.discount) !== null && _d !== void 0 ? _d : 0);
                                        if (discount.gt(subtotal))
                                            throw new common_1.BadRequestException('Скидка не может превышать сумму закупки');
                                        return [4 /*yield*/, tx.appSequence.upsert({
                                                where: { key: 'PURCHASE' },
                                                create: { key: 'PURCHASE', value: 1 },
                                                update: { value: { increment: 1 } },
                                            })];
                                    case 3:
                                        seq = _j.sent();
                                        number = "PUR-".concat(String(seq.value).padStart(6, '0'));
                                        return [4 /*yield*/, tx.purchase.create({
                                                data: {
                                                    number: number,
                                                    shopId: shopId,
                                                    userId: a.id,
                                                    invoiceNumber: ((_e = d.invoiceNumber) === null || _e === void 0 ? void 0 : _e.trim()) || null,
                                                    supplierName: ((_f = d.supplierName) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                                                    supplierPhone: ((_g = d.supplierPhone) === null || _g === void 0 ? void 0 : _g.trim()) || null,
                                                    notes: ((_h = d.notes) === null || _h === void 0 ? void 0 : _h.trim()) || null,
                                                    currency: items[0].currency,
                                                    subtotal: subtotal,
                                                    discount: discount,
                                                    totalAmount: subtotal.minus(discount),
                                                    purchasedAt: d.purchasedAt ? new Date(d.purchasedAt) : new Date(),
                                                },
                                            })];
                                    case 4:
                                        purchase = _j.sent();
                                        _loop_1 = function (line) {
                                            var i, price, salePrice, updated;
                                            return __generator(this, function (_k) {
                                                switch (_k.label) {
                                                    case 0:
                                                        i = items.find(function (x) { return x.id === line.inventoryItemId; });
                                                        price = new client_1.Prisma.Decimal(line.purchasePrice);
                                                        salePrice = line.salePrice === undefined
                                                            ? undefined
                                                            : new client_1.Prisma.Decimal(line.salePrice);
                                                        return [4 /*yield*/, tx.shopInventoryItem.updateMany({
                                                                where: { id: i.id, shopId: shopId, isActive: true },
                                                                data: __assign({ quantity: { increment: line.quantity } }, (salePrice && { price: salePrice })),
                                                            })];
                                                    case 1:
                                                        updated = _k.sent();
                                                        if (!updated.count)
                                                            throw new common_1.ConflictException('Складская позиция недоступна');
                                                        return [4 /*yield*/, tx.purchaseItem.create({
                                                                data: {
                                                                    purchaseId: purchase.id,
                                                                    inventoryItemId: i.id,
                                                                    partCatalogItemId: i.partCatalogItemId,
                                                                    itemName: i.partCatalogItem.name,
                                                                    sku: i.sku,
                                                                    oemNumber: i.oemNumber,
                                                                    brand: i.brand,
                                                                    quantity: line.quantity,
                                                                    purchasePrice: price,
                                                                    salePrice: salePrice,
                                                                    lineTotal: price.mul(line.quantity),
                                                                },
                                                            })];
                                                    case 2:
                                                        _k.sent();
                                                        return [4 /*yield*/, tx.inventoryMovement.create({
                                                                data: {
                                                                    shopId: shopId,
                                                                    inventoryItemId: i.id,
                                                                    userId: a.id,
                                                                    type: client_1.InventoryMovementType.PURCHASE,
                                                                    change: line.quantity,
                                                                    quantityBefore: i.quantity,
                                                                    quantityAfter: i.quantity + line.quantity,
                                                                    reference: number,
                                                                    notes: "\u0417\u0430\u043A\u0443\u043F\u043A\u0430 ".concat(number),
                                                                },
                                                            })];
                                                    case 3:
                                                        _k.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _b = 0, _c = d.items;
                                        _j.label = 5;
                                    case 5:
                                        if (!(_b < _c.length)) return [3 /*break*/, 8];
                                        line = _c[_b];
                                        return [5 /*yield**/, _loop_1(line)];
                                    case 6:
                                        _j.sent();
                                        _j.label = 7;
                                    case 7:
                                        _b++;
                                        return [3 /*break*/, 5];
                                    case 8: return [2 /*return*/, purchase];
                                }
                            });
                        }); })];
                });
            });
        };
        PurchasesService_1.prototype.all = function (a, q) {
            return __awaiter(this, void 0, void 0, function () {
                var search, where, page, limit, _a, data, total;
                var _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (q.dateFrom && q.dateTo && new Date(q.dateFrom) > new Date(q.dateTo))
                                throw new common_1.BadRequestException('dateFrom не может быть позже dateTo');
                            if (a.role !== client_1.UserRole.SUPER_ADMIN &&
                                q.shopId &&
                                q.shopId !== this.shop(a))
                                throw new common_1.ForbiddenException('Нельзя просматривать закупки другого магазина');
                            search = (_b = q.search) === null || _b === void 0 ? void 0 : _b.trim();
                            where = __assign(__assign(__assign(__assign({}, (a.role === client_1.UserRole.SUPER_ADMIN
                                ? q.shopId
                                    ? { shopId: q.shopId }
                                    : {}
                                : { shopId: this.shop(a) })), (q.status && { status: q.status })), (search && {
                                OR: [
                                    { number: { contains: search, mode: 'insensitive' } },
                                    { invoiceNumber: { contains: search, mode: 'insensitive' } },
                                    { supplierName: { contains: search, mode: 'insensitive' } },
                                    { supplierPhone: { contains: search, mode: 'insensitive' } },
                                ],
                            })), ((q.dateFrom || q.dateTo) && {
                                purchasedAt: __assign(__assign({}, (q.dateFrom && { gte: new Date(q.dateFrom) })), (q.dateTo && { lte: new Date("".concat(q.dateTo, "T23:59:59.999Z")) })),
                            }));
                            page = (_c = q.page) !== null && _c !== void 0 ? _c : 1, limit = (_d = q.limit) !== null && _d !== void 0 ? _d : 20;
                            return [4 /*yield*/, Promise.all([
                                    this.p.purchase.findMany({
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
                                        orderBy: { purchasedAt: 'desc' },
                                        skip: (page - 1) * limit,
                                        take: limit,
                                    }),
                                    this.p.purchase.count({ where: where }),
                                ])];
                        case 1:
                            _a = _e.sent(), data = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    data: data,
                                    meta: { page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit) },
                                }];
                    }
                });
            });
        };
        PurchasesService_1.prototype.one = function (id, a) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.detail(id, a)];
                });
            });
        };
        PurchasesService_1.prototype.cancel = function (id, d, a) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (a.role === client_1.UserRole.SELLER)
                        throw new common_1.ForbiddenException('Отменять закупку может только администратор или менеджер магазина');
                    return [2 /*return*/, this.serializable(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var purchase, _i, _a, x, result;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, this.detail(id, a, tx)];
                                    case 1:
                                        purchase = _b.sent();
                                        if (purchase.status === client_1.PurchaseStatus.CANCELLED)
                                            throw new common_1.ConflictException('Закупка уже отменена');
                                        _i = 0, _a = purchase.items;
                                        _b.label = 2;
                                    case 2:
                                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                                        x = _a[_i];
                                        return [4 /*yield*/, tx.shopInventoryItem.updateMany({
                                                where: {
                                                    id: x.inventoryItemId,
                                                    shopId: purchase.shopId,
                                                    quantity: { gte: x.quantity },
                                                },
                                                data: { quantity: { decrement: x.quantity } },
                                            })];
                                    case 3:
                                        result = _b.sent();
                                        if (!result.count)
                                            throw new common_1.ConflictException('Нельзя отменить закупку: недостаточно товара на складе');
                                        return [4 /*yield*/, tx.inventoryMovement.create({
                                                data: {
                                                    shopId: purchase.shopId,
                                                    inventoryItemId: x.inventoryItemId,
                                                    userId: a.id,
                                                    type: client_1.InventoryMovementType.PURCHASE_CANCEL,
                                                    change: -x.quantity,
                                                    quantityBefore: x.inventoryItem.quantity,
                                                    quantityAfter: x.inventoryItem.quantity - x.quantity,
                                                    reference: purchase.number,
                                                    notes: "\u041E\u0442\u043C\u0435\u043D\u0430 \u0437\u0430\u043A\u0443\u043F\u043A\u0438 ".concat(purchase.number, ": ").concat(d.reason.trim()),
                                                },
                                            })];
                                    case 4:
                                        _b.sent();
                                        _b.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 6: return [2 /*return*/, tx.purchase.update({
                                            where: { id: id },
                                            data: {
                                                status: client_1.PurchaseStatus.CANCELLED,
                                                cancelledAt: new Date(),
                                                cancelledById: a.id,
                                                cancelReason: d.reason.trim(),
                                            },
                                        })];
                                }
                            });
                        }); })];
                });
            });
        };
        return PurchasesService_1;
    }());
    __setFunctionName(_classThis, "PurchasesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PurchasesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PurchasesService = _classThis;
}();
exports.PurchasesService = PurchasesService;
