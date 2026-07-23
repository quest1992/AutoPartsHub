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
exports.CreatePartCompatibilityDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var CreatePartCompatibilityDto = function () {
    var _a;
    var _vehicleGenerationId_decorators;
    var _vehicleGenerationId_initializers = [];
    var _vehicleGenerationId_extraInitializers = [];
    var _yearFrom_decorators;
    var _yearFrom_initializers = [];
    var _yearFrom_extraInitializers = [];
    var _yearTo_decorators;
    var _yearTo_initializers = [];
    var _yearTo_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreatePartCompatibilityDto() {
                this.vehicleGenerationId = __runInitializers(this, _vehicleGenerationId_initializers, void 0);
                this.yearFrom = (__runInitializers(this, _vehicleGenerationId_extraInitializers), __runInitializers(this, _yearFrom_initializers, void 0));
                this.yearTo = (__runInitializers(this, _yearFrom_extraInitializers), __runInitializers(this, _yearTo_initializers, void 0));
                this.notes = (__runInitializers(this, _yearTo_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                __runInitializers(this, _notes_extraInitializers);
            }
            return CreatePartCompatibilityDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _vehicleGenerationId_decorators = [(0, swagger_1.ApiProperty)({ format: 'uuid' }), (0, class_validator_1.IsUUID)()];
            _yearFrom_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 2017, minimum: 1900, maximum: 2100 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1900), (0, class_validator_1.Max)(2100)];
            _yearTo_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 2024, minimum: 1900, maximum: 2100 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1900), (0, class_validator_1.Max)(2100)];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Для кузова седан' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 1000)];
            __esDecorate(null, null, _vehicleGenerationId_decorators, { kind: "field", name: "vehicleGenerationId", static: false, private: false, access: { has: function (obj) { return "vehicleGenerationId" in obj; }, get: function (obj) { return obj.vehicleGenerationId; }, set: function (obj, value) { obj.vehicleGenerationId = value; } }, metadata: _metadata }, _vehicleGenerationId_initializers, _vehicleGenerationId_extraInitializers);
            __esDecorate(null, null, _yearFrom_decorators, { kind: "field", name: "yearFrom", static: false, private: false, access: { has: function (obj) { return "yearFrom" in obj; }, get: function (obj) { return obj.yearFrom; }, set: function (obj, value) { obj.yearFrom = value; } }, metadata: _metadata }, _yearFrom_initializers, _yearFrom_extraInitializers);
            __esDecorate(null, null, _yearTo_decorators, { kind: "field", name: "yearTo", static: false, private: false, access: { has: function (obj) { return "yearTo" in obj; }, get: function (obj) { return obj.yearTo; }, set: function (obj, value) { obj.yearTo = value; } }, metadata: _metadata }, _yearTo_initializers, _yearTo_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreatePartCompatibilityDto = CreatePartCompatibilityDto;
