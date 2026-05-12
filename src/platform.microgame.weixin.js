/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import { loadYoga } from 'yoga-layout/load';
import { platform } from './platform.js';

// 全局 canvas（微信小游戏会自动创建，无需设置尺寸）
export const canvas = wx.createCanvas();

// 离屏 canvas，用于文字测量和绘制
const offscreenCanvas = wx.createCanvas();
const ctx = offscreenCanvas.getContext('2d', {
    willReadFrequently: true
});

// 键盘状态
let currentOnInput = null;
let currentOnBlur = null;

/**
 * 绑定触摸事件
 * @param {Function} handlePointer - 事件处理函数
 */
function bindEvents(handlePointer) {
    // 微信小游戏使用 touch 事件，需要转换为 pointer 事件格式
    wx.onTouchStart(handlePointer('onPointerDown'));
    wx.onTouchMove(handlePointer('onPointerMove'));
    wx.onTouchEnd(handlePointer('onPointerUp'));
    wx.onTouchCancel(handlePointer('onPointerCancel'));

    wx.onKeyboardConfirm((res) => {
        if (currentOnInput) {
            currentOnInput(res.value);
        }
    });
}

/**
 * 从图片 URL 加载图片
 * @param {string} src - 图片 URL
 * @returns {Promise<{ width: number, height: number, src: string }>} 返回加载完成的图片对象
 */
function createImage(src) {
    return new Promise((resolve, reject) => {
        const img = wx.createImage();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.src = src;
    });
}

/**
 * 测量文字尺寸（底层方法，仅测量单行文本宽度）
 * @param {string} text - 要测量的文字
 * @param {Object} style - 文字样式
 * @param {number} style.fontSize - 字体大小（像素）
 * @param {string} style.fontFamily - 字体族
 * @param {string} style.fontWeight - 字体粗细
 * @returns {number} 返回文本宽度（像素）
 */
function measureText(text, style) {
    const {
        fontSize = 16,
        fontFamily = 'sans-serif',
        fontWeight = 'normal'
    } = style;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
}

/**
 * 创建文字贴图数据
 * @param {Object} measureResult - 测量结果 { width, height, lines }
 * @param {Object} style - 文字样式
 * @param {number} style.fontSize - 字体大小（像素）
 * @param {string} style.fontFamily - 字体族
 * @param {string} style.fontWeight - 字体粗细
 * @param {number} style.lineHeight - 行高倍数
 * @param {number[]} style.color - 文字颜色 [r, g, b, a]，范围 0-1
 * @returns {{ width: number, height: number, data: Uint8Array }} 返回贴图数据
 */
async function createTextImage(measureResult, style) {
    const { width, height, lines } = measureResult;
    const {
        fontSize = 16,
        fontFamily = 'sans-serif',
        fontWeight = 'normal',
        lineHeight = 1.2,
        color = [0, 0, 0, 1]
    } = style;

    // 计算 canvas 尺寸
    const canvasWidth = Math.max(1, width);
    const canvasHeight = Math.max(1, height);

    // 设置 canvas 尺寸
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;

    // 清空 canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 设置字体样式
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    // 设置文字颜色（从 [0,1] 转换为 [0,255]）
    const [r, g, b, a] = color;
    ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;

    // 绘制每一行
    const line_height_px = fontSize * lineHeight;
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 0, i * line_height_px);
    }

    // 使用 getImageData 获取像素数据
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    return {
        width: canvasWidth,
        height: canvasHeight,
        data: new Uint8Array(imageData.data.buffer)
    };
}

/**
 * 显示键盘
 * @param {Object} options
 * @param {string} options.defaultValue - 默认值
 * @param {number} options.maxLength - 最大长度
 * @param {boolean} options.multiple - 是否允许多行，默认 false
 * @param {Function} options.onInput - 输入回调 (value) => void
 * @param {Function} options.onBlur - 失焦回调 () => void
 */
function showKeyboard(options = {}) {
    const {
        defaultValue = '',
        maxLength,
        multiple = false,
        onInput,
        onBlur
    } = options;

    // 触发上一个组件的失焦回调（仅当焦点切换到不同组件时）
    if (currentOnBlur && currentOnBlur !== onBlur) {
        currentOnBlur();
    }

    currentOnInput = onInput;
    currentOnBlur = onBlur;

    wx.showKeyboard({
        defaultValue,
        maxLength,
        multiple,
        confirmHold: false,
        confirmType: 'done'
    });
}

/**
 * 隐藏键盘
 */
function hideKeyboard() {
    wx.hideKeyboard();
    currentOnInput = null;
    if (currentOnBlur) {
        currentOnBlur();
        currentOnBlur = null;
    }
}

platform.default = {
    bindEvents,
    createImage,
    createTextImage,
    hideKeyboard,
    loadYoga: function () {
        globalThis.WebAssembly = Object.assign({}, WXWebAssembly, {
            instantiate: function (bytes, importObject) {
                return WXWebAssembly.instantiate('./yoga.wasm', importObject);
            }
        });
        return loadYoga();
    },
    measureText,
    showKeyboard
};
