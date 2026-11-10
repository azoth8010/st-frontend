// ============================================================
// 迷宫饭 · 图鉴外壳（胶囊 → 居中卡片，4 个一级页）
//
// 设计见 04-Toolkit/前端平台/信息架构.md
// 约束（sillytavern-embedded-ui）：
//   · 模型/用户内容一律 textContent，不用 innerHTML
//   · 单例、防重复挂载；关闭走一条清理路径
//   · 不用 100vh 单策略，用 100dvh + 回退
//   · 刷新保留当前页与滚动位置
//   · 键盘可用：Esc 关闭、Tab 可走完、焦点进入抽屉
//
// 数据全部来自 adapter.js（只读桥）。本文件不出现任何 MVU 路径字符串。
// ============================================================

import { 格式化时刻, 格式化位置, 深度名 } from '../../adapter.js';
import { 样式Token } from '../_shared/tokens.js';
import * as 交互 from '../_shared/interaction.js';
import { 地图配置, 取图地址 } from '../../map-config.js';

const 根ID = 'dmk-root';
const 胶囊ID = 'dmk-capsule';
const 位置键 = 'dmk:shell:pos';
const 页面键 = 'dmk:shell:page';

const 页面表 = [
  { 键: '角色', 子: ['状态', '装备技能', '背包', '委托'] },
  { 键: '世界', 子: ['地图', '编年'] },
  { 键: '里程碑', 子: null },
  { 键: '传闻', 子: null },
  { 键: '关系', 子: null },
  { 键: '料理', 子: ['灶台', '食材', '图鉴'] },
];

const 样式 = `

/* ===== 布局：居中卡片，不做位移动画 ===== */
#${根ID}{position:fixed;inset:0;z-index:2147483640;pointer-events:none;
  font-family:-apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased}
#${根ID} *{box-sizing:border-box;min-width:0}
#${胶囊ID}{position:fixed;width:44px;height:44px;border-radius:50%;pointer-events:auto;
  background:rgba(53,39,34,.62);border:1px solid rgba(249,241,223,.5);color:#f9f1df;
  display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;
  cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;
  box-shadow:var(--sh-1);transition:opacity 120ms ease}
#${胶囊ID}:active{cursor:grabbing}
#${胶囊ID}:hover{opacity:.85}
.dmk-scrim{position:fixed;inset:0;background:var(--scrim);pointer-events:none;
  opacity:0;visibility:hidden;transition:opacity 120ms ease,visibility 120ms}
.dmk-scrim.dmk-on{opacity:1;visibility:visible;pointer-events:auto}

.dmk-drawer{position:fixed;top:50%;left:50%;
  width:min(920px,calc(100vw - 48px));height:min(820px,100vh);height:min(820px,100dvh);
  background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--r-lg);
  display:flex;flex-direction:column;overflow:hidden;
  opacity:0;visibility:hidden;pointer-events:none;
  transform:translate(-50%,-50%) scale(.985);
  transition:opacity 120ms ease,transform 120ms ease,visibility 120ms;
  box-shadow:var(--sh-5)}
.dmk-drawer.dmk-on{opacity:1;visibility:visible;transform:translate(-50%,-50%) scale(1);pointer-events:auto}
@media (prefers-reduced-motion:reduce){.dmk-drawer,.dmk-scrim{transition:none}}

/* 纸纹：只做一层，不叠分离机制 */
.dmk-drawer::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(700px 420px at 18% 8%,rgba(255,255,255,.22),transparent 70%)}
.dmk-drawer>*{position:relative;z-index:1}

/* ===== 页眉 ===== */
.dmk-hd{padding:var(--s-4) var(--s-6) var(--s-3);border-bottom:1px solid var(--border);
  background:var(--surface-raised);flex:0 0 auto}
.dmk-hd1{display:flex;align-items:flex-start;gap:var(--s-3)}
.dmk-hd-title{flex:1;min-width:0}
.dmk-hd-title h1{margin:0;font:600 20px/1.3 var(--serif);letter-spacing:2px;color:var(--text-primary)}
.dmk-hd-meta{margin:var(--s-1) 0 0;font-size:12px;line-height:1.6;color:var(--text-secondary);
  border:0;background:none}
.dmk-epigraph{margin:var(--s-2) 0 0;padding:0 0 var(--s-2);font:12px/1.7 var(--serif);
  color:var(--text-tertiary);border-bottom:1px solid var(--border)}
.dmk-epigraph:empty{display:none}
.dmk-gear,.dmk-close{width:32px;height:32px;flex:0 0 auto;border:1px solid var(--border-strong);
  border-radius:var(--r-md);background:transparent;color:var(--text-secondary);
  font-size:15px;cursor:pointer;line-height:1}
.dmk-gear:hover,.dmk-close:hover{border-color:var(--danger);color:var(--danger)}
.dmk-meters{display:flex;gap:var(--s-3);margin-top:var(--s-3);flex-wrap:wrap}
.dmk-meter{flex:1 1 120px;min-width:110px}
.dmk-meter .lab{display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary)}
.dmk-meter .lab b{font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums}
.dmk-bar{height:4px;margin-top:var(--s-1);background:var(--paper-deep);overflow:hidden}
.dmk-bar i{display:block;height:100%;background:var(--action)}
.dmk-bar.dmk-hp i{background:var(--hp)} .dmk-bar.dmk-mp i{background:var(--mp)}
.dmk-bar.dmk-jade i{background:var(--success)}

/* ===== 页签 ===== */
.dmk-tabs{display:flex;border-bottom:1px solid var(--border-strong);
  background:var(--surface-raised);flex:0 0 auto}
.dmk-tab{flex:1;padding:var(--s-3) var(--s-1);border:0;background:transparent;cursor:pointer;
  font-size:14px;color:var(--text-secondary);position:relative}
.dmk-tab[aria-selected="true"]{color:var(--text-primary);font-weight:600}
.dmk-tab[aria-selected="true"]::after{content:"";position:absolute;left:22%;right:22%;bottom:-1px;
  height:2px;background:var(--action)}
.dmk-subs{display:flex;gap:var(--s-2);padding:var(--s-2) var(--s-6);overflow-x:auto;
  border-bottom:1px solid var(--border);flex:0 0 auto}
.dmk-sub{flex:0 0 auto;padding:var(--s-1) var(--s-3);border:1px solid var(--border-strong);
  border-radius:var(--r-sm);background:transparent;color:var(--text-secondary);
  font-size:12px;cursor:pointer}
.dmk-sub[aria-selected="true"]{background:var(--action);border-color:var(--action);color:var(--text-on-action)}
.dmk-body{flex:1;overflow-y:auto;padding:var(--s-4) var(--s-6) var(--s-6);
  scrollbar-width:thin;scrollbar-color:var(--border-strong) transparent}

/* ===== 内容 ===== */
.dmk-sec{margin:0 0 var(--s-4)}
.dmk-sec h3{margin:0 0 var(--s-2);font-size:12px;font-weight:600;color:var(--text-secondary);
  letter-spacing:1px;border-bottom:1px solid var(--border);padding-bottom:var(--s-1)}
.dmk-row{display:flex;gap:var(--s-3);padding:var(--s-2) 0;
  border-bottom:1px dashed var(--border);font-size:14px}
.dmk-row:last-child{border-bottom:0}
.dmk-row .k{flex:0 0 78px;color:var(--text-secondary);font-size:12px}
.dmk-row .v{flex:1;color:var(--text-primary);word-break:break-word;line-height:1.7}
.dmk-row[data-done] .v{color:var(--action);font-weight:600}
.dmk-mile{display:flex;align-items:baseline;gap:var(--s-3);padding:var(--s-2) 0;
  border-bottom:1px dashed var(--border);font-size:14px}
.dmk-mile:last-child{border-bottom:0}
.dmk-mile .n{flex:1;min-width:0;line-height:1.6;color:var(--text-primary);word-break:break-word}
.dmk-mile .n b{font-weight:600;color:var(--text-secondary);margin-right:var(--s-2);font-variant-numeric:tabular-nums}
.dmk-mile .s{flex:0 0 auto;font-size:12px;color:var(--text-tertiary)}
.dmk-mile[data-done="1"] .n{color:var(--action);font-weight:600}
.dmk-mile[data-done="1"] .n b{color:var(--action)}
.dmk-mile[data-done="1"] .s{color:var(--action)}
.dmk-quote{padding:var(--s-2) 0;border-bottom:1px dashed var(--border);font-size:14px;
  line-height:1.8;color:var(--text-primary);word-break:break-word}
.dmk-quote:last-child{border-bottom:0}
.dmk-quote::before{content:"· ";color:var(--text-tertiary)}
.dmk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:var(--s-2)}
.dmk-cell{background:var(--surface-raised);border:1px solid var(--border);
  border-radius:var(--r-sm);padding:var(--s-2);text-align:center}
.dmk-cell .n{font-size:12px;color:var(--text-secondary)}
.dmk-cell .q{font-size:16px;font-weight:600;color:var(--text-primary);margin-top:var(--s-1)}
.dmk-radar{display:flex;justify-content:center;margin:var(--s-2) 0 0}
.dmk-radar svg{display:block;width:100%;max-width:260px;height:auto}
.dmk-radar .axis{stroke:var(--border);stroke-width:1}
.dmk-radar .ring{fill:none;stroke:var(--border);stroke-width:1}
.dmk-radar .ring.is-outer{stroke:var(--border-strong)}
.dmk-radar .shape{fill:rgba(140,90,43,.16);stroke:#8c5a2b;stroke-width:1.6;stroke-linejoin:round}
.dmk-radar .dot{fill:#8c5a2b}
.dmk-radar .t{font:10px var(--serif);fill:var(--text-secondary)}
.dmk-tag{display:inline-block;padding:1px var(--s-2);border:1px solid var(--border-strong);
  border-radius:var(--r-sm);font-size:12px;color:var(--text-secondary);margin:var(--s-1) var(--s-1) 0 0}
.dmk-empty{padding:var(--s-8) var(--s-2);text-align:center;
  color:var(--text-secondary);font-size:14px;line-height:1.8}
.dmk-avatar{width:64px;height:64px;flex:0 0 auto;border-radius:var(--r-md);
  background:var(--action);color:var(--text-on-action);
  display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;
  border:2px solid var(--border-strong)}
.dmk-who{display:flex;gap:var(--s-3);padding:var(--s-2) 0;border-bottom:1px dashed var(--border)}
.dmk-who .info{flex:1;min-width:0}
.dmk-who .nm{font-size:14px;color:var(--text-primary);display:flex;gap:var(--s-2);align-items:baseline}
.dmk-who .nm small{font-size:12px;color:var(--action)}
.dmk-who .rel{font-size:12px;color:var(--text-secondary);margin-top:var(--s-1);word-break:break-word}

/* ===== 地图 ===== */
.dmk-mapwrap{position:relative;width:100%;background:#241d15;
  border:1px solid var(--border-strong);border-radius:var(--r-sm);overflow:hidden}
.dmk-mapwrap img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none}
.dmk-node{position:absolute;transform:translate(-50%,-50%);width:44px;height:44px;
  border:0;background:transparent;cursor:pointer;padding:0}
.dmk-node::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:11px;height:11px;border-radius:50%;background:var(--paper-raised);
  border:1.5px solid var(--text-primary);transition:transform 120ms ease}
.dmk-node:hover::after,.dmk-node:focus-visible::after{transform:translate(-50%,-50%) scale(1.5)}
.dmk-node.dmk-here::after{width:15px;height:15px;background:#f2d27a;
  box-shadow:0 0 0 4px rgba(242,210,122,.3)}
.dmk-band{position:absolute;left:0;right:0;width:100%;border:0;cursor:pointer;
  background:rgba(249,241,223,.13);border-top:1px solid rgba(249,241,223,.6);
  border-bottom:1px solid rgba(249,241,223,.6);padding:0}
.dmk-band.dmk-here{background:rgba(242,210,122,.22)}
.dmk-band:hover{background:rgba(249,241,223,.25)}
.dmk-maptabs{display:flex;gap:var(--s-2);margin-bottom:var(--s-3)}
.dmk-diag{padding:var(--s-3);font-size:12px;color:var(--danger);line-height:1.8}
.dmk-detail{margin-top:var(--s-3);padding:var(--s-3);border:1px solid var(--border-strong);
  background:var(--surface-raised);border-radius:var(--r-sm);font-size:14px;line-height:1.8}
.dmk-detail h3{margin:0 0 var(--s-1);font:600 16px var(--serif);color:var(--text-primary)}
.dmk-btn{padding:var(--s-2) var(--s-3);border:1px solid var(--action);border-radius:var(--r-sm);
  background:transparent;color:var(--action);font-size:12px;cursor:pointer}
.dmk-btn:hover{background:var(--action);color:var(--text-on-action)}
.dmk-btn.dmk-primary{background:var(--action);color:var(--text-on-action)}

/* ===== 灶台 ===== */
.dmk-cook{display:grid;gap:var(--s-3)}
.dmk-field label{display:block;font-size:12px;color:var(--text-secondary);margin-bottom:var(--s-1)}
.dmk-field select,.dmk-field input{width:100%;padding:var(--s-2);font-size:14px;
  border:1px solid var(--border-strong);border-radius:var(--r-sm);
  background:var(--surface-raised);color:var(--text-primary)}
.dmk-cook-preview{padding:var(--s-3);background:var(--surface-raised);
  border-left:3px solid var(--action);border-radius:var(--r-sm);
  font-size:14px;line-height:1.8;color:var(--text-primary);word-break:break-word}
.dmk-cook-empty{color:var(--text-secondary);font-size:14px}

/* ===== 设置 ===== */
.dmk-set{position:absolute;inset:0;z-index:3;background:var(--surface);
  display:none;flex-direction:column}
.dmk-set.dmk-on{display:flex}
.dmk-set .dmk-hd{display:flex;align-items:center;gap:var(--s-2)}
.dmk-switch{width:44px;height:24px;border-radius:12px;border:1px solid var(--border-strong);
  background:var(--paper-deep);position:relative;cursor:pointer;flex:0 0 auto;padding:0}
.dmk-switch::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;
  border-radius:50%;background:var(--surface-raised);transition:left 120ms ease}
.dmk-switch.dmk-on{background:var(--success)} .dmk-switch.dmk-on::after{left:22px}
.dmk-ft{padding:var(--s-2) var(--s-6);border-top:1px solid var(--border);
  display:flex;justify-content:space-between;font-size:12px;color:var(--text-tertiary);
  background:var(--surface-raised);flex:0 0 auto}

@media(max-width:640px){
  .dmk-hd{padding:var(--s-3) var(--s-4) var(--s-2)}
  .dmk-hd-title h1{font-size:18px}
  .dmk-subs,.dmk-body{padding-left:var(--s-4);padding-right:var(--s-4)}
  .dmk-ft{padding-left:var(--s-4);padding-right:var(--s-4)}
  .dmk-meter{flex:1 1 45%}
}
`;

let 单例 = null;

function 宿主() {
  try {
    if (window.parent && window.parent !== window && window.parent.document) return window.parent;
  } catch (e) { /* 跨域就退回自身 */ }
  return window;
}

function 元素(标签, 类名, 文本) {
  const win = 宿主();
  const n = win.document.createElement(标签);
  if (类名) n.className = 类名;
  if (文本 !== undefined && 文本 !== null) n.textContent = String(文本);
  return n;
}

function 清空(n) {
  while (n.firstChild) n.removeChild(n.firstChild);
}

function 读位置() {
  try {
    const raw = 宿主().localStorage.getItem(位置键);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    }
  } catch (e) { /* 用默认 */ }
  return { x: 0.975, y: 0.42 };
}

function 存位置(p) {
  try { 宿主().localStorage.setItem(位置键, JSON.stringify(p)); } catch (e) { /* 忽略 */ }
}

function 读记忆页() {
  try { return 宿主().localStorage.getItem(页面键) || ''; } catch (e) { return ''; }
}

function 存记忆页(键) {
  try { 宿主().localStorage.setItem(页面键, 键); } catch (e) { /* 忽略 */ }
}

/* ---------------- 挂载 ---------------- */

export function 挂载() {
  const win = 宿主();
  const 旧 = win.__DMK_SHELL__;
  if (旧) {
    // root 还在就复用；root 被外部移除（例如手动清理卡死的遮罩）则先销毁再重建
    if (win.document.getElementById(根ID)) return 旧;
    旧.销毁();
  }
  const doc = win.document;

  const root = 元素('div');
  root.id = 根ID;
  const style = 元素('style');
  style.textContent = 样式Token + "\n" + 样式;
  root.appendChild(style);

  /* 六维雷达：六边形网格 + 数值多边形。
     尺寸、颜色全部写成 SVG 呈现属性，CSS 没加载也不会变成黑块。 */
  function 雷达(属性) {
    const 轴 = ['体魄', '敏捷', '学识', '洞察', '意志', '魅力'];
    const 值 = 轴.map(function (k) {
      const v = Number(属性 && 属性[k]);
      return isFinite(v) ? v : 0;
    });
    const C = 120, R = 72;
    const 线 = '#c8c3b1', 深线 = '#aca391', 主 = '#8c5a2b', 字 = '#756342';
    function 点(i, v) {
      const a = (-90 + i * 60) * Math.PI / 180;
      const r = R * Math.max(0, Math.min(100, v)) / 100;
      return [C + Math.cos(a) * r, C + Math.sin(a) * r];
    }
    let svg = '<svg width="240" height="240" viewBox="0 0 240 240" role="img" '
      + 'aria-label="六维属性图" style="display:block;width:100%;max-width:260px;height:auto">';

    [20, 40, 60, 80, 100].forEach(function (lv) {
      const pts = 轴.map(function (_, i) {
        const q = 点(i, lv);
        return q[0].toFixed(1) + ',' + q[1].toFixed(1);
      }).join(' ');
      svg += '<polygon points="' + pts + '" fill="none" stroke="'
        + (lv === 100 ? 深线 : 线) + '" stroke-width="1"/>';
    });

    轴.forEach(function (_, i) {
      const q = 点(i, 100);
      svg += '<line x1="' + C + '" y1="' + C + '" x2="' + q[0].toFixed(1)
        + '" y2="' + q[1].toFixed(1) + '" stroke="' + 线 + '" stroke-width="1"/>';
    });

    const poly = 值.map(function (v, i) {
      const q = 点(i, v);
      return q[0].toFixed(1) + ',' + q[1].toFixed(1);
    }).join(' ');
    svg += '<polygon points="' + poly + '" fill="rgba(140,90,43,0.16)" stroke="' + 主
      + '" stroke-width="1.6" stroke-linejoin="round"/>';

    值.forEach(function (v, i) {
      const q = 点(i, v);
      svg += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1)
        + '" r="2.6" fill="' + 主 + '"/>';
    });

    轴.forEach(function (k, i) {
      const a = (-90 + i * 60) * Math.PI / 180;
      const x = C + Math.cos(a) * (R + 22);
      const y = C + Math.sin(a) * (R + 22);
      const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
      svg += '<text x="' + x.toFixed(1) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="' + anchor
        + '" font-size="10" font-family="serif" fill="' + 字 + '">' + k
        + ' <tspan font-weight="600" fill="#352722">' + 值[i] + '</tspan></text>';
    });

    svg += '</svg>';
    const wrap = 元素('div', 'dmk-radar');
    wrap.innerHTML = svg;
    return wrap;
  }

  /* 胶囊 */
  const 胶囊 = 元素('button', null, '🍲');
  胶囊.id = 胶囊ID;
  胶囊.title = '打开迷宫饭面板';
  胶囊.setAttribute('aria-label', '打开迷宫饭面板');
  root.appendChild(胶囊);

  /* 抽屉 */
  const scrim = 元素('div', 'dmk-scrim');
  const 抽屉节点 = 元素('div', 'dmk-drawer');
  抽屉节点.setAttribute('role', 'dialog');
  抽屉节点.setAttribute('aria-modal', 'true');
  抽屉节点.setAttribute('aria-label', '迷宫饭');
  root.appendChild(scrim);
  root.appendChild(抽屉节点);

  const hd = 元素('div', 'dmk-hd');
  const hd1 = 元素('div', 'dmk-hd1');
  const hdTitle = 元素('div', 'dmk-hd-title');
  hdTitle.appendChild(元素('h1', null, '迷宫饭 · 冒险图鉴'));
  const meta = 元素('div', 'dmk-hd-meta');
  const epigraph = 元素('div', 'dmk-epigraph');
  const gear = 元素('button', 'dmk-gear', '⚙');
  gear.title = '设置';
  gear.setAttribute('aria-label', '设置');
  const close = 元素('button', 'dmk-close', '×');
  close.title = '关闭';
  close.setAttribute('aria-label', '关闭图鉴');
  hd1.appendChild(hdTitle);
  hd1.appendChild(gear);
  hd1.appendChild(close);
  const meters = 元素('div', 'dmk-meters');
  hd.appendChild(hd1);
  hd.appendChild(meta);
  hd.appendChild(epigraph);
  hd.appendChild(meters);

  const tabs = 元素('div', 'dmk-tabs');
  tabs.setAttribute('role', 'tablist');
  const subs = 元素('div', 'dmk-subs');
  const body = 元素('div', 'dmk-body');

  const ft = 元素('div', 'dmk-ft');
  ft.appendChild(元素('span', null, '迷宫饭 · 图鉴'));
  ft.appendChild(元素('span', null, 'v0.2'));
  抽屉节点.appendChild(hd);
  抽屉节点.appendChild(tabs);
  抽屉节点.appendChild(subs);
  抽屉节点.appendChild(body);
  抽屉节点.appendChild(ft);

  doc.body.appendChild(root);

  const 状态 = {
    开: false, 页: 读记忆页() || '角色', 子: {}, 滚: 0, 骰子: true,
    地图视图: '世界', 灶台主材: '', 灶台辅材: '', 灶台做法: '',
  };
  页面表.forEach(function (p) { if (p.子) 状态.子[p.键] = p.子[0]; });

  /* ---- 胶囊拖动 ---- */
  (function () {
    const 位 = 读位置();
    const 摆放 = function () {
      const W = win.innerWidth || 1280, H = win.innerHeight || 800;
      胶囊.style.left = Math.max(0, Math.min(W - 36, 位.x * W - 18)) + 'px';
      胶囊.style.top = Math.max(0, Math.min(H - 36, 位.y * H - 18)) + 'px';
    };
    摆放();
    let 拖 = null;
    胶囊.addEventListener('pointerdown', function (e) {
      拖 = { x: e.clientX, y: e.clientY, l: parseFloat(胶囊.style.left), t: parseFloat(胶囊.style.top), moved: false };
      try { 胶囊.setPointerCapture(e.pointerId); } catch (err) { /* 老浏览器 */ }
    });
    胶囊.addEventListener('pointermove', function (e) {
      if (!拖) return;
      const dx = e.clientX - 拖.x, dy = e.clientY - 拖.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) 拖.moved = true;
      胶囊.style.left = Math.max(0, Math.min((win.innerWidth || 1280) - 36, 拖.l + dx)) + 'px';
      胶囊.style.top = Math.max(0, Math.min((win.innerHeight || 800) - 36, 拖.t + dy)) + 'px';
    });
    胶囊.addEventListener('pointerup', function () {
      if (!拖) return;
      if (拖.moved) {
        位.x = (parseFloat(胶囊.style.left) + 18) / (win.innerWidth || 1280);
        位.y = (parseFloat(胶囊.style.top) + 18) / (win.innerHeight || 800);
        存位置(位);
      } else {
        开合(!状态.开);
      }
      拖 = null;
    });
    胶囊.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); 开合(!状态.开); }
    });
  })();

  function 开合(开) {
    状态.开 = 开;
    抽屉节点.classList.toggle('dmk-on', 开);
    scrim.classList.toggle('dmk-on', 开);
    if (开) {
      渲染();
      try { 抽屉节点.setAttribute('tabindex', '-1'); 抽屉节点.focus(); } catch (e) { /* 忽略 */ }
    } else {
      状态.滚 = body.scrollTop || 0;
    }
  }

  scrim.addEventListener('click', function () { 开合(false); });
  close.addEventListener('click', function () { 开合(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && 状态.开) { e.stopPropagation(); 开合(false); }
  });

  /* ---- 顶部数值 ---- */
  function 渲染头部(s) {
    meta.textContent = 格式化时刻(s.世界.时刻) + '　' + 格式化位置(s.世界)
      + (s.世界.天气 ? '　·　' + s.世界.天气 : '');
    epigraph.textContent = s.GM锐评 || '';
    清空(meters);
    const 血 = s.玩家.生命;
    meters.appendChild(条('HP', 血.当前HP, 血.最大HP, 'dmk-hp'));
    if (血.最大MP > 0) meters.appendChild(条('MP', 血.当前MP, 血.最大MP, 'dmk-mp'));
    meters.appendChild(条('饱食', s.饱食度, 100, ''));
    meters.appendChild(条('士气', s.士气, 100, ''));
  }

  function 条(名, 当前, 最大, 类) {
    const box = 元素('div', 'dmk-meter');
    const lab = 元素('div', 'lab');
    lab.appendChild(元素('span', null, 名));
    lab.appendChild(元素('span', null, Math.max(0, Math.round(当前)) + '/' + Math.max(0, Math.round(最大))));
    const bar = 元素('div', 'dmk-bar ' + (类 || ''));
    const fill = 元素('i');
    const pct = 最大 > 0 ? Math.max(0, Math.min(100, 当前 / 最大 * 100)) : 0;
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    box.appendChild(lab);
    box.appendChild(bar);
    return box;
  }

  /* ---- 页签 ---- */
  function 渲染页签() {
    清空(tabs);
    页面表.forEach(function (p) {
      const b = 元素('button', 'dmk-tab', p.键);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(状态.页 === p.键));
      b.addEventListener('click', function () {
        状态.页 = p.键;
        存记忆页(p.键);
        渲染();
      });
      tabs.appendChild(b);
    });
  }

  function 渲染子页签(当前页) {
    清空(subs);
    if (!当前页.子) { subs.style.display = 'none'; return; }
    subs.style.display = 'flex';
    当前页.子.forEach(function (名) {
      const b = 元素('button', 'dmk-sub', 名);
      b.setAttribute('aria-selected', String(状态.子[当前页.键] === 名));
      b.addEventListener('click', function () {
        状态.子[当前页.键] = 名;
        渲染();
      });
      subs.appendChild(b);
    });
  }

  /* ---- 页面 ---- */
  function 渲染() {
    const s = 交互.读();
    渲染头部(s);
    渲染页签();
    const 当前 = 页面表.filter(function (p) { return p.键 === 状态.页; })[0] || 页面表[0];
    渲染子页签(当前);
    const 滚 = body.scrollTop || 0;
    清空(body);
    if (!s.就绪) {
      const d = 元素('div', 'dmk-empty', '变量还没初始化。先确认 MVU 与 [initvar] 世界书条目就位。');
      body.appendChild(d);
      return;
    }
    页(当前.键, 状态.子[当前.键], s);
    body.scrollTop = Math.max(滚, 状态.滚);
    状态.滚 = 0;
  }

  function 页(键, 子, s) {
    if (键 === '角色') return 子 === '装备技能' ? 页装备技能(s) : 子 === '背包' ? 页背包(s) : 子 === '委托' ? 页委托(s) : 页角色状态(s);
    if (键 === '世界') return 子 === '编年' ? 页编年(s) : 页地图(s);
    if (键 === '里程碑') return 页里程碑(s);
    if (键 === '传闻') return 页传闻(s);
    if (键 === '关系') return 页关系(s);
    return 页料理(子, s);
  }

  function 节(标题) {
    const sec = 元素('div', 'dmk-sec');
    if (标题) sec.appendChild(元素('h3', null, 标题));
    return sec;
  }

  function 行(键, 值) {
    const r = 元素('div', 'dmk-row');
    r.appendChild(元素('div', 'k', 键));
    r.appendChild(元素('div', 'v', 值 === '' || 值 === null || 值 === undefined ? '—' : 值));
    return r;
  }

  function 页角色状态(s) {
    const p = s.玩家;
    const a = 节('身份');
    a.appendChild(行('种族', p.身份.种族));
    a.appendChild(行('年龄', p.身份.年龄 || '—'));
    a.appendChild(行('战斗职业', p.身份.战斗职业));
    a.appendChild(行('生活职业', p.身份.生活职业));
    if (p.身份.副业) a.appendChild(行('副业', p.身份.副业));
    body.appendChild(a);

    const b = 节('六维');
    b.appendChild(雷达(p.属性));
    const g = 元素('div', 'dmk-grid');
    Object.keys(p.属性).forEach(function (k) {
      const c = 元素('div', 'dmk-cell');
      c.appendChild(元素('div', 'n', k));
      c.appendChild(元素('div', 'q', p.属性[k]));
      g.appendChild(c);
    });
    b.appendChild(g);
    body.appendChild(b);

    const c = 节('状态');
    c.appendChild(行('伤势', (p.状态.伤势 || []).filter(Boolean).join('；') || '无'));
    c.appendChild(行('体虚', p.状态.体虚 ? '是' : '否'));
    c.appendChild(行('金钱', p.金钱 + ' G'));
    c.appendChild(行('欲念', p.欲念));
    body.appendChild(c);

    if (s.GM锐评) {
      const d = 节('GM 锐评');
      const r = 元素('div', 'dmk-row');
      r.appendChild(元素('div', 'v', s.GM锐评));
      d.appendChild(r);
      body.appendChild(d);
    }
  }

  function 页装备技能(s) {
    const a = 节('装备');
    const 槽 = s.玩家.装备;
    ['武器', '防具', '饰品'].forEach(function (k) {
      const v = 槽[k];
      const 存在 = v && s.玩家.背包[v];
      a.appendChild(行(k, 存在 ? v + (存在.品质 ? '（' + 存在.品质 + '）' : '') : (v || '空')));
    });
    body.appendChild(a);

    const b = 节('技能');
    if (!s.玩家.技能.length) {
      b.appendChild(元素('div', 'dmk-empty', '还没有技能'));
    } else {
      s.玩家.技能.forEach(function (sk) {
        const r = 元素('div', 'dmk-row');
        r.appendChild(元素('div', 'k', sk.name || '—'));
        r.appendChild(元素('div', 'v', (sk.value || 0) + (sk.source ? '　· ' + sk.source : '')));
        b.appendChild(r);
      });
    }
    body.appendChild(b);
  }

  function 页背包(s) {
    const 包 = s.玩家.背包;
    const 名 = Object.keys(包);
    if (!名.length) {
      body.appendChild(元素('div', 'dmk-empty', '背包是空的'));
      return;
    }
    const 类 = {};
    名.forEach(function (k) {
      const it = 包[k] || {};
      const t = it.type || '杂物';
      (类[t] = 类[t] || []).push({ 名: k, it: it });
    });
    Object.keys(类).forEach(function (t) {
      const sec = 节(t);
      类[t].forEach(function (x) {
        const r = 元素('div', 'dmk-row');
        r.appendChild(元素('div', 'k', x.名));
        const v = 元素('div', 'v');
        v.appendChild(元素('span', null, '×' + (x.it.qty || 0)));
        if (x.it.品质) v.appendChild(元素('span', 'dmk-tag', x.it.品质));
        if (x.it.说明) v.appendChild(元素('div', null, x.it.说明));
        r.appendChild(v);
        sec.appendChild(r);
      });
      body.appendChild(sec);
    });
  }

  function 页委托(s) {
    const 名 = Object.keys(s.委托);
    if (!名.length) {
      body.appendChild(元素('div', 'dmk-empty', '没有在进行的委托'));
      return;
    }
    名.forEach(function (k) {
      const it = s.委托[k] || {};
      const sec = 节(k);
      sec.appendChild(行('委托人', it.委托人));
      sec.appendChild(行('目标', it.目标));
      sec.appendChild(行('报酬', it.报酬));
      sec.appendChild(行('期限', it.期限));
      sec.appendChild(行('状态', it.状态));
      body.appendChild(sec);
    });
  }

  function 页关系(s) {
    const 在场 = Object.keys(s.在场);
    if (在场.length) {
      const sec = 节('此刻在场');
      在场.forEach(function (k) {
        const it = s.在场[k] || {};
        const w = 元素('div', 'dmk-who');
        w.appendChild(元素('div', 'dmk-avatar', k.slice(0, 1)));
        const info = 元素('div', 'info');
        const nm = 元素('div', 'nm');
        nm.appendChild(元素('span', null, k));
        info.appendChild(nm);
        if (it.此刻状态) info.appendChild(元素('div', 'rel', it.此刻状态));
        if (it.心声) info.appendChild(元素('div', 'rel', '「' + it.心声 + '」'));
        w.appendChild(info);
        sec.appendChild(w);
      });
      body.appendChild(sec);
    }

    const 名 = Object.keys(s.人物);
    const sec = 节('人物 · ' + 名.length + ' 人');
    if (!名.length) {
      sec.appendChild(元素('div', 'dmk-empty', '还没认识谁'));
    } else {
      名.sort(function (a, b) { return (s.人物[b].好感 || 0) - (s.人物[a].好感 || 0); }).forEach(function (k) {
        const it = s.人物[k] || {};
        const w = 元素('div', 'dmk-who');
        w.appendChild(元素('div', 'dmk-avatar', k.slice(0, 1)));
        const info = 元素('div', 'info');
        const nm = 元素('div', 'nm');
        nm.appendChild(元素('span', null, k));
        nm.appendChild(元素('small', null, (it.好感 >= 0 ? '+' : '') + (it.好感 || 0) + (it.同行 ? ' · 同行' : '')));
        info.appendChild(nm);
        if (it.身份) info.appendChild(元素('div', 'rel', it.身份));
        if (it.关系) info.appendChild(元素('div', 'rel', it.关系));
        w.appendChild(info);
        sec.appendChild(w);
      });
    }
    body.appendChild(sec);
  }

  function 页编年(s) {
    const w = s.世界;
    const a = 节('世界');
    a.appendChild(行('成长度', w.成长度 + ' / 5'));
    a.appendChild(行('迷宫之主', w.迷宫之主));
    a.appendChild(行('君主', w.君主));
    a.appendChild(行('营地', w.营地));
    a.appendChild(行('时刻', 格式化时刻(w.时刻)));
    body.appendChild(a);

    const 已发 = Object.keys(w.节点).filter(function (k) { return w.节点[k] && w.节点[k].状态 !== '未触及'; });
    const b = 节('节点 · ' + 已发.length + ' / 23');
    if (!已发.length) {
      b.appendChild(元素('div', 'dmk-empty', '还没有偏离开局'));
    } else {
      已发.forEach(function (k) {
        const it = w.节点[k];
        b.appendChild(行(k, 状态字(it.状态) + (it.路径 ? '　' + it.路径 : '')));
      });
    }
    body.appendChild(b);

    const 账 = Object.keys(w.账本);
    if (账.length) {
      const d = 节('改动账本');
      账.forEach(function (k) {
        const it = w.账本[k] || {};
        d.appendChild(行(k, (it.连锁 || '') + (it.涉及节点 && it.涉及节点.length ? '　[' + it.涉及节点.join(' ') + ']' : '')));
      });
      body.appendChild(d);
    }
  }

  const 里程碑表 = [
    ['M01', '首次独自解决一次遭遇'], ['M02', '首次做出绝品料理'],
    ['M03', '首次带全队活着回来'], ['M04', '首次识别魔物并记录'],
    ['M05', '首次复活他人'], ['M06', '死过一次并复活'],
    ['M07', '成为黄金之国国王'],
  ];

  function 页里程碑(s) {
    const m = s.世界.里程碑 || {};
    const 里 = 里程碑表.filter(function (x) { return m[x[0]] === true; }).length;
    const a = 节('里程碑 · ' + 里 + ' / 7');
    里程碑表.forEach(function (x) {
      const 成 = m[x[0]] === true;
      const r = 元素('div', 'dmk-mile');
      if (成) r.setAttribute('data-done', '1');
      const n = 元素('span', 'n');
      n.appendChild(元素('b', null, x[0]));
      n.appendChild(document.createTextNode(x[1]));
      const st = 元素('span', 's', 成 ? '已达成' : '—');
      r.appendChild(n);
      r.appendChild(st);
      a.appendChild(r);
    });
    body.appendChild(a);
  }

  function 页传闻(s) {
    const 列 = (s.世界.传闻 || []).filter(Boolean);
    const a = 节('今日传闻 · ' + 列.length + ' / 4');
    if (!列.length) {
      a.appendChild(元素('div', 'dmk-empty', '今天没有新的传闻。'));
    } else {
      列.forEach(function (t) { a.appendChild(元素('div', 'dmk-quote', t)); });
    }
    body.appendChild(a);
  }

  function 状态字(v) {
    if (v === true) return '已发生';
    if (v === false) return '未发生';
    if (v === 'changed') return '走法不同';
    return '未触及';
  }

  /* ---- 地图：点击 → 详情板 → 填进输入框 ---- */
  function 页地图(s) {
    const 视图 = 状态.地图视图 || '世界';
    const bar = 元素('div', 'dmk-maptabs');
    ['世界', '迷宫'].forEach(function (v) {
      const btn = 元素('button', 'dmk-sub', v === '世界' ? '世界图' : '迷宫剖面');
      btn.setAttribute('aria-selected', String(视图 === v));
      btn.addEventListener('click', function () { 状态.地图视图 = v; 渲染(); });
      bar.appendChild(btn);
    });
    body.appendChild(bar);

    const 图 = 视图 === '世界' ? 地图配置.世界 : 地图配置.迷宫;
    const wrap = 元素('div', 'dmk-mapwrap');
    const img = 元素('img');
    img.alt = 视图 === '世界' ? '世界地图' : '迷宫剖面';
    img.loading = 'lazy';
    let 镜像 = 0;
    img.addEventListener('error', function () {
      镜像 += 1;
      if (镜像 < 2) { img.src = 取图地址(图.路径, 镜像); return; }
      if (img.parentNode) wrap.removeChild(img);
      wrap.appendChild(元素('div', 'dmk-diag', '底图加载失败。检查网络，或在设置里切换镜像。'));
    });
    img.src = 取图地址(图.路径, 0);
    wrap.appendChild(img);

    const 详情 = 元素('div', 'dmk-detail');
    详情.appendChild(元素('div', 'dmk-cook-empty', '点图上的标记，查看该处详情。'));
    function 显示详情(名, 说明) {
      清空(详情);
      详情.appendChild(元素('h3', null, 名));
      详情.appendChild(元素('div', null, 说明 || ''));
      const 去 = 元素('button', 'dmk-btn dmk-primary', '前往此处 →');
      去.setAttribute('aria-label', '把前往' + 名 + '填进输入框');
      交互.可点按(去, function () {
        if (!交互.防重复('前往:' + 名, 800)) return;
        交互.写入输入框(交互.前往输入(名), { 提示: '已把「前往' + 名 + '」填进输入框，检查后按发送' });
      });
      详情.appendChild(去);
    }

    if (视图 === '世界') {
      const 当前 = s.世界.位置.大区域;
      地图配置.世界.节点.forEach(function (n) {
        const dot = 元素('button', 'dmk-node' + (n.id === 当前 ? ' dmk-here' : ''));
        dot.style.left = n.x + '%';
        dot.style.top = n.y + '%';
        dot.title = n.id;
        dot.setAttribute('aria-label', n.id);
        交互.可点按(dot, function () { 显示详情(n.id, n.注); });
        wrap.appendChild(dot);
      });
    } else {
      地图配置.迷宫.层带.forEach(function (band) {
        const el = 元素('button', 'dmk-band' + (band.深度 === s.世界.深度 ? ' dmk-here' : ''));
        el.style.top = band.y0 + '%';
        el.style.height = (band.y1 - band.y0) + '%';
        el.setAttribute('aria-label', band.名);
        交互.可点按(el, function () {
          显示详情(band.名, '对应深度：' + String(band.深度));
        });
        wrap.appendChild(el);
      });
    }
    body.appendChild(wrap);
    body.appendChild(详情);

    const cap = 元素('div', 'dmk-empty', 视图 === '世界'
      ? '当前：' + (s.世界.位置.大区域 || '未定') + (s.世界.位置.小地点 ? '·' + s.世界.位置.小地点 : '')
      : '当前：' + (深度名[s.世界.深度] || '地面') + (s.世界.位置.小地点 ? '·' + s.世界.位置.小地点 : ''));
    body.appendChild(cap);
  }

  /* ---- 料理：读背包 → 选料 → 填进输入框（不写变量） ---- */
  const 做法表 = ['煮', '烤', '煎', '炸', '熏', '炖', '凉拌', '生食'];

  function 页料理(子, s) {
    const 图 = s.料理.图鉴;
    if (子 === '图鉴') {
      const 原 = Object.keys(图.原作).length;
      const 创 = Object.keys(图.原创).length;
      const sec1 = 节('原作 · ' + 原 + ' / 17');
      if (!原) sec1.appendChild(元素('div', 'dmk-empty', '还没做过原作菜。第一次做成会自动入册。'));
      else Object.keys(图.原作).forEach(function (k) {
        const it = 图.原作[k] || {};
        sec1.appendChild(行(k, '最佳 ' + (it.best || 1) + '★　做过 ' + (it.times || 0) + ' 次'
          + (it.firstDate ? '　首次 ' + it.firstDate : '')));
      });
      body.appendChild(sec1);
      const sec2 = 节('原创 · ' + 创);
      if (!创) sec2.appendChild(元素('div', 'dmk-empty', '还没有自创菜。表外组合会自动建档。'));
      else Object.keys(图.原创).forEach(function (k) {
        const it = 图.原创[k] || {};
        sec2.appendChild(行(k, (it.配方 && it.配方.主材 ? it.配方.主材 + ' · ' + it.配方.做法 : '')
          + '　做过 ' + (it.times || 0) + ' 次'));
      });
      body.appendChild(sec2);
      return;
    }

    const 食材 = Object.keys(s.玩家.背包).filter(function (k) {
      const it = s.玩家.背包[k];
      return it && it.type === '食材' && Number(it.qty) > 0;
    });

    if (子 === '食材') {
      const sec = 节('背包里的食材 · ' + 食材.length);
      if (!食材.length) {
        sec.appendChild(元素('div', 'dmk-empty', '背包里没有食材。先去迷宫找点能吃的。'));
      } else {
        食材.forEach(function (k) {
          const it = s.玩家.背包[k];
          sec.appendChild(行(k, '×' + it.qty + (it.说明 ? '　' + it.说明 : '')));
        });
      }
      body.appendChild(sec);
      return;
    }

    /* 灶台 */
    const sec = 节('灶台');
    if (!食材.length) {
      sec.appendChild(元素('div', 'dmk-empty', '背包里没有食材，做不了菜。\n去食材页看看，或先在迷宫里找点东西。'));
      body.appendChild(sec);
      return;
    }

    const form = 元素('div', 'dmk-cook');
    function 下拉(标签, 项, 值) {
      const f = 元素('div', 'dmk-field');
      const lab = 元素('label', null, 标签);
      const sel = 元素('select');
      sel.setAttribute('aria-label', 标签);
      项.forEach(function (x) {
        const o = 元素('option', null, x);
        o.value = x;
        sel.appendChild(o);
      });
      sel.value = 值 || 项[0] || '';
      f.appendChild(lab);
      f.appendChild(sel);
      form.appendChild(f);
      return sel;
    }
    const 主材 = 下拉('主材', 食材, 状态.灶台主材 || 食材[0]);
    const 辅材 = 下拉('辅材（可选）', ['无'].concat(食材), 状态.灶台辅材 || '无');
    const 做法 = 下拉('做法', 做法表, 状态.灶台做法 || '煮');
    const 预览 = 元素('div', 'dmk-cook-preview');
    const 发送 = 元素('button', 'dmk-btn dmk-primary', '填进输入框 →');
    发送.setAttribute('aria-label', '把这次做菜写进玩家输入框');

    function 当前消耗() {
      const 耗 = Object.create(null);
      const m = 主材.value;
      if (m) 耗[m] = 1;
      const s2 = 辅材.value;
      if (s2 && s2 !== '无') 耗[s2] = (耗[s2] || 0) + 1;
      return 耗;
    }
    function 刷新预览() {
      状态.灶台主材 = 主材.value;
      状态.灶台辅材 = 辅材.value;
      状态.灶台做法 = 做法.value;
      const 文本 = 交互.料理输入({
        主材: 主材.value, 辅材: 辅材.value === '无' ? [] : [辅材.value],
        做法: 做法.value, 消耗: 当前消耗(),
      });
      预览.textContent = 文本 || '选好主材与做法后，这里会显示将要发送的话。';
      发送.disabled = !文本;
      return 文本;
    }
    [主材, 辅材, 做法].forEach(function (sel) { sel.addEventListener('change', 刷新预览); });
    刷新预览();

    交互.可点按(发送, function () {
      const 文本 = 刷新预览();
      if (!文本) return;
      if (!交互.防重复('做菜:' + 文本, 800)) return;
      交互.写入输入框(文本, { 提示: '已填进输入框。发出后由 AI 结算扣料、饱食与图鉴。' });
    });

    form.appendChild(预览);
    form.appendChild(发送);
    const 提示 = 元素('div', 'dmk-empty', '这里只把选择写成一句话，不改任何变量。扣料、饱食、图鉴由 AI 在变量更新里结算。');
    form.appendChild(提示);
    sec.appendChild(form);
    body.appendChild(sec);
  }

  /* ---- 设置 ---- */
  let 设置层 = null;
  gear.addEventListener('click', function () {
    if (设置层) { 关设置(); return; }
    设置层 = 元素('div', 'dmk-set dmk-on');
    const hd2 = 元素('div', 'dmk-hd');
    const t = 元素('div', 'dmk-hd-title', '设置');
    const close = 元素('button', 'dmk-btn', '返回');
    close.addEventListener('click', 关设置);
    hd2.appendChild(t);
    hd2.appendChild(close);
    const b = 元素('div', 'dmk-body');
    b.appendChild(行('图床镜像', 'testingcf.jsdelivr.net'));
    b.appendChild(行('备用镜像', 'cdn.jsdelivr.net'));
    b.appendChild(行('数据来源', 'MVU stat_data（只读）'));
    const 开关 = 元素('button', 'dmk-switch' + (状态.骰子 ? ' dmk-on' : ''));
    开关.setAttribute('aria-label', '骰子开关');
    开关.setAttribute('aria-pressed', String(!!状态.骰子));
    交互.可点按(开关, function () {
      状态.骰子 = !状态.骰子;
      开关.classList.toggle('dmk-on', 状态.骰子);
      开关.setAttribute('aria-pressed', String(状态.骰子));
    });
    const 行骰 = 元素('div', 'dmk-row');
    行骰.appendChild(元素('div', 'k', '骰子'));
    const v骰 = 元素('div', 'v');
    v骰.appendChild(开关);
    行骰.appendChild(v骰);
    b.appendChild(行骰);
    b.appendChild(行('版本', 'v0.2'));
    设置层.appendChild(hd2);
    设置层.appendChild(b);
    抽屉节点.appendChild(设置层);
  });
  function 关设置() {
    if (设置层 && 设置层.parentNode) 设置层.parentNode.removeChild(设置层);
    设置层 = null;
  }

  /* ---- 数据刷新：共享订阅，销毁时解绑 ---- */
  const 取消订阅 = 交互.订阅刷新(刷新);

  function 刷新() {
    if (!状态.开) return;
    渲染();
  }

  const api = {
    开: function () { 开合(true); },
    关: function () { 开合(false); },
    切换: function () { 开合(!状态.开); },
    刷新: 渲染,
    状态: 状态,
    销毁: function () {
      try { 取消订阅(); } catch (e) { /* 忽略 */ }
      关设置();
      if (root.parentNode) root.parentNode.removeChild(root);
      try { delete win.__DMK_SHELL__; } catch (e) { win.__DMK_SHELL__ = undefined; }
      单例 = null;
    },
  };
  win.__DMK_SHELL__ = api;
  单例 = api;
  return api;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  挂载();
}

export default 挂载;
