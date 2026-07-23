"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var client_1 = require("@prisma/client");
var master_part_categories_1 = require("../src/part-categories/data/master-part-categories");
var prisma = new client_1.PrismaClient();
function normalizeName(value) {
    return value
        .normalize('NFKC')
        .toLocaleLowerCase('ru-RU')
        .replace(/ё/g, 'е')
        .replace(/[\s-]+/g, ' ')
        .trim();
}
function findExistingCategory(parentId, slug, name) {
    return __awaiter(this, void 0, void 0, function () {
        var bySlug, siblings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.partCategory.findFirst({
                        where: { parentId: parentId, slug: { equals: slug, mode: 'insensitive' } },
                        select: { id: true, slug: true, name: true },
                    })];
                case 1:
                    bySlug = _a.sent();
                    if (bySlug)
                        return [2 /*return*/, bySlug];
                    return [4 /*yield*/, prisma.partCategory.findMany({
                            where: { parentId: parentId },
                            select: { id: true, slug: true, name: true },
                        })];
                case 2:
                    siblings = _a.sent();
                    return [2 /*return*/, siblings.find(function (category) { return normalizeName(category.name) === normalizeName(name); })];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var report, parents, _i, masterPartCategories_1, item, parent_1, depth, parentId, existing, created, error_1, existing;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (process.env.NODE_ENV === 'production') {
                        throw new Error('Part category seed cannot run when NODE_ENV=production.');
                    }
                    report = { created: 0, existing: 0, skipped: 0, errors: 0 };
                    parents = new Map();
                    _i = 0, masterPartCategories_1 = master_part_categories_1.masterPartCategories;
                    _b.label = 1;
                case 1:
                    if (!(_i < masterPartCategories_1.length)) return [3 /*break*/, 9];
                    item = masterPartCategories_1[_i];
                    parent_1 = item.parentKey ? parents.get(item.parentKey) : undefined;
                    if (item.parentKey && !parent_1) {
                        report.skipped += 1;
                        console.error("Skipped ".concat(item.slug, ": parent ").concat(item.parentKey, " was not imported."));
                        return [3 /*break*/, 8];
                    }
                    depth = parent_1 ? parent_1.depth + 1 : 1;
                    if (depth > 3) {
                        report.errors += 1;
                        console.error("Skipped ".concat(item.slug, ": category depth exceeds 3."));
                        return [3 /*break*/, 8];
                    }
                    parentId = (_a = parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.id) !== null && _a !== void 0 ? _a : null;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 8]);
                    return [4 /*yield*/, findExistingCategory(parentId, item.slug, item.name)];
                case 3:
                    existing = _b.sent();
                    if (existing) {
                        report.existing += 1;
                        parents.set(item.key, { id: existing.id, depth: depth });
                        return [3 /*break*/, 8];
                    }
                    return [4 /*yield*/, prisma.partCategory.create({
                            data: {
                                name: item.name,
                                slug: item.slug,
                                parentId: parentId,
                                sortOrder: item.sortOrder,
                                isActive: item.isActive,
                            },
                            select: { id: true },
                        })];
                case 4:
                    created = _b.sent();
                    report.created += 1;
                    parents.set(item.key, { id: created.id, depth: depth });
                    return [3 /*break*/, 8];
                case 5:
                    error_1 = _b.sent();
                    if (!(error_1 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                        error_1.code === 'P2002')) return [3 /*break*/, 7];
                    return [4 /*yield*/, findExistingCategory(parentId, item.slug, item.name)];
                case 6:
                    existing = _b.sent();
                    if (existing) {
                        report.existing += 1;
                        parents.set(item.key, { id: existing.id, depth: depth });
                        return [3 /*break*/, 8];
                    }
                    _b.label = 7;
                case 7:
                    report.errors += 1;
                    console.error("Failed to import ".concat(item.slug, ":"), error_1);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9:
                    console.log('Part category import report');
                    console.log("Created: ".concat(report.created));
                    console.log("Already existed: ".concat(report.existing));
                    console.log("Skipped: ".concat(report.skipped));
                    console.log("Errors: ".concat(report.errors));
                    if (report.errors > 0)
                        process.exitCode = 1;
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (error) {
    console.error('Failed to import EV categories.', error);
    process.exitCode = 1;
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
