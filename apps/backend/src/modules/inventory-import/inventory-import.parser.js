"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeHeader = normalizeHeader;
exports.suggestColumnMapping = suggestColumnMapping;
exports.sanitizeFileName = sanitizeFileName;
exports.assertImportFile = assertImportFile;
exports.parseExcelFile = parseExcelFile;
exports.resolveColumnMapping = resolveColumnMapping;
exports.normalizePriceValue = normalizePriceValue;
exports.normalizeQuantityValue = normalizeQuantityValue;
exports.normalizeImportRow = normalizeImportRow;
var XLSX = require("xlsx");
var part_name_normalizer_1 = require("../../common/utils/part-name-normalizer");
var part_number_normalizer_1 = require("../../common/utils/part-number-normalizer");
var COLUMN_ALIASES = {
    category: [
        'категория',
        'категориятовара',
        'категориядетали',
        'category',
        'partcategory',
    ],
    subcategory: [
        'подкатегория',
        'подкатегориятовара',
        'подкатегориядетали',
        'subcategory',
    ],
    partNumber: [
        'oem',
        'артикул',
        'код',
        'коддетали',
        'номердетали',
        'partnumber',
        'sku',
        'article',
        'catalognumber',
        'номенклатурныйкод',
    ],
    name: [
        'наименование',
        'название',
        'товар',
        'деталь',
        'description',
        'product',
        'productname',
        'name',
        'item',
    ],
    price: [
        'цена',
        'стоимость',
        'розничнаяцена',
        'продажнаяцена',
        'price',
        'cost',
        'saleprice',
    ],
    quantity: [
        'остаток',
        'количество',
        'колво',
        'наличие',
        'quantity',
        'qty',
        'stock',
        'balance',
    ],
};
var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
var MAX_ROWS = 10000;
function cellText(value) {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    if (value instanceof Date)
        return value.toISOString();
    return '';
}
function normalizeHeader(value) {
    return cellText(value)
        .trim()
        .toLowerCase()
        .replace(/[＊*]/g, '')
        .replace(/[\s_./\\-]+/g, '')
        .replace(/ё/g, 'е');
}
function suggestColumnMapping(columns) {
    var mapping = {};
    var used = new Set();
    for (var _i = 0, _a = [
        'category',
        'subcategory',
        'partNumber',
        'name',
        'price',
        'quantity',
    ]; _i < _a.length; _i++) {
        var field = _a[_i];
        for (var _b = 0, columns_1 = columns; _b < columns_1.length; _b++) {
            var column = columns_1[_b];
            if (used.has(column))
                continue;
            var key = normalizeHeader(column);
            if (COLUMN_ALIASES[field].includes(key)) {
                mapping[field] = column;
                used.add(column);
                break;
            }
        }
    }
    return mapping;
}
function sanitizeFileName(name) {
    var _a;
    var base = (_a = name.split(/[/\\]/).pop()) !== null && _a !== void 0 ? _a : 'import.xlsx';
    return base.replace(/[^\w.\-()\s\u0400-\u04FF]+/g, '_').slice(0, 200);
}
function assertImportFile(file) {
    var _a;
    if (!((_a = file === null || file === void 0 ? void 0 : file.buffer) === null || _a === void 0 ? void 0 : _a.length)) {
        throw new Error('FILE_MISSING');
    }
    if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
        throw new Error('FILE_TOO_LARGE');
    }
    if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
        throw new Error('FILE_TYPE_INVALID');
    }
}
function parseExcelFile(file) {
    var _a, _b;
    assertImportFile(file);
    var workbook;
    try {
        workbook = XLSX.read(file.buffer, {
            type: 'buffer',
            cellFormula: false,
            cellDates: true,
            codepage: 65001,
        });
    }
    catch (_c) {
        throw new Error('FILE_READ_FAILED');
    }
    var worksheetName = workbook.SheetNames[0];
    if (!worksheetName)
        throw new Error('WORKBOOK_EMPTY');
    var sheet = workbook.Sheets[worksheetName];
    var matrix = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
    });
    if (matrix.length < 2)
        throw new Error('NO_DATA_ROWS');
    var headerRowIndex = detectHeaderRowIndex(matrix);
    var headerRow = (_a = matrix[headerRowIndex]) !== null && _a !== void 0 ? _a : [];
    var columns = headerRow
        .map(function (cell, index) {
        var label = cellText(cell).trim();
        return label || "column_".concat(index + 1);
    })
        .filter(function (column, index, all) {
        var hasHeader = cellText(headerRow[index]).trim().length > 0;
        var hasData = matrix
            .slice(headerRowIndex + 1)
            .some(function (row) { return cellText(row[index]).trim().length > 0; });
        return hasHeader || hasData;
    });
    var rows = [];
    var _loop_1 = function (index) {
        var rawRow = (_b = matrix[index]) !== null && _b !== void 0 ? _b : [];
        if (rawRow.every(function (cell) { return !cellText(cell).trim(); }))
            return "continue";
        if (rows.length >= MAX_ROWS)
            return "break";
        var source = {};
        columns.forEach(function (column, columnIndex) {
            source[column] = cellText(rawRow[columnIndex]).trim();
        });
        rows.push({ rowNumber: index + 1, source: source });
    };
    for (var index = headerRowIndex + 1; index < matrix.length; index += 1) {
        var state_1 = _loop_1(index);
        if (state_1 === "break")
            break;
    }
    if (rows.length === 0)
        throw new Error('NO_USABLE_ROWS');
    return {
        fileName: sanitizeFileName(file.originalname),
        worksheetName: worksheetName,
        columns: columns,
        rows: rows,
    };
}
function detectHeaderRowIndex(matrix) {
    var _a;
    for (var index = 0; index < Math.min(matrix.length, 5); index += 1) {
        var row = (_a = matrix[index]) !== null && _a !== void 0 ? _a : [];
        var filled = row.filter(function (cell) { return cellText(cell).trim(); }).length;
        if (filled >= 2)
            return index;
    }
    return 0;
}
function resolveColumnMapping(columns, input) {
    var _a, _b, _c, _d, _e, _f;
    var suggested = suggestColumnMapping(columns);
    var mapping = {
        categoryColumn: ((_a = input === null || input === void 0 ? void 0 : input.categoryColumn) === null || _a === void 0 ? void 0 : _a.trim()) ||
            suggested.category ||
            '',
        subcategoryColumn: ((_b = input === null || input === void 0 ? void 0 : input.subcategoryColumn) === null || _b === void 0 ? void 0 : _b.trim()) ||
            suggested.subcategory ||
            null,
        partNumberColumn: ((_c = input === null || input === void 0 ? void 0 : input.partNumberColumn) === null || _c === void 0 ? void 0 : _c.trim()) ||
            suggested.partNumber ||
            null,
        nameColumn: ((_d = input === null || input === void 0 ? void 0 : input.nameColumn) === null || _d === void 0 ? void 0 : _d.trim()) ||
            suggested.name ||
            '',
        priceColumn: ((_e = input === null || input === void 0 ? void 0 : input.priceColumn) === null || _e === void 0 ? void 0 : _e.trim()) ||
            suggested.price ||
            '',
        quantityColumn: ((_f = input === null || input === void 0 ? void 0 : input.quantityColumn) === null || _f === void 0 ? void 0 : _f.trim()) ||
            suggested.quantity ||
            '',
    };
    var errors = [];
    if (!mapping.categoryColumn) {
        errors.push('Не выбрана колонка с категорией');
    }
    if (!mapping.nameColumn) {
        errors.push('Не выбрана колонка с наименованием');
    }
    if (!mapping.priceColumn) {
        errors.push('Не выбрана колонка с ценой');
    }
    if (!mapping.quantityColumn) {
        errors.push('Не выбрана колонка с количеством');
    }
    if (!mapping.partNumberColumn && !mapping.nameColumn) {
        errors.push('Укажите колонку с артикулом или наименованием');
    }
    for (var _i = 0, _g = Object.entries(mapping); _i < _g.length; _i++) {
        var _h = _g[_i], field = _h[0], column = _h[1];
        if (!column)
            continue;
        if (!columns.includes(column)) {
            errors.push("\u041A\u043E\u043B\u043E\u043D\u043A\u0430 \u00AB".concat(column, "\u00BB \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0432 \u0444\u0430\u0439\u043B\u0435 (").concat(field, ")"));
        }
    }
    return { mapping: mapping, errors: errors };
}
function normalizePriceValue(value) {
    if (value === undefined || value === null || cellText(value) === '') {
        return { price: null, error: 'Не указана цена' };
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (value < 0) {
            return { price: null, error: 'Цена должна быть не меньше 0' };
        }
        return { price: roundMoney(value) };
    }
    var text = cellText(value).toLowerCase();
    text = text.replace(/\s*(сом|tjs|руб|rub)\b/gi, '').trim();
    text = text.replace(/\s+/g, '');
    if (text.includes(',') && text.includes('.')) {
        text = text.replace(/\./g, '').replace(',', '.');
    }
    else {
        text = text.replace(',', '.');
    }
    var parsed = Number(text);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return { price: null, error: 'Некорректная цена' };
    }
    return { price: roundMoney(parsed) };
}
function normalizeQuantityValue(value) {
    if (value === undefined || value === null || cellText(value) === '') {
        return { quantity: 0 };
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        var rounded_1 = Math.trunc(value);
        if (rounded_1 < 0) {
            return { quantity: 0, error: 'Количество не может быть отрицательным' };
        }
        return { quantity: rounded_1 };
    }
    var text = cellText(value).replace(/\s+/g, '').replace(',', '.');
    var parsed = Number(text);
    if (!Number.isFinite(parsed)) {
        return { quantity: 0, error: 'Некорректное количество' };
    }
    var rounded = Math.trunc(parsed);
    if (rounded < 0) {
        return { quantity: 0, error: 'Количество не может быть отрицательным' };
    }
    return { quantity: rounded };
}
function normalizeImportRow(source, mapping) {
    var _a, _b, _c, _d;
    var categoryName = mapping.categoryColumn
        ? ((_a = source[mapping.categoryColumn]) === null || _a === void 0 ? void 0 : _a.trim()) || null
        : null;
    var subcategoryName = mapping.subcategoryColumn
        ? ((_b = source[mapping.subcategoryColumn]) === null || _b === void 0 ? void 0 : _b.trim()) || null
        : null;
    var rawPartNumber = mapping.partNumberColumn
        ? ((_c = source[mapping.partNumberColumn]) === null || _c === void 0 ? void 0 : _c.trim()) || null
        : null;
    var rawName = mapping.nameColumn
        ? ((_d = source[mapping.nameColumn]) === null || _d === void 0 ? void 0 : _d.trim()) || null
        : null;
    var rawPrice = mapping.priceColumn
        ? source[mapping.priceColumn]
        : undefined;
    var rawQuantity = mapping.quantityColumn
        ? source[mapping.quantityColumn]
        : undefined;
    var errors = [];
    if (!categoryName) {
        errors.push('Не указана категория');
    }
    if (!rawName) {
        errors.push('Не указано наименование');
    }
    var partNumber = rawPartNumber
        ? (0, part_number_normalizer_1.normalizePartNumber)(rawPartNumber) || null
        : null;
    var name = rawName
        ? (0, part_name_normalizer_1.normalizePartName)(rawName) || null
        : null;
    if (!partNumber && !name) {
        errors.push('Укажите артикул или наименование');
    }
    var priceResult = normalizePriceValue(rawPrice);
    if (priceResult.error) {
        errors.push(priceResult.error);
    }
    var quantityResult = normalizeQuantityValue(rawQuantity);
    if (quantityResult.error) {
        errors.push(quantityResult.error);
    }
    return {
        normalized: {
            categoryName: categoryName,
            normalizedCategoryName: categoryName
                ? (0, part_name_normalizer_1.normalizePartName)(categoryName) || null
                : null,
            subcategoryName: subcategoryName,
            normalizedSubcategoryName: subcategoryName
                ? (0, part_name_normalizer_1.normalizePartName)(subcategoryName) || null
                : null,
            partNumber: partNumber,
            rawPartNumber: rawPartNumber,
            name: name,
            rawName: rawName,
            price: priceResult.price,
            quantity: quantityResult.quantity,
        },
        errors: errors,
    };
}
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
