// story_data.js — 全シーンデータ（セリフ・イベント・フラグ）
// 全セリフはここに集中させる

const STORY_DATA = {

  // ══════════════════════════════════════════════
  // 第1章 終末のグランシール
  // ══════════════════════════════════════════════

  ch1_opening: {
    id: 'ch1_opening',
    type: 'event',
    bg: 'underground',
    characters: [],
    events: [
      { type: 'narration', text: '遠未来。' },
      { type: 'narration', text: '神々の遺産と古えの封印の結合実験は、失敗した。' },
      { type: 'narration', text: '文明は終わった。' },
      { type: 'narration', text: '──西暦2026年。海は大陸の半分を飲み込み、残された地は異常進化した植物と暴走した機械獣に支配されている。' },
      { type: 'narration', text: 'しかし人類は、ひとつの賭けを残していた。' },
      { type: 'narration', text: '「SHINING FORCE 2026計画」──61名の若者を冷凍保存し、世界が再建できる日まで眠らせること。' },
      { type: 'narration', text: 'そして今、その最後の一人が目を覚ます。' },
    ],
    next: 'ch1_scene01',
  },

  ch1_scene01: {
    id: 'ch1_scene01',
    type: 'event',
    bg: 'underground',
    characters: ['Arc', 'Sarah', 'Lowe'],
    events: [
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: '…目が覚めた。ここは──' },
      { type: 'dialog', speaker: 'Sarah', pos: 'right',  text: 'アーク！よかった、生きてた。' },
      { type: 'dialog', speaker: 'Sarah', pos: 'right',  text: '私はサラ。あなたは最後に目覚めたシード。61人目よ。' },
      { type: 'dialog', speaker: 'Lowe',  pos: 'center', text: 'ぼくはロウ。医療担当だ。怪我はない？周囲を確認しよう。' },
      { type: 'narration', text: '海底に沈んだグランシール地下保管庫。外は機械獣に支配された廃墟の世界だった。' },
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: 'ここが……保管庫か。どれくらい眠ってたんだ。' },
      { type: 'dialog', speaker: 'Sarah', pos: 'right',  text: '計算できないわ。端末が壊れてる。でも外は……変わり果ててる。' },
      { type: 'dialog', speaker: 'Lowe',  pos: 'center', text: 'まずは出口を目指そう。でも——機械獣が来る！' },
    ],
    next: 'ch1_town',
  },

  // 街フェーズ：グランシール地下保管庫の探索
  ch1_town: {
    id: 'ch1_town',
    type: 'town',
    townId: 'ch1_gran_seal',
    next: 'ch1_battle01',
  },

  ch1_battle01: {
    id: 'ch1_battle01',
    type: 'battle',
    bg: 'underground',
    preDialog: [
      { type: 'dialog', speaker: 'Arc', pos: 'left', text: '機械獣だ！構えろ！' },
      { type: 'dialog', speaker: 'Sarah', pos: 'right', text: 'チュートリアル戦闘よ。まずは基本を確認して！' },
    ],
    postDialogWin: [
      { type: 'dialog', speaker: 'Lowe', pos: 'center', text: '助かった…。この先もこんな奴らがいるのか？' },
      { type: 'dialog', speaker: 'Arc',  pos: 'left',   text: 'ああ。でも俺たちは動ける。進もう。' },
    ],
    postDialogLose: null,
    onWinFlag: null,
    next: 'ch1_scene02',
  },

  ch1_scene02: {
    id: 'ch1_scene02',
    type: 'event',
    bg: 'underground',
    characters: ['Arc', 'Sarah', 'Lowe'],
    events: [
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: 'この端末……記録が残ってる。' },
      { type: 'narration', text: '起動音とともに、古い音声が流れ始めた。' },
      { type: 'dialog', speaker: '端末（音声）', pos: 'center', text: 'これはSHINING FORCE 2026計画記録。聞こえていれば、あなたたちは生き残った。' },
      { type: 'dialog', speaker: '端末（音声）', pos: 'center', text: '各地に61名のシードを分散配置した。ルーン大陸とパルメキア大陸に、英雄の名を持つ者たち。' },
      { type: 'dialog', speaker: '端末（音声）', pos: 'center', text: '────世界を、もう一度、人が住める場所に。' },
      { type: 'narration', text: '記録はそこで途切れた。' },
      { type: 'dialog', speaker: 'Sarah', pos: 'right',  text: '…60人。各地に散らばってる。' },
      { type: 'dialog', speaker: 'Lowe',  pos: 'center', text: 'つまり僕たちは……仲間を探しながら、世界を再建しなきゃいけないのか。' },
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: 'ああ。行こう。' },
    ],
    onEnterFlag: 'plan2026Revealed',
    next: 'ch1_scene03',
  },

  ch1_scene03: {
    id: 'ch1_scene03',
    type: 'event',
    bg: 'underground',
    characters: ['Tao', 'Jaha', 'Chester'],
    events: [
      { type: 'dialog', speaker: 'Tao',   pos: 'left',   text: 'あ！やっと来た。ずっと待ってたんだよ？' },
      { type: 'dialog', speaker: 'Tao',   pos: 'left',   text: 'あたしはタオ。炎が得意。よろしく！' },
      { type: 'dialog', speaker: 'Jaha',  pos: 'right',  text: 'ジャハだ。ドワーフはタフなもんだ。前に立てい。' },
      { type: 'dialog', speaker: 'Chester', pos: 'center', text: 'チェスターだ。お前がアークか。──ついていく。' },
      { type: 'dialog', speaker: 'Sarah', pos: 'right',  text: '（小声で）チェスターって、あの伝説の……' },
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: 'みんないた。──シャイニングフォース、始動だ。' },
    ],
    onEnterParty: ['Tao', 'Jaha', 'Chester'],
    next: 'ch1_battle02',
  },

  ch1_battle02: {
    id: 'ch1_battle02',
    type: 'battle',
    bg: 'underground',
    preDialog: [
      { type: 'dialog', speaker: 'Jaha', pos: 'right', text: '出口だ！……いや、門番がいる。' },
      { type: 'dialog', speaker: 'Arc',  pos: 'left',  text: '突破するぞ！' },
    ],
    postDialogWin: [
      { type: 'dialog', speaker: 'Tao',    pos: 'left',   text: 'やったー！出口が開いた！' },
      { type: 'dialog', speaker: 'Chester', pos: 'center', text: '……行くぞ。' },
    ],
    postDialogLose: null,
    onWinFlag: 'kaneBattle1Done',
    next: 'ch1_ending',
  },

  ch1_ending: {
    id: 'ch1_ending',
    type: 'event',
    bg: 'surface',
    characters: ['Arc', 'Sarah', 'Tao'],
    events: [
      { type: 'narration', text: '地上に出た一行の目の前に広がったのは、巨大な樹木と廃墟の海だった。' },
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: 'でかい……。こんなになってたのか、世界は。' },
      { type: 'dialog', speaker: 'Sarah', pos: 'right',  text: '怖い？' },
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: '……ちょっとな。でも、行かないといけない。' },
      { type: 'dialog', speaker: 'Tao',   pos: 'center', text: 'ルーン大陸！ガーディアナ方面に反応がある！仲間がいるよ！' },
      { type: 'narration', text: '──希望の光は、まだ消えていない。' },
      { type: 'dialog', speaker: 'Arc',   pos: 'left',   text: 'よし。──ここから始める。俺たちが、新しいシャイニングフォースだ。' },
      { type: 'narration', text: '第1章「終末のグランシール」　完' },
    ],
    next: null, // 章終了（将来的に第2章へ）
  },

  // ══════════════════════════════════════════════
  // 第2章以降は将来追加
  // ══════════════════════════════════════════════
};
