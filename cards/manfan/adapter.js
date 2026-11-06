// ============================================================
// 迷宫饭 · 只读桥
//
// 规则：**所有 MVU 路径只允许出现在这个文件里**。
// 界面组件只读归一化后的对象（状态.玩家.生命.当前HP），不许出现
// stat_data / Mvu / 世界/时刻 这类字符串。
//
// 好处：schema 改字段名时只改这一个文件；换一张卡只换 adapter。
// 只读：本文件不写任何变量。
// ============================================================

/** MVU 路径表。改 schema 只改这里。 */
export const 路径表 = {
  世界: '世界',
  玩家: '玩家',
  人物: '人物',
  在场: '在场',
  委托: '委托',
  料理: '料理',
  饱食度: '饱食度',
  士气: '士气',
  GM锐评: 'GM锐评',
};

const 默认生命 = { 当前HP: 0, 最大HP: 0, 当前MP: 0, 最大MP: 0 };
const 默认属性 = { 体魄: 0, 敏捷: 0, 学识: 0, 洞察: 0, 意志: 0, 魅力: 0 };
const 默认身份 = { 种族: '', 年龄: 0, 战斗职业: '', 生活职业: '', 副业: null };
const 默认时刻 = { 年: 0, 月: 0, 日: 0, 时间: '' };
const 默认位置 = { 大区域: '', 小区域: '', 小地点: '' };

function 是对象(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function 对象(v, 兜底) {
  return 是对象(v) ? v : 兜底;
}

function 数(v, 兜底 = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 兜底;
}

function 字(v, 兜底 = '') {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return 兜底;
}

function 数组(v) {
  return Array.isArray(v) ? v : [];
}

/**
 * 取原始 stat_data。三路兜底，任一失败都返回 {}，绝不抛。
 * 不缓存——每轮都要读最新值。
 */
export function 读原始() {
  try {
    if (typeof Mvu !== 'undefined' && Mvu && typeof Mvu.getMvuData === 'function') {
      const d = Mvu.getMvuData({ type: 'message' });
      if (d && d.data && 是对象(d.data.stat_data)) return d.data.stat_data;
      if (d && 是对象(d.stat_data)) return d.stat_data;
    }
  } catch (e) { /* 继续试下一条路 */ }
  try {
    if (typeof getVariables === 'function') {
      const v = getVariables({ type: 'message' });
      if (是对象(v) && 是对象(v.stat_data)) return v.stat_data;
      if (是对象(v)) return v;
    }
  } catch (e) { /* 都没有就空 */ }
  return {};
}

/**
 * 归一化后的状态。字段缺失一律给兜底值，界面不需要再判断 null。
 * 返回 { 就绪, 世界, 玩家, 人物, 在场, 委托, 饱食度, 士气, GM锐评 }
 */
export function 读状态() {
  const 原 = 读原始();
  const 就绪 = Object.keys(原).length > 0;

  const 世 = 对象(原.世界, {});
  const 玩 = 对象(原.玩家, {});
  const 图 = 对象(对象(原.料理, {}).图鉴, {});

  return {
    就绪,
    世界: {
      时刻: { ...默认时刻, ...对象(世.时刻, {}) },
      位置: { ...默认位置, ...对象(世.位置, {}) },
      深度: 世.深度 === undefined ? '无' : 世.深度,
      天气: 字(世.天气),
      营地: 字(世.营地),
      成长度: 数(世.成长度, 1),
      迷宫之主: 字(世.迷宫之主, '无'),
      君主: 字(世.君主, '无'),
      节点: 对象(世.节点, {}),
      里程碑: 对象(世.里程碑, {}),
      账本: 对象(世.账本, {}),
      传闻: 数组(世.传闻).filter(function (x) { return typeof x === 'string' && x; }),
    },
    玩家: {
      身份: { ...默认身份, ...对象(玩.身份, {}) },
      属性: { ...默认属性, ...对象(玩.属性, {}) },
      生命: { ...默认生命, ...对象(玩.生命, {}) },
      金钱: 数(玩.金钱, 0),
      欲念: 字(玩.欲念),
      技能: 数组(玩.技能).filter(是对象),
      装备: { 武器: null, 防具: null, 饰品: null, ...对象(玩.装备, {}) },
      背包: 对象(玩.背包, {}),
      状态: { 体虚: false, 伤势: [], ...对象(玩.状态, {}) },
    },
    人物: 对象(原.人物, {}),
    在场: 对象(原.在场, {}),
    委托: 对象(原.委托, {}),
    料理: { 图鉴: { 原作: 对象(图.原作, {}), 原创: 对象(图.原创, {}) } },
    饱食度: 数(原.饱食度, 0),
    士气: 数(原.士气, 0),
    GM锐评: 字(原.GM锐评),
  };
}

/** 深度 → 显示名。世界页与状态条共用。 */
export const 深度名 = {
  1: '第一层', 2: '第二层', 3: '第三层', 4: '第四层',
  5: '第五层', 6: '第六层', 7: '第七层', 8: '第八层',
  黄金之乡: '黄金之乡', 无: '地面',
};

/** "514年2月23日 09:00" —— 缺值时不显示 0年0月。 */
export function 格式化时刻(时刻) {
  const t = 对象(时刻, 默认时刻);
  if (!t.年 && !t.月 && !t.日) return '时间未定';
  return t.年 + '年' + t.月 + '月' + t.日 + '日' + (t.时间 ? ' ' + t.时间 : '');
}

/** 位置一行：迷宫里显示「第二层·尖塔之森」，地面显示「岛·梅里尼村」。 */
export function 格式化位置(世界) {
  const w = 对象(世界, {});
  const 深 = w.深度;
  const 位 = 对象(w.位置, 默认位置);
  if (深 !== '无' && 深 !== undefined) {
    const 层 = 深度名[深] || ('第' + 深 + '层');
    return (位.小地点 || 位.小区域 || 层) + '·' + 层;
  }
  return [位.大区域, 位.小区域, 位.小地点].filter(Boolean).join('·') || '位置未定';
}
