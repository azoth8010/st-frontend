# 迷宫饭 · 资源约定

图片全部预制（AI 生成，不涉商用），**不进 MVU**。`stat_data` 里只存名字，前端按名字查 `manifest.json`。

**2026-11-14 起图片走自建图床**（Cloudflare imgbed），不再从本仓库读：

| 项 | 值 |
|---|---|
| 域名 | `https://900037e6.cloudflare-imgbed-6au.pages.dev` |
| URL 形态 | `/file/<目录>/<毫秒时间戳>_<文件名>.<ext>`，例 `/file/manfan/1794630897656_world.png` |
| 权限 | 公开读，无防盗链 |
| 入口 | `map-config.js` 的 `图床` / `CDN`；`取图地址()` 对绝对地址原样返回 |

**时间戳前缀是随机数，推不出规律**——上传后必须把完整 URL 登记进 `manifest.json`，
不能靠名字拼地址。

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

## 上传（PicGo）

| 字段 | 值 |
|---|---|
| 仓库 | `azoth8010/st-frontend` |
| 分支 | `main` |
| 存储路径 | `cards/manfan/assets/cg/`（按类型改末级目录） |
| 自定义域名 | `https://cdn.jsdelivr.net/gh/azoth8010/st-frontend@main/cards/manfan/assets/cg/` |

**三个坑**

1. **必须保留原文件名。** 装了重命名插件会改成时间戳/UUID，manifest 里那堆 slug 全部对不上。
2. **不要覆盖同名文件。** jsdelivr 对同名覆盖有最长 12 小时缓存，换图请改叫 `senshi.v2.webp` 再改 manifest 一行。
3. **存储路径和自定义域名的目录必须完全一致**，少一层就是 404，而且 404 页面看不出是哪一步错了。
