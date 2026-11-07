// ============================================================
// 迷宫饭 · 抽屉外壳（胶囊 → 右侧抽屉，4 个一级页）
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

import { 读状态, 格式化时刻, 格式化位置, 深度名 } from '../../adapter.js';
import { 地图配置, 取图地址 } from '../../map-config.js';

const 根ID = 'dmk-root';
const 胶囊ID = 'dmk-capsule';
const 位置键 = 'dmk:shell:pos';
const 页面键 = 'dmk:shell:page';

const 页面表 = [
  { 键: '角色', 子: ['状态', '装备技能', '背包', '委托'] },
  { 键: '世界', 子: ['地图', '编年'] },
  { 键: '关系', 子: null },
  { 键: '料理', 子: ['灶台', '食材', '图鉴'] },
];

const 样式 = `
#${根ID}{position:fixed;inset:0;z-index:2147483640;pointer-events:none;
  --dmk-paper:#f3e8d2;--dmk-paper2:#e8d9bd;--dmk-ink:#2e2519;--dmk-ink2:#6b5a42;
  --dmk-line:#c8b795;--dmk-accent:#8c5a2b;--dmk-warn:#a33a2a;--dmk-ok:#4a6b3a;
  font-family:-apple-system,"Noto Sans SC","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased}
#${根ID} *{box-sizing:border-box;min-width:0}
#${胶囊ID}{position:fixed;width:36px;height:36px;border-radius:50%;pointer-events:auto;
  background:rgba(46,37,25,.55);border:1px solid rgba(243,232,210,.45);color:#f3e8d2;
  display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;
  cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;
  box-shadow:0 2px 10px rgba(0,0,0,.35);backdrop-filter:blur(2px);transition:opacity .18s}
#${胶囊ID}:active{cursor:grabbing}
#${胶囊ID}:hover{opacity:.92}
.dmk-scrim{position:fixed;inset:0;background:rgba(20,16,11,.34);pointer-events:none;
  opacity:0;visibility:hidden;transition:opacity .2s,visibility .2s}
.dmk-scrim.dmk-on{opacity:1;visibility:visible;pointer-events:auto}
.dmk-drawer{position:fixed;top:0;right:0;width:min(600px,94vw);height:100vh;height:100dvh;
  background:var(--dmk-paper);border-left:1px solid var(--dmk-line);pointer-events:none;
  display:flex;flex-direction:column;transform:translateX(100%);transition:transform .24s ease;
  box-shadow:-6px 0 28px rgba(0,0,0,.22)}
.dmk-drawer.dmk-on{transform:translateX(0);pointer-events:auto}
@media (prefers-reduced-motion:reduce){.dmk-drawer,.dmk-scrim{transition:none}}

.dmk-hd{padding:10px 14px 8px;border-bottom:1px solid var(--dmk-line);background:var(--dmk-paper2)}
.dmk-hd1{display:flex;align-items:center;gap:8px}
.dmk-loc{font-size:12px;color:var(--dmk-ink2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dmk-gear{width:30px;height:30px;border:1px solid var(--dmk-line);background:transparent;
  border-radius:6px;color:var(--dmk-ink2);cursor:pointer;font-size:14px;flex-shrink:0}
.dmk-gear:hover{border-color:var(--dmk-accent);color:var(--dmk-accent)}
.dmk-meters{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap}
.dmk-meter{flex:1 1 96px;min-width:88px}
.dmk-meter .lab{font-size:10.5px;color:var(--dmk-ink2);display:flex;justify-content:space-between}
.dmk-bar{height:5px;border-radius:3px;background:rgba(46,37,25,.13);overflow:hidden;margin-top:3px}
.dmk-bar i{display:block;height:100%;border-radius:3px;background:var(--dmk-accent)}
.dmk-bar.dmk-hp i{background:var(--dmk-warn)}
.dmk-bar.dmk-mp i{background:#4a6b9a}

.dmk-tabs{display:flex;border-bottom:1px solid var(--dmk-line);background:var(--dmk-paper2)}
.dmk-tab{flex:1;padding:9px 4px;border:0;background:transparent;color:var(--dmk-ink2);
  font-size:13px;cursor:pointer;border-bottom:2px solid transparent}
.dmk-tab[aria-selected="true"]{color:var(--dmk-ink);font-weight:600;border-bottom-color:var(--dmk-accent)}
.dmk-subs{display:flex;gap:6px;padding:8px 12px;overflow-x:auto;border-bottom:1px solid var(--dmk-line)}
.dmk-sub{flex:0 0 auto;padding:4px 11px;border-radius:14px;border:1px solid var(--dmk-line);
  background:transparent;color:var(--dmk-ink2);font-size:12px;cursor:pointer}
.dmk-sub[aria-selected="true"]{background:var(--dmk-accent);border-color:var(--dmk-accent);color:#fdf6e8}

.dmk-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 14px 22px}
.dmk-sec{margin:0 0 16px}
.dmk-sec h3{margin:0 0 7px;font-size:11.5px;font-weight:600;color:var(--dmk-ink2);letter-spacing:1px}
.dmk-row{display:flex;gap:10px;padding:6px 0;border-bottom:1px dashed rgba(200,183,149,.55);font-size:13px}
.dmk-row:last-child{border-bottom:0}
.dmk-row .k{flex:0 0 68px;color:var(--dmk-ink2);font-size:12px}
.dmk-row .v{flex:1;color:var(--dmk-ink);word-break:break-word}
.dmk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:6px}
.dmk-cell{background:rgba(255,255,255,.45);border:1px solid var(--dmk-line);border-radius:7px;
  padding:6px 8px;text-align:center}
.dmk-cell .n{font-size:10.5px;color:var(--dmk-ink2)}
.dmk-cell .q{font-size:15px;font-weight:600;color:var(--dmk-ink);margin-top:1px}
.dmk-tag{display:inline-block;padding:1px 7px;border-radius:9px;font-size:11px;
  border:1px solid var(--dmk-line);color:var(--dmk-ink2);margin:0 4px 4px 0}
.dmk-empty{padding:26px 8px;text-align:center;color:var(--dmk-ink2);font-size:12.5px;line-height:1.8}
.dmk-avatar{width:34px;height:34px;border-radius:50%;background:var(--dmk-accent);color:#fdf6e8;
  display:flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto}
.dmk-who{display:flex;gap:9px;padding:7px 0;border-bottom:1px dashed rgba(200,183,149,.55)}
.dmk-who .info{flex:1;min-width:0}
.dmk-who .nm{font-size:13px;color:var(--dmk-ink);display:flex;gap:6px;align-items:baseline}
.dmk-who .nm small{font-size:10.5px;color:var(--dmk-ink2)}
.dmk-who .rel{font-size:11.5px;color:var(--dmk-ink2);margin-top:2px;word-break:break-word}
.dmk-mapwrap{position:relative;width:100%;background:#1b1610;border:1px solid var(--dmk-line);border-radius:6px;overflow:hidden}
.dmk-mapwrap img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none}
.dmk-node{position:absolute;transform:translate(-50%,-50%);width:11px;height:11px;border-radius:50%;
  background:rgba(243,232,210,.55);border:1.5px solid rgba(46,37,25,.65);pointer-events:none}
.dmk-node.dmk-here{width:15px;height:15px;background:#f2d27a;border-color:#fff;
  box-shadow:0 0 0 3px rgba(242,210,122,.32),0 0 14px rgba(242,210,122,.75)}
.dmk-band{position:absolute;left:0;right:0;background:rgba(243,232,210,.14);
  border-top:1px solid rgba(243,232,210,.65);border-bottom:1px solid rgba(243,232,210,.65);pointer-events:none}
.dmk-maptabs{display:flex;gap:6px;margin-bottom:8px}
.dmk-diag{padding:14px;font-size:12px;color:var(--dmk-warn);line-height:1.8}
.dmk-set{position:absolute;inset:0;background:var(--dmk-paper);z-index:2;display:flex;flex-direction:column}
.dmk-set .dmk-hd{display:flex;align-items:center;gap:8px}
.dmk-btn{padding:6px 12px;border-radius:6px;border:1px solid var(--dmk-line);background:transparent;
  color:var(--dmk-ink);font-size:12.5px;cursor:pointer}
.dmk-btn:hover{border-color:var(--dmk-accent);color:var(--dmk-accent)}
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
  style.textContent = 样式;
  root.appendChild(style);

  /* 胶囊 */
  const 胶囊 = 元素('button', null, '⌘');
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
  const loc = 元素('div', 'dmk-loc');
  const gear = 元素('button', 'dmk-gear', '⚙');
  gear.title = '设置';
  gear.setAttribute('aria-label', '设置');
  hd1.appendChild(loc);
  hd1.appendChild(gear);
  const meters = 元素('div', 'dmk-meters');
  hd.appendChild(hd1);
  hd.appendChild(meters);

  const tabs = 元素('div', 'dmk-tabs');
  tabs.setAttribute('role', 'tablist');
  const subs = 元素('div', 'dmk-subs');
  const body = 元素('div', 'dmk-body');

  抽屉节点.appendChild(hd);
  抽屉节点.appendChild(tabs);
  抽屉节点.appendChild(subs);
  抽屉节点.appendChild(body);

  doc.body.appendChild(root);

  const 状态 = {
    开: false, 页: 读记忆页() || '角色', 子: {}, 滚: 0,
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
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && 状态.开) { e.stopPropagation(); 开合(false); }
  });

  /* ---- 顶部数值 ---- */
  function 渲染头部(s) {
    清空(loc);
    loc.textContent = 格式化位置(s.世界) + (s.世界.天气 ? ' · ' + s.世界.天气 : '');
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
    const s = 读状态();
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

    const 里 = Object.keys(w.里程碑).filter(function (k) { return w.里程碑[k] === true; });
    if (里.length) {
      const c = 节('里程碑 · ' + 里.length + ' / 7');
      里.forEach(function (k) { c.appendChild(行(k, '已达成')); });
      body.appendChild(c);
    }

    const 账 = Object.keys(w.账本);
    if (账.length) {
      const d = 节('改动账本');
      账.forEach(function (k) {
        const it = w.账本[k] || {};
        d.appendChild(行(k, (it.连锁 || '') + (it.涉及节点 && it.涉及节点.length ? '　[' + it.涉及节点.join(' ') + ']' : '')));
      });
      body.appendChild(d);
    }

    if (w.传闻.length) {
      const e = 节('今日传闻');
      w.传闻.forEach(function (t) { e.appendChild(行('·', t)); });
      body.appendChild(e);
    }
  }

  function 状态字(v) {
    if (v === true) return '已发生';
    if (v === false) return '未发生';
    if (v === 'changed') return '走法不同';
    return '未触及';
  }

  /* ---- 地图 ---- */
  function 页地图(s) {
    const 视图 = 状态.地图视图 || '世界';
    const bar = 元素('div', 'dmk-maptabs');
    ['世界', '迷宫'].forEach(function (v) {
      const b = 元素('button', 'dmk-sub', v === '世界' ? '世界图' : '迷宫剖面');
      b.setAttribute('aria-selected', String(视图 === v));
      b.addEventListener('click', function () { 状态.地图视图 = v; 渲染(); });
      bar.appendChild(b);
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
      wrap.removeChild(img);
      wrap.appendChild(元素('div', 'dmk-diag', '底图加载失败。检查网络，或把镜像切到 cdn.jsdelivr.net。'));
    });
    img.src = 取图地址(图.路径, 0);
    wrap.appendChild(img);

    if (视图 === '世界') {
      const 当前 = s.世界.位置.大区域;
      地图配置.世界.节点.forEach(function (n) {
        const dot = 元素('div', 'dmk-node' + (n.id === 当前 ? ' dmk-here' : ''));
        dot.style.left = n.x + '%';
        dot.style.top = n.y + '%';
        dot.title = n.id;
        wrap.appendChild(dot);
      });
    } else {
      const 层 = 层带按深度(s.世界.深度);
      if (层) {
        const band = 元素('div', 'dmk-band');
        band.style.top = 层.y0 + '%';
        band.style.height = (层.y1 - 层.y0) + '%';
        wrap.appendChild(band);
      }
    }
    body.appendChild(wrap);

    const cap = 元素('div', 'dmk-empty', 视图 === '世界'
      ? '当前：' + (s.世界.位置.大区域 || '未定') + (s.世界.位置.小地点 ? '·' + s.世界.位置.小地点 : '')
      : '当前：' + (深度名[s.世界.深度] || '地面') + (s.世界.位置.小地点 ? '·' + s.世界.位置.小地点 : ''));
    body.appendChild(cap);

    const 传说 = 元素('div', 'dmk-sec');
    const tags = 元素('div');
    (视图 === '世界' ? 地图配置.世界.节点.map(function (n) { return n.id; })
      : 地图配置.迷宫.层带.map(function (b) { return b.名; })).forEach(function (name) {
      tags.appendChild(元素('span', 'dmk-tag', name));
    });
    传说.appendChild(tags);
    body.appendChild(传说);
  }

  function 层带按深度(深度) {
    const 表 = 地图配置.迷宫.层带;
    for (let i = 0; i < 表.length; i++) if (表[i].深度 === 深度) return 表[i];
    return null;
  }

  /* ---- 料理（占位） ---- */
  function 页料理(子, s) {
    const 图 = s.料理.图鉴;
    if (子 === '图鉴') {
      const 原 = Object.keys(图.原作).length;
      const 创 = Object.keys(图.原创).length;
      const a = 节('原作 · ' + 原 + ' / 17');
      if (!原) a.appendChild(元素('div', 'dmk-empty', '还没做过原作菜'));
      else Object.keys(图.原作).forEach(function (k) {
        const it = 图.原作[k] || {};
        a.appendChild(行(k, '最佳 ' + (it.best || 1) + '★　做过 ' + (it.times || 0) + ' 次'));
      });
      body.appendChild(a);
      const b = 节('原创 · ' + 创);
      if (!创) b.appendChild(元素('div', 'dmk-empty', '还没有自创菜'));
      else Object.keys(图.原创).forEach(function (k) {
        const it = 图.原创[k] || {};
        b.appendChild(行(k, (it.配方 && it.配方.主材 ? it.配方.主材 + '·' + it.配方.做法 : '') + '　做过 ' + (it.times || 0) + ' 次'));
      });
      body.appendChild(b);
      return;
    }
    body.appendChild(元素('div', 'dmk-empty', '料理台图形界面稍后接入。\n这一页会放灶台与食材，数据已经在 MVU 里。'));
  }

  /* ---- 设置 ---- */
  let 设置层 = null;
  gear.addEventListener('click', function () {
    if (设置层) { 关设置(); return; }
    设置层 = 元素('div', 'dmk-set');
    const hd2 = 元素('div', 'dmk-hd');
    const t = 元素('div', 'dmk-loc', '设置');
    const close = 元素('button', 'dmk-btn', '返回');
    close.addEventListener('click', 关设置);
    hd2.appendChild(t);
    hd2.appendChild(close);
    const b = 元素('div', 'dmk-body');
    b.appendChild(行('图床镜像', 'testingcf.jsdelivr.net'));
    b.appendChild(行('备用镜像', 'cdn.jsdelivr.net'));
    b.appendChild(行('数据来源', 'MVU stat_data（只读）'));
    b.appendChild(行('版本', '0.1.0 · 骨架'));
    b.appendChild(元素('div', 'dmk-empty', '骰子开关、清缓存、更新检查稍后接入。'));
    设置层.appendChild(hd2);
    设置层.appendChild(b);
    抽屉节点.appendChild(设置层);
  });
  function 关设置() {
    if (设置层 && 设置层.parentNode) 设置层.parentNode.removeChild(设置层);
    设置层 = null;
  }

  /* ---- 数据刷新 ---- */
  function 订阅() {
    try {
      if (typeof eventOn === 'function' && window.tavern_events) {
        if (window.tavern_events.MESSAGE_RECEIVED) eventOn(window.tavern_events.MESSAGE_RECEIVED, 刷新);
        if (window.tavern_events.CHAT_CHANGED) eventOn(window.tavern_events.CHAT_CHANGED, 刷新);
      }
    } catch (e) { /* 事件不可用就只靠打开时刷新 */ }
    try {
      if (typeof Mvu !== 'undefined' && Mvu && Mvu.events && Mvu.events.VARIABLE_UPDATE_ENDED) {
        eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, 刷新);
      }
    } catch (e) { /* 同上 */ }
  }

  function 刷新() {
    if (!状态.开) return;
    渲染();
  }

  订阅();

  const api = {
    开: function () { 开合(true); },
    关: function () { 开合(false); },
    切换: function () { 开合(!状态.开); },
    刷新: 渲染,
    状态: 状态,
    销毁: function () {
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
