# 测试

离线冒烟测试，不需要浏览器、不需要装依赖（Node 18+）。

```bash
node test/smoke-shell.mjs
```

做法：把 `cards/manfan/` 下的源文件（含 `apps/_shared/`）复制成 `.mjs`
（并把相对 import 改成 `.mjs`），再注入最小 DOM 桩后 import。
除扩展名与 import 后缀外，测的就是发布版原文。

覆盖：CSS 级回归断言（透明遮罩吞点击）、设计令牌一致性、单例与自愈重建、
4 个一级页与二级页、地图两张图与点击详情、料理灶台读背包与写输入框、
设置覆盖层、可见关闭按钮、开合与滚动保持。共 61 项。

浏览器预览：`preview.html`（需经 HTTP 打开，ESM 不能用 file://）。

**这不是真机验收。** 真机行为（sway/编辑/切聊天后的重挂载、实际计算样式、
移动端键盘）归 `sillytavern-runtime-debug`。
