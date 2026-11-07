// 由 04-Toolkit/前端平台/tokens.css 同步生成；离线测试会校验两边一致。
// 不用 <link>，避免远程 CSS 的第二次请求与失败即全裸的风险。
export const 样式Token = `/* ============================================================
   迷宫饭 · 冒险图鉴 — 设计令牌 v1
   来源：design-tokens.json（唯一真源），按 refactoring-ui Workflow A 生成
   色阶：generate_palette.py（§5.3.3）｜对比度：check_contrast.py（§5.6）
   规则：组件只引用 semantic 层，不直接引用 primitive 层（§5.2.3）
   ============================================================ */
:root {
  /* ---- primitive · 色 ---- */
  --paper-base:#f3e8d2; --paper-raised:#f9f1df; --paper-sunken:#e8d9bd; --paper-deep:#dcc9a5;

  --primary-100:#fffbeb; --primary-200:#f3e6aa; --primary-300:#d8be79; --primary-400:#ba8e4a;
  --primary-500:#8c5a2b; --primary-600:#804c24; --primary-700:#743e1d; --primary-800:#683116; --primary-900:#5c250f;

  --neutral-100:#fdfdf6; --neutral-200:#e4e2d3; --neutral-300:#c8c3b1; --neutral-400:#aca391;
  --neutral-500:#8f8270; --neutral-600:#796a5c; --neutral-700:#625349; --neutral-800:#4c3c35; --neutral-900:#352722;

  --danger-100:#fff4eb; --danger-200:#fbcea7; --danger-300:#e4aa77; --danger-400:#ca754a;
  --danger-500:#a33a2a; --danger-600:#932e21; --danger-700:#842319; --danger-800:#731910; --danger-900:#630f08;

  --jade-100:#f8feeb; --jade-200:#d3e0b9; --jade-300:#abbd8a; --jade-400:#7a985e;
  --jade-500:#4a6b3a; --jade-600:#426334; --jade-700:#3a5a2e; --jade-800:#325227; --jade-900:#2a4a21;

  /* 三级文字色：羊皮纸底专用，同色相调 S/L，不用灰／白透明度（§2.3） */
  --ink3:#756342;
  --mp:#4a6b9a;

  /* ---- primitive · 字阶（§4.1.1d）---- */
  --t-12:12px; --t-14:14px; --t-16:16px; --t-18:18px; --t-20:20px;
  --t-24:24px; --t-30:30px; --t-36:36px; --t-48:48px; --t-60:60px; --t-72:72px;
  --w-regular:400; --w-medium:500; --w-semibold:600; --w-bold:700;

  /* ---- primitive · 间距阶（§3.2.2，16px base）---- */
  --s-1:4px;  --s-2:8px;  --s-3:12px; --s-4:16px; --s-6:24px;
  --s-8:32px; --s-12:48px; --s-16:64px; --s-24:96px;

  /* ---- primitive · 圆角（§1.4.3，统一小圆角）---- */
  --r-sm:2px; --r-md:4px; --r-lg:8px;

  /* ---- primitive · 阴影五级（§6.2.1）---- */
  --sh-0:none;
  --sh-1:0 1px 3px hsla(0,0%,0%,.2);
  --sh-2:0 4px 6px hsla(0,0%,0%,.2);
  --sh-3:0 10px 15px hsla(0,0%,0%,.2);
  --sh-4:0 20px 25px hsla(0,0%,0%,.2);
  --sh-5:0 30px 45px hsla(0,0%,0%,.2);

  /* ---- primitive · 动效 ---- */
  --m-fast:120ms; --m-normal:200ms; --m-ease:ease-out;

  /* ---- semantic（组件只用这一层）---- */
  --surface:var(--paper-base);
  --surface-raised:var(--paper-raised);
  --surface-sunken:var(--paper-sunken);

  --text-primary:var(--neutral-900);   /* 11.80:1 */
  --text-secondary:var(--neutral-700); /*  6.06:1 */
  --text-tertiary:var(--ink3);         /*  4.77:1 */
  --text-on-action:var(--paper-raised);/*  5.29:1 on action */

  --border:var(--neutral-300);
  --border-strong:var(--neutral-400);

  --action:var(--primary-500);
  --action-hover:var(--primary-600);
  --danger:var(--danger-500);
  --success:var(--jade-500);
  --hp:var(--danger-500);
  --focus-ring:var(--primary-700);
  --scrim:rgba(18,14,10,.5);
}

/* 焦点：永不移除，用 3:1 的环替代（15-beyond-the-book） */
:where(button, a, input, select, textarea, [tabindex]):focus-visible {
  outline:2px solid var(--focus-ring);
  outline-offset:2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
}
`;
