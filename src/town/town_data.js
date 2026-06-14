// town_data.js — 全街マップ・NPC・施設データ
// NPCセリフはここに集中させる

// ─────────────────────────────
// タイルID定義
// 0 = floor_stone  (通行可)
// 1 = wall_stone   (不可)
// 2 = floor_dirt   (通行可)
// 3 = pod/decor    (不可・装飾)
// ─────────────────────────────

const TOWN_DATA = {

  ch1_gran_seal: {
    id: 'ch1_gran_seal',
    name: 'グランシール地下保管庫',
    bgColor: 0x0a0a1a,

    // 15列 × 18行
    // 次のsceneへ (story_data nextを上書き可)
    nextScene: null,

    // タイル配置 (15×18)
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,0,0,0,0,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,0,0,0,0,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    // プレイヤー初期位置
    playerStart: { col: 7, row: 15 },

    // NPC定義
    npcs: [
      {
        id: 'npc_granSeal_01',
        name: '生存者の老人',
        col: 7, row: 2,
        color: 0x886644,
        dialogs: [
          {
            condition: null,
            text: '生き残ったか……。ここに来るのは久しぶりだ。外は機械獣だらけだぞ。'
          },
          {
            condition: 'plan2026Revealed',
            text: 'あの記録を見たのか。……シード計画。あんたらが希望だったんだ。'
          },
          {
            condition: 'jogurtHint',
            text: '昔、ジョグルトって名のやつがいたらしいぞ。何者かは誰も知らない……でも、大事な場面に必ず現れたって。'
          },
        ],
      },
      {
        id: 'npc_granSeal_02',
        name: '怪我をした女性',
        col: 3, row: 13,
        color: 0xcc8888,
        dialogs: [
          {
            condition: null,
            text: '足が……動かなくて。仲間はいなくなってしまった。'
          },
          {
            condition: 'loweJoined',
            text: 'あの人が手当てしてくれた。……ありがとう、ロウさん。'
          },
        ],
      },
      {
        id: 'npc_granSeal_03',
        name: '物資管理人',
        col: 11, row: 4,
        color: 0x448844,
        type: 'shop',
        shopId: 'shop_granSeal',
        dialogs: [
          {
            condition: null,
            text: 'まだ使えるものがある。持っていけ。命より大事なものはない。\n今日のおすすめ？……ヒールの葉だ。何があるかわからないからな。'
          },
        ],
      },
      {
        id: 'npc_granSeal_04',
        name: '祈りを捧げる老女',
        col: 2, row: 4,
        color: 0x8888cc,
        type: 'church',
        churchId: 'church_granSeal',
        dialogs: [
          {
            condition: null,
            text: 'ここにいる限り、安全だよ。休んでいきなさい。'
          },
          {
            condition: 'kaneBattle1Done',
            text: '……戻ってきたね。よかった。また休んでいきなさい。'
          },
        ],
      },
      {
        id: 'npc_granSeal_05',
        name: '端末前の技術者',
        col: 7, row: 9,
        color: 0x44aacc,
        type: 'event',
        eventTrigger: 'terminal_2026',
        dialogs: [
          {
            condition: null,
            text: 'この端末、まだ動く。でも何が入ってるか……怖くて見られなかった。'
          },
          {
            condition: 'plan2026Revealed',
            text: '……聞いた。あんたたちが希望なのか。なら、俺にできることをする。'
          },
        ],
      },
    ],

    // 追加の環境NPCセリフ（ギャグ・伏線）
    bonusNpcs: [
      {
        id: 'npc_bonus_01',
        name: '廃墟調査員',
        col: 11, row: 13,
        color: 0xaa8844,
        dialogs: [
          {
            condition: null,
            text: 'ガーディアナに入ったやつは戻ってこない。"カイン"が守ってるからだって。……機械のカインが。'
          },
        ],
      },
    ],
  },

};

// ─────────────────────────────
// ショップデータ
// ─────────────────────────────
const SHOP_DATA = {
  shop_granSeal: {
    name: '廃墟の物資庫',
    npcDialog: 'まだ使えるものがあった。持っていけ。',
    stock: [
      { id: 'heal_leaf',     name: 'ヒールの葉',   price: 30,  type: 'item',   desc: 'HPを30回復する' },
      { id: 'antidote',      name: '解毒草',       price: 20,  type: 'item',   desc: '毒を治療する' },
      { id: 'ether',         name: 'エーテル',     price: 80,  type: 'item',   desc: 'MPを20回復する' },
      { id: 'iron_sword',    name: '鉄の剣',       price: 250, type: 'weapon', desc: '攻撃力+8' },
      { id: 'leather_armor', name: '皮の鎧',       price: 180, type: 'armor',  desc: '防御力+5' },
    ],
  },
};

// ─────────────────────────────
// 教会データ
// ─────────────────────────────
const CHURCH_DATA = {
  church_granSeal: {
    name: '安全地帯',
    npcDialog: 'ここは安全だ。休んでいきなさい。',
    menu: [
      { label: '休む（HP/MP全回復）', cost: 0,  action: 'fullHeal' },
      { label: '仲間を蘇生する',      cost: 30, action: 'revive'   },
      { label: 'ゲームをセーブする',  cost: 0,  action: 'save'     },
      { label: 'やめる',             cost: 0,  action: 'exit'     },
    ],
  },
};
