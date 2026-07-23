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
exports.CreateShopInventoryItemDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var CreateShopInventoryItemDto = function () {
    var _a;
    var _shopId_decorators;
    var _shopId_initializers = [];
    var _shopId_extraInitializers = [];
    var _partCatalogItemId_decorators;
    var _partCatalogItemId_initializers = [];
    var _partCatalogItemId_extraInitializers = [];
    var _brand_decorators;
    var _brand_initializers = [];
    var _brand_extraInitializers = [];
    var _sku_decorators;
    var _sku_initializers = [];
    var _sku_extraInitializers = [];
    var _oemNumber_decorators;
    var _oemNumber_initializers = [];
    var _oemNumber_extraInitializers = [];
    var _condition_decorators;
    var _condition_initializers = [];
    var _condition_extraInitializers = [];
    var _price_decorators;
    var _price_initializers = [];
    var _price_extraInitializers = [];
    var _currency_decorators;
    var _currency_initializers = [];
    var _currency_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    var _minQuantity_decorators;
    var _minQuantity_initializers = [];
    var _minQuantity_extraInitializers = [];
    var _location_decorators;
    var _location_initializers = [];
    var _location_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateShopInventoryItemDto() {
                this.shopId = __runInitializers(this, _shopId_initializers, void 0);
                this.partCatalogItemId = (__runInitializers(this, _shopId_extraInitializers), __runInitializers(this, _partCatalogItemId_initializers, void 0));
                this.brand = (__runInitializers(this, _partCatalogItemId_extraInitializers), __runInitializers(this, _brand_initializers, void 0));
                this.sku = (__runInitializers(this, _brand_extraInitializers), __runInitializers(this, _sku_initializers, void 0));
                this.oemNumber = (__runInitializers(this, _sku_extraInitializers), __runInitializers(this, _oemNumber_initializers, void 0));
                this.condition = (__runInitializers(this, _oemNumber_extraInitializers), __runInitializers(this, _condition_initializers, void 0));
                this.price = (__runInitializers(this, _condition_extraInitializers), __runInitializers(this, _price_initializers, void 0));
                this.currency = (__runInitializers(this, _price_extraInitializers), __runInitializers(this, _currency_initializers, void 0));
                this.quantity = (__runInitializers(this, _currency_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
                this.minQuantity = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _minQuantity_initializers, void 0));
                this.location = (__runInitializers(this, _minQuantity_extraInitializers), __runInitializers(this, _location_initializers, void 0));
                this.notes = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                this.isActive = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                __runInitializers(this, _isActive_extraInitializers);
            }
            return CreateShopInventoryItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _shopId_decorators = [(0, swagger_1.ApiPropertyOptional)({ format: 'uuid', description: 'Только SUPER_ADMIN' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _partCatalogItemId_decorators = [(0, swagger_1.ApiProperty)({ format: 'uuid' }), (0, class_validator_1.IsUUID)()];
            _brand_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 100)];
            _sku_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 100)];
            _oemNumber_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 100)];
            _condition_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.PartCondition, default: client_1.PartCondition.NEW }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.PartCondition)];
            _price_decorators = [(0, swagger_1.ApiProperty)({ example: 1200, minimum: 0 }), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }), (0, class_validator_1.Min)(0)];
            _currency_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 'TJS' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(3, 3)];
            _quantity_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 0 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0)];
            _minQuantity_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 0 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0)];
            _location_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 1000)];
            _isActive_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _shopId_decorators, { kind: "field", name: "shopId", static: false, private: false, access: { has: function (obj) { return "shopId" in obj; }, get: function (obj) { return obj.shopId; }, set: function (obj, value) { obj.shopId = value; } }, metadata: _metadata }, _shopId_initializers, _shopId_extraInitializers);
            __esDecorate(null, null, _partCatalogItemId_decorators, { kind: "field", name: "partCatalogItemId", static: false, private: false, access: { has: function (obj) { return "partCatalogItemId" in obj; }, get: function (obj) { return obj.partCatalogItemId; }, set: function (obj, value) { obj.partCatalogItemId = value; } }, metadata: _metadata }, _partCatalogItemId_initializers, _partCatalogItemId_extraInitializers);
            __esDecorate(null, null, _brand_decorators, { kind: "field", name: "brand", static: false, private: false, access: { has: function (obj) { return "brand" in obj; }, get: function (obj) { return obj.brand; }, set: function (obj, value) { obj.brand = value; } }, metadata: _metadata }, _brand_initializers, _brand_extraInitializers);
            __esDecorate(null, null, _sku_decorators, { kind: "field", name: "sku", static: false, private: false, access: { has: function (obj) { return "sku" in obj; }, get: function (obj) { return obj.sku; }, set: function (obj, value) { obj.sku = value; } }, metadata: _metadata }, _sku_initializers, _sku_extraInitializers);
            __esDecorate(null, null, _oemNumber_decorators, { kind: "field", name: "oemNumber", static: false, private: false, access: { has: function (obj) { return "oemNumber" in obj; }, get: function (obj) { return obj.oemNumber; }, set: function (obj, value) { obj.oemNumber = value; } }, metadata: _metadata }, _oemNumber_initializers, _oemNumber_extraInitializers);
            __esDecorate(null, null, _condition_decorators, { kind: "field", name: "condition", static: false, private: false, access: { has: function (obj) { return "condition" in obj; }, get: function (obj) { return obj.condition; }, set: function (obj, value) { obj.condition = value; } }, metadata: _metadata }, _condition_initializers, _condition_extraInitializers);
            __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: function (obj) { return "price" in obj; }, get: function (obj) { return obj.price; }, set: function (obj, value) { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
            __esDecorate(null, null, _currency_decorators, { kind: "field", name: "currency", static: false, private: false, access: { has: function (obj) { return "currency" in obj; }, get: function (obj) { return obj.currency; }, set: function (obj, value) { obj.currency = value; } }, metadata: _metadata }, _currency_initializers, _currency_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _minQuantity_decorators, { kind: "field", name: "minQuantity", static: false, private: false, access: { has: function (obj) { return "minQuantity" in obj; }, get: function (obj) { return obj.minQuantity; }, set: function (obj, value) { obj.minQuantity = value; } }, metadata: _metadata }, _minQuantity_initializers, _minQuantity_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: function (obj) { return "location" in obj; }, get: function (obj) { return obj.location; }, set: function (obj, value) { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateShopInventoryItemDto = CreateShopInventoryItemDto;
