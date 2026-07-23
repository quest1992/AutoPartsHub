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
exports.PartCatalogItemQueryDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var toBoolean = function (_a) {
    var value = _a.value;
    return value === 'true' ? true : value === 'false' ? false : value;
};
var toNumber = function (_a) {
    var value = _a.value;
    return typeof value === 'string' ? Number(value) : value;
};
var PartCatalogItemQueryDto = function () {
    var _a;
    var _search_decorators;
    var _search_initializers = [];
    var _search_extraInitializers = [];
    var _internalCode_decorators;
    var _internalCode_initializers = [];
    var _internalCode_extraInitializers = [];
    var _categoryId_decorators;
    var _categoryId_initializers = [];
    var _categoryId_extraInitializers = [];
    var _rootCategoryId_decorators;
    var _rootCategoryId_initializers = [];
    var _rootCategoryId_extraInitializers = [];
    var _side_decorators;
    var _side_initializers = [];
    var _side_extraInitializers = [];
    var _position_decorators;
    var _position_initializers = [];
    var _position_extraInitializers = [];
    var _vehicleGenerationId_decorators;
    var _vehicleGenerationId_initializers = [];
    var _vehicleGenerationId_extraInitializers = [];
    var _vehicleModelId_decorators;
    var _vehicleModelId_initializers = [];
    var _vehicleModelId_extraInitializers = [];
    var _manufacturerId_decorators;
    var _manufacturerId_initializers = [];
    var _manufacturerId_extraInitializers = [];
    var _isUniversal_decorators;
    var _isUniversal_initializers = [];
    var _isUniversal_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    return _a = /** @class */ (function () {
            function PartCatalogItemQueryDto() {
                this.search = __runInitializers(this, _search_initializers, void 0);
                this.internalCode = (__runInitializers(this, _search_extraInitializers), __runInitializers(this, _internalCode_initializers, void 0));
                this.categoryId = (__runInitializers(this, _internalCode_extraInitializers), __runInitializers(this, _categoryId_initializers, void 0));
                this.rootCategoryId = (__runInitializers(this, _categoryId_extraInitializers), __runInitializers(this, _rootCategoryId_initializers, void 0));
                this.side = (__runInitializers(this, _rootCategoryId_extraInitializers), __runInitializers(this, _side_initializers, void 0));
                this.position = (__runInitializers(this, _side_extraInitializers), __runInitializers(this, _position_initializers, void 0));
                this.vehicleGenerationId = (__runInitializers(this, _position_extraInitializers), __runInitializers(this, _vehicleGenerationId_initializers, void 0));
                this.vehicleModelId = (__runInitializers(this, _vehicleGenerationId_extraInitializers), __runInitializers(this, _vehicleModelId_initializers, void 0));
                this.manufacturerId = (__runInitializers(this, _vehicleModelId_extraInitializers), __runInitializers(this, _manufacturerId_initializers, void 0));
                this.isUniversal = (__runInitializers(this, _manufacturerId_extraInitializers), __runInitializers(this, _isUniversal_initializers, void 0));
                this.isActive = (__runInitializers(this, _isUniversal_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                this.page = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _page_initializers, void 0));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                __runInitializers(this, _limit_extraInitializers);
            }
            return PartCatalogItemQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _search_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Поиск по названию, slug или внутреннему коду',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _internalCode_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'PRT-000001',
                    description: 'Точный внутренний код',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 50)];
            _categoryId_decorators = [(0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _rootCategoryId_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    format: 'uuid',
                    description: 'Категория и все её потомки',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _side_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.PartSide }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.PartSide)];
            _position_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.PartPosition }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.PartPosition)];
            _vehicleGenerationId_decorators = [(0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _vehicleModelId_decorators = [(0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _manufacturerId_decorators = [(0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _isUniversal_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toBoolean), (0, class_validator_1.IsBoolean)()];
            _isActive_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toBoolean), (0, class_validator_1.IsBoolean)()];
            _page_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 1 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toNumber), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _limit_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 20, maximum: 100 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toNumber), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _search_decorators, { kind: "field", name: "search", static: false, private: false, access: { has: function (obj) { return "search" in obj; }, get: function (obj) { return obj.search; }, set: function (obj, value) { obj.search = value; } }, metadata: _metadata }, _search_initializers, _search_extraInitializers);
            __esDecorate(null, null, _internalCode_decorators, { kind: "field", name: "internalCode", static: false, private: false, access: { has: function (obj) { return "internalCode" in obj; }, get: function (obj) { return obj.internalCode; }, set: function (obj, value) { obj.internalCode = value; } }, metadata: _metadata }, _internalCode_initializers, _internalCode_extraInitializers);
            __esDecorate(null, null, _categoryId_decorators, { kind: "field", name: "categoryId", static: false, private: false, access: { has: function (obj) { return "categoryId" in obj; }, get: function (obj) { return obj.categoryId; }, set: function (obj, value) { obj.categoryId = value; } }, metadata: _metadata }, _categoryId_initializers, _categoryId_extraInitializers);
            __esDecorate(null, null, _rootCategoryId_decorators, { kind: "field", name: "rootCategoryId", static: false, private: false, access: { has: function (obj) { return "rootCategoryId" in obj; }, get: function (obj) { return obj.rootCategoryId; }, set: function (obj, value) { obj.rootCategoryId = value; } }, metadata: _metadata }, _rootCategoryId_initializers, _rootCategoryId_extraInitializers);
            __esDecorate(null, null, _side_decorators, { kind: "field", name: "side", static: false, private: false, access: { has: function (obj) { return "side" in obj; }, get: function (obj) { return obj.side; }, set: function (obj, value) { obj.side = value; } }, metadata: _metadata }, _side_initializers, _side_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: function (obj) { return "position" in obj; }, get: function (obj) { return obj.position; }, set: function (obj, value) { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            __esDecorate(null, null, _vehicleGenerationId_decorators, { kind: "field", name: "vehicleGenerationId", static: false, private: false, access: { has: function (obj) { return "vehicleGenerationId" in obj; }, get: function (obj) { return obj.vehicleGenerationId; }, set: function (obj, value) { obj.vehicleGenerationId = value; } }, metadata: _metadata }, _vehicleGenerationId_initializers, _vehicleGenerationId_extraInitializers);
            __esDecorate(null, null, _vehicleModelId_decorators, { kind: "field", name: "vehicleModelId", static: false, private: false, access: { has: function (obj) { return "vehicleModelId" in obj; }, get: function (obj) { return obj.vehicleModelId; }, set: function (obj, value) { obj.vehicleModelId = value; } }, metadata: _metadata }, _vehicleModelId_initializers, _vehicleModelId_extraInitializers);
            __esDecorate(null, null, _manufacturerId_decorators, { kind: "field", name: "manufacturerId", static: false, private: false, access: { has: function (obj) { return "manufacturerId" in obj; }, get: function (obj) { return obj.manufacturerId; }, set: function (obj, value) { obj.manufacturerId = value; } }, metadata: _metadata }, _manufacturerId_initializers, _manufacturerId_extraInitializers);
            __esDecorate(null, null, _isUniversal_decorators, { kind: "field", name: "isUniversal", static: false, private: false, access: { has: function (obj) { return "isUniversal" in obj; }, get: function (obj) { return obj.isUniversal; }, set: function (obj, value) { obj.isUniversal = value; } }, metadata: _metadata }, _isUniversal_initializers, _isUniversal_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.PartCatalogItemQueryDto = PartCatalogItemQueryDto;
