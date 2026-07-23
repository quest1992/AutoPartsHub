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
exports.CreatePartAliasDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var CreatePartAliasDto = function () {
    var _a;
    var _alias_decorators;
    var _alias_initializers = [];
    var _alias_extraInitializers = [];
    var _source_decorators;
    var _source_initializers = [];
    var _source_extraInitializers = [];
    var _isApproved_decorators;
    var _isApproved_initializers = [];
    var _isApproved_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreatePartAliasDto() {
                this.alias = __runInitializers(this, _alias_initializers, void 0);
                this.source = (__runInitializers(this, _alias_extraInitializers), __runInitializers(this, _source_initializers, void 0));
                this.isApproved = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _isApproved_initializers, void 0));
                __runInitializers(this, _isApproved_extraInitializers);
            }
            return CreatePartAliasDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _alias_decorators = [(0, swagger_1.ApiProperty)({ example: 'Колодки передние тормозные' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 500)];
            _source_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Каталог поставщика' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 255)];
            _isApproved_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _alias_decorators, { kind: "field", name: "alias", static: false, private: false, access: { has: function (obj) { return "alias" in obj; }, get: function (obj) { return obj.alias; }, set: function (obj, value) { obj.alias = value; } }, metadata: _metadata }, _alias_initializers, _alias_extraInitializers);
            __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: function (obj) { return "source" in obj; }, get: function (obj) { return obj.source; }, set: function (obj, value) { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
            __esDecorate(null, null, _isApproved_decorators, { kind: "field", name: "isApproved", static: false, private: false, access: { has: function (obj) { return "isApproved" in obj; }, get: function (obj) { return obj.isApproved; }, set: function (obj, value) { obj.isApproved = value; } }, metadata: _metadata }, _isApproved_initializers, _isApproved_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreatePartAliasDto = CreatePartAliasDto;
