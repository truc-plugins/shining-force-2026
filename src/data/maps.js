// タイルタイプ
const TILE = {
  GRASS:  0,  // 草原（移動コスト1）
  FOREST: 1,  // 森（移動コスト2、防御+10%）
  HILL:   2,  // 丘（移動コスト3、防御+15%）
  WATER:  3,  // 水（通行不可 / 飛行ユニットのみ可）
  ROAD:   4,  // 道（移動コスト1）
  WALL:   5,  // 壁（通行不可）
  FORT:   6,  // 砦（回復ポイント、防御+20%）
  BRIDGE: 7,  // 橋（移動コスト1）
};

const TILE_PROPS = {
  [TILE.GRASS]:  { cost: 1, defBonus: 0,   passable: true,  name: '草原' },
  [TILE.FOREST]: { cost: 2, defBonus: 10,  passable: true,  name: '森' },
  [TILE.HILL]:   { cost: 3, defBonus: 15,  passable: true,  name: '丘' },
  [TILE.WATER]:  { cost: 99,defBonus: 0,   passable: false, name: '水' },
  [TILE.ROAD]:   { cost: 1, defBonus: 0,   passable: true,  name: '道' },
  [TILE.WALL]:   { cost: 99,defBonus: 0,   passable: false, name: '壁' },
  [TILE.FORT]:   { cost: 1, defBonus: 20,  passable: true,  name: '砦',  heal: 10 },
  [TILE.BRIDGE]: { cost: 1, defBonus: 0,   passable: true,  name: '橋' },
};

// 第1章 バトルマップ「アドラの村外れ」（15×12）
const MAP_CH1 = {
  id: 'ch1_battle',
  name: 'アドラの村外れ',
  chapter: 1,
  width: 15,
  height: 12,
  tiles: [
    // 0=草, 1=森, 2=丘, 3=水, 4=道, 5=壁, 6=砦, 7=橋
    [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
    [5,0,0,1,0,0,0,0,0,1,0,0,0,0,5],
    [5,0,1,1,0,4,4,4,0,1,1,0,0,0,5],
    [5,0,0,0,0,4,0,4,0,0,0,0,1,0,5],
    [5,0,0,0,0,4,6,4,0,0,0,0,0,0,5],
    [5,0,2,2,0,4,4,4,0,0,2,2,0,0,5],
    [5,0,0,2,0,0,0,0,0,0,2,0,0,0,5],
    [5,0,0,0,3,3,7,3,3,0,0,0,0,0,5],
    [5,0,1,0,0,0,0,0,0,0,1,0,0,0,5],
    [5,0,1,1,0,0,0,0,0,1,1,0,0,0,5],
    [5,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
    [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
  ],
  // 味方初期配置
  playerStart: [
    { charId: 0, x: 2, y: 9 },
    { charId: 1, x: 3, y: 9 },
    { charId: 2, x: 2, y: 8 },
    { charId: 3, x: 4, y: 9 },
    { charId: 4, x: 3, y: 8 },
    { charId: 5, x: 1, y: 9 },
  ],
  // 敵配置
  enemies: [
    { name: 'ゴブリン',  cls: 'WARRIOR', level: 1, x: 7,  y: 2, color: 0x228822 },
    { name: 'ゴブリン',  cls: 'WARRIOR', level: 1, x: 9,  y: 2, color: 0x228822 },
    { name: 'ゴブリン',  cls: 'ARCHER',  level: 1, x: 11, y: 3, color: 0x448844 },
    { name: 'ゴブリン',  cls: 'ARCHER',  level: 1, x: 12, y: 4, color: 0x448844 },
    { name: 'ゾンビ',    cls: 'WARRIOR', level: 2, x: 10, y: 5, color: 0x556644 },
    { name: 'ゾンビ',    cls: 'WARRIOR', level: 2, x: 12, y: 5, color: 0x556644 },
    { name: '黒騎士',    cls: 'KNIGHT',  level: 3, x: 11, y: 2, color: 0x222244, isBoss: false },
    { name: 'ダーク将軍',cls: 'KNIGHT',  level: 4, x: 13, y: 2, color: 0x110022, isBoss: true  },
  ],
  bgColor: 0x1a2a1a,
};

const MAPS = { ch1: MAP_CH1 };
