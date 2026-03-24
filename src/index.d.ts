/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import { ReactNode } from 'react';
import { WebGLRenderer, WebGLRenderTarget } from 'three';

/** RGBA 颜色，取值范围 [0, 1] */
export type Color = [r: number, g: number, b: number, a: number];

/** 圆角半径 [水平半径, 垂直半径] */
export type BorderRadius = [horizontal: number, vertical: number];

/** 尺寸值，支持数字、百分比字符串、auto */
export type Dimension = number | 'auto' | `${number}%`;

export interface ViewStyle {
    // ===== 布局属性（按 VIEW_PROPS 顺序）=====

    // alignContent - CSS 默认值: stretch
    alignContent?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';

    // alignItems - CSS 默认值: stretch
    alignItems?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';

    // alignSelf - CSS 默认值: auto
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

    // aspectRatio
    aspectRatio?: number;

    // borderBottomWidth - CSS 默认值: 0
    borderBottomWidth?: number;

    // borderLeftWidth - CSS 默认值: 0
    borderLeftWidth?: number;

    // borderRightWidth - CSS 默认值: 0
    borderRightWidth?: number;

    // borderTopWidth - CSS 默认值: 0
    borderTopWidth?: number;

    // bottom - CSS 默认值: auto
    bottom?: Dimension;

    // boxSizing - CSS 默认值: content-box
    boxSizing?: 'content-box' | 'border-box';

    // columnGap - CSS 默认值: normal (flexbox 中为 0)
    columnGap?: number;

    // direction - CSS 默认值: inherit
    direction?: 'inherit' | 'ltr' | 'rtl';

    // display - CSS 默认值: block (本项目默认 flex)
    display?: 'flex' | 'none' | 'contents';

    // flex
    flex?: number;

    // flexBasis - CSS 默认值: auto
    flexBasis?: Dimension;

    // flexDirection - CSS 默认值: row
    flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';

    // flexGrow - CSS 默认值: 0
    flexGrow?: number;

    // flexShrink - CSS 默认值: 1
    flexShrink?: number;

    // flexWrap - CSS 默认值: nowrap
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';

    // height - CSS 默认值: auto
    height?: Dimension;

    // isReferenceBaseline
    isReferenceBaseline?: boolean;

    // justifyContent - CSS 默认值: flex-start
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';

    // left - CSS 默认值: auto
    left?: Dimension;

    // marginBottom - CSS 默认值: 0
    marginBottom?: number;

    // marginLeft - CSS 默认值: 0
    marginLeft?: number;

    // marginRight - CSS 默认值: 0
    marginRight?: number;

    // marginTop - CSS 默认值: 0
    marginTop?: number;

    // maxHeight - CSS 默认值: none
    maxHeight?: Dimension;

    // maxWidth - CSS 默认值: none
    maxWidth?: Dimension;

    // minHeight - CSS 默认值: auto
    minHeight?: Dimension;

    // minWidth - CSS 默认值: auto
    minWidth?: Dimension;

    // overflow - CSS 默认值: visible
    overflow?: 'visible' | 'hidden' | 'scroll';

    // paddingBottom - CSS 默认值: 0
    paddingBottom?: number;

    // paddingLeft - CSS 默认值: 0
    paddingLeft?: number;

    // paddingRight - CSS 默认值: 0
    paddingRight?: number;

    // paddingTop - CSS 默认值: 0
    paddingTop?: number;

    // position - CSS 默认值: static (本项目默认 relative)
    position?: 'static' | 'relative' | 'absolute';

    // right - CSS 默认值: auto
    right?: Dimension;

    // rowGap - CSS 默认值: normal (flexbox 中为 0)
    rowGap?: number;

    // top - CSS 默认值: auto
    top?: Dimension;

    // width - CSS 默认值: auto
    width?: Dimension;

    // ===== 内容属性（按 VIEW_PROPS 顺序）=====

    // backgroundColor - CSS 默认值: transparent
    backgroundColor?: Color;

    // backgroundImage
    backgroundImage?: string;

    // backgroundRepeatX
    backgroundRepeatX?: 'repeat' | 'no-repeat';

    // backgroundRepeatY
    backgroundRepeatY?: 'repeat' | 'no-repeat';

    // backgroundSize
    backgroundSize?: [widthRatio: number, heightRatio: number];

    // background9Patch
    background9Patch?: [left: number, right: number, top: number, bottom: number];

    // background9PatchSize
    background9PatchSize?: [scaleX: number, scaleY: number];

    // borderColor - CSS 默认值: currentColor
    borderColor?: Color;

    // borderTopLeftRadius - CSS 默认值: 0
    borderTopLeftRadius?: BorderRadius;

    // borderTopRightRadius - CSS 默认值: 0
    borderTopRightRadius?: BorderRadius;

    // borderBottomRightRadius - CSS 默认值: 0
    borderBottomRightRadius?: BorderRadius;

    // borderBottomLeftRadius - CSS 默认值: 0
    borderBottomLeftRadius?: BorderRadius;
}

export interface TextStyle extends ViewStyle {
    // color - CSS 默认值: black
    color?: Color;

    // fontSize - CSS 默认值: 16px
    fontSize?: number;

    // fontFamily - CSS 默认值: sans-serif
    fontFamily?: string;

    // fontWeight - CSS 默认值: normal
    fontWeight?: 'normal' | 'bold' | number;

    // lineHeight - CSS 默认值: normal
    lineHeight?: number;

    // wordBreak - CSS 默认值: normal
    wordBreak?: 'normal' | 'break-all' | 'keep-all';

    // whiteSpace - CSS 默认值: normal
    whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces';

    // text
    text?: string;
}

export interface PointerEvent {
    clientX: number;
    clientY: number;
    identifier: number;
    target: unknown;
    currentTarget: unknown;
    isPropagationStopped: boolean;
    stopPropagation(): void;
    setPointerCapture(identifier: number): void;
    releasePointerCapture(identifier: number): void;
}

/** 布局信息 */
export interface Layout {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ViewProps {
    children?: ReactNode;
    style?: ViewStyle;
    onLayout?: (layout: Layout) => void;
    onPointerDown?: (event: PointerEvent) => void;
    onPointerDownCapture?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
    onPointerMoveCapture?: (event: PointerEvent) => void;
    onPointerUp?: (event: PointerEvent) => void;
    onPointerUpCapture?: (event: PointerEvent) => void;
    onPointerCancel?: (event: PointerEvent) => void;
    onPointerCancelCapture?: (event: PointerEvent) => void;
}

export interface TextProps {
    children?: string;
    style?: TextStyle;
    onMeasureResult?: (result: { width: number; height: number; lines: string[] }) => void;
}

export interface TextInputProps {
    style?: TextStyle;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    placeholderColor?: Color;
    maxLength?: number;
    multiple?: boolean;
    type?: 'password';
}

export function View(props: ViewProps): JSX.Element;
export function Text(props: TextProps): JSX.Element;
export function TextInput(props: TextInputProps): JSX.Element;

export interface Root {
    render(element: ReactNode): void;
    handlePointer(name: string): (event: globalThis.PointerEvent) => void;
}

/** 圆角矩形渲染数据 */
export interface RoundedRect {
    x: number;
    y: number;
    width: number;
    height: number;
    borderTopLeftRadius: BorderRadius;
    borderTopRightRadius: BorderRadius;
    borderBottomRightRadius: BorderRadius;
    borderBottomLeftRadius: BorderRadius;
    backgroundColor: Color;
    borderLeftWidth: number;
    borderTopWidth: number;
    borderRightWidth: number;
    borderBottomWidth: number;
    borderColor: Color;
    paddingLeft: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
}

/** 裁剪区域 */
export interface ClipRegion {
    paddingBoxRegion: {
        x: number;
        y: number;
        width: number;
        height: number;
        radii: [BorderRadius, BorderRadius, BorderRadius, BorderRadius];
    };
    aabbs: {
        outerAABB: { minX: number; minY: number; maxX: number; maxY: number };
        innerAABB: { minX: number; minY: number; maxX: number; maxY: number };
    };
}

/** 渲染批次 */
export interface RenderBatch {
    roundedRects: RoundedRect[];
    clipRoundedRects: ClipRegion[];
    backgroundImage?: string;
    backgroundRepeatX: boolean;
    backgroundRepeatY: boolean;
    backgroundSize?: [number, number];
    background9Patch?: [number, number, number, number];
    background9PatchSize?: [number, number];
}

export interface Renderer {
    canvas: {
        width: number;
        height: number;
    };
    clear(r?: number, g?: number, b?: number, a?: number): void;
    render(options: RenderBatch): void;
}

/** WebGL 渲染器 */
export declare class GLRenderer implements Renderer {
    constructor(canvas: HTMLCanvasElement);
    canvas: HTMLCanvasElement;
    clear(r?: number, g?: number, b?: number, a?: number): void;
    render(options: RenderBatch): void;
}

/** Three.js 渲染器适配 */
export declare class GLRenderer3D implements Renderer {
    constructor(renderer: WebGLRenderer);
    canvas: HTMLCanvasElement;
    /** 离屏渲染目标，UI 渲染到此 RenderTarget */
    renderTarget: WebGLRenderTarget;
    clear(r?: number, g?: number, b?: number, a?: number): void;
    render(options: RenderBatch): void;
}

export function createRoot(renderer: Renderer): Root;

/** 帧回调函数类型 */
export type FrameCallback = (time: number) => void;

/**
 * 订阅帧循环的 hook
 * @param callback - 每帧调用的回调函数，接收 timestamp 参数
 */
export function useFrame(callback: FrameCallback): void;
