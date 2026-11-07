// 抽屉外壳冒烟测试：离线 DOM 桩 + 真实模块加载
// 用法：node test/smoke-shell.mjs
//
// 做法：把 cards/manfan 下三个源文件复制成 .mjs（并把相对 import 改成 .mjs），
// 再注入最小 DOM 桩后 import。除扩展名与 import 后缀外，测的就是发布版原文。

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const CARD = path.join(ROOT, 'cards', 'manfan');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dmk-shell-'));

/* ---------- 复制并改后缀 ---------- */
function 复制(源相对, 目标相对) {
  const 源 = path.join(CARD, 源相对);
  const 目标 = path.join(TMP, 目标相对);
  fs.mkdirSync(path.dirname(目标), { recursive: true });
  let 文 = fs.readFileSync(源, 'utf8');
  文 = 文.replace(/from '([^']+)\.js'/g, "from '$1.mjs'");
  fs.writeFileSync(目标, 文);
}
复制('adapter.js', 'adapter.mjs');
复制('map-config.js', 'map-config.mjs');
复制(path.join('apps', '_shared', 'tokens.js'), path.join('apps', '_shared', 'tokens.mjs'));
复制(path.join('apps', '_shared', 'interaction.js'), path.join('apps', '_shared', 'interaction.mjs'));
复制(path.join('apps', 'shell', 'index.js'), path.join('apps', 'shell', 'index.mjs'));

/* ---------- 最小 DOM 桩 ---------- */
function makeEl(tag) {
  const n = {
    tagName: String(tag).toUpperCase(), id: '', className: '', title: '', src: '', alt: '', loading: '',
    style: {}, children: [], parentNode: null,
    _attrs: {}, _h: {}, _text: '',
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c, on) {
        if (on === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
        else { on ? this._s.add(c) : this._s.delete(c); }
      },
    },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); },
    removeEventListener() {},
    click() { (this._h.click || []).forEach((fn) => fn({ target: this })); },
    dispatchEvent() {},
    setAttribute(k, v) { this._attrs[k] = String(v); if (k === 'id') this.id = v; if (k === 'src') this.src = v; },
    getAttribute(k) { return this._attrs[k]; },
    focus() {}, setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 36, height: 36 }; },
    querySelector() { return null; }, querySelectorAll() { return []; },
  };
  Object.defineProperty(n, 'textContent', {
    get() { return this._text !== '' ? this._text : this.children.map((c) => c.textContent || '').join(''); },
    set(v) { this._text = String(v); if (v === '') this.children.length = 0; },
  });
  Object.defineProperty(n, 'firstChild', { get() { return this.children[0] || null; } });
  return n;
}

function 遍历(root, 判断, 出) {
  (function w(n) {
    for (const c of n.children) { if (判断(c)) 出.push(c); w(c, 判断, 出); }
  })(root, 判断, 出);
  return 出;
}

const body = makeEl('body');
const head = makeEl('head');
const 输入框 = makeEl('textarea');
输入框.id = 'send_textarea';
输入框.value = '';
body.appendChild(输入框);
const doc = {
  readyState: 'complete', head, body,
  createElement: makeEl,
  getElementById(id) { return 遍历(body, (n) => n.id === id, [])[0] || null; },
  addEventListener(t, fn) { (doc._h = doc._h || {}), (doc._h[t] = doc._h[t] || []).push(fn); },
  removeEventListener() {},
  querySelector(sel) {
    if (sel === '#send_textarea') return 输入框;
    return 遍历(body, (n) => n.id === sel.slice(1), [])[0] || null;
  },
};

/* ---------- 假 stat_data（就是 initvar 的形状） ---------- */
const stat = {
  世界: {
    时刻: { 年: 514, 月: 2, 日: 23, 时间: '09:00' },
    位置: { 大区域: '岛', 小区域: '迷宫第二层', 小地点: '尖塔之森' },
    深度: 2, 天气: '阴冷', 营地: '尖塔之森旧营地', 成长度: 1,
    迷宫之主: '无', 君主: '无',
    节点: { E01: { 状态: true, 路径: '开局既定' }, E05: { 状态: 'changed', 路径: '玩家提前引开红龙' } },
    里程碑: { M02: true },
    账本: { 法琳未被吞: { 涉及节点: ['E04', 'E05'], 影响人物: ['莱欧斯'], 连锁: '希斯路提前出手' } },
    传闻: ['王都来的讨伐队又招人了，听说是冲着红龙去的，报酬开得比往年高'],
  },
  玩家: {
    身份: { 种族: '半身人', 年龄: 24, 战斗职业: '陷阱师', 生活职业: '剥金人', 副业: null },
    属性: { 体魄: 55, 敏捷: 60, 学识: 45, 洞察: 50, 意志: 45, 魅力: 45 },
    生命: { 当前HP: 41, 最大HP: 48, 当前MP: 34, 最大MP: 34 },
    技能: [{ uid: 'sk_1', name: '拆陷阱', value: 15, source: '陷阱师·主职' }],
    装备: { 武器: '短剑', 防具: '皮甲', 饰品: null },
    背包: { 短剑: { type: '装备', qty: 1, 品质: '普通' }, 走路菇: { type: '食材', qty: 2 } },
    状态: { 体虚: false, 伤势: ['左臂灼伤'] },
    金钱: 50, 欲念: '想知道迷宫最深处有什么',
  },
  人物: { 森西: { 身份: '战士·厨师', 好感: 35, 关系: '同队', 欲念: '想再煮一锅不后悔的汤', 同行: true } },
  在场: { 森西: { 此刻状态: '蹲在锅边撇沫', 心声: '水还没开' } },
  委托: { 清理广场史莱姆: { 委托人: '剥金团', 目标: '史莱姆 ×3', 报酬: '30 G', 期限: '514年2月25日', 状态: '进行中' } },
  料理: { 图鉴: { 原作: { 炎龙排: { best: 2, times: 1, firstDate: '514年3月1日' } }, 原创: {} } },
  饱食度: 72, 士气: 60, GM锐评: '一锅汤要三样东西：火、水，和一个不挑食的人。',
};

const win = {
  document: doc, innerWidth: 1280, innerHeight: 800,
  localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); } },
  addEventListener() {}, removeEventListener() {},
  tavern_events: { MESSAGE_RECEIVED: 'message_received', CHAT_CHANGED: 'chat_changed' },
};
win.parent = win;
global.document = doc;
global.window = win;
global.localStorage = win.localStorage;
global.getVariables = () => ({ stat_data: stat });
global.eventOn = () => ({ stop() {} });
global.Event = class { constructor(t) { this.type = t; } };

/* ---------- 加载模块 ---------- */
const mod = await import(pathToFileURL(path.join(TMP, 'apps', 'shell', 'index.mjs')).href);

let 通过 = 0;
const 失败 = [];
function ok(名, 条件, 实际) {
  if (条件) 通过++;
  else 失败.push(名 + (实际 === undefined ? '' : ' → ' + JSON.stringify(实际)));
}

/* ---------- CSS 级回归：透明遮罩绝不能吞点击 ----------

   离线 DOM 桩不解析 CSS，所以这里直接读源码文本做字符串断言。
   防止重演「透明全屏遮罩吞掉所有点击、整页点不动」的事故。 */
const 源码 = fs.readFileSync(path.join(TMP, 'apps', 'shell', 'index.mjs'), 'utf8');
function 规则(选择器) {
  const i = 源码.indexOf(选择器 + '{');
  if (i < 0) return '';
  const j = 源码.indexOf('}', i);
  return 源码.slice(i, j);
}
/* 令牌单一真源：仓库内 tokens.js 必须与设计侧 tokens.css 完全一致 */
const 设计侧令牌 = fs.readFileSync(path.join(ROOT, '..', '前端平台', 'tokens.css'), 'utf8');
const 仓库侧令牌 = fs.readFileSync(path.join(TMP, 'apps', '_shared', 'tokens.mjs'), 'utf8');
ok('令牌与 04-Toolkit/前端平台/tokens.css 一致', 仓库侧令牌.includes(设计侧令牌));

const 遮罩默认 = 规则('.dmk-scrim');
const 遮罩打开 = 规则('.dmk-scrim.dmk-on');
const 抽屉默认 = 规则('.dmk-drawer');
const 抽屉打开 = 规则('.dmk-drawer.dmk-on');
ok('遮罩默认 pointer-events:none', 遮罩默认.includes('pointer-events:none'), 遮罩默认);
ok('遮罩默认 visibility:hidden', 遮罩默认.includes('visibility:hidden'));
ok('遮罩打开才 pointer-events:auto', 遮罩打开.includes('pointer-events:auto'), 遮罩打开);
ok('抽屉默认 pointer-events:none', 抽屉默认.includes('pointer-events:none'), 抽屉默认);
ok('抽屉打开才 pointer-events:auto', 抽屉打开.includes('pointer-events:auto'), 抽屉打开);
// CSS 里根选择器写作 #${根ID}{（模板插值），所以按紧邻的 z-index 定位
ok('根节点 pointer-events:none', 源码.includes('z-index:2147483640;pointer-events:none'));

const api = win.__DMK_SHELL__;
ok('自动挂载并暴露 api', !!api);

const root = body.children.filter((c) => c.id === 'dmk-root')[0];
ok('根节点已插入 body', !!root);
const 胶囊 = 遍历(root, (n) => n.id === 'dmk-capsule', [])[0];
ok('胶囊存在', !!胶囊);
ok('胶囊默认在右侧', parseFloat(胶囊.style.left) > 900, 胶囊.style.left);

const drawer = 遍历(root, (n) => n.className === 'dmk-drawer', [])[0];
ok('抽屉存在', !!drawer);
ok('初始是关着的', !drawer.classList.contains('dmk-on'));

api.开();
ok('打开后带 dmk-on', drawer.classList.contains('dmk-on'));

const tabs = 遍历(root, (n) => n.className === 'dmk-tab', []);
ok('一级页 4 个', tabs.length === 4, tabs.map((t) => t.textContent));
ok('默认停在角色页', tabs[0].getAttribute('aria-selected') === 'true');

const subs = 遍历(root, (n) => n.className === 'dmk-sub', []).map((n) => n.textContent);
ok('角色页有 4 个二级', ['状态', '装备技能', '背包', '委托'].every((x) => subs.includes(x)), subs);

const bodyEl = 遍历(root, (n) => n.className === 'dmk-body', [])[0];
ok('正文有内容', bodyEl.children.length > 0, bodyEl.children.length);
const 文 = 全文(bodyEl);
ok('显示种族', 文.includes('半身人'));
ok('显示六维数值', 文.includes('55'));
ok('显示金钱', 文.includes('50 G'));
ok('显示伤势', 文.includes('左臂灼伤'));
ok('显示 GM 锐评', 文.includes('一锅汤'));

/* 切到 世界 → 地图 */
tabs[1].click();
const 图 = 遍历(root, (n) => n.tagName === 'IMG', []);
ok('地图页有 img', 图.length === 1, 图.length);
ok('img 指向 CDN 的 world.webp', String(图[0].src).includes('world.webp'), 图[0].src);
ok('img 走 testingcf 镜像', String(图[0].src).includes('testingcf'), 图[0].src);
const 高亮 = 遍历(root, (n) => String(n.className).includes('dmk-here'), []);
// 玩家在迷宫第二层，但大区域仍是「岛」——世界图回答「在哪个大陆」，迷宫图回答「在第几层」
ok('世界图高亮当前大区域（岛）', 高亮.length === 1 && 高亮[0].title === '岛', 高亮.map((n) => n.title));

/* 切到 迷宫 */
const 图tab = 遍历(root, (n) => n.className === 'dmk-sub' && /迷宫/.test(n.textContent), [])[0];
图tab.click();
const 图2 = 遍历(root, (n) => n.tagName === 'IMG', []);
ok('迷宫 img 指向 maze.webp', String(图2[0].src).includes('maze.webp'), 图2[0].src);
const 带 = 遍历(root, (n) => String(n.className).includes('dmk-band'), []);
ok('迷宫图 9 段层带都可点', 带.length === 9, 带.length);
const 高亮带 = 带.filter((n) => String(n.className).includes('dmk-here'));
ok('深度 2 只高亮第二段', 高亮带.length === 1, 高亮带.length);
if (高亮带[0]) {
  ok('高亮层带 top 约 11.56%', Math.abs(parseFloat(高亮带[0].style.top) - 11.56) < 0.01, 高亮带[0].style.top);
}

/* 编年 */
const 编年tab = 遍历(root, (n) => n.className === 'dmk-sub' && /编年/.test(n.textContent), [])[0];
编年tab.click();
const 文2 = 全文(bodyEl);
ok('编年显示成长度', 文2.includes('1 / 5'));
ok('编年只列已发生的节点', 文2.includes('E05') && !文2.includes('E02'));
ok('编年显示账本', 文2.includes('希斯路提前出手'));
ok('编年显示传闻', 文2.includes('讨伐队'));
ok('里程碑已达成显示', 文2.includes('M02'));

/* 关系 */
tabs[2].click();
const 文3 = 全文(bodyEl);
ok('关系页有在场', 文3.includes('此刻在场') && 文3.includes('森西'));
ok('关系页有人物好感', 文3.includes('+35'));

/* 地图点击 → 详情 → 填进输入框 */
tabs[1].click();
const 地图tab = 遍历(root, (n) => n.className === 'dmk-sub' && /地图/.test(n.textContent), [])[0];
地图tab.click();  // 前面切过「编年」，先回到地图
const 世界图btn = 遍历(root, (n) => n.className === 'dmk-sub' && /世界图/.test(n.textContent), [])[0];
世界图btn.click(); // 前面切过「迷宫」，先回到世界图
const 节点 = 遍历(root, (n) => String(n.className).includes('dmk-node'), []);
ok('世界图 8 个节点都是可点按钮', 节点.length === 8 && 节点.every((n) => n.tagName === 'BUTTON'), 节点.length);
节点[0].click();
const 文详情 = 全文(bodyEl);
ok('点节点后出现详情板', 文详情.includes('前往此处') && 文详情.includes('寒带苔原'), 文详情.slice(0, 90));
const 去按钮 = 遍历(root, (n) => n.tagName === 'BUTTON' && /前往此处/.test(n.textContent), [])[0];
ok('详情板有前往按钮', !!去按钮);
去按钮.click();
ok('前往写进玩家输入框', 输入框.value.includes('前往'), 输入框.value);

/* 料理灶台：读背包 → 预览 → 填进输入框 */
tabs[3].click();
const 文4 = 全文(bodyEl);
ok('灶台列出背包食材', 文4.includes('走路菇'));
ok('预览含消耗清单', /走路菇×1/.test(文4), 文4.slice(0, 120));
ok('预览标明只发送不改变量', 文4.includes('不改任何变量'));
const 发送 = 遍历(root, (n) => n.tagName === 'BUTTON' && /填进输入框/.test(n.textContent), [])[0];
ok('灶台有发送按钮', !!发送);
发送.click();
ok('做菜输入写进输入框', 输入框.value.includes('我用') && 输入框.value.includes('主材是走路菇'), 输入框.value);
ok('输入框保留之前的文本', 输入框.value.includes('前往'), 输入框.value);

/* 食材页空状态与图鉴 */
const 食材tab = 遍历(root, (n) => n.className === 'dmk-sub' && /食材/.test(n.textContent), [])[0];
食材tab.click();
ok('食材页列出食材', 全文(bodyEl).includes('走路菇'));
const 图鉴tab = 遍历(root, (n) => n.className === 'dmk-sub' && /图鉴/.test(n.textContent), [])[0];
图鉴tab.click();
ok('图鉴页显示首次日期', 全文(bodyEl).includes('514年3月1日'));

/* 设置覆盖层 */
const gear = 遍历(root, (n) => n.className === 'dmk-gear', [])[0];
gear.click();
const 设置层 = 遍历(root, (n) => String(n.className).includes('dmk-set'), []);
ok('设置层打开且带 dmk-on', 设置层.length === 1 && String(设置层[0].className).includes('dmk-on'));
const 开关 = 遍历(root, (n) => String(n.className).includes('dmk-switch'), [])[0];
ok('设置层有骰子开关', !!开关);
开关.click();
ok('开关可切换 aria-pressed', 开关.getAttribute('aria-pressed') === 'false', 开关.getAttribute('aria-pressed'));
const 返回 = 遍历(root, (n) => n.tagName === 'BUTTON' && n.textContent === '返回', [])[0];
返回.click();

/* 可见关闭按钮 */
const 关闭钮 = 遍历(root, (n) => n.className === 'dmk-close', [])[0];
ok('页眉有可见关闭按钮', !!关闭钮);
关闭钮.click();
ok('点关闭按钮收起面板', !drawer.classList.contains('dmk-on'));
api.开();

/* 关闭 */
api.关();
ok('关闭后去掉 dmk-on', !drawer.classList.contains('dmk-on'));

/* root 被外部移除后能自愈重建（对应应急命令的场景） */
root.parentNode.removeChild(root);
ok('root 已移除', !doc.getElementById('dmk-root'));
const 再挂 = mod.挂载();
ok('重新挂载返回 api', !!再挂 && !!win.__DMK_SHELL__);
ok('重建后 root 回到 body', !!doc.getElementById('dmk-root'));
ok('重建后胶囊存在', !!遍历(doc.getElementById('dmk-root'), (n) => n.id === 'dmk-capsule', [])[0]);

/* 单例 */
const again = api.挂载 ? api.挂载() : null;
ok('重复挂载不新建', body.children.filter((c) => c.id === 'dmk-root').length === 1);

function 全文(n) {
  const 出 = [];
  (function w(x) {
    if (x._text) 出.push(x._text);
    x.children.forEach(w);
  })(n);
  return 出.join(' ');
}

console.log('[抽屉外壳] 通过 ' + 通过 + ' 项，失败 ' + 失败.length + ' 项');
if (失败.length) {
  失败.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('✅ 全部通过');
