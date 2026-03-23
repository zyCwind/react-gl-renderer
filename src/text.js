/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import { platform } from './platform.js';

/**
 * 判断字符是否为 CJK 字符
 * @param {string} char - 单个字符
 * @returns {boolean} 是否为 CJK 字符
 */
function isCJK(char) {
    const code = char.charCodeAt(0);
    // CJK Unified Ideographs
    return (code >= 0x4E00 && code <= 0x9FFF) ||
        // CJK Unified Ideographs Extension A
        (code >= 0x3400 && code <= 0x4DBF) ||
        // CJK Compatibility Ideographs
        (code >= 0xF900 && code <= 0xFAFF) ||
        // Japanese Hiragana and Katakana
        (code >= 0x3040 && code <= 0x309F) ||
        (code >= 0x30A0 && code <= 0x30FF) ||
        // Korean Hangul
        (code >= 0xAC00 && code <= 0xD7AF);
}

/**
 * 规范化文本：处理换行符和空白符
 * @param {string} text - 原始文本
 * @param {Object} style - 文字样式
 * @param {string} style.whiteSpace - white-space 值
 * @returns {string[]} 预处理后的行数组
 */
function normalizeText(text, style) {
    const { whiteSpace = 'normal' } = style;
    switch (whiteSpace) {
        case 'pre':
            // 保留所有空白符和换行符，不自动换行
            return text.split('\n');

        case 'pre-wrap':
        case 'break-spaces':
            // 保留所有空白符和换行符，需要后续自动换行
            return text.split('\n');

        case 'pre-line':
            // 合并空白符，保留换行符
            return text.split('\n').map(line => line.replace(/[ \t]+/g, ' ').trim());

        case 'nowrap':
            // 合并空白符，不自动换行
            return [text.replace(/\s+/g, ' ').trim()];

        case 'normal':
        default:
            // 合并空白符，换行符变空格
            return [text.replace(/\s+/g, ' ').trim()];
    }
}

/**
 * 对单行文本进行自动换行
 * @param {string} line - 单行文本
 * @param {Object} style - 文字样式
 * @param {number} style.maxWidth - 最大宽度
 * @param {string} style.wordBreak - 换行规则
 * @param {string} style.whiteSpace - white-space 值
 * @returns {string[]} 分行后的文字数组
 */
function breakLine(line, style) {
    const { maxWidth, wordBreak = 'normal', whiteSpace = 'normal' } = style;
    // 不需要自动换行的情况
    if (!maxWidth || whiteSpace === 'pre' || whiteSpace === 'nowrap') {
        return [line];
    }

    const preserveSpaces = whiteSpace === 'pre-wrap' || whiteSpace === 'break-spaces';
    const lines = [];

    if (wordBreak === 'break-all') {
        // 任意位置换行
        let currentLine = '';
        for (const char of line) {
            const testLine = currentLine + char;
            if (platform.default.measureText(testLine, style) > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
    } else if (wordBreak === 'keep-all') {
        // 不在单词内换行
        let currentLine = '';

        if (preserveSpaces) {
            // pre-wrap: 保留空白符
            const segments = line.split(/(\s+)/);
            for (const segment of segments) {
                if (/^\s+$/.test(segment)) {
                    currentLine += segment;
                    continue;
                }
                const testLine = currentLine + segment;
                if (platform.default.measureText(testLine, style) > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine.trimEnd());
                    currentLine = segment;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
        } else {
            // normal/pre-line: 合并空白符
            const words = line.split(/\s+/).filter(w => w.length > 0);
            for (const word of words) {
                const testLine = currentLine.length > 0 ? currentLine + ' ' + word : word;
                if (platform.default.measureText(testLine, style) > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
        }
    } else {
        // 'normal' - 在单词边界换行，CJK 可在任意位置换行
        let currentLine = '';

        for (const char of line) {
            const testLine = currentLine + char;
            if (platform.default.measureText(testLine, style) > maxWidth && currentLine.length > 0) {
                // CJK 字符可以直接换行
                if (isCJK(char)) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    // 尝试在单词边界换行
                    const lastSpaceIndex = currentLine.lastIndexOf(' ');
                    if (lastSpaceIndex > 0) {
                        lines.push(currentLine.substring(0, lastSpaceIndex));
                        currentLine = currentLine.substring(lastSpaceIndex + 1) + char;
                    } else {
                        // 没有空格，强制换行
                        lines.push(currentLine);
                        currentLine = char;
                    }
                }
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
    }

    return lines;
}

/**
 * 根据 word-break 和 white-space 规则换行
 * @param {string} text - 要换行的文字
 * @param {Object} style - 文字样式
 * @returns {string[]} 分行后的文字数组
 */
function breakLines(text, style) {
    // 先根据 white-space 规范化文本，得到预分割的行
    const normalizedLines = normalizeText(text, style);

    // 对每一行进行自动换行处理
    const result = [];
    for (const line of normalizedLines) {
        const brokenLines = breakLine(line, style);
        result.push(...brokenLines);
    }

    return result;
}

/**
 * 测量文字尺寸
 * @param {string} text - 要测量的文字
 * @param {Object} style - 文字样式
 * @param {number} style.fontSize - 字体大小（像素）
 * @param {string} style.fontFamily - 字体族
 * @param {string} style.fontWeight - 字体粗细
 * @param {number} style.lineHeight - 行高倍数
 * @param {number} style.maxWidth - 最大宽度（可选，用于换行）
 * @param {string} style.wordBreak - 换行规则：'normal' | 'break-all' | 'keep-all'
 * @param {string} style.whiteSpace - 空白处理：'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'
 * @returns {{ width: number, height: number, lines: string[] }}
 */
export function measureText(text, style) {
    const {
        fontSize = 16,
        lineHeight = 1.2
    } = style;

    const lines = breakLines(text, style);

    let maxLineWidth = 0;
    for (const line of lines) {
        const lineWidth = platform.default.measureText(line, style);
        maxLineWidth = Math.max(maxLineWidth, lineWidth);
    }

    const line_height_px = fontSize * lineHeight;
    const height = lines.length * line_height_px;
    const width = Math.ceil(maxLineWidth);

    return { width, height, lines };
}
