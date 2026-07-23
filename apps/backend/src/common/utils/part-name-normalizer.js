"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePartName = normalizePartName;
exports.getPartNameTokens = getPartNameTokens;
exports.getPartNameSearchTokens = getPartNameSearchTokens;
var abbreviationMap = {
    перед: 'передний',
    зад: 'задний',
    лев: 'левый',
    прав: 'правый',
    компл: 'комплект',
};
function normalizePartName(input) {
    var cleaned = input
        .normalize('NFKC')
        .trim()
        .toLocaleLowerCase('ru-RU')
        .replace(/ё/g, 'е')
        .replace(/[‐‑‒–—―−-]+/g, ' ')
        .replace(/[.,;:!?()[\]{}'"«»„“”]+/g, ' ')
        .replace(/[\\/|_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned)
        return '';
    return cleaned
        .split(' ')
        .map(function (token) { var _a; return (_a = abbreviationMap[token]) !== null && _a !== void 0 ? _a : token; })
        .join(' ');
}
function getPartNameTokens(input) {
    return __spreadArray([], new Set(normalizePartName(input).split(' ').filter(Boolean)), true).sort(function (left, right) { return left.localeCompare(right, 'ru'); });
}
function getPartNameSearchTokens(input) {
    return getPartNameTokens(input).join(' ');
}
