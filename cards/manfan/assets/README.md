# 迷宫饭 · 资源约定

图片全部预制（AI 生成，不涉商用），**不进 MVU**。`stat_data` 里只存名字，前端按名字查 `manifest.json`。

**2026-11-14 起图片走自建图床**（Cloudflare imgbed），不再从本仓库读：

| 项 | 值 |
|---|---|
| 域名 | `https://900037e6.cloudflare-imgbed-6au.pages.dev` |
| 上传设置 | **命名「仅原名」+ 预处理「转 webp」**（转换失败保留原格式） |
| URL 形态 | `/file/<目录>/<文件名>.webp`，例 `/file/manfan/world.webp` |
| 权限 | 公开读，无防盗链 |
| 入口 | `map-config.js` 的 `图床` / `CDN`；`取图地址()` 对绝对地址原样返回 |

地址**可以从名字推出来**，所以 `map-config.js` 里写相对路径（`file/manfan/world.webp`），
`manifest.json` 也只存相对路径。代码里 `取图地址()` 拼上 `图床` 前缀。

**换图会撞缓存**：同名覆盖后 URL 不变，浏览器和 Cloudflare 边缘可能还拿旧图。
换图时在 manifest / map-config 里加版本号：`file/manfan/world.webp?v=2`，改一次加一。

---

## 目录

```
assets/
├── portrait/     头像   320×320 方形   webp ≤40 KB
├── cg/           正文 CG 宽 1024，高 ≤1200  webp ≤120 KB
├── map/           旧压缩版，仅备份；实际从图床取
│   ├── world.webp   1200×900
│   └── maze.webp    900×1350
└── manifest.json
```

---

## 命名

**一律拼音/英文 slug，不用中文。**

| 对象 | slug |
|---|---|
| 森西 | `senshi` |
| 玛露希尔 | `marcille` |
| 奇尔查克 | `chilchuck` |
| 炎龙排 | `dragon-steak` |
| 史莱姆干 | `dried-slime` |

`manifest.json` 是唯一真源。改文件名必须同步改它，否则前端查不到、只能显示占位块。

---

## 画面要求

**头像**

- 头肩、正面、浅色背景
- **缩到 32px 还能认出是谁**——这是唯一标准
- 裁圆形后边缘不糊（所以底色要浅且干净）

**CG**

- 主体居中，四周留可裁剪的余量
- 不要自带文字（缩略图上会变成黑块）
- 同一道菜只留一张；重出就换 slug 加 `.v2`

---

## 上传（Cloudflare imgbed）

| 项 | 值 |
|---|---|
| 图床 | `https://900037e6.cloudflare-imgbed-6au.pages.dev` |
| 上传目录 | `manfan/portrait`、`manfan/cg`、`manfan/map` |
| 上传后地址 | `/file/manfan/<毫秒时间戳>_<原名>.<ext>`，例 `/file/manfan/1794630897656_world.png` |

**流程**

1. 文件按 slug 命名：`senshi.webp`、`dragon-steak.webp`
2. 传到对应目录（`manfan/portrait` 等），图床按原名存、自动转 webp
3. 前端按名字拼地址；新图登记进 `manifest.json`
4. 换图不用改地址，只把 `?v=N` 加一

**四条注意**

1. **原图直接传 PNG 也行。** 图床会转 webp（失败则保留原格式），不用本地先转。
2. **同名覆盖要带版本号。** 地址固定是好事也是坑：换了图，缓存可能还是旧图。
   `?v=2` 这种查询串能强制回源，比改文件名省事。
3. **图床挂了没有回退。** `CDN` 里目前只有图床一个源（2026-11-14 决定暂不设备用），
   挂了就是「底图加载失败」的诊断块。
4. **防盗链没开，别开。** 酒馆在 iframe 里加载图片，Referer 不是图床域名，开了白屏。
