"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePartNumber = normalizePartNumber;
function normalizePartNumber(input) {
    return input
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}
