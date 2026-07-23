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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventorySearchQueryDto = exports.SortOrder = exports.InventorySearchSortBy = void 0;
var class_transformer_1 = require("class-transformer");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var InventorySearchSortBy;
(function (InventorySearchSortBy) {
    InventorySearchSortBy["relevance"] = "relevance";
    InventorySearchSortBy["price"] = "price";
    InventorySearchSortBy["quantity"] = "quantity";
    InventorySearchSortBy["name"] = "name";
})(InventorySearchSortBy || (exports.InventorySearchSortBy = InventorySearchSortBy = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["asc"] = "asc";
    SortOrder["desc"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
var InventorySearchQueryDto = function () {
    var _a;
    var _q_decorators;
    var _q_initializers = [];
    var _q_extraInitializers = [];
    var _shopId_decorators;
    var _shopId_initializers = [];
    var _shopId_extraInitializers = [];
    var _categoryId_decorators;
    var _categoryId_initializers = [];
    var _categoryId_extraInitializers = [];
    var _manufacturerId_decorators;
    var _manufacturerId_initializers = [];
    var _manufacturerId_extraInitializers = [];
    var _vehicleModelId_decorators;
    var _vehicleModelId_initializers = [];
    var _vehicleModelId_extraInitializers = [];
    var _vehicleGenerationId_decorators;
    var _vehicleGenerationId_initializers = [];
    var _vehicleGenerationId_extraInitializers = [];
    var _inStockOnly_decorators;
    var _inStockOnly_initializers = [];
    var _inStockOnly_extraInitializers = [];
    var _minPrice_decorators;
    var _minPrice_initializers = [];
    var _minPrice_extraInitializers = [];
    var _maxPrice_decorators;
    var _maxPrice_initializers = [];
    var _maxPrice_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    var _sortBy_decorators;
    var _sortBy_initializers = [];
    var _sortBy_extraInitializers = [];
    var _sortOrder_decorators;
    var _sortOrder_initializers = [];
    var _sortOrder_extraInitializers = [];
    return _a = /** @class */ (function () {
            function InventorySearchQueryDto() {
                this.q = __runInitializers(this, _q_initializers, void 0);
                this.shopId = (__runInitializers(this, _q_extraInitializers), __runInitializers(this, _shopId_initializers, void 0));
                this.categoryId = (__runInitializers(this, _shopId_extraInitializers), __runInitializers(this, _categoryId_initializers, void 0));
                this.manufacturerId = (__runInitializers(this, _categoryId_extraInitializers), __runInitializers(this, _manufacturerId_initializers, void 0));
                this.vehicleModelId = (__runInitializers(this, _manufacturerId_extraInitializers), __runInitializers(this, _vehicleModelId_initializers, void 0));
                this.vehicleGenerationId = (__runInitializers(this, _vehicleModelId_extraInitializers), __runInitializers(this, _vehicleGenerationId_initializers, void 0));
                this.inStockOnly = (__runInitializers(this, _vehicleGenerationId_extraInitializers), __runInitializers(this, _inStockOnly_initializers, void 0));
                this.minPrice = (__runInitializers(this, _inStockOnly_extraInitializers), __runInitializers(this, _minPrice_initializers, void 0));
                this.maxPrice = (__runInitializers(this, _minPrice_extraInitializers), __runInitializers(this, _maxPrice_initializers, void 0));
                this.page = (__runInitializers(this, _maxPrice_extraInitializers), __runInitializers(this, _page_initializers, void 0));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                this.sortBy = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _sortBy_initializers, void 0));
                this.sortOrder = (__runInitializers(this, _sortBy_extraInitializers), __runInitializers(this, _sortOrder_initializers, void 0));
                __runInitializers(this, _sortOrder_extraInitializers);
            }
            return InventorySearchQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _q_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _shopId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _categoryId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _manufacturerId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _vehicleModelId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _vehicleGenerationId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _inStockOnly_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: true }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Boolean; }), (0, class_validator_1.IsBoolean)()];
            _minPrice_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _maxPrice_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _page_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 1 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _limit_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 20, maximum: 100 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            _sortBy_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: InventorySearchSortBy,
                    default: InventorySearchSortBy.relevance,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(InventorySearchSortBy)];
            _sortOrder_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: SortOrder, default: SortOrder.asc }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(SortOrder)];
            __esDecorate(null, null, _q_decorators, { kind: "field", name: "q", static: false, private: false, access: { has: function (obj) { return "q" in obj; }, get: function (obj) { return obj.q; }, set: function (obj, value) { obj.q = value; } }, metadata: _metadata }, _q_initializers, _q_extraInitializers);
            __esDecorate(null, null, _shopId_decorators, { kind: "field", name: "shopId", static: false, private: false, access: { has: function (obj) { return "shopId" in obj; }, get: function (obj) { return obj.shopId; }, set: function (obj, value) { obj.shopId = value; } }, metadata: _metadata }, _shopId_initializers, _shopId_extraInitializers);
            __esDecorate(null, null, _categoryId_decorators, { kind: "field", name: "categoryId", static: false, private: false, access: { has: function (obj) { return "categoryId" in obj; }, get: function (obj) { return obj.categoryId; }, set: function (obj, value) { obj.categoryId = value; } }, metadata: _metadata }, _categoryId_initializers, _categoryId_extraInitializers);
            __esDecorate(null, null, _manufacturerId_decorators, { kind: "field", name: "manufacturerId", static: false, private: false, access: { has: function (obj) { return "manufacturerId" in obj; }, get: function (obj) { return obj.manufacturerId; }, set: function (obj, value) { obj.manufacturerId = value; } }, metadata: _metadata }, _manufacturerId_initializers, _manufacturerId_extraInitializers);
            __esDecorate(null, null, _vehicleModelId_decorators, { kind: "field", name: "vehicleModelId", static: false, private: false, access: { has: function (obj) { return "vehicleModelId" in obj; }, get: function (obj) { return obj.vehicleModelId; }, set: function (obj, value) { obj.vehicleModelId = value; } }, metadata: _metadata }, _vehicleModelId_initializers, _vehicleModelId_extraInitializers);
            __esDecorate(null, null, _vehicleGenerationId_decorators, { kind: "field", name: "vehicleGenerationId", static: false, private: false, access: { has: function (obj) { return "vehicleGenerationId" in obj; }, get: function (obj) { return obj.vehicleGenerationId; }, set: function (obj, value) { obj.vehicleGenerationId = value; } }, metadata: _metadata }, _vehicleGenerationId_initializers, _vehicleGenerationId_extraInitializers);
            __esDecorate(null, null, _inStockOnly_decorators, { kind: "field", name: "inStockOnly", static: false, private: false, access: { has: function (obj) { return "inStockOnly" in obj; }, get: function (obj) { return obj.inStockOnly; }, set: function (obj, value) { obj.inStockOnly = value; } }, metadata: _metadata }, _inStockOnly_initializers, _inStockOnly_extraInitializers);
            __esDecorate(null, null, _minPrice_decorators, { kind: "field", name: "minPrice", static: false, private: false, access: { has: function (obj) { return "minPrice" in obj; }, get: function (obj) { return obj.minPrice; }, set: function (obj, value) { obj.minPrice = value; } }, metadata: _metadata }, _minPrice_initializers, _minPrice_extraInitializers);
            __esDecorate(null, null, _maxPrice_decorators, { kind: "field", name: "maxPrice", static: false, private: false, access: { has: function (obj) { return "maxPrice" in obj; }, get: function (obj) { return obj.maxPrice; }, set: function (obj, value) { obj.maxPrice = value; } }, metadata: _metadata }, _maxPrice_initializers, _maxPrice_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _sortBy_decorators, { kind: "field", name: "sortBy", static: false, private: false, access: { has: function (obj) { return "sortBy" in obj; }, get: function (obj) { return obj.sortBy; }, set: function (obj, value) { obj.sortBy = value; } }, metadata: _metadata }, _sortBy_initializers, _sortBy_extraInitializers);
            __esDecorate(null, null, _sortOrder_decorators, { kind: "field", name: "sortOrder", static: false, private: false, access: { has: function (obj) { return "sortOrder" in obj; }, get: function (obj) { return obj.sortOrder; }, set: function (obj, value) { obj.sortOrder = value; } }, metadata: _metadata }, _sortOrder_initializers, _sortOrder_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.InventorySearchQueryDto = InventorySearchQueryDto;
