// battle_bridge.js — ストーリー↔戦闘接続ブリッジ

const BattleBridge = {
  _onEnd: null,
  _sceneData: null,

  // EventSceneから呼ばれて戦闘を起動
  startBattle(phaserScene, sceneData, onEnd) {
    this._onEnd    = onEnd;
    this._sceneData = sceneData;
    // EventSceneを一時停止してBattleSceneを起動
    phaserScene.scene.pause('Event');
    phaserScene.scene.launch('Battle');
  },

  // BattleSceneの_result()から呼ばれる（最小限フック）
  notifyBattleEnd(won) {
    const cb   = this._onEnd;
    const data = this._sceneData;
    this._onEnd    = null;
    this._sceneData = null;
    if (cb) cb(won ? 'win' : 'lose', data);
  },
};
