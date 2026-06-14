// ExploreScene.js — 街探索シーン（タウンマップ・移動・NPC会話）
class ExploreScene extends Phaser.Scene {
  constructor() { super('Explore'); }

  // ────────────────────────────
  // init / create
  // ────────────────────────────
  init(data) {
    this._townId    = data.townId     || 'ch1_gran_seal';
    this._nextScene = data.nextSceneId || data.nextScene || null;
  }

  create() {
    this._W = this.scale.width;   // 480
    this._H = this.scale.height;  // 720

    this._townDef = TOWN_DATA[this._townId];
    if (!this._townDef) { this.scene.stop(); return; }

    this._TS   = 32;  // タイルサイズ（表示px）
    this._cols = this._townDef.map[0].length;  // 15
    this._rows = this._townDef.map.length;      // 18

    this._mapOffX = 0;  // マップが横に収まる場合は0
    this._mapOffY = 0;

    this._mode = 'walk';  // 'walk' | 'dialog' | 'shop' | 'church' | 'depart'

    // サブUI
    this._shopUI   = new ShopUI(this);
    this._churchUI = new ChurchUI(this);

    // フェードイン
    this.cameras.main.setBackgroundColor(this._townDef.bgColor || 0x0a0a1a);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // プレイヤー初期位置
    const ps = this._townDef.playerStart;
    this._player = { col: ps.col, row: ps.row, dir: 'down', moving: false };

    // 描画
    this._mapLayer   = this.add.graphics().setDepth(0);
    this._npcLayer   = this.add.graphics().setDepth(1);
    this._playerGfx  = this.add.graphics().setDepth(2);
    this._uiLayer    = this.add.graphics().setDepth(10);

    this._drawMap();
    this._initNpcSprites();
    this._drawPlayer();
    this._buildUI();

    // ダイアログ用テキストオブジェクト（後から生成）
    this._dialogObjs = [];

    // 入力
    this._keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.input.keyboard.on('keydown', (e) => this._onKey(e));
    this.input.on('pointerdown', (ptr) => this._onPointer(ptr));

    // タッチスワイプ用
    this._touchStart = null;
    this.input.on('pointerdown', (p) => { this._touchStart = { x: p.x, y: p.y }; });
    this.input.on('pointerup',   (p) => this._onSwipe(p));

    // 周期的な移動チェック（キーホールド）
    this._moveTimer = 0;
  }

  // ────────────────────────────
  // update
  // ────────────────────────────
  update(time, delta) {
    if (this._mode !== 'walk') return;
    if (this._player.moving) return;

    this._moveTimer += delta;
    if (this._moveTimer < 160) return;  // 移動間隔
    this._moveTimer = 0;

    let dc = 0, dr = 0;
    if (this._keys.up.isDown    || this._keys.w.isDown) { dr = -1; this._player.dir = 'up'; }
    else if (this._keys.down.isDown  || this._keys.s.isDown) { dr =  1; this._player.dir = 'down'; }
    else if (this._keys.left.isDown  || this._keys.a.isDown) { dc = -1; this._player.dir = 'left'; }
    else if (this._keys.right.isDown || this._keys.d.isDown) { dc =  1; this._player.dir = 'right'; }
    else return;

    this._tryMove(dc, dr);
  }

  // ────────────────────────────
  // マップ描画
  // ────────────────────────────
  _drawMap() {
    const g = this._mapLayer;
    g.clear();
    const map = this._townDef.map;
    const TS = this._TS;

    for (let row = 0; row < this._rows; row++) {
      for (let col = 0; col < this._cols; col++) {
        const tile = map[row][col];
        const px = this._mapOffX + col * TS;
        const py = this._mapOffY + row * TS;
        this._drawTile(g, tile, px, py, TS);
      }
    }

    // グリッドラインを薄く
    g.lineStyle(1, 0x112244, 0.25);
    for (let col = 0; col <= this._cols; col++) {
      g.lineBetween(this._mapOffX + col*TS, this._mapOffY, this._mapOffX + col*TS, this._mapOffY + this._rows*TS);
    }
    for (let row = 0; row <= this._rows; row++) {
      g.lineBetween(this._mapOffX, this._mapOffY + row*TS, this._mapOffX + this._cols*TS, this._mapOffY + row*TS);
    }
  }

  _drawTile(g, tile, px, py, TS) {
    switch (tile) {
      case 0: // floor_stone
        g.fillStyle(0x1a2035, 1);
        g.fillRect(px, py, TS, TS);
        // タイルパターン
        g.fillStyle(0x1e2840, 0.6);
        g.fillRect(px+2, py+2, TS-4, TS-4);
        break;
      case 1: // wall_stone
        g.fillStyle(0x2a2a3a, 1);
        g.fillRect(px, py, TS, TS);
        // 壁の質感
        g.fillStyle(0x3a3a4a, 0.5);
        g.fillRect(px+2, py, TS-2, 4);
        g.fillRect(px, py+4, 3, TS-4);
        g.fillStyle(0x151520, 0.4);
        g.fillRect(px+TS-3, py+4, 3, TS-4);
        g.fillRect(px+2, py+TS-4, TS-4, 4);
        // カプセル床跡（地下保管庫っぽく）
        g.fillStyle(0x334055, 0.2);
        g.fillRect(px+6, py+6, TS-12, TS-12);
        break;
      case 2: // floor_dirt
        g.fillStyle(0x2a1a0a, 1);
        g.fillRect(px, py, TS, TS);
        break;
      default:
        g.fillStyle(0x111120, 1);
        g.fillRect(px, py, TS, TS);
        break;
    }
  }

  // ────────────────────────────
  // NPC スプライト
  // ────────────────────────────
  _initNpcSprites() {
    this._npcObjs = {};
    const allNpcs = [
      ...(this._townDef.npcs        || []),
      ...(this._townDef.bonusNpcs   || []),
    ];

    allNpcs.forEach(npc => {
      const g = this.add.graphics().setDepth(3);
      this._drawNpcSprite(g, npc.col, npc.row, npc.color || 0xaa8866);
      this._npcObjs[npc.id] = g;

      // 名前ラベル
      const px = this._mapOffX + npc.col * this._TS + this._TS/2;
      const py = this._mapOffY + npc.row * this._TS - 8;
      const lbl = this.add.text(px, py, npc.name, {
        fontSize: '8px', color: '#aaccee',
        fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      }).setOrigin(0.5, 1).setDepth(4);
      this._npcObjs[npc.id + '_lbl'] = lbl;
    });
  }

  _drawNpcSprite(g, col, row, color) {
    const TS = this._TS;
    const px = this._mapOffX + col * TS;
    const py = this._mapOffY + row * TS;
    const cx = px + TS/2;
    const cy = py + TS/2;
    const S  = 2;

    g.clear();
    // 頭
    g.fillStyle(color, 1);
    g.fillRect(cx - 4*S, cy - 8*S, 8*S, 6*S);
    // 目
    g.fillStyle(0x000000, 0.8);
    g.fillRect(cx - 2*S, cy - 6*S, S, S);
    g.fillRect(cx + S,   cy - 6*S, S, S);
    // 体
    g.fillStyle(color, 0.85);
    g.fillRect(cx - 5*S, cy - 2*S, 10*S, 7*S);
    // 足
    g.fillStyle(color, 0.7);
    g.fillRect(cx - 4*S, cy + 5*S, 3*S, 3*S);
    g.fillRect(cx + S,   cy + 5*S, 3*S, 3*S);
    // 光る輪郭（生きてる感）
    g.lineStyle(1, 0xffffff, 0.15);
    g.strokeRect(cx - 5*S, cy - 8*S, 10*S, 16*S);
  }

  // ────────────────────────────
  // プレイヤー描画
  // ────────────────────────────
  _drawPlayer() {
    const g  = this._playerGfx;
    g.clear();
    const TS = this._TS;
    const px = this._mapOffX + this._player.col * TS;
    const py = this._mapOffY + this._player.row * TS;
    const cx = px + TS/2;
    const cy = py + TS/2;
    const S  = 2;

    // 影
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + 8*S, 10*S, 4*S);

    // 体（アーク：青系）
    g.fillStyle(0x2244aa, 1);
    g.fillRect(cx - 5*S, cy - 2*S, 10*S, 7*S);

    // 頭
    g.fillStyle(0xddbb99, 1);
    g.fillRect(cx - 4*S, cy - 8*S, 8*S, 6*S);

    // 目（方向別）
    g.fillStyle(0x000000, 1);
    if (this._player.dir === 'down') {
      g.fillRect(cx - 2*S, cy - 4*S, S, S);
      g.fillRect(cx + S,   cy - 4*S, S, S);
    } else if (this._player.dir === 'up') {
      // 後ろ向き
    } else if (this._player.dir === 'left') {
      g.fillRect(cx - 3*S, cy - 5*S, S, S);
    } else {
      g.fillRect(cx + 2*S, cy - 5*S, S, S);
    }

    // 剣
    g.fillStyle(0xccddff, 0.9);
    g.fillRect(cx + 5*S, cy - 3*S, S, 6*S);

    // 足
    g.fillStyle(0x223388, 1);
    g.fillRect(cx - 4*S, cy + 5*S, 3*S, 3*S);
    g.fillRect(cx + S,   cy + 5*S, 3*S, 3*S);

    // 選択枠（タイル縁を光らせる）
    g.lineStyle(1, 0x88bbff, 0.5);
    g.strokeRect(px+1, py+1, TS-2, TS-2);
  }

  // ────────────────────────────
  // UI（下部バー）
  // ────────────────────────────
  _buildUI() {
    if (this._uiObjs) {
      this._uiObjs.forEach(o => { if (o && o.active) o.destroy(); });
    }
    this._uiObjs = [];
    const W = this._W, H = this._H;
    const TS = this._TS;
    const mapH = this._rows * TS;  // 18×32=576

    // 下部UIバー
    const barY = mapH;
    const barH = H - mapH;  // 720-576=144px

    const uiBar = this.add.graphics().setDepth(10);
    uiBar.fillStyle(0x000020, 1);
    uiBar.fillRect(0, barY, W, barH);
    uiBar.lineStyle(2, 0x004060, 1);
    uiBar.lineBetween(0, barY, W, barY);
    this._uiObjs.push(uiBar);

    // 街名
    const townName = this.add.text(W/2, barY + 10, this._townDef.name, {
      fontSize: '12px', color: '#88aacc',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5, 0).setDepth(11);
    this._uiObjs.push(townName);

    // 所持金
    const goldTxt = this.add.text(16, barY + 30, `G: ${TownEngine.gold}`, {
      fontSize: '13px', color: '#ffe040',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setDepth(11);
    this._uiObjs.push(goldTxt);
    this._goldTxt = goldTxt;

    // 操作ヒント
    const hint = this.add.text(W/2, barY + 30, '矢印キー:移動  Space/Z:話す', {
      fontSize: '9px', color: '#556677',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5, 0).setDepth(11);
    this._uiObjs.push(hint);

    // 「出発する」ボタン
    const btnW = 130, btnH = 36;
    const btnX = W/2 - btnW/2, btnY = barY + 60;

    const btnBg = this.add.graphics().setDepth(11);
    btnBg.fillStyle(0x0a2255, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
    btnBg.lineStyle(2, 0x4488cc, 1);
    btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
    this._uiObjs.push(btnBg);

    const btnTxt = this.add.text(W/2, btnY + btnH/2, '▶ 出発する', {
      fontSize: '14px', color: '#ffffff',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(12);
    this._uiObjs.push(btnTxt);

    const btnHit = this.add.rectangle(W/2, btnY + btnH/2, btnW, btnH)
      .setInteractive({ useHandCursor: true }).setDepth(13).setAlpha(0.01);
    this._uiObjs.push(btnHit);
    btnHit.on('pointerdown', () => this._showDepartConfirm());

    // 点滅アニメ
    this.tweens.add({
      targets: btnTxt,
      alpha: { from: 0.7, to: 1 },
      duration: 800, yoyo: true, repeat: -1,
    });

    // インベントリ（ショートカット）
    const invBtn = this.add.text(W - 16, barY + 30, 'アイテム', {
      fontSize: '10px', color: '#aaaacc',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(1, 0).setDepth(11).setInteractive();
    this._uiObjs.push(invBtn);
    invBtn.on('pointerdown', () => this._showInventory());
  }

  _refreshGold() {
    if (this._goldTxt && this._goldTxt.active) {
      this._goldTxt.setText(`G: ${TownEngine.gold}`);
    }
  }

  // ────────────────────────────
  // 移動処理
  // ────────────────────────────
  _tryMove(dc, dr) {
    const nc = this._player.col + dc;
    const nr = this._player.row + dr;
    if (!this._isWalkable(nc, nr)) return;

    this._player.col = nc;
    this._player.row = nr;
    this._player.moving = true;

    // アニメーション（短いtween）
    this.time.delayedCall(100, () => {
      this._player.moving = false;
      this._drawPlayer();
    });
    this._drawPlayer();
  }

  _isWalkable(col, row) {
    if (col < 0 || col >= this._cols) return false;
    if (row < 0 || row >= this._rows) return false;
    const tile = this._townDef.map[row][col];
    if (tile === 1) return false;  // 壁
    // NPC位置確認
    const allNpcs = [
      ...(this._townDef.npcs      || []),
      ...(this._townDef.bonusNpcs || []),
    ];
    for (const npc of allNpcs) {
      if (npc.col === col && npc.row === row) return false;
    }
    return true;
  }

  // ────────────────────────────
  // インタラクション
  // ────────────────────────────
  _interact() {
    if (this._mode !== 'walk') return;
    const p = this._player;
    const dirs = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
    const [dc, dr] = dirs[p.dir] || [0, 1];
    const tc = p.col + dc;
    const tr = p.row + dr;

    // NPC確認
    const npc = this._getNpcAt(tc, tr);
    if (npc) {
      this._talkToNpc(npc);
      return;
    }
    // 周囲全方向も確認（隣接NPCがいれば話す）
    for (const [d, v] of Object.entries(dirs)) {
      const nc = p.col + v[0];
      const nr = p.row + v[1];
      const n2 = this._getNpcAt(nc, nr);
      if (n2) { this._talkToNpc(n2); return; }
    }
  }

  _getNpcAt(col, row) {
    const allNpcs = [
      ...(this._townDef.npcs      || []),
      ...(this._townDef.bonusNpcs || []),
    ];
    return allNpcs.find(n => n.col === col && n.row === row) || null;
  }

  // ────────────────────────────
  // NPC会話
  // ────────────────────────────
  _talkToNpc(npc) {
    this._mode = 'dialog';
    const text = TownEngine.getDialog(npc);

    // ショップ・教会は会話後に開く
    if (npc.type === 'shop') {
      this._showNpcDialog(npc.name, text, () => {
        this._mode = 'shop';
        this._shopUI.open(npc.shopId, () => {
          this._mode = 'walk';
          this._refreshGold();
          this._buildUI();
        });
      });
      return;
    }
    if (npc.type === 'church') {
      this._showNpcDialog(npc.name, text, () => {
        this._mode = 'church';
        this._churchUI.open(npc.churchId, () => {
          this._mode = 'walk';
        });
      });
      return;
    }
    if (npc.type === 'event' && npc.eventTrigger === 'terminal_2026') {
      const alreadyTriggered = TownEngine.hasVisited('terminal_2026');
      this._showNpcDialog(npc.name, text, () => {
        if (!alreadyTriggered) {
          TownEngine.markVisited('terminal_2026');
          this._triggerTerminalEvent();
        } else {
          this._mode = 'walk';
        }
      });
      return;
    }

    this._showNpcDialog(npc.name, text, () => { this._mode = 'walk'; });
  }

  _showNpcDialog(name, text, onClose) {
    this._clearDialog();
    const W = this._W, H = this._H;
    const TS = this._TS;
    const mapH = this._rows * TS;
    const winY = mapH - 110;
    const winH = 100;

    // ウィンドウ背景
    const win = this.add.graphics().setDepth(20);
    win.fillStyle(0x000020, 0.95);
    win.fillRoundedRect(8, winY, W - 16, winH, 6);
    win.lineStyle(2, 0x004060, 1);
    win.strokeRoundedRect(8, winY, W - 16, winH, 6);
    this._dialogObjs.push(win);

    // 話者名
    if (name) {
      const nameBg = this.add.graphics().setDepth(21);
      nameBg.fillStyle(0x002040, 1);
      nameBg.fillRoundedRect(12, winY - 18, name.length * 10 + 16, 20, 4);
      this._dialogObjs.push(nameBg);
      const nameTxt = this.add.text(20, winY - 16, name, {
        fontSize: '11px', color: '#88ddff',
        fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      }).setDepth(22);
      this._dialogObjs.push(nameTxt);
    }

    // テキスト（タイプライター）
    const txt = this.add.text(18, winY + 10, '', {
      fontSize: '12px', color: '#e0e0e0',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      wordWrap: { width: W - 40, useAdvancedWrap: true },
      lineSpacing: 4,
    }).setDepth(22);
    this._dialogObjs.push(txt);

    // ▼カーソル
    const cursor = this.add.text(W - 20, winY + winH - 16, '▼', {
      fontSize: '10px', color: '#88bbff',
    }).setOrigin(1, 0).setDepth(22).setAlpha(0);
    this._dialogObjs.push(cursor);

    this._typeText(txt, text, 35, () => {
      // タイプ完了後にカーソル点滅
      this.tweens.add({
        targets: cursor, alpha: { from: 0, to: 1 },
        duration: 400, yoyo: true, repeat: -1,
      });
      this._awaitAdvance(() => {
        this._clearDialog();
        onClose();
      });
    });
  }

  _typeText(txtObj, fullText, msPerChar, onDone) {
    let i = 0;
    const chars = [...fullText];
    const timer = this.time.addEvent({
      delay: msPerChar,
      repeat: chars.length - 1,
      callback: () => {
        i++;
        txtObj.setText(chars.slice(0, i).join(''));
        if (i >= chars.length) {
          this._skipTyping = null;  // タイプ完了したらスキップ関数をクリア
          if (onDone) onDone();
        }
      },
    });
    this._typeTimer = timer;
    // タップ/キーで全表示スキップ
    this._skipTyping = () => {
      if (timer.getRepeatCount() > 0) {
        timer.remove();
        txtObj.setText(fullText);
        this._skipTyping = null;
        if (onDone) onDone();
      }
    };
  }

  _awaitAdvance(cb) {
    this._advanceCb = cb;
  }

  _clearDialog() {
    if (this._typeTimer) { this._typeTimer.remove(); this._typeTimer = null; }
    this._dialogObjs.forEach(o => { if (o && o.active) o.destroy(); });
    this._dialogObjs = [];
    this._advanceCb   = null;
    this._skipTyping  = null;
  }

  // ────────────────────────────
  // 端末イベント（2026計画記録）
  // ────────────────────────────
  _triggerTerminalEvent() {
    // StoryEngineのフラグを立てる
    if (typeof StoryEngine !== 'undefined') {
      StoryEngine.setFlag('plan2026Revealed');
    } else if (typeof GameState !== 'undefined') {
      GameState.flags.plan2026Revealed = true;
    }

    const lines = [
      'これはSHINING FORCE 2026計画記録。',
      '聞こえていれば、あなたたちは生き残った。',
      '各地に61名のシードを分散配置した。',
      'ルーン大陸とパルメキア大陸に、英雄の名を持つ者たち。',
      '────世界を、もう一度、人が住める場所に。',
    ];

    let idx = 0;
    const showNext = () => {
      if (idx >= lines.length) {
        this._mode = 'walk';
        return;
      }
      this._showNpcDialog('端末（音声）', lines[idx], () => {
        idx++;
        showNext();
      });
    };
    showNext();
  }

  // ────────────────────────────
  // 出発確認
  // ────────────────────────────
  _showDepartConfirm() {
    if (this._mode !== 'walk') return;
    this._mode = 'depart';
    this._clearDialog();

    const W = this._W, H = this._H;
    const TS = this._TS;
    const mapH = this._rows * TS;

    const objs = [];
    const winY = mapH - 150;
    const winH = 140;

    const win = this.add.graphics().setDepth(30);
    win.fillStyle(0x000830, 0.97);
    win.fillRoundedRect(20, winY, W - 40, winH, 8);
    win.lineStyle(2, 0x4488cc, 1);
    win.strokeRoundedRect(20, winY, W - 40, winH, 8);
    objs.push(win);

    const title = this.add.text(W/2, winY + 14, '出発しますか？', {
      fontSize: '14px', color: '#ffe040',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5, 0).setDepth(31);
    objs.push(title);

    const line = this.add.graphics().setDepth(31);
    line.lineStyle(1, 0x224466, 1);
    line.lineBetween(28, winY + 34, W - 28, winY + 34);
    objs.push(line);

    // パーティ状態
    const party = (typeof GameState !== 'undefined') ? GameState.party : ['Arc'];
    const partyStr = `・仲間: ${party.join('、')}`;
    const goldStr  = `・所持金: ${TownEngine.gold} G`;
    this.add.text(28, winY + 44, partyStr, {
      fontSize: '11px', color: '#88ccaa',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setDepth(31);
    this.add.text(28, winY + 62, goldStr, {
      fontSize: '11px', color: '#88ccaa',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setDepth(31);

    // 出発 / 戻る
    const departBtn = this.add.text(W/2 - 50, winY + 96, '▶ 出発する', {
      fontSize: '14px', color: '#ffffff',
      backgroundColor: '#1a3a66',
      padding: { x: 10, y: 6 },
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(31).setInteractive();
    objs.push(departBtn);
    departBtn.on('pointerdown', () => {
      objs.forEach(o => { if (o && o.active) o.destroy(); });
      this._depart();
    });

    const backBtn = this.add.text(W/2 + 60, winY + 96, '戻る', {
      fontSize: '13px', color: '#aaaacc',
      padding: { x: 8, y: 6 },
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(31).setInteractive();
    objs.push(backBtn);
    backBtn.on('pointerdown', () => {
      objs.forEach(o => { if (o && o.active) o.destroy(); });
      this._mode = 'walk';
    });

    this._departObjs = objs;

    // キーで操作
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        this.input.keyboard.off('keydown', onKey);
        objs.forEach(o => { if (o && o.active) o.destroy(); });
        this._mode = 'walk';
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        this.input.keyboard.off('keydown', onKey);
        objs.forEach(o => { if (o && o.active) o.destroy(); });
        this._depart();
      }
    };
    this.input.keyboard.on('keydown', onKey);
  }

  _depart() {
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(600, () => {
      // EventSceneを再開（またはストーリーエンジン経由）
      const callerScene = this.scene.manager.getScene('Event');
      this.scene.stop('Explore');
      if (callerScene) {
        callerScene.scene.resume('Event');
        // TownEngineのdepartコールバックを呼ぶ
        TownEngine.depart(this._nextScene);
      }
    });
  }

  // ────────────────────────────
  // インベントリ表示（簡易）
  // ────────────────────────────
  _showInventory() {
    if (this._mode !== 'walk') return;
    this._mode = 'dialog';
    const inv = TownEngine.inventory;
    const text = inv.length > 0
      ? inv.map(i => `${i.name} ×${i.qty}`).join('\n')
      : 'アイテムを持っていない。';
    this._showNpcDialog('所持アイテム', text, () => { this._mode = 'walk'; });
  }

  // ────────────────────────────
  // 入力ハンドラ
  // ────────────────────────────
  _onKey(e) {
    if (this._mode === 'dialog') {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
        if (this._skipTyping) {
          this._skipTyping();
        } else if (this._advanceCb) {
          const cb = this._advanceCb;
          this._advanceCb = null;
          cb();
        }
      }
      return;
    }
    if (this._mode === 'walk') {
      if (e.key === ' ' || e.key === 'z' || e.key === 'Z' || e.key === 'Enter') {
        this._interact();
      }
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        this._showDepartConfirm();
      }
    }
  }

  _onPointer(ptr) {
    if (this._mode === 'dialog') {
      const TS = this._TS;
      const mapH = this._rows * TS;
      if (ptr.y > mapH - 115) {
        // ダイアログ領域タップ
        if (this._skipTyping) {
          this._skipTyping();
        } else if (this._advanceCb) {
          const cb = this._advanceCb;
          this._advanceCb = null;
          cb();
        }
      }
      return;
    }
    if (this._mode !== 'walk') return;

    // マップ上のタップ: NPCをタップして会話
    const col = Math.floor((ptr.x - this._mapOffX) / this._TS);
    const row = Math.floor((ptr.y - this._mapOffY) / this._TS);
    const npc = this._getNpcAt(col, row);
    if (npc) {
      this._talkToNpc(npc);
      return;
    }
    // 空きタイルタップ → その方向へ移動
    const dc = col - this._player.col;
    const dr = row - this._player.row;
    if (Math.abs(dc) + Math.abs(dr) === 1) {
      if (dc !== 0) this._player.dir = dc > 0 ? 'right' : 'left';
      if (dr !== 0) this._player.dir = dr > 0 ? 'down' : 'up';
      this._tryMove(dc, dr);
    } else if (Math.abs(dc) + Math.abs(dr) > 1) {
      // 離れたタイルタップ→1歩だけ近づく（簡易）
      const sx = Math.sign(dc), sy = Math.sign(dr);
      if (Math.abs(dc) >= Math.abs(dr)) {
        this._player.dir = sx > 0 ? 'right' : 'left';
        this._tryMove(sx, 0);
      } else {
        this._player.dir = sy > 0 ? 'down' : 'up';
        this._tryMove(0, sy);
      }
    }
  }

  _onSwipe(ptr) {
    if (!this._touchStart || this._mode !== 'walk') { this._touchStart = null; return; }
    const dx = ptr.x - this._touchStart.x;
    const dy = ptr.y - this._touchStart.y;
    this._touchStart = null;
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;  // 短すぎるスワイプは無視
    if (Math.abs(dx) > Math.abs(dy)) {
      const dir = dx > 0 ? 1 : -1;
      this._player.dir = dir > 0 ? 'right' : 'left';
      this._tryMove(dir, 0);
    } else {
      const dir = dy > 0 ? 1 : -1;
      this._player.dir = dir > 0 ? 'down' : 'up';
      this._tryMove(0, dir);
    }
  }
}
