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
exports.InventoryImportService = void 0;
var common_1 = require("@nestjs/common");
var part_name_normalizer_1 = require("../../common/utils/part-name-normalizer");
var client_1 = require("@prisma/client");
var library_1 = require("@prisma/client/runtime/library");
var inventory_import_parser_1 = require("./inventory-import.parser");
var PREVIEW_LIMIT = 20;
var BATCH_SIZE = 300;
var MAX_ERRORS = 100;
var InventoryImportService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var InventoryImportService = _classThis = /** @class */ (function () {
        function InventoryImportService_1(prisma, matchingService) {
            this.prisma = prisma;
            this.matchingService = matchingService;
        }
        InventoryImportService_1.prototype.preview = function (file, actor, shopId, mappingInput) {
            return __awaiter(this, void 0, void 0, function () {
                var parsed, suggestedMapping, _a, mapping, mappingErrors, evaluated, validRows, invalidRows;
                var _b, _c, _d, _e, _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            this.resolveShop(actor, shopId);
                            parsed = this.readWorksheet(file);
                            suggestedMapping = (0, inventory_import_parser_1.suggestColumnMapping)(parsed.columns);
                            _a = (0, inventory_import_parser_1.resolveColumnMapping)(parsed.columns, mappingInput !== null && mappingInput !== void 0 ? mappingInput : {
                                categoryColumn: suggestedMapping.category,
                                subcategoryColumn: suggestedMapping.subcategory,
                                partNumberColumn: suggestedMapping.partNumber,
                                nameColumn: suggestedMapping.name,
                                priceColumn: suggestedMapping.price,
                                quantityColumn: suggestedMapping.quantity,
                            }), mapping = _a.mapping, mappingErrors = _a.errors;
                            return [4 /*yield*/, this.evaluateRows(parsed.rows, mapping)];
                        case 1:
                            evaluated = _h.sent();
                            validRows = evaluated.filter(function (row) { return row.status === 'valid'; }).length;
                            invalidRows = evaluated.filter(function (row) { return row.status === 'invalid'; }).length;
                            return [2 /*return*/, {
                                    fileName: parsed.fileName,
                                    worksheetName: parsed.worksheetName,
                                    totalRows: evaluated.length,
                                    columns: parsed.columns,
                                    suggestedMapping: {
                                        category: (_b = suggestedMapping.category) !== null && _b !== void 0 ? _b : null,
                                        subcategory: (_c = suggestedMapping.subcategory) !== null && _c !== void 0 ? _c : null,
                                        partNumber: (_d = suggestedMapping.partNumber) !== null && _d !== void 0 ? _d : null,
                                        name: (_e = suggestedMapping.name) !== null && _e !== void 0 ? _e : null,
                                        price: (_f = suggestedMapping.price) !== null && _f !== void 0 ? _f : null,
                                        quantity: (_g = suggestedMapping.quantity) !== null && _g !== void 0 ? _g : null,
                                    },
                                    appliedMapping: {
                                        categoryColumn: mapping.categoryColumn,
                                        subcategoryColumn: mapping.subcategoryColumn,
                                        partNumberColumn: mapping.partNumberColumn,
                                        nameColumn: mapping.nameColumn,
                                        priceColumn: mapping.priceColumn,
                                        quantityColumn: mapping.quantityColumn,
                                    },
                                    mappingErrors: mappingErrors,
                                    previewRows: evaluated.slice(0, PREVIEW_LIMIT).map(function (row) { return ({
                                        rowNumber: row.rowNumber,
                                        source: row.source,
                                        normalized: {
                                            category: row.normalized.categoryName,
                                            subcategory: row.normalized.subcategoryName,
                                            partNumber: row.normalized.partNumber,
                                            name: row.normalized.displayName,
                                            price: row.normalized.displayPrice,
                                            quantity: row.normalized.quantity,
                                        },
                                        status: row.status,
                                        errors: row.errors,
                                    }); }),
                                    summary: {
                                        validRows: validRows,
                                        invalidRows: invalidRows,
                                        requiresReviewRows: evaluated.filter(function (row) { return row.status === 'requires_review'; }).length,
                                    },
                                }];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.confirm = function (file, actor, shopId, mappingInput) {
            return __awaiter(this, void 0, void 0, function () {
                var resolvedShopId, parsed, _a, mapping, mappingErrors, job, evaluated, stats, errors, _loop_1, this_1, start, status_1, error_1;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            resolvedShopId = this.resolveShop(actor, shopId);
                            parsed = this.readWorksheet(file);
                            _a = (0, inventory_import_parser_1.resolveColumnMapping)(parsed.columns, mappingInput), mapping = _a.mapping, mappingErrors = _a.errors;
                            if (mappingErrors.length) {
                                throw new common_1.BadRequestException(mappingErrors.join('; '));
                            }
                            return [4 /*yield*/, this.prisma.inventoryImportJob.create({
                                    data: {
                                        shopId: resolvedShopId,
                                        fileName: parsed.fileName,
                                        status: client_1.InventoryImportJobStatus.PROCESSING,
                                        totalRows: parsed.rows.length,
                                        createdByUserId: actor.id,
                                    },
                                })];
                        case 1:
                            job = _b.sent();
                            return [4 /*yield*/, this.evaluateRows(parsed.rows, mapping)];
                        case 2:
                            evaluated = _b.sent();
                            stats = {
                                imported: 0,
                                updated: 0,
                                skipped: 0,
                                requiresReview: 0,
                                failed: 0,
                            };
                            errors = [];
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 9, , 11]);
                            _loop_1 = function (start) {
                                var batch;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            batch = evaluated.slice(start, start + BATCH_SIZE);
                                            return [4 /*yield*/, this_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                                    var _i, batch_1, row, outcome;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                _i = 0, batch_1 = batch;
                                                                _a.label = 1;
                                                            case 1:
                                                                if (!(_i < batch_1.length)) return [3 /*break*/, 4];
                                                                row = batch_1[_i];
                                                                return [4 /*yield*/, this.processImportRow(tx, row, resolvedShopId, actor)];
                                                            case 2:
                                                                outcome = _a.sent();
                                                                stats[outcome.kind] += 1;
                                                                if (outcome.error && errors.length < MAX_ERRORS) {
                                                                    errors.push({
                                                                        rowNumber: row.rowNumber,
                                                                        message: outcome.error,
                                                                    });
                                                                }
                                                                _a.label = 3;
                                                            case 3:
                                                                _i++;
                                                                return [3 /*break*/, 1];
                                                            case 4: return [2 /*return*/];
                                                        }
                                                    });
                                                }); })];
                                        case 1:
                                            _c.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            start = 0;
                            _b.label = 4;
                        case 4:
                            if (!(start < evaluated.length)) return [3 /*break*/, 7];
                            return [5 /*yield**/, _loop_1(start)];
                        case 5:
                            _b.sent();
                            _b.label = 6;
                        case 6:
                            start += BATCH_SIZE;
                            return [3 /*break*/, 4];
                        case 7:
                            status_1 = stats.failed > 0
                                ? client_1.InventoryImportJobStatus.COMPLETED_WITH_ERRORS
                                : client_1.InventoryImportJobStatus.COMPLETED;
                            return [4 /*yield*/, this.prisma.inventoryImportJob.update({
                                    where: {
                                        id: job.id,
                                    },
                                    data: {
                                        status: status_1,
                                        importedRows: stats.imported,
                                        updatedRows: stats.updated,
                                        skippedRows: stats.skipped,
                                        failedRows: stats.failed,
                                        requiresReviewRows: stats.requiresReview,
                                        completedAt: new Date(),
                                    },
                                })];
                        case 8:
                            _b.sent();
                            return [2 /*return*/, {
                                    jobId: job.id,
                                    totalRows: evaluated.length,
                                    imported: stats.imported,
                                    updated: stats.updated,
                                    skipped: stats.skipped,
                                    requiresReview: stats.requiresReview,
                                    failed: stats.failed,
                                    errors: errors,
                                }];
                        case 9:
                            error_1 = _b.sent();
                            return [4 /*yield*/, this.prisma.inventoryImportJob.update({
                                    where: {
                                        id: job.id,
                                    },
                                    data: {
                                        status: client_1.InventoryImportJobStatus.FAILED,
                                        failedRows: evaluated.length,
                                        completedAt: new Date(),
                                    },
                                })];
                        case 10:
                            _b.sent();
                            throw error_1;
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.readWorksheet = function (file) {
            try {
                return (0, inventory_import_parser_1.parseExcelFile)(file);
            }
            catch (error) {
                var code = error instanceof Error ? error.message : 'UNKNOWN';
                switch (code) {
                    case 'FILE_MISSING':
                        throw new common_1.BadRequestException('Файл не передан');
                    case 'FILE_TOO_LARGE':
                        throw new common_1.BadRequestException('Файл слишком большой');
                    case 'FILE_TYPE_INVALID':
                        throw new common_1.BadRequestException('Поддерживаются только файлы .xlsx и .xls');
                    case 'FILE_READ_FAILED':
                        throw new common_1.BadRequestException('Не удалось прочитать Excel-файл');
                    case 'WORKBOOK_EMPTY':
                    case 'NO_DATA_ROWS':
                    case 'NO_USABLE_ROWS':
                        throw new common_1.BadRequestException('В файле не найдены товары');
                    default:
                        throw new common_1.BadRequestException('Не удалось обработать Excel-файл');
                }
            }
        };
        InventoryImportService_1.prototype.evaluateRows = function (rows, mapping) {
            return __awaiter(this, void 0, void 0, function () {
                var result, _i, rows_1, row, _a, normalized, errors, status_2, catalogItemId, match;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            result = [];
                            _i = 0, rows_1 = rows;
                            _b.label = 1;
                        case 1:
                            if (!(_i < rows_1.length)) return [3 /*break*/, 6];
                            row = rows_1[_i];
                            _a = (0, inventory_import_parser_1.normalizeImportRow)(row.source, mapping), normalized = _a.normalized, errors = _a.errors;
                            status_2 = 'valid';
                            catalogItemId = null;
                            if (!errors.length) return [3 /*break*/, 2];
                            status_2 = 'invalid';
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.matchCatalog(normalized)];
                        case 3:
                            match = _b.sent();
                            catalogItemId = match.partCatalogItemId;
                            if (!match.matched || match.requiresReview) {
                                status_2 = 'requires_review';
                            }
                            _b.label = 4;
                        case 4:
                            result.push({
                                rowNumber: row.rowNumber,
                                source: row.source,
                                normalized: __assign(__assign({}, normalized), { displayName: normalized.rawName, displayPrice: normalized.price }),
                                status: status_2,
                                errors: errors,
                                catalogItemId: catalogItemId,
                            });
                            _b.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, result];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.matchCatalog = function (normalized) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.matchingService.match({
                            partNumber: normalized.partNumber,
                            name: normalized.name,
                        })];
                });
            });
        };
        InventoryImportService_1.prototype.processImportRow = function (tx, row, shopId, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var normalized, match, existing, partCatalogItemId, category, sequence, name_1, created, error_2;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (row.status === 'invalid') {
                                return [2 /*return*/, {
                                        kind: 'skipped',
                                        error: row.errors.join('; ') ||
                                            'Строка содержит ошибки',
                                    }];
                            }
                            normalized = row.normalized;
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 12, , 13]);
                            return [4 /*yield*/, this.matchCatalog(normalized)];
                        case 2:
                            match = _e.sent();
                            return [4 /*yield*/, this.findExistingInventory(tx, shopId, (_a = match.partCatalogItemId) !== null && _a !== void 0 ? _a : row.catalogItemId, normalized.partNumber, normalized.name)];
                        case 3:
                            existing = _e.sent();
                            if (!existing) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.updateInventoryItem(tx, existing, normalized, actor)];
                        case 4:
                            _e.sent();
                            return [2 /*return*/, {
                                    kind: 'updated',
                                }];
                        case 5:
                            partCatalogItemId = (_b = match.partCatalogItemId) !== null && _b !== void 0 ? _b : row.catalogItemId;
                            if (!(!match.matched || !partCatalogItemId)) return [3 /*break*/, 10];
                            return [4 /*yield*/, this.resolveImportedCategory(tx, normalized)];
                        case 6:
                            category = _e.sent();
                            return [4 /*yield*/, tx.appSequence.upsert({
                                    where: {
                                        key: 'PART_CATALOG',
                                    },
                                    create: {
                                        key: 'PART_CATALOG',
                                        value: 1,
                                    },
                                    update: {
                                        value: {
                                            increment: 1,
                                        },
                                    },
                                })];
                        case 7:
                            sequence = _e.sent();
                            name_1 = ((_c = normalized.rawName) === null || _c === void 0 ? void 0 : _c.trim()) ||
                                ((_d = normalized.name) === null || _d === void 0 ? void 0 : _d.trim()) ||
                                'Без названия';
                            return [4 /*yield*/, tx.partCatalogItem.create({
                                    data: {
                                        internalCode: "PRT-".concat(String(sequence.value).padStart(6, '0')),
                                        name: name_1,
                                        normalizedName: (0, part_name_normalizer_1.normalizePartName)(name_1),
                                        searchTokens: (0, part_name_normalizer_1.getPartNameSearchTokens)(name_1),
                                        slug: "import-".concat(sequence.value),
                                        categoryId: category.id,
                                        side: client_1.PartSide.NONE,
                                        position: client_1.PartPosition.NONE,
                                        isUniversal: false,
                                        isActive: true,
                                    },
                                    select: {
                                        id: true,
                                    },
                                })];
                        case 8:
                            created = _e.sent();
                            partCatalogItemId = created.id;
                            if (!(normalized.rawPartNumber &&
                                normalized.partNumber)) return [3 /*break*/, 10];
                            return [4 /*yield*/, tx.partNumber.create({
                                    data: {
                                        partCatalogItemId: created.id,
                                        rawNumber: normalized.rawPartNumber,
                                        normalizedNumber: normalized.partNumber,
                                        type: client_1.PartNumberType.OEM,
                                        brand: normalized.brand,
                                        isPrimary: true,
                                    },
                                })];
                        case 9:
                            _e.sent();
                            _e.label = 10;
                        case 10: return [4 /*yield*/, this.createInventoryItem(tx, shopId, partCatalogItemId, normalized, actor)];
                        case 11:
                            _e.sent();
                            return [2 /*return*/, {
                                    kind: 'imported',
                                }];
                        case 12:
                            error_2 = _e.sent();
                            return [2 /*return*/, {
                                    kind: 'failed',
                                    error: this.publicErrorMessage(error_2),
                                }];
                        case 13: return [2 /*return*/];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.resolveImportedCategory = function (tx, normalized) {
            return __awaiter(this, void 0, void 0, function () {
                var categoryName, parentCategory, subcategoryName, subcategory;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            categoryName = (_a = normalized.categoryName) === null || _a === void 0 ? void 0 : _a.trim();
                            if (!categoryName) {
                                throw new common_1.BadRequestException('Не указана категория товара');
                            }
                            return [4 /*yield*/, tx.partCategory.findFirst({
                                    where: {
                                        parentId: null,
                                        isActive: true,
                                        name: {
                                            equals: categoryName,
                                            mode: 'insensitive',
                                        },
                                    },
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                })];
                        case 1:
                            parentCategory = _c.sent();
                            if (!parentCategory) {
                                throw new common_1.NotFoundException("\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u00AB".concat(categoryName, "\u00BB \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"));
                            }
                            subcategoryName = (_b = normalized.subcategoryName) === null || _b === void 0 ? void 0 : _b.trim();
                            if (!subcategoryName) {
                                return [2 /*return*/, {
                                        id: parentCategory.id,
                                    }];
                            }
                            return [4 /*yield*/, tx.partCategory.findFirst({
                                    where: {
                                        parentId: parentCategory.id,
                                        isActive: true,
                                        name: {
                                            equals: subcategoryName,
                                            mode: 'insensitive',
                                        },
                                    },
                                    select: {
                                        id: true,
                                    },
                                })];
                        case 2:
                            subcategory = _c.sent();
                            if (!subcategory) {
                                throw new common_1.NotFoundException("\u041F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u00AB".concat(subcategoryName, "\u00BB \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 ") +
                                    "\u0432 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u00AB".concat(categoryName, "\u00BB"));
                            }
                            return [2 /*return*/, subcategory];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.createInventoryItem = function (tx, shopId, partCatalogItemId, normalized, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var part, item;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, tx.partCatalogItem.findUnique({
                                where: {
                                    id: partCatalogItemId,
                                },
                                select: {
                                    isActive: true,
                                    category: {
                                        select: {
                                            isActive: true,
                                        },
                                    },
                                },
                            })];
                        case 1:
                            part = _c.sent();
                            if (!part) {
                                throw new common_1.NotFoundException('Деталь каталога не найдена');
                            }
                            if (!part.isActive) {
                                throw new common_1.BadRequestException('Нельзя добавить неактивную деталь каталога');
                            }
                            if (!part.category.isActive) {
                                throw new common_1.BadRequestException('Категория детали отключена');
                            }
                            return [4 /*yield*/, tx.shopInventoryItem.create({
                                    data: {
                                        shopId: shopId,
                                        partCatalogItemId: partCatalogItemId,
                                        brand: normalized.brand,
                                        price: new library_1.Decimal((_a = normalized.price) !== null && _a !== void 0 ? _a : 0),
                                        quantity: normalized.quantity,
                                        minQuantity: (_b = normalized.minQuantity) !== null && _b !== void 0 ? _b : 0,
                                        oemNumber: normalized.rawPartNumber,
                                        sku: normalized.rawPartNumber,
                                        condition: this.toPartCondition(normalized.condition),
                                        currency: normalized.currency || 'TJS',
                                        location: normalized.location ||
                                            normalized.warehouse ||
                                            null,
                                        notes: normalized.notes,
                                    },
                                })];
                        case 2:
                            item = _c.sent();
                            if (!(item.quantity > 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, tx.inventoryMovement.create({
                                    data: {
                                        shopId: shopId,
                                        inventoryItemId: item.id,
                                        userId: actor.id,
                                        type: client_1.InventoryMovementType.INITIAL_BALANCE,
                                        change: item.quantity,
                                        quantityBefore: 0,
                                        quantityAfter: item.quantity,
                                        notes: 'Начальный остаток (импорт Excel)',
                                    },
                                })];
                        case 3:
                            _c.sent();
                            _c.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.findExistingInventory = function (tx, shopId, catalogItemId, normalizedPartNumber, normalizedName) {
            return __awaiter(this, void 0, void 0, function () {
                var byCatalog, byPartNumber, matched;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!catalogItemId) return [3 /*break*/, 2];
                            return [4 /*yield*/, tx.shopInventoryItem.findFirst({
                                    where: {
                                        shopId: shopId,
                                        partCatalogItemId: catalogItemId,
                                        isActive: true,
                                    },
                                })];
                        case 1:
                            byCatalog = _a.sent();
                            if (byCatalog) {
                                return [2 /*return*/, byCatalog];
                            }
                            _a.label = 2;
                        case 2:
                            if (!normalizedPartNumber) return [3 /*break*/, 4];
                            return [4 /*yield*/, tx.shopInventoryItem.findMany({
                                    where: {
                                        shopId: shopId,
                                        isActive: true,
                                        OR: [
                                            {
                                                oemNumber: {
                                                    not: null,
                                                },
                                            },
                                            {
                                                sku: {
                                                    not: null,
                                                },
                                            },
                                        ],
                                    },
                                    take: 500,
                                })];
                        case 3:
                            byPartNumber = _a.sent();
                            matched = byPartNumber.find(function (item) {
                                var _a, _b;
                                var oem = (_a = item.oemNumber) === null || _a === void 0 ? void 0 : _a.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                var sku = (_b = item.sku) === null || _b === void 0 ? void 0 : _b.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                return (oem === normalizedPartNumber ||
                                    sku === normalizedPartNumber);
                            });
                            if (matched) {
                                return [2 /*return*/, matched];
                            }
                            _a.label = 4;
                        case 4:
                            if (normalizedName) {
                                return [2 /*return*/, tx.shopInventoryItem.findFirst({
                                        where: {
                                            shopId: shopId,
                                            isActive: true,
                                            partCatalogItem: {
                                                normalizedName: normalizedName,
                                            },
                                        },
                                    })];
                            }
                            return [2 /*return*/, null];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.updateInventoryItem = function (tx, existing, normalized, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var nextQuantity, nextPrice, quantityChanged;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            nextQuantity = normalized.quantity;
                            nextPrice = new library_1.Decimal((_a = normalized.price) !== null && _a !== void 0 ? _a : 0);
                            quantityChanged = existing.quantity !== nextQuantity;
                            return [4 /*yield*/, tx.shopInventoryItem.update({
                                    where: {
                                        id: existing.id,
                                    },
                                    data: __assign(__assign({ price: nextPrice, quantity: nextQuantity, minQuantity: (_b = normalized.minQuantity) !== null && _b !== void 0 ? _b : 0, brand: normalized.brand, condition: this.toPartCondition(normalized.condition), currency: normalized.currency || 'TJS', location: normalized.location ||
                                            normalized.warehouse ||
                                            null, notes: normalized.notes }, (normalized.rawPartNumber
                                        ? {
                                            oemNumber: normalized.rawPartNumber,
                                            sku: normalized.rawPartNumber,
                                        }
                                        : {})), { updatedAt: new Date() }),
                                })];
                        case 1:
                            _c.sent();
                            if (!quantityChanged) return [3 /*break*/, 3];
                            return [4 /*yield*/, tx.inventoryMovement.create({
                                    data: {
                                        shopId: existing.shopId,
                                        inventoryItemId: existing.id,
                                        userId: actor.id,
                                        type: client_1.InventoryMovementType.ADJUSTMENT,
                                        change: nextQuantity - existing.quantity,
                                        quantityBefore: existing.quantity,
                                        quantityAfter: nextQuantity,
                                        notes: 'Обновление при импорте Excel',
                                    },
                                })];
                        case 2:
                            _c.sent();
                            _c.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        InventoryImportService_1.prototype.toPartCondition = function (condition) {
            switch (condition) {
                case 'USED':
                    return client_1.PartCondition.USED;
                case 'REFURBISHED':
                    return client_1.PartCondition.REFURBISHED;
                case 'NEW':
                default:
                    return client_1.PartCondition.NEW;
            }
        };
        InventoryImportService_1.prototype.resolveShop = function (actor, requestedShopId) {
            if (actor.role === client_1.UserRole.SUPER_ADMIN) {
                if (!requestedShopId) {
                    throw new common_1.BadRequestException('Для SUPER_ADMIN необходимо указать магазин');
                }
                return requestedShopId;
            }
            if (!actor.shopId) {
                throw new common_1.ForbiddenException('Пользователь не привязан к магазину');
            }
            if (requestedShopId &&
                requestedShopId !== actor.shopId) {
                throw new common_1.ForbiddenException('Нельзя импортировать в чужой магазин');
            }
            return actor.shopId;
        };
        InventoryImportService_1.prototype.publicErrorMessage = function (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                return error.message;
            }
            return error instanceof Error &&
                error.message
                ? error.message
                : 'Не удалось обработать строку';
        };
        return InventoryImportService_1;
    }());
    __setFunctionName(_classThis, "InventoryImportService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InventoryImportService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InventoryImportService = _classThis;
}();
exports.InventoryImportService = InventoryImportService;
