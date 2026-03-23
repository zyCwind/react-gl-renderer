/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import { useCallback, useEffect, useState } from 'react';
import { createImage, createTextImage } from './assets.js';
import { platform } from './platform.js';

// 封装 View 组件
// - style: 样式相关属性，传递给底层 view
// - backgroundImage: 字符串 URL，自动加载图片并转换为纹理数据
// - onLayout: 布局完成回调
export function View({ children, style, onLayout }) {
    const [backgroundImage, setBackgroundImage] = useState(null);

    useEffect(() => {
        const src = style?.backgroundImage;
        if (!src) {
            setBackgroundImage(null);
            return;
        }
        createImage(src).then(setBackgroundImage);
    }, [style?.backgroundImage]);

    return <view {...style} backgroundImage={backgroundImage} onLayout={onLayout}>{children}</view>;
}

// 封装 Text 组件
// - children: 文字内容
// - style: 文字样式属性，传递给底层 text
// - 文字独有属性：fontSize, fontFamily, fontWeight, lineHeight, color, wordBreak, whiteSpace
export function Text({ children, style }) {
    const [backgroundImage, setBackgroundImage] = useState(null);

    return (
        <View style={style}>
            <View style={{
                alignItems: 'flex-start'
            }}>
                <text
                    text={children}
                    fontSize={style?.fontSize}
                    fontFamily={style?.fontFamily}
                    fontWeight={style?.fontWeight}
                    lineHeight={style?.lineHeight}
                    wordBreak={style?.wordBreak}
                    whiteSpace={style?.whiteSpace}
                    color={style?.color}
                    backgroundImage={backgroundImage}
                    onMeasureResult={(result) => {
                        createTextImage(result, style || {}).then(setBackgroundImage);
                    }}
                />
            </View>
        </View>
    );
}

// 封装 TextInput 组件
export function TextInput({ style, value, onChange, placeholder, placeholderColor, maxLength, multiple, type }) {
    const [contentBox, setContentBox] = useState(null);
    const [focused, setFocused] = useState(false);

    // 稳定的 onBlur 回调引用，用于 keyboard.js 判断是否同一组件
    const onBlur = useCallback(() => setFocused(false), []);

    // 从 style 获取 border 和 padding 值
    const borderLeftWidth = style?.borderLeftWidth ?? 0;
    const borderRightWidth = style?.borderRightWidth ?? 0;
    const borderTopWidth = style?.borderTopWidth ?? 0;
    const borderBottomWidth = style?.borderBottomWidth ?? 0;
    const paddingLeft = style?.paddingLeft ?? 0;
    const paddingRight = style?.paddingRight ?? 0;
    const paddingTop = style?.paddingTop ?? 0;
    const paddingBottom = style?.paddingBottom ?? 0;

    return (
        <View
            style={style}
            onLayout={(layout) => {
                setContentBox({ width: layout.width - borderLeftWidth - borderRightWidth - paddingLeft - paddingRight, height: layout.height - borderTopWidth - borderBottomWidth - paddingTop - paddingBottom });
            }}
            onPointerDown={() => {
                setFocused(true);
                platform.default.showKeyboard({
                    defaultValue: value,
                    maxLength,
                    multiple,
                    onInput: onChange,
                    onBlur: onBlur
                });
            }}
        >
            {contentBox && (
                <View
                    style={{
                        width: contentBox.width,
                        height: contentBox.height,
                        overflow: 'hidden'
                    }}
                >
                    <Text
                        style={{
                            minWidth: contentBox.width,
                            minHeight: contentBox.height,
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            color: value ? style?.color : placeholderColor,
                            fontSize: style?.fontSize,
                            fontFamily: style?.fontFamily,
                            fontWeight: style?.fontWeight,
                            lineHeight: style?.lineHeight,
                            whiteSpace: multiple ? 'pre-wrap' : 'nowrap'
                        }}
                    >
                        {`${type === 'password' && value ? '•'.repeat(value.length) : (value || placeholder)}${focused && value ? '_' : ''}`}
                    </Text>
                    {focused && !value && (
                        <Text
                            style={{
                                position: 'absolute',
                                color: style?.color,
                                fontSize: style?.fontSize,
                                fontFamily: style?.fontFamily,
                                fontWeight: style?.fontWeight,
                                lineHeight: style?.lineHeight
                            }}
                        >_</Text>
                    )}
                </View>
            )}
        </View>
    );
}
