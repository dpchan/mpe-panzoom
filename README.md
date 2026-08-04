# MPE Panzoom

为 VS Code [Markdown Preview Enhanced](https://github.com/shd101wyy/vscode-markdown-preview-enhanced) 的 Mermaid 和 SVG 图表增加平移与缩放能力。

Pan and zoom support for Mermaid and SVG diagrams in Markdown Preview Enhanced.

本项目只提供 MPE 生命周期适配。缩放核心使用 [@panzoom/panzoom](https://github.com/timmywil/panzoom)。

## 功能

- 自动绑定 Mermaid 渲染生成的 SVG。
- 自动绑定 Markdown 中引用的 `.svg` 图片。
- 支持为内联 SVG 或图片显式添加 `mpe-panzoom` 类。
- 鼠标滚轮缩放，缩放范围为 `0.25` 到 `10`。
- 鼠标拖动平移，双击恢复初始位置。
- 使用 `MutationObserver` 处理 Mermaid 延迟渲染、MPE 实时更新和手动刷新。
- 避免 MPE Lightbox 抢占 SVG 图片的点击操作。
- Panzoom 加载失败时保留普通图表预览。

## 前提

在 VS Code 设置中开启：

```json
{
  "markdown-preview-enhanced.enableScriptExecution": true
}
```

该设置允许 Markdown 导入并执行 JavaScript。只应预览可信的 Markdown 文件。

## 单个文档使用

把以下内容放在 Markdown 文件中：

```markdown
@import "https://cdn.jsdelivr.net/npm/@panzoom/panzoom@4.6.2/dist/panzoom.min.js"
@import "https://cdn.jsdelivr.net/gh/dpchan/mpe-panzoom@v1.0.1/mpe-panzoom.js"
@import "https://cdn.jsdelivr.net/gh/dpchan/mpe-panzoom@v1.0.1/mpe-panzoom.css"
```

加载顺序不能调整：适配脚本依赖第一行提供的 `window.Panzoom`。

## 全局启用

打开 MPE 命令 `MPE:扩展 Parser（全局）`，将全局 `parser.js` 设置为：

```javascript
({
  onWillParseMarkdown: async function (markdown) {
    var imports = [
      '@import "https://cdn.jsdelivr.net/npm/@panzoom/panzoom@4.6.2/dist/panzoom.min.js"',
      '@import "https://cdn.jsdelivr.net/gh/dpchan/mpe-panzoom@v1.0.1/mpe-panzoom.js"',
      '@import "https://cdn.jsdelivr.net/gh/dpchan/mpe-panzoom@v1.0.1/mpe-panzoom.css"',
    ];
    var lines = markdown.split(/\r?\n/);
    var missingImports = imports.filter(function (line) {
      return lines.indexOf(line) === -1;
    });

    if (missingImports.length === 0) {
      return markdown;
    }

    var separator = markdown.charAt(markdown.length - 1) === '\n' ? '\n' : '\n\n';
    return markdown + separator + missingImports.join('\n') + '\n';
  },

  onDidParseMarkdown: async function (html) {
    return html;
  },
})
```

Import 追加在文档末尾，不会挤占 YAML Front Matter 的首行，也不会改变原始内容的行号。该转换只发生在解析期间，不会写回 Markdown 文件。

## 刷新行为

MPE 的实时更新和手动刷新都会重新扫描当前预览中的 Mermaid 和 SVG 图表。手动刷新替换预览 `body` 时，适配器仍会挂载到新图表；同一图表不会重复创建视口或重复绑定 Panzoom。

可在浏览器中打开 [`test/manual-refresh.html`](./test/manual-refresh.html) 验证首次渲染、实时更新和手动刷新后的绑定行为。

Linux 下 MPE 的默认全局配置文件通常位于：

```text
~/.local/state/crossnote/parser.js
```

如果设置了 `markdown-preview-enhanced.configPath`，则使用该设置指定的目录。

## 选择目标

默认自动处理：

```css
.preview-container .mermaid svg
.preview-container svg.mpe-panzoom
.preview-container img.mpe-panzoom
```

此外，脚本会自动检测图片 URL 路径以 `.svg` 结尾的 `img` 元素，包括带查询参数的 SVG 地址。

也可以显式添加类：

```html
<svg class="mpe-panzoom"></svg>
<img class="mpe-panzoom" src="./diagram.svg" alt="Architecture diagram">
```

## 自定义样式

可以在 MPE 自定义 CSS 中覆盖以下变量：

```css
:root {
  --mpe-panzoom-background: #f6f8fa;
  --mpe-panzoom-border: #d0d7de;
}
```

图表视口默认高度：

```css
height: clamp(320px, 68vh, 800px);
```

## 兼容性

当前验证组合：

- Markdown Preview Enhanced `0.8.30`
- Crossnote `0.9.31`
- `@panzoom/panzoom` `4.6.2`

## License

[MIT](./LICENSE)
