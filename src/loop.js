// Copyright (c) 2026 391321232@qq.com
// Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.

import React from 'react';

// 订阅者列表
const subscribers = new Set();

// 帧循环状态
let id = null;
let running = false;

// 帧循环
function loop(time) {
    id = requestAnimationFrame(loop);
    running = true;

    // 调用所有订阅者
    for (const callback of subscribers) {
        callback(time);
    }

    // 无订阅者时停止
    if (subscribers.size === 0) {
        running = false;
        cancelAnimationFrame(id);
        id = null;
    }
}

/**
 * 订阅帧循环
 * @param {Function} callback - 回调函数 (time: number) => void
 * @returns {Function} 取消订阅函数
 */
function subscribe(callback) {
    subscribers.add(callback);

    // 如果循环未运行，启动它
    if (!running) {
        running = true;
        id = requestAnimationFrame(loop);
    }

    // 返回取消订阅函数
    return () => {
        subscribers.delete(callback);
    };
}

/**
 * useFrame hook
 * @param {Function} callback - 回调函数 (time: number) => void
 */
export function useFrame(callback) {
    const ref = React.useRef(callback);
    ref.current = callback;

    React.useEffect(() => {
        return subscribe((time) => ref.current(time));
    }, []);
}
