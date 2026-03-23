/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import { platform } from './platform.js';

// 资源存储
const resources = {};

// 资源 id 生成器
let resourceIdCounter = 0;

/**
 * 获取资源数据
 * @param {string} id - 资源 id
 * @returns {HTMLImageElement | { width: number, height: number, data: Uint8Array } | null}
 */
export function getImageData(id) {
    return resources[id] || null;
}

/**
 * 删除资源数据
 * @param {string} id - 资源 id
 */
export function deleteImageData(id) {
    delete resources[id];
}

/**
 * 从图片 URL 加载图片，返回资源 id
 * @param {string} src - 图片 URL
 * @returns {Promise<string>} 返回资源 id
 */
export function createImage(src) {
    return platform.default.createImage(src).then(img => {
        const id = `img_${resourceIdCounter++}`;
        resources[id] = img;
        return id;
    });
}

/**
 * 创建文字贴图数据，返回资源 id
 * @param {Object} measureResult - 测量结果 { width, height, lines }
 * @param {Object} style - 文字样式
 * @param {number} style.fontSize - 字体大小（像素）
 * @param {string} style.fontFamily - 字体族
 * @param {string} style.fontWeight - 字体粗细
 * @param {number} style.lineHeight - 行高倍数
 * @param {number[]} style.color - 文字颜色 [r, g, b, a]，范围 0-1
 * @returns {Promise<string>} 返回资源 id
 */
export function createTextImage(measureResult, style) {
    return platform.default.createTextImage(measureResult, style).then(img => {
        const id = `img_${resourceIdCounter++}`;
        resources[id] = img;
        return id;
    });
}
