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
exports.DashboardSummaryQueryDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var DashboardSummaryQueryDto = function () {
    var _a;
    var _shopId_decorators;
    var _shopId_initializers = [];
    var _shopId_extraInitializers = [];
    var _dateFrom_decorators;
    var _dateFrom_initializers = [];
    var _dateFrom_extraInitializers = [];
    var _dateTo_decorators;
    var _dateTo_initializers = [];
    var _dateTo_extraInitializers = [];
    var _lowStockThreshold_decorators;
    var _lowStockThreshold_initializers = [];
    var _lowStockThreshold_extraInitializers = [];
    return _a = /** @class */ (function () {
            function DashboardSummaryQueryDto() {
                this.shopId = __runInitializers(this, _shopId_initializers, void 0);
                this.dateFrom = (__runInitializers(this, _shopId_extraInitializers), __runInitializers(this, _dateFrom_initializers, void 0));
                this.dateTo = (__runInitializers(this, _dateFrom_extraInitializers), __runInitializers(this, _dateTo_initializers, void 0));
                this.lowStockThreshold = (__runInitializers(this, _dateTo_extraInitializers), __runInitializers(this, _lowStockThreshold_initializers, void 0));
                __runInitializers(this, _lowStockThreshold_extraInitializers);
            }
            return DashboardSummaryQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _shopId_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    format: 'uuid',
                    description: 'Только для SUPER_ADMIN',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _dateFrom_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '2026-07-19T00:00:00.000Z' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _dateTo_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '2026-07-19T23:59:59.999Z' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _lowStockThreshold_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 5, minimum: 1, maximum: 100 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _shopId_decorators, { kind: "field", name: "shopId", static: false, private: false, access: { has: function (obj) { return "shopId" in obj; }, get: function (obj) { return obj.shopId; }, set: function (obj, value) { obj.shopId = value; } }, metadata: _metadata }, _shopId_initializers, _shopId_extraInitializers);
            __esDecorate(null, null, _dateFrom_decorators, { kind: "field", name: "dateFrom", static: false, private: false, access: { has: function (obj) { return "dateFrom" in obj; }, get: function (obj) { return obj.dateFrom; }, set: function (obj, value) { obj.dateFrom = value; } }, metadata: _metadata }, _dateFrom_initializers, _dateFrom_extraInitializers);
            __esDecorate(null, null, _dateTo_decorators, { kind: "field", name: "dateTo", static: false, private: false, access: { has: function (obj) { return "dateTo" in obj; }, get: function (obj) { return obj.dateTo; }, set: function (obj, value) { obj.dateTo = value; } }, metadata: _metadata }, _dateTo_initializers, _dateTo_extraInitializers);
            __esDecorate(null, null, _lowStockThreshold_decorators, { kind: "field", name: "lowStockThreshold", static: false, private: false, access: { has: function (obj) { return "lowStockThreshold" in obj; }, get: function (obj) { return obj.lowStockThreshold; }, set: function (obj, value) { obj.lowStockThreshold = value; } }, metadata: _metadata }, _lowStockThreshold_initializers, _lowStockThreshold_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.DashboardSummaryQueryDto = DashboardSummaryQueryDto;
