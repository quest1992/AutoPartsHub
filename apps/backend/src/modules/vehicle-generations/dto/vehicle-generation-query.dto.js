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
exports.VehicleGenerationQueryDto = void 0;
var class_transformer_1 = require("class-transformer");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var toBoolean = function (_a) {
    var value = _a.value;
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    return value;
};
var toNumber = function (_a) {
    var value = _a.value;
    return typeof value === 'string' ? Number(value) : value;
};
var VehicleGenerationQueryDto = function () {
    var _a;
    var _search_decorators;
    var _search_initializers = [];
    var _search_extraInitializers = [];
    var _vehicleModelId_decorators;
    var _vehicleModelId_initializers = [];
    var _vehicleModelId_extraInitializers = [];
    var _manufacturerId_decorators;
    var _manufacturerId_initializers = [];
    var _manufacturerId_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _startYear_decorators;
    var _startYear_initializers = [];
    var _startYear_extraInitializers = [];
    var _endYear_decorators;
    var _endYear_initializers = [];
    var _endYear_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    return _a = /** @class */ (function () {
            function VehicleGenerationQueryDto() {
                this.search = __runInitializers(this, _search_initializers, void 0);
                this.vehicleModelId = (__runInitializers(this, _search_extraInitializers), __runInitializers(this, _vehicleModelId_initializers, void 0));
                this.manufacturerId = (__runInitializers(this, _vehicleModelId_extraInitializers), __runInitializers(this, _manufacturerId_initializers, void 0));
                this.isActive = (__runInitializers(this, _manufacturerId_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                this.startYear = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _startYear_initializers, void 0));
                this.endYear = (__runInitializers(this, _startYear_extraInitializers), __runInitializers(this, _endYear_initializers, void 0));
                this.page = (__runInitializers(this, _endYear_extraInitializers), __runInitializers(this, _page_initializers, void 0));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                __runInitializers(this, _limit_extraInitializers);
            }
            return VehicleGenerationQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _search_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'xv70',
                    description: 'Поиск по name или slug',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(1, 100)];
            _vehicleModelId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Фильтр по ID модели автомобиля' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _manufacturerId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Фильтр по ID производителя автомобиля' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _isActive_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true, description: 'Фильтр по активности' }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toBoolean), (0, class_validator_1.IsBoolean)()];
            _startYear_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 2017,
                    description: 'Начало искомого периода',
                }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toNumber), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1900), (0, class_validator_1.Max)(2100)];
            _endYear_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 2024, description: 'Конец искомого периода' }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toNumber), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1900), (0, class_validator_1.Max)(2100)];
            _page_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 1,
                    default: 1,
                    description: 'Номер страницы',
                }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toNumber), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _limit_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 20,
                    default: 20,
                    description: 'Записей на странице',
                }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(toNumber), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _search_decorators, { kind: "field", name: "search", static: false, private: false, access: { has: function (obj) { return "search" in obj; }, get: function (obj) { return obj.search; }, set: function (obj, value) { obj.search = value; } }, metadata: _metadata }, _search_initializers, _search_extraInitializers);
            __esDecorate(null, null, _vehicleModelId_decorators, { kind: "field", name: "vehicleModelId", static: false, private: false, access: { has: function (obj) { return "vehicleModelId" in obj; }, get: function (obj) { return obj.vehicleModelId; }, set: function (obj, value) { obj.vehicleModelId = value; } }, metadata: _metadata }, _vehicleModelId_initializers, _vehicleModelId_extraInitializers);
            __esDecorate(null, null, _manufacturerId_decorators, { kind: "field", name: "manufacturerId", static: false, private: false, access: { has: function (obj) { return "manufacturerId" in obj; }, get: function (obj) { return obj.manufacturerId; }, set: function (obj, value) { obj.manufacturerId = value; } }, metadata: _metadata }, _manufacturerId_initializers, _manufacturerId_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _startYear_decorators, { kind: "field", name: "startYear", static: false, private: false, access: { has: function (obj) { return "startYear" in obj; }, get: function (obj) { return obj.startYear; }, set: function (obj, value) { obj.startYear = value; } }, metadata: _metadata }, _startYear_initializers, _startYear_extraInitializers);
            __esDecorate(null, null, _endYear_decorators, { kind: "field", name: "endYear", static: false, private: false, access: { has: function (obj) { return "endYear" in obj; }, get: function (obj) { return obj.endYear; }, set: function (obj, value) { obj.endYear = value; } }, metadata: _metadata }, _endYear_initializers, _endYear_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.VehicleGenerationQueryDto = VehicleGenerationQueryDto;
