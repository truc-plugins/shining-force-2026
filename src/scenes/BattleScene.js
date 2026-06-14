// BattleScene — マップ戦闘シーン
class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  create() {
    try { this._create(); }
    catch(e) {
      this.add.rectangle(0, 0, 480, 720, 0x000011).setOrigin(0);
      this.add.text(10, 10, 'ERROR:\n' + e.message + '\n\n' + (e.stack||'').slice(0,500), {
        fontSize: '10px', color: '#ff4444', fontFamily: 'monospace', wordWrap: { width: 460 },
      });
    }
  }

  _create() {
    this.TS = 30; this.OX = 2; this.OY = 2;
    this.mapData  = MAP_CH1;
    this.selected = null;
    this.moveRange= [];
    this.phase    = 'player';
    this._units   = [];
    this._blinkOn = true;
    this._phase2  = null;
    this._atkTargets = null;
    this._waterFrame = 0;
    this._waterTimer = 0;
    this._idleTimer  = 0;
    this._idleBob    = false;

    this._buildMap();
    this._buildUnits();
    this._buildUI();
    this._buildCmdMenu();
    this._setupInput();
    this._drawAll();
    this._showStatus('第1章  アドラの村外れ');
  }

  // ════════════════════════════════════════════
  // UPDATE（点滅・水アニメ・待機揺れ）
  // ════════════════════════════════════════════
  update(time, delta) {
    // 移動範囲点滅（2.5Hz）
    const bOn = (Math.floor(time / 210) % 2) === 0;
    if (bOn !== this._blinkOn) {
      this._blinkOn = bOn;
      if (this.moveRange && this.moveRange.length) this._drawMoveRange();
      if (this._atkTargets && this._atkTargets.length) this._drawAtkRange(this._atkTargets);
    }
    // 水タイルアニメ（5fps = 200ms/frame）
    this._waterTimer += delta;
    if (this._waterTimer >= 200) {
      this._waterTimer -= 200;
      this._waterFrame = (this._waterFrame + 1) % 3;
      this._redrawWater();
    }
    // ユニット待機揺れ（2-frame, 300ms）
    this._idleTimer += delta;
    if (this._idleTimer >= 300) {
      this._idleTimer -= 300;
      this._idleBob = !this._idleBob;
      const bob = this._idleBob ? -1 : 0;
      this._units.filter(u=>u.alive&&u.sprite&&!u._walking).forEach(u=>{
        u.sprite.g.y  = bob;
        u.sprite.hpG.y= bob;
      });
    }
  }

  // ════════════════════════════════════════════
  // マップ描画（MDパレット・ドット絵タイル）
  // ════════════════════════════════════════════
  _buildMap() {
    this.mapGfx   = this.add.graphics();
    this._waterGfx= this.add.graphics();
    this._waterGfx.setDepth(1);
    this._drawMap();
    this._redrawWater();
  }

  _drawMap() {
    const g = this.mapGfx, TS=this.TS, OX=this.OX, OY=this.OY;
    const tiles = this.mapData.tiles;
    g.clear();
    for (let r=0; r<tiles.length; r++) {
      for (let c=0; c<tiles[r].length; c++) {
        const t=tiles[r][c], bx=OX+c*TS, by=OY+r*TS;
        switch(t) {
          case TILE.GRASS:  this._tileGrass(g,bx,by,(r+c)%2===0); break;
          case TILE.FOREST: this._tileForest(g,bx,by); break;
          case TILE.WATER:  this._tileWaterBase(g,bx,by); break;
          case TILE.HILL:   this._tileHill(g,bx,by); break;
          case TILE.ROAD:   this._tileRoad(g,bx,by); break;
          case TILE.WALL:   this._tileWall(g,bx,by); break;
          case TILE.FORT:   this._tileFort(g,bx,by); break;
          case TILE.BRIDGE: this._tileBridge(g,bx,by); break;
          default: this._tileGrass(g,bx,by,true);
        }
      }
    }
  }

  // S=2: 各「ピクセル」を2×2pxブロックで描画（15×15グリッド）
  _p(g,bx,by,x,y){g.fillRect(bx+x*2,by+y*2,2,2);}

  // 草タイル（PAL0 緑5色）
  _tileGrass(g,bx,by,alt){
    g.fillStyle(0x008000,1).fillRect(bx,by,30,30);
    // 暗影（下・左寄り）
    g.fillStyle(0x004000,1);
    [[0,12],[1,11],[2,13],[4,12],[6,13],[8,14],[10,13],[3,14],[12,13],[14,14]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    g.fillStyle(0x006000,1);
    [[1,9],[3,10],[6,11],[9,10],[11,11],[13,10]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    // ハイライト（右上）
    g.fillStyle(0x00C000,1);
    [[12,0],[13,1],[14,0],[11,1],[14,2]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    // 草の葉（V字形）
    const blades=alt?[[2,4],[3,3],[4,4],[6,7],[7,6],[8,7],[10,4],[11,3],[12,4],[5,10],[6,9],[7,10]]:
                     [[3,6],[4,5],[5,6],[8,8],[9,7],[10,8],[11,4],[12,3],[13,4]];
    g.fillStyle(0x00A000,1); blades.forEach(([x,y])=>this._p(g,bx,by,x,y));
    g.fillStyle(0x006000,1);
    (alt?[[1,6],[2,7],[11,8],[12,9]]:[[6,4],[7,5],[1,8],[2,9]]).forEach(([x,y])=>this._p(g,bx,by,x,y));
  }

  // 森タイル（草+木）
  _tileForest(g,bx,by){
    this._tileGrass(g,bx,by,false);
    // 幹（茶色）
    g.fillStyle(0x806020,1).fillRect(bx+6*2,by+9*2,3*2,6*2);
    g.fillStyle(0x604000,1); [[6,10],[8,10],[6,11],[8,11]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    // 葉（外縁=最暗）
    g.fillStyle(0x004000,1); [[4,8],[5,6],[6,4],[7,3],[8,4],[9,6],[10,8],[10,9],[4,9]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    // 葉本体
    g.fillStyle(0x006000,1).fillRect(bx+5*2,by+5*2,6*2,4*2);
    g.fillStyle(0x008000,1).fillRect(bx+5*2,by+5*2,4*2,3*2);
    g.fillStyle(0x00A000,1); [[6,4],[7,5],[8,4]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    g.fillStyle(0x00C000,1); this._p(g,bx,by,7,3);
  }

  // 水タイル（ベース、静的部分）
  _tileWaterBase(g,bx,by){
    g.fillStyle(0x0060A0,1).fillRect(bx,by,30,30);
    g.fillStyle(0x004060,1);
    [[2,3],[5,7],[9,2],[12,8],[4,11],[8,12],[14,5],[1,13],[6,5]].forEach(([x,y])=>this._p(g,bx,by,x,y));
  }

  // 水タイル波アニメ（別レイヤー）
  _redrawWater(){
    const g=this._waterGfx, tiles=this.mapData.tiles, TS=this.TS, OX=this.OX, OY=this.OY;
    g.clear();
    for(let r=0;r<tiles.length;r++) for(let c=0;c<tiles[r].length;c++){
      if(tiles[r][c]!==TILE.WATER) continue;
      const bx=OX+c*TS, by=OY+r*TS, sh=this._waterFrame*3;
      g.fillStyle(0x40A0E0,1);
      [0,1,2,3].forEach(i=>{const x=(sh+i)%15; g.fillRect(bx+x*2,by+3*2,2,2);});
      [0,1,2].forEach(i=>{const x=(sh+7+i)%15; g.fillRect(bx+x*2,by+9*2,2,2);});
      [0,1].forEach(i=>{const x=(sh+3+i)%15; g.fillRect(bx+x*2,by+13*2,2,2);});
    }
  }

  // 丘タイル
  _tileHill(g,bx,by){
    g.fillStyle(0xA08040,1).fillRect(bx,by,30,30);
    g.fillStyle(0x806020,1);
    [[0,10],[1,9],[2,8],[3,9],[4,10],[5,11],[6,12],[7,11],[8,10],[9,9],[10,8],[11,9],[12,10],[13,11],[14,12]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    g.fillStyle(0xC0A060,1); [[5,7],[6,6],[7,5],[8,6],[9,7]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    g.fillStyle(0x604000,1); [[3,11],[4,12],[5,13]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    g.fillStyle(0x006000,1); [[2,7],[3,6],[4,7],[9,5],[10,4],[11,5]].forEach(([x,y])=>this._p(g,bx,by,x,y));
  }

  // 道タイル
  _tileRoad(g,bx,by){
    g.fillStyle(0xA08040,1).fillRect(bx,by,30,30);
    g.fillStyle(0x806020,1);
    [[2,3],[5,1],[9,4],[12,2],[1,8],[7,7],[13,9],[3,12],[10,11],[0,14],[14,13]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    g.fillStyle(0xC0A060,1); [[4,4],[8,2],[11,6],[6,10],[2,13]].forEach(([x,y])=>this._p(g,bx,by,x,y));
  }

  // 城壁タイル（レンガパターン）
  _tileWall(g,bx,by){
    g.fillStyle(0x808080,1).fillRect(bx,by,30,30);
    // 水平目地
    g.fillStyle(0x202020,1);
    [4,7,11].forEach(y=>g.fillRect(bx,by+y*2,30,2));
    // 垂直目地（偶数段: x=0,7,14）
    [0,7,14].forEach(x=>{g.fillRect(bx+x*2,by,2,4*2);g.fillRect(bx+x*2,by+8*2,2,3*2);g.fillRect(bx+x*2,by+12*2,2,3*2);});
    // 垂直目地（奇数段: x=3,10）
    [3,10].forEach(x=>{g.fillRect(bx+x*2,by+5*2,2,2*2);});
    // レンガハイライト（左上）
    g.fillStyle(0xC0C0C0,1); [[1,0],[8,0],[1,5],[4,5],[11,5],[1,8],[8,8],[4,12],[11,12]].forEach(([x,y])=>this._p(g,bx,by,x,y));
    // レンガ影（右下）
    g.fillStyle(0x404040,1); [[6,3],[13,3],[5,6],[12,6],[6,10],[13,10]].forEach(([x,y])=>this._p(g,bx,by,x,y));
  }

  // 砦タイル
  _tileFort(g,bx,by){
    g.fillStyle(0xA08040,1).fillRect(bx,by,30,30);
    g.fillStyle(0x808080,1).fillRect(bx+2*2,by+2*2,11*2,11*2);
    g.fillStyle(0x404040,1).fillRect(bx+3*2,by+3*2,9*2,9*2);
    g.fillStyle(0x202020,1).fillRect(bx+5*2,by+8*2,5*2,4*2);
    g.fillStyle(0x808080,1).fillRect(bx+3*2,by+2*2,2*2,3*2).fillRect(bx+6*2,by+2*2,2*2,3*2).fillRect(bx+9*2,by+2*2,2*2,3*2);
    g.fillStyle(0xC0C0C0,1); [[3,3],[4,3],[3,4]].forEach(([x,y])=>this._p(g,bx,by,x,y));
  }

  // 橋タイル
  _tileBridge(g,bx,by){
    this._tileWaterBase(g,bx,by);
    g.fillStyle(0x806020,1).fillRect(bx,by+4*2,30,4*2);
    g.fillStyle(0xA08040,1).fillRect(bx+1*2,by+4*2,28,3*2);
    g.fillStyle(0x604000,1); [[0,4],[14,4],[0,7],[14,7]].forEach(([x,y])=>this._p(g,bx,by,x,y));
  }

  // ════════════════════════════════════════════
  // ユニット
  // ════════════════════════════════════════════
  _buildUnits() {
    this.mapData.playerStart.forEach((pos,i) => {
      const raw = ALL_CHARACTERS[i] || ALL_CHARACTERS[0];
      const cd  = createCharacterState(raw);
      const clsD = CHARACTER_CLASSES[raw.cls] || CHARACTER_CLASSES['WARRIOR'];
      this._units.push({
        id:`p${i}`, name:raw.name, cls:raw.cls, clsName:cd.clsName||clsD.name,
        color:clsD.color, level:cd.level, hp:cd.maxHp, maxHp:cd.maxHp,
        mp:cd.maxMp||0, maxMp:cd.maxMp||0, exp:0,
        atk:cd.atk, def:cd.def, agi:cd.agi||cd.spd||5,
        col: pos.x!==undefined?pos.x:pos.col,
        row: pos.y!==undefined?pos.y:pos.row,
        isPlayer:true, acted:false, alive:true,
        magics:cd.magics||clsD.magics||[],
      });
    });
    this.mapData.enemies.forEach((ep,i) => {
      const clsD = CHARACTER_CLASSES[ep.cls]||CHARACTER_CLASSES['WARRIOR'];
      const lvl=ep.level||3, g2=lvl-1;
      this._units.push({
        id:`e${i}`, name:ep.name, cls:ep.cls||'WARRIOR', clsName:clsD.name,
        color:ep.color||clsD.color||0xcc3333, level:lvl, exp:0,
        hp:ep.hp!==undefined?ep.hp:clsD.hp+Math.floor(g2*2.5),
        maxHp:ep.hp!==undefined?ep.hp:clsD.hp+Math.floor(g2*2.5),
        mp:0, maxMp:0,
        atk:ep.atk!==undefined?ep.atk:clsD.atk+Math.floor(g2*0.8),
        def:ep.def!==undefined?ep.def:clsD.def+Math.floor(g2*0.6),
        agi:ep.agi!==undefined?ep.agi:clsD.spd+Math.floor(g2*0.4),
        col:ep.x!==undefined?ep.x:ep.col,
        row:ep.y!==undefined?ep.y:ep.row,
        isPlayer:false, acted:false, alive:true, isBoss:!!ep.isBoss, magics:[],
      });
    });
  }

  // ════════════════════════════════════════════
  // スプライト（職業別）
  // ════════════════════════════════════════════
  _drawAll() {
    this._units.forEach(u => {
      if (u.sprite) { u.sprite.g.destroy(); u.sprite.hpG.destroy(); if(u.sprite.lbl)u.sprite.lbl.destroy(); u.sprite=null; }
    });
    this._units.filter(u=>u.alive).forEach(u=>this._makeSprite(u));
    this._drawMoveRange();
  }

  _makeSprite(u) {
    const TS=this.TS,OX=this.OX,OY=this.OY;
    const px=OX+u.col*TS, py=OY+u.row*TS;
    const g=this.add.graphics();
    u._walkF=0;
    this._drawUnitByClass(g,px,py,TS,u,0);
    const hpG=this.add.graphics();
    this._renderHpBar(hpG,px,py,TS,u);
    u.sprite={g,hpG};
  }

  // PAL3 HPバー（00E000緑/E0E000黄/E00000赤）
  _renderHpBar(hpG,px,py,TS,u) {
    hpG.clear();
    const r=u.hp/u.maxHp;
    const col=r>0.5?0x00E000:r>0.25?0xE0E000:0xE00000;
    const W=TS-2, fill=Math.max(1,Math.round(W*r));
    // 影
    hpG.fillStyle(0x202020,1).fillRect(px+1,py+TS-5,W,4);
    // バー本体
    hpG.fillStyle(col,1).fillRect(px+1,py+TS-5,fill,4);
    // ハイライト（明るい1px線）
    hpG.fillStyle(col===0x00E000?0x80FF80:col===0xE0E000?0xFFFF80:0xFF8080,0.7)
       .fillRect(px+1,py+TS-5,fill,1);
    // 外枠
    hpG.lineStyle(1,0x404040,1).strokeRect(px+1,py+TS-5,W,4);
  }

  _refreshSprite(u,walkF) {
    if (!u.sprite) return;
    const TS=this.TS,OX=this.OX,OY=this.OY;
    const px=OX+u.col*TS,py=OY+u.row*TS;
    u.sprite.g.x=0; u.sprite.g.y=0;
    u.sprite.hpG.x=0; u.sprite.hpG.y=0;
    this._drawUnitByClass(u.sprite.g,px,py,TS,u,walkF||0);
    this._renderHpBar(u.sprite.hpG,px,py,TS,u);
  }

  _drawUnitByClass(g,px,py,TS,u,walkF) {
    const col=u.acted?this._dk(u.color,0.5):u.color;
    const isE=!u.isPlayer, cls=u.cls||'WARRIOR';
    const cx=px+Math.floor(TS/2);
    g.clear();
    // 選択枠（PAL3 橙カーソル）
    if (u===this.selected) {
      g.lineStyle(2,0xE06000,0.9).strokeRect(px,py,TS,TS);
      g.fillStyle(0xE06000,0.12).fillRect(px,py,TS,TS);
    }
    // 影
    g.fillStyle(0x000000,0.22).fillEllipse(cx,py+TS-4,TS*0.6,4);
    switch(cls) {
      case 'HERO':    this._smHero(g,cx,py,TS,col,isE,u.isBoss,walkF); break;
      case 'WARRIOR': this._smWarrior(g,cx,py,TS,col,isE,u.isBoss,walkF); break;
      case 'KNIGHT':  this._smKnight(g,cx,py,TS,col,isE,walkF); break;
      case 'MAGE':
      case 'WIZARD':  this._smMage(g,cx,py,TS,col,isE,walkF); break;
      case 'HEALER':  this._smHealer(g,cx,py,TS,col,isE,walkF); break;
      case 'ARCHER':  this._smArcher(g,cx,py,TS,col,isE,walkF); break;
      case 'BIRDMAN': this._smBirdman(g,cx,py,TS,col,isE,walkF); break;
      case 'CENTAUR': this._smCentaur(g,cx,py,TS,col,isE,walkF); break;
      case 'MONK':    this._smMonk(g,cx,py,TS,col,isE,walkF); break;
      case 'ROGUE':   this._smRogue(g,cx,py,TS,col,isE,walkF); break;
      case 'BARON':   this._smBaron(g,cx,py,TS,col,isE,u.isBoss,walkF); break;
      default:        this._smWarrior(g,cx,py,TS,col,isE,false,walkF); break;
    }
  }

  _dk(c,f){return((Math.floor(Math.min(255,(c>>16&0xff)*f))<<16)|(Math.floor(Math.min(255,(c>>8&0xff)*f))<<8)|Math.floor(Math.min(255,(c&0xff)*f)));}

  // ════════════════════════════════════════════
  // 小型スプライト（PAL1/PAL2準拠・ドット絵スタイル）
  // walkF: 0=idle, 1=左足前, 2=idle, 3=右足前
  // ════════════════════════════════════════════
  // PAL1/PAL2共通ヘルパー
  _pp(g,x,y,c){g.fillStyle(c,1).fillRect(x,y,2,2);}

  // 人型ユニット共通描画（正面・2頭身）
  // cx=中心x, B=底y, col=鎧色, isE=敵, walkF=歩行フレーム
  _smHumanoid(g,cx,B,col,isE,boss,walkF,hasShield,hasWeapon,capColor){
    const OL=0x200000;
    const SK2=isE?0x808040:0xA04020, SK3=isE?0xC0C040:0xE08060, SK1=isE?0x606020:0x602000;
    const BD=0x004080, BM=0x0060C0, BL=0x40A0FF;
    const WD=0x604000, WM=0xA08000, WL=0xFFE040;
    const aL=this._dk(col,1.4<255/Math.max((col>>16&0xff),(col>>8&0xff),(col&0xff))?1.4:1.2);
    const aD=this._dk(col,0.55);
    const cap=capColor||aD;

    // --- 歩行フレーム（足位置オフセット） ---
    const Ldy=walkF===1?-2:walkF===3?2:0; // 左足
    const Rdy=walkF===1?2:walkF===3?-2:0; // 右足
    const bobY=walkF===1||walkF===3?-1:0;  // 体の上下

    // 武器（剣: 右側に縦）
    if(hasWeapon){
      g.fillStyle(WD,1).fillRect(cx+7,B-28+bobY,3,20);
      g.fillStyle(WM,1).fillRect(cx+7,B-28+bobY,2,19);
      g.fillStyle(WL,1).fillRect(cx+7,B-28+bobY,2,8); // ハイライト（刃上部）
      this._pp(g,cx+7,B-30+bobY,WL);
      g.fillStyle(WD,1).fillRect(cx+5,B-12+bobY,6,2); // ガード
      g.fillStyle(WL,1).fillRect(cx+5,B-12+bobY,2,2);
    }

    // 盾（左側）
    if(hasShield){
      g.fillStyle(BD,1).fillRect(cx-12,B-22+bobY,6,10);
      g.fillStyle(BM,1).fillRect(cx-11,B-21+bobY,4,7);
      g.fillStyle(BL,1).fillRect(cx-11,B-21+bobY,2,3);
      g.fillStyle(OL,1).fillRect(cx-12,B-23+bobY,6,1).fillRect(cx-12,B-12+bobY,6,1).fillRect(cx-13,B-22+bobY,1,10).fillRect(cx-6,B-22+bobY,1,10);
    }

    // 腕（左右）
    g.fillStyle(col,1).fillRect(cx-9,B-22+bobY,2,10).fillRect(cx+7,B-22+bobY,2,10);
    g.fillStyle(aD,1).fillRect(cx+8,B-18+bobY,1,5);

    // 体（鎧胴体）
    g.fillStyle(col,1).fillRect(cx-6,B-22+bobY,12,12);
    // ディザリング（鎧光沢）
    g.fillStyle(aL,1);
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)if((i+j)%2===0) g.fillRect(cx-5+i*2,B-21+j*2+bobY,2,2);
    g.fillStyle(aD,1).fillRect(cx+4,B-12+bobY,2,5).fillRect(cx-6,B-16+bobY,2,4);
    // ベルト
    g.fillStyle(WD,1).fillRect(cx-6,B-11+bobY,12,2);
    // 輪郭（体）
    g.fillStyle(OL,1).fillRect(cx-7,B-23+bobY,14,1).fillRect(cx-7,B-10+bobY,14,1).fillRect(cx-7,B-23+bobY,1,14).fillRect(cx+6,B-23+bobY,1,14);

    // 足（左）
    g.fillStyle(aD,1).fillRect(cx-6,B-10+Ldy,5,8);
    g.fillStyle(col,1).fillRect(cx-5,B-10+Ldy,3,6);
    g.fillStyle(0x202020,1).fillRect(cx-6,B-3+Ldy,5,3); // ブーツ
    g.fillStyle(0x404040,1).fillRect(cx-5,B-3+Ldy,3,1); // ブーツハイライト
    // 足（右）
    g.fillStyle(aD,1).fillRect(cx+1,B-10+Rdy,5,8);
    g.fillStyle(col,1).fillRect(cx+2,B-10+Rdy,3,6);
    g.fillStyle(0x202020,1).fillRect(cx+1,B-3+Rdy,5,3);
    g.fillStyle(0x404040,1).fillRect(cx+2,B-3+Rdy,3,1);

    // 頭（兜/帽子）
    g.fillStyle(cap,1).fillRect(cx-5,B-32+bobY,10,6);
    g.fillStyle(this._dk(cap,1.3<2?1.3:1.1),1).fillRect(cx-4,B-32+bobY,4,2);
    g.fillStyle(OL,1).fillRect(cx-6,B-33+bobY,12,1).fillRect(cx-6,B-32+bobY,1,6).fillRect(cx+5,B-32+bobY,1,6);

    // 顔
    g.fillStyle(SK2,1).fillRect(cx-4,B-27+bobY,8,8);
    g.fillStyle(SK3,1).fillRect(cx-3,B-27+bobY,5,4);
    g.fillStyle(SK1,1).fillRect(cx-3,B-20+bobY,5,2);
    // 目（左右）
    g.fillStyle(isE?0xE00000:OL,1).fillRect(cx-3,B-25+bobY,2,2).fillRect(cx+1,B-25+bobY,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx-2,B-25+bobY,1,1).fillRect(cx+2,B-25+bobY,1,1);
    // 顔輪郭
    g.fillStyle(OL,1).fillRect(cx-5,B-28+bobY,10,1).fillRect(cx-5,B-19+bobY,10,1).fillRect(cx-5,B-28+bobY,1,9).fillRect(cx+4,B-28+bobY,1,9);

    // ボス装飾
    if(boss){
      g.fillStyle(0xFFE040,1).fillTriangle(cx-5,B-33+bobY,cx,B-38+bobY,cx+5,B-33+bobY);
      g.fillStyle(WL,1).fillRect(cx-1,B-37+bobY,2,3);
    }
  }

  _smHero(g,cx,py,TS,col,isE,boss,wf){
    const B=py+TS;
    this._smHumanoid(g,cx,B,col,isE,boss,wf,true,true,0x0060C0);
  }
  _smWarrior(g,cx,py,TS,col,isE,boss,wf){
    const B=py+TS;
    this._smHumanoid(g,cx,B,col,isE,boss,wf,true,true,null);
  }
  _smKnight(g,cx,py,TS,col,isE,wf){
    const B=py+TS;
    // 馬体（下）
    const hC=isE?0x604000:0x806020;
    g.fillStyle(hC,1).fillEllipse(cx,B-8,TS*0.85,13);
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    g.fillStyle(this._dk(hC,0.7),1);
    g.fillRect(cx-12,B-9,5,9+Ldy).fillRect(cx-4,B-9,5,7+Rdy).fillRect(cx+1,B-9,5,7+Ldy).fillRect(cx+7,B-9,5,9+Rdy);
    // 騎乗部
    this._smHumanoid(g,cx,B-8,col,isE,false,0,false,true,this._dk(col,0.6));
  }
  _smMage(g,cx,py,TS,col,isE,wf){
    const B=py+TS, OL=0x200000;
    const SK2=isE?0x808040:0xA04020, SK3=isE?0xC0C040:0xE08060;
    const WD=0x604000, WM=0xA08000, WL=0xFFE040;
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    const bob=wf===1||wf===3?-1:0;
    // 杖（左側に長い）
    g.fillStyle(WD,1).fillRect(cx-10,B-34+bob,3,26);
    g.fillStyle(WM,1).fillRect(cx-10,B-34+bob,2,25);
    g.fillStyle(0xCC66FF,1).fillCircle(cx-9,B-36+bob,4);
    g.fillStyle(0xE0E0E0,1).fillCircle(cx-9,B-38+bob,2);
    // ローブ
    g.fillStyle(col,1).fillRect(cx-7,B-24+bob,14,24+Math.abs(bob));
    g.fillStyle(this._dk(col,0.7),1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0)g.fillRect(cx+2+i*2,B-16+j*2+bob,2,2);
    // 足
    g.fillStyle(0x202020,1).fillRect(cx-5,B-5+Ldy,4,5).fillRect(cx+1,B-5+Rdy,4,5);
    // 袖・腕
    g.fillStyle(this._dk(col,0.6),1).fillRect(cx-10,B-22+bob,3,10).fillRect(cx+7,B-22+bob,3,10);
    // 帽子
    g.fillStyle(col,1).fillTriangle(cx,B-36+bob,cx-8,B-24+bob,cx+8,B-24+bob).fillRect(cx-9,B-26+bob,18,4);
    g.fillStyle(this._dk(col,0.65),1).fillRect(cx+1,B-34+bob,4,8);
    g.fillStyle(OL,1).fillRect(cx-9,B-27+bob,18,1).fillRect(cx-9,B-22+bob,18,1);
    // 顔
    g.fillStyle(SK2,1).fillRect(cx-4,B-28+bob,8,8);
    g.fillStyle(SK3,1).fillRect(cx-3,B-28+bob,5,4);
    g.fillStyle(isE?0xE00000:OL,1).fillRect(cx-3,B-26+bob,2,2).fillRect(cx+1,B-26+bob,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx-2,B-26+bob,1,1).fillRect(cx+2,B-26+bob,1,1);
    g.fillStyle(OL,1).fillRect(cx-5,B-29+bob,10,1).fillRect(cx-5,B-20+bob,10,1).fillRect(cx-5,B-29+bob,1,9).fillRect(cx+4,B-29+bob,1,9);
  }
  _smHealer(g,cx,py,TS,col,isE,wf){
    const B=py+TS, OL=0x200000;
    const SK2=isE?0x808040:0xA04020, SK3=isE?0xC0C040:0xE08060;
    const WM=0xA08000, WL=0xFFE040;
    const robe=isE?col:0xE0E0E0;
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    const bob=wf===1||wf===3?-1:0;
    // 杖
    g.fillStyle(0x806020,1).fillRect(cx+8,B-34+bob,2,26);
    g.fillStyle(col,1).fillRect(cx+7,B-33+bob,5,2).fillRect(cx+8,B-36+bob,2,6);
    g.fillStyle(WL,1).fillTriangle(cx+9,B-37+bob,cx+7,B-32+bob,cx+11,B-32+bob);
    // ローブ
    g.fillStyle(robe,1).fillRect(cx-7,B-24+bob,14,24);
    g.fillStyle(this._dk(robe,0.85),1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0)g.fillRect(cx-4+i*2,B-18+j*2+bob,2,2);
    // 十字紋
    g.fillStyle(col,1).fillRect(cx-1,B-22+bob,2,8).fillRect(cx-4,B-18+bob,8,3);
    // 袖
    g.fillStyle(this._dk(robe,0.75),1).fillRect(cx-10,B-22+bob,3,10).fillRect(cx+7,B-22+bob,3,10);
    // 足
    g.fillStyle(0x202020,1).fillRect(cx-5,B-5+Ldy,4,5).fillRect(cx+1,B-5+Rdy,4,5);
    // 頭巾
    g.fillStyle(robe,1).fillRect(cx-5,B-36+bob,10,10).fillRect(cx-7,B-30+bob,14,5);
    g.fillStyle(this._dk(robe,0.7),1).fillRect(cx+2,B-34+bob,3,6);
    // 顔
    g.fillStyle(SK2,1).fillRect(cx-4,B-28+bob,8,8);
    g.fillStyle(SK3,1).fillRect(cx-3,B-28+bob,5,4);
    g.fillStyle(isE?0xE00000:OL,1).fillRect(cx-3,B-26+bob,2,2).fillRect(cx+1,B-26+bob,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx-2,B-26+bob,1,1).fillRect(cx+2,B-26+bob,1,1);
    g.fillStyle(OL,1).fillRect(cx-5,B-29+bob,10,1).fillRect(cx-5,B-20+bob,10,1).fillRect(cx-5,B-29+bob,1,9).fillRect(cx+4,B-29+bob,1,9);
  }
  _smArcher(g,cx,py,TS,col,isE,wf){
    const B=py+TS, OL=0x200000;
    const SK2=isE?0x808040:0xA04020, SK3=isE?0xC0C040:0xE08060;
    const WD=0x604000, WM=0xA08000, WL=0xFFE040;
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    const bob=wf===1||wf===3?-1:0;
    // 弓（左側）
    g.lineStyle(3,WD,1).beginPath().moveTo(cx-9,B-32+bob).lineTo(cx-12,B-20+bob).lineTo(cx-9,B-8+bob).strokePath();
    g.lineStyle(1,WL,1).lineBetween(cx-9,B-32+bob,cx-9,B-8+bob);
    // 矢
    g.lineStyle(1,WD,1).lineBetween(cx-9,B-20+bob,cx+6,B-20+bob);
    g.fillStyle(WL,1).fillTriangle(cx+6,B-20+bob,cx+3,B-22+bob,cx+3,B-18+bob);
    // 体
    g.fillStyle(col,1).fillRect(cx-6,B-22+bob,12,12);
    g.fillStyle(this._dk(col,0.65),1).fillRect(cx-10,B-22+bob,4,12).fillRect(cx+6,B-22+bob,4,12);
    g.fillStyle(this._dk(col,1.2),1); for(let i=0;i<2;i++)for(let j=0;j<3;j++)if((i+j)%2===0)g.fillRect(cx-5+i*2,B-21+j*2+bob,2,2);
    g.fillStyle(OL,1).fillRect(cx-7,B-23+bob,14,1).fillRect(cx-7,B-10+bob,14,1).fillRect(cx-7,B-23+bob,1,14).fillRect(cx+6,B-23+bob,1,14);
    // 足
    g.fillStyle(this._dk(col,0.55),1).fillRect(cx-6,B-10+bob,5,8+Ldy*0.5).fillRect(cx+1,B-10+bob,5,8+Rdy*0.5);
    g.fillStyle(col,1).fillRect(cx-5,B-10+bob,3,6+Ldy*0.5).fillRect(cx+2,B-10+bob,3,6+Rdy*0.5);
    g.fillStyle(0x202020,1).fillRect(cx-6,B-3+Ldy,5,3).fillRect(cx+1,B-3+Rdy,5,3);
    g.fillStyle(0x404040,1).fillRect(cx-5,B-3+Ldy,3,1).fillRect(cx+2,B-3+Rdy,3,1);
    // 頭
    g.fillStyle(this._dk(col,0.55),1).fillRect(cx-5,B-32+bob,10,6);
    g.fillStyle(this._dk(col,0.7),1).fillRect(cx-4,B-32+bob,5,2);
    g.fillStyle(SK2,1).fillRect(cx-4,B-27+bob,8,8);
    g.fillStyle(SK3,1).fillRect(cx-3,B-27+bob,5,4);
    g.fillStyle(isE?0xE00000:OL,1).fillRect(cx-3,B-25+bob,2,2).fillRect(cx+1,B-25+bob,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx-2,B-25+bob,1,1).fillRect(cx+2,B-25+bob,1,1);
    g.fillStyle(OL,1).fillRect(cx-5,B-28+bob,10,1).fillRect(cx-5,B-19+bob,10,1).fillRect(cx-5,B-28+bob,1,9).fillRect(cx+4,B-28+bob,1,9);
  }
  _smBirdman(g,cx,py,TS,col,isE,wf){
    const B=py+TS, OL=0x200000;
    const SK2=isE?0x808040:0xA04020;
    const WD=0x604000, WM=0xA08000, WL=0xFFE040;
    const bob=wf===1||wf===3?-1:0;
    const wSpread=wf===1?4:wf===3?-4:0; // 翼の開閉
    // 翼
    g.fillStyle(col,0.75).fillTriangle(cx-6,B-22+bob,cx-18-wSpread,B-32+bob,cx-4,B-12+bob);
    g.fillStyle(col,0.75).fillTriangle(cx+6,B-22+bob,cx+18+wSpread,B-32+bob,cx+4,B-12+bob);
    g.fillStyle(this._dk(col,0.6),0.6).fillTriangle(cx-6,B-20+bob,cx-14-wSpread,B-28+bob,cx-4,B-12+bob);
    g.fillStyle(this._dk(col,0.6),0.6).fillTriangle(cx+6,B-20+bob,cx+14+wSpread,B-28+bob,cx+4,B-12+bob);
    // 体
    this._smHumanoid(g,cx,B,col,isE,false,wf,false,true,this._dk(col,0.55));
    // くちばし
    g.fillStyle(0xFF8800,1).fillTriangle(cx+4,B-27+bob,cx+8,B-25+bob,cx+4,B-23+bob);
    g.fillStyle(0xFF5500,1).fillRect(cx+4,B-27+bob,2,2);
  }
  _smCentaur(g,cx,py,TS,col,isE,wf){
    const B=py+TS, hC=isE?0x604000:0x806020;
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    // 馬体
    g.fillStyle(hC,1).fillEllipse(cx,B-8,TS*0.95,15);
    g.fillStyle(this._dk(hC,0.75),1);
    g.fillRect(cx-12,B-8,5,8+Ldy).fillRect(cx-4,B-8,5,7+Rdy).fillRect(cx+1,B-8,5,7+Ldy).fillRect(cx+7,B-8,5,8+Rdy);
    // 馬体ハイライト
    g.fillStyle(this._dk(hC,1.3),0.5).fillEllipse(cx-3,B-13,TS*0.5,5);
    // 騎乗部
    this._smHumanoid(g,cx,B-7,col,isE,false,0,false,true,this._dk(col,0.6));
  }
  _smMonk(g,cx,py,TS,col,isE,wf){
    const B=py+TS, OL=0x200000;
    const SK2=isE?0x808040:0xA04020, SK3=isE?0xC0C040:0xE08060;
    const bob=wf===1||wf===3?-1:0;
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    // 道着
    g.fillStyle(col,1).fillRect(cx-6,B-22+bob,12,12);
    g.fillStyle(this._dk(col,0.65),1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0)g.fillRect(cx-4+i*2,B-20+j*2+bob,2,2);
    // 帯
    g.fillStyle(0xFFE040,1).fillRect(cx-6,B-11+bob,12,2);
    // 袖（肌色）
    g.fillStyle(SK2,1).fillRect(cx-9,B-22+bob,3,10).fillRect(cx+6,B-22+bob,3,10);
    // 拳（前に突き出し）
    g.fillStyle(SK2,1).fillRect(cx+6,B-14+bob,6,5);
    g.fillStyle(SK3,1).fillRect(cx+7,B-13+bob,3,2);
    // 気オーラ（薄く）
    g.fillStyle(0xFFAA00,0.18).fillCircle(cx+8,B-12+bob,9);
    g.fillStyle(0xFFE040,0.3).fillCircle(cx+8,B-12+bob,4);
    // 足
    g.fillStyle(SK2,1).fillRect(cx-6,B-10+bob,5,8+Ldy*0.5).fillRect(cx+1,B-10+bob,5,8+Rdy*0.5);
    g.fillStyle(0x202020,1).fillRect(cx-6,B-3+Ldy,5,3).fillRect(cx+1,B-3+Rdy,5,3);
    // 頭（剃り頭）
    g.fillStyle(SK2,1).fillRect(cx-5,B-32+bob,10,10);
    g.fillStyle(SK3,1).fillRect(cx-4,B-32+bob,6,5);
    g.fillStyle(isE?0xE00000:OL,1).fillRect(cx-3,B-27+bob,2,2).fillRect(cx+1,B-27+bob,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx-2,B-27+bob,1,1).fillRect(cx+2,B-27+bob,1,1);
    g.fillStyle(OL,1).fillRect(cx-6,B-33+bob,12,1).fillRect(cx-6,B-22+bob,12,1).fillRect(cx-6,B-33+bob,1,11).fillRect(cx+5,B-33+bob,1,11);
  }
  _smRogue(g,cx,py,TS,col,isE,wf){
    const B=py+TS, OL=0x200000;
    const SK2=isE?0x808040:0xA04020;
    const WD=0x604000, WM=0xA08000, WL=0xFFE040;
    const bob=wf===1||wf===3?-1:0;
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    // ダガー×2
    g.fillStyle(WM,1).fillRect(cx-10,B-26+bob,2,14).fillRect(cx+8,B-24+bob,2,12);
    g.fillStyle(WL,1).fillRect(cx-10,B-26+bob,1,13).fillRect(cx+8,B-24+bob,1,11);
    g.fillStyle(WD,1).fillRect(cx-10,B-13+bob,4,2).fillRect(cx+7,B-13+bob,4,2);
    // 体（マント）
    g.fillStyle(col,1).fillRect(cx-6,B-22+bob,12,12);
    g.fillStyle(col,0.5).fillTriangle(cx-6,B-22+bob,cx-12,B-8+bob,cx-6,B-10+bob).fillTriangle(cx+6,B-22+bob,cx+12,B-8+bob,cx+6,B-10+bob);
    g.fillStyle(this._dk(col,0.6),1); for(let i=0;i<3;i++)for(let j=0;j<2;j++)if((i+j)%2===0)g.fillRect(cx-4+i*2,B-20+j*2+bob,2,2);
    g.fillStyle(this._dk(col,0.5),1).fillRect(cx-10,B-22+bob,4,12).fillRect(cx+6,B-22+bob,4,12);
    // 足
    g.fillStyle(0x101010,1).fillRect(cx-6,B-10+bob,5,10+Ldy*0.5).fillRect(cx+1,B-10+bob,5,10+Rdy*0.5);
    g.fillStyle(0x303030,1).fillRect(cx-5,B-10+bob,3,6+Ldy*0.5).fillRect(cx+2,B-10+bob,3,6+Rdy*0.5);
    // 頭（フード）
    g.fillStyle(this._dk(col,0.6),1).fillRect(cx-5,B-36+bob,10,14);
    g.fillStyle(SK2,1).fillRect(cx-3,B-28+bob,6,8);
    // 目（緑・盗賊スタイル）
    g.fillStyle(0x00CC44,1).fillRect(cx-2,B-25+bob,2,2).fillRect(cx+1,B-25+bob,2,2);
    g.fillStyle(0x80FF80,1).fillRect(cx-1,B-25+bob,1,1).fillRect(cx+2,B-25+bob,1,1);
    g.fillStyle(OL,1).fillRect(cx-6,B-37+bob,12,1).fillRect(cx-6,B-22+bob,12,1).fillRect(cx-6,B-37+bob,1,15).fillRect(cx+5,B-37+bob,1,15);
  }
  _smBaron(g,cx,py,TS,col,isE,boss,wf){
    const B=py+TS, OL=0x200000;
    const SK2=isE?0x808040:0xA04020;
    const BD=0x004080, BM=0x0060C0, BL=0x40A0FF;
    const WD=0x604000, WM=0xA08000, WL=0xFFE040;
    const bob=wf===1||wf===3?-1:0;
    const Ldy=wf===1?-2:wf===3?2:0, Rdy=wf===1?2:wf===3?-2:0;
    // 暗黒剣（大型）
    g.fillStyle(0x4040A0,1).fillRect(cx+7,B-34+bob,4,24);
    g.fillStyle(0x8080C0,1).fillRect(cx+7,B-34+bob,2,23);
    g.fillStyle(WL,1).fillRect(cx+7,B-34+bob,1,10);
    g.fillStyle(WD,1).fillRect(cx+5,B-11+bob,8,2); // 鍔
    g.fillStyle(WL,1).fillRect(cx+5,B-11+bob,2,2);
    // 大型盾
    g.fillStyle(BD,1).fillRect(cx-13,B-24+bob,7,14);
    g.fillStyle(BM,1).fillRect(cx-12,B-23+bob,5,10);
    g.fillStyle(BL,1).fillRect(cx-12,B-23+bob,2,5);
    g.fillStyle(WL,1).fillRect(cx-11,B-20+bob,3,5);
    g.fillStyle(OL,1).fillRect(cx-13,B-25+bob,7,1).fillRect(cx-13,B-10+bob,7,1).fillRect(cx-14,B-24+bob,1,14).fillRect(cx-6,B-24+bob,1,14);
    // 体（重装甲）
    g.fillStyle(col,1).fillRect(cx-7,B-24+bob,14,14);
    g.fillStyle(this._dk(col,1.3),1); for(let i=0;i<4;i++)for(let j=0;j<3;j++)if((i+j)%2===0)g.fillRect(cx-6+i*2,B-23+j*2+bob,2,2);
    g.fillStyle(this._dk(col,0.5),1).fillRect(cx-11,B-24+bob,4,14).fillRect(cx+7,B-24+bob,4,14);
    g.fillStyle(0x000020,0.6).fillRect(cx-4,B-17+bob,8,4); // 暗黒紋章
    g.fillStyle(WD,1).fillRect(cx-7,B-11+bob,14,2); // 帯
    g.fillStyle(OL,1).fillRect(cx-8,B-25+bob,16,1).fillRect(cx-8,B-10+bob,16,1).fillRect(cx-8,B-25+bob,1,16).fillRect(cx+7,B-25+bob,1,16);
    // 足
    g.fillStyle(this._dk(col,0.5),1).fillRect(cx-7,B-10+bob,6,10+Ldy*0.5).fillRect(cx+1,B-10+bob,6,10+Rdy*0.5);
    g.fillStyle(0x101010,1).fillRect(cx-7,B-3+Ldy,6,3).fillRect(cx+1,B-3+Rdy,6,3);
    // 頭（暗黒兜）
    g.fillStyle(this._dk(col,0.5),1).fillRect(cx-6,B-36+bob,12,12);
    g.fillStyle(0x000020,0.8).fillRect(cx-4,B-28+bob,8,5); // バイザー
    g.fillStyle(isE||boss?0xE00000:0xE06000,1).fillRect(cx-3,B-26+bob,2,2).fillRect(cx+1,B-26+bob,2,2);
    g.fillStyle(0xFF8080,0.7).fillRect(cx-2,B-26+bob,1,1).fillRect(cx+2,B-26+bob,1,1);
    g.fillStyle(OL,1).fillRect(cx-7,B-37+bob,14,1).fillRect(cx-7,B-24+bob,14,1).fillRect(cx-7,B-37+bob,1,13).fillRect(cx+6,B-37+bob,1,13);
    if(boss){g.fillStyle(0xE00000,1).fillTriangle(cx-6,B-37+bob,cx,B-42+bob,cx+6,B-37+bob);g.fillStyle(WL,1).fillRect(cx-1,B-41+bob,2,4);}
  }

  // ════════════════════════════════════════════
  // 移動ハイライト（点滅）
  // ════════════════════════════════════════════
  _drawMoveRange() {
    if (!this._rangeGfx) this._rangeGfx = this.add.graphics();
    const g = this._rangeGfx; g.clear();
    if (!this.moveRange.length) return;
    const TS=this.TS,OX=this.OX,OY=this.OY;
    const a = this._blinkOn ? 0.38 : 0.16;
    g.fillStyle(0x4488ff, a);
    this.moveRange.forEach(({col,row})=>g.fillRect(OX+col*TS,OY+row*TS,TS-1,TS-1));
    if (this._blinkOn) {
      g.lineStyle(1,0x88bbff,0.6);
      this.moveRange.forEach(({col,row})=>g.strokeRect(OX+col*TS,OY+row*TS,TS-1,TS-1));
    }
  }

  // 攻撃範囲ハイライト（赤・点滅）
  _drawAtkRange(targets) {
    if (!this._atkGfx) this._atkGfx = this.add.graphics();
    const g = this._atkGfx; g.clear();
    if (!targets || !targets.length) return;
    const TS=this.TS,OX=this.OX,OY=this.OY;
    const a = this._blinkOn ? 0.62 : 0.28;
    g.fillStyle(0xff3300, a);
    targets.forEach(t=>g.fillRect(OX+t.col*TS,OY+t.row*TS,TS-1,TS-1));
    g.lineStyle(2,0xff8844,0.9);
    targets.forEach(t=>g.strokeRect(OX+t.col*TS,OY+t.row*TS,TS-1,TS-1));
  }

  // ════════════════════════════════════════════
  // UI
  // ════════════════════════════════════════════
  // PAL3ウィンドウ描画ユーティリティ
  _pal3Win(g,x,y,w,h){
    // 塗り（暗紺）
    g.fillStyle(0x000020,1).fillRect(x,y,w,h);
    // 内枠（中緑）
    g.fillStyle(0x006000,1).fillRect(x+2,y,w-4,2).fillRect(x+2,y+h-2,w-4,2).fillRect(x,y+2,2,h-4).fillRect(x+w-2,y+2,2,h-4);
    // 外枠（暗緑・太め）
    g.fillStyle(0x004000,1).fillRect(x,y,w,2).fillRect(x,y+h-2,w,2).fillRect(x,y,2,h).fillRect(x+w-2,y,2,h);
    // 内側ハイライト（左上）
    g.fillStyle(0x008000,0.4).fillRect(x+4,y+4,w-8,1).fillRect(x+4,y+4,1,h-8);
  }

  _buildUI() {
    const W=this.scale.width,H=this.scale.height,TS=this.TS;
    const uiY=this.OY+this.mapData.tiles.length*TS+2;
    this._uiY=uiY;
    // PAL3ウィンドウ（上部パネル）
    this.uiGfx=this.add.graphics();
    this._pal3Win(this.uiGfx,0,uiY,W,H-uiY);

    this.turnTxt=this.add.text(8,uiY+8,'プレイヤーターン',{
      fontSize:'11px',color:'#E0E0E0',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
      stroke:'#000020',strokeThickness:2,
    });
    this.btnEndTurn=this._btn(W-90,uiY+6,84,20,'ターン終了',0x002000,0x006000,()=>this._endPlayerTurn());
    this.infoTxt=this.add.text(8,uiY+26,'',{
      fontSize:'10px',color:'#E0E0E0',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',lineSpacing:2,
      stroke:'#000020',strokeThickness:1,
    });
  }

  // PAL3スタイルのボタン
  _btn(x,y,w,h,label,bg,border,cb) {
    const g=this.add.graphics();
    const draw=(hover)=>{
      g.clear();
      this._pal3Win(g,x,y,w,h);
      if(hover){g.fillStyle(border,0.2).fillRect(x+2,y+2,w-4,h-4);}
    };
    draw(false);
    const t=this.add.text(x+w/2,y+h/2,label,{fontSize:'10px',color:'#E0E0E0',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',stroke:'#000020',strokeThickness:2}).setOrigin(0.5);
    const hit=this.add.rectangle(x,y,w,h).setOrigin(0).setInteractive();
    hit.on('pointerdown',cb);
    hit.on('pointerover',()=>draw(true));
    hit.on('pointerout', ()=>draw(false));
    return{g,t,hit};
  }

  // ════════════════════════════════════════════
  // 4択コマンドメニュー
  // ════════════════════════════════════════════
  _buildCmdMenu() {
    const W=this.scale.width,TS=this.TS;
    const mapBot=this.OY+this.mapData.tiles.length*TS+2;
    const MY=mapBot-80; this._menuY=MY;
    this._cmdMenu=[]; this._cmdMenuVisible=false;
    this._menuBg=this.add.graphics();
    const BW=Math.floor(W/2)-8,BH=32;
    [{key:'atk',  label:'攻 撃',x:4,    y:MY+4},
     {key:'magic',label:'魔 法',x:BW+10,y:MY+4},
     {key:'item', label:'道 具',x:4,    y:MY+40},
     {key:'wait', label:'待 機',x:BW+10,y:MY+40}]
    .forEach(d=>{
      const b=this._btn(d.x,d.y,BW,BH,d.label,0x000020,0x006000,()=>this._onCmd(d.key));
      b.g.setVisible(false);b.t.setVisible(false);b.hit.setVisible(false);b.hit.setActive(false);
      this._cmdMenu.push({key:d.key,...b});
    });
    this._cancelTxt=this.add.text(W/2,MY+76,'タップでキャンセル',{
      fontSize:'9px',color:'#808080',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setVisible(false);
  }

  _showCmdMenu(show) {
    this._cmdMenuVisible=show;
    const W=this.scale.width,MY=this._menuY;
    this._menuBg.clear();
    if (show) {
      this._pal3Win(this._menuBg,0,MY,W,82);
      // 区切り線
      this._menuBg.fillStyle(0x006000,1).fillRect(4,MY+38,W-8,2);
      this._menuBg.fillStyle(0x004000,1).fillRect(W/2-1,MY+6,2,26).fillRect(W/2-1,MY+42,2,26);
    }
    this._cmdMenu.forEach(b=>{b.g.setVisible(show);b.t.setVisible(show);b.hit.setVisible(show);b.hit.setActive(show);});
    this._cancelTxt.setVisible(show);
  }

  _onCmd(key) {
    if (!this.selected||this.phase!=='player') return;
    this._showCmdMenu(false);
    switch(key) {
      case 'atk':   this._enterAtkSelect(); break;
      case 'magic': this._doMagic(); break;
      case 'item':  this._doItem(); break;
      case 'wait':  this._doWait(); break;
    }
  }

  // ════════════════════════════════════════════
  // 入力
  // ════════════════════════════════════════════
  _setupInput() {
    this.input.on('pointerdown', (ptr) => {
      if (this.phase!=='player') return;

      // 攻撃ターゲット選択フェーズ
      if (this._phase2==='atk_target') {
        const TS=this.TS,OX=this.OX,OY=this.OY;
        const col=Math.floor((ptr.x-OX)/TS),row=Math.floor((ptr.y-OY)/TS);
        const u=this._unitAt(col,row);
        if (u && !u.isPlayer && u.alive && this._atkTargets && this._atkTargets.includes(u)) {
          this._clearAtkRange();
          this._confirmAtk(this.selected,u);
        }
        // 外れタップは無視（誤キャンセル防止）
        // UIエリア（マップ外）タップのみキャンセル
        else if (ptr.y > this.OY + this.mapData.tiles.length * this.TS) {
          this._clearAtkRange();
          this._showCmdMenu(true);
        }
        return;
      }

      // コマンドメニュー外タップでキャンセル
      if (this._cmdMenuVisible) {
        if (ptr.y<this._menuY||ptr.y>this._menuY+76) {
          this._showCmdMenu(false); this._cancelMove();
        }
        return;
      }

      const TS=this.TS,OX=this.OX,OY=this.OY;
      const tiles=this.mapData.tiles;
      const col=Math.floor((ptr.x-OX)/TS),row=Math.floor((ptr.y-OY)/TS);
      if (row<0||row>=tiles.length||col<0||col>=tiles[0].length) return;

      if (this.selected&&this.moveRange.some(c=>c.col===col&&c.row===row)) {
        this._moveTo(this.selected,col,row); return;
      }
      const u=this._unitAt(col,row);
      if (u&&u.isPlayer&&!u.acted&&u.alive) { this._selectUnit(u); this._updateInfo(u); }
      else this._deselect();
    });
  }

  _selectUnit(u) { this.selected=u; this.moveRange=this._bfs(u); this._drawMoveRange(); this._refreshSprite(u); }
  _deselect()    { this.selected=null; this.moveRange=[]; this._drawMoveRange(); this._updateInfo(null); this._units.filter(u=>u.alive).forEach(u=>this._refreshSprite(u)); }
  _cancelMove()  { if (this.selected) { this.moveRange=this._bfs(this.selected); this._drawMoveRange(); } }
  _clearAtkRange(){ this._phase2=null; this._atkTargets=null; if (this._atkGfx) this._atkGfx.clear(); }

  // ════════════════════════════════════════════
  // ウォークアニメーション
  // ════════════════════════════════════════════
  _animMove(u, toCol, toRow, cb) {
    const TS=this.TS,OX=this.OX,OY=this.OY;
    const dx=(u.col-toCol)*TS, dy=(u.row-toRow)*TS;
    u.col=toCol; u.row=toRow;
    u._walking=true;
    this._refreshSprite(u,1); // 新位置・歩行frame1で描画
    const s=u.sprite;
    if (!s) { u._walking=false; cb&&cb(); return; }

    // グラフィックを旧位置にシフトしてからトゥイーン
    s.g.x=dx; s.g.y=dy;
    s.hpG.x=dx; s.hpG.y=dy;

    const steps=Math.max(1,Math.round((Math.abs(dx)+Math.abs(dy))/TS));
    const stepDur=Math.max(90,110);
    const dur=steps*stepDur;

    // 歩行フレーム切り替え（150msごと）
    let frame=1;
    const walkFrames=[1,2,3,0];
    const walkTimer=this.time.addEvent({
      delay:150,repeat:Math.ceil(dur/150),
      callback:()=>{
        frame=(frame+1)%4;
        if(u.sprite){
          const px=OX+u.col*TS,py=OY+u.row*TS;
          this._drawUnitByClass(u.sprite.g,px,py,TS,u,walkFrames[frame]);
        }
      }
    });

    this.tweens.add({targets:[s.g,s.hpG],x:0,y:0,duration:dur,ease:'Linear',
      onComplete:()=>{
        walkTimer.remove();
        s.g.x=0;s.g.y=0;s.hpG.x=0;s.hpG.y=0;
        u._walking=false;
        this._refreshSprite(u,0); // アイドルフレームに戻す
        cb&&cb();
      }
    });
  }

  _moveTo(u, col, row) {
    this.moveRange=[];
    this._drawMoveRange();
    this._animMove(u, col, row, ()=>this.time.delayedCall(600,()=>this._showCmdMenu(true)));
  }

  // ════════════════════════════════════════════
  // コマンド処理
  // ════════════════════════════════════════════
  _enterAtkSelect() {
    const targets=this._adjacentEnemies(this.selected);
    if (!targets.length) { this._showMsg('攻撃できる敵がいません'); this._doWait(); return; }
    // 1体なら即攻撃（原作スタイル）
    if (targets.length===1) { this._confirmAtk(this.selected,targets[0]); return; }
    // 複数なら選択
    this._atkTargets=targets;
    this._phase2='atk_target';
    this._drawAtkRange(targets);
    this._showMsg('攻撃する敵を選んでください');
  }

  _doMagic() {
    const u=this.selected;
    if (!u||!u.magics.length) { this._showMsg('使える魔法がありません'); this._doWait(); return; }
    const enemies=this._units.filter(e=>e.alive&&!e.isPlayer);
    if (!enemies.length) { this._doWait(); return; }
    const target=enemies[0];
    const magic=u.magics[u.magics.length-1];
    const dmg=Math.max(1,(u.atk+8)-target.def/2+((Math.random()*4|0)-2));
    const element = magic.includes('ブレイズ')||magic.includes('炎')?'FIRE':
                    magic.includes('フリーズ')||magic.includes('氷')?'BLIZZARD':
                    magic.includes('ボルト')||magic.includes('雷')?'THUNDER':'NONE';

    u.acted=true;
    this.phase='cutin';
    this.scene.pause('Battle');
    this.scene.launch('BattleCutin',{
      atk:{...u}, def:{...target},
      atkDmg:dmg, defDmg:0, isCrit:false,
      isMagic:true, magicName:magic, element,
      onDone:()=>{
        this.phase='player';
        target.hp=Math.max(0,target.hp-dmg);
        this._drawAll();
        if (target.hp<=0) { this._killUnit(target); this._grantExp(u,target,true); }
        else this._grantExp(u,target,false);
        this._checkVictory();
        this.time.delayedCall(800,()=>{
          this._deselect();
          this._checkAllActed();
        });
      }
    });
  }

  _doItem() { this._showMsg('道具がありません'); this._doWait(); }

  _doWait() {
    if (!this.selected) return;
    this.selected.acted=true;
    const u=this.selected;
    this._deselect();
    this._refreshSprite(u);
    this._checkAllActed();
  }

  // ════════════════════════════════════════════
  // 攻撃 → カットイン
  // ════════════════════════════════════════════
  _confirmAtk(atk,def) {
    const result=this._calcCombat(atk,def);
    this.phase='cutin';
    this.scene.pause('Battle');
    this.scene.launch('BattleCutin',{
      atk:{...atk}, def:{...def},
      atkDmg:result.atkDmg, defDmg:result.defDmg, isCrit:result.isCrit,
      isMagic:false, element:'NONE',
      onDone:()=>this._applyResult(atk,def,result),
    });
  }

  _calcCombat(atk,def) {
    const terrain=TILE_PROPS[this.mapData.tiles[def.row][def.col]]||{};
    const defBonus=terrain.defBonus||0;
    const rand=(Math.random()*5|0)-2;
    const base=Math.max(0,atk.atk-def.def)+rand;
    const terrainRed=Math.floor(base*(defBonus/100));
    const base2=Math.max(0,base-terrainRed);
    const critChance=Math.min(50,Math.max(5,(atk.agi-def.agi)*0.5+5));
    const isCrit=((Math.random()*100)<critChance);
    const atkDmg=Math.max(1,isCrit?base2*2:base2);
    let defDmg=0;
    if (!def.isPlayer&&!def.acted) {
      defDmg=Math.max(0,def.atk-atk.def+((Math.random()*5|0)-2));
    }
    return{atkDmg,defDmg,isCrit};
  }

  _applyResult(atk,def,result) {
    this.phase='player';
    def.hp=Math.max(0,def.hp-result.atkDmg);
    atk.hp=Math.max(0,atk.hp-result.defDmg);
    atk.acted=true;
    this._drawAll();
    const defKilled=def.hp<=0;
    const atkKilled=atk.hp<=0;
    if (defKilled) { this._killUnit(def); if (atk.alive) this._grantExp(atk,def,true); }
    else { if (atk.alive) this._grantExp(atk,def,false); }
    if (atkKilled) this._killUnit(atk);
    this._checkVictory();
    this.time.delayedCall(800,()=>{
      this._deselect();
      this._checkAllActed();
    });
  }

  // ════════════════════════════════════════════
  // EXP・レベルアップ
  // ════════════════════════════════════════════
  _grantExp(unit,foe,isKill) {
    if (!unit.isPlayer||!unit.alive) return;
    const levelDiff=foe.level-unit.level;
    const scale=levelDiff>=5?1.5:levelDiff>=0?1.0:levelDiff>=-5?0.5:0.1;
    const base=isKill?10:4;
    const gain=Math.max(1,Math.round(base*scale));
    unit.exp=(unit.exp||0)+gain;

    const W=this.scale.width;
    const et=this.add.text(W-10,this._uiY+6,`+${gain} EXP`,{
      fontSize:'11px',color:'#ffdd44',stroke:'#000000',strokeThickness:2,
      fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(1,0);
    this.tweens.add({targets:et,alpha:0,y:'-=14',duration:1200,onComplete:()=>et.destroy()});

    if (unit.exp>=100) {
      unit.exp-=100;
      unit.level++;
      unit.maxHp+=3; unit.hp=unit.maxHp;
      unit.atk+=1; unit.def+=1; unit.agi+=1;
      this._showLevelUp(unit);
    }
  }

  _showLevelUp(u) {
    const W=this.scale.width,H=this.scale.height;
    const bg=this.add.graphics().fillStyle(0x001133,0.85).fillRect(0,H/2-50,W,100);
    bg.lineStyle(2,0xffdd44,0.8).strokeRect(4,H/2-46,W-8,92);
    const t1=this.add.text(W/2,H/2-28,'LEVEL UP！',{
      fontSize:'26px',color:'#ffdd44',stroke:'#000000',strokeThickness:4,
      fontFamily:'Georgia, serif',
    }).setOrigin(0.5);
    const t2=this.add.text(W/2,H/2+4,`${u.name}  →  Lv${u.level}`,{
      fontSize:'14px',color:'#aaddff',
      fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5);
    const t3=this.add.text(W/2,H/2+24,'HP・ATK・DEF・AGI +1',{
      fontSize:'11px',color:'#88cc88',
      fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5);
    [bg,t1,t2,t3].forEach(o=>this.tweens.add({targets:o,alpha:0,delay:2000,duration:700,onComplete:()=>o.destroy()}));
  }

  // ════════════════════════════════════════════
  // 敵AI
  // ════════════════════════════════════════════
  _endPlayerTurn() {
    if (this._cmdMenuVisible) this._showCmdMenu(false);
    this._clearAtkRange();
    this._deselect();
    this.phase='enemy';
    this._units.filter(u=>u.isPlayer).forEach(u=>u.acted=false);
    this._drawAll();
    this.turnTxt.setText('敵ターン');
    this.time.delayedCall(400,()=>this._enemyTurn());
  }

  _enemyTurn() {
    const enemies=this._units.filter(u=>!u.isPlayer&&!u.acted&&u.alive);
    if (!enemies.length) { this._startPlayerTurn(); return; }
    const e=enemies[0]; e.acted=true;
    const players=this._units.filter(u=>u.isPlayer&&u.alive);
    if (!players.length) { this._result(false); return; }
    // 最も弱いプレイヤーを優先（HP低い）
    const target=players.reduce((a,b)=>a.hp<b.hp?a:b);
    const adj=this._adjacentPlayers(e);
    if (adj.includes(target)) {
      const result=this._calcCombat(e,target);
      this.phase='cutin';
      this.scene.pause('Battle');
      this.scene.launch('BattleCutin',{
        atk:{...e},def:{...target},
        atkDmg:result.atkDmg,defDmg:result.defDmg,isCrit:result.isCrit,
        isMagic:false,element:'NONE',
        onDone:()=>{
          this.phase='enemy';
          target.hp=Math.max(0,target.hp-result.atkDmg);
          e.hp=Math.max(0,e.hp-result.defDmg);
          this._drawAll();
          if (target.hp<=0) this._killUnit(target);
          if (e.hp<=0) this._killUnit(e);
          this._checkVictory();
          this.time.delayedCall(1000,()=>this._enemyTurn());
        }
      });
    } else {
      const range=this._bfs(e);
      let best=null,bestDist=9999;
      range.forEach(cell=>{
        if (this._unitAt(cell.col,cell.row)) return;
        const d=Math.abs(cell.col-target.col)+Math.abs(cell.row-target.row);
        if (d<bestDist){bestDist=d;best=cell;}
      });
      if (best&&(best.col!==e.col||best.row!==e.row)) {
        this._animMove(e,best.col,best.row,()=>{
          this.time.delayedCall(800,()=>this._enemyTurn());
        });
      } else {
        this.time.delayedCall(800,()=>this._enemyTurn());
      }
    }
  }

  _startPlayerTurn() {
    this.phase='player';
    this._units.filter(u=>!u.isPlayer).forEach(u=>u.acted=false);
    this._drawAll();
    this.turnTxt.setText('プレイヤーターン');
    this._showStatus('プレイヤーターン');
  }

  // ════════════════════════════════════════════
  // ユーティリティ
  // ════════════════════════════════════════════
  _bfs(unit) {
    const mv=CHARACTER_CLASSES[unit.cls]?.move||4;
    const tiles=this.mapData.tiles;
    const visited=new Map();
    const queue=[{col:unit.col,row:unit.row,cost:0}];
    visited.set(`${unit.col},${unit.row}`,0);
    const result=[];
    while (queue.length) {
      const{col,row,cost}=queue.shift(); result.push({col,row});
      [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dc,dr])=>{
        const nc=col+dc,nr=row+dr;
        if (nr<0||nr>=tiles.length||nc<0||nc>=tiles[0].length) return;
        const tp=TILE_PROPS[tiles[nr][nc]];
        if (!tp||!tp.passable) return;
        const occ=this._unitAt(nc,nr);
        if (occ&&!occ.isPlayer) return;
        const nc2=cost+(tp.cost||1);
        if (nc2>mv) return;
        const key=`${nc},${nr}`;
        if (visited.has(key)&&visited.get(key)<=nc2) return;
        visited.set(key,nc2);
        queue.push({col:nc,row:nr,cost:nc2});
      });
    }
    return result;
  }

  _adjacentEnemies(u){return[[0,-1],[0,1],[-1,0],[1,0]].map(([dc,dr])=>this._unitAt(u.col+dc,u.row+dr)).filter(t=>t&&!t.isPlayer&&t.alive);}
  _adjacentPlayers(u){return[[0,-1],[0,1],[-1,0],[1,0]].map(([dc,dr])=>this._unitAt(u.col+dc,u.row+dr)).filter(t=>t&&t.isPlayer&&t.alive);}
  _unitAt(col,row){return this._units.find(u=>u.alive&&u.col===col&&u.row===row)||null;}

  _killUnit(u) {
    u.alive=false; u.acted=true;
    if (u.sprite){u.sprite.g.destroy();u.sprite.hpG.destroy();u.sprite.lbl.destroy();u.sprite=null;}
  }

  _checkAllActed() { if (this._units.filter(u=>u.isPlayer&&u.alive).every(u=>u.acted)) this._endPlayerTurn(); }

  _checkVictory() {
    if (!this._units.some(u=>!u.isPlayer&&u.alive)){this._result(true);return;}
    if (!this._units.some(u=> u.isPlayer&&u.alive)) this._result(false);
  }

  _result(won) {
    this.phase='end';
    const W=this.scale.width,H=this.scale.height;
    this.add.graphics().fillStyle(0x000000,0.75).fillRect(0,0,W,H);
    this.add.text(W/2,H/2-30,won?'勝 利！':'敗 北…',{
      fontSize:'40px',color:won?'#ffdd44':'#ff4444',stroke:'#000000',strokeThickness:6,
      fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5);
    if (won) this.add.text(W/2,H/2+24,'経験値を獲得！',{
      fontSize:'16px',color:'#ffffff',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5);
  }

  _updateInfo(u) {
    if (!u){this.infoTxt.setText('');return;}
    this.infoTxt.setText(`${u.name}  Lv${u.level}  ${u.clsName}\nHP ${u.hp}/${u.maxHp}   ATK ${u.atk}  DEF ${u.def}  AGI ${u.agi}`);
  }

  _showStatus(msg) {
    const W=this.scale.width;
    const t=this.add.text(W/2,20,msg,{fontSize:'14px',color:'#ffdd88',stroke:'#000000',strokeThickness:3,fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'}).setOrigin(0.5);
    this.tweens.add({targets:t,alpha:0,y:10,delay:1800,duration:600,onComplete:()=>t.destroy()});
  }

  _showMsg(msg) {
    const W=this.scale.width,H=this.scale.height;
    const t=this.add.text(W/2,H/2,msg,{fontSize:'13px',color:'#ffffff',stroke:'#000000',strokeThickness:3,fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'}).setOrigin(0.5);
    this.tweens.add({targets:t,alpha:0,delay:1200,duration:500,onComplete:()=>t.destroy()});
  }
}
