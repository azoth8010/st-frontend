// ============================================================
// 地图坐标配置
// 坐标由 世界地图.png / 迷宫剖面.png 实测标定（2026-11-06），**百分比，与像素无关**。
// 标定方法：连通域分析取陆块中心 + 行亮度/边缘检测取层带边界，再画叠加图目视复核。
//
// 底图走自建图床（Cloudflare imgbed），上传设「仅原名 + 转 webp」：
//   world.webp 1448×1086 ｜ maze.webp 1280×1920（尺寸不变）
// 仓库里的 assets/map/*.webp 是旧压缩版，留作备份，不再引用。
// ============================================================

/** 自建图床。上传用「仅原名 + 转 webp」，所以地址可推：
 *  /file/manfan/world.webp —— 固定，不随时间戳变。 */
export const 图床 = 'https://900037e6.cloudflare-imgbed-6au.pages.dev/';

// 目前只有图床一个源；回退源未定（2026-11-14），定了往后加。
export const CDN = [图床];

/** 绝对地址原样返回；相对路径按镜像拼。 */
export function 取图地址(路径, 镜像 = 0) {
  if (/^https?:\/\//.test(路径)) return 路径;
  return (CDN[镜像] || CDN[0]) + 路径;
}

export const 地图配置 = {
  世界: {
    路径: 'file/manfan/world.webp',
    备用: [
      'file/manfan/world.png',   // 仅原名上传后若没转成 webp
      'https://900037e6.cloudflare-imgbed-6au.pages.dev/file/manfan/1794630897656_world.png', // 旧时间戳图，过渡用
    ],
    宽: 1448,
    高: 1086,
    比: 1.333, // 4:3
    节点: [
      // x/y 是陆块几何中心；半径按陆块大小给，用来定点击热区
      { id: '北方大陆',   x: 54.7, y: 13.7, 半: 46, 注: '寒带苔原，边缘破碎' },
      { id: '北中央大陆', x: 32.0, y: 27.3, 半: 40, 注: '圆块状' },
      { id: '西方大陆',   x: 11.0, y: 47.2, 半: 38, 注: '竖长条，贴左边缘' },
      { id: '南中央大陆', x: 35.6, y: 60.5, 半: 42, 注: '圆形' },
      { id: '南方大陆',   x: 56.1, y: 84.3, 半: 46, 注: '全图最大，横贯底部' },
      { id: '东方大陆',   x: 89.9, y: 42.3, 半: 42, 注: '竖椭圆，贴右边缘' },
      { id: '东方群岛',   x: 88.5, y: 73.0, 半: 30, 注: '四座小岛，散点' },
      { id: '岛',         x: 63.8, y: 46.5, 半: 34, 注: '主舞台，图上偏小，需加光圈强调' },
    ],
    // 海洋不设点：点在画面背景上会误导「可以走过去」
  },

  迷宫: {
    路径: 'file/manfan/maze.webp',
    备用: [
      'file/manfan/maze.png',
      'https://900037e6.cloudflare-imgbed-6au.pages.dev/file/manfan/1794630909064_maze.png',
    ],
    宽: 1280,
    高: 1920,
    比: 0.667, // 2:3
    // 自上而下的九段。y0/y1 是面板边界，中 是中心，都用百分比。
    层带: [
      { 深度: 1,          y0: 1.30,  y1: 11.56, 中: 6.43,  名: '新手广场' },
      { 深度: 2,          y0: 11.56, y1: 22.66, 中: 17.11, 名: '尖塔之森' },
      { 深度: 3,          y0: 22.66, y1: 33.75, 中: 28.20, 名: '黄金城入口' },
      { 深度: 4,          y0: 33.75, y1: 44.84, 中: 39.30, 名: '湖' },
      { 深度: 5,          y0: 44.84, y1: 55.94, 中: 50.39, 名: '城下町' },
      { 深度: 6,          y0: 55.94, y1: 67.03, 中: 61.48, 名: '地下水道' },
      { 深度: '黄金之乡', y0: 67.03, y1: 78.13, 中: 72.58, 名: '黄金之乡' },
      { 深度: 7,          y0: 78.13, y1: 89.22, 中: 83.67, 名: '古代矮人都市' },
      { 深度: 8,          y0: 89.22, y1: 100.0, 中: 94.61, 名: '希斯路之家' },
    ],
  },
};

/** 按 stat_data 世界.深度 找到对应层带；「无」返回 null（玩家在地面/海上）。 */
export function 按深度找层(深度) {
  return 地图配置.迷宫.层带.find(function (b) { return b.深度 === 深度; }) || null;
}

/** 按 stat_data 世界.位置 找世界图上的节点。
 *  小区域在迷宫里时（「迷宫第 N 层」），世界图不点选，只高亮「岛」。 */
export function 按位置找节点(位置) {
  if (!位置) return null;
  const 命 = 地图配置.世界.节点.find(function (n) { return n.id === 位置.大区域; });
  return 命 || null;
}

/** 角色 slug：中文名 / 简称 / 别名 → 资源 slug。没图的人也在表里，前端查不到图会退回首字。 */
export const 角色slug = {
  '莱欧斯': 'laios', '莱欧斯·托登': 'laios', '莱奥斯': 'laios',
  '玛露希尔': 'marcille', '玛露希尔·多纳托': 'marcille', '玛露西尔': 'marcille', '马鹿': 'marcille',
  '齐尔查克': 'chilchuck', '齐尔查克·蒂姆兹': 'chilchuck', '奇尔查克': 'chilchuck',
  '森西': 'senshi', '先西': 'senshi',
  '法琳': 'falin', '法琳·托登': 'falin',
  '伊津津美': 'izutsumi', '马醉木': 'izutsumi', '莞苞': 'izutsumi',
  '娜玛莉': 'namari',
  '修洛': 'shuro', '半本俊朗': 'shuro', '俊朗': 'shuro',
  '剑助': 'kensuke', '卡布尔': 'kabru', '喀布尔': 'kabru',
  '铃夏': 'rinsha', '铃夏·法娜': 'rinsha', '林夏': 'rinsha',
  '米克贝尔': 'mickbell', '米克贝尔·托马兹': 'mickbell',
  '小黑': 'kuro', '黑子': 'kuro', '戴阿': 'daya', '戴娅': 'daya',
  '霍尔姆': 'holm', '霍尔姆·克兰诺姆': 'holm',
  '坦斯': 'tansu', '坦斯·弗洛卡': 'tansu',
  '雅恩': 'yarn', '雅恩·弗洛卡': 'yarn',
  '卡卡': 'kaka', '琪琪': 'kiki', '多尼': 'doni', '菲奥妮露': 'fionil',
  '米斯伦': 'mithrun', '西丝席思': 'cithis', '芙蕾琪': 'fleki', '黎希恩': 'lycion',
  '欧塔': 'otta', '帕塔朵': 'pattadol', '芙拉梅拉': 'flamela', '米尔西莉露': 'milsiril',
  '希斯路': 'thistle', '狂乱的魔法师': 'thistle',
  '迪尔加路': 'delgal', '迪尔加路·梅利尼': 'delgal',
  '亚阿多': 'yaad', '亚阿多·梅利尼': 'yaad',
  '翼狮': 'winged-lion',
  '祖恩': 'zon', '宗恩': 'zon',
  '莉多': 'leed', '黎德': 'leed',
  '犬蓼': 'inutade', '希若希': 'inutade',
  '飞燕': 'hien', '名香': 'hien',
  '舞鹤': 'maizuru', '红千鸟': 'benichidori',
  '吉林': 'gillin', '布里甘': 'brigan', '布里坎': 'brigan',
  '英帕': 'invar', '印巴': 'invar', '图坦': 'totan', '兜坦': 'totan',
  '奴鲁': 'null', '奴鲁·米尔切恩': 'null', '努鲁': 'null',
  '丹丹': 'dandan',
  '瓦恩兹': 'wanz', '阿西比雅': 'asibia',
  '梅尔杰克': 'mayjack', '芙兰托姆': 'fullertom', '帕克帕蒂': 'packpatty',
  '多纳托': 'donato',
  '希梅雅': 'elf-queen', '精灵女王': 'elf-queen',
  '岛主': 'island-lord', '里岛主': 'inner-island-lord',
};

/** 有头像文件的 slug（❌ 那几个不在此列，前端退回占位）。 */
const 有头像 = new Set(['laios','marcille','chilchuck','senshi','falin','izutsumi','namari','shuro','kensuke',
 'kabru','rinsha','mickbell','kuro','daya','holm','tansu','yarn','kaka','kiki','doni','fionil',
 'mithrun','cithis','fleki','lycion','otta','pattadol','flamela','milsiril','thistle','delgal',
 'yaad','winged-lion','zon','leed','inutade','hien','maizuru','benichidori','gillin','brigan',
 'invar','totan','dandan','donato','elf-queen']);

/** 头像地址；查不到或没有图返回 null。 */
export function 头像地址(名) {
  const slug = 角色slug[String(名 || '').trim()];
  if (!slug || !有头像.has(slug)) return null;
  return 图床 + 'file/manfan/' + slug + '.webp';
}
