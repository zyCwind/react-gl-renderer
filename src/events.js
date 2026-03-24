/**
 * @license react-gl-renderer
 * Copyright (c) 2026 391321232@qq.com
 * Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.
 */

function hitTest(root, x, y) {
    if (root.display === 'none') {
        return null;
    }

    const nodeX = root.x;
    const nodeY = root.y;
    const layout = root.yogaNode.getComputedLayout();

    // 直接使用已计算好的 clipChain
    const clipChain = root.clipChain || [];
    for (const { aabbs: { outerAABB } } of clipChain) {
        if (x < outerAABB.minX || x >= outerAABB.maxX ||
            y < outerAABB.minY || y >= outerAABB.maxY) {
            return null;
        }
    }

    const inBounds = x >= nodeX && x < nodeX + layout.width &&
        y >= nodeY && y < nodeY + layout.height;

    for (let i = root.children.length - 1; i >= 0; i--) {
        const hit = hitTest(root.children[i], x, y);
        if (hit) {
            return hit;
        }
    }

    return inBounds ? root.fiber : null;
}

export function createEvents(container) {
    // identifier -> Fiber 映射，用于 pointer capture
    const pointerCaptureMap = {};

    function createEvent(touch, target) {
        return {
            clientX: touch.clientX,
            clientY: touch.clientY,
            identifier: touch.identifier,
            target,
            currentTarget: null,
            isPropagationStopped: false,
            stopPropagation() { this.isPropagationStopped = true; },
            setPointerCapture(identifier) {
                pointerCaptureMap[identifier] = this.currentTarget;
            },
            releasePointerCapture(identifier) {
                delete pointerCaptureMap[identifier];
            }
        };
    }

    function dispatchEvent(target, eventName, touch) {
        if (!target) {
            return;
        }

        // 收集有事件处理器的祖先节点
        const path = [];
        for (let current = target; current; current = current.return) {
            if (current.memoizedProps?.[eventName] || current.memoizedProps?.[eventName + 'Capture']) {
                path.push(current);
            }
        }

        const event = createEvent(touch, target);

        // capture phase: 根 -> 目标
        for (let i = path.length - 1; i >= 0 && !event.isPropagationStopped; i--) {
            event.currentTarget = path[i];
            path[i].memoizedProps?.[eventName + 'Capture']?.(event);
        }

        // bubble phase: 目标 -> 根
        for (let i = 0; i < path.length && !event.isPropagationStopped; i++) {
            event.currentTarget = path[i];
            path[i].memoizedProps?.[eventName]?.(event);
        }
    }

    function handlePointer(name) {
        return (nativeEvent) => {
            const rootNode = container.rootNode;
            if (!rootNode) {
                return;
            }

            const { changedTouches } = nativeEvent;
            for (let i = 0; i < changedTouches.length; i++) {
                const { identifier, clientX, clientY } = changedTouches[i];
                // 检查是否被 capture，被 capture 则跳过 hitTest
                const target = pointerCaptureMap[identifier] ?? hitTest(rootNode, clientX, clientY);

                if (target) {
                    dispatchEvent(target, name, changedTouches[i]);
                }

                // 模拟浏览器隐式释放：pointerup 和 pointercancel 后自动释放 capture
                if (name === 'onPointerUp' || name === 'onPointerCancel') {
                    delete pointerCaptureMap[identifier];
                }
            }
        };
    }

    return { handlePointer };
}
