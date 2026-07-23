"use strict";
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
exports.PartCatalogMatchingService = void 0;
var common_1 = require("@nestjs/common");
var part_name_normalizer_1 = require("../../common/utils/part-name-normalizer");
var part_number_normalizer_1 = require("../../common/utils/part-number-normalizer");
var notFound = function (requiresReview) {
    if (requiresReview === void 0) { requiresReview = false; }
    return ({
        matched: false,
        partCatalogItemId: null,
        method: 'NOT_FOUND',
        confidence: 0,
        requiresReview: requiresReview,
    });
};
var PartCatalogMatchingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PartCatalogMatchingService = _classThis = /** @class */ (function () {
        function PartCatalogMatchingService_1(prisma) {
            this.prisma = prisma;
        }
        PartCatalogMatchingService_1.prototype.findByPartNumber = function (partNumber) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedNumber, matches;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            normalizedNumber = (0, part_number_normalizer_1.normalizePartNumber)(partNumber);
                            if (!normalizedNumber)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, this.prisma.partNumber.findMany({
                                    where: {
                                        normalizedNumber: normalizedNumber,
                                        partCatalogItem: { isActive: true },
                                    },
                                    select: { partCatalogItemId: true },
                                })];
                        case 1:
                            matches = _a.sent();
                            return [2 /*return*/, this.uniqueIds(matches)];
                    }
                });
            });
        };
        PartCatalogMatchingService_1.prototype.findByAlias = function (alias) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedAlias, matches;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            normalizedAlias = (0, part_name_normalizer_1.normalizePartName)(alias);
                            if (!normalizedAlias)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, this.prisma.partAlias.findMany({
                                    where: {
                                        normalizedAlias: normalizedAlias,
                                        isApproved: true,
                                        partCatalogItem: { isActive: true },
                                    },
                                    select: { partCatalogItemId: true },
                                })];
                        case 1:
                            matches = _a.sent();
                            return [2 /*return*/, this.uniqueIds(matches)];
                    }
                });
            });
        };
        PartCatalogMatchingService_1.prototype.findByCanonicalName = function (name) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedName, matches;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            normalizedName = (0, part_name_normalizer_1.normalizePartName)(name);
                            if (!normalizedName)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, this.prisma.partCatalogItem.findMany({
                                    where: { normalizedName: normalizedName, isActive: true },
                                    select: { id: true },
                                })];
                        case 1:
                            matches = _a.sent();
                            return [2 /*return*/, __spreadArray([], new Set(matches.map(function (match) { return match.id; })), true)];
                    }
                });
            });
        };
        PartCatalogMatchingService_1.prototype.match = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var requiresReview, partNumberMatches, result, aliasMatches, aliasResult, nameMatches, nameResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            requiresReview = false;
                            if (!input.partNumber) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.findByPartNumber(input.partNumber)];
                        case 1:
                            partNumberMatches = _a.sent();
                            result = this.toResult(partNumberMatches, 'OEM_EXACT', 1);
                            if (result)
                                return [2 /*return*/, result];
                            requiresReview || (requiresReview = partNumberMatches.length > 1);
                            _a.label = 2;
                        case 2:
                            if (!input.name) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.findByAlias(input.name)];
                        case 3:
                            aliasMatches = _a.sent();
                            aliasResult = this.toResult(aliasMatches, 'ALIAS_EXACT', 0.9);
                            if (aliasResult)
                                return [2 /*return*/, aliasResult];
                            requiresReview || (requiresReview = aliasMatches.length > 1);
                            return [4 /*yield*/, this.findByCanonicalName(input.name)];
                        case 4:
                            nameMatches = _a.sent();
                            nameResult = this.toResult(nameMatches, 'NAME_EXACT', 0.8);
                            if (nameResult)
                                return [2 /*return*/, nameResult];
                            requiresReview || (requiresReview = nameMatches.length > 1);
                            _a.label = 5;
                        case 5: return [2 /*return*/, notFound(requiresReview)];
                    }
                });
            });
        };
        PartCatalogMatchingService_1.prototype.toResult = function (matches, method, confidence) {
            if (matches.length !== 1)
                return null;
            return {
                matched: true,
                partCatalogItemId: matches[0],
                method: method,
                confidence: confidence,
                requiresReview: false,
            };
        };
        PartCatalogMatchingService_1.prototype.uniqueIds = function (matches) {
            return __spreadArray([], new Set(matches.map(function (match) { return match.partCatalogItemId; })), true);
        };
        return PartCatalogMatchingService_1;
    }());
    __setFunctionName(_classThis, "PartCatalogMatchingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartCatalogMatchingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartCatalogMatchingService = _classThis;
}();
exports.PartCatalogMatchingService = PartCatalogMatchingService;
