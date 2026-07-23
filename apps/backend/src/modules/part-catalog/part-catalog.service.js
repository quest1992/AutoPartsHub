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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.PartCatalogService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var part_name_normalizer_1 = require("../../common/utils/part-name-normalizer");
var part_number_normalizer_1 = require("../../common/utils/part-number-normalizer");
var categorySelect = {
    id: true,
    name: true,
    slug: true,
    isActive: true,
    parent: { select: { id: true, name: true, slug: true, isActive: true } },
};
var vehicleGenerationSelect = {
    id: true,
    name: true,
    slug: true,
    startYear: true,
    endYear: true,
    isActive: true,
    vehicleModel: {
        select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            manufacturer: {
                select: { id: true, name: true, slug: true, isActive: true },
            },
        },
    },
};
var partNumberSelect = {
    id: true,
    rawNumber: true,
    normalizedNumber: true,
    type: true,
    brand: true,
    isPrimary: true,
    createdAt: true,
    updatedAt: true,
};
var partAliasSelect = {
    id: true,
    alias: true,
    normalizedAlias: true,
    source: true,
    usageCount: true,
    isApproved: true,
    createdAt: true,
    updatedAt: true,
};
var PartCatalogService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PartCatalogService = _classThis = /** @class */ (function () {
        function PartCatalogService_1(prisma) {
            this.prisma = prisma;
        }
        PartCatalogService_1.prototype.create = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var data, side, position, normalizedName, searchTokens;
                var _this = this;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            data = this.normalizePart(dto);
                            side = (_a = data.side) !== null && _a !== void 0 ? _a : client_1.PartSide.NONE;
                            position = (_b = data.position) !== null && _b !== void 0 ? _b : client_1.PartPosition.NONE;
                            normalizedName = (0, part_name_normalizer_1.normalizePartName)(data.name);
                            searchTokens = (0, part_name_normalizer_1.getPartNameSearchTokens)(data.name);
                            return [4 /*yield*/, this.ensureLeafActiveCategory(data.categoryId)];
                        case 1:
                            _c.sent();
                            return [4 /*yield*/, this.ensureNoPartDuplicate(data.categoryId, data.name, data.slug, side, position, normalizedName)];
                        case 2:
                            _c.sent();
                            return [2 /*return*/, this.withUniqueConstraintHandling(this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var sequence;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.appSequence.upsert({
                                                    where: { key: 'PART_CATALOG' },
                                                    create: { key: 'PART_CATALOG', value: 1 },
                                                    update: { value: { increment: 1 } },
                                                })];
                                            case 1:
                                                sequence = _a.sent();
                                                return [2 /*return*/, tx.partCatalogItem.create({
                                                        data: __assign(__assign({}, data), { normalizedName: normalizedName, searchTokens: searchTokens, side: side, position: position, internalCode: "PRT-".concat(String(sequence.value).padStart(6, '0')) }),
                                                        include: {
                                                            category: { select: categorySelect },
                                                            _count: { select: { compatibilities: true } },
                                                        },
                                                    })];
                                        }
                                    });
                                }); }))];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.findAll = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, categoryIds, _a, search, normalizedSearch, where, compatibilityFilter, _b, data, total;
                var _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            page = (_c = query.page) !== null && _c !== void 0 ? _c : 1;
                            limit = (_d = query.limit) !== null && _d !== void 0 ? _d : 20;
                            if (!query.rootCategoryId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getCategorySubtreeIds(query.rootCategoryId)];
                        case 1:
                            _a = _f.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = undefined;
                            _f.label = 3;
                        case 3:
                            categoryIds = _a;
                            search = (_e = query.search) === null || _e === void 0 ? void 0 : _e.trim();
                            normalizedSearch = search ? (0, part_name_normalizer_1.normalizePartName)(search) : '';
                            where = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (query.categoryId && { categoryId: query.categoryId })), (categoryIds && { categoryId: { in: categoryIds } })), (query.side && { side: query.side })), (query.position && { position: query.position })), (query.isUniversal !== undefined && {
                                isUniversal: query.isUniversal,
                            })), (query.isActive !== undefined && { isActive: query.isActive })), (query.internalCode && {
                                internalCode: { equals: query.internalCode, mode: 'insensitive' },
                            })), (search && {
                                OR: [
                                    { name: { contains: search, mode: 'insensitive' } },
                                    { normalizedName: { contains: normalizedSearch } },
                                    { searchTokens: { contains: (0, part_name_normalizer_1.getPartNameSearchTokens)(search) } },
                                    { slug: { contains: search, mode: 'insensitive' } },
                                    {
                                        internalCode: {
                                            contains: search,
                                            mode: 'insensitive',
                                        },
                                    },
                                ],
                            }));
                            compatibilityFilter = __assign(__assign(__assign({}, (query.vehicleGenerationId && {
                                vehicleGenerationId: query.vehicleGenerationId,
                            })), (query.vehicleModelId && {
                                vehicleGeneration: { vehicleModelId: query.vehicleModelId },
                            })), (query.manufacturerId && {
                                vehicleGeneration: {
                                    vehicleModel: { manufacturerId: query.manufacturerId },
                                },
                            }));
                            if (Object.keys(compatibilityFilter).length > 0)
                                where.compatibilities = { some: compatibilityFilter };
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.partCatalogItem.findMany({
                                        where: where,
                                        include: {
                                            category: { select: categorySelect },
                                            compatibilities: {
                                                include: { vehicleGeneration: { select: vehicleGenerationSelect } },
                                                take: 1,
                                            },
                                            _count: { select: { compatibilities: true } },
                                        },
                                        orderBy: { createdAt: 'desc' },
                                        skip: (page - 1) * limit,
                                        take: limit,
                                    }),
                                    this.prisma.partCatalogItem.count({ where: where }),
                                ])];
                        case 4:
                            _b = _f.sent(), data = _b[0], total = _b[1];
                            return [2 /*return*/, {
                                    data: data,
                                    meta: { page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit) },
                                }];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var item;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCatalogItem.findUnique({
                                where: { id: id },
                                include: {
                                    category: { select: categorySelect },
                                    compatibilities: {
                                        include: { vehicleGeneration: { select: vehicleGenerationSelect } },
                                        orderBy: { createdAt: 'desc' },
                                    },
                                    _count: { select: { compatibilities: true } },
                                },
                            })];
                        case 1:
                            item = _a.sent();
                            if (!item)
                                throw new common_1.NotFoundException('Деталь каталога не найдена');
                            return [2 /*return*/, item];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.findCandidates = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedQuery, queryTokens, querySearchTokens, tokenSearches, candidates, ranked;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            normalizedQuery = (0, part_name_normalizer_1.normalizePartName)(query.q);
                            queryTokens = (0, part_name_normalizer_1.getPartNameTokens)(query.q);
                            querySearchTokens = queryTokens.join(' ');
                            tokenSearches = queryTokens.slice(0, 6).flatMap(function (token) { return [
                                { normalizedName: { contains: token } },
                                { searchTokens: { contains: token } },
                            ]; });
                            return [4 /*yield*/, this.prisma.partCatalogItem.findMany({
                                    where: __assign(__assign(__assign(__assign({ isActive: true }, (query.categoryId && { categoryId: query.categoryId })), (query.side && { side: query.side })), (query.position && { position: query.position })), { OR: __spreadArray([
                                            { normalizedName: { contains: normalizedQuery } },
                                            { normalizedName: { equals: normalizedQuery } },
                                            { searchTokens: { contains: querySearchTokens } }
                                        ], tokenSearches, true) }),
                                    select: {
                                        id: true,
                                        internalCode: true,
                                        name: true,
                                        slug: true,
                                        categoryId: true,
                                        side: true,
                                        position: true,
                                        normalizedName: true,
                                        searchTokens: true,
                                        category: { select: { id: true, name: true } },
                                    },
                                    take: 100,
                                })];
                        case 1:
                            candidates = _b.sent();
                            ranked = candidates.map(function (candidate) {
                                var candidateTokens = candidate.searchTokens.split(' ').filter(Boolean);
                                var matchedTokens = queryTokens.filter(function (token) {
                                    return candidateTokens.includes(token);
                                });
                                var matchType = candidate.normalizedName === normalizedQuery
                                    ? 'EXACT_NORMALIZED_NAME'
                                    : candidate.searchTokens === querySearchTokens
                                        ? 'SAME_TOKENS'
                                        : matchedTokens.length > 0
                                            ? 'PARTIAL_TOKENS'
                                            : 'NAME_CONTAINS';
                                var rank = matchType === 'EXACT_NORMALIZED_NAME'
                                    ? 0
                                    : matchType === 'SAME_TOKENS'
                                        ? 1
                                        : matchType === 'PARTIAL_TOKENS'
                                            ? 2
                                            : 3;
                                return __assign(__assign({}, candidate), { matchType: matchType, matchedTokens: matchedTokens, rank: rank });
                            });
                            return [2 /*return*/, {
                                    items: ranked
                                        .sort(function (left, right) {
                                        return left.rank - right.rank ||
                                            right.matchedTokens.length - left.matchedTokens.length ||
                                            left.name.localeCompare(right.name, 'ru');
                                    })
                                        .slice(0, (_a = query.limit) !== null && _a !== void 0 ? _a : 10)
                                        .map(function (_a) {
                                        var _searchTokens = _a.searchTokens, _rank = _a.rank, candidate = __rest(_a, ["searchTokens", "rank"]);
                                        return candidate;
                                    }),
                                }];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.update = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, data, categoryId, name, slug, side, position, normalizedName;
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            existing = _f.sent();
                            data = this.normalizePart(dto);
                            categoryId = (_a = data.categoryId) !== null && _a !== void 0 ? _a : existing.categoryId;
                            name = (_b = data.name) !== null && _b !== void 0 ? _b : existing.name;
                            slug = (_c = data.slug) !== null && _c !== void 0 ? _c : existing.slug;
                            side = (_d = data.side) !== null && _d !== void 0 ? _d : existing.side;
                            position = (_e = data.position) !== null && _e !== void 0 ? _e : existing.position;
                            normalizedName = data.name !== undefined
                                ? (0, part_name_normalizer_1.normalizePartName)(data.name)
                                : existing.normalizedName;
                            if (!(data.categoryId !== undefined || data.isActive === true)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.ensureLeafActiveCategory(categoryId)];
                        case 2:
                            _f.sent();
                            _f.label = 3;
                        case 3:
                            if (data.isUniversal === true && existing._count.compatibilities > 0) {
                                throw new common_1.BadRequestException('Нельзя сделать деталь универсальной, пока существуют привязки к автомобилям');
                            }
                            return [4 /*yield*/, this.ensureNoPartDuplicate(categoryId, name, slug, side, position, normalizedName, id)];
                        case 4:
                            _f.sent();
                            return [2 /*return*/, this.withUniqueConstraintHandling(this.prisma.partCatalogItem.update({
                                    where: { id: id },
                                    data: __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (data.name !== undefined && { name: data.name })), (data.name !== undefined && {
                                        normalizedName: normalizedName,
                                        searchTokens: (0, part_name_normalizer_1.getPartNameSearchTokens)(data.name),
                                    })), (data.slug !== undefined && { slug: data.slug })), (data.description !== undefined && {
                                        description: data.description,
                                    })), (data.categoryId !== undefined && { categoryId: data.categoryId })), (data.side !== undefined && { side: data.side })), (data.position !== undefined && { position: data.position })), (data.isUniversal !== undefined && {
                                        isUniversal: data.isUniversal,
                                    })), (data.isActive !== undefined && { isActive: data.isActive })),
                                    include: {
                                        category: { select: categorySelect },
                                        _count: { select: { compatibilities: true } },
                                    },
                                }))];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.remove = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.partCatalogItem.update({
                                    where: { id: id },
                                    data: { isActive: false },
                                    include: {
                                        category: { select: categorySelect },
                                        _count: { select: { compatibilities: true } },
                                    },
                                })];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.addPartNumber = function (partCatalogItemId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var rawNumber, normalizedNumber;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.ensurePartCatalogItemExists(partCatalogItemId)];
                        case 1:
                            _a.sent();
                            rawNumber = dto.rawNumber.trim();
                            normalizedNumber = (0, part_number_normalizer_1.normalizePartNumber)(rawNumber);
                            if (!normalizedNumber) {
                                throw new common_1.BadRequestException('Номер запчасти не должен быть пустым');
                            }
                            return [2 /*return*/, this.withPartNumberUniqueHandling(this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(dto.isPrimary === true)) return [3 /*break*/, 2];
                                                return [4 /*yield*/, tx.partNumber.updateMany({
                                                        where: { partCatalogItemId: partCatalogItemId, type: dto.type, isPrimary: true },
                                                        data: { isPrimary: false },
                                                    })];
                                            case 1:
                                                _b.sent();
                                                _b.label = 2;
                                            case 2: return [2 /*return*/, tx.partNumber.create({
                                                    data: __assign(__assign({ partCatalogItemId: partCatalogItemId, rawNumber: rawNumber, normalizedNumber: normalizedNumber, type: dto.type }, (dto.brand !== undefined && { brand: dto.brand.trim() })), { isPrimary: (_a = dto.isPrimary) !== null && _a !== void 0 ? _a : false }),
                                                    select: partNumberSelect,
                                                })];
                                        }
                                    });
                                }); }))];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.getPartNumbers = function (partCatalogItemId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.ensurePartCatalogItemExists(partCatalogItemId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.partNumber.findMany({
                                    where: { partCatalogItemId: partCatalogItemId },
                                    select: partNumberSelect,
                                    orderBy: [{ isPrimary: 'desc' }, { type: 'asc' }, { rawNumber: 'asc' }],
                                })];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.deletePartNumber = function (partCatalogItemId, partNumberId) {
            return __awaiter(this, void 0, void 0, function () {
                var partNumber;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partNumber.findFirst({
                                where: { id: partNumberId, partCatalogItemId: partCatalogItemId },
                                select: { id: true },
                            })];
                        case 1:
                            partNumber = _a.sent();
                            if (!partNumber) {
                                throw new common_1.NotFoundException('Номер не найден для указанной запчасти');
                            }
                            return [2 /*return*/, this.prisma.partNumber.delete({
                                    where: { id: partNumber.id },
                                    select: partNumberSelect,
                                })];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.addPartAlias = function (partCatalogItemId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var alias, normalizedAlias;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.ensurePartCatalogItemExists(partCatalogItemId)];
                        case 1:
                            _b.sent();
                            alias = dto.alias.trim();
                            normalizedAlias = (0, part_name_normalizer_1.normalizePartName)(alias);
                            if (!normalizedAlias) {
                                throw new common_1.BadRequestException('Вариант названия не должен быть пустым');
                            }
                            return [2 /*return*/, this.withPartAliasUniqueHandling(this.prisma.partAlias.create({
                                    data: __assign(__assign({ partCatalogItemId: partCatalogItemId, alias: alias, normalizedAlias: normalizedAlias }, (dto.source !== undefined && { source: dto.source.trim() })), { isApproved: (_a = dto.isApproved) !== null && _a !== void 0 ? _a : true }),
                                    select: partAliasSelect,
                                }))];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.getPartAliases = function (partCatalogItemId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.ensurePartCatalogItemExists(partCatalogItemId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.partAlias.findMany({
                                    where: { partCatalogItemId: partCatalogItemId },
                                    select: partAliasSelect,
                                    orderBy: [{ isApproved: 'desc' }, { alias: 'asc' }],
                                })];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.deletePartAlias = function (partCatalogItemId, partAliasId) {
            return __awaiter(this, void 0, void 0, function () {
                var partAlias;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partAlias.findFirst({
                                where: { id: partAliasId, partCatalogItemId: partCatalogItemId },
                                select: { id: true },
                            })];
                        case 1:
                            partAlias = _a.sent();
                            if (!partAlias) {
                                throw new common_1.NotFoundException('Вариант названия не найден для указанной запчасти');
                            }
                            return [2 /*return*/, this.prisma.partAlias.delete({
                                    where: { id: partAlias.id },
                                    select: partAliasSelect,
                                })];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.createCompatibility = function (partId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var part;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.validateCompatibilityYears(dto.yearFrom, dto.yearTo);
                            return [4 /*yield*/, this.ensureActiveCompatiblePart(partId)];
                        case 1:
                            part = _a.sent();
                            return [4 /*yield*/, this.ensureActiveVehicleGeneration(dto.vehicleGenerationId)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.ensureCompatibilityRange(dto.vehicleGenerationId, dto.yearFrom, dto.yearTo)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.ensureNoCompatibilityDuplicate(partId, dto.vehicleGenerationId)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, this.withCompatibilityUniqueHandling(this.prisma.partCompatibility.create({
                                    data: __assign(__assign({}, dto), { partCatalogItemId: part.id }),
                                    include: { vehicleGeneration: { select: vehicleGenerationSelect } },
                                }))];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.findCompatibilities = function (partId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(partId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.partCompatibility.findMany({
                                    where: { partCatalogItemId: partId },
                                    include: { vehicleGeneration: { select: vehicleGenerationSelect } },
                                    orderBy: { createdAt: 'desc' },
                                })];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.findCompatibility = function (partId, compatibilityId) {
            return __awaiter(this, void 0, void 0, function () {
                var compatibility;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCompatibility.findFirst({
                                where: { id: compatibilityId, partCatalogItemId: partId },
                                include: { vehicleGeneration: { select: vehicleGenerationSelect } },
                            })];
                        case 1:
                            compatibility = _a.sent();
                            if (!compatibility)
                                throw new common_1.NotFoundException('Совместимость не найдена для указанной детали');
                            return [2 /*return*/, compatibility];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.updateCompatibility = function (partId, compatibilityId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, part, vehicleGenerationId, yearFrom, yearTo;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.findCompatibility(partId, compatibilityId)];
                        case 1:
                            existing = _d.sent();
                            return [4 /*yield*/, this.ensureActiveCompatiblePart(partId)];
                        case 2:
                            part = _d.sent();
                            vehicleGenerationId = (_a = dto.vehicleGenerationId) !== null && _a !== void 0 ? _a : existing.vehicleGenerationId;
                            yearFrom = (_b = dto.yearFrom) !== null && _b !== void 0 ? _b : existing.yearFrom;
                            yearTo = (_c = dto.yearTo) !== null && _c !== void 0 ? _c : existing.yearTo;
                            this.validateCompatibilityYears(yearFrom, yearTo);
                            return [4 /*yield*/, this.ensureActiveVehicleGeneration(vehicleGenerationId)];
                        case 3:
                            _d.sent();
                            return [4 /*yield*/, this.ensureCompatibilityRange(vehicleGenerationId, yearFrom, yearTo)];
                        case 4:
                            _d.sent();
                            return [4 /*yield*/, this.ensureNoCompatibilityDuplicate(part.id, vehicleGenerationId, compatibilityId)];
                        case 5:
                            _d.sent();
                            return [2 /*return*/, this.withCompatibilityUniqueHandling(this.prisma.partCompatibility.update({
                                    where: { id: compatibilityId },
                                    data: __assign(__assign(__assign(__assign({}, (dto.vehicleGenerationId !== undefined && {
                                        vehicleGenerationId: dto.vehicleGenerationId,
                                    })), (dto.yearFrom !== undefined && { yearFrom: dto.yearFrom })), (dto.yearTo !== undefined && { yearTo: dto.yearTo })), (dto.notes !== undefined && { notes: dto.notes.trim() })),
                                    include: { vehicleGeneration: { select: vehicleGenerationSelect } },
                                }))];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.removeCompatibility = function (partId, compatibilityId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findCompatibility(partId, compatibilityId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.partCompatibility.delete({
                                    where: { id: compatibilityId },
                                })];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.normalizePart = function (dto) {
            return __assign(__assign(__assign(__assign({}, dto), (dto.name !== undefined && { name: dto.name.trim() })), (dto.slug !== undefined && { slug: dto.slug.trim().toLowerCase() })), (dto.description !== undefined && {
                description: dto.description.trim(),
            }));
        };
        PartCatalogService_1.prototype.ensureLeafActiveCategory = function (categoryId) {
            return __awaiter(this, void 0, void 0, function () {
                var category, activeChildren;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCategory.findUnique({
                                where: { id: categoryId },
                                select: { isActive: true },
                            })];
                        case 1:
                            category = _a.sent();
                            if (!category)
                                throw new common_1.NotFoundException('Категория запчастей не найдена');
                            if (!category.isActive)
                                throw new common_1.BadRequestException('Нельзя добавить деталь в неактивную категорию');
                            return [4 /*yield*/, this.prisma.partCategory.count({
                                    where: { parentId: categoryId, isActive: true },
                                })];
                        case 2:
                            activeChildren = _a.sent();
                            if (activeChildren > 0)
                                throw new common_1.BadRequestException('Деталь можно привязать только к конечной категории');
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.ensureNoPartDuplicate = function (categoryId, name, slug, side, position, normalizedName, excludedId) {
            return __awaiter(this, void 0, void 0, function () {
                var duplicate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCatalogItem.findFirst({
                                where: __assign(__assign({ categoryId: categoryId, side: side, position: position }, (excludedId && { id: { not: excludedId } })), { OR: [
                                        { normalizedName: normalizedName },
                                        { name: { equals: name, mode: 'insensitive' } },
                                        { slug: { equals: slug, mode: 'insensitive' } },
                                    ] }),
                                select: { id: true },
                            })];
                        case 1:
                            duplicate = _a.sent();
                            if (duplicate)
                                throw new common_1.ConflictException('Деталь с таким названием или slug, стороной и позицией уже существует в этой категории');
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.getCategorySubtreeIds = function (rootCategoryId) {
            return __awaiter(this, void 0, void 0, function () {
                var categories, children, _i, categories_1, category, result, visit;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCategory.findMany({
                                select: { id: true, parentId: true },
                            })];
                        case 1:
                            categories = _b.sent();
                            children = new Map();
                            for (_i = 0, categories_1 = categories; _i < categories_1.length; _i++) {
                                category = categories_1[_i];
                                if (category.parentId)
                                    children.set(category.parentId, __spreadArray(__spreadArray([], ((_a = children.get(category.parentId)) !== null && _a !== void 0 ? _a : []), true), [
                                        category.id,
                                    ], false));
                            }
                            result = [];
                            visit = function (id) {
                                var _a;
                                result.push(id);
                                for (var _i = 0, _b = (_a = children.get(id)) !== null && _a !== void 0 ? _a : []; _i < _b.length; _i++) {
                                    var childId = _b[_i];
                                    visit(childId);
                                }
                            };
                            visit(rootCategoryId);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.ensureActiveCompatiblePart = function (partId) {
            return __awaiter(this, void 0, void 0, function () {
                var part;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCatalogItem.findUnique({
                                where: { id: partId },
                                select: { id: true, isActive: true, isUniversal: true },
                            })];
                        case 1:
                            part = _a.sent();
                            if (!part)
                                throw new common_1.NotFoundException('Деталь каталога не найдена');
                            if (!part.isActive)
                                throw new common_1.BadRequestException('Деталь каталога отключена');
                            if (part.isUniversal)
                                throw new common_1.BadRequestException('Универсальная деталь не может иметь привязку к конкретному автомобилю');
                            return [2 /*return*/, part];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.ensurePartCatalogItemExists = function (partCatalogItemId) {
            return __awaiter(this, void 0, void 0, function () {
                var part;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCatalogItem.findUnique({
                                where: { id: partCatalogItemId },
                                select: { id: true },
                            })];
                        case 1:
                            part = _a.sent();
                            if (!part) {
                                throw new common_1.NotFoundException('Деталь каталога не найдена');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.ensureActiveVehicleGeneration = function (vehicleGenerationId) {
            return __awaiter(this, void 0, void 0, function () {
                var generation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicleGeneration.findUnique({
                                where: { id: vehicleGenerationId },
                                select: {
                                    isActive: true,
                                    vehicleModel: {
                                        select: {
                                            isActive: true,
                                            manufacturer: { select: { isActive: true } },
                                        },
                                    },
                                },
                            })];
                        case 1:
                            generation = _a.sent();
                            if (!generation)
                                throw new common_1.NotFoundException('Поколение автомобиля не найдено');
                            if (!generation.isActive)
                                throw new common_1.BadRequestException('Нельзя привязать деталь к неактивному поколению автомобиля');
                            if (!generation.vehicleModel.isActive)
                                throw new common_1.BadRequestException('Нельзя привязать деталь к неактивной модели автомобиля');
                            if (!generation.vehicleModel.manufacturer.isActive)
                                throw new common_1.BadRequestException('Нельзя привязать деталь к модели неактивного производителя');
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.ensureCompatibilityRange = function (vehicleGenerationId, yearFrom, yearTo) {
            return __awaiter(this, void 0, void 0, function () {
                var generation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicleGeneration.findUnique({
                                where: { id: vehicleGenerationId },
                                select: { startYear: true, endYear: true },
                            })];
                        case 1:
                            generation = _a.sent();
                            if (!generation)
                                throw new common_1.NotFoundException('Поколение автомобиля не найдено');
                            if ((generation.startYear !== null &&
                                yearTo !== undefined &&
                                yearTo !== null &&
                                yearTo < generation.startYear) ||
                                (generation.endYear !== null &&
                                    yearFrom !== undefined &&
                                    yearFrom !== null &&
                                    yearFrom > generation.endYear)) {
                                throw new common_1.BadRequestException('Диапазон совместимости не пересекается с периодом выпуска поколения');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.validateCompatibilityYears = function (yearFrom, yearTo) {
            if (yearFrom !== undefined &&
                yearFrom !== null &&
                yearTo !== undefined &&
                yearTo !== null &&
                yearTo < yearFrom) {
                throw new common_1.BadRequestException('Год окончания не может быть меньше года начала');
            }
        };
        PartCatalogService_1.prototype.ensureNoCompatibilityDuplicate = function (partId, vehicleGenerationId, excludedId) {
            return __awaiter(this, void 0, void 0, function () {
                var duplicate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCompatibility.findFirst({
                                where: __assign({ partCatalogItemId: partId, vehicleGenerationId: vehicleGenerationId }, (excludedId && { id: { not: excludedId } })),
                                select: { id: true },
                            })];
                        case 1:
                            duplicate = _a.sent();
                            if (duplicate)
                                throw new common_1.ConflictException('Совместимость с этим поколением уже добавлена');
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.withUniqueConstraintHandling = function (operation) {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, operation];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_1 = _a.sent();
                            if (error_1 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                                error_1.code === 'P2002') {
                                throw new common_1.ConflictException('Деталь с таким названием или slug, стороной и позицией уже существует в этой категории');
                            }
                            throw error_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.withCompatibilityUniqueHandling = function (operation) {
            return __awaiter(this, void 0, void 0, function () {
                var error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, operation];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_2 = _a.sent();
                            if (error_2 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                                error_2.code === 'P2002') {
                                throw new common_1.ConflictException('Совместимость с этим поколением уже добавлена');
                            }
                            throw error_2;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.withPartNumberUniqueHandling = function (operation) {
            return __awaiter(this, void 0, void 0, function () {
                var error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, operation];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_3 = _a.sent();
                            if (error_3 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                                error_3.code === 'P2002') {
                                throw new common_1.ConflictException('Такой номер уже добавлен к этой запчасти');
                            }
                            throw error_3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        PartCatalogService_1.prototype.withPartAliasUniqueHandling = function (operation) {
            return __awaiter(this, void 0, void 0, function () {
                var error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, operation];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_4 = _a.sent();
                            if (error_4 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                                error_4.code === 'P2002') {
                                throw new common_1.ConflictException('Такой вариант названия уже добавлен к этой запчасти');
                            }
                            throw error_4;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return PartCatalogService_1;
    }());
    __setFunctionName(_classThis, "PartCatalogService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartCatalogService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartCatalogService = _classThis;
}();
exports.PartCatalogService = PartCatalogService;
