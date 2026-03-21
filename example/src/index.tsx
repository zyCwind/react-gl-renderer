// Copyright (c) 2026 391321232@qq.com
// Licensed under BSL-1.1 (see LICENSE). Changes to MIT after 2099-12-31.

import { StrictMode, useRef, useState } from 'react';
import { createRoot, GLRenderer3D, PointerEvent, Text, TextInput, View } from 'react-gl-renderer';
import { createCanvas } from 'react-gl-renderer/platform.web.js';
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

// 可拖动方块组件
function Draggable() {
    const [left, setLeft] = useState(0);
    const [top, setTop] = useState(0);
    const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0, dragging: false });

    return (
        <View
            style={{
                position: 'absolute',
                left,
                top,
                width: 80,
                height: 80,
                borderTopLeftRadius: [10, 10],
                borderTopRightRadius: [10, 10],
                borderBottomRightRadius: [10, 10],
                borderBottomLeftRadius: [10, 10],
                backgroundColor: [1.0, 0.0, 0.0, 1.0],
                borderTopWidth: 2,
                borderRightWidth: 2,
                borderBottomWidth: 2,
                borderLeftWidth: 2,
                borderColor: [0.5, 1.0, 0.0, 1.0]
            }}
            onPointerDown={(e: PointerEvent) => {
                e.setPointerCapture(e.pointerId);
                dragRef.current = {
                    startX: e.offsetX,
                    startY: e.offsetY,
                    startLeft: left,
                    startTop: top,
                    dragging: true
                };
            }}
            onPointerMove={(e: PointerEvent) => {
                if (!dragRef.current.dragging) return;
                const dx = e.offsetX - dragRef.current.startX;
                const dy = e.offsetY - dragRef.current.startY;
                setLeft(dragRef.current.startLeft + dx);
                setTop(dragRef.current.startTop + dy);
            }}
            onPointerUp={() => {
                dragRef.current.dragging = false;
            }}
        />
    );
}

// TextInput 测试组件
function UserInput() {
    const [text, setText] = useState('');
    const [password, setPassword] = useState('');

    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingTop: 20,
                paddingLeft: 20,
                paddingRight: 20
            }}
        >
            <TextInput
                style={{
                    width: 150,
                    height: 30,
                    borderTopLeftRadius: [5, 5],
                    borderTopRightRadius: [5, 5],
                    borderBottomRightRadius: [5, 5],
                    borderBottomLeftRadius: [5, 5],
                    backgroundColor: [1, 1, 1, 1],
                    borderTopWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderLeftWidth: 1,
                    borderColor: [0.7, 0.7, 0.7, 1],
                    paddingLeft: 8,
                    paddingRight: 8,
                    fontSize: 14,
                    color: [0, 0, 0, 1]
                }}
                value={text}
                onChange={setText}
                placeholder="请输入..."
                placeholderColor={[0.6, 0.6, 0.6, 1]}
            />
            <TextInput
                style={{
                    width: 150,
                    height: 30,
                    borderTopLeftRadius: [5, 5],
                    borderTopRightRadius: [5, 5],
                    borderBottomRightRadius: [5, 5],
                    borderBottomLeftRadius: [5, 5],
                    backgroundColor: [1, 1, 1, 1],
                    borderTopWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderLeftWidth: 1,
                    borderColor: [0.7, 0.7, 0.7, 1],
                    paddingLeft: 8,
                    paddingRight: 8,
                    fontSize: 14,
                    color: [0, 0, 0, 1]
                }}
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="密码..."
                placeholderColor={[0.6, 0.6, 0.6, 1]}
            />
        </View>
    );
}

const canvas = createCanvas();

const scene = new Scene();
const camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);

camera.position.z = 5;

const renderer = new WebGLRenderer({
    canvas
});

renderer.autoClear = false;

const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);
scene.add(cube);

const reactRenderer = new GLRenderer3D(renderer);

const fsQuad = new FullScreenQuad(new MeshBasicMaterial({
    map: reactRenderer.renderTarget.texture,
    transparent: true,
    side: DoubleSide,
    depthWrite: false
}));

function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.clear();
    renderer.render(scene, camera);

    fsQuad.render(renderer);
}

animate();

const {
    render,
    handlePointer
} = createRoot(reactRenderer);

// 初始化事件系统
canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // 阻止默认行为，防止 canvas 获得焦点

    canvas.setPointerCapture(e.pointerId);
    handlePointer('onPointerDown')(e);
});
canvas.addEventListener('pointermove', handlePointer('onPointerMove'));
canvas.addEventListener('pointerup', handlePointer('onPointerUp'));
canvas.addEventListener('pointercancel', handlePointer('onPointerCancel'));

render(
    <StrictMode>
        <View
            style={{
                flexDirection: 'column'
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'flex-start',
                    paddingTop: 20,
                    paddingLeft: 20,
                    paddingRight: 20,
                    paddingBottom: 20
                }}
            >
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderTopLeftRadius: [10, 10],
                        borderTopRightRadius: [10, 10],
                        borderBottomRightRadius: [10, 10],
                        borderBottomLeftRadius: [10, 10],
                        backgroundColor: [1.0, 0.0, 0.0, 1.0],
                        backgroundImage: './star.png',
                        backgroundSize: [0.5, 0.5],
                        backgroundRepeatX: 'repeat',
                        backgroundRepeatY: 'repeat',
                        borderTopWidth: 2,
                        borderRightWidth: 2,
                        borderBottomWidth: 2,
                        borderLeftWidth: 2,
                        borderColor: [0.5, 0.0, 0.0, 1.0]
                    }}
                    onPointerDown={(e: PointerEvent) => console.log('red box pointer down', e)}
                />
                <View
                    style={{
                        width: 120,
                        height: 120,
                        borderTopLeftRadius: [15, 15],
                        borderTopRightRadius: [15, 15],
                        borderBottomRightRadius: [15, 15],
                        borderBottomLeftRadius: [15, 15],
                        backgroundColor: [0.0, 0.0, 1.0, 1.0],
                        borderTopWidth: 3,
                        borderRightWidth: 3,
                        borderBottomWidth: 3,
                        borderLeftWidth: 3,
                        borderColor: [0.0, 0.0, 0.5, 1.0],
                        paddingTop: 10,
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingBottom: 10,
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-end'
                    }}
                    onPointerDown={(e: PointerEvent) => console.log('blue box pointer down', e)}
                >
                    <View
                        style={{
                            width: 50,
                            height: 50,
                            borderTopLeftRadius: [8, 8],
                            borderTopRightRadius: [8, 8],
                            borderBottomRightRadius: [8, 8],
                            borderBottomLeftRadius: [8, 8],
                            backgroundColor: [1.0, 1.0, 0.0, 1.0],
                            borderTopWidth: 2,
                            borderRightWidth: 2,
                            borderBottomWidth: 2,
                            borderLeftWidth: 2,
                            borderColor: [0.7, 0.6, 0.0, 1.0]
                        }}
                        onPointerDown={(e: PointerEvent) => {
                            console.log('yellow box pointer down', e);
                            e.stopPropagation();
                        }}
                    />
                </View>
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderTopLeftRadius: [10, 10],
                        borderTopRightRadius: [10, 10],
                        borderBottomRightRadius: [10, 10],
                        borderBottomLeftRadius: [10, 10],
                        backgroundColor: [0.0, 1.0, 0.0, 1.0],
                        borderTopWidth: 2,
                        borderRightWidth: 2,
                        borderBottomWidth: 2,
                        borderLeftWidth: 2,
                        borderColor: [0.0, 0.5, 0.0, 1.0]
                    }}
                    onPointerDown={(e: PointerEvent) => console.log('green box pointer down', e)}
                />
                <View
                    style={{
                        width: 150,
                        height: 80,
                        borderTopLeftRadius: [10, 10],
                        borderTopRightRadius: [10, 10],
                        borderBottomRightRadius: [10, 10],
                        borderBottomLeftRadius: [10, 10],
                        backgroundColor: [1, 1, 1, 1.0],
                        paddingTop: 10,
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingBottom: 10,
                        overflow: 'hidden'
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'sans-serif',
                            fontWeight: 'normal',
                            lineHeight: 1.5,
                            color: [0.0, 0.0, 0.0, 1.0],
                            wordBreak: 'keep-all'
                        }}
                    >
                        Hello World 你好世界
                    </Text>
                </View>
            </View>
            <UserInput />
            <Draggable />
            <View
                style={{
                    width: 120,
                    height: 80,
                    borderTopWidth: 10,
                    borderRightWidth: 20,
                    borderBottomWidth: 10,
                    borderLeftWidth: 10,
                    borderTopLeftRadius: [10, 10],
                    borderTopRightRadius: [20, 20],
                    borderBottomRightRadius: [10, 10],
                    borderBottomLeftRadius: [20, 20],
                    borderColor: [1.0, 1.0, 1.0, 1.0],
                    backgroundColor: [1, 0, 0, 1],
                    backgroundImage: './r.9.png',
                    background9Patch: [20, 120, 20, 60],
                    marginTop: 20,
                }}
            />
        </View>
    </StrictMode>
);
