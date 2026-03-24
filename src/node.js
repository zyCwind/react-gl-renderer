/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import { platform } from './platform.js';
import { measureText } from './text.js';

const Yoga = await platform.default.loadYoga();

// Yoga 的行为：
//  1. 输入时可以设置 box-sizing：content-box 或 border-box
//  2. 输出时 getComputedLayout() 始终返回 border-box 的尺寸和位置
export class Node {
    constructor(options = {}) {
        this.yogaNode = Yoga.Node.create();

        // alignContent - CSS 默认值: stretch
        this.alignContent = options.alignContent ?? 'stretch';

        // alignItems - CSS 默认值: stretch
        this.alignItems = options.alignItems ?? 'stretch';

        // alignSelf - CSS 默认值: auto
        this.alignSelf = options.alignSelf ?? 'auto';

        // aspectRatio - 无 CSS 默认值
        this.aspectRatio = options.aspectRatio ?? null;

        // borderBottomWidth - CSS 默认值: 0
        this.borderBottomWidth = options.borderBottomWidth ?? 0;

        // borderLeftWidth - CSS 默认值: 0
        this.borderLeftWidth = options.borderLeftWidth ?? 0;

        // borderRightWidth - CSS 默认值: 0
        this.borderRightWidth = options.borderRightWidth ?? 0;

        // borderTopWidth - CSS 默认值: 0
        this.borderTopWidth = options.borderTopWidth ?? 0;

        // bottom - CSS 默认值: auto
        this.bottom = options.bottom ?? null;

        // boxSizing - CSS 默认值: content-box
        this.boxSizing = options.boxSizing ?? 'content-box';

        // columnGap - CSS 默认值: normal (flexbox 中为 0)
        this.columnGap = options.columnGap ?? 0;

        // direction - CSS 默认值: inherit
        this.direction = options.direction ?? 'inherit';

        // display - CSS 默认值: block (本项目默认 flex)
        this.display = options.display ?? 'flex';

        // flex - CSS 默认值: 无
        this.flex = options.flex ?? null;

        // flexBasis - CSS 默认值: auto
        this.flexBasis = options.flexBasis ?? 'auto';

        // flexDirection - CSS 默认值: row
        this.flexDirection = options.flexDirection ?? 'row';

        // flexGrow - CSS 默认值: 0
        this.flexGrow = options.flexGrow ?? 0;

        // flexShrink - CSS 默认值: 1
        this.flexShrink = options.flexShrink ?? 1;

        // flexWrap - CSS 默认值: nowrap
        this.flexWrap = options.flexWrap ?? 'nowrap';

        // height - CSS 默认值: auto
        this.height = options.height ?? 'auto';

        // isReferenceBaseline - 无 CSS 默认值
        this.isReferenceBaseline = options.isReferenceBaseline ?? false;

        // justifyContent - CSS 默认值: flex-start
        this.justifyContent = options.justifyContent ?? 'flex-start';

        // left - CSS 默认值: auto
        this.left = options.left ?? null;

        // marginBottom - CSS 默认值: 0
        this.marginBottom = options.marginBottom ?? 0;

        // marginLeft - CSS 默认值: 0
        this.marginLeft = options.marginLeft ?? 0;

        // marginRight - CSS 默认值: 0
        this.marginRight = options.marginRight ?? 0;

        // marginTop - CSS 默认值: 0
        this.marginTop = options.marginTop ?? 0;

        // maxHeight - CSS 默认值: none
        this.maxHeight = options.maxHeight ?? null;

        // maxWidth - CSS 默认值: none
        this.maxWidth = options.maxWidth ?? null;

        // minHeight - CSS 默认值: auto
        this.minHeight = options.minHeight ?? null;

        // minWidth - CSS 默认值: auto
        this.minWidth = options.minWidth ?? null;

        // overflow - CSS 默认值: visible
        this.overflow = options.overflow ?? 'visible';

        // paddingBottom - CSS 默认值: 0
        this.paddingBottom = options.paddingBottom ?? 0;

        // paddingLeft - CSS 默认值: 0
        this.paddingLeft = options.paddingLeft ?? 0;

        // paddingRight - CSS 默认值: 0
        this.paddingRight = options.paddingRight ?? 0;

        // paddingTop - CSS 默认值: 0
        this.paddingTop = options.paddingTop ?? 0;

        // position - CSS 默认值: relative
        this.position = options.position ?? 'relative';

        // right - CSS 默认值: auto
        this.right = options.right ?? null;

        // rowGap - CSS 默认值: normal (flexbox 中为 0)
        this.rowGap = options.rowGap ?? 0;

        // top - CSS 默认值: auto
        this.top = options.top ?? null;

        // width - CSS 默认值: auto
        this.width = options.width ?? 'auto';

        // ===== 内容属性（按 VIEW_PROPS 顺序）=====

        // backgroundColor - CSS 默认值: transparent
        this.backgroundColor = options.backgroundColor ?? [0, 0, 0, 0];

        // backgroundImage
        this.backgroundImage = options.backgroundImage ?? null;

        // backgroundRepeatX
        this.backgroundRepeatX = options.backgroundRepeatX ?? 'no-repeat';

        // backgroundRepeatY
        this.backgroundRepeatY = options.backgroundRepeatY ?? 'no-repeat';

        // backgroundSize
        this.backgroundSize = options.backgroundSize ?? null;

        // background9Patch
        this.background9Patch = options.background9Patch ?? null;

        // background9PatchSize
        this.background9PatchSize = options.background9PatchSize ?? null;

        // borderColor - CSS 默认值: currentColor (本项目默认透明)
        this.borderColor = options.borderColor ?? [0, 0, 0, 0];

        // borderTopLeftRadius - CSS 默认值: 0
        this.borderTopLeftRadius = options.borderTopLeftRadius ?? [0, 0];

        // borderTopRightRadius - CSS 默认值: 0
        this.borderTopRightRadius = options.borderTopRightRadius ?? [0, 0];

        // borderBottomRightRadius - CSS 默认值: 0
        this.borderBottomRightRadius = options.borderBottomRightRadius ?? [0, 0];

        // borderBottomLeftRadius - CSS 默认值: 0
        this.borderBottomLeftRadius = options.borderBottomLeftRadius ?? [0, 0];

        // onLayout - 回调
        this.onLayout = options.onLayout ?? null;

        // ===== 应用样式 =====
        this.applyStyles();

        // ===== 内部状态 =====
        this.children = [];
        this.fiber = null;
        this.x = 0;
        this.y = 0;
        this.dirty = true;
        this.clipChain = [];
    }

    applyStyles() {
        // ===== alignContent =====
        this.yogaNode.setAlignContent(
            this.alignContent === 'stretch' ? Yoga.ALIGN_STRETCH :
                this.alignContent === 'flex-start' ? Yoga.ALIGN_FLEX_START :
                    this.alignContent === 'flex-end' ? Yoga.ALIGN_FLEX_END :
                        this.alignContent === 'center' ? Yoga.ALIGN_CENTER :
                            this.alignContent === 'space-between' ? Yoga.ALIGN_SPACE_BETWEEN :
                                this.alignContent === 'space-around' ? Yoga.ALIGN_SPACE_AROUND :
                                    this.alignContent === 'space-evenly' ? Yoga.ALIGN_SPACE_EVENLY :
                                        Yoga.ALIGN_STRETCH
        );

        // ===== alignItems =====
        this.yogaNode.setAlignItems(
            this.alignItems === 'stretch' ? Yoga.ALIGN_STRETCH :
                this.alignItems === 'flex-start' ? Yoga.ALIGN_FLEX_START :
                    this.alignItems === 'flex-end' ? Yoga.ALIGN_FLEX_END :
                        this.alignItems === 'center' ? Yoga.ALIGN_CENTER :
                            this.alignItems === 'baseline' ? Yoga.ALIGN_BASELINE :
                                Yoga.ALIGN_STRETCH
        );

        // ===== alignSelf =====
        this.yogaNode.setAlignSelf(
            this.alignSelf === 'auto' ? Yoga.ALIGN_AUTO :
                this.alignSelf === 'flex-start' ? Yoga.ALIGN_FLEX_START :
                    this.alignSelf === 'flex-end' ? Yoga.ALIGN_FLEX_END :
                        this.alignSelf === 'center' ? Yoga.ALIGN_CENTER :
                            this.alignSelf === 'stretch' ? Yoga.ALIGN_STRETCH :
                                this.alignSelf === 'baseline' ? Yoga.ALIGN_BASELINE :
                                    Yoga.ALIGN_AUTO
        );

        // ===== aspectRatio =====
        this.yogaNode.setAspectRatio(this.aspectRatio || undefined);

        // ===== borderWidth =====
        this.yogaNode.setBorder(Yoga.EDGE_BOTTOM, this.borderBottomWidth);
        this.yogaNode.setBorder(Yoga.EDGE_LEFT, this.borderLeftWidth);
        this.yogaNode.setBorder(Yoga.EDGE_RIGHT, this.borderRightWidth);
        this.yogaNode.setBorder(Yoga.EDGE_TOP, this.borderTopWidth);

        // ===== bottom =====
        this.yogaNode.setPosition(Yoga.EDGE_BOTTOM, this.bottom || undefined);

        // ===== boxSizing =====
        this.yogaNode.setBoxSizing(
            this.boxSizing === 'content-box' ? Yoga.BOX_SIZING_CONTENT_BOX :
                Yoga.BOX_SIZING_BORDER_BOX
        );

        // ===== columnGap =====
        this.yogaNode.setGap(Yoga.GUTTER_COLUMN, this.columnGap);

        // ===== direction =====
        this.yogaNode.setDirection(
            this.direction === 'inherit' ? Yoga.DIRECTION_INHERIT :
                this.direction === 'ltr' ? Yoga.DIRECTION_LTR :
                    this.direction === 'rtl' ? Yoga.DIRECTION_RTL :
                        Yoga.DIRECTION_INHERIT
        );

        // ===== display =====
        this.yogaNode.setDisplay(
            this.display === 'flex' ? Yoga.DISPLAY_FLEX :
                this.display === 'none' ? Yoga.DISPLAY_NONE :
                    this.display === 'contents' ? Yoga.DISPLAY_CONTENTS :
                        Yoga.DISPLAY_FLEX
        );

        // ===== flex =====
        if (this.flex) {
            this.yogaNode.setFlex(this.flex);
        } else {
            // ===== flexBasis =====
            this.yogaNode.setFlexBasis(this.flexBasis);

            // ===== flexDirection =====
            this.yogaNode.setFlexDirection(
                this.flexDirection === 'row' ? Yoga.FLEX_DIRECTION_ROW :
                    this.flexDirection === 'row-reverse' ? Yoga.FLEX_DIRECTION_ROW_REVERSE :
                        this.flexDirection === 'column' ? Yoga.FLEX_DIRECTION_COLUMN :
                            this.flexDirection === 'column-reverse' ? Yoga.FLEX_DIRECTION_COLUMN_REVERSE :
                                Yoga.FLEX_DIRECTION_ROW
            );

            // ===== flexGrow =====
            this.yogaNode.setFlexGrow(this.flexGrow);

            // ===== flexShrink =====
            this.yogaNode.setFlexShrink(this.flexShrink);
        }

        // ===== flexWrap =====
        this.yogaNode.setFlexWrap(
            this.flexWrap === 'nowrap' ? Yoga.WRAP_NO_WRAP :
                this.flexWrap === 'wrap' ? Yoga.WRAP_WRAP :
                    this.flexWrap === 'wrap-reverse' ? Yoga.WRAP_WRAP_REVERSE :
                        Yoga.WRAP_NO_WRAP
        );

        // ===== height =====
        this.yogaNode.setHeight(this.height);

        // ===== isReferenceBaseline =====
        this.yogaNode.setIsReferenceBaseline(this.isReferenceBaseline);

        // ===== justifyContent =====
        this.yogaNode.setJustifyContent(
            this.justifyContent === 'flex-start' ? Yoga.JUSTIFY_FLEX_START :
                this.justifyContent === 'flex-end' ? Yoga.JUSTIFY_FLEX_END :
                    this.justifyContent === 'center' ? Yoga.JUSTIFY_CENTER :
                        this.justifyContent === 'space-between' ? Yoga.JUSTIFY_SPACE_BETWEEN :
                            this.justifyContent === 'space-around' ? Yoga.JUSTIFY_SPACE_AROUND :
                                this.justifyContent === 'space-evenly' ? Yoga.JUSTIFY_SPACE_EVENLY :
                                    Yoga.JUSTIFY_FLEX_START
        );

        // ===== left =====
        this.yogaNode.setPosition(Yoga.EDGE_LEFT, this.left || undefined);

        // ===== margin =====
        this.yogaNode.setMargin(Yoga.EDGE_BOTTOM, this.marginBottom);
        this.yogaNode.setMargin(Yoga.EDGE_LEFT, this.marginLeft);
        this.yogaNode.setMargin(Yoga.EDGE_RIGHT, this.marginRight);
        this.yogaNode.setMargin(Yoga.EDGE_TOP, this.marginTop);

        // ===== maxHeight =====
        this.yogaNode.setMaxHeight(this.maxHeight || undefined);

        // ===== maxWidth =====
        this.yogaNode.setMaxWidth(this.maxWidth || undefined);

        // ===== minHeight =====
        this.yogaNode.setMinHeight(this.minHeight || undefined);

        // ===== minWidth =====
        this.yogaNode.setMinWidth(this.minWidth || undefined);

        // ===== overflow =====
        this.yogaNode.setOverflow(
            this.overflow === 'visible' ? Yoga.OVERFLOW_VISIBLE :
                this.overflow === 'hidden' ? Yoga.OVERFLOW_HIDDEN :
                    this.overflow === 'scroll' ? Yoga.OVERFLOW_SCROLL :
                        Yoga.OVERFLOW_VISIBLE
        );

        // ===== padding =====
        this.yogaNode.setPadding(Yoga.EDGE_BOTTOM, this.paddingBottom);
        this.yogaNode.setPadding(Yoga.EDGE_LEFT, this.paddingLeft);
        this.yogaNode.setPadding(Yoga.EDGE_RIGHT, this.paddingRight);
        this.yogaNode.setPadding(Yoga.EDGE_TOP, this.paddingTop);

        // ===== position =====
        this.yogaNode.setPositionType(
            this.position === 'relative' ? Yoga.POSITION_TYPE_RELATIVE :
                this.position === 'absolute' ? Yoga.POSITION_TYPE_ABSOLUTE :
                    this.position === 'static' ? Yoga.POSITION_TYPE_STATIC :
                        Yoga.POSITION_TYPE_RELATIVE
        );

        // ===== right =====
        this.yogaNode.setPosition(Yoga.EDGE_RIGHT, this.right || undefined);

        // ===== rowGap =====
        this.yogaNode.setGap(Yoga.GUTTER_ROW, this.rowGap);

        // ===== top =====
        this.yogaNode.setPosition(Yoga.EDGE_TOP, this.top || undefined);

        // ===== width =====
        this.yogaNode.setWidth(this.width);
    }
}

/**
 * TextNode - 文字节点
 * 继承 Node，添加 MeasureFunc 支持自动测量文字尺寸
 */
export class TextNode extends Node {
    constructor(options = {}) {
        super(options);

        // color - CSS 默认值: black
        this.color = options.color ?? [0, 0, 0, 1];

        // onMeasureResult - 回调
        this.onMeasureResult = options.onMeasureResult ?? null;

        // text
        this.text = options.text ?? '';

        // fontSize - CSS 默认值: 16px
        this.fontSize = options.fontSize ?? 16;

        // fontFamily - CSS 默认值: sans-serif
        this.fontFamily = options.fontFamily ?? 'sans-serif';

        // fontWeight - CSS 默认值: normal
        this.fontWeight = options.fontWeight ?? 'normal';

        // lineHeight - CSS 默认值: normal (约 1.2)
        this.lineHeight = options.lineHeight ?? 1.2;

        // wordBreak - CSS 默认值: normal
        this.wordBreak = options.wordBreak ?? 'normal';

        // whiteSpace - CSS 默认值: normal
        this.whiteSpace = options.whiteSpace ?? 'normal';

        // 测量结果缓存
        this.measureResult = null;

        // 文字脏标记
        this.textDirty = true;

        // 设置 MeasureFunc
        this.yogaNode.setMeasureFunc((constraintWidth, widthMode, constraintHeight, heightMode) => {
            if (!this.text) {
                return {
                    width: 0,
                    height: this.fontSize * this.lineHeight
                };
            }

            this.measureResult = measureText(this.text, {
                fontSize: this.fontSize,
                fontFamily: this.fontFamily,
                fontWeight: this.fontWeight,
                lineHeight: this.lineHeight,
                maxWidth: constraintWidth,
                wordBreak: this.wordBreak,
                whiteSpace: this.whiteSpace
            });

            return {
                width: this.measureResult.width,
                height: this.measureResult.height
            };
        });
    }
}
