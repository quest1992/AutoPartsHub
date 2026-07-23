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
exports.ConfirmInventoryImportDto = exports.PreviewInventoryImportDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var PreviewInventoryImportDto = function () {
    var _a;
    var _shopId_decorators;
    var _shopId_initializers = [];
    var _shopId_extraInitializers = [];
    var _partNumberColumn_decorators;
    var _partNumberColumn_initializers = [];
    var _partNumberColumn_extraInitializers = [];
    var _nameColumn_decorators;
    var _nameColumn_initializers = [];
    var _nameColumn_extraInitializers = [];
    var _priceColumn_decorators;
    var _priceColumn_initializers = [];
    var _priceColumn_extraInitializers = [];
    var _quantityColumn_decorators;
    var _quantityColumn_initializers = [];
    var _quantityColumn_extraInitializers = [];
    return _a = /** @class */ (function () {
            function PreviewInventoryImportDto() {
                this.shopId = __runInitializers(this, _shopId_initializers, void 0);
                this.partNumberColumn = (__runInitializers(this, _shopId_extraInitializers), __runInitializers(this, _partNumberColumn_initializers, void 0));
                this.nameColumn = (__runInitializers(this, _partNumberColumn_extraInitializers), __runInitializers(this, _nameColumn_initializers, void 0));
                this.priceColumn = (__runInitializers(this, _nameColumn_extraInitializers), __runInitializers(this, _priceColumn_initializers, void 0));
                this.quantityColumn = (__runInitializers(this, _priceColumn_extraInitializers), __runInitializers(this, _quantityColumn_initializers, void 0));
                __runInitializers(this, _quantityColumn_extraInitializers);
            }
            return PreviewInventoryImportDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _shopId_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    format: 'uuid',
                    description: 'Обязателен для SUPER_ADMIN',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _partNumberColumn_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Колонка с артикулом / OEM / SKU',
                    example: 'Артикул',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _nameColumn_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Колонка с наименованием товара',
                    example: 'Наименование',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _priceColumn_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Колонка с ценой', example: 'Цена' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _quantityColumn_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Колонка с количеством',
                    example: 'Остаток',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            __esDecorate(null, null, _shopId_decorators, { kind: "field", name: "shopId", static: false, private: false, access: { has: function (obj) { return "shopId" in obj; }, get: function (obj) { return obj.shopId; }, set: function (obj, value) { obj.shopId = value; } }, metadata: _metadata }, _shopId_initializers, _shopId_extraInitializers);
            __esDecorate(null, null, _partNumberColumn_decorators, { kind: "field", name: "partNumberColumn", static: false, private: false, access: { has: function (obj) { return "partNumberColumn" in obj; }, get: function (obj) { return obj.partNumberColumn; }, set: function (obj, value) { obj.partNumberColumn = value; } }, metadata: _metadata }, _partNumberColumn_initializers, _partNumberColumn_extraInitializers);
            __esDecorate(null, null, _nameColumn_decorators, { kind: "field", name: "nameColumn", static: false, private: false, access: { has: function (obj) { return "nameColumn" in obj; }, get: function (obj) { return obj.nameColumn; }, set: function (obj, value) { obj.nameColumn = value; } }, metadata: _metadata }, _nameColumn_initializers, _nameColumn_extraInitializers);
            __esDecorate(null, null, _priceColumn_decorators, { kind: "field", name: "priceColumn", static: false, private: false, access: { has: function (obj) { return "priceColumn" in obj; }, get: function (obj) { return obj.priceColumn; }, set: function (obj, value) { obj.priceColumn = value; } }, metadata: _metadata }, _priceColumn_initializers, _priceColumn_extraInitializers);
            __esDecorate(null, null, _quantityColumn_decorators, { kind: "field", name: "quantityColumn", static: false, private: false, access: { has: function (obj) { return "quantityColumn" in obj; }, get: function (obj) { return obj.quantityColumn; }, set: function (obj, value) { obj.quantityColumn = value; } }, metadata: _metadata }, _quantityColumn_initializers, _quantityColumn_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.PreviewInventoryImportDto = PreviewInventoryImportDto;
var ConfirmInventoryImportDto = function () {
    var _a;
    var _shopId_decorators;
    var _shopId_initializers = [];
    var _shopId_extraInitializers = [];
    var _partNumberColumn_decorators;
    var _partNumberColumn_initializers = [];
    var _partNumberColumn_extraInitializers = [];
    var _nameColumn_decorators;
    var _nameColumn_initializers = [];
    var _nameColumn_extraInitializers = [];
    var _priceColumn_decorators;
    var _priceColumn_initializers = [];
    var _priceColumn_extraInitializers = [];
    var _quantityColumn_decorators;
    var _quantityColumn_initializers = [];
    var _quantityColumn_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ConfirmInventoryImportDto() {
                this.shopId = __runInitializers(this, _shopId_initializers, void 0);
                this.partNumberColumn = (__runInitializers(this, _shopId_extraInitializers), __runInitializers(this, _partNumberColumn_initializers, void 0));
                this.nameColumn = (__runInitializers(this, _partNumberColumn_extraInitializers), __runInitializers(this, _nameColumn_initializers, void 0));
                this.priceColumn = (__runInitializers(this, _nameColumn_extraInitializers), __runInitializers(this, _priceColumn_initializers, void 0));
                this.quantityColumn = (__runInitializers(this, _priceColumn_extraInitializers), __runInitializers(this, _quantityColumn_initializers, void 0));
                __runInitializers(this, _quantityColumn_extraInitializers);
            }
            return ConfirmInventoryImportDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _shopId_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    format: 'uuid',
                    description: 'Обязателен для SUPER_ADMIN',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _partNumberColumn_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Колонка с артикулом / OEM / SKU',
                    example: 'Артикул',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _nameColumn_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Колонка с наименованием товара',
                    example: 'Наименование',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _priceColumn_decorators = [(0, swagger_1.ApiProperty)({ description: 'Колонка с ценой', example: 'Цена' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            _quantityColumn_decorators = [(0, swagger_1.ApiProperty)({ description: 'Колонка с количеством', example: 'Остаток' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 200)];
            __esDecorate(null, null, _shopId_decorators, { kind: "field", name: "shopId", static: false, private: false, access: { has: function (obj) { return "shopId" in obj; }, get: function (obj) { return obj.shopId; }, set: function (obj, value) { obj.shopId = value; } }, metadata: _metadata }, _shopId_initializers, _shopId_extraInitializers);
            __esDecorate(null, null, _partNumberColumn_decorators, { kind: "field", name: "partNumberColumn", static: false, private: false, access: { has: function (obj) { return "partNumberColumn" in obj; }, get: function (obj) { return obj.partNumberColumn; }, set: function (obj, value) { obj.partNumberColumn = value; } }, metadata: _metadata }, _partNumberColumn_initializers, _partNumberColumn_extraInitializers);
            __esDecorate(null, null, _nameColumn_decorators, { kind: "field", name: "nameColumn", static: false, private: false, access: { has: function (obj) { return "nameColumn" in obj; }, get: function (obj) { return obj.nameColumn; }, set: function (obj, value) { obj.nameColumn = value; } }, metadata: _metadata }, _nameColumn_initializers, _nameColumn_extraInitializers);
            __esDecorate(null, null, _priceColumn_decorators, { kind: "field", name: "priceColumn", static: false, private: false, access: { has: function (obj) { return "priceColumn" in obj; }, get: function (obj) { return obj.priceColumn; }, set: function (obj, value) { obj.priceColumn = value; } }, metadata: _metadata }, _priceColumn_initializers, _priceColumn_extraInitializers);
            __esDecorate(null, null, _quantityColumn_decorators, { kind: "field", name: "quantityColumn", static: false, private: false, access: { has: function (obj) { return "quantityColumn" in obj; }, get: function (obj) { return obj.quantityColumn; }, set: function (obj, value) { obj.quantityColumn = value; } }, metadata: _metadata }, _quantityColumn_initializers, _quantityColumn_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ConfirmInventoryImportDto = ConfirmInventoryImportDto;
