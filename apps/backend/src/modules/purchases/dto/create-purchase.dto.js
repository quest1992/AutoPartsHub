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
exports.CreatePurchaseDto = exports.PurchaseLineDto = void 0;
var class_transformer_1 = require("class-transformer");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var PurchaseLineDto = function () {
    var _a;
    var _inventoryItemId_decorators;
    var _inventoryItemId_initializers = [];
    var _inventoryItemId_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    var _purchasePrice_decorators;
    var _purchasePrice_initializers = [];
    var _purchasePrice_extraInitializers = [];
    var _salePrice_decorators;
    var _salePrice_initializers = [];
    var _salePrice_extraInitializers = [];
    return _a = /** @class */ (function () {
            function PurchaseLineDto() {
                this.inventoryItemId = __runInitializers(this, _inventoryItemId_initializers, void 0);
                this.quantity = (__runInitializers(this, _inventoryItemId_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
                this.purchasePrice = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _purchasePrice_initializers, void 0));
                this.salePrice = (__runInitializers(this, _purchasePrice_extraInitializers), __runInitializers(this, _salePrice_initializers, void 0));
                __runInitializers(this, _salePrice_extraInitializers);
            }
            return PurchaseLineDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _inventoryItemId_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsUUID)()];
            _quantity_decorators = [(0, swagger_1.ApiProperty)({ minimum: 1 }), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _purchasePrice_decorators = [(0, swagger_1.ApiProperty)({ minimum: 0 }), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.Min)(0)];
            _salePrice_decorators = [(0, swagger_1.ApiPropertyOptional)({ minimum: 0 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.Min)(0)];
            __esDecorate(null, null, _inventoryItemId_decorators, { kind: "field", name: "inventoryItemId", static: false, private: false, access: { has: function (obj) { return "inventoryItemId" in obj; }, get: function (obj) { return obj.inventoryItemId; }, set: function (obj, value) { obj.inventoryItemId = value; } }, metadata: _metadata }, _inventoryItemId_initializers, _inventoryItemId_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _purchasePrice_decorators, { kind: "field", name: "purchasePrice", static: false, private: false, access: { has: function (obj) { return "purchasePrice" in obj; }, get: function (obj) { return obj.purchasePrice; }, set: function (obj, value) { obj.purchasePrice = value; } }, metadata: _metadata }, _purchasePrice_initializers, _purchasePrice_extraInitializers);
            __esDecorate(null, null, _salePrice_decorators, { kind: "field", name: "salePrice", static: false, private: false, access: { has: function (obj) { return "salePrice" in obj; }, get: function (obj) { return obj.salePrice; }, set: function (obj, value) { obj.salePrice = value; } }, metadata: _metadata }, _salePrice_initializers, _salePrice_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.PurchaseLineDto = PurchaseLineDto;
var CreatePurchaseDto = function () {
    var _a;
    var _shopId_decorators;
    var _shopId_initializers = [];
    var _shopId_extraInitializers = [];
    var _invoiceNumber_decorators;
    var _invoiceNumber_initializers = [];
    var _invoiceNumber_extraInitializers = [];
    var _supplierName_decorators;
    var _supplierName_initializers = [];
    var _supplierName_extraInitializers = [];
    var _supplierPhone_decorators;
    var _supplierPhone_initializers = [];
    var _supplierPhone_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    var _purchasedAt_decorators;
    var _purchasedAt_initializers = [];
    var _purchasedAt_extraInitializers = [];
    var _discount_decorators;
    var _discount_initializers = [];
    var _discount_extraInitializers = [];
    var _items_decorators;
    var _items_initializers = [];
    var _items_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreatePurchaseDto() {
                this.shopId = __runInitializers(this, _shopId_initializers, void 0);
                this.invoiceNumber = (__runInitializers(this, _shopId_extraInitializers), __runInitializers(this, _invoiceNumber_initializers, void 0));
                this.supplierName = (__runInitializers(this, _invoiceNumber_extraInitializers), __runInitializers(this, _supplierName_initializers, void 0));
                this.supplierPhone = (__runInitializers(this, _supplierName_extraInitializers), __runInitializers(this, _supplierPhone_initializers, void 0));
                this.notes = (__runInitializers(this, _supplierPhone_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                this.purchasedAt = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _purchasedAt_initializers, void 0));
                this.discount = (__runInitializers(this, _purchasedAt_extraInitializers), __runInitializers(this, _discount_initializers, void 0));
                this.items = (__runInitializers(this, _discount_extraInitializers), __runInitializers(this, _items_initializers, void 0));
                __runInitializers(this, _items_extraInitializers);
            }
            return CreatePurchaseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _shopId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _invoiceNumber_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _supplierName_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _supplierPhone_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _purchasedAt_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '2026-07-19T10:00:00.000Z' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _discount_decorators = [(0, swagger_1.ApiPropertyOptional)({ minimum: 0 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.Min)(0)];
            _items_decorators = [(0, swagger_1.ApiProperty)({ type: [PurchaseLineDto] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return PurchaseLineDto; })];
            __esDecorate(null, null, _shopId_decorators, { kind: "field", name: "shopId", static: false, private: false, access: { has: function (obj) { return "shopId" in obj; }, get: function (obj) { return obj.shopId; }, set: function (obj, value) { obj.shopId = value; } }, metadata: _metadata }, _shopId_initializers, _shopId_extraInitializers);
            __esDecorate(null, null, _invoiceNumber_decorators, { kind: "field", name: "invoiceNumber", static: false, private: false, access: { has: function (obj) { return "invoiceNumber" in obj; }, get: function (obj) { return obj.invoiceNumber; }, set: function (obj, value) { obj.invoiceNumber = value; } }, metadata: _metadata }, _invoiceNumber_initializers, _invoiceNumber_extraInitializers);
            __esDecorate(null, null, _supplierName_decorators, { kind: "field", name: "supplierName", static: false, private: false, access: { has: function (obj) { return "supplierName" in obj; }, get: function (obj) { return obj.supplierName; }, set: function (obj, value) { obj.supplierName = value; } }, metadata: _metadata }, _supplierName_initializers, _supplierName_extraInitializers);
            __esDecorate(null, null, _supplierPhone_decorators, { kind: "field", name: "supplierPhone", static: false, private: false, access: { has: function (obj) { return "supplierPhone" in obj; }, get: function (obj) { return obj.supplierPhone; }, set: function (obj, value) { obj.supplierPhone = value; } }, metadata: _metadata }, _supplierPhone_initializers, _supplierPhone_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _purchasedAt_decorators, { kind: "field", name: "purchasedAt", static: false, private: false, access: { has: function (obj) { return "purchasedAt" in obj; }, get: function (obj) { return obj.purchasedAt; }, set: function (obj, value) { obj.purchasedAt = value; } }, metadata: _metadata }, _purchasedAt_initializers, _purchasedAt_extraInitializers);
            __esDecorate(null, null, _discount_decorators, { kind: "field", name: "discount", static: false, private: false, access: { has: function (obj) { return "discount" in obj; }, get: function (obj) { return obj.discount; }, set: function (obj, value) { obj.discount = value; } }, metadata: _metadata }, _discount_initializers, _discount_extraInitializers);
            __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: function (obj) { return "items" in obj; }, get: function (obj) { return obj.items; }, set: function (obj, value) { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreatePurchaseDto = CreatePurchaseDto;
