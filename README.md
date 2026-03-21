# react-gl-renderer

[![npm version](https://img.shields.io/npm/v/react-gl-renderer.svg)](https://www.npmjs.com/package/react-gl-renderer)

一个基于 WebGL 的自定义 React 渲染器，使用 GL 渲染带有 CSS 风格样式的 UI 组件。

## 前言

如果这个项目对你有帮助，欢迎请作者喝杯咖啡：[爱发电](https://ifdian.net/a/zycwind)。

QQ交流群：1077899021

## 主要功能

- **局部重绘** - 脏区检测，只重绘变化区域
- **Flexbox 布局** - 通过 Yoga Layout 实现完整的 Flexbox 布局引擎
- **CSS 风格样式** - 支持边框、圆角、内边距、背景色/图片等丰富的样式属性
- **9-Patch 支持** - 可拉伸的背景图片，适合按钮、对话框等 UI 元素
- **React DevTools 支持** - 完整的 React 开发工具支持
- **3D 场景集成** - 可与 Three.js 无缝集成，将 UI 渲染到 3D 场景中

## 安装

```bash
npm install react-gl-renderer
```

## 快速开始

```tsx
import { StrictMode } from 'react';
import { createRoot, GLRenderer, View, Text, TextInput } from 'react-gl-renderer';
import { createCanvas } from 'react-gl-renderer/platform.web.js';

const canvas = createCanvas();
const renderer = new GLRenderer(canvas);

const { render, handlePointer } = createRoot(renderer);

// 初始化事件系统
canvas.addEventListener('pointerdown', handlePointer('onPointerDown'));
canvas.addEventListener('pointermove', handlePointer('onPointerMove'));
canvas.addEventListener('pointerup', handlePointer('onPointerUp'));
canvas.addEventListener('pointercancel', handlePointer('onPointerCancel'));

render(
  <StrictMode>
    <View
      style={{
        flexDirection: 'column',
        padding: 20
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          backgroundColor: [1, 0, 0, 1],
          borderTopLeftRadius: [10, 10],
          borderTopRightRadius: [10, 10],
          borderBottomRightRadius: [10, 10],
          borderBottomLeftRadius: [10, 10],
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
          borderColor: [0.5, 0, 0, 1]
        }}
      />
      <Text style={{ fontSize: 16, color: [0, 0, 0, 1] }}>
        Hello World
      </Text>
    </View>
  </StrictMode>
);
```

## 与 Three.js 集成

```tsx
import { createRoot, GLRenderer3D } from 'react-gl-renderer';
import { createCanvas } from 'react-gl-renderer/platform.web.js';
import { WebGLRenderer } from 'three';

const canvas = createCanvas();
const threeRenderer = new WebGLRenderer({ canvas });
const reactRenderer = new GLRenderer3D(threeRenderer);

const { render, handlePointer } = createRoot(reactRenderer);

// 渲染结果存储在 reactRenderer.renderTarget 中
// 可用于后处理或作为纹理贴到 3D 物体上
```

## 核心组件

### View

容器组件，支持丰富的样式属性：

```tsx
<View
  style={{
    width: 100,
    height: 100,
    backgroundColor: [1, 0, 0, 1],
    borderTopLeftRadius: [10, 10],
    borderTopRightRadius: [20, 20],
    borderBottomRightRadius: [10, 10],
    borderBottomLeftRadius: [20, 20],
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: [1, 1, 1, 1],
    backgroundImage: './image.png',
    overflow: 'hidden'
  }}
  onPointerDown={(e) => console.log('clicked', e)}
/>
```

### Text

文字组件，支持自动换行和多种字体样式：

```tsx
<Text
  style={{
    fontSize: 16,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    lineHeight: 1.5,
    color: [0, 0, 0, 1],
    wordBreak: 'break-all'
  }}
>
  Hello World 你好世界
</Text>
```

### TextInput

文本输入组件，支持单行/多行和密码模式：

```tsx
<TextInput
  style={{
    width: 200,
    height: 30,
    backgroundColor: [1, 1, 1, 1],
    borderTopLeftRadius: [5, 5],
    borderTopRightRadius: [5, 5],
    borderBottomRightRadius: [5, 5],
    borderBottomLeftRadius: [5, 5],
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: [0.7, 0.7, 0.7, 1],
    paddingLeft: 8,
    fontSize: 14,
    color: [0, 0, 0, 1]
  }}
  value={text}
  onChange={setText}
  placeholder="请输入..."
  placeholderColor={[0.6, 0.6, 0.6, 1]}
/>
```

### useFrame

帧循环 Hook，用于动画更新：

```tsx
import { useFrame, View } from 'react-gl-renderer';

function AnimatedComponent() {
  const [offset, setOffset] = useState(0);

  useFrame((time) => {
    setOffset(Math.sin(time * 0.001) * 50);
  });

  return (
    <View style={{
      width: 50,
      height: 50,
      backgroundColor: [1, 0, 0, 1],
      marginLeft: offset + 100
    }} />
  );
}
```

## 支持的样式属性

### 尺寸
- `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight`
- `aspectRatio` - 宽高比
- `boxSizing`: `'content-box'` | `'border-box'`

### 间距
- `marginTop`, `marginRight`, `marginBottom`, `marginLeft`
- `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`

### Flexbox
- `flexDirection`, `justifyContent`, `alignItems`, `alignContent`, `alignSelf`
- `flexWrap`, `flex`, `flexGrow`, `flexShrink`, `flexBasis`
- `rowGap`, `columnGap`

### 定位
- `position`: `'static'` | `'relative'` | `'absolute'`
- `left`, `right`, `top`, `bottom`

### 边框与圆角
- `borderTopWidth`, `borderRightWidth`, `borderBottomWidth`, `borderLeftWidth`
- `borderColor`: `[r, g, b, a]`
- `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`
  - 格式: `[水平半径, 垂直半径]`，支持椭圆角

### 背景
- `backgroundColor`: `[r, g, b, a]`
- `backgroundImage`: 图片路径
- `backgroundRepeatX`, `backgroundRepeatY`: `'repeat'` | `'no-repeat'`
- `backgroundSize`: `[widthRatio, heightRatio]` 百分比
- `background9Patch`: `[left, right, top, bottom]` 9-patch 拉伸区域
- `background9PatchSize`: `[scaleX, scaleY]` 9-patch 贴图缩放倍数

### 显示
- `display`: `'flex'` | `'none'` | `'contents'`
- `overflow`: `'visible'` | `'hidden'` | `'scroll'`
- `direction`: `'inherit'` | `'ltr'` | `'rtl'`

## 未来展望

react-gl-renderer 的架构设计为未来的扩展提供了坚实的基础：

### 基于 Node 的窗口环境

渲染器基于标准 WebGL 接口实现，架构上不依赖浏览器环境特有的 API。未来可扩展运行在 GLFW 下，实现原生桌面窗口应用。当前已实现完整的布局引擎和事件系统，可以轻松扩展为多窗口环境。

### 全平台支持

由于底层使用标准 GL 接口，理论上可以在任何支持 OpenGL 的平台上运行：

- **Web 浏览器** - 当前首先支持的平台，通过 WebGL
- **Node 桌面应用** - 通过 node-gl、GLFW 实现原生窗口
- **小游戏环境** - 轻量级渲染管线，无 DOM 依赖，可与游戏渲染循环集成
- **移动端** - 通过 OpenGL ES

### 小游戏环境适配

渲染器的设计非常适合小游戏环境：
- 轻量级的渲染管线
- 无 DOM 依赖
- 可与现有的游戏渲染循环集成
- 支持离屏渲染，便于与游戏场景融合

### React 全量放进 Worker

渲染器与 React 完全解耦，React 产生的渲染对象是可序列化的。这意味着可以将 React 运行时完全放进 Worker，主线程只负责接收渲染对象并执行 GL 绑定。

## License

BSL-1.1，2099-12-31 后变更为 MIT。详见 [LICENSE](LICENSE)。
