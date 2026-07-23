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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryItemsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var include = {
    shop: { select: { id: true, name: true, isActive: true } },
    partCatalogItem: {
        include: {
            category: { include: { parent: true } },
            compatibilities: {
                include: {
                    vehicleGeneration: {
                        include: { vehicleModel: { include: { manufacturer: true } } },
                    },
                },
            },
        },
    },
};
var InventoryItemsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var InventoryItemsService = _classThis = /** @class */ (function () {
        function InventoryItemsService_1(prisma) {
            this.prisma = prisma;
        }
        InventoryItemsService_1.prototype.create = function (dto, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var shopId, data;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            shopId = this.resolveShopForCreate(dto.shopId, actor);
                            data = this.normalize(dto);
                            return [4 /*yield*/, this.ensureActiveShop(shopId)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, this.ensureActivePart(data.partCatalogItemId)];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, this.ensureNoDuplicate(shopId, data.partCatalogItemId, data.brand, data.sku, (_a = data.condition) !== null && _a !== void 0 ? _a : client_1.PartCondition.NEW)];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var item;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.shopInventoryItem.create({
                                                    data: __assign(__assign({}, data), { shopId: shopId }),
                                                    include: include,
                                                })];
                                            case 1:
                                                item = _a.sent();
                                                if (!(item.quantity > 0)) return [3 /*break*/, 3];
                                                return [4 /*yield*/, tx.inventoryMovement.create({
                                                        data: {
                                                            shopId: shopId,
                                                            inventoryItemId: item.id,
                                                            userId: actor.id,
                                                            type: client_1.InventoryMovementType.INITIAL_BALANCE,
                                                            change: item.quantity,
                                                            quantityBefore: 0,
                                                            quantityAfter: item.quantity,
                                                            notes: 'Начальный остаток',
                                                        },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                _a.label = 3;
                                            case 3: return [2 /*return*/, item];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.findAll = function (query, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, shopId, categoryIds, _a, where, lowStock, _b, items, total, filtered, data, filteredTotal;
                var _this = this;
                var _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            page = (_c = query.page) !== null && _c !== void 0 ? _c : 1, limit = (_d = query.limit) !== null && _d !== void 0 ? _d : 20;
                            shopId = this.isAdmin(actor) ? query.shopId : this.requireShop(actor);
                            if (!query.rootCategoryId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.categoryIds(query.rootCategoryId)];
                        case 1:
                            _a = _f.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = undefined;
                            _f.label = 3;
                        case 3:
                            categoryIds = _a;
                            where = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (shopId && { shopId: shopId })), (query.partCatalogItemId && {
                                partCatalogItemId: query.partCatalogItemId,
                            })), (query.categoryId && {
                                partCatalogItem: { categoryId: query.categoryId },
                            })), (categoryIds && {
                                partCatalogItem: { categoryId: { in: categoryIds } },
                            })), (query.condition && { condition: query.condition })), (query.isActive !== undefined && { isActive: query.isActive })), (query.brand && {
                                brand: { equals: query.brand.trim(), mode: 'insensitive' },
                            })), (query.sku && {
                                sku: { equals: query.sku.trim(), mode: 'insensitive' },
                            })), (query.oemNumber && {
                                oemNumber: { equals: query.oemNumber.trim(), mode: 'insensitive' },
                            })), ((query.minPrice !== undefined || query.maxPrice !== undefined) && {
                                price: __assign(__assign({}, (query.minPrice !== undefined && { gte: query.minPrice })), (query.maxPrice !== undefined && { lte: query.maxPrice })),
                            })), (query.inStock && { quantity: { gt: 0 } })), (((_e = query.search) === null || _e === void 0 ? void 0 : _e.trim()) && {
                                OR: [
                                    { brand: { contains: query.search.trim(), mode: 'insensitive' } },
                                    { sku: { contains: query.search.trim(), mode: 'insensitive' } },
                                    { oemNumber: { contains: query.search.trim(), mode: 'insensitive' } },
                                    {
                                        shop: {
                                            name: { contains: query.search.trim(), mode: 'insensitive' },
                                        },
                                    },
                                    {
                                        partCatalogItem: {
                                            name: { contains: query.search.trim(), mode: 'insensitive' },
                                        },
                                    },
                                    {
                                        partCatalogItem: {
                                            internalCode: {
                                                contains: query.search.trim(),
                                                mode: 'insensitive',
                                            },
                                        },
                                    },
                                ],
                            }));
                            lowStock = query.lowStock === true;
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.shopInventoryItem.findMany(__assign({ where: where, include: include, orderBy: { createdAt: 'desc' } }, (lowStock ? {} : { skip: (page - 1) * limit, take: limit }))),
                                    this.prisma.shopInventoryItem.count({ where: where }),
                                ])];
                        case 4:
                            _b = _f.sent(), items = _b[0], total = _b[1];
                            filtered = lowStock
                                ? items.filter(function (i) { return i.quantity > 0 && i.quantity <= i.minQuantity; })
                                : items;
                            data = (lowStock ? filtered.slice((page - 1) * limit, page * limit) : filtered).map(function (i) { return _this.withStatus(i); });
                            filteredTotal = lowStock ? filtered.length : total;
                            return [2 /*return*/, {
                                    data: data,
                                    meta: {
                                        page: page,
                                        limit: limit,
                                        total: filteredTotal,
                                        totalPages: Math.ceil(filteredTotal / limit),
                                    },
                                }];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.findOne = function (id, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.withStatus;
                            return [4 /*yield*/, this.scopedItem(id, actor)];
                        case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.update = function (id, dto, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, data, brand, sku, condition, _a;
                var _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.scopedItem(id, actor)];
                        case 1:
                            existing = _e.sent();
                            data = this.normalize(dto);
                            brand = (_b = data.brand) !== null && _b !== void 0 ? _b : existing.brand, sku = (_c = data.sku) !== null && _c !== void 0 ? _c : existing.sku, condition = (_d = data.condition) !== null && _d !== void 0 ? _d : existing.condition;
                            return [4 /*yield*/, this.ensureNoDuplicate(existing.shopId, existing.partCatalogItemId, brand, sku, condition, id)];
                        case 2:
                            _e.sent();
                            _a = this.withStatus;
                            return [4 /*yield*/, this.prisma.shopInventoryItem.update({
                                    where: { id: id },
                                    data: data,
                                    include: include,
                                })];
                        case 3: return [2 /*return*/, _a.apply(this, [_e.sent()])];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.remove = function (id, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.scopedItem(id, actor)];
                        case 1:
                            _b.sent();
                            _a = this.withStatus;
                            return [4 /*yield*/, this.prisma.shopInventoryItem.update({
                                    where: { id: id },
                                    data: { isActive: false },
                                    include: include,
                                })];
                        case 2: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.changeQuantity = function (id, dto, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var attempt, error_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.validateMovement(dto);
                            attempt = 0;
                            _a.label = 1;
                        case 1:
                            if (!(attempt < 3)) return [3 /*break*/, 6];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var item, changed, quantityAfter;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, tx.shopInventoryItem.findUnique({
                                                    where: { id: id },
                                                    select: {
                                                        id: true,
                                                        shopId: true,
                                                        quantity: true,
                                                        minQuantity: true,
                                                        isActive: true,
                                                    },
                                                })];
                                            case 1:
                                                item = _c.sent();
                                                if (!item ||
                                                    (!this.isAdmin(actor) && item.shopId !== this.requireShop(actor)))
                                                    throw new common_1.NotFoundException('Складская позиция не найдена');
                                                if (!item.isActive)
                                                    throw new common_1.BadRequestException('Нельзя изменить остаток неактивной складской позиции');
                                                return [4 /*yield*/, tx.shopInventoryItem.updateMany({
                                                        where: {
                                                            id: id,
                                                            quantity: { gte: dto.change < 0 ? -dto.change : 0 },
                                                        },
                                                        data: { quantity: { increment: dto.change } },
                                                    })];
                                            case 2:
                                                changed = _c.sent();
                                                if (changed.count !== 1)
                                                    throw new common_1.ConflictException('Недостаточно товара на складе');
                                                quantityAfter = item.quantity + dto.change;
                                                return [4 /*yield*/, tx.inventoryMovement.create({
                                                        data: {
                                                            shopId: item.shopId,
                                                            inventoryItemId: id,
                                                            userId: actor.id,
                                                            type: dto.type,
                                                            change: dto.change,
                                                            quantityBefore: item.quantity,
                                                            quantityAfter: quantityAfter,
                                                            reference: ((_a = dto.reference) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                                            notes: ((_b = dto.notes) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                                                        },
                                                    })];
                                            case 3:
                                                _c.sent();
                                                return [2 /*return*/, {
                                                        id: id,
                                                        previousQuantity: item.quantity,
                                                        change: dto.change,
                                                        quantity: quantityAfter,
                                                        stockStatus: this.stockStatus(quantityAfter, item.minQuantity),
                                                    }];
                                        }
                                    });
                                }); }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable })];
                        case 3: return [2 /*return*/, _a.sent()];
                        case 4:
                            error_1 = _a.sent();
                            if (error_1 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                                error_1.code === 'P2034' &&
                                attempt < 2)
                                return [3 /*break*/, 5];
                            throw error_1;
                        case 5:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 6: throw new common_1.ConflictException('Не удалось безопасно изменить остаток');
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.validateMovement = function (dto) {
            var positive = [
                client_1.InventoryMovementType.STOCK_IN,
                client_1.InventoryMovementType.CUSTOMER_RETURN,
            ], negative = [
                client_1.InventoryMovementType.SALE,
                client_1.InventoryMovementType.SUPPLIER_RETURN,
                client_1.InventoryMovementType.WRITE_OFF,
            ];
            if (dto.change === 0)
                throw new common_1.BadRequestException('Изменение количества не может быть равно нулю');
            if (dto.type === client_1.InventoryMovementType.INITIAL_BALANCE)
                throw new common_1.BadRequestException('Начальный остаток нельзя создавать вручную');
            if (positive.includes(dto.type) && dto.change < 0)
                throw new common_1.BadRequestException('Для этого типа движения количество должно увеличиваться');
            if (negative.includes(dto.type) && dto.change > 0)
                throw new common_1.BadRequestException('Для этого типа движения количество должно уменьшаться');
        };
        InventoryItemsService_1.prototype.isAdmin = function (actor) {
            return actor.role === client_1.UserRole.SUPER_ADMIN;
        };
        InventoryItemsService_1.prototype.requireShop = function (actor) {
            if (!actor.shopId)
                throw new common_1.ForbiddenException('Пользователь не привязан к магазину');
            return actor.shopId;
        };
        InventoryItemsService_1.prototype.resolveShopForCreate = function (requested, actor) {
            if (this.isAdmin(actor)) {
                if (!requested)
                    throw new common_1.BadRequestException('Для SUPER_ADMIN необходимо указать shopId');
                return requested;
            }
            var shopId = this.requireShop(actor);
            if (requested && requested !== shopId)
                throw new common_1.ForbiddenException('Нельзя создавать позицию для чужого магазина');
            return shopId;
        };
        InventoryItemsService_1.prototype.scopedItem = function (id, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var item;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shopInventoryItem.findUnique({
                                where: { id: id },
                                include: include,
                            })];
                        case 1:
                            item = _a.sent();
                            if (!item ||
                                (!this.isAdmin(actor) && item.shopId !== this.requireShop(actor)))
                                throw new common_1.NotFoundException('Складская позиция не найдена');
                            return [2 /*return*/, item];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.normalize = function (dto) {
            var empty = function (v) { return (v === null || v === void 0 ? void 0 : v.trim()) || null; };
            return __assign(__assign(__assign(__assign(__assign(__assign(__assign({}, dto), (dto.brand !== undefined && { brand: empty(dto.brand) })), (dto.sku !== undefined && { sku: empty(dto.sku) })), (dto.oemNumber !== undefined && { oemNumber: empty(dto.oemNumber) })), (dto.currency !== undefined && {
                currency: dto.currency.trim().toUpperCase(),
            })), (dto.location !== undefined && { location: empty(dto.location) })), (dto.notes !== undefined && { notes: empty(dto.notes) }));
        };
        InventoryItemsService_1.prototype.ensureActiveShop = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var s;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.findUnique({
                                where: { id: id },
                                select: { isActive: true },
                            })];
                        case 1:
                            s = _a.sent();
                            if (!s)
                                throw new common_1.NotFoundException('Магазин не найден');
                            if (!s.isActive)
                                throw new common_1.BadRequestException('Нельзя добавить позицию в неактивный магазин');
                            return [2 /*return*/];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.ensureActivePart = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCatalogItem.findUnique({
                                where: { id: id },
                                select: { isActive: true, category: { select: { isActive: true } } },
                            })];
                        case 1:
                            p = _a.sent();
                            if (!p)
                                throw new common_1.NotFoundException('Деталь каталога не найдена');
                            if (!p.isActive)
                                throw new common_1.BadRequestException('Нельзя добавить неактивную деталь каталога');
                            if (!p.category.isActive)
                                throw new common_1.BadRequestException('Категория детали отключена');
                            return [2 /*return*/];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.ensureNoDuplicate = function (shopId, partId, brand, sku, condition, exclude) {
            return __awaiter(this, void 0, void 0, function () {
                var d;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shopInventoryItem.findFirst({
                                where: __assign({ shopId: shopId, partCatalogItemId: partId, condition: condition, brand: brand ? { equals: brand, mode: 'insensitive' } : null, sku: sku ? { equals: sku, mode: 'insensitive' } : null }, (exclude && { id: { not: exclude } })),
                                select: { id: true },
                            })];
                        case 1:
                            d = _a.sent();
                            if (d)
                                throw new common_1.ConflictException('Такая складская позиция уже существует в этом магазине');
                            return [2 /*return*/];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.categoryIds = function (root) {
            return __awaiter(this, void 0, void 0, function () {
                var all, map, ids, visit;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCategory.findMany({
                                select: { id: true, parentId: true },
                            })];
                        case 1:
                            all = _a.sent(), map = new Map();
                            all.forEach(function (c) {
                                var _a;
                                return c.parentId &&
                                    map.set(c.parentId, __spreadArray(__spreadArray([], ((_a = map.get(c.parentId)) !== null && _a !== void 0 ? _a : []), true), [c.id], false));
                            });
                            ids = [];
                            visit = function (id) {
                                var _a;
                                ids.push(id);
                                ((_a = map.get(id)) !== null && _a !== void 0 ? _a : []).forEach(visit);
                            };
                            visit(root);
                            return [2 /*return*/, ids];
                    }
                });
            });
        };
        InventoryItemsService_1.prototype.stockStatus = function (quantity, min) {
            return quantity === 0
                ? 'OUT_OF_STOCK'
                : quantity <= min
                    ? 'LOW_STOCK'
                    : 'IN_STOCK';
        };
        InventoryItemsService_1.prototype.withStatus = function (item) {
            return __assign(__assign({}, item), { stockStatus: this.stockStatus(item.quantity, item.minQuantity) });
        };
        return InventoryItemsService_1;
    }());
    __setFunctionName(_classThis, "InventoryItemsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InventoryItemsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InventoryItemsService = _classThis;
}();
exports.InventoryItemsService = InventoryItemsService;
