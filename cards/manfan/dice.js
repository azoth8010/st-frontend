// ============================================================
// 迷宫饭 · 暗骰池
//
// 从独立脚本「骰子-精简」并入前端：不再单独挂一个悬浮球，
// 开关收进图鉴抽屉的设置页（与主题、镜像放在一起）。
//
// 做法：玩家发出消息时掷一组 D100×16，作为一次性 system 注入塞进本轮，
// 生成结束后撤掉。AI 从骰1开始顺序取用，不得跨轮复用。
//
// 依赖酒馆助手（JS-Slash-Runner）的这几个全局：
//   getVariables / insertOrAssignVariables  读写 chat 变量
//   injectPrompts / uninjectPrompts          一次性注入
//   eventOn / tavern_events                  挂在「发送后」「生成结束」「换档」
// 缺任何一个就静默降级（预览环境里不报错，只是不注入）。
// ============================================================

const 配置键 = 'dice_lite_config';
const 池键 = 'dice_lite_pool';
const 注入ID = 'dmk-dice-pool';

const 默认 = { enabled: true, faces: 100, count: 16 };

let 已绑定 = false;
let 观察者 = [];

/* ---------------- 变量 ---------------- */

function 读变量() {
  try {
    if (typeof getVariables !== 'function') return {};
    return getVariables({ type: 'chat' }) || {};
  } catch (_) { return {}; }
}

function 写变量(补丁) {
  try {
    if (typeof insertOrAssignVariables !== 'function') return false;
    insertOrAssignVariables(补丁, { type: 'chat' });
    return true;
  } catch (_) { return false; }
}

export function 读配置() {
  const raw = 读变量()[配置键];
  return Object.assign({}, 默认, (raw && typeof raw === 'object') ? raw : {});
}

export function 骰子已开() {
  return !!读配置().enabled;
}

export function 设骰子开关(开) {
  const c = 读配置();
  写变量({ [配置键]: Object.assign({}, c, { enabled: !!开 }) });
  if (!开) 撤注入();
  通知();
  return !!开;
}

export function 读池() {
  const p = 读变量()[池键];
  return (p && Array.isArray(p.rolls)) ? p : null;
}

/* ---------------- 掷 ---------------- */

function 掷一颗(faces) {
  try {
    const buf = new Uint32Array(1);
    (globalThis.crypto || window.crypto).getRandomValues(buf);
    return (buf[0] % faces) + 1;
  } catch (_) {
    return Math.floor(Math.random() * faces) + 1;
  }
}

function 掷池(count, faces) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(掷一颗(faces));
  return out;
}

/* ---------------- 注入 ---------------- */

function 文案(rolls, faces) {
  const list = rolls.map((v, i) => '骰' + (i + 1) + ':' + v).join(', ');
  return '\n<system_rng_mechanism>\n' +
    '[本轮暗骰池 D' + faces + ' × ' + rolls.length + '：{ ' + list + ' }]\n' +
    '1. 只在本轮使用，从骰1开始顺序取用，不得顺延上一轮。\n' +
    '2. 每次判定必须报出取用的骰号与数值，例如「骰2=41 ≤ 55，成功」。\n' +
    '3. 骰值耗尽即停止判定，改为纯叙述，不要编造数字。\n' +
    '4. 没有触发判定的轮次不要消耗骰子。\n' +
    '</system_rng_mechanism>';
}

function 注入(rolls, faces) {
  if (typeof injectPrompts !== 'function') return false;
  try { if (typeof uninjectPrompts === 'function') uninjectPrompts([注入ID]); } catch (_) {}
  try {
    injectPrompts([{
      id: 注入ID,
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: 文案(rolls, faces),
      should_scan: false,
    }], { once: true });
    return true;
  } catch (_) { return false; }
}

export function 撤注入() {
  try { if (typeof uninjectPrompts === 'function') uninjectPrompts([注入ID]); } catch (_) {}
}

/** 手动掷一次（调试/换档后用）。 */
export function 掷一轮() {
  const c = 读配置();
  if (!c.enabled) return null;
  const rolls = 掷池(c.count, c.faces);
  写变量({ [池键]: { rolls: rolls, faces: c.faces, at: Date.now() } });
  注入(rolls, c.faces);
  通知();
  return rolls;
}

/* ---------------- 订阅 ---------------- */

export function 订阅骰池(fn) {
  观察者.push(fn);
  return function () { 观察者 = 观察者.filter((f) => f !== fn); };
}

function 通知() {
  观察者.forEach((fn) => { try { fn(); } catch (_) {} });
}

/* ---------------- 挂载 ---------------- */

export function 挂载骰子() {
  if (已绑定) return;
  已绑定 = true;

  const 事件 = (typeof tavern_events !== 'undefined' && tavern_events) || window.tavern_events;
  if (typeof eventOn !== 'function' || !事件) {
    console.warn('[迷宫饭·骰子] 事件不可用，骰池不会自动掷；可手动调用 掷一轮()');
    return;
  }

  // 玩家发出消息后掷池，赶在本轮生成之前注入
  if (事件.MESSAGE_SENT) {
    try {
      const 首 = typeof eventMakeFirst === 'function' ? eventMakeFirst : eventOn;
      首(事件.MESSAGE_SENT, function () { 掷一轮(); });
    } catch (e) { console.warn('[迷宫饭·骰子] 绑 MESSAGE_SENT 失败', e); }
  }

  // 生成结束撤掉，避免污染下一轮
  if (事件.GENERATION_ENDED) {
    try { eventOn(事件.GENERATION_ENDED, 撤注入); } catch (_) {}
  }

  // 换档：旧池作废
  if (事件.CHAT_CHANGED) {
    try { eventOn(事件.CHAT_CHANGED, function () { 撤注入(); 通知(); }); } catch (_) {}
  }
}
