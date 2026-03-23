/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

import {
    BufferGeometry,
    Color,
    DataTexture,
    DoubleSide,
    InterleavedBuffer,
    InterleavedBufferAttribute,
    Matrix3,
    Mesh,
    OrthographicCamera,
    RawShaderMaterial,
    Texture,
    Vector2,
    WebGLRenderTarget
} from 'three';
import { getImageData } from './assets.js';
import {
    fragmentShaderSource,
    generateVertices,
    vertexShaderSource
} from './renderer.js';

// 共享材质实例
const material = new RawShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    uniforms: {
        u_clipCount: { value: 0 },
        u_clipTexture: { value: null },
        u_clipTextureSize: { value: new Vector2(1, 1) },
        u_image9Patch: { value: [0, 0, 0, 0] },
        u_imageRepeat: { value: new Vector2(0, 0) },
        u_imageSize: { value: new Vector2(1, 1) },
        u_imageSizeRatio: { value: new Vector2(1, 1) },
        u_imageTexture: { value: null },
        u_maxVal: { value: 1 },
        u_projection: { value: new Matrix3() },
        u_use9Patch: { value: false },
        u_useImageSizeRatio: { value: false },
        u_useImageTexture: { value: false }
    },
    transparent: true,
    side: DoubleSide,
    depthWrite: false
});

// 创建裁剪纹理
// clipChain 存储 { paddingBoxRegion, aabbs }，直接使用 paddingBoxRegion
function createClipTexture(clipChain) {
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

    const texture = new DataTexture(data, textureWidth, textureHeight);
    texture.needsUpdate = true;

    return { texture, width: textureWidth, height: textureHeight, maxVal };
}

function createImageTexture(imageData) {
    if (imageData.data) {
        // 使用 { width, height, data } 创建 DataTexture（文字贴图）
        const texture = new DataTexture(
            new Uint8Array(imageData.data),
            imageData.width,
            imageData.height
        );
        texture.needsUpdate = true;
        return texture;
    } else {
        // 使用 HTMLImageElement 创建 Texture
        const texture = new Texture(imageData);
        texture.needsUpdate = true;
        return texture;
    }
}

/**
 * UI Mesh 类 - 表示一个渲染 batch
 */
class UI extends Mesh {
    clipCount = 0;
    clipTexture = null;
    clipTextureSize = new Vector2(1, 1);
    image9Patch = [0, 0, 0, 0];
    imageRepeat = new Vector2(0, 0);
    imageSize = new Vector2(1, 1);
    imageSizeRatio = new Vector2(1, 1);
    imageTexture = null;
    maxVal = 1;
    use9Patch = false;
    useImageSizeRatio = false;
    useImageTexture = false;

    constructor(options) {
        const geometry = new BufferGeometry();
        super(geometry, material);

        this.frustumCulled = false;  // 禁用视锥体剔除

        // 创建几何体
        const { roundedRects, clipRoundedRects, backgroundImage, backgroundRepeatX, backgroundRepeatY, backgroundSize, background9Patch, background9PatchSize } = options;
        if (roundedRects.length === 0) {
            return;
        }

        const vertexData = generateVertices(roundedRects);
        const stride = 26;
        const interleavedBuffer = new InterleavedBuffer(vertexData, stride);

        this.geometry.setAttribute('a_position', new InterleavedBufferAttribute(interleavedBuffer, 2, 0));
        this.geometry.setAttribute('a_color', new InterleavedBufferAttribute(interleavedBuffer, 4, 2));
        this.geometry.setAttribute('a_sdf0', new InterleavedBufferAttribute(interleavedBuffer, 4, 6));
        this.geometry.setAttribute('a_sdf1', new InterleavedBufferAttribute(interleavedBuffer, 4, 10));
        this.geometry.setAttribute('a_sdf2', new InterleavedBufferAttribute(interleavedBuffer, 4, 14));
        this.geometry.setAttribute('a_borderWidth', new InterleavedBufferAttribute(interleavedBuffer, 4, 18));
        this.geometry.setAttribute('a_borderColor', new InterleavedBufferAttribute(interleavedBuffer, 4, 22));
        this.geometry.setDrawRange(0, roundedRects.length * 6);

        // 创建纹理
        const clipTextureInfo = createClipTexture(clipRoundedRects);
        this.clipTexture = clipTextureInfo.texture;
        this.clipTextureSize.set(clipTextureInfo.width, clipTextureInfo.height);
        this.maxVal = clipTextureInfo.maxVal;
        this.clipCount = clipRoundedRects.length;

        // 设置贴图纹理
        let imageData = null;
        if (backgroundImage) {
            imageData = getImageData(backgroundImage);
        }
        if (imageData) {
            this.imageTexture = createImageTexture(imageData);
            this.useImageTexture = true;
            if (background9Patch) {
                this.use9Patch = true;
                const [scaleX, scaleY] = background9PatchSize ?? [1, 1];
                this.image9Patch = [
                    background9Patch[0] * scaleX,
                    background9Patch[1] * scaleX,
                    background9Patch[2] * scaleY,
                    background9Patch[3] * scaleY
                ];
                this.imageSize.set(
                    imageData.width * scaleX,
                    imageData.height * scaleY
                );
            } else {
                this.imageSize.set(imageData.width, imageData.height);
                this.imageRepeat.set(
                    backgroundRepeatX ? 1 : 0,
                    backgroundRepeatY ? 1 : 0
                );
                if (backgroundSize) {
                    this.useImageSizeRatio = true;
                    this.imageSizeRatio = new Vector2(backgroundSize[0], backgroundSize[1]);
                }
            }
        }
    }

    /**
     * 渲染前回调 - 更新 uniforms
     */
    onBeforeRender(renderer, scene, camera, geometry, material, group) {
        const uniforms = material.uniforms;

        // 从 camera 获取投影矩阵 (OrthographicCamera)
        const m = camera.projectionMatrix.elements;
        uniforms.u_projection.value.set(
            m[0], m[4], m[12],
            m[1], m[5], m[13],
            m[3], m[7], m[15]
        );

        // 更新裁剪纹理
        uniforms.u_clipCount.value = this.clipCount;
        if (this.clipCount > 0) {
            uniforms.u_clipTexture.value = this.clipTexture;
            uniforms.u_clipTextureSize.value.copy(this.clipTextureSize);
            uniforms.u_maxVal.value = this.maxVal;
        }

        // 更新背景图片纹理
        uniforms.u_useImageTexture.value = this.useImageTexture;
        if (this.useImageTexture) {
            uniforms.u_imageTexture.value = this.imageTexture;
            uniforms.u_imageSize.value.copy(this.imageSize);
            uniforms.u_use9Patch.value = this.use9Patch;
            if (this.use9Patch) {
                uniforms.u_image9Patch.value = this.image9Patch;
            } else {
                uniforms.u_imageRepeat.value.copy(this.imageRepeat);
                uniforms.u_useImageSizeRatio.value = this.useImageSizeRatio;
                if (this.useImageSizeRatio) {
                    uniforms.u_imageSizeRatio.value.copy(this.imageSizeRatio);
                }
            }
        }
    }
}

export class GLRenderer3D {
    constructor(renderer) {
        this.renderer = renderer;
        this.canvas = renderer.domElement;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // 创建正交相机，坐标系：原点左上角，X 向右，Y 向下
        // Three.js 正交相机 Y 轴向上，left/right/top/bottom 对应裁剪平面
        // left=0, right=width, top=0, bottom=height 实现 Y 向下
        this.camera = new OrthographicCamera(0, width, 0, height, 0.1, 100);
        this.camera.position.z = 1;

        // 持有的 RenderTarget
        this.renderTarget = new WebGLRenderTarget(width, height);
    }

    clear(r = 0, g = 0, b = 0, a = 0) {
        const currentRenderTarget = this.renderer.getRenderTarget();
        const alpha = this.renderer.getClearAlpha();
        const color = this.renderer.getClearColor(new Color());

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.setClearColor(new Color(r, g, b), a);
        this.renderer.clear();

        this.renderer.setClearColor(color, alpha);
        this.renderer.setRenderTarget(currentRenderTarget);
    }

    render(options) {
        const { roundedRects = [] } = options;

        if (roundedRects.length === 0) {
            return;
        }

        const ui = new UI(options);

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(ui, this.camera);
        this.renderer.setRenderTarget(null);

        ui.removeFromParent();
        ui.geometry.dispose();
        if (ui.clipTexture) {
            ui.clipTexture.dispose();
        }
        if (ui.imageTexture) {
            ui.imageTexture.dispose();
        }
    }
}
