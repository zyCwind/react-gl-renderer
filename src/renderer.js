/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import { getImageData } from './assets.js';

// 生成顶点数据
export function generateVertices(rects) {
    const allVertices = [];
    for (const rect of rects) {
        allVertices.push(...generateRectVertices(rect));
    }
    return new Float32Array(allVertices);
}

export function generateRectVertices(rect) {
    const { x, y, width, height } = rect;
    const [backgroundColorR, backgroundColorG, backgroundColorB, backgroundColorA] = rect.backgroundColor;
    const [borderColorR, borderColorG, borderColorB, borderColorA] = rect.borderColor;
    const [borderTopLeftRadiusX, borderTopLeftRadiusY] = rect.borderTopLeftRadius;
    const [borderTopRightRadiusX, borderTopRightRadiusY] = rect.borderTopRightRadius;
    const [borderBottomRightRadiusX, borderBottomRightRadiusY] = rect.borderBottomRightRadius;
    const [borderBottomLeftRadiusX, borderBottomLeftRadiusY] = rect.borderBottomLeftRadius;
    const { borderLeftWidth, borderTopWidth, borderRightWidth, borderBottomWidth } = rect;
    const { paddingLeft, paddingTop, paddingRight, paddingBottom } = rect;
    // CSS box-sizing: border-box
    // 用户传入的 width/height 是 border-box 尺寸
    // border-box 的最小尺寸为 border + padding
    const minBorderBoxWidth = borderLeftWidth + borderRightWidth + paddingLeft + paddingRight;
    const minBorderBoxHeight = borderTopWidth + borderBottomWidth + paddingTop + paddingBottom;

    // 修正 border-box 尺寸（如果小于最小值则扩展）
    const borderBoxWidth = Math.max(width, minBorderBoxWidth);
    const borderBoxHeight = Math.max(height, minBorderBoxHeight);

    // padding-box = border-box - border
    const paddingBoxWidth = borderBoxWidth - borderLeftWidth - borderRightWidth;
    const paddingBoxHeight = borderBoxHeight - borderTopWidth - borderBottomWidth;

    // ===== CSS 规范圆角缩放 =====
    // CSS 规范：同一边上相邻两角的半径之和不能超过该边长度
    // 如果超过，所有相关半径按比例缩放
    // 参考：https://www.w3.org/TR/css-backgrounds-3/#corner-overlap

    // 计算四条边的缩放因子
    // 上边：左上水平半径 + 右上水平半径 不能超过 borderBox 宽度
    const topEdgeRatio = (borderTopLeftRadiusX + borderTopRightRadiusX > borderBoxWidth)
        ? borderBoxWidth / (borderTopLeftRadiusX + borderTopRightRadiusX) : 1;
    // 下边：左下水平半径 + 右下水平半径 不能超过 borderBox 宽度
    const bottomEdgeRatio = (borderBottomLeftRadiusX + borderBottomRightRadiusX > borderBoxWidth)
        ? borderBoxWidth / (borderBottomLeftRadiusX + borderBottomRightRadiusX) : 1;
    // 左边：左上垂直半径 + 左下垂直半径 不能超过 borderBox 高度
    const leftEdgeRatio = (borderTopLeftRadiusY + borderBottomLeftRadiusY > borderBoxHeight)
        ? borderBoxHeight / (borderTopLeftRadiusY + borderBottomLeftRadiusY) : 1;
    // 右边：右上垂直半径 + 右下垂直半径 不能超过 borderBox 高度
    const rightEdgeRatio = (borderTopRightRadiusY + borderBottomRightRadiusY > borderBoxHeight)
        ? borderBoxHeight / (borderTopRightRadiusY + borderBottomRightRadiusY) : 1;

    // 应用缩放到 border-box 圆角半径
    // 每个角的水平半径受上下边缩放因子影响，垂直半径受左右边缩放因子影响
    const fixedTopLeftX = borderTopLeftRadiusX * topEdgeRatio;
    const fixedTopLeftY = borderTopLeftRadiusY * leftEdgeRatio;
    const fixedTopRightX = borderTopRightRadiusX * topEdgeRatio;
    const fixedTopRightY = borderTopRightRadiusY * rightEdgeRatio;
    const fixedBottomRightX = borderBottomRightRadiusX * bottomEdgeRatio;
    const fixedBottomRightY = borderBottomRightRadiusY * rightEdgeRatio;
    const fixedBottomLeftX = borderBottomLeftRadiusX * bottomEdgeRatio;
    const fixedBottomLeftY = borderBottomLeftRadiusY * leftEdgeRatio;

    // padding-box 中心（shader 中用于背景填充）
    const centerX = x + borderLeftWidth + paddingBoxWidth / 2;
    const centerY = y + borderTopWidth + paddingBoxHeight / 2;
    const halfWidth = paddingBoxWidth / 2;
    const halfHeight = paddingBoxHeight / 2;

    // border-box 顶点（绘制区域）
    const positions = [x, y, x + borderBoxWidth, y, x, y + borderBoxHeight, x + borderBoxWidth, y, x + borderBoxWidth, y + borderBoxHeight, x, y + borderBoxHeight];

    const vertices = [];
    for (let i = 0; i < 6; i++) {
        vertices.push(positions[i * 2], positions[i * 2 + 1]);
        vertices.push(backgroundColorR, backgroundColorG, backgroundColorB, backgroundColorA);
        // a_sdf0: xy = padding-box 半宽高, zw = border-box 左上角圆角（已修正）
        vertices.push(halfWidth, halfHeight, fixedTopLeftX, fixedTopLeftY);
        // a_sdf1: xy = border-box 右上角圆角, zw = border-box 右下角圆角（已修正）
        vertices.push(fixedTopRightX, fixedTopRightY, fixedBottomRightX, fixedBottomRightY);
        // a_sdf2: xy = border-box 左下角圆角, zw = padding-box 中心（已修正）
        vertices.push(fixedBottomLeftX, fixedBottomLeftY, centerX, centerY);
        // a_borderWidth: 边框宽度
        vertices.push(borderLeftWidth, borderTopWidth, borderRightWidth, borderBottomWidth);
        // a_borderColor: 边框颜色
        vertices.push(borderColorR, borderColorG, borderColorB, borderColorA);
    }
    return vertices;
}

// 着色器源码
export const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    attribute vec4 a_sdf0;  // xy: padding-box 半宽高, zw: border-box 左上角圆角(水平,垂直)
    attribute vec4 a_sdf1;  // xy: border-box 右上角圆角(水平,垂直), zw: border-box 右下角圆角(水平,垂直)
    attribute vec4 a_sdf2;  // xy: border-box 左下角圆角(水平,垂直), zw: padding-box 中心(x,y)
    attribute vec4 a_borderWidth;  // 边框宽度: 左、上、右、下
    attribute vec4 a_borderColor;  // 边框颜色: rgba
    
    uniform mat3 u_projection;
    
    varying vec4 v_color;
    varying vec2 v_position;    // 世界坐标位置
    varying vec4 v_sdf0;
    varying vec4 v_sdf1;
    varying vec4 v_sdf2;
    varying vec4 v_borderWidth;
    varying vec4 v_borderColor;
    
    void main() {
        vec3 projected = u_projection * vec3(a_position, 1.0);
        gl_Position = vec4(projected.xy, 0.0, 1.0);
        v_color = a_color;
        v_position = a_position;
        v_sdf0 = a_sdf0;
        v_sdf1 = a_sdf1;
        v_sdf2 = a_sdf2;
        v_borderWidth = a_borderWidth;
        v_borderColor = a_borderColor;
    }
`;

export const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    varying vec2 v_position;
    varying vec4 v_sdf0;
    varying vec4 v_sdf1;
    varying vec4 v_sdf2;
    varying vec4 v_borderWidth;  // 边框宽度: 左、上、右、下
    varying vec4 v_borderColor;  // 边框颜色: rgba
    
    // 裁剪SDF纹理
    uniform sampler2D u_clipTexture;
    uniform vec2 u_clipTextureSize;  // 纹理尺寸 (count*8, 1)
    uniform int u_clipCount;
    uniform float u_maxVal;  // 动态尺度（归一化参照）
    
    // 贴图纹理
    uniform sampler2D u_imageTexture;
    uniform bool u_useImageTexture;
    uniform vec2 u_imageSize;  // 贴图原始尺寸（像素）
    uniform vec2 u_imageRepeat;  // 贴图平铺模式: x=repeatX, y=repeatY (0=no-repeat, 1=repeat)
    uniform bool u_useImageSizeRatio;  // 是否使用百分比模式
    uniform vec2 u_imageSizeRatio;  // 百分比值 [0-1]，backgroundSize

    // 9-Patch
    uniform bool u_use9Patch;
    uniform vec4 u_image9Patch;  // 拉伸区域 [left, right, top, bottom]
    
    // 简化的浮点解码：从归一化 R 通道恢复原始值
    float decodeNormalized(vec4 texel) {
        return texel.r * u_maxVal;
    }
    
    // 带四个椭圆圆角的矩形SDF - 支持不等宽边框的精确CSS模拟
    // borderTopLeftRadius/TopRight/BottomRight/BottomLeft: 每个角的 vec2(水平半径, 垂直半径)
    float roundedBoxSDF(vec2 p, vec2 center, vec2 halfSize,
                       vec2 borderTopLeftRadius, vec2 borderTopRightRadius, vec2 borderBottomRightRadius, vec2 borderBottomLeftRadius) {
        vec2 q = p - center;
        
        // 基础矩形SDF（无圆角）
        vec2 d = abs(q) - halfSize;
        float rectDist = min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); // 空间中某一点到目标形状（比如矩形）边界的「最短欧几里得距离（直线距离）」，符号仅用于标识点在形状的「内部 / 外部」。
        
        // 左上角 (q.x < 0, q.y < 0) - 仅当圆角半径都 > 0 时才处理
        if (borderTopLeftRadius.x > 0.0 && borderTopLeftRadius.y > 0.0 &&
            q.x < -halfSize.x + borderTopLeftRadius.x && q.y < -halfSize.y + borderTopLeftRadius.y) {
            vec2 corner = vec2(-halfSize.x + borderTopLeftRadius.x, -halfSize.y + borderTopLeftRadius.y);
            vec2 localQ = q - corner;
            float ellipseDist = (localQ.x * localQ.x) / (borderTopLeftRadius.x * borderTopLeftRadius.x) 
                              + (localQ.y * localQ.y) / (borderTopLeftRadius.y * borderTopLeftRadius.y) - 1.0;
            return ellipseDist * min(borderTopLeftRadius.x, borderTopLeftRadius.y);
        }
        // 右上角 (q.x > 0, q.y < 0)
        if (borderTopRightRadius.x > 0.0 && borderTopRightRadius.y > 0.0 &&
            q.x > halfSize.x - borderTopRightRadius.x && q.y < -halfSize.y + borderTopRightRadius.y) {
            vec2 corner = vec2(halfSize.x - borderTopRightRadius.x, -halfSize.y + borderTopRightRadius.y);
            vec2 localQ = q - corner;
            float ellipseDist = (localQ.x * localQ.x) / (borderTopRightRadius.x * borderTopRightRadius.x) 
                              + (localQ.y * localQ.y) / (borderTopRightRadius.y * borderTopRightRadius.y) - 1.0;
            return ellipseDist * min(borderTopRightRadius.x, borderTopRightRadius.y);
        }
        // 右下角 (q.x > 0, q.y > 0)
        if (borderBottomRightRadius.x > 0.0 && borderBottomRightRadius.y > 0.0 &&
            q.x > halfSize.x - borderBottomRightRadius.x && q.y > halfSize.y - borderBottomRightRadius.y) {
            vec2 corner = vec2(halfSize.x - borderBottomRightRadius.x, halfSize.y - borderBottomRightRadius.y);
            vec2 localQ = q - corner;
            float ellipseDist = (localQ.x * localQ.x) / (borderBottomRightRadius.x * borderBottomRightRadius.x) 
                              + (localQ.y * localQ.y) / (borderBottomRightRadius.y * borderBottomRightRadius.y) - 1.0;
            return ellipseDist * min(borderBottomRightRadius.x, borderBottomRightRadius.y);
        }
        // 左下角 (q.x < 0, q.y > 0)
        if (borderBottomLeftRadius.x > 0.0 && borderBottomLeftRadius.y > 0.0 &&
            q.x < -halfSize.x + borderBottomLeftRadius.x && q.y > halfSize.y - borderBottomLeftRadius.y) {
            vec2 corner = vec2(-halfSize.x + borderBottomLeftRadius.x, halfSize.y - borderBottomLeftRadius.y);
            vec2 localQ = q - corner;
            float ellipseDist = (localQ.x * localQ.x) / (borderBottomLeftRadius.x * borderBottomLeftRadius.x) 
                              + (localQ.y * localQ.y) / (borderBottomLeftRadius.y * borderBottomLeftRadius.y) - 1.0;
            return ellipseDist * min(borderBottomLeftRadius.x, borderBottomLeftRadius.y);
        }
        
        // 当圆角半径为 0 时，返回基础矩形距离
        return rectDist;
    }
    
    // 9-patch UV 映射
    // pixelPos: 当前像素相对于 padding-box 左上角的位置
    // displaySize: padding-box 尺寸（显示区域）
    // 返回贴图 UV 坐标
    vec2 map9PatchUV(vec2 pixelPos, vec2 displaySize) {
        // u_image9Patch = [left, right, top, bottom]
        // 定义可拉伸区域的边界
        float stretchLeft = u_image9Patch.x;
        float stretchRight = u_image9Patch.y;
        float stretchTop = u_image9Patch.z;
        float stretchBottom = u_image9Patch.w;
        
        // 贴图三列宽度
        float texLeft = stretchLeft;
        float texMiddle = stretchRight - stretchLeft;
        float texRight = u_imageSize.x - stretchRight;
        
        // 显示三列宽度
        float displayLeft = texLeft;
        float displayRight = texRight;
        float displayMiddle = displaySize.x - displayLeft - displayRight;
        // 当 displayMiddle < 0 时，可拉伸区域压缩为 0，右列紧贴左列
        
        // 贴图三行高度
        float texTop = stretchTop;
        float texMiddleV = stretchBottom - stretchTop;
        float texBottom = u_imageSize.y - stretchBottom;
        
        // 显示三行高度
        float displayTop = texTop;
        float displayBottom = texBottom;
        float displayMiddleV = displaySize.y - displayTop - displayBottom;
        // 当 displayMiddleV < 0 时，可拉伸区域压缩为 0，下行紧贴上行
        
        // X 方向映射
        float texX;
        if (displayMiddle >= 0.0) {
            // 正常情况：中间可拉伸区域有正宽度
            if (pixelPos.x < displayLeft) {
                texX = pixelPos.x;
            } else if (pixelPos.x < displayLeft + displayMiddle) {
                float t = (pixelPos.x - displayLeft) / max(displayMiddle, 0.001);
                texX = texLeft + t * texMiddle;
            } else {
                texX = stretchRight + (pixelPos.x - displayLeft - displayMiddle);
            }
        } else {
            // 可拉伸区域压缩为 0，连续采样不可拉伸区域
            if (pixelPos.x < displayLeft) {
                // 左列
                texX = pixelPos.x;
            } else {
                // 右列紧贴左列，从右列起始位置连续采样
                texX = stretchRight + (pixelPos.x - displayLeft);
            }
        }
        
        // Y 方向映射
        float texY;
        if (displayMiddleV >= 0.0) {
            // 正常情况：中间可拉伸区域有正高度
            if (pixelPos.y < displayTop) {
                texY = pixelPos.y;
            } else if (pixelPos.y < displayTop + displayMiddleV) {
                float t = (pixelPos.y - displayTop) / max(displayMiddleV, 0.001);
                texY = texTop + t * texMiddleV;
            } else {
                texY = stretchBottom + (pixelPos.y - displayTop - displayMiddleV);
            }
        } else {
            // 可拉伸区域压缩为 0，连续采样不可拉伸区域
            if (pixelPos.y < displayTop) {
                // 上行
                texY = pixelPos.y;
            } else {
                // 下行紧贴上行，从下行起始位置连续采样
                texY = stretchBottom + (pixelPos.y - displayTop);
            }
        }
        
        // 转换为 UV 坐标 [0, 1]
        return vec2(texX, texY) / u_imageSize;
    }
    
    // 从纹理采样裁剪数据
    // 纹理布局：每个裁剪区域占 12 列
    // 列0-3: centerX, centerY, halfWidth, halfHeight
    // 列4-11: 四个角的椭圆参数
    vec4 getClipData(int index) {
        float baseX = float(index * 12);
        
        float centerX = decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 0.5) / u_clipTextureSize.x, 0.5)));
        float centerY = decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 1.5) / u_clipTextureSize.x, 0.5)));
        float halfWidth = decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 2.5) / u_clipTextureSize.x, 0.5)));
        float halfHeight = decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 3.5) / u_clipTextureSize.x, 0.5)));
        
        return vec4(centerX, centerY, halfWidth, halfHeight);
    }
    
    // 获取裁剪区域的四个椭圆圆角
    void getClipRadii(int index, out vec2 clipTopLeftRadius, out vec2 clipTopRightRadius, out vec2 clipBottomRightRadius, out vec2 clipBottomLeftRadius) {
        float baseX = float(index * 12);
        clipTopLeftRadius = vec2(
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 4.5) / u_clipTextureSize.x, 0.5))),
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 5.5) / u_clipTextureSize.x, 0.5)))
        );
        clipTopRightRadius = vec2(
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 6.5) / u_clipTextureSize.x, 0.5))),
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 7.5) / u_clipTextureSize.x, 0.5)))
        );
        clipBottomRightRadius = vec2(
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 8.5) / u_clipTextureSize.x, 0.5))),
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 9.5) / u_clipTextureSize.x, 0.5)))
        );
        clipBottomLeftRadius = vec2(
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 10.5) / u_clipTextureSize.x, 0.5))),
            decodeNormalized(texture2D(u_clipTexture, vec2((baseX + 11.5) / u_clipTextureSize.x, 0.5)))
        );
    }
    
    void main() {
        // 解析顶点数据 - padding-box 和 border-box 参数
        vec2 paddingBoxHalfSize = v_sdf0.xy;
        vec2 borderTopLeftRadius = v_sdf0.zw;  // border-box 左上角圆角 (水平, 垂直)
        vec2 borderTopRightRadius = v_sdf1.xy;  // border-box 右上角圆角 (水平, 垂直)
        vec2 borderBottomRightRadius = v_sdf1.zw;  // border-box 右下角圆角 (水平, 垂直)
        vec2 borderBottomLeftRadius = v_sdf2.xy;  // border-box 左下角圆角 (水平, 垂直)
        vec2 paddingBoxCenter = v_sdf2.zw;
        
        // 解析边框参数
        float borderLeftWidth = v_borderWidth.x;
        float borderTopWidth = v_borderWidth.y;
        float borderRightWidth = v_borderWidth.z;
        float borderBottomWidth = v_borderWidth.w;
        
        // ===== padding-box 圆角计算 (CSS 规范) =====
        // padding-box 圆角 = border-box 圆角 - 对应边框宽度
        // 左上角: rx - 左边框, ry - 上边框
        vec2 paddingBoxTopLeftRadius = vec2(max(0.0, borderTopLeftRadius.x - borderLeftWidth), 
                                            max(0.0, borderTopLeftRadius.y - borderTopWidth));
        vec2 paddingBoxTopRightRadius = vec2(max(0.0, borderTopRightRadius.x - borderRightWidth), 
                                             max(0.0, borderTopRightRadius.y - borderTopWidth));
        vec2 paddingBoxBottomRightRadius = vec2(max(0.0, borderBottomRightRadius.x - borderRightWidth), 
                                                 max(0.0, borderBottomRightRadius.y - borderBottomWidth));
        vec2 paddingBoxBottomLeftRadius = vec2(max(0.0, borderBottomLeftRadius.x - borderLeftWidth), 
                                                max(0.0, borderBottomLeftRadius.y - borderBottomWidth));
        
        // 计算 padding-box 的 SDF (背景填充区域的内边界)
        float dPadding = roundedBoxSDF(v_position, paddingBoxCenter, paddingBoxHalfSize,
                                       paddingBoxTopLeftRadius, paddingBoxTopRightRadius, paddingBoxBottomRightRadius, paddingBoxBottomLeftRadius);
        
        // ===== border-box 外边界 SDF =====
        // border-box 中心 = padding-box 中心 + 边框偏移
        // 当左右边框不等时，中心会偏移
        vec2 borderBoxCenter = paddingBoxCenter + vec2((borderRightWidth - borderLeftWidth) * 0.5,
                                                       (borderBottomWidth - borderTopWidth) * 0.5);
        vec2 borderBoxHalfSize = paddingBoxHalfSize + vec2((borderLeftWidth + borderRightWidth) * 0.5,
                                                           (borderTopWidth + borderBottomWidth) * 0.5);
        
        float dBorder = roundedBoxSDF(v_position, borderBoxCenter, borderBoxHalfSize,
                                      borderTopLeftRadius, borderTopRightRadius, borderBottomRightRadius, borderBottomLeftRadius);
        
        // 抗锯齿平滑
        float smoothness = 1.5;
        
        // padding-box 填充 alpha
        float fillAlpha = 1.0 - smoothstep(-smoothness, smoothness, dPadding);
        
        // 边框区域 alpha (border-box 外边界内，padding-box 内边界外)
        float borderOuterAlpha = 1.0 - smoothstep(-smoothness, smoothness, dBorder);
        float borderAlpha = borderOuterAlpha - fillAlpha;
        
        // 合并颜色：边框在填充外部
        vec4 finalColor = v_color * fillAlpha + v_borderColor * borderAlpha;
        float alpha = fillAlpha + borderAlpha;
        
        // 应用贴图到 padding-box 区域（background-repeat 效果）
        // CSS 默认: background-origin: padding-box
        // 使用 dPadding < smoothness 判断是否在 padding-box 内（包括边界过渡区）
        if (u_useImageTexture && dPadding < smoothness) {
            // padding-box 左上角为起点
            vec2 paddingBoxMin = paddingBoxCenter - paddingBoxHalfSize;
            // 像素坐标（相对于 padding-box 左上角）
            vec2 pixelPos = v_position - paddingBoxMin;

            // 计算显示尺寸
            vec2 paddingBoxSize = paddingBoxHalfSize * 2.0;
            vec2 displaySize = u_useImageSizeRatio
                ? paddingBoxSize * u_imageSizeRatio
                : u_imageSize;

            // 计算 UV 坐标
            vec2 uv;
            bool inBounds = true;
            
            if (u_use9Patch) {
                // 9-patch 模式：使用映射函数
                uv = map9PatchUV(pixelPos, paddingBoxSize);
                // 9-patch 默认填满整个 padding-box，不检查边界
            } else {
                // 普通模式
                uv = pixelPos / displaySize;
                
                // no-repeat模式：贴图保持原始尺寸，只显示在左上角
                // 检查是否在贴图范围内（UV 范围 0-1）
                if (u_imageRepeat.x < 0.5) {
                    // no-repeat X: 超出 UV 范围 0-1 则不显示
                    if (uv.x > 1.0) {
                        inBounds = false;
                    }
                } else {
                    // repeat X: 手动处理 UV repeat
                    uv.x = mod(uv.x, 1.0);
                }
                if (u_imageRepeat.y < 0.5) {
                    // no-repeat Y: 超出 UV 范围 0-1 则不显示
                    if (uv.y > 1.0) {
                        inBounds = false;
                    }
                } else {
                    // repeat Y: 手动处理 UV repeat
                    uv.y = mod(uv.y, 1.0);
                }
            }

            if (inBounds) {
                vec4 texColor = texture2D(u_imageTexture, uv);
                // 标准的 "over" 混合模式：贴图覆盖在背景色上
                // src-over: result = src + dst * (1 - src.a)
                // 考虑 fillAlpha 作为遮罩
                float texAlpha = texColor.a * fillAlpha;
                finalColor = vec4(
                    texColor.rgb * texAlpha + finalColor.rgb * (1.0 - texAlpha),
                    texAlpha + finalColor.a * (1.0 - texAlpha)
                );
            }
        }
        
        // 应用裁剪SDF交集
        if (u_clipCount > 0) {
            for (int i = 0; i < 32; i++) {
                if (i >= u_clipCount) {
                    break;
                }
                
                // 从纹理采样裁剪数据
                vec4 clipData = getClipData(i);
                vec2 clipCenter = clipData.xy;
                vec2 clipHalfSize = clipData.zw;
                
                // 采样四个椭圆圆角
                vec2 clipTopLeftRadius, clipTopRightRadius, clipBottomRightRadius, clipBottomLeftRadius;
                getClipRadii(i, clipTopLeftRadius, clipTopRightRadius, clipBottomRightRadius, clipBottomLeftRadius);
                
                float clipD = roundedBoxSDF(v_position, clipCenter, clipHalfSize,
                                           clipTopLeftRadius, clipTopRightRadius, clipBottomRightRadius, clipBottomLeftRadius);
                
                // 计算裁剪区域的alpha
                float clipAlpha = 1.0 - smoothstep(-smoothness, smoothness, clipD);
                alpha = min(alpha, clipAlpha);
            }
        }
        
        // 完全透明则丢弃
        if (alpha < 0.01) {
            discard;
        }
        
        gl_FragColor = vec4(finalColor.rgb, finalColor.a * alpha);
    }
`;

// ===== 渲染器封装 =====
export class GLRenderer {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
        this.canvas = canvas;
        this.program = null;
        this.attributeLocs = {};
        this.uniformLocs = {};
        this.projection = null;

        this._initShader();
        this._initProjection();
    }

    _initShader() {
        const gl = this.gl;

        // 编译着色器
        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        // 创建程序
        function createProgram(gl, vertexShader, fragmentShader) {
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            return program;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = createProgram(gl, vertexShader, fragmentShader);

        // 获取属性位置
        this.attributeLocs = {
            position: gl.getAttribLocation(this.program, 'a_position'),
            color: gl.getAttribLocation(this.program, 'a_color'),
            sdf0: gl.getAttribLocation(this.program, 'a_sdf0'),
            sdf1: gl.getAttribLocation(this.program, 'a_sdf1'),
            sdf2: gl.getAttribLocation(this.program, 'a_sdf2'),
            borderWidth: gl.getAttribLocation(this.program, 'a_borderWidth'),
            borderColor: gl.getAttribLocation(this.program, 'a_borderColor')
        };

        // 获取uniform位置
        this.uniformLocs = {
            clipCount: gl.getUniformLocation(this.program, 'u_clipCount'),
            clipTexture: gl.getUniformLocation(this.program, 'u_clipTexture'),
            clipTextureSize: gl.getUniformLocation(this.program, 'u_clipTextureSize'),
            image9Patch: gl.getUniformLocation(this.program, 'u_image9Patch'),
            imageRepeat: gl.getUniformLocation(this.program, 'u_imageRepeat'),
            imageSize: gl.getUniformLocation(this.program, 'u_imageSize'),
            imageSizeRatio: gl.getUniformLocation(this.program, 'u_imageSizeRatio'),
            imageTexture: gl.getUniformLocation(this.program, 'u_imageTexture'),
            maxVal: gl.getUniformLocation(this.program, 'u_maxVal'),
            projection: gl.getUniformLocation(this.program, 'u_projection'),
            useImageTexture: gl.getUniformLocation(this.program, 'u_useImageTexture'),
            useImageSizeRatio: gl.getUniformLocation(this.program, 'u_useImageSizeRatio'),
            use9Patch: gl.getUniformLocation(this.program, 'u_use9Patch')
        };
    }

    _initProjection() {
        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 设置视口
        gl.viewport(0, 0, width, height);

        // 启用混合（透明度必需）
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.projection = new Float32Array([
            2 / width, 0, 0,
            0, -2 / height, 0,
            -1, 1, 1
        ]);
    }

    // 创建裁剪纹理
    // clipChain 存储 { paddingBoxRegion, aabbs }，直接使用 paddingBoxRegion
    _createClipTexture(clipChain) {
        const gl = this.gl;
        const count = clipChain.length;
        if (count === 0) {
            return { texture: null, width: 0, height: 0, maxVal: 1 };
        }

        const textureWidth = Math.max(count * 12, 1);
        const textureHeight = 1;
        const data = new Uint8Array(textureWidth * textureHeight * 4);

        let maxVal = 1;
        for (const { paddingBoxRegion } of clipChain) {
            const centerX = paddingBoxRegion.x + paddingBoxRegion.width / 2;
            const centerY = paddingBoxRegion.y + paddingBoxRegion.height / 2;
            maxVal = Math.max(maxVal, Math.abs(centerX), Math.abs(centerY), paddingBoxRegion.width / 2, paddingBoxRegion.height / 2, ...paddingBoxRegion.radii.flat());
        }

        for (let i = 0; i < count; i++) {
            const { paddingBoxRegion } = clipChain[i];
            const centerX = paddingBoxRegion.x + paddingBoxRegion.width / 2;
            const centerY = paddingBoxRegion.y + paddingBoxRegion.height / 2;
            const [[borderTopLeftRadiusX, borderTopLeftRadiusY],
                [borderTopRightRadiusX, borderTopRightRadiusY],
                [borderBottomRightRadiusX, borderBottomRightRadiusY],
                [borderBottomLeftRadiusX, borderBottomLeftRadiusY]] = paddingBoxRegion.radii;

            const baseIdx = i * 12;
            data[baseIdx * 4 + 0] = Math.round(centerX / maxVal * 255);
            data[baseIdx * 4 + 4] = Math.round(centerY / maxVal * 255);
            data[baseIdx * 4 + 8] = Math.round(paddingBoxRegion.width / 2 / maxVal * 255);
            data[baseIdx * 4 + 12] = Math.round(paddingBoxRegion.height / 2 / maxVal * 255);
            data[baseIdx * 4 + 16] = Math.round(borderTopLeftRadiusX / maxVal * 255);
            data[baseIdx * 4 + 20] = Math.round(borderTopLeftRadiusY / maxVal * 255);
            data[baseIdx * 4 + 24] = Math.round(borderTopRightRadiusX / maxVal * 255);
            data[baseIdx * 4 + 28] = Math.round(borderTopRightRadiusY / maxVal * 255);
            data[baseIdx * 4 + 32] = Math.round(borderBottomRightRadiusX / maxVal * 255);
            data[baseIdx * 4 + 36] = Math.round(borderBottomRightRadiusY / maxVal * 255);
            data[baseIdx * 4 + 40] = Math.round(borderBottomLeftRadiusX / maxVal * 255);
            data[baseIdx * 4 + 44] = Math.round(borderBottomLeftRadiusY / maxVal * 255);
        }

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return { texture, width: textureWidth, height: textureHeight, maxVal };
    }

    _createImageTexture(imageData) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        if (imageData.data) {
            // 使用 { width, height, data } 格式（文字贴图）
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageData.width, imageData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);
        } else {
            // 直接使用 HTMLImageElement
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // 使用 CLAMP_TO_EDGE 以支持非 2 的幂次方尺寸（WebGL 1 限制）
        // repeat 功能由 shader 手动处理
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }

    // 设置顶点属性
    _setupVertexAttributes() {
        const gl = this.gl;
        const loc = this.attributeLocs;
        const stride = 26 * 4;

        gl.enableVertexAttribArray(loc.position);
        gl.vertexAttribPointer(loc.position, 2, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(loc.color);
        gl.vertexAttribPointer(loc.color, 4, gl.FLOAT, false, stride, 2 * 4);

        gl.enableVertexAttribArray(loc.sdf0);
        gl.vertexAttribPointer(loc.sdf0, 4, gl.FLOAT, false, stride, 6 * 4);

        gl.enableVertexAttribArray(loc.sdf1);
        gl.vertexAttribPointer(loc.sdf1, 4, gl.FLOAT, false, stride, 10 * 4);

        gl.enableVertexAttribArray(loc.sdf2);
        gl.vertexAttribPointer(loc.sdf2, 4, gl.FLOAT, false, stride, 14 * 4);

        gl.enableVertexAttribArray(loc.borderWidth);
        gl.vertexAttribPointer(loc.borderWidth, 4, gl.FLOAT, false, stride, 18 * 4);

        gl.enableVertexAttribArray(loc.borderColor);
        gl.vertexAttribPointer(loc.borderColor, 4, gl.FLOAT, false, stride, 22 * 4);
    }

    // 清屏
    clear(r = 0, g = 0, b = 0, a = 0) {
        const gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // 绘制
    render(options) {
        const { roundedRects = [], clipRoundedRects = [], backgroundImage = null, backgroundRepeatX = true, backgroundRepeatY = true, backgroundSize = null, background9Patch = null, background9PatchSize = null } = options;
        const gl = this.gl;

        if (roundedRects.length === 0) {
            return;
        }

        gl.useProgram(this.program);

        // 设置投影矩阵
        gl.uniformMatrix3fv(this.uniformLocs.projection, false, this.projection);

        // 设置裁剪纹理
        const clipTextureInfo = this._createClipTexture(clipRoundedRects);
        gl.uniform1i(this.uniformLocs.clipCount, clipRoundedRects.length);
        if (clipRoundedRects.length > 0) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, clipTextureInfo.texture);
            gl.uniform1i(this.uniformLocs.clipTexture, 0);
            gl.uniform2f(this.uniformLocs.clipTextureSize, clipTextureInfo.width, clipTextureInfo.height);
            gl.uniform1f(this.uniformLocs.maxVal, clipTextureInfo.maxVal);
        }

        // 设置贴图纹理
        let imageData = null;
        if (backgroundImage) {
            imageData = getImageData(backgroundImage);
        }
        gl.uniform1i(this.uniformLocs.useImageTexture, imageData ? 1 : 0);
        if (imageData) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this._createImageTexture(imageData));
            gl.uniform1i(this.uniformLocs.imageTexture, 1);
            // 9-patch 模式
            gl.uniform1i(this.uniformLocs.use9Patch, background9Patch ? 1 : 0);
            if (background9Patch) {
                // background9PatchSize 作为贴图缩放倍数
                const [scaleX, scaleY] = background9PatchSize ?? [1, 1];

                gl.uniform2f(this.uniformLocs.imageSize, imageData.width * scaleX, imageData.height * scaleY);
                gl.uniform4f(this.uniformLocs.image9Patch,
                    background9Patch[0] * scaleX,
                    background9Patch[1] * scaleX,
                    background9Patch[2] * scaleY,
                    background9Patch[3] * scaleY);
            } else {
                // 普通贴图模式
                gl.uniform2f(this.uniformLocs.imageSize, imageData.width, imageData.height);
                gl.uniform2f(this.uniformLocs.imageRepeat, backgroundRepeatX ? 1 : 0, backgroundRepeatY ? 1 : 0);
                gl.uniform1i(this.uniformLocs.useImageSizeRatio, backgroundSize ? 1 : 0);
                if (backgroundSize) {
                    gl.uniform2f(this.uniformLocs.imageSizeRatio, backgroundSize[0], backgroundSize[1]);
                }
            }
        }

        // 生成并上传顶点数据
        const vertexData = generateVertices(roundedRects);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        this._setupVertexAttributes();

        // 绘制
        gl.drawArrays(gl.TRIANGLES, 0, roundedRects.length * 6);

        // 清理临时缓冲区
        gl.deleteBuffer(buffer);
        if (clipTextureInfo.texture) {
            gl.deleteTexture(clipTextureInfo.texture);
        }
    }
}

/**
 * 从 Node 创建圆角矩形渲染数据（可序列化）
 */
export function createRoundedRect(node) {
    const layout = node.yogaNode.getComputedLayout();
    return {
        x: node.x,
        y: node.y,
        width: layout.width,
        height: layout.height,
        borderTopLeftRadius: node.borderTopLeftRadius,
        borderTopRightRadius: node.borderTopRightRadius,
        borderBottomRightRadius: node.borderBottomRightRadius,
        borderBottomLeftRadius: node.borderBottomLeftRadius,
        backgroundColor: node.backgroundColor,
        borderLeftWidth: node.borderLeftWidth,
        borderTopWidth: node.borderTopWidth,
        borderRightWidth: node.borderRightWidth,
        borderBottomWidth: node.borderBottomWidth,
        borderColor: node.borderColor,
        paddingLeft: node.paddingLeft,
        paddingTop: node.paddingTop,
        paddingRight: node.paddingRight,
        paddingBottom: node.paddingBottom
    };
}

/**
 * 创建渲染命令
 * @param {Node} node - Node 树的根节点
 * @returns {Array} 绘制指令的二维数组，每个元素是一个 batch
 */
export function createRenderCommands(node) {
    // 结果：二维数组，每个元素是一个 batch
    const batches = [];

    // 当前 batch 累积器
    let currentBatch = {
        roundedRects: [],  // 存储 Node
        clipRoundedRects: [],
        backgroundImage: null,
        backgroundRepeatX: true,
        backgroundRepeatY: true,
        backgroundSize: null,
        background9Patch: null,
        background9PatchSize: null
    };

    // 当前裁剪链引用（用于比较是否变化）
    let currentClipChain = [];

    // DFS 遍历
    function collectBatches(node) {
        // display: none 的节点不渲染，子节点也不渲染
        if (node.display === 'none') {
            return;
        }

        // 使用节点已计算的 clipChain（由 syncLayoutState 计算）
        const nodeClipChain = node.clipChain || [];
        const clipChainChanged = nodeClipChain !== currentClipChain;

        // 检查是否需要断开 batch
        const hasBackgroundImage = node.backgroundImage !== null;
        const needNewBatch = hasBackgroundImage || clipChainChanged;

        if (needNewBatch) {
            // 提交当前 batch（如果有内容）
            if (currentBatch.roundedRects.length > 0) {
                batches.push({ ...currentBatch });
                currentBatch = {
                    roundedRects: [],
                    clipRoundedRects: [],
                    backgroundImage: null,
                    backgroundRepeatX: true,
                    backgroundRepeatY: true,
                    backgroundSize: null,
                    background9Patch: null,
                    background9PatchSize: null
                };
            }
        }

        // 如果当前节点有背景图，单独一个 batch
        if (hasBackgroundImage) {
            batches.push({
                roundedRects: [createRoundedRect(node)],
                clipRoundedRects: nodeClipChain,
                backgroundImage: node.backgroundImage,
                backgroundRepeatX: node.backgroundRepeatX === 'repeat',
                backgroundRepeatY: node.backgroundRepeatY === 'repeat',
                backgroundSize: node.backgroundSize,
                background9Patch: node.background9Patch,
                background9PatchSize: node.background9PatchSize
            });
            // 不加入 currentBatch，直接处理子节点
        } else {
            // 检查节点是否可见（有背景色或边框）
            const hasVisibleBackground = node.backgroundColor[3] > 0;
            const hasVisibleBorder = node.borderColor[3] > 0 &&
                (node.borderTopWidth > 0 || node.borderRightWidth > 0 ||
                    node.borderBottomWidth > 0 || node.borderLeftWidth > 0);

            if (hasVisibleBackground || hasVisibleBorder) {
                currentBatch.roundedRects.push(createRoundedRect(node));
                currentBatch.clipRoundedRects = nodeClipChain;
            }
        }

        // 更新当前裁剪链
        currentClipChain = nodeClipChain;

        // 递归处理子节点
        for (const child of node.children) {
            collectBatches(child);
        }
    }

    // 开始 DFS
    collectBatches(node);

    // 提交最后一个 batch
    if (currentBatch.roundedRects.length > 0) {
        batches.push(currentBatch);
    }

    return batches;
}
