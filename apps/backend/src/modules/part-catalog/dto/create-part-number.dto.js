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
exports.CreatePartNumberDto = void 0;
var client_1 = require("@prisma/client");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var CreatePartNumberDto = function () {
    var _a;
    var _rawNumber_decorators;
    var _rawNumber_initializers = [];
    var _rawNumber_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _brand_decorators;
    var _brand_initializers = [];
    var _brand_extraInitializers = [];
    var _isPrimary_decorators;
    var _isPrimary_initializers = [];
    var _isPrimary_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreatePartNumberDto() {
                this.rawNumber = __runInitializers(this, _rawNumber_initializers, void 0);
                this.type = (__runInitializers(this, _rawNumber_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.brand = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _brand_initializers, void 0));
                this.isPrimary = (__runInitializers(this, _brand_extraInitializers), __runInitializers(this, _isPrimary_initializers, void 0));
                __runInitializers(this, _isPrimary_extraInitializers);
            }
            return CreatePartNumberDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _rawNumber_decorators = [(0, swagger_1.ApiProperty)({ example: '04465-0K240' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 255)];
            _type_decorators = [(0, swagger_1.ApiProperty)({ enum: client_1.PartNumberType, example: client_1.PartNumberType.OEM }), (0, class_validator_1.IsEnum)(client_1.PartNumberType)];
            _brand_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Toyota' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 255)];
            _isPrimary_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _rawNumber_decorators, { kind: "field", name: "rawNumber", static: false, private: false, access: { has: function (obj) { return "rawNumber" in obj; }, get: function (obj) { return obj.rawNumber; }, set: function (obj, value) { obj.rawNumber = value; } }, metadata: _metadata }, _rawNumber_initializers, _rawNumber_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _brand_decorators, { kind: "field", name: "brand", static: false, private: false, access: { has: function (obj) { return "brand" in obj; }, get: function (obj) { return obj.brand; }, set: function (obj, value) { obj.brand = value; } }, metadata: _metadata }, _brand_initializers, _brand_extraInitializers);
            __esDecorate(null, null, _isPrimary_decorators, { kind: "field", name: "isPrimary", static: false, private: false, access: { has: function (obj) { return "isPrimary" in obj; }, get: function (obj) { return obj.isPrimary; }, set: function (obj, value) { obj.isPrimary = value; } }, metadata: _metadata }, _isPrimary_initializers, _isPrimary_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreatePartNumberDto = CreatePartNumberDto;
