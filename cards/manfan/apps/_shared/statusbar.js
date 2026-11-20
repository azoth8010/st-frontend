// ============================================================
// 状态条：把 <StatusPlaceHolderImpl/> 渲染出的 .mz-sb 填上数值
//
// 为什么代码在这里而不在正则里：
//   正则替换串里的 <script> 是 innerHTML 插入的，按 HTML 规范不会执行。
//   所以正则只输出 div + style，数值由本模块（TavernHelper 脚本环境）填。
//
// 数据只读：走 交互.读()，与抽屉、地图用的是同一份归一化状态。
// ============================================================

import { 读, 订阅刷新 } from './interaction.js';

const 层名 = {
  1: '第一层', 2: '第二层', 3: '第三层', 4: '第四层',
  5: '第五层', 6: '第六层', 7: '第七层', 8: '第八层',
  '黄金之乡': '黄金之乡', '无': '地面',
};

function 取(对象, 路径) {
  try {
    return 路径.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, 对象);
  } catch (e) { return undefined; }
}

function 时刻(t) {
  if (!t || (!t.年 && !t.月 && !t.日)) return '时间未定';
  return t.年 + '年' + t.月 + '月' + t.日 + '日' + (t.时间 ? ' ' + t.时间 : '');
}

function 位置(w) {
  if (!w) return '位置未定';
  const 深 = w.深度;
  const 位 = w.位置 || {};
  if (深 !== undefined && 深 !== '无' && 深 !== '') {
    const 层 = 层名[深] || ('第' + 深 + '层');
    return (位.小地点 || 位.小区域 || 层) + '·' + 层;
  }
  return [位.大区域, 位.小区域, 位.小地点].filter(Boolean).join('·') || '位置未定';
}

function 填(el, sd) {
  const w = 取(sd, '世界') || {};
  const t = el.querySelector('[data-f="t"]');
  const p = el.querySelector('[data-f="p"]');
  const s = el.querySelector('[data-f="s"]');
  if (t) t.textContent = 时刻(w.时刻 || {});
  if (p) p.textContent = 位置(w);

  let 饱 = Number(取(sd, '饱食度'));
  if (!isFinite(饱)) 饱 = 0;
  if (s) s.textContent = '饱食 ' + 饱;

  el.setAttribute('data-low', 饱 < 35 ? '1' : '0');
  el.setAttribute('data-ready', '1');
}

let 单例 = null;

/** 幂等挂载：扫一遍现有状态条，之后随刷新重填。 */
export function 挂载状态条() {
  if (单例) return 单例;

  function 扫(强制) {
    const 选 = 强制 ? '.mz-sb' : '.mz-sb:not([data-ready])';
    const 节 = document.querySelectorAll(选);
    if (!节.length) return;
    const sd = 读() || {};
    for (let i = 0; i < 节.length; i++) 填(节[i], sd);
  }

  扫(false);

  const 观察 = new MutationObserver(function () { 扫(false); });
  try { 观察.observe(document.body, { childList: true, subtree: true }); } catch (e) { /* 忽略 */ }

  const 取消订阅 = 订阅刷新(function () { 扫(true); });

  单例 = {
    刷新: function () { 扫(true); },
    销毁: function () {
      try { 观察.disconnect(); } catch (e) { /* 忽略 */ }
      try { 取消订阅(); } catch (e) { /* 忽略 */ }
      单例 = null;
    },
  };
  return 单例;
}

export default 挂载状态条;
