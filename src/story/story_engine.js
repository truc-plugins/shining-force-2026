// story_engine.js — ストーリー進行管理エンジン

const GameState = {
  chapter: 1,
  scene: 'ch1_opening',
  flags: {
    plan2026Revealed: false,
    kaneBattle1Done:  false,
    bowieAlliance:    false,
    creedTruthRevealed: false,
    lightCoreObtained:  false,
    sealRingObtained:   false,
  },
  party: ['Arc', 'Sarah', 'Lowe'],
  defeatedBosses: [],
};

const StoryEngine = {
  _eventScene: null,

  // EventSceneから呼ばれて初期化
  init(eventScene) {
    this._eventScene = eventScene;
  },

  // 現在のシーンデータを取得
  currentSceneData() {
    return STORY_DATA[GameState.scene] || null;
  },

  // フラグをセット
  setFlag(key) {
    if (key && key in GameState.flags) {
      GameState.flags[key] = true;
    }
  },

  // パーティに追加
  addToParty(names) {
    if (!names) return;
    names.forEach(n => {
      if (!GameState.party.includes(n)) GameState.party.push(n);
    });
  },

  // 次のシーンへ進む
  advanceScene(nextId) {
    if (!nextId) {
      // 章終了
      this._eventScene && this._eventScene.onChapterEnd();
      return;
    }
    GameState.scene = nextId;
    const sceneData = STORY_DATA[nextId];

    // 街フェーズ（townタイプ）
    if (sceneData && sceneData.type === 'town') {
      TownEngine.launchTown(
        this._eventScene,
        sceneData.townId,
        sceneData.next,
        (afterTownScene) => {
          // 街から帰還 → 次のイベント/バトルへ
          this.advanceScene(afterTownScene);
        }
      );
      return;
    }

    this._eventScene && this._eventScene.loadScene(nextId);
  },

  // 戦闘結果を受け取る
  onBattleResult(result, sceneData) {
    if (result === 'win') {
      if (sceneData.onWinFlag) this.setFlag(sceneData.onWinFlag);
      this._eventScene && this._eventScene.startPostDialog(sceneData.postDialogWin, sceneData.next);
    } else {
      // 敗北 → ゲームオーバー（将来実装）
      this._eventScene && this._eventScene.showGameOver();
    }
  },
};
