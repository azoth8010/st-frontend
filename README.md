# st-frontend

SillyTavern 角色卡自用前端。一套共用引擎，多张卡各自出皮肤。

**核心原则：卡里只放 URL，代码住在这里。** 改界面不用重新打包卡、不用重新导入、不用开新档。

---

## 现状

| 阶段 | 状态 |
|---|---|
| 仓库骨架 | ✅ 完成 |
| `cards/manfan/assets/` 资源约定 | ✅ 完成 |
| `core/` `schema-kit/` 引擎 | ⬜ 待建 |
| 状态栏 v1 | ⬜ 待建 |

`core/` 不急着抽。既定顺序：**先做状态栏 v1 → 再做第二屏（图鉴或地图）→ 两屏公共部分稳定了再抽引擎**。只有一屏的时候抽不出正确抽象，只会抽出过度抽象。

---

## 目录约定

```
core/            引擎：挂载、事件、面板、折叠、Toast。无卡名、无字段名
schema-kit/      zod 叶子工厂、键归一化、条数截断。跨卡通用
skins/
  _base/         CSS 变量骨架、排版尺度
  <卡>/          配色、纹样、字体
cards/<卡>/
  adapter.js     卡的字段 → 界面槽位（换卡只改这个）
  apps/          状态栏、图鉴、地图、料理台
  assets/        头像、CG、底图、manifest
```

**共用的是能力，不是界面。** 不同卡的状态栏信息结构差太远（迷宫饭要深度/饱食度/营地，校园卡要日期/好感/课程），强行统一布局只会变成一堆 `if (卡名 === …)`。

---

## 引用方式

```
https://cdn.jsdelivr.net/gh/azoth8010/st-frontend@<版本>/<路径>
```

国内镜像把域名换成 `testingcf.jsdelivr.net`，路径不变。

### 版本规则

| 场景 | 用什么 | 缓存 |
|---|---|---|
| 开发期边改边看 | `@main` | 约 12 小时刷新 |
| 发布给玩家 | `@manfan-1.0.0` 这种 tag | **永久缓存** |

**tag 一旦推上去就不能改。** 改了引用方拿到的还是旧内容，只能发新 tag。所以别在发布后用 tag 迭代。

---

## 资源命名

一律**拼音/英文 slug**，不用中文文件名。中文在 URL 里要百分号编码，任何一环处理不当你都会拿到 404，而且报错信息看不出是编码问题。

| 类型 | 目录 | 例 |
|---|---|---|
| 头像 | `assets/portrait/` | `sensi.webp` |
| 正文 CG | `assets/cg/` | `dragon-steak.webp` |
| 地图 | `assets/map/` | `world.webp` `maze.webp` |

名字到文件的映射写在 `assets/manifest.json`。详细规格见 `cards/manfan/assets/README.md`。

---

## jsdelivr 硬限制

- 仓库必须 **public**
- 单文件 < 20 MB，仓库 < 50 MB
- `@分支` 缓存约 12 小时；`@tag` / `@commit` 永久缓存

---

## License

代码部分（`core/` `schema-kit/` `skins/` `cards/*/apps/` `cards/*/adapter.js`）采用 **MIT**，见 `LICENSE`。

`cards/*/assets/` 下的同人图像**不在 MIT 范围内**：仅供本角色卡使用，不授予再分发权。角色形象版权归原作者所有。

## 迷宫饭 · 前端现状（v0.2）

```
cards/manfan/
├── adapter.js                 只读桥：所有 MVU 路径集中在此
├── map-config.js              地图坐标与 CDN 镜像
└── apps/
    ├── _shared/
    │   ├── tokens.js          设计令牌（由 04-Toolkit/前端平台/tokens.css 同步）
    │   └── interaction.js     共享交互层：读 MVU / 点击 / 写输入框 / 订阅 / 防重复
    └── shell/index.js         居中卡片外壳、4 个一级页、地图与料理交互
```

**共享交互层是地图与料理台共用的**：两者都只读 `stat_data`，点击后把结果
**填进玩家输入框**（不覆盖已有文字、不自动发送），由 AI 结算变量。

开发预览：`python -m http.server 8765 --directory <仓库根>` 后打开
`http://127.0.0.1:8765/test/preview.html`（页面自带假数据，不写变量）。
离线冒烟：`node test/smoke-shell.mjs`。
