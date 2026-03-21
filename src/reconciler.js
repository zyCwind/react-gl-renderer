// Copyright (c) 2026 391321232@qq.com
// Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.

import ReactReconciler from 'react-reconciler';
import { deleteImageData } from './assets.js';
import { createEvents } from './events.js';
import { Node, TextNode } from './node.js';
import { createRenderCommands } from './renderer.js';

// 影响测量的文字属性，需要调用 yogaNode.markDirty()
const TEXT_MEASURE_PROPS = {
    text: true,
    fontSize: true,
    fontFamily: true,
    fontWeight: true,
    lineHeight: true,
    wordBreak: true,
    whiteSpace: true
};

const TEXT_PROPS = {
    color: true,
    onMeasureResult: true,
    ...TEXT_MEASURE_PROPS
};

// 样式属性，true 表示影响内容的属性（未设置到 yoga 节点的属性）
const VIEW_PROPS = {
    alignContent: false,
    alignItems: false,
    alignSelf: false,
    aspectRatio: false,
    borderBottomWidth: false,
    borderLeftWidth: false,
    borderRightWidth: false,
    borderTopWidth: false,
    bottom: false,
    boxSizing: false,
    columnGap: false,
    direction: false,
    display: false,
    flex: false,
    flexBasis: false,
    flexDirection: false,
    flexGrow: false,
    flexShrink: false,
    flexWrap: false,
    height: false,
    isReferenceBaseline: false,
    justifyContent: false,
    left: false,
    marginBottom: false,
    marginLeft: false,
    marginRight: false,
    marginTop: false,
    maxHeight: false,
    maxWidth: false,
    minHeight: false,
    minWidth: false,
    overflow: false,
    paddingBottom: false,
    paddingLeft: false,
    paddingRight: false,
    paddingTop: false,
    position: false,
    right: false,
    rowGap: false,
    top: false,
    width: false,
    backgroundColor: true,
    backgroundImage: true,
    backgroundRepeatX: true,
    backgroundRepeatY: true,
    backgroundSize: true,
    background9Patch: true,
    background9PatchSize: true,
    borderColor: true,
    borderTopLeftRadius: true,
    borderTopRightRadius: true,
    borderBottomRightRadius: true,
    borderBottomLeftRadius: true,
    onLayout: true,
    ...TEXT_PROPS
};

/**
 * 比较 props 变化，返回变化的属性
 * @returns {Object|null} 变化的属性集合，无变化返回 null
 */
function diffProps(oldProps, newProps) {
    const changes = {};

    for (const key of Object.keys(VIEW_PROPS)) {
        const oldValue = oldProps[key];
        const newValue = newProps[key];

        if (oldValue !== newValue) {
            changes[key] = newValue;
        }
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 将 Node 转换为 padding-box 区域参数
 * 用于裁剪区域计算
 */
function roundedRectToPaddingBoxRegion(node) {
    const { x, y } = node;
    const { width, height } = node.yogaNode.getComputedLayout();
    const [borderTopLeftRadiusX, borderTopLeftRadiusY] = node.borderTopLeftRadius;
    const [borderTopRightRadiusX, borderTopRightRadiusY] = node.borderTopRightRadius;
    const [borderBottomRightRadiusX, borderBottomRightRadiusY] = node.borderBottomRightRadius;
    const [borderBottomLeftRadiusX, borderBottomLeftRadiusY] = node.borderBottomLeftRadius;
    const { borderLeftWidth, borderTopWidth, borderRightWidth, borderBottomWidth } = node;
    const { paddingLeft, paddingTop, paddingRight, paddingBottom } = node;
    // CSS box-sizing: border-box
    // 用户传入的 width/height 是 border-box 尺寸
    const minBorderBoxWidth = borderLeftWidth + borderRightWidth + paddingLeft + paddingRight;
    const minBorderBoxHeight = borderTopWidth + borderBottomWidth + paddingTop + paddingBottom;

    // 修正 border-box 尺寸
    const borderBoxWidth = Math.max(width, minBorderBoxWidth);
    const borderBoxHeight = Math.max(height, minBorderBoxHeight);

    // padding-box = border-box - border
    const paddingBoxWidth = borderBoxWidth - borderLeftWidth - borderRightWidth;
    const paddingBoxHeight = borderBoxHeight - borderTopWidth - borderBottomWidth;

    // ===== CSS 规范圆角缩放 =====
    // CSS 规范：同一边上相邻两角的半径之和不能超过该边长度
    // 如果超过，所有相关半径按比例缩放

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
    const fixedTopLeftX = borderTopLeftRadiusX * topEdgeRatio;
    const fixedTopLeftY = borderTopLeftRadiusY * leftEdgeRatio;
    const fixedTopRightX = borderTopRightRadiusX * topEdgeRatio;
    const fixedTopRightY = borderTopRightRadiusY * rightEdgeRatio;
    const fixedBottomRightX = borderBottomRightRadiusX * bottomEdgeRatio;
    const fixedBottomRightY = borderBottomRightRadiusY * rightEdgeRatio;
    const fixedBottomLeftX = borderBottomLeftRadiusX * bottomEdgeRatio;
    const fixedBottomLeftY = borderBottomLeftRadiusY * leftEdgeRatio;

    // padding-box 圆角 = border-box 圆角 - 对应边框宽度 (CSS 规范)
    const paddingBoxRadii = [
        [Math.max(0, fixedTopLeftX - borderLeftWidth), Math.max(0, fixedTopLeftY - borderTopWidth)],
        [Math.max(0, fixedTopRightX - borderRightWidth), Math.max(0, fixedTopRightY - borderTopWidth)],
        [Math.max(0, fixedBottomRightX - borderRightWidth), Math.max(0, fixedBottomRightY - borderBottomWidth)],
        [Math.max(0, fixedBottomLeftX - borderLeftWidth), Math.max(0, fixedBottomLeftY - borderBottomWidth)]
    ];

    // 返回 padding-box 参数（用于裁剪区域）
    return {
        x: x + borderLeftWidth,
        y: y + borderTopWidth,
        width: paddingBoxWidth,
        height: paddingBoxHeight,
        radii: paddingBoxRadii
    };
}

/**
 * 计算裁剪区域的 AABB（轴对齐边界框）
 * 返回两个 AABB：
 * - outerAABB: padding-box 的完整边界（用于判断是否被其他区域包含）
 * - innerAABB: padding-box 去掉圆角后的内部矩形（用于判断是否包含其他区域）
 * @param {Object} paddingBoxRegion - padding-box 参数 { x, y, width, height, radii }
 */
function getPaddingBoxAABBs(paddingBoxRegion) {
    // 外部 AABB
    const outerAABB = {
        minX: paddingBoxRegion.x,
        minY: paddingBoxRegion.y,
        maxX: paddingBoxRegion.x + paddingBoxRegion.width,
        maxY: paddingBoxRegion.y + paddingBoxRegion.height
    };
    // 内部 AABB：从每边减去对应的最大圆角半径
    const maxRadiusLeft = Math.max(paddingBoxRegion.radii[0][0], paddingBoxRegion.radii[3][0]); // 左上和左下的水平半径
    const maxRadiusRight = Math.max(paddingBoxRegion.radii[1][0], paddingBoxRegion.radii[2][0]); // 右上和右下的水平半径
    const maxRadiusTop = Math.max(paddingBoxRegion.radii[0][1], paddingBoxRegion.radii[1][1]); // 左上和右上的垂直半径
    const maxRadiusBottom = Math.max(paddingBoxRegion.radii[2][1], paddingBoxRegion.radii[3][1]); // 右下和左下的垂直半径
    const innerAABB = {
        minX: paddingBoxRegion.x + maxRadiusLeft,
        minY: paddingBoxRegion.y + maxRadiusTop,
        maxX: paddingBoxRegion.x + paddingBoxRegion.width - maxRadiusRight,
        maxY: paddingBoxRegion.y + paddingBoxRegion.height - maxRadiusBottom
    };
    return { outerAABB, innerAABB };
}

/**
 * 判断 AABB a 是否完全包含 AABB b
 */
function aabbContains(a, b) {
    return a.minX <= b.minX && a.minY <= b.minY && a.maxX >= b.maxX && a.maxY >= b.maxY;
}

/**
 * 获取节点的 border-box AABB
 */
function getBorderBoxAABB(node) {
    const { x, y } = node;
    const { width, height } = node.yogaNode.getComputedLayout();
    return { minX: x, minY: y, maxX: x + width, maxY: y + height };
}

/**
 * 合并两个 AABB
 */
function mergeAABB(a, b) {
    if (!a) {
        return b;
    }
    return {
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY)
    };
}

/**
 * 两个 AABB 的交集
 */
function intersectAABB(a, b) {
    const minX = Math.max(a.minX, b.minX);
    const minY = Math.max(a.minY, b.minY);
    const maxX = Math.min(a.maxX, b.maxX);
    const maxY = Math.min(a.maxY, b.maxY);
    if (minX >= maxX || minY >= maxY) {
        return null;
    }
    return { minX, minY, maxX, maxY };
}

/**
 * 判断节点是否可作为重绘起点
 */
function canBeRepaintRoot(node, dirtyRegion) {
    if (node.display === 'none') {
        return false;
    }
    if (node.backgroundColor[3] <= 0) {
        return false;
    }
    const paddingBoxRegion = roundedRectToPaddingBoxRegion(node);
    const { innerAABB } = getPaddingBoxAABBs(paddingBoxRegion);
    return aabbContains(innerAABB, dirtyRegion);
}

/**
 * DFS：计算布局 + 找重绘起点
 * 返回值：需要向上冒泡的脏区，null 表示不需要继续冒泡
 */
function processNode(node, parent = null) {
    // === 向下：计算坐标和 clipChain ===
    if (node.yogaNode.hasNewLayout()) {
        const layout = node.yogaNode.getComputedLayout();
        node.x = parent ? parent.x + layout.left : layout.left;
        node.y = parent ? parent.y + layout.top : layout.top;
        node.dirty = true;
        // onLayout 回调
        if (node.onLayout) {
            node.onLayout(layout);
        }
    }
    if (node.overflow === 'hidden') {
        if (node.yogaNode.hasNewLayout()) {
            node.clipChain = addClipRect(parent ? parent.clipChain : [], node);
        }
    } else if (parent) {
        node.clipChain = parent.clipChain;
    }

    // === 递归子节点，收集脏区 ===
    let dirtyRegion = null;
    for (const child of node.children) {
        const childRegion = processNode(child, node);
        if (childRegion) {
            dirtyRegion = mergeAABB(dirtyRegion, childRegion);
        }
    }
    if (node.dirty) {
        dirtyRegion = mergeAABB(dirtyRegion, getBorderBoxAABB(node));
        // 处理 TextNode 回调
        if (node instanceof TextNode && node.textDirty && node.onMeasureResult) {
            node.onMeasureResult(node.measureResult);
        }
    }
    if (!dirtyRegion) {
        return null;
    }

    // === overflow hidden 裁剪 ===
    if (node.overflow === 'hidden') {
        dirtyRegion = intersectAABB(dirtyRegion, getBorderBoxAABB(node));
        if (!dirtyRegion) {
            return null;
        }
    }

    node.dirty = true;
    if (canBeRepaintRoot(node, dirtyRegion)) {
        return null;
    }
    return dirtyRegion;
}

/**
 * 将新裁剪区域加入裁剪链，并进行剔除优化
 * @param {Array} clipChain - 当前的裁剪链（存储 { paddingBoxRegion, aabbs }）
 * @param {Node} node - 新的裁剪节点
 * @returns {Array} 新的裁剪链，如果无变化则返回原引用
 */
function addClipRect(clipChain, node) {
    // 预计算 paddingBoxRegion 和 aabbs
    const paddingBoxRegion = roundedRectToPaddingBoxRegion(node);
    const aabbs = getPaddingBoxAABBs(paddingBoxRegion);

    // 第一个循环：检查新区域是否无贡献
    for (const existing of clipChain) {
        if (aabbContains(aabbs.innerAABB, existing.aabbs.outerAABB)) {
            // D.innerAABB ⊃ A.outerAABB → D 更大，无贡献
            return clipChain;
        }
    }

    // 第二个循环：剔除被新区域包含的现有区域
    const newChain = [];
    for (const existing of clipChain) {
        if (aabbContains(existing.aabbs.innerAABB, aabbs.outerAABB)) {
            // A.innerAABB ⊃ D.outerAABB → A 更大，可剔除
        } else {
            newChain.push(existing);
        }
    }

    newChain.push({ paddingBoxRegion, aabbs });
    return newChain;
}

// 渲染脏节点（只渲染 dirty 节点自身）
function renderDirtyNodes(node, renderer) {
    if (node.dirty) {
        const batches = createRenderCommands(node);
        for (const batch of batches) {
            renderer.render(batch);
        }
        return; // 终止遍历，不再深入子节点
    }

    // 节点不脏，继续递归子节点
    for (const child of node.children) {
        renderDirtyNodes(child, renderer);
    }
}

// 清理脏标记
function clearFlags(node) {
    if (node.yogaNode.hasNewLayout()) {
        node.yogaNode.markLayoutSeen();
    }
    node.dirty = false;
    if (node instanceof TextNode) {
        node.textDirty = false;
    }
    for (const child of node.children) {
        clearFlags(child);
    }
}

const reconciler = ReactReconciler({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,

    // ===== 创建阶段 =====

    createInstance(type, props, rootContainer, hostContext, internalHandle) {
        const node = type === 'text' ? new TextNode(props) : new Node(props);
        node.fiber = internalHandle;
        return node;
    },

    createTextInstance(text, rootContainer, hostContext, internalHandle) {
        return {};
    },

    appendInitialChild(parentInstance, child) {
        if (child instanceof Node) {
            const index = parentInstance.children.length;
            parentInstance.children.push(child);
            parentInstance.yogaNode.insertChild(child.yogaNode, index);
        }
    },

    finalizeInitialChildren(instance, type, props, rootContainer, hostContext) {
        return false;
    },

    commitMount(instance, type, props, internalInstanceHandle) {
    },

    prepareUpdate(instance, type, oldProps, newProps, rootContainer, hostContext) {
        return diffProps(oldProps, newProps);
    },

    shouldSetTextContent(type, props) {
        return false;
    },

    // ===== 上下文 =====

    getRootHostContext(rootContainer) {
        return {};
    },

    getChildHostContext(parentHostContext, type, rootContainer) {
        return parentHostContext;
    },

    getPublicInstance(instance) {
        return instance;
    },

    // ===== Commit 阶段 =====

    preparePortalMount(containerInfo) {
    },

    prepareForCommit(containerInfo) {
        return null;
    },

    resetAfterCommit(containerInfo) {
        const root = containerInfo.rootNode;
        const renderer = containerInfo.renderer;

        if (!root) {
            return;
        }

        // 布局计算
        if (root.yogaNode.isDirty()) {
            root.yogaNode.calculateLayout(
                renderer.canvas.width,
                renderer.canvas.height
            );
        }

        // DFS：计算布局 + 找重绘起点
        processNode(root);

        // 统一渲染
        if (root.dirty) {
            renderer.clear();
        }
        renderDirtyNodes(root, renderer);

        clearFlags(root);
    },

    // ===== Mutation 方法 =====

    appendChild(parentInstance, child) {
        if (child instanceof Node) {
            const index = parentInstance.children.length;
            parentInstance.children.push(child);
            parentInstance.yogaNode.insertChild(child.yogaNode, index);
        }
    },

    appendChildToContainer(container, child) {
        container.rootNode = child;
    },

    insertBefore(parentInstance, child, beforeChild) {
        if (child instanceof Node) {
            const index = parentInstance.children.indexOf(beforeChild);
            if (index >= 0) {
                parentInstance.children.splice(index, 0, child);
                parentInstance.yogaNode.insertChild(child.yogaNode, index);
            }
        }
    },

    insertInContainerBefore(container, child, beforeChild) {
    },

    removeChild(parentInstance, child) {
        if (child instanceof Node) {
            const index = parentInstance.children.indexOf(child);
            if (index >= 0) {
                parentInstance.children.splice(index, 1);
                parentInstance.yogaNode.removeChild(child.yogaNode);
            }
        }
    },

    removeChildFromContainer(container, child) {
        if (container.rootNode === child) {
            container.rootNode = null;
        }
    },

    commitTextUpdate(textInstance, oldText, newText) {
    },

    resetTextContent(instance) {
    },

    commitUpdate(instance, updatePayload, type, prevProps, nextProps, internalHandle) {
        if (!updatePayload) {
            return;
        }

        for (const [key, value] of Object.entries(updatePayload)) {
            if (key === 'backgroundImage') {
                if (instance.backgroundImage) {
                    deleteImageData(instance.backgroundImage);
                }
            }
            instance[key] = value;
            // onMeasureResult 和 onLayout 是回调，不影响 dirty 标记
            if (key === 'onLayout' || key === 'onMeasureResult') {
                continue;
            }
            if (VIEW_PROPS[key]) {
                instance.dirty = true;
            }
            if (instance instanceof TextNode) {
                if (TEXT_PROPS[key]) {
                    instance.textDirty = true;
                }
                if (TEXT_MEASURE_PROPS[key]) {
                    instance.yogaNode.markDirty();
                }
            }
        }

        instance.applyStyles();
    },

    hideInstance(instance) {
        instance.display = 'none';
        instance.applyStyles();
    },

    hideTextInstance(textInstance) {
    },

    unhideInstance(instance, props) {
        instance.display = 'flex';
        instance.applyStyles();
    },

    unhideTextInstance(textInstance, text) {
    },

    clearContainer(container) {
        container.rootNode = null;
    },

    detachDeletedInstance(node) {
        if (node instanceof Node) {
            if (node.backgroundImage) {
                deleteImageData(node.backgroundImage);
                node.backgroundImage = null;
            }
            if (node.yogaNode) {
                node.yogaNode.free();
                node.yogaNode = null;
            }
        }
    },

    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: undefined,
    isPrimaryRenderer: true,
    getCurrentEventPriority() {
        return 16;
    },

    // ===== DevTools 支持 =====

    getInstanceFromNode(node) {
        return null;
    },

    beforeActiveInstanceBlur() {
    },

    afterActiveInstanceBlur() {
    },

    prepareScopeUpdate(scopeInstance, instance) {
    },

    getInstanceFromScope(scopeInstance) {
        return null;
    },
});

// DevTools 注册
reconciler.injectIntoDevTools({
    bundleType: 1,
    version: '1.0.0',
    rendererPackageName: 'react-gl-renderer'
});

export function createRoot(renderer) {
    const container = {
        rootNode: null,
        renderer
    };

    const { handlePointer } = createEvents(container);

    const fiberRoot = reconciler.createContainer(
        container,
        0, // ConcurrentRoot
        null, // hydrationCallbacks
        false, // isStrictMode
        null, // concurrentUpdatesByDefaultOverride
        '', // identifierPrefix
        null, // onRecoverableError
        null // transitionCallbacks
    );

    return {
        render(element) {
            reconciler.updateContainer(element, fiberRoot, null, null);
        },
        handlePointer
    };
}
