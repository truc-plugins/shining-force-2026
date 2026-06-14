// EventScene — ストーリーイベントシーン（セリフ・会話・戦闘接続）
class EventScene extends Phaser.Scene {
  constructor() { super('Event'); }

  create() {
    const W = 480, H = 720;
    this.W = W; this.H = H;

    this._inputLocked  = false;
    this._typewriting  = false;
    this._targetText   = '';
    this._typeTimer    = null;
    this._eventQueue   = [];
    this._eventIdx     = 0;
    this._currentScene = null;
    this._onQueueDone  = null;

    // レイヤー（depthで重なり管理）
    this._bgLayer   = this.add.graphics().setDepth(0);
    this._charLayer = this.add.graphics().setDepth(5);
    this._uiLayer   = this.add.graphics().setDepth(10);

    // オブジェクト管理（シーン系 / ダイアログ系を分離）
    this._sceneObjs  = []; // キャララベルなどシーン継続
    this._dialogObjs = []; // セリフ・名前枠など1回ごとに破棄

    this._buildDialogWindow(W, H);
    this._bindInput();

    StoryEngine.init(this);
    this.loadScene(GameState.scene);
  }

  // ══════════════════════════════════════════════
  // シーンロード
  // ══════════════════════════════════════════════
  loadScene(sceneId) {
    const data = STORY_DATA[sceneId];
    if (!data) { this.onChapterEnd(); return; }
    this._currentScene = data;
    this._onQueueDone  = null; // 前のコールバックを必ずクリア

    // フラグ処理
    if (data.onEnterFlag)  StoryEngine.setFlag(data.onEnterFlag);
    if (data.onEnterParty) StoryEngine.addToParty(data.onEnterParty);

    if (data.type === 'battle') {
      this._startBattleScene(data);
    } else {
      this._drawBg(data.bg || 'underground');
      this._clearChars();
      this._fadeIn(500, () => {
        this._eventQueue = data.events || [];
        this._eventIdx   = 0;
        this._nextEvent();
      });
    }
  }

  // 戦闘後のポストダイアログ
  startPostDialog(dialogs, nextId) {
    this.scene.resume('Event');
    if (!dialogs || dialogs.length === 0) {
      this._fadeOut(500, () => StoryEngine.advanceScene(nextId));
      return;
    }
    this._eventQueue = dialogs;
    this._eventIdx   = 0;
    this._onQueueDone = () => {
      this._fadeOut(500, () => StoryEngine.advanceScene(nextId));
    };
    this._nextEvent();
  }

  showGameOver() {
    this.scene.resume('Event');
    this._clearAllObjs();
    this._uiLayer.clear();
    this.add.graphics().fillStyle(0x000000,0.85).fillRect(0,0,this.W,this.H).setDepth(50);
    this.add.text(this.W/2, this.H/2-20, '敗 北…', {
      fontSize:'40px', color:'#ff4444', stroke:'#000000', strokeThickness:6,
      fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(51);
    this.add.text(this.W/2, this.H/2+30, 'タップで最初から', {
      fontSize:'16px', color:'#ffffff',
      fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(51);
    this.input.once('pointerdown', () => {
      GameState.scene = 'ch1_opening';
      this.scene.restart();
    });
  }

  onChapterEnd() {
    this._clearAllObjs();
    const W = this.W, H = this.H;
    this._fadeOut(800, () => {
      this.add.graphics().fillStyle(0x000008,1).fillRect(0,0,W,H).setDepth(50);
      this.add.text(W/2, H/2-20, '── 第1章 完 ──', {
        fontSize:'22px', color:'#ccaa44', fontFamily:'Georgia, serif',
        stroke:'#000000', strokeThickness:4,
      }).setOrigin(0.5).setDepth(51);
      this.add.text(W/2, H/2+30, 'つづく…', {
        fontSize:'14px', color:'#8899bb',
        fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
      }).setOrigin(0.5).setDepth(51);

      // 2秒後にタイトルへ戻る案内
      this.time.delayedCall(2000, () => {
        const hint = this.add.text(W/2, H/2+80, '▼  タップ / Enter でタイトルへ', {
          fontSize:'11px', color:'#556677',
          fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
        }).setOrigin(0.5).setDepth(51);
        this.tweens.add({ targets: hint, alpha: { from:0.3, to:1 }, duration:700, yoyo:true, repeat:-1 });

        const goTitle = () => {
          this.cameras.main.fade(800, 0, 0, 0);
          this.time.delayedCall(800, () => {
            this.scene.stop('Event');
            this.scene.start('Title');
          });
        };
        this.input.once('pointerdown', goTitle);
        this.input.keyboard.once('keydown', goTitle);
      });
    });
  }

  // ══════════════════════════════════════════════
  // イベントキュー処理
  // ══════════════════════════════════════════════
  _nextEvent() {
    if (this._eventIdx >= this._eventQueue.length) {
      this._onQueueDone ? this._onQueueDone() : this._sceneComplete();
      return;
    }
    const ev = this._eventQueue[this._eventIdx++];
    this._processEvent(ev);
  }

  _processEvent(ev) {
    if (ev.type === 'narration') {
      this._showNarration(ev.text);
    } else if (ev.type === 'dialog') {
      this._highlightChar(ev.speaker, ev.pos);
      this._showDialog(ev.speaker, ev.text);
    }
  }

  _sceneComplete() {
    const next = this._currentScene ? this._currentScene.next : null;
    this._fadeOut(500, () => StoryEngine.advanceScene(next));
  }

  // ══════════════════════════════════════════════
  // 戦闘突入
  // ══════════════════════════════════════════════
  _startBattleScene(data) {
    // プレダイアログがあれば先に表示
    if (data.preDialog && data.preDialog.length > 0) {
      this._drawBg(data.bg || 'underground');
      this._clearChars();
      this._fadeIn(400, () => {
        this._eventQueue = data.preDialog;
        this._eventIdx   = 0;
        this._onQueueDone = () => this._launchBattle(data);
        this._nextEvent();
      });
    } else {
      this._launchBattle(data);
    }
  }

  _launchBattle(data) {
    // 画面フラッシュ → 戦闘へ
    const fl = this.add.graphics().fillStyle(0xFFFFFF,0).fillRect(0,0,this.W,this.H).setDepth(100);
    this.tweens.add({ targets:fl, alpha:0.95, duration:80, yoyo:true, repeat:1,
      onComplete: () => {
        fl.destroy();
        BattleBridge.startBattle(this, data, (result, sceneData) => {
          StoryEngine.onBattleResult(result, sceneData);
        });
      }
    });
  }

  // ══════════════════════════════════════════════
  // ダイアログ表示
  // ══════════════════════════════════════════════
  _showDialog(speaker, text) {
    this._inputLocked = true;
    this._clearDialogObjs();

    const W = this.W, H = this.H;
    const PAD = 16;   // 左右余白
    const dlgY = H - 110;
    const wrapW = W - PAD * 2 - 4;

    // 話者名ボックス
    if (speaker) {
      // 文字幅に合わせた名前枠（最大180px）
      const nameW = Math.min(speaker.length * 13 + 20, 180);
      const nG = this.add.graphics().setDepth(11);
      nG.fillStyle(0x000040,1).fillRect(PAD, dlgY+4, nameW, 22);
      nG.fillStyle(0x0050C0,1).fillRect(PAD,   dlgY+4, nameW, 2)
        .fillRect(PAD,   dlgY+24, nameW, 2)
        .fillRect(PAD,   dlgY+4, 2, 22)
        .fillRect(PAD+nameW-2, dlgY+4, 2, 22);
      const nT = this.add.text(PAD+8, dlgY+15, speaker, {
        fontSize:'11px', color:'#FFE040',
        fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
        stroke:'#000040', strokeThickness:2,
      }).setOrigin(0, 0.5).setDepth(12);
      this._dialogObjs.push(nG, nT);
    }

    // テキスト本文
    const textY = speaker ? dlgY + 32 : dlgY + 14;
    this._typeText(text, PAD, textY, wrapW, speaker ? 'left' : 'center');
  }

  _showNarration(text) {
    this._inputLocked = true;
    this._clearDialogObjs();
    const PAD = 16;
    const wrapW = this.W - PAD * 2 - 4;
    this._typeText(text, this.W/2, this.H - 84, wrapW, 'center');
  }

  _typeText(text, x, y, wrapW, align) {
    this._targetText = text;
    this._typewriting = true;

    const style = {
      fontSize: '13px',
      color: '#FFFFFF',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      stroke: '#000040',
      strokeThickness: 2,
      lineSpacing: 4,
      wordWrap: { width: wrapW, useAdvancedWrap: true },
      align: align,
    };
    const originX = align === 'center' ? 0.5 : 0;
    const t = this.add.text(x, y, '', style).setOrigin(originX, 0).setDepth(12);
    this._dialogObjs.push(t);
    this._activeTextObj = t;

    let i = 0;
    const chars = [...text];
    if (this._typeTimer) { this._typeTimer.remove(); this._typeTimer = null; }
    this._typeTimer = this.time.addEvent({ delay:38, repeat: chars.length - 1, callback:()=>{
      t.setText(t.text + chars[i++]);
      if (i >= chars.length) {
        this._typewriting = false;
        this._typeTimer = null;
        this._showCursor();
        this._inputLocked = false;
      }
    }});
  }

  _showCursor() {
    const cur = this.add.text(this.W - 18, this.H - 14, '▼', {
      fontSize: '12px', color: '#FFE040',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(12);
    this._dialogObjs.push(cur);
    this.tweens.add({ targets: cur, alpha: 0, duration: 450, yoyo: true, repeat: -1 });
  }

  _clearDialogObjs() {
    if (this._typeTimer) { this._typeTimer.remove(); this._typeTimer = null; }
    this._dialogObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._dialogObjs = [];
    this._activeTextObj = null;
  }

  _clearAllObjs() {
    this._clearDialogObjs();
    this._sceneObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._sceneObjs = [];
  }

  // ══════════════════════════════════════════════
  // キャラクター表示
  // ══════════════════════════════════════════════
  _clearChars() {
    this._charLayer.clear();
    this._sceneObjs.forEach(o=>{ try{o.destroy();}catch(e){} });
    this._sceneObjs = [];
    this._activeChars = {};
  }

  // キャラカラーマップ
  _charColor(name) {
    const MAP = {
      'Arc':'#88BBFF', 'Sarah':'#FF88AA', 'Lowe':'#88FFAA',
      'Tao':'#FF6622', 'Jaha':'#AABB88', 'Chester':'#88AACC',
      'Max':'#FFEE44', 'Bowie':'#44CCFF', '端末（音声）':'#AAFFEE',
    };
    return MAP[name] || '#CCCCCC';
  }

  // 話しているキャラをハイライト
  _highlightChar(speaker, pos) {
    if (!this._activeChars) this._activeChars = {};
    this._charLayer.clear();
    this._sceneObjs.forEach(o=>{ try{o.destroy();}catch(e){} });
    this._sceneObjs = [];

    const sceneData = this._currentScene;
    const chars = (sceneData && sceneData.characters) ? sceneData.characters : [speaker];

    const posX = { left: this.W*0.2, center: this.W*0.5, right: this.W*0.8 };
    const sprY = Math.floor(this.H * 0.42);

    chars.forEach((name, i) => {
      const positions = ['left','center','right'];
      const charPos = positions[i] || 'center';
      const cx = posX[charPos] || posX.center;
      const isActive = (name === speaker);
      this._drawCharBust(this._charLayer, cx, sprY, name, isActive);

      const lbl = this.add.text(cx, sprY+58, name, {
        fontSize:'11px', color: isActive ? '#FFE040' : '#607080',
        fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
        stroke:'#000030', strokeThickness:2,
      }).setOrigin(0.5, 0).setDepth(6);
      this._sceneObjs.push(lbl);
    });
  }

  _drawCharBust(g, cx, cy, name, isActive) {
    const alpha = isActive ? 1 : 0.45;
    const colStr = this._charColor(name);
    const col = parseInt(colStr.replace('#',''), 16);
    const dark = this._darkCol(col, 0.5);
    const B = cy + 40;

    // 影
    g.fillStyle(0x000000, 0.15*alpha).fillEllipse(cx, B+4, 34, 8);
    // 胴体（鎧/ローブ）
    g.fillStyle(this._darkCol(col,0.7), alpha).fillRect(cx-8, B-38, 16, 28);
    g.fillStyle(col, alpha).fillRect(cx-7, B-37, 9, 14);
    // 頭
    g.fillStyle(0xD09060, alpha).fillRect(cx-6, B-58, 12, 14);
    g.fillStyle(col, alpha).fillRect(cx-7, B-62, 14, 8);
    g.fillStyle(0xE0B090, alpha).fillRect(cx-5, B-57, 10, 12);
    // 目
    g.fillStyle(0x202020, alpha).fillRect(cx-2, B-54, 2, 2).fillRect(cx+2, B-54, 2, 2);
    // アウトライン
    g.lineStyle(1, dark, alpha);
    g.strokeRect(cx-8, B-38, 16, 28);
    g.strokeRect(cx-6, B-58, 12, 14);

    if (isActive) {
      // アクティブ時：下に光ライン
      g.fillStyle(col, 0.6).fillRect(cx-10, B+6, 20, 2);
    }
  }

  _darkCol(c, f) {
    return ((Math.floor(Math.min(255,(c>>16&0xff)*f))<<16)|
            (Math.floor(Math.min(255,(c>>8 &0xff)*f))<<8)|
             Math.floor(Math.min(255,(c    &0xff)*f)));
  }

  // ══════════════════════════════════════════════
  // 背景描画
  // ══════════════════════════════════════════════
  _drawBg(bgType) {
    const g = this._bgLayer;
    g.clear();
    const W = this.W, H = this.H;

    if (bgType === 'underground') {
      // 地下保管庫：暗い緑がかった石壁
      g.fillStyle(0x050A08,1).fillRect(0,0,W,H);
      // 天井
      g.fillStyle(0x0A1410,1).fillRect(0,0,W,Math.floor(H*0.18));
      // 壁（左）
      g.fillStyle(0x0D1A14,1).fillRect(0,0,Math.floor(W*0.12),H);
      // 壁（右）
      g.fillStyle(0x0D1A14,1).fillRect(Math.floor(W*0.88),0,Math.floor(W*0.12),H);
      // 床（パネル）
      g.fillStyle(0x101C18,1).fillRect(0,Math.floor(H*0.62),W,Math.floor(H*0.2));
      // 床タイル目地
      g.fillStyle(0x070E0B,1);
      for(let x=0;x<W;x+=40) g.fillRect(x,Math.floor(H*0.62),1,Math.floor(H*0.2));
      for(let y=Math.floor(H*0.62);y<Math.floor(H*0.82);y+=20) g.fillRect(0,y,W,1);
      // 冷凍ポッド（背景装飾）
      this._drawPods(g, W, H);
      // 非常灯（緑）
      g.fillStyle(0x00FF44,0.4).fillCircle(60, Math.floor(H*0.22),8);
      g.fillStyle(0x00FF44,0.15).fillCircle(60, Math.floor(H*0.22),20);
      g.fillStyle(0x00FF44,0.4).fillCircle(W-60, Math.floor(H*0.22),8);
      g.fillStyle(0x00FF44,0.15).fillCircle(W-60, Math.floor(H*0.22),20);
      // 文字表示エリア背景はダイアログウィンドウで担当
    } else if (bgType === 'surface') {
      // 地上（荒廃した世界）
      // 空（黄昏）
      const skyH = Math.floor(H*0.45);
      g.fillStyle(0x1A0808,1).fillRect(0,0,W,skyH);
      g.fillStyle(0x2A1408,1);
      for(let y=0;y<skyH;y+=2) if(y%4===0) g.fillRect(0,y,W,1);
      // 廃墟シルエット
      g.fillStyle(0x0A0606,1);
      this._drawRuinSilhouette(g, W, skyH);
      // 巨大樹木シルエット
      g.fillStyle(0x060A04,1);
      this._drawGiantTree(g, 60, skyH, 'left');
      this._drawGiantTree(g, W-60, skyH, 'right');
      // 地面
      g.fillStyle(0x0C1008,1).fillRect(0,skyH,W,H-skyH);
      g.fillStyle(0x101408,1);
      for(let x=0;x<W;x+=8) g.fillRect(x,skyH,2,Math.floor((H-skyH)*0.3));
      // 霧
      g.fillStyle(0x202828,0.25).fillRect(0,skyH-20,W,40);
    }
  }

  _drawPods(g, W, H) {
    // 背景に冷凍ポッドの列
    const podY = Math.floor(H*0.28);
    const podH = Math.floor(H*0.26);
    const podW = 28;
    const podCols = [0x0A2018, 0x102818, 0x0C2010];
    for(let i=0;i<5;i++){
      const x = 20 + i*88;
      g.fillStyle(podCols[i%3],1).fillRect(x,podY,podW,podH);
      g.fillStyle(0x00FF88,0.15).fillRect(x+2,podY+4,podW-4,podH-8);
      g.lineStyle(1,0x00AA44,0.5); g.strokeRect(x,podY,podW,podH);
      // インジケータ
      g.fillStyle(0x00FF44,0.6).fillRect(x+6,podY+podH-8,4,4);
    }
  }

  _drawRuinSilhouette(g, W, skyH) {
    // 廃ビル群
    const buildings = [
      [20,skyH-60,40,60],[70,skyH-90,30,90],[110,skyH-50,50,50],
      [180,skyH-80,35,80],[230,skyH-40,45,40],[290,skyH-70,28,70],
      [330,skyH-55,55,55],[400,skyH-85,32,85],[440,skyH-45,40,45],
    ];
    buildings.forEach(([x,y,w,h])=>g.fillRect(x,y,w,h));
  }

  _drawGiantTree(g, cx, skyH, side) {
    const m = side==='left'?1:-1;
    // 幹
    g.fillRect(cx-8,skyH-120,16,140);
    // 枝
    g.fillRect(cx,skyH-100,m*60,6);
    g.fillRect(cx+m*30,skyH-100,6,40);
    g.fillRect(cx,skyH-70,m*40,5);
    g.fillRect(cx+m*20,skyH-70,5,30);
    // 葉（塊）
    g.fillRect(cx-18,skyH-140,36,30);
    g.fillRect(cx-12,skyH-110,24,20);
  }

  // ══════════════════════════════════════════════
  // ダイアログウィンドウ（青枠・濃紺）
  // ══════════════════════════════════════════════
  _buildDialogWindow(W, H) {
    const g = this._uiLayer;
    const dlgH = 110;
    const y = H - dlgH;

    g.fillStyle(0x000030, 0.95).fillRect(0, y, W, dlgH);
    // 外枠
    g.fillStyle(0x0040A0,1).fillRect(0,y,W,2).fillRect(0,H-2,W,2)
      .fillRect(0,y,2,dlgH).fillRect(W-2,y,2,dlgH);
    // 内枠
    g.fillStyle(0x0060D0,1).fillRect(2,y+2,W-4,2).fillRect(2,H-4,W-4,2)
      .fillRect(2,y+2,2,dlgH-4).fillRect(W-4,y+2,2,dlgH-4);
    // ハイライト
    g.fillStyle(0x40A0FF,0.2).fillRect(4,y+4,W-8,1).fillRect(4,y+4,1,dlgH-8);
  }

  // ══════════════════════════════════════════════
  // 入力
  // ══════════════════════════════════════════════
  _bindInput() {
    this.input.on('pointerdown', () => this._onAdvance());
    this.input.keyboard.on('keydown-SPACE', () => this._onAdvance());
    this.input.keyboard.on('keydown-ENTER', () => this._onAdvance());
    this.input.keyboard.on('keydown-Z',     () => this._onAdvance());
  }

  _onAdvance() {
    if (this._typewriting) {
      // タイプライター中→即座に全表示
      if (this._typeTimer) { this._typeTimer.remove(); this._typeTimer = null; }
      this._typewriting = false;
      if (this._activeTextObj) this._activeTextObj.setText(this._targetText);
      this._showCursor();
      this._inputLocked = false;
      return;
    }
    if (this._inputLocked) return;
    this._nextEvent();
  }

  // ══════════════════════════════════════════════
  // フェード
  // ══════════════════════════════════════════════
  _fadeIn(ms, cb) {
    this.cameras.main.fadeIn(ms, 0, 0, 0);
    this.time.delayedCall(ms, () => cb && cb());
  }

  _fadeOut(ms, cb) {
    this.cameras.main.fade(ms, 0, 0, 0, false, (cam, prog) => {
      if (prog >= 1) cb && cb();
    });
  }
}
