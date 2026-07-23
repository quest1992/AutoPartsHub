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
exports.PartCategoriesService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var parentSelect = {
    id: true,
    name: true,
    slug: true,
    isActive: true,
};
var PartCategoriesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PartCategoriesService = _classThis = /** @class */ (function () {
        function PartCategoriesService_1(prisma) {
            this.prisma = prisma;
        }
        PartCategoriesService_1.prototype.create = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var data, parentId, error_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            data = this.normalize(dto);
                            parentId = (_a = data.parentId) !== null && _a !== void 0 ? _a : null;
                            return [4 /*yield*/, this.ensureValidParent(parentId, undefined, 1)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, this.ensureNoDuplicate(parentId, data.name, data.slug)];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.prisma.partCategory.create({
                                    data: __assign(__assign({}, data), { parentId: parentId }),
                                    include: { parent: { select: parentSelect } },
                                })];
                        case 4: return [2 /*return*/, _b.sent()];
                        case 5:
                            error_1 = _b.sent();
                            this.throwUniqueConflict(error_1);
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.findAll = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, page, _b, limit, search, parentId, rootOnly, isActive, where, _c, data, total;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _a = query.page, page = _a === void 0 ? 1 : _a, _b = query.limit, limit = _b === void 0 ? 20 : _b, search = query.search, parentId = query.parentId, rootOnly = query.rootOnly, isActive = query.isActive;
                            where = __assign(__assign(__assign({}, (isActive !== undefined && { isActive: isActive })), (rootOnly ? { parentId: null } : parentId ? { parentId: parentId } : {})), ((search === null || search === void 0 ? void 0 : search.trim()) && {
                                OR: [
                                    { name: { contains: search.trim(), mode: 'insensitive' } },
                                    { slug: { contains: search.trim(), mode: 'insensitive' } },
                                ],
                            }));
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.partCategory.findMany({
                                        where: where,
                                        skip: (page - 1) * limit,
                                        take: limit,
                                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                                        include: {
                                            parent: { select: parentSelect },
                                            _count: { select: { children: true } },
                                        },
                                    }),
                                    this.prisma.partCategory.count({ where: where }),
                                ])];
                        case 1:
                            _c = _d.sent(), data = _c[0], total = _c[1];
                            return [2 /*return*/, {
                                    data: data,
                                    meta: { total: total, page: page, limit: limit, totalPages: Math.ceil(total / limit) },
                                }];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.findTree = function () {
            return __awaiter(this, arguments, void 0, function (isActive) {
                var categories, nodes, roots, _i, _a, node, parent_1;
                if (isActive === void 0) { isActive = true; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCategory.findMany({
                                where: { isActive: isActive },
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    description: true,
                                    parentId: true,
                                    sortOrder: true,
                                    isActive: true,
                                },
                                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                            })];
                        case 1:
                            categories = _b.sent();
                            nodes = new Map(categories.map(function (category) { return [
                                category.id,
                                __assign(__assign({}, category), { children: [] }),
                            ]; }));
                            roots = [];
                            for (_i = 0, _a = nodes.values(); _i < _a.length; _i++) {
                                node = _a[_i];
                                parent_1 = node.parentId ? nodes.get(node.parentId) : undefined;
                                if (parent_1)
                                    parent_1.children.push(node);
                                else
                                    roots.push(node);
                            }
                            return [2 /*return*/, roots];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var category;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCategory.findUnique({
                                where: { id: id },
                                include: {
                                    parent: { select: parentSelect },
                                    children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
                                    _count: { select: { children: true } },
                                },
                            })];
                        case 1:
                            category = _a.sent();
                            if (!category)
                                throw new common_1.NotFoundException('Категория деталей не найдена');
                            return [2 /*return*/, category];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.update = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, data, finalParentId, finalName, finalSlug, _a, _b, error_2;
                var _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            existing = _e.sent();
                            data = this.normalize(dto);
                            finalParentId = dto.parentId === undefined ? existing.parentId : dto.parentId;
                            finalName = (_c = data.name) !== null && _c !== void 0 ? _c : existing.name;
                            finalSlug = (_d = data.slug) !== null && _d !== void 0 ? _d : existing.slug;
                            if (!(dto.parentId !== undefined || dto.isActive === true)) return [3 /*break*/, 4];
                            _a = this.ensureValidParent;
                            _b = [finalParentId,
                                id];
                            return [4 /*yield*/, this.getSubtreeHeight(id)];
                        case 2: return [4 /*yield*/, _a.apply(this, _b.concat([_e.sent()]))];
                        case 3:
                            _e.sent();
                            _e.label = 4;
                        case 4: return [4 /*yield*/, this.ensureNoDuplicate(finalParentId, finalName, finalSlug, id)];
                        case 5:
                            _e.sent();
                            _e.label = 6;
                        case 6:
                            _e.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, this.prisma.partCategory.update({
                                    where: { id: id },
                                    data: __assign(__assign(__assign(__assign(__assign(__assign({}, (data.name !== undefined && { name: data.name })), (data.slug !== undefined && { slug: data.slug })), (data.description !== undefined && {
                                        description: data.description,
                                    })), (dto.parentId !== undefined && { parentId: dto.parentId })), (data.sortOrder !== undefined && { sortOrder: data.sortOrder })), (data.isActive !== undefined && { isActive: data.isActive })),
                                    include: { parent: { select: parentSelect } },
                                })];
                        case 7: return [2 /*return*/, _e.sent()];
                        case 8:
                            error_2 = _e.sent();
                            this.throwUniqueConflict(error_2);
                            return [3 /*break*/, 9];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.remove = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var activeChildren;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.partCategory.count({
                                    where: { parentId: id, isActive: true },
                                })];
                        case 2:
                            activeChildren = _a.sent();
                            if (activeChildren > 0) {
                                throw new common_1.BadRequestException('Нельзя отключить категорию с активными дочерними категориями');
                            }
                            return [2 /*return*/, this.prisma.partCategory.update({
                                    where: { id: id },
                                    data: { isActive: false },
                                })];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.normalize = function (dto) {
            return __assign(__assign(__assign(__assign({}, dto), (dto.name !== undefined && { name: dto.name.trim() })), (dto.slug !== undefined && { slug: dto.slug.trim().toLowerCase() })), (dto.description !== undefined && {
                description: dto.description.trim(),
            }));
        };
        PartCategoriesService_1.prototype.ensureNoDuplicate = function (parentId, name, slug, excludeId) {
            return __awaiter(this, void 0, void 0, function () {
                var duplicate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCategory.findFirst({
                                where: __assign(__assign({ parentId: parentId }, (excludeId && { id: { not: excludeId } })), { OR: [
                                        { name: { equals: name, mode: 'insensitive' } },
                                        { slug: { equals: slug, mode: 'insensitive' } },
                                    ] }),
                                select: { id: true },
                            })];
                        case 1:
                            duplicate = _a.sent();
                            if (duplicate)
                                throw new common_1.ConflictException('Категория с таким именем или slug уже существует на этом уровне');
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.ensureValidParent = function (parentId_1, categoryId_1) {
            return __awaiter(this, arguments, void 0, function (parentId, categoryId, subtreeHeight) {
                var parent, depth, currentParentId, visited, ancestor;
                if (subtreeHeight === void 0) { subtreeHeight = 1; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!parentId) {
                                if (subtreeHeight > 3)
                                    throw new common_1.BadRequestException('Максимальная глубина вложенности категорий — 3');
                                return [2 /*return*/];
                            }
                            if (parentId === categoryId)
                                throw new common_1.BadRequestException('Категория не может быть родителем самой себе');
                            return [4 /*yield*/, this.prisma.partCategory.findUnique({
                                    where: { id: parentId },
                                    select: { id: true, parentId: true, isActive: true },
                                })];
                        case 1:
                            parent = _a.sent();
                            if (!parent)
                                throw new common_1.NotFoundException('Родительская категория не найдена');
                            if (!parent.isActive)
                                throw new common_1.BadRequestException('Нельзя использовать неактивную родительскую категорию');
                            depth = 1;
                            currentParentId = parent.parentId;
                            visited = new Set([parent.id]);
                            _a.label = 2;
                        case 2:
                            if (!currentParentId) return [3 /*break*/, 4];
                            if (currentParentId === categoryId)
                                throw new common_1.BadRequestException('Нельзя переместить категорию в собственное поддерево');
                            if (visited.has(currentParentId))
                                throw new common_1.BadRequestException('Обнаружен цикл в иерархии категорий');
                            visited.add(currentParentId);
                            depth += 1;
                            return [4 /*yield*/, this.prisma.partCategory.findUnique({
                                    where: { id: currentParentId },
                                    select: { parentId: true },
                                })];
                        case 3:
                            ancestor = _a.sent();
                            if (!ancestor)
                                return [3 /*break*/, 4];
                            currentParentId = ancestor.parentId;
                            return [3 /*break*/, 2];
                        case 4:
                            if (depth + subtreeHeight > 3)
                                throw new common_1.BadRequestException('Максимальная глубина вложенности категорий — 3');
                            return [2 /*return*/];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.getSubtreeHeight = function (categoryId) {
            return __awaiter(this, void 0, void 0, function () {
                var categories, childrenByParent, _i, categories_1, category, height;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.partCategory.findMany({
                                select: { id: true, parentId: true },
                            })];
                        case 1:
                            categories = _b.sent();
                            childrenByParent = new Map();
                            for (_i = 0, categories_1 = categories; _i < categories_1.length; _i++) {
                                category = categories_1[_i];
                                if (!category.parentId)
                                    continue;
                                childrenByParent.set(category.parentId, __spreadArray(__spreadArray([], ((_a = childrenByParent.get(category.parentId)) !== null && _a !== void 0 ? _a : []), true), [
                                    category.id,
                                ], false));
                            }
                            height = function (id, path) {
                                var _a;
                                if (path === void 0) { path = new Set(); }
                                if (path.has(id))
                                    throw new common_1.BadRequestException('Обнаружен цикл в иерархии категорий');
                                var children = (_a = childrenByParent.get(id)) !== null && _a !== void 0 ? _a : [];
                                return children.length
                                    ? 1 + Math.max.apply(Math, children.map(function (child) { return height(child, new Set(path).add(id)); }))
                                    : 1;
                            };
                            return [2 /*return*/, height(categoryId)];
                    }
                });
            });
        };
        PartCategoriesService_1.prototype.throwUniqueConflict = function (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Категория с таким slug уже существует на этом уровне');
            }
            throw error;
        };
        return PartCategoriesService_1;
    }());
    __setFunctionName(_classThis, "PartCategoriesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartCategoriesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartCategoriesService = _classThis;
}();
exports.PartCategoriesService = PartCategoriesService;
