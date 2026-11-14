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

## 上传（Cloudflare imgbed）

| 项 | 值 |
|---|---|
| 图床 | `https://900037e6.cloudflare-imgbed-6au.pages.dev` |
| 上传目录 | `manfan/portrait`、`manfan/cg`、`manfan/map` |
| 上传后地址 | `/file/manfan/<毫秒时间戳>_<原名>.<ext>`，例 `/file/manfan/1794630897656_world.png` |

**流程**

1. 文件先按 slug 命名：`senshi.webp`、`dragon-steak.webp`
2. 传到对应目录，图床会自动加时间戳前缀
3. **复制完整 URL，登记进 `manifest.json`**——前缀是随机数，靠名字拼不出来
4. 前端按名字查 manifest，拿到 URL 直接当 `<img src>`

**四条注意**

1. **PNG 太大了。** 现有两张底图 PNG 合计 1.9 MB（857 KB + 1.0 MB），转 webp 能到 0.7 MB。
   换图时先转再传，转完 URL 会变，manifest 记得改。
2. **不要覆盖同名文件。** 图床按时间戳存，覆盖其实不会发生；但 manifest 里旧 URL 会指向旧图，
   所以「换图」= 传新图 + 改 manifest 那一行，别指望同名自动更新。
3. **图床挂了没有回退。** `CDN` 里目前只有图床一个源（2026-11-14 决定暂不设备用），
   挂了就是「底图加载失败」的诊断块。
4. **防盗链没开，别开。** 酒馆在 iframe 里加载图片，Referer 不是图床域名，开了白屏。
