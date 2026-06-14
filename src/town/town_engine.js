// town_engine.js — 街探索の状態管理・シーン遷移
// story_engine.js とは分離（呼び出し関係はあってよい）

const TownEngine = (() => {
  let _state = {
    currentTownId: null,
    gold: 500,
    inventory: [],    // { id, name, qty, type, ... }
    visitedEvents: new Set(),
  };

  let _onDepart = null;  // 出発時コールバック (nextSceneId) => void

  return {
    get gold() { return _state.gold; },
    get inventory() { return _state.inventory; },

    // 街を開始する
    // phaserScene: 呼び出し元Phaser.Scene
    // townId: TOWN_DATA のキー
    // onDepart: 出発時コールバック (nextSceneId) => void
    launchTown(phaserScene, townId, nextSceneId, onDepart) {
      _state.currentTownId = townId;
      _onDepart = onDepart;
      // ExploreScene を起動
      phaserScene.scene.launch('Explore', { townId, nextSceneId });
      phaserScene.scene.pause();
    },

    // 出発処理
    depart(nextSceneId) {
      if (_onDepart) {
        const cb = _onDepart;
        _onDepart = null;
        cb(nextSceneId);
      }
    },

    // フラグ判定（StoryEngineのフラグを参照）
    checkFlag(flagKey) {
      if (typeof GameState !== 'undefined') {
        return !!GameState.flags[flagKey];
      }
      return false;
    },

    // NPC用の適切なセリフを選ぶ（flagsを考慮）
    getDialog(npc) {
      // 後から条件一致するものを優先
      let result = null;
      for (const d of npc.dialogs) {
        if (d.condition === null) {
          result = d;
        } else if (this.checkFlag(d.condition)) {
          result = d;
        }
      }
      return result ? result.text : '……。';
    },

    // イベント発火済みか
    hasVisited(eventId) {
      return _state.visitedEvents.has(eventId);
    },
    markVisited(eventId) {
      _state.visitedEvents.add(eventId);
    },

    // ショップ：購入
    buyItem(shopId, itemId) {
      const shop = SHOP_DATA[shopId];
      const item = shop.stock.find(s => s.id === itemId);
      if (!item) return { ok: false, msg: 'アイテムが見つからない' };
      if (_state.gold < item.price) return { ok: false, msg: '所持金が足りない' };
      _state.gold -= item.price;
      const existing = _state.inventory.find(i => i.id === itemId);
      if (existing) {
        existing.qty++;
      } else {
        _state.inventory.push({ ...item, qty: 1 });
      }
      return { ok: true };
    },

    // 教会：全回復（パーティのHPをMAXに）
    fullHeal() {
      if (typeof GameState !== 'undefined' && GameState.party) {
        // party名リストのみ持つ場合、BattleSceneのユニット状態は別管理
        // ここではフラグだけ立てて、戦闘開始時に全回復状態を反映させる
        _state.healed = true;
      }
      return { ok: true, msg: 'HPとMPが全回復した！' };
    },

    // セーブ（localStorage）
    save() {
      try {
        const saveData = {
          gold: _state.gold,
          inventory: _state.inventory,
          chapter: typeof GameState !== 'undefined' ? GameState.chapter : 1,
          scene: typeof GameState !== 'undefined' ? GameState.scene : 'ch1_opening',
          flags: typeof GameState !== 'undefined' ? { ...GameState.flags } : {},
          party: typeof GameState !== 'undefined' ? [...GameState.party] : [],
        };
        localStorage.setItem('sf2026_save', JSON.stringify(saveData));
        return { ok: true, msg: 'セーブした。' };
      } catch(e) {
        return { ok: false, msg: 'セーブに失敗した。' };
      }
    },

    // ロード
    load() {
      try {
        const raw = localStorage.getItem('sf2026_save');
        if (!raw) return false;
        const data = JSON.parse(raw);
        _state.gold = data.gold || 500;
        _state.inventory = data.inventory || [];
        if (typeof GameState !== 'undefined') {
          GameState.chapter = data.chapter;
          GameState.scene   = data.scene;
          Object.assign(GameState.flags, data.flags);
          GameState.party   = data.party;
        }
        return true;
      } catch(e) {
        return false;
      }
    },
  };
})();
