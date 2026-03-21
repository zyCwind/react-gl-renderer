// Copyright (c) 2026 391321232@qq.com
// Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.

import { platform } from './platform.js';

let isMultiple = false;
const textarea = document.createElement('textarea');
textarea.id = 'keyboard';
textarea.style.cssText = 'position: absolute; z-index: -1; opacity: 0;';
// input 事件
textarea.addEventListener('input', (e) => {
    currentOnInput?.(e.target.value);
});

// keydown 事件：单行时 enter 阻止换行
textarea.addEventListener('keydown', (e) => {
    if (!isMultiple && e.key === 'Enter') {
        e.preventDefault();
    }
});

export const canvas = document.createElement('canvas');
canvas.width = 550;
canvas.height = 400;

// 创建一个包含 textarea 和 canvas 的容器结构，并添加到 div#root 中
const rootContainer = document.getElementById('root');

const container = document.createElement('div');
container.style.position = 'relative';

container.appendChild(textarea);
container.appendChild(canvas);
rootContainer.appendChild(container);

function bindEvents(handlePointer) {
    // 初始化事件系统
    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault(); // 阻止默认行为，防止 canvas 获得焦点

        canvas.setPointerCapture(e.pointerId);
        handlePointer('onPointerDown')(e);
    });
    canvas.addEventListener('pointermove', handlePointer('onPointerMove'));
    canvas.addEventListener('pointerup', handlePointer('onPointerUp'));
    canvas.addEventListener('pointercancel', handlePointer('onPointerCancel'));
}

/**
 * 从图片 URL 加载图片
 * @param {string} src - 图片 URL
 * @returns {Promise<HTMLImageElement>} 返回加载完成的图片元素
 */
function createImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
}

// 单例 canvas，用于图片像素提取
const offscreenCanvas = document.createElement('canvas');
const ctx = offscreenCanvas.getContext('2d', {
    willReadFrequently: true
});

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

// 当前回调
let currentOnInput = null;
let currentOnBlur = null;

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

    isMultiple = multiple;

    if (maxLength) {
        textarea.maxLength = maxLength;
    }
    textarea.value = defaultValue;
    currentOnInput = onInput;
    currentOnBlur = onBlur;
    textarea.focus();
}

/**
 * 隐藏键盘
 */
function hideKeyboard() {
    textarea.blur();
    currentOnInput = null;
    if (currentOnBlur) {
        currentOnBlur();
    }
    currentOnBlur = null;
    isMultiple = false;
}

platform.default = {
    bindEvents,
    createImage,
    createTextImage,
    hideKeyboard,
    measureText,
    showKeyboard
};
