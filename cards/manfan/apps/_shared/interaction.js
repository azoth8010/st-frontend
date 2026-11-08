// ============================================================
// 共享交互层 · 所有 app 共用
//
// 地图与料理台都需要同样三件事：读 MVU、点击、把结果写进玩家输入框。
// 这一层把它们收在一处，避免每个 app 各写一份、行为不一致。
//
// 约束（sillytavern-embedded-ui）：
//   · 只读 stat_data，绝不写变量（写是 AI 的事）
//   · 跨 iframe 访问一律 try/catch
//   · 不覆盖玩家已输入的文字
//   · 发送失败保留文本，给可见提示
//   · 只填输入框，不替玩家自动点发送
// ============================================================

import { 读状态 } from '../../adapter.js';

/** 宿主窗口：优先 parent，跨域时退回自身。 */
export function 宿主窗() {
  try {
    if (window.parent && window.parent !== window && window.parent.document) return window.parent;
  } catch (e) { /* 跨域 */ }
  return window;
}

export function 宿主文档() {
  try { return 宿主窗().document; } catch (e) { return document; }
}

/** 读归一化后的状态。所有 app 只走这里，不直接碰 Mvu / getVariables。 */
export function 读() {
  return 读状态();
}

/* ---------------- 写入玩家输入框 ---------------- */

let 提示节点 = null;
let 提示计时 = 0;

/** 单例轻提示。命名空间 dmk-*，不与别的卡冲突。 */
export function 轻提示(消息) {
  try {
    const 文档 = 宿主文档();
    if (!提示节点 || !提示节点.isConnected) {
      提示节点 = 文档.createElement('div');
      提示节点.className = 'dmk-toast';
      提示节点.setAttribute('role', 'status');
      提示节点.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);'
        + 'z-index:2147483647;max-width:min(420px,90vw);padding:9px 14px;border-radius:4px;'
        + 'background:#352722;color:#f9f1df;border:1px solid #8c5a2b;font:13px/1.6 sans-serif;'
        + 'box-shadow:0 4px 14px rgba(0,0,0,.3)';
      文档.body.appendChild(提示节点);
    }
    提示节点.textContent = String(消息);
    clearTimeout(提示计时);
    提示计时 = setTimeout(function () {
      if (提示节点 && 提示节点.parentNode) 提示节点.parentNode.removeChild(提示节点);
      提示节点 = null;
    }, 2600);
  } catch (e) { /* 提示失败不阻断主流程 */ }
}

/**
 * 把文本追加到玩家输入框，不覆盖已有内容，不自动发送。
 * 返回 true / false。失败时尝试复制到剪贴板并给提示。
 */
export function 写入输入框(文本, 选项) {
  const 配置 = 选项 || {};
  const 内容 = String(文本 || '').trim();
  if (!内容) return false;
  try {
    const 文档 = 宿主文档();
    const 输入框 = 文档.querySelector('#send_textarea');
    if (!输入框) return 回退复制(内容, '没找到输入框，已复制文本');
    const 现有 = String(输入框.value || '').replace(/\s+$/, '');
    输入框.value = 现有 ? 现有 + '\n' + 内容 : 内容;
    try {
      输入框.dispatchEvent(new (宿主窗().Event || Event)('input', { bubbles: true }));
    } catch (e) { /* 某些宿主不派发也没关系，值已经写进去 */ }
    try { 输入框.focus(); } catch (e) { /* 忽略 */ }
    try { 输入框.setSelectionRange(输入框.value.length, 输入框.value.length); } catch (e) { /* 忽略 */ }
    轻提示(配置.提示 || '已填进输入框，检查后按发送');
    return true;
  } catch (e) {
    return 回退复制(内容, '无法写入输入框，已复制文本');
  }
}

function 回退复制(内容, 文案) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(内容);
      轻提示(文案);
      return true;
    }
  } catch (e) { /* 继续 */ }
  轻提示('无法写入输入框，也无法复制；请手动输入');
  return false;
}

/* ---------------- 防重复 ---------------- */

const 最近 = Object.create(null);

/** 同一键在 毫秒 内只放行一次。用于防手抖造成两条重复输入。 */
export function 防重复(键, 毫秒) {
  const 现在 = Date.now();
  const 间隔 = 毫秒 === undefined ? 600 : 毫秒;
  if (最近[键] && 现在 - 最近[键] < 间隔) return false;
  最近[键] = 现在;
  return true;
}

/* 原作菜：主材|做法 → 菜名。17 道，见 02-Projects/迷宫饭/料理英文名对照.md。 */
const 原作菜 = {
  '大蝎子|煮': '大蝎子与走路菇水炊',
  '史莱姆|熏': '史莱姆干',
  '走路菇|烤': '烤走路菇',
  '食人植物|烤': '食人植物果实塔',
  '巴西利斯克|烤': '烤巴西利斯克',
  '曼德拉草|煎': '曼德拉草与巴西利斯克欧姆蛋',
  '曼德拉草|炸': '曼德拉草炸什锦',
  '大蝙蝠|炸': '大蝙蝠天妇罗',
  '移动铠甲|炖': '动铠全席',
  '巨魔像菜园蔬菜|凉拌': '巨魔像菜园蔬菜午餐',
  '豆与根菜|煮': '掠夺蔬菜与鸡肉卷心菜煮',
  '圣水|生食': '除灵雪酪',
  '宝箱怪|煮': '盐煮宝箱怪',
  '宝物虫|煮': '宝物虫巢果酱',
  '宝物虫|烤': '珍珠蜈蚣串烧',
  '鹰马|炖': '鹰马汤',
  '红龙|烤': '炎龙排',
};

/**
 * 生成一条料理线索行，供叙事 AI 结算。
 * 形如：〔料理｜烤走路菇｜原作｜主材 走路菇｜做法 烤｜辅材 无｜消耗 走路菇×1〕
 * 品质与结果由 AI 掷骰判定，不进这一行。
 */
export function 料理输入(选项) {
  const o = 选项 || {};
  const 主材 = String(o.主材 || '').trim();
  const 做法 = String(o.做法 || '').trim();
  const 辅材 = (o.辅材 || []).filter(Boolean);
  const 消耗 = Object.keys(o.消耗 || {}).map(function (名) {
    return 名 + '×' + o.消耗[名];
  });
  if (!主材 || !做法 || !消耗.length) return '';
  const 键 = 主材 + '|' + 做法;
  const 原作 = 原作菜[键];
  const 菜名 = 原作 || (做法 + 主材);
  return '〔料理｜' + 菜名 + '｜' + (原作 ? '原作' : '原创')
    + '｜主材 ' + 主材 + '｜做法 ' + 做法
    + '｜辅材 ' + (辅材.length ? 辅材.join('、') : '无')
    + '｜消耗 ' + 消耗.join('、') + '〕';
}

/** 生成地图「前往」用的玩家输入。 */
export function 前往输入(地点) {
  const 名 = String(地点 || '').trim();
  return 名 ? '我前往' + 名 + '。' : '';
}

/* ---------------- 事件订阅 ---------------- */

/**
 * 订阅数据变化，节流后回调。返回 disposer。
 * 只接事件，不轮询；事件不可用时静默降级（打开面板时仍会主动刷新）。
 */
export function 订阅刷新(回调) {
  const 停 = [];
  let 计时 = 0;
  const 触发 = function () {
    clearTimeout(计时);
    计时 = setTimeout(function () {
      try { 回调(); } catch (e) { /* 单个回调出错不掐断订阅 */ }
    }, 80);
  };
  try {
    const 窗 = 宿主窗();
    if (typeof eventOn === 'function' && 窗.tavern_events) {
      const 事件表 = 窗.tavern_events;
      ['MESSAGE_RECEIVED', 'CHAT_CHANGED', 'MESSAGE_UPDATED'].forEach(function (键) {
        if (事件表[键]) {
          const r = eventOn(事件表[键], 触发);
          停.push(function () { if (r && typeof r.stop === 'function') r.stop(); });
        }
      });
    }
    if (typeof Mvu !== 'undefined' && Mvu && Mvu.events && typeof eventOn === 'function') {
      ['VARIABLE_UPDATE_ENDED', 'VARIABLE_INITIALIZED'].forEach(function (键) {
        if (Mvu.events[键]) {
          const r = eventOn(Mvu.events[键], 触发);
          停.push(function () { if (r && typeof r.stop === 'function') r.stop(); });
        }
      });
    }
  } catch (e) { /* 事件不可用就降级 */ }
  return function () {
    clearTimeout(计时);
    停.forEach(function (fn) { try { fn(); } catch (e) { /* 忽略 */ } });
  };
}

/** 给元素绑点击 + 键盘（Space / Enter），并保证有可访问名。 */
export function 可点按(元素, 处理, 可访问名) {
  if (!元素) return;
  if (可访问名 && !元素.getAttribute('aria-label')) 元素.setAttribute('aria-label', 可访问名);
  元素.addEventListener('click', function (e) { 处理(e, 元素); });
  元素.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); 处理(e, 元素); }
  });
}
