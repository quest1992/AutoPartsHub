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
exports.VehicleGenerationsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var vehicleModelSelect = {
    id: true,
    name: true,
    slug: true,
    isActive: true,
    manufacturer: {
        select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
        },
    },
};
var VehicleGenerationsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VehicleGenerationsService = _classThis = /** @class */ (function () {
        function VehicleGenerationsService_1(prisma) {
            this.prisma = prisma;
        }
        VehicleGenerationsService_1.prototype.create = function (createVehicleGenerationDto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.validateYears(createVehicleGenerationDto.startYear, createVehicleGenerationDto.endYear);
                            return [4 /*yield*/, this.ensureActiveVehicleModel(createVehicleGenerationDto.vehicleModelId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.ensureNoDuplicate(createVehicleGenerationDto.vehicleModelId, createVehicleGenerationDto.name, createVehicleGenerationDto.slug)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.withUniqueConstraintHandling(this.prisma.vehicleGeneration.create({
                                    data: createVehicleGenerationDto,
                                    include: { vehicleModel: { select: vehicleModelSelect } },
                                }))];
                    }
                });
            });
        };
        VehicleGenerationsService_1.prototype.findAll = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var where, andFilters, page, limit, _a, data, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            this.validateYears(query.startYear, query.endYear);
                            where = {};
                            andFilters = [];
                            if (query.vehicleModelId) {
                                where.vehicleModelId = query.vehicleModelId;
                            }
                            if (query.manufacturerId) {
                                where.vehicleModel = { manufacturerId: query.manufacturerId };
                            }
                            if (query.isActive !== undefined) {
                                where.isActive = query.isActive;
                            }
                            if (query.search) {
                                where.OR = [
                                    { name: { contains: query.search, mode: 'insensitive' } },
                                    { slug: { contains: query.search, mode: 'insensitive' } },
                                ];
                            }
                            if (query.startYear !== undefined) {
                                andFilters.push({
                                    OR: [{ endYear: { gte: query.startYear } }, { endYear: null }],
                                });
                            }
                            if (query.endYear !== undefined) {
                                andFilters.push({
                                    OR: [{ startYear: { lte: query.endYear } }, { startYear: null }],
                                });
                            }
                            if (andFilters.length > 0) {
                                where.AND = andFilters;
                            }
                            page = (_b = query.page) !== null && _b !== void 0 ? _b : 1;
                            limit = (_c = query.limit) !== null && _c !== void 0 ? _c : 20;
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.vehicleGeneration.findMany({
                                        where: where,
                                        include: { vehicleModel: { select: vehicleModelSelect } },
                                        orderBy: { createdAt: 'desc' },
                                        skip: (page - 1) * limit,
                                        take: limit,
                                    }),
                                    this.prisma.vehicleGeneration.count({ where: where }),
                                ])];
                        case 1:
                            _a = _d.sent(), data = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    data: data,
                                    meta: {
                                        page: page,
                                        limit: limit,
                                        total: total,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        VehicleGenerationsService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var vehicleGeneration;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicleGeneration.findUnique({
                                where: { id: id },
                                include: { vehicleModel: { select: vehicleModelSelect } },
                            })];
                        case 1:
                            vehicleGeneration = _a.sent();
                            if (!vehicleGeneration) {
                                throw new common_1.NotFoundException('Поколение автомобиля не найдено');
                            }
                            return [2 /*return*/, vehicleGeneration];
                    }
                });
            });
        };
        VehicleGenerationsService_1.prototype.update = function (id, updateVehicleGenerationDto) {
            return __awaiter(this, void 0, void 0, function () {
                var existingGeneration, vehicleModelId, name, slug, startYear, endYear, data;
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            existingGeneration = _f.sent();
                            vehicleModelId = (_a = updateVehicleGenerationDto.vehicleModelId) !== null && _a !== void 0 ? _a : existingGeneration.vehicleModelId;
                            name = (_b = updateVehicleGenerationDto.name) !== null && _b !== void 0 ? _b : existingGeneration.name;
                            slug = (_c = updateVehicleGenerationDto.slug) !== null && _c !== void 0 ? _c : existingGeneration.slug;
                            startYear = (_d = updateVehicleGenerationDto.startYear) !== null && _d !== void 0 ? _d : existingGeneration.startYear;
                            endYear = (_e = updateVehicleGenerationDto.endYear) !== null && _e !== void 0 ? _e : existingGeneration.endYear;
                            this.validateYears(startYear, endYear);
                            return [4 /*yield*/, this.ensureActiveVehicleModel(vehicleModelId)];
                        case 2:
                            _f.sent();
                            return [4 /*yield*/, this.ensureNoDuplicate(vehicleModelId, name, slug, id)];
                        case 3:
                            _f.sent();
                            data = __assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (updateVehicleGenerationDto.name !== undefined && {
                                name: updateVehicleGenerationDto.name,
                            })), (updateVehicleGenerationDto.slug !== undefined && {
                                slug: updateVehicleGenerationDto.slug,
                            })), (updateVehicleGenerationDto.description !== undefined && {
                                description: updateVehicleGenerationDto.description,
                            })), (updateVehicleGenerationDto.vehicleModelId !== undefined && {
                                vehicleModelId: updateVehicleGenerationDto.vehicleModelId,
                            })), (updateVehicleGenerationDto.startYear !== undefined && {
                                startYear: updateVehicleGenerationDto.startYear,
                            })), (updateVehicleGenerationDto.endYear !== undefined && {
                                endYear: updateVehicleGenerationDto.endYear,
                            })), (updateVehicleGenerationDto.isActive !== undefined && {
                                isActive: updateVehicleGenerationDto.isActive,
                            }));
                            return [2 /*return*/, this.withUniqueConstraintHandling(this.prisma.vehicleGeneration.update({
                                    where: { id: id },
                                    data: data,
                                    include: { vehicleModel: { select: vehicleModelSelect } },
                                }))];
                    }
                });
            });
        };
        VehicleGenerationsService_1.prototype.remove = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.vehicleGeneration.update({
                                    where: { id: id },
                                    data: { isActive: false },
                                    include: { vehicleModel: { select: vehicleModelSelect } },
                                })];
                    }
                });
            });
        };
        VehicleGenerationsService_1.prototype.validateYears = function (startYear, endYear) {
            if (startYear !== undefined &&
                startYear !== null &&
                endYear !== undefined &&
                endYear !== null &&
                endYear < startYear) {
                throw new common_1.BadRequestException('Год окончания не может быть меньше года начала');
            }
        };
        VehicleGenerationsService_1.prototype.ensureActiveVehicleModel = function (vehicleModelId) {
            return __awaiter(this, void 0, void 0, function () {
                var vehicleModel;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicleModel.findUnique({
                                where: { id: vehicleModelId },
                                select: {
                                    isActive: true,
                                    manufacturer: {
                                        select: { isActive: true },
                                    },
                                },
                            })];
                        case 1:
                            vehicleModel = _a.sent();
                            if (!vehicleModel) {
                                throw new common_1.NotFoundException('Модель автомобиля не найдена');
                            }
                            if (!vehicleModel.isActive) {
                                throw new common_1.BadRequestException('Нельзя добавить поколение к неактивной модели автомобиля');
                            }
                            if (!vehicleModel.manufacturer.isActive) {
                                throw new common_1.BadRequestException('Нельзя добавить поколение к модели неактивного производителя');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        VehicleGenerationsService_1.prototype.ensureNoDuplicate = function (vehicleModelId, name, slug, excludedId) {
            return __awaiter(this, void 0, void 0, function () {
                var duplicate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicleGeneration.findFirst({
                                where: __assign({ vehicleModelId: vehicleModelId, OR: [
                                        { name: { equals: name, mode: 'insensitive' } },
                                        { slug: { equals: slug, mode: 'insensitive' } },
                                    ] }, (excludedId && { NOT: { id: excludedId } })),
                            })];
                        case 1:
                            duplicate = _a.sent();
                            if (duplicate) {
                                throw new common_1.ConflictException('Поколение с таким названием или slug уже существует у этой модели');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        VehicleGenerationsService_1.prototype.withUniqueConstraintHandling = function (operation) {
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
                                throw new common_1.ConflictException('Поколение с таким названием или slug уже существует у этой модели');
                            }
                            throw error_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return VehicleGenerationsService_1;
    }());
    __setFunctionName(_classThis, "VehicleGenerationsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VehicleGenerationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VehicleGenerationsService = _classThis;
}();
exports.VehicleGenerationsService = VehicleGenerationsService;
