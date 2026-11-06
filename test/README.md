# 测试

离线冒烟测试，不需要浏览器、不需要装依赖（Node 18+）。

```bash
node test/smoke-shell.mjs
```

做法：把 `cards/manfan/` 下的源文件复制成 `.mjs`（并把相对 import 改成 `.mjs`），
再注入最小 DOM 桩后 import。除扩展名与 import 后缀外，测的就是发布版原文。

**这不是真机验收。** 真机行为（sway/编辑/切聊天后的重挂载、实际计算样式、
移动端键盘）归 `sillytavern-runtime-debug`。
