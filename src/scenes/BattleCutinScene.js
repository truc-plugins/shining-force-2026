// BattleCutinScene — 本家シャイニングフォース風バトルカットイン
// ダンジョン背景・青UI・視認できる被弾シェイク・ドット数字・ヒットスパーク
class BattleCutinScene extends Phaser.Scene {
  constructor() { super('BattleCutin'); }

  init(d) {
    this.atk      = d.atk;
    this.def      = d.def;
    this.atkDmg   = d.atkDmg;
    this.defDmg   = d.defDmg;
    this.isCrit   = d.isCrit;
    this.isMagic  = d.isMagic||false;
    this.magicName= d.magicName||'';
    this.element  = d.element||'NONE';
    this.onDone   = d.onDone;
  }

  create() {
    const W=480, H=720;
    this._buildBG(W,H);
    const atkCx=Math.floor(W*0.27), defCx=Math.floor(W*0.73), sprY=Math.floor(H*0.50);
    this.atkCx=atkCx; this.defCx=defCx; this.sprY=sprY;
    this.atkGfx=this.add.graphics().setDepth(10);
    this.defGfx=this.add.graphics().setDepth(10);
    this._drawLarge(this.atkGfx,atkCx,sprY,this.atk,false,0);
    this._drawLarge(this.defGfx,defCx,sprY,this.def,true,0);
    this.atkGfx.x=-240; this.defGfx.x=240;
    this._buildUI(W,H);
    this.fxGfx=this.add.graphics().setDepth(50);

    // ゆっくりフェードイン（黒から 1200ms）
    this.cameras.main.fadeIn(1200, 0, 0, 0);

    // フェード完了後にスライドイン
    this.time.delayedCall(1200, ()=>{
      this.tweens.add({targets:this.atkGfx,x:0,duration:220,ease:'Back.easeOut'});
      this.tweens.add({targets:this.defGfx,x:0,duration:220,ease:'Back.easeOut',
        onComplete:()=>this.time.delayedCall(180,()=>this.isMagic?this._doMagicAnim():this._doPhysAnim())
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // ダンジョン戦闘背景（石神殿風）
  // ════════════════════════════════════════════════════════════
  _buildBG(W,H){
    const g=this.add.graphics().setDepth(0);
    const msgH=80;
    const statH=60;
    const bgY=statH;
    const bgH=H-msgH-statH;

    // ─── 天井 ───────────────────────────────────────
    const CEIL=bgY+Math.floor(bgH*0.12);
    g.fillStyle(0x0E0A06,1).fillRect(0,bgY,W,CEIL-bgY);
    // 天井ディザ
    g.fillStyle(0x1A1208,1);
    for(let x=0;x<W;x+=4) for(let y=bgY;y<CEIL;y+=4) if((x+y)%8===0) g.fillRect(x,y,2,2);

    // ─── 奥壁（黄土石材） ────────────────────────────
    const WALLB=bgY+Math.floor(bgH*0.60);
    // 石材ベース
    g.fillStyle(0x7A5A30,1).fillRect(0,CEIL,W,WALLB-CEIL);
    // 石材ディザリング（明暗）
    g.fillStyle(0x9A7244,1);
    for(let x=0;x<W;x+=6) for(let y=CEIL;y<WALLB;y+=6) if((x/6+y/6)%2===0) g.fillRect(x,y,3,3);
    g.fillStyle(0x5A4020,1);
    for(let x=3;x<W;x+=6) for(let y=CEIL+3;y<WALLB;y+=6) if((x/6+y/6)%2===0) g.fillRect(x,y,2,2);

    // 石材ブロック目地（横線）
    g.fillStyle(0x3A2810,1);
    for(let y=CEIL+16;y<WALLB;y+=16) g.fillRect(0,y,W,1);
    // 縦目地（市松）
    for(let row=0;row<6;row++){
      const yy=CEIL+row*16;
      const off=row%2===0?0:32;
      for(let x=off;x<W;x+=64) g.fillRect(x,yy,1,16);
    }

    // 壁ハイライト（上縁）
    g.fillStyle(0xB8904A,1).fillRect(0,CEIL,W,2);
    g.fillStyle(0x6A4828,1).fillRect(0,CEIL+2,W,1);

    // ─── 壁上部アーチ装飾 ─────────────────────────────
    // 左右に半円アーチ
    const archW=70, archH=32;
    const archY=CEIL+4;
    // 左アーチ
    g.fillStyle(0x5A4020,1).fillRect(16,archY,archW,archH);
    g.fillStyle(0x2A1A08,1).fillRect(20,archY+4,archW-8,archH-8);
    g.fillStyle(0xB8904A,1).fillRect(16,archY,archW,2).fillRect(16,archY,2,archH).fillRect(16+archW-2,archY,2,archH);
    // 右アーチ
    g.fillStyle(0x5A4020,1).fillRect(W-16-archW,archY,archW,archH);
    g.fillStyle(0x2A1A08,1).fillRect(W-16-archW+4,archY+4,archW-8,archH-8);
    g.fillStyle(0xB8904A,1).fillRect(W-16-archW,archY,archW,2).fillRect(W-16-archW,archY,2,archH).fillRect(W-18,archY,2,archH);

    // ─── 柱（左右2本ずつ） ─────────────────────────────
    const colW=24, colTop=CEIL-4, colBot=WALLB+20;
    // 柱の色セット
    const PILLAR_COLS=[
      {x:28, side:'L'},{x:90, side:'L'},
      {x:W-28-colW, side:'R'},{x:W-90-colW, side:'R'}
    ];
    for(const {x,side} of PILLAR_COLS){
      // 柱本体
      g.fillStyle(0x8A6A38,1).fillRect(x,colTop,colW,colBot-colTop);
      // 左面影
      g.fillStyle(0x5A4020,1).fillRect(x,colTop,4,colBot-colTop);
      // 右面影
      g.fillStyle(0x5A4020,1).fillRect(x+colW-4,colTop,4,colBot-colTop);
      // ハイライト
      g.fillStyle(0xC09050,1).fillRect(x+2,colTop,2,colBot-colTop);
      // ディザ
      g.fillStyle(0xA07840,1);
      for(let y=colTop;y<colBot;y+=4) if(y%8===0) g.fillRect(x+6,y,colW-10,2);
      // 柱頭部（コーニス）
      g.fillStyle(0xC09050,1).fillRect(x-4,colTop,colW+8,6);
      g.fillStyle(0x6A4828,1).fillRect(x-4,colTop+6,colW+8,2);
      // 柱底部（ベース）
      g.fillStyle(0xC09050,1).fillRect(x-4,colBot-8,colW+8,8);
      g.fillStyle(0x6A4828,1).fillRect(x-4,colBot-10,colW+8,2);
    }

    // ─── 石像（左右）─────────────────────────────────
    // 左の像（守護者）
    this._drawStatueLeft(g, 62, WALLB-10);
    // 右の像（守護者・反転）
    this._drawStatueRight(g, W-62, WALLB-10);

    // ─── 松明（壁に取り付け） ────────────────────────
    this._drawTorch(g, 120, CEIL+36);
    this._drawTorch(g, W-120, CEIL+36);

    // ─── 壁下部（腰壁） ─────────────────────────────
    g.fillStyle(0x6A4828,1).fillRect(0,WALLB,W,8);
    g.fillStyle(0x4A3018,1).fillRect(0,WALLB+8,W,4);
    g.fillStyle(0x9A7244,1).fillRect(0,WALLB,W,2);

    // ─── 床（斜めパース風石タイル） ──────────────────
    const FLOORB=H-msgH;
    // 床ベース
    g.fillStyle(0x383838,1).fillRect(0,WALLB+12,W,FLOORB-WALLB-12);

    // 石タイルのパース（奥に向かって細くなる）
    const tileRows=8;
    for(let r=0;r<tileRows;r++){
      const ratio=r/tileRows;
      const yy=WALLB+12+Math.floor((FLOORB-WALLB-12)*ratio);
      const yn=WALLB+12+Math.floor((FLOORB-WALLB-12)*(r+1)/tileRows);
      // タイル目地
      const tileW=Math.floor(24+ratio*40);
      const baseX=Math.floor((W/2)%(tileW)-(r%2===0?0:tileW/2));
      g.fillStyle(0x282828,1);
      for(let x=baseX;x<W;x+=tileW) g.fillRect(x,yy,1,yn-yy);
      g.fillRect(0,yy,W,1);
      // タイル内ディザ
      const tileCol=r%2===0?0x404040:0x3A3A3A;
      g.fillStyle(tileCol,1).fillRect(0,yy+1,W,yn-yy-1);
      // ハイライト（タイル手前縁）
      if(r>0){ g.fillStyle(0x505050,1).fillRect(0,yy+1,W,1); }
    }
    // 床中央反射（光沢）
    g.fillStyle(0x484848,1);
    for(let x=W*0.3;x<W*0.7;x+=8){
      const h=Math.floor(2+Math.sin((x-W*0.3)*0.05)*2);
      g.fillRect(x,WALLB+14,h,FLOORB-WALLB-16);
    }

    // ─── メッセージウィンドウ（下部） ──────────────
    this._buildMsgWindow(g,W,H,msgH);

    // ─── 魔法元素オーバーレイ ────────────────────────
    if(this.isMagic&&this.element!=='NONE'){
      const ec=this.element==='FIRE'?0x300800:this.element==='BLIZZARD'?0x001030:0x202000;
      g.fillStyle(ec,0.20).fillRect(0,bgY,W,bgH);
    }
  }

  // 左の石像
  _drawStatueLeft(g,cx,by){
    const S=0x6A4828,L=0x9A7244,D=0x3A2010,H2=0xB8904A;
    // 台座
    g.fillStyle(D,1).fillRect(cx-18,by-6,36,6);
    g.fillStyle(L,1).fillRect(cx-16,by-8,32,4);
    // 体
    g.fillStyle(S,1).fillRect(cx-10,by-42,20,36);
    g.fillStyle(L,1).fillRect(cx-8,by-40,6,14);
    g.fillStyle(D,1).fillRect(cx+4,by-28,4,16);
    // 腕（槍持ち）
    g.fillStyle(S,1).fillRect(cx-14,by-36,8,20).fillRect(cx+6,by-36,8,20);
    // 槍
    g.fillStyle(D,1).fillRect(cx+2,by-62,4,30);
    g.fillStyle(H2,1).fillTriangle(cx+2,by-64,cx+6,by-64,cx+4,by-72);
    // 頭（兜）
    g.fillStyle(S,1).fillRect(cx-7,by-54,14,13);
    g.fillStyle(L,1).fillRect(cx-5,by-53,5,3);
    // 目（くぼみ）
    g.fillStyle(0x1A0E06,1).fillRect(cx-3,by-49,3,2).fillRect(cx+1,by-49,3,2);
    // ディザ
    g.fillStyle(D,0.5);
    for(let y=by-42;y<by-6;y+=4) for(let x=cx+4;x<cx+10;x+=4) if((x+y)%8===0) g.fillRect(x,y,2,2);
  }

  // 右の石像（反転）
  _drawStatueRight(g,cx,by){
    const S=0x6A4828,L=0x9A7244,D=0x3A2010,H2=0xB8904A;
    g.fillStyle(D,1).fillRect(cx-18,by-6,36,6);
    g.fillStyle(L,1).fillRect(cx-16,by-8,32,4);
    g.fillStyle(S,1).fillRect(cx-10,by-42,20,36);
    g.fillStyle(L,1).fillRect(cx+2,by-40,6,14);
    g.fillStyle(D,1).fillRect(cx-8,by-28,4,16);
    g.fillStyle(S,1).fillRect(cx-14,by-36,8,20).fillRect(cx+6,by-36,8,20);
    g.fillStyle(D,1).fillRect(cx-6,by-62,4,30);
    g.fillStyle(H2,1).fillTriangle(cx-2,by-64,cx-6,by-64,cx-4,by-72);
    g.fillStyle(S,1).fillRect(cx-7,by-54,14,13);
    g.fillStyle(L,1).fillRect(cx,by-53,5,3);
    g.fillStyle(0x1A0E06,1).fillRect(cx-4,by-49,3,2).fillRect(cx+1,by-49,3,2);
    g.fillStyle(D,0.5);
    for(let y=by-42;y<by-6;y+=4) for(let x=cx-10;x<cx-4;x+=4) if((x+y)%8===0) g.fillRect(x,y,2,2);
  }

  // 松明
  _drawTorch(g,cx,cy){
    g.fillStyle(0x604820,1).fillRect(cx-2,cy,4,12);
    g.fillStyle(0x8A6430,1).fillRect(cx-4,cy-2,8,4);
    // 炎
    g.fillStyle(0xFF6600,0.9).fillRect(cx-3,cy-10,6,8);
    g.fillStyle(0xFF9900,0.7).fillRect(cx-2,cy-13,4,6);
    g.fillStyle(0xFFCC00,0.5).fillRect(cx-1,cy-15,2,5);
    g.fillStyle(0xFFFF80,0.3).fillRect(cx,cy-16,1,4);
    // 光の輪（ディザ）
    g.fillStyle(0x604800,0.2).fillCircle(cx,cy-8,16);
  }

  // メッセージウィンドウ（下部・青枠）
  _buildMsgWindow(g,W,H,msgH){
    const y=H-msgH;
    // 背景（濃紺）
    g.fillStyle(0x000030,1).fillRect(0,y,W,msgH);
    // 外枠（濃青）
    g.fillStyle(0x0040A0,1).fillRect(0,y,W,2).fillRect(0,H-2,W,2).fillRect(0,y,2,msgH).fillRect(W-2,y,2,msgH);
    // 内枠（明青）
    g.fillStyle(0x0060D0,1).fillRect(2,y+2,W-4,2).fillRect(2,H-4,W-4,2).fillRect(2,y+2,2,msgH-4).fillRect(W-4,y+2,2,msgH-4);
    // ハイライト
    g.fillStyle(0x40A0FF,0.3).fillRect(4,y+4,W-8,1).fillRect(4,y+4,1,msgH-8);
  }

  // ════════════════════════════════════════════════════════════
  // ステータスパネル（青枠・本家準拠）
  // ════════════════════════════════════════════════════════════
  _buildUI(W,H){
    const g=this.add.graphics().setDepth(20);
    const pY=0, pH=60, PW=(W/2)-14;
    const a=this.atk, d=this.def;

    // 左パネル（攻撃側）
    g.fillStyle(0x000030,1).fillRect(0,pY,W/2-2,pH);
    g.fillStyle(0x0040A0,1).fillRect(0,pY,W/2-2,2).fillRect(0,pY+pH-2,W/2-2,2).fillRect(0,pY,2,pH).fillRect(W/2-4,pY,2,pH);
    g.fillStyle(0x0060D0,1).fillRect(2,pY+2,W/2-6,2).fillRect(2,pY+pH-4,W/2-6,2).fillRect(2,pY+2,2,pH-4).fillRect(W/2-6,pY+2,2,pH-4);
    g.fillStyle(0x40A0FF,0.3).fillRect(4,pY+4,W/2-10,1).fillRect(4,pY+4,1,pH-8);

    // 右パネル（防御側）
    g.fillStyle(0x000030,1).fillRect(W/2+2,pY,W/2-2,pH);
    g.fillStyle(0x0040A0,1).fillRect(W/2+2,pY,W/2-2,2).fillRect(W/2+2,pY+pH-2,W/2-2,2).fillRect(W/2+2,pY,2,pH).fillRect(W-2,pY,2,pH);
    g.fillStyle(0x0060D0,1).fillRect(W/2+4,pY+2,W/2-6,2).fillRect(W/2+4,pY+pH-4,W/2-6,2).fillRect(W/2+4,pY+2,2,pH-4).fillRect(W-4,pY+2,2,pH-4);
    g.fillStyle(0x40A0FF,0.3).fillRect(W/2+6,pY+4,W/2-10,1).fillRect(W/2+6,pY+4,1,pH-8);

    // VS
    this.add.text(W/2,pY+pH/2,'VS',{fontSize:'14px',color:'#FFE040',fontFamily:'Georgia,serif',stroke:'#000030',strokeThickness:4}).setOrigin(0.5).setDepth(21);

    // 名前・レベル
    this.add.text(6,pY+5,a.name,{fontSize:'12px',color:'#FFFFFF',fontFamily:'Hiragino Kaku Gothic ProN,sans-serif',stroke:'#000030',strokeThickness:2}).setDepth(21);
    this.add.text(6,pY+19,`Lv${a.level} ${a.clsName||''}`,{fontSize:'9px',color:'#8080C0',fontFamily:'Hiragino Kaku Gothic ProN,sans-serif'}).setDepth(21);
    this.add.text(W/2+6,pY+5,d.name,{fontSize:'12px',color:'#FFFFFF',fontFamily:'Hiragino Kaku Gothic ProN,sans-serif',stroke:'#000030',strokeThickness:2}).setDepth(21);
    this.add.text(W/2+6,pY+19,`Lv${d.level} ${d.clsName||''}`,{fontSize:'9px',color:'#8080C0',fontFamily:'Hiragino Kaku Gothic ProN,sans-serif'}).setDepth(21);

    // HPバー＋数値
    const aR=a.hp/a.maxHp, dR=d.hp/d.maxHp;
    this._drawHpBar(g,6,pY+32,PW,a.hp,a.maxHp,aR>0.5?0x00E060:aR>0.25?0xE0E000:0xE02000);
    this._drawHpBar(g,W/2+6,pY+32,PW,d.hp,d.maxHp,dR>0.5?0x00E060:dR>0.25?0xE0E000:0xE02000);
    this.atkHpTxt=this.add.text(6,pY+44,`HP ${a.hp}/${a.maxHp}`,{fontSize:'10px',color:'#FFE040',fontFamily:'Hiragino Kaku Gothic ProN,sans-serif'}).setDepth(21);
    this.defHpTxt=this.add.text(W/2+6,pY+44,`HP ${d.hp}/${d.maxHp}`,{fontSize:'10px',color:'#FFE040',fontFamily:'Hiragino Kaku Gothic ProN,sans-serif'}).setDepth(21);
    this.hpBarGfx=this.add.graphics().setDepth(20);

    // メッセージテキスト
    const msgY=H-76;
    this.logTxt=this.add.text(W/2,msgY+28,'',{
      fontSize:'14px',color:'#FFFFFF',fontFamily:'Hiragino Kaku Gothic ProN,sans-serif',
      stroke:'#000030',strokeThickness:3, align:'center', wordWrap:{width:W-20}
    }).setOrigin(0.5).setDepth(21);
  }

  _drawHpBar(g,x,y,w,hp,max,col){
    const f=Math.max(0,Math.round(w*hp/max));
    // 枠
    g.fillStyle(0x000030,1).fillRect(x,y,w,7);
    g.fillStyle(0x0040A0,1).strokeRect(x,y,w,7);
    // 塗り
    if(f>0){
      g.fillStyle(col,1).fillRect(x,y,f,7);
      // ハイライト（上1px）
      g.fillStyle(0xFFFFFF,0.35).fillRect(x,y,f,2);
      // 影（下1px）
      g.fillStyle(0x000000,0.3).fillRect(x,y+5,f,2);
    }
  }

  _updateHpBars(aHp,dHp){
    const g=this.hpBarGfx, W=480, PW=(W/2)-14;
    g.clear();
    const a=this.atk, d=this.def;
    const aR=aHp/a.maxHp, dR=dHp/d.maxHp;
    this._drawHpBar(g,6,32,PW,aHp,a.maxHp,aR>0.5?0x00E060:aR>0.25?0xE0E000:0xE02000);
    this._drawHpBar(g,W/2+6,32,PW,dHp,d.maxHp,dR>0.5?0x00E060:dR>0.25?0xE0E000:0xE02000);
    this.atkHpTxt.setText(`HP ${aHp}/${a.maxHp}`);
    this.defHpTxt.setText(`HP ${dHp}/${d.maxHp}`);
  }

  // ════════════════════════════════════════════════════════════
  // 物理攻撃アニメ
  // ════════════════════════════════════════════════════════════
  _doPhysAnim(){
    const isPlayer=this.atk.isPlayer;
    this.logTxt.setText(`${this.atk.name} の攻撃！`);

    // frame1 READY（構え）
    this.atkGfx.clear(); this._drawLarge(this.atkGfx,this.atkCx,this.sprY,this.atk,false,1);
    this.tweens.add({targets:this.atkGfx,x:isPlayer?8:-8,duration:80,ease:'Linear',
      onComplete:()=>{
        // frame2 SWING（振り抜き: 踏み込み）
        this.atkGfx.clear(); this._drawLarge(this.atkGfx,this.atkCx,this.sprY,this.atk,false,2);
        this.tweens.add({targets:this.atkGfx,x:isPlayer?-28:28,duration:100,ease:'Linear',
          onComplete:()=>{
            // 1フレーム白フラッシュ
            this._flashScreen(0xFFFFFF,0.9,25,()=>{
              // ヒットスパーク
              const hitX=isPlayer?this.defCx:this.atkCx;
              this._hitSpark(hitX,this.sprY-20);
              // 敵シェイク
              this._shakeSprite(isPlayer?this.defGfx:this.atkGfx,()=>{});
              // ダメージ数字
              this._showDmgNum(this.atkDmg,hitX,this.sprY-50,this.isCrit,this.isMagic?'magic':'phys');
              this._updateHpBars(this.atk.hp,Math.max(0,this.def.hp-this.atkDmg));
              this.cameras.main.shake(180,0.007);
              this.logTxt.setText(this.isCrit?`クリティカル！ ${this.atkDmg} ダメージ！`:`${this.atkDmg} ダメージ！`);
              // frame3 RETURN（戻り）
              this.atkGfx.clear(); this._drawLarge(this.atkGfx,this.atkCx,this.sprY,this.atk,false,3);
              this.time.delayedCall(1000,()=>{
                this.tweens.add({targets:this.atkGfx,x:0,duration:120,ease:'Linear',
                  onComplete:()=>{
                    this.atkGfx.clear(); this._drawLarge(this.atkGfx,this.atkCx,this.sprY,this.atk,false,0);
                    this._doCounter();
                  }
                });
              });
            });
          }
        });
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 魔法アニメ
  // ════════════════════════════════════════════════════════════
  _doMagicAnim(){
    const W=480, H=720;
    this.logTxt.setText(`${this.atk.name} の ${this.magicName}！`);
    this._castEffect(()=>{
      this._elementEffect(W,H,()=>{
        const isPlayer=this.atk.isPlayer;
        const hitX=!isPlayer?this.atkCx:this.defCx;
        this._flashScreen(0xFFFFFF,0.7,25,()=>{
          this._hitSpark(hitX,this.sprY-20);
          this._shakeSprite(isPlayer?this.defGfx:this.atkGfx,()=>{});
          this._showDmgNum(this.atkDmg,hitX,this.sprY-50,false,'magic');
          this._updateHpBars(this.atk.hp,Math.max(0,this.def.hp-this.atkDmg));
          this.logTxt.setText(`${this.atkDmg} ダメージ！`);
          this.cameras.main.shake(140,0.005);
          this.time.delayedCall(1000,()=>this._finishScene());
        });
      });
    });
  }

  _castEffect(cb){
    const cx=this.atk.isPlayer?this.atkCx:this.defCx, cy=this.sprY-20;
    const ec=this._elemColor(); let frame=0;
    this.time.addEvent({delay:40,repeat:7,callback:()=>{
      this.fxGfx.clear(); frame++;
      const r=16+frame*10;
      this.fxGfx.lineStyle(3,ec,1-frame/9).strokeCircle(cx,cy,r);
      this.fxGfx.lineStyle(2,0xFFFFFF,0.4).strokeCircle(cx,cy,r-7);
      if(frame>=7){this.fxGfx.clear();cb();}
    }});
  }

  _elementEffect(W,H,cb){
    switch(this.element){
      case 'FIRE':     this._fireFX(W,H,cb); break;
      case 'BLIZZARD': this._blizzardFX(W,H,cb); break;
      case 'THUNDER':  this._thunderFX(W,H,cb); break;
      default:         this._genericFX(W,H,cb);
    }
  }

  _fireFX(W,H,cb){
    const cx=this.atk.isPlayer?this.defCx:this.atkCx, cy=this.sprY-20;
    let f=0;
    const cols=[0xFF2200,0xFF5500,0xFF8800,0xFFAA00,0xFFE040,0xFFFFCC];
    this.time.addEvent({delay:42,repeat:12,callback:()=>{
      this.fxGfx.clear(); f++;
      cols.forEach((c,i)=>{const r=f*9-i*11;if(r>0){const a=Math.max(0,1-f/14-i*0.07);this.fxGfx.fillStyle(c,a).fillCircle(cx,cy,r);}});
      for(let p=0;p<6;p++){const ang=(f*40+p*60)*Math.PI/180,pr=f*11;this.fxGfx.fillStyle(0xFF6600,Math.max(0,0.8-f/14)).fillCircle(cx+Math.cos(ang)*pr,cy+Math.sin(ang)*pr-f*3,5-p*0.5);}
      if(f>=12){this.fxGfx.clear();cb();}
    }});
  }

  _blizzardFX(W,H,cb){
    const cx=this.atk.isPlayer?this.defCx:this.atkCx, cy=this.sprY-20;
    let f=0;
    this.time.addEvent({delay:48,repeat:10,callback:()=>{
      this.fxGfx.clear(); f++;
      this.fxGfx.fillStyle(0x40A0E0,Math.max(0,0.8-f/12)).fillCircle(cx,cy,f*8);
      this.fxGfx.fillStyle(0xC0E0FF,Math.max(0,0.6-f/12)).fillCircle(cx,cy,f*4);
      for(let a=0;a<8;a++){const ang=a*45*Math.PI/180,len=f*15,ex=cx+Math.cos(ang)*len,ey=cy+Math.sin(ang)*len;this.fxGfx.lineStyle(2,0x40A0E0,Math.max(0,0.9-f/12)).lineBetween(cx,cy,ex,ey);this.fxGfx.fillStyle(0xE0E0FF,Math.max(0,0.8-f/12)).fillRect(ex-3,ey-3,6,6);}
      if(f>=10){this.fxGfx.clear();cb();}
    }});
  }

  _thunderFX(W,H,cb){
    const cx=this.atk.isPlayer?this.defCx:this.atkCx, cy=this.sprY-20;
    let f=0;
    this.time.addEvent({delay:50,repeat:9,callback:()=>{
      this.fxGfx.clear(); f++;
      if(f%2===0)return;
      const sY=90,steps=12,segH=(cy-sY)/steps;
      [4,7].forEach(lw=>{
        this.fxGfx.lineStyle(lw,lw===4?0xFFFF44:0xFFFFFF,lw===4?0.9:0.4);
        this.fxGfx.beginPath(); this.fxGfx.moveTo(cx,sY);
        for(let s=1;s<=steps;s++) this.fxGfx.lineTo(cx+((s%2===0)?-1:1)*(Math.random()*24+8),sY+segH*s);
        this.fxGfx.strokePath();
      });
      this.fxGfx.fillStyle(0xFFFF88,0.6).fillCircle(cx,cy,f*6);
      if(f>=9){this.fxGfx.clear();cb();}
    }});
  }

  _genericFX(W,H,cb){
    const cx=this.atk.isPlayer?this.defCx:this.atkCx, cy=this.sprY-20;
    let f=0;
    this.time.addEvent({delay:48,repeat:8,callback:()=>{
      this.fxGfx.clear(); f++;
      this.fxGfx.fillStyle(0xFFFFFF,Math.max(0,0.8-f/9)).fillCircle(cx,cy,f*13);
      this.fxGfx.fillStyle(0x40A0FF,Math.max(0,0.6-f/9)).fillCircle(cx,cy,f*8);
      if(f>=8){this.fxGfx.clear();cb();}
    }});
  }

  _elemColor(){
    return this.element==='FIRE'?0xFF6600:this.element==='BLIZZARD'?0x40A0E0:this.element==='THUNDER'?0xFFE040:0x40A0FF;
  }

  // ════════════════════════════════════════════════════════════
  // 反撃アニメ
  // ════════════════════════════════════════════════════════════
  _doCounter(){
    if(this.defDmg<=0||this.def.hp<=this.atkDmg){this._finishScene();return;}
    const isPlayer=this.atk.isPlayer;
    this.time.delayedCall(160,()=>{
      this.logTxt.setText(`${this.def.name} の反撃！`);
      this.defGfx.clear(); this._drawLarge(this.defGfx,this.defCx,this.sprY,this.def,true,2);
      this.tweens.add({targets:this.defGfx,x:isPlayer?24:-24,duration:100,ease:'Linear',
        onComplete:()=>{
          this._flashScreen(0xFF8000,0.7,25,()=>{
            const hitX=isPlayer?this.atkCx:this.defCx;
            this._hitSpark(hitX,this.sprY-20);
            this._shakeSprite(isPlayer?this.atkGfx:this.defGfx,()=>{});
            this._showDmgNum(this.defDmg,hitX,this.sprY-50,false,'phys');
            this._updateHpBars(Math.max(0,this.atk.hp-this.defDmg),Math.max(0,this.def.hp-this.atkDmg));
            this.logTxt.setText(`${this.defDmg} ダメージ！`);
            this.cameras.main.shake(120,0.005);
            this.time.delayedCall(1000,()=>{
              this.defGfx.clear(); this._drawLarge(this.defGfx,this.defCx,this.sprY,this.def,true,0);
              this.tweens.add({targets:this.defGfx,x:0,duration:120,ease:'Linear',onComplete:()=>this._finishScene()});
            });
          });
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // エフェクト
  // ════════════════════════════════════════════════════════════

  // ヒットスパーク（白＋水色の飛沫）
  _hitSpark(cx,cy){
    const spark=this.add.graphics().setDepth(60);
    let f=0;
    const COLS=[0xFFFFFF,0x80FFFF,0x40C0FF,0x0080C0];
    const timer=this.time.addEvent({delay:35,repeat:6,callback:()=>{
      spark.clear(); f++;
      // 中心閃光
      spark.fillStyle(COLS[0],Math.max(0,1-f/6)).fillRect(cx-f*6,cy-2,f*12,4);
      spark.fillStyle(COLS[0],Math.max(0,1-f/6)).fillRect(cx-2,cy-f*6,4,f*12);
      // 飛沫粒子
      for(let p=0;p<8;p++){
        const ang=(p*45+f*22)*Math.PI/180;
        const dist=f*12;
        const px=cx+Math.cos(ang)*dist, py=cy+Math.sin(ang)*dist;
        const col=COLS[Math.min(p%4,3)];
        spark.fillStyle(col,Math.max(0,0.9-f/7)).fillRect(px-2,py-2,4,4);
      }
      // 副飛沫
      for(let p=0;p<4;p++){
        const ang=(p*90+f*15+22)*Math.PI/180;
        const dist=f*8;
        spark.fillStyle(COLS[1],Math.max(0,0.7-f/7)).fillRect(cx+Math.cos(ang)*dist-1,cy+Math.sin(ang)*dist-1,2,2);
      }
      if(f>=6){timer.remove();spark.destroy();}
    }});
  }

  // 敵シェイク（視認できるレベル 8px横揺れ）
  _shakeSprite(gfx,cb){
    const origX=gfx.x;
    const shakeSeq=[8,-10,10,-8,6,-4,0];
    let i=0;
    const timer=this.time.addEvent({delay:40,repeat:shakeSeq.length-1,callback:()=>{
      gfx.x=origX+shakeSeq[i];
      i++;
      if(i>=shakeSeq.length){timer.remove();gfx.x=origX;cb&&cb();}
    }});
  }

  _flashScreen(color,alpha,dur,cb){
    const fl=this.add.graphics().fillStyle(color,alpha).fillRect(0,0,480,720).setDepth(100);
    this.tweens.add({targets:fl,alpha:0,duration:dur,onComplete:()=>{fl.destroy();cb&&cb();}});
  }

  // ダメージ数字（上浮きしながらフェード）
  _showDmgNum(dmg,cx,cy,isCrit,type){
    let col,size,prefix='';
    if(isCrit){ col='#FF8800'; size='38px'; prefix='★'; }
    else if(type==='magic'){ col='#40C0FF'; size='30px'; }
    else { col='#FFFFFF'; size='28px'; }
    const txt=`${prefix}${dmg}`;
    const t=this.add.text(cx,cy,txt,{
      fontSize:size, color:col, stroke:'#000030', strokeThickness:6,
      fontFamily:'Georgia,serif', shadow:{offsetX:2,offsetY:2,color:'#000030',blur:0,fill:true}
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({targets:t,y:cy-56,alpha:0,duration:1100,delay:100,ease:'Quad.easeOut',onComplete:()=>t.destroy()});
  }

  // ════════════════════════════════════════════════════════════
  // シーン終了（空白1800ms → フェードアウト1000ms）
  // ════════════════════════════════════════════════════════════
  _finishScene(){
    this.time.delayedCall(1800,()=>{
      this.cameras.main.fade(1000,0,0,0,false,(cam,prog)=>{
        if(prog>=1){
          this.onDone&&this.onDone();
          this.scene.resume('Battle');
          this.scene.stop('BattleCutin');
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 大型スプライト（横顔サイドビュー 32×48相当）
  // ════════════════════════════════════════════════════════════
  _drawLarge(g,cx,cy,unit,mirrored,af){
    g.clear();
    const col=unit.color||0x0060C0;
    const isE=!unit.isPlayer;
    const m=mirrored?-1:1;
    const cls=unit.cls||'WARRIOR';
    const wOff=af===0?0:af===1?m*(-10):af===2?m*14:m*(-5);
    const bOff=af===2?m*4:0;
    switch(cls){
      case 'HERO':    this._lgHero(g,cx,cy,col,isE,m,unit.isBoss,wOff,bOff); break;
      case 'WARRIOR': this._lgWarrior(g,cx,cy,col,isE,m,unit.isBoss,wOff,bOff); break;
      case 'KNIGHT':  this._lgKnight(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'MAGE':
      case 'WIZARD':  this._lgMage(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'HEALER':  this._lgHealer(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'ARCHER':  this._lgArcher(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'BIRDMAN': this._lgBirdman(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'CENTAUR': this._lgCentaur(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'MONK':    this._lgMonk(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'ROGUE':   this._lgRogue(g,cx,cy,col,isE,m,wOff,bOff); break;
      case 'BARON':   this._lgBaron(g,cx,cy,col,isE,m,unit.isBoss,wOff,bOff); break;
      default:        this._lgWarrior(g,cx,cy,col,isE,m,false,wOff,bOff);
    }
    this.add.text(cx,cy+52,unit.name,{fontSize:'11px',color:'#FFE040',stroke:'#000030',strokeThickness:3,fontFamily:'Hiragino Kaku Gothic ProN,sans-serif'}).setOrigin(0.5,0).setDepth(11);
  }

  // ────── スプライト共通ヘルパー ──────────────────────────
  _lgHero(g,cx,cy,col,isE,m,boss,wOff,bOff){
    const sk=0xE08060,skd=0xA04020,sks=0x602000,ol=0x200000;
    const ad=0x004080,am=0x0060C0,al=0x40A0FF;
    const wd=0x604000,wm=0xA08000,wl=0xFFE040;
    const B=cy+38,bx=bOff;
    // 影
    g.fillStyle(0x000000,0.2).fillEllipse(cx,B+4,36,8);
    // ブーツ
    g.fillStyle(0x202020,1).fillRect(cx-6+bx,B-4,8,5).fillRect(cx+m*3+bx,B-4,7,5);
    g.fillStyle(0x404040,1).fillRect(cx-6+bx,B-4,2,5).fillRect(cx+m*3+bx,B-4,2,5);
    // 足
    g.fillStyle(ad,1).fillRect(cx-6+bx,B-22,7,18);
    g.fillStyle(am,1).fillRect(cx+m*2+bx,B-24,7,20);
    g.fillStyle(al,1).fillRect(cx+m*2+bx,B-24,2,8);
    // 盾
    g.fillStyle(0x004080,1).fillRect(cx-m*14,B-48,8,19);
    g.fillStyle(0x40A0FF,1).fillRect(cx-m*13,B-47,5,9);
    g.fillStyle(0x0060C0,1).fillRect(cx-m*13,B-44,5,3);
    g.fillStyle(wl,1).fillRect(cx-m*11,B-43,2,6);
    // 体（鎧）
    g.fillStyle(am,1).fillRect(cx-7+bx,B-46,15,26);
    // 鎧ディザリング
    g.fillStyle(al,1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx-6+bx+i*2,B-45+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+6+bx,B-32,2,10).fillRect(cx+4+bx,B-24,2,6);
    g.fillStyle(0x002040,1).fillRect(cx-7+bx,B-22,15,3); // ベルト
    g.fillStyle(wm,1).fillRect(cx-5+bx,B-22,5,3);
    // 剣腕
    g.fillStyle(am,1).fillRect(cx+m*7+bx,B-44,m*8,10);
    g.fillStyle(al,1).fillRect(cx+m*7+bx,B-44,m*4,4);
    // 剣
    const sx=cx+m*14+bx+wOff;
    g.fillStyle(wm,1).fillRect(sx,B-70,m*3,36);
    g.fillStyle(wl,1).fillRect(sx,B-70,m*2,34);
    g.fillStyle(0xFFFFE8,1).fillRect(sx,B-70,m*1,20); // 輝点
    g.fillStyle(wl,1).fillRect(sx-m*5,B-38,m*11,3); // 鍔
    g.fillStyle(wd,1).fillRect(sx-m*2,B-36,m*5,7); // 柄
    g.fillStyle(am,1).fillRect(sx-m*1,B-32,m*3,5);
    // 頭
    g.fillStyle(0xC06020,1).fillRect(cx-5,B-68,14,5); // 髪
    g.fillStyle(0x804000,1).fillRect(cx-5,B-65,4,3);
    g.fillStyle(ad,1).fillRect(cx-7,B-70,15,8); // 兜
    g.fillStyle(al,1).fillRect(cx-6,B-69,7,2);
    g.fillStyle(0x002040,1).fillRect(cx-1,B-64,8,2); // 兜スリット
    g.fillStyle(skd,1).fillRect(cx-4,B-63,14,15); // 顔ベース
    g.fillStyle(sk,1).fillRect(cx-3,B-62,11,13);
    g.fillStyle(sks,1).fillRect(cx-3,B-52,5,2); // あご
    g.fillStyle(ol,1).fillRect(cx+m*3,B-60,3,2); // 目
    g.fillStyle(0xFFFFFF,1).fillRect(cx+m*4,B-59,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*6,B-56,m*2,2); // 鼻
    g.fillStyle(sks,1).fillRect(cx+m*3,B-53,3,1); // 口
    if(boss){g.fillStyle(wl,1).fillTriangle(cx-5,B-70,cx+3,B-80,cx+9,B-70);}
  }

  _lgWarrior(g,cx,cy,col,isE,m,boss,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const ad=isE?0x402000:0x400000,am=isE?0x804000:0x800000,al=isE?0xC06000:0xC00000;
    const wd=0x604000,wm=0xA08000,wl=0xFFE040;
    const B=cy+38,bx=bOff;
    g.fillStyle(0x000000,0.2).fillEllipse(cx,B+4,36,8);
    g.fillStyle(0x202020,1).fillRect(cx-6+bx,B-4,8,5).fillRect(cx+m*3+bx,B-4,7,5);
    g.fillStyle(0x404040,1).fillRect(cx-6+bx,B-4,2,5);
    g.fillStyle(ad,1).fillRect(cx-6+bx,B-22,7,18);
    g.fillStyle(am,1).fillRect(cx+m*2+bx,B-24,7,20);
    g.fillStyle(al,1).fillRect(cx+m*2+bx,B-24,2,7);
    // 盾（木製）
    g.fillStyle(0x604000,1).fillRect(cx-m*15,B-48,9,20);
    g.fillStyle(0x806020,1).fillRect(cx-m*14,B-47,6,10);
    g.fillStyle(0xA08000,1).fillRect(cx-m*12,B-43,3,4);
    // 体
    g.fillStyle(am,1).fillRect(cx-7+bx,B-48,15,28);
    g.fillStyle(al,1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx-6+bx+i*2,B-47+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+6+bx,B-32,2,12);
    g.fillStyle(wd,1).fillRect(cx-7+bx,B-24,15,3);
    // 大剣
    g.fillStyle(am,1).fillRect(cx+m*7+bx,B-46,m*8,9);
    const sx=cx+m*14+bx+wOff;
    g.fillStyle(wm,1).fillRect(sx,B-74,m*4,40);
    g.fillStyle(wl,1).fillRect(sx,B-74,m*3,38);
    g.fillStyle(0xFFFFE8,1).fillRect(sx,B-74,m*1,22);
    g.fillStyle(0xC0C0C0,1).fillRect(sx,B-76,m*4,3);
    g.fillStyle(wl,1).fillRect(sx-m*6,B-36,m*13,4);
    g.fillStyle(wd,1).fillRect(sx-m*2,B-33,m*6,8);
    // 頭
    g.fillStyle(isE?0x404020:0x606060,1).fillRect(cx-5,B-66,14,4);
    g.fillStyle(isE?0x402000:ad,1).fillRect(cx-7,B-70,15,8);
    g.fillStyle(isE?0x608040:al,0.6).fillRect(cx-6,B-69,6,2);
    g.fillStyle(skd,1).fillRect(cx-4,B-63,14,15);
    g.fillStyle(sk,1).fillRect(cx-3,B-62,11,13);
    g.fillStyle(isE?0xFF2200:ol,1).fillRect(cx+m*3,B-60,3,2);
    g.fillStyle(0xFFFFFF,1).fillRect(cx+m*4,B-59,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*6,B-56,m*2,2);
    if(boss){g.fillStyle(isE?0xFF2200:wl,1).fillCircle(cx+m*6,B-66,5);}
  }

  _lgKnight(g,cx,cy,col,isE,m,wOff,bOff){
    const hC=isE?0x604000:col,B=cy+38,bx=bOff;
    const al=isE?0xA06020:0x40A0FF,ad=isE?0x402000:0x004080;
    const wm=0xA08000,wl=0xFFE040,wd=0x604000;
    g.fillStyle(0x000000,0.2).fillEllipse(cx,B+4,56,9);
    g.fillStyle(hC,1).fillEllipse(cx,B-10,56,24);
    g.fillStyle(this._dk(hC,0.8),1);
    [[-22,-17,8,19],[-9,-4,8,17],[m*7,-4,7,17],[m*9,-17,7,19]].forEach(([dx,dy,w,h])=>g.fillRect(cx+dx,B+dy,w,h));
    g.fillStyle(this._dk(hC,0.9),1).fillRect(cx-10,B-6,20,8);
    g.fillStyle(col,1).fillRect(cx-9+bx,B-56,17,28);
    g.fillStyle(al,1); for(let i=0;i<4;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx-8+bx+i*2,B-55+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+7+bx,B-38,2,10);
    g.fillStyle(al,1).fillRect(cx+m*9+bx,B-54,m*7,9);
    const lx=cx+m*14+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(lx,B-78,m*3,48);
    g.fillStyle(0xE0E0E0,1).fillRect(lx,B-78,m*2,46);
    g.fillStyle(wl,1).fillTriangle(lx,B-80,lx+m*4,B-80,lx+m*2,B-88);
    g.fillStyle(ad,1).fillRect(cx-5,B-70,13,8);
    g.fillStyle(al,1).fillRect(cx-4,B-69,5,2);
    g.fillStyle(isE?0x808040:0xE08060,1).fillRect(cx-3,B-64,11,13);
    g.fillStyle(isE?0x606020:0xA04020,1).fillRect(cx-3,B-54,5,2);
    g.fillStyle(0x200000,1).fillRect(cx+m*3,B-62,3,2);
  }

  _lgMage(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020;
    const B=cy+38,bx=bOff;
    g.fillStyle(0x000000,0.15).fillEllipse(cx,B+4,30,7);
    g.fillStyle(col,1).fillRect(cx-8+bx,B-48,16,48);
    g.fillStyle(this._dk(col,0.7),1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx+4+bx+i*2,B-28+j*2,2,2);
    g.fillStyle(this._dk(col,0.85),1).fillTriangle(cx-8+bx,B-48,cx-14+bx,B-24,cx-8+bx,B-32);
    g.fillStyle(0x806020,1).fillRect(cx+m*9+bx+wOff,B-76,m*3,46);
    g.fillStyle(0xCC66FF,1).fillCircle(cx+m*10+bx+wOff,B-78,9);
    g.fillStyle(0xFFFFFF,1).fillCircle(cx+m*10+bx+wOff,B-80,4);
    g.fillStyle(0xFFE040,0.9); for(let i=0;i<4;i++){const a=i*90*Math.PI/180;g.fillRect(cx+m*10+bx+wOff+Math.cos(a)*10-1,B-78+Math.sin(a)*10-1,2,2);}
    g.fillStyle(col,1).fillRect(cx+m*7+bx,B-50,m*7,9);
    g.fillStyle(col,1).fillTriangle(cx,B-76,cx-12,B-56,cx+12,B-56).fillRect(cx-12,B-58,24,7);
    g.fillStyle(this._dk(col,0.8),1).fillTriangle(cx,B-74,cx-7,B-58,cx,B-58);
    g.fillStyle(skd,1).fillRect(cx-5,B-58,12,14);
    g.fillStyle(sk,1).fillRect(cx-4,B-57,9,12);
    g.fillStyle(isE?0xFF2200:0x200000,1).fillRect(cx+m*2,B-55,2,2);
    g.fillStyle(0xFFFFFF,1).fillRect(cx+m*3,B-54,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*5,B-51,m*2,2);
  }

  _lgHealer(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,B=cy+38,bx=bOff;
    const robe=isE?0x406040:0xE8E8E8;
    g.fillStyle(0x000000,0.14).fillEllipse(cx,B+4,30,7);
    g.fillStyle(robe,1).fillRect(cx-8+bx,B-48,16,48).fillRect(cx-10+bx,B-28,4,28).fillRect(cx+6+bx,B-28,4,28);
    g.fillStyle(this._dk(robe,0.8),1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx+4+bx+i*2,B-28+j*2,2,2);
    g.fillStyle(col,1).fillRect(cx-1+bx,B-46,2,14).fillRect(cx-6+bx,B-38,12,3);
    g.fillStyle(0xA08040,1).fillRect(cx+m*8+bx+wOff,B-68,m*3,42);
    g.fillStyle(col,1).fillRect(cx+m*7+bx+wOff,B-70,m*9,3);
    g.fillStyle(0xFFE040,1).fillTriangle(cx+m*10+bx+wOff,B-74,cx+m*8+bx+wOff,B-66,cx+m*12+bx+wOff,B-66);
    g.fillStyle(col,1).fillRect(cx+m*7+bx,B-48,m*6,8);
    g.fillStyle(robe,1).fillRect(cx-6,B-72,12,5);
    g.fillStyle(0xD0D0D0,1).fillRect(cx-6,B-75,12,5);
    g.fillStyle(sk,1).fillRect(cx-4,B-68,11,15);
    g.fillStyle(this._dk(0xE08060,0.8),1).fillRect(cx-4,B-55,5,2);
    g.fillStyle(isE?0xFF2200:0x200000,1).fillRect(cx+m*2,B-65,2,2);
    g.fillStyle(0xFFFFFF,1).fillRect(cx+m*3,B-64,1,1);
  }

  _lgArcher(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const ad=isE?0x402000:0x2A4A2A,am=isE?0x804000:col,al=isE?0xC06000:this._dk(col,1.4);
    const B=cy+38,bx=bOff;
    g.fillStyle(0x000000,0.14).fillEllipse(cx,B+4,30,7);
    g.fillStyle(0x202020,1).fillRect(cx-6+bx,B-4,7,5).fillRect(cx+m*2+bx,B-4,6,5);
    g.fillStyle(ad,1).fillRect(cx-6+bx,B-22,6,18);
    g.fillStyle(am,1).fillRect(cx+m*2+bx,B-24,6,20);
    g.fillStyle(am,1).fillRect(cx-7+bx,B-46,14,26);
    g.fillStyle(al,1).fillRect(cx-6+bx,B-45,5,9);
    g.fillStyle(ad,1).fillRect(cx+5+bx,B-30,2,9);
    const bx2=cx-m*14;
    g.lineStyle(3,0x806020,1).beginPath().moveTo(bx2,B-64).lineTo(bx2-m*6,B-44).lineTo(bx2,B-24).strokePath();
    g.lineStyle(1,0xC0A060,1).lineBetween(bx2,B-64,bx2,B-24);
    g.lineStyle(2,0x806020,1).lineBetween(bx2+m*2,B-44+wOff,cx+m*14,B-44+wOff);
    g.fillStyle(0xC0C0C0,1).fillTriangle(cx+m*14,B-44+wOff,cx+m*11,B-47+wOff,cx+m*11,B-41+wOff);
    g.fillStyle(am,1).fillRect(cx+m*6+bx,B-44,m*6,8).fillRect(cx-m*10,B-46,m*5,8);
    g.fillStyle(ad,1).fillRect(cx-5,B-68,13,5);
    g.fillStyle(am,0.7).fillRect(cx-5,B-71,13,5);
    g.fillStyle(skd,1).fillRect(cx-4,B-65,13,15);
    g.fillStyle(sk,1).fillRect(cx-3,B-64,10,13);
    g.fillStyle(skd,1).fillRect(cx-3,B-53,5,2);
    g.fillStyle(ol,1).fillRect(cx+m*3,B-62,3,2);
    g.fillStyle(0xFFFFFF,1).fillRect(cx+m*4,B-61,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*6,B-58,m*2,2);
  }

  _lgBirdman(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,B=cy+38,bx=bOff;
    g.fillStyle(0x000000,0.14).fillEllipse(cx,B+4,32,7);
    g.fillStyle(col,0.75).fillTriangle(cx-m*2,B-32,cx-m*24,B-56,cx-m*5,B-20);
    g.fillStyle(this._dk(col,0.85),0.6).fillTriangle(cx-m*2,B-30,cx-m*20,B-52,cx-m*4,B-20);
    g.fillStyle(0x806020,1).fillRect(cx-6+bx,B-4,7,5).fillRect(cx+m*3+bx,B-4,6,5);
    g.fillStyle(0x604000,1); [[cx-6+bx,B],[cx-4+bx,B],[cx+m*3+bx,B],[cx+m*5+bx,B]].forEach(([x,y])=>g.fillRect(x,y,2,5));
    g.fillStyle(0x806020,1).fillRect(cx-6+bx,B-22,6,18).fillRect(cx+m*3+bx,B-24,6,20);
    g.fillStyle(col,1).fillRect(cx-7+bx,B-46,15,26);
    g.fillStyle(this._dk(col,0.7),1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx+5+bx+i*2,B-30+j*2,2,2);
    g.fillStyle(col,1).fillRect(cx+m*8+bx,B-46,m*7,9);
    const lx=cx+m*14+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(lx,B-68,m*3,40);
    g.fillStyle(0xE8E8E8,1).fillRect(lx,B-68,m*2,38);
    g.fillStyle(0xFFE040,1).fillTriangle(lx,B-70,lx+m*4,B-70,lx+m*2,B-78);
    g.fillStyle(sk,1).fillRect(cx-4,B-64,12,14);
    g.fillStyle(this._dk(sk,0.8),1).fillRect(cx-4,B-53,6,2);
    g.fillStyle(col,1).fillRect(cx-6,B-72,13,10);
    g.fillStyle(0xFF5500,1).fillTriangle(cx+m*6,B-60,cx+m*12,B-58,cx+m*6,B-56);
    g.fillStyle(0x200000,1).fillRect(cx+m*3,B-65,2,2);
    g.fillStyle(0xFFE040,1).fillRect(cx+m*4,B-64,1,1);
  }

  _lgCentaur(g,cx,cy,col,isE,m,wOff,bOff){
    const hC=isE?0x604000:0x806020,B=cy+38,bx=bOff;
    const al=isE?0xA06020:0x40A0FF,ad=isE?0x402000:0x004080;
    g.fillStyle(0x000000,0.2).fillEllipse(cx,B+4,60,10);
    g.fillStyle(hC,1).fillEllipse(cx,B-10,58,24);
    g.fillStyle(this._dk(hC,0.8),1);
    [[-26,-17,8,19],[-13,-4,8,15],[m*9,-4,8,15],[m*11,-17,8,19]].forEach(([dx,dy,w,h])=>g.fillRect(cx+dx,B+dy,w,h));
    g.fillStyle(0xC08040,1); for(let i=0;i<4;i++) g.fillRect(cx-22+i*16,B-4,4,7);
    g.fillStyle(col,1).fillRect(cx-9+bx,B-54,17,30);
    g.fillStyle(al,1); for(let i=0;i<4;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx-8+bx+i*2,B-53+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+7+bx,B-38,2,11);
    g.fillStyle(al,1).fillRect(cx+m*9+bx,B-52,m*6,9);
    const lx=cx+m*14+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(lx,B-74,m*3,46);
    g.fillStyle(0xE8E8E8,1).fillRect(lx,B-74,m*2,44);
    g.fillStyle(0xFFE040,1).fillTriangle(lx,B-76,lx+m*4,B-76,lx+m*2,B-84);
    g.fillStyle(ad,1).fillRect(cx-5,B-68,14,8);
    g.fillStyle(al,1).fillRect(cx-4,B-67,5,2);
    g.fillStyle(isE?0x808040:0xE08060,1).fillRect(cx-3,B-62,12,14);
    g.fillStyle(isE?0x606020:0xA04020,1).fillRect(cx-3,B-51,5,2);
    g.fillStyle(0x200000,1).fillRect(cx+m*3,B-60,3,2);
    g.fillStyle(0xFFFFFF,1).fillRect(cx+m*4,B-59,1,1);
  }

  _lgMonk(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const B=cy+38,bx=bOff;
    g.fillStyle(0x000000,0.14).fillEllipse(cx,B+4,30,7);
    g.fillStyle(0x202020,1).fillRect(cx-6+bx,B-4,7,4).fillRect(cx+m*2+bx,B-4,6,4);
    g.fillStyle(sk,1).fillRect(cx-6+bx,B-22,6,18).fillRect(cx+m*2+bx,B-24,6,20);
    g.fillStyle(col,1).fillRect(cx-7+bx,B-46,14,26);
    g.fillStyle(0xFFE040,1).fillRect(cx-7+bx,B-24,14,3);
    g.fillStyle(this._dk(col,0.8),1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx+5+bx+i*2,B-32+j*2,2,2);
    g.fillStyle(sk,1).fillRect(cx+m*8+bx+wOff,B-40,m*12,9);
    g.fillStyle(skd,1).fillRect(cx+m*8+bx+wOff,B-38,m*4,2);
    g.fillStyle(0xFFAA00,0.35).fillCircle(cx+m*14+bx+wOff,B-36,16);
    g.fillStyle(0xFFE040,0.6).fillCircle(cx+m*14+bx+wOff,B-36,9);
    g.fillStyle(skd,1).fillRect(cx-4,B-64,13,14);
    g.fillStyle(sk,1).fillRect(cx-3,B-63,11,12);
    g.fillStyle(skd,1).fillRect(cx-3,B-53,5,2);
    g.fillStyle(ol,1).fillRect(cx+m*3,B-61,3,2);
    g.fillStyle(0xFFFFFF,1).fillRect(cx+m*4,B-60,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*5,B-57,m*2,2);
  }

  _lgRogue(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const am=isE?0x402000:col,ad=isE?0x201000:this._dk(col,0.6);
    const B=cy+38,bx=bOff;
    g.fillStyle(0x000000,0.14).fillEllipse(cx,B+4,28,6);
    g.fillStyle(0x101010,1).fillRect(cx-6+bx,B-4,7,5).fillRect(cx+m*2+bx,B-4,6,5);
    g.fillStyle(am,1).fillRect(cx-6+bx,B-22,6,18).fillRect(cx+m*2+bx,B-24,6,20);
    g.fillStyle(col,1).fillRect(cx-7+bx,B-46,14,26);
    g.fillStyle(col,0.65).fillTriangle(cx-7+bx,B-46,cx-16+bx,B-26,cx-7+bx,B-30);
    g.fillStyle(ad,1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx+4+bx+i*2,B-32+j*2,2,2);
    g.fillStyle(am,1).fillRect(cx+m*7+bx,B-46,m*7,8).fillRect(cx+m*6+bx,B-38,m*6,7);
    const d1x=cx+m*14+bx+wOff,d2x=cx+m*11+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(d1x,B-58,m*2,20).fillRect(d2x,B-52,m*2,16);
    g.fillStyle(0xF0F0F0,1).fillRect(d1x,B-58,m*1,19).fillRect(d2x,B-52,m*1,15);
    g.fillStyle(0xA08000,1).fillRect(d1x-m*2,B-40,m*6,2).fillRect(d2x-m*2,B-38,m*5,2);
    g.fillStyle(am,1).fillRect(d1x-m*1,B-38,m*3,6).fillRect(d2x-m*1,B-36,m*2,5);
    g.fillStyle(ad,1).fillRect(cx-5,B-72,13,9);
    g.fillStyle(col,1).fillRect(cx-4,B-70,11,6);
    g.fillStyle(skd,1).fillRect(cx-3,B-66,11,14);
    g.fillStyle(sk,1).fillRect(cx-2,B-65,8,11);
    g.fillStyle(skd,1).fillRect(cx-2,B-56,5,2);
    g.fillStyle(0x33CC66,1).fillRect(cx+m*2,B-63,2,2).fillRect(cx+m*5,B-63,2,2);
    g.fillStyle(0xFFFFFF,0.8).fillRect(cx+m*3,B-62,1,1).fillRect(cx+m*6,B-62,1,1);
  }

  _lgBaron(g,cx,cy,col,isE,m,boss,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const ad=isE?0x402000:0x202040,am=isE?0x804000:0x404080,al=isE?0xC06000:0x8080C0;
    const wd=0x604000,wm=0xA08000,wl=0xFFE040;
    const B=cy+38,bx=bOff;
    g.fillStyle(0x000000,0.2).fillEllipse(cx,B+4,36,8);
    g.fillStyle(0x202020,1).fillRect(cx-6+bx,B-4,8,5).fillRect(cx+m*3+bx,B-4,7,5);
    g.fillStyle(ad,1).fillRect(cx-6+bx,B-22,7,18).fillRect(cx+m*2+bx,B-24,7,20);
    g.fillStyle(al,1).fillRect(cx+m*2+bx,B-24,2,7);
    g.fillStyle(0x202040,1).fillRect(cx-m*16,B-50,10,22);
    g.fillStyle(al,1).fillRect(cx-m*15,B-49,7,11);
    g.fillStyle(wl,1).fillRect(cx-m*13,B-44,3,8);
    g.fillStyle(am,1).fillRect(cx-8+bx,B-48,16,28);
    g.fillStyle(al,1); for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0) g.fillRect(cx-7+bx+i*2,B-47+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+7+bx,B-32,2,11).fillRect(cx+5+bx,B-24,2,6);
    g.fillStyle(0x000020,0.6).fillRect(cx-4+bx,B-40,9,7);
    g.fillStyle(wd,1).fillRect(cx-8+bx,B-24,16,3);
    g.fillStyle(am,1).fillRect(cx+m*8+bx,B-46,m*8,10);
    const sx=cx+m*15+bx+wOff;
    g.fillStyle(0x4040A0,1).fillRect(sx,B-74,m*4,42);
    g.fillStyle(0x8080C0,1).fillRect(sx,B-74,m*2,40);
    g.fillStyle(0xC0C0E0,1).fillRect(sx,B-74,m*1,24);
    g.fillStyle(wl,1).fillRect(sx-m*6,B-36,m*14,4);
    g.fillStyle(wd,1).fillRect(sx-m*2,B-33,m*6,8);
    g.fillStyle(ad,1).fillRect(cx-7,B-72,15,9);
    if(boss){g.fillStyle(0xFF2200,1).fillTriangle(cx-7,B-72,cx+1,B-82,cx+8,B-72);}
    g.fillStyle(0x000020,0.85).fillRect(cx-4,B-65,12,6);
    g.fillStyle(0xFF2200,1).fillRect(cx+m*2,B-63,3,2);
    g.fillStyle(skd,1).fillRect(cx-3,B-62,11,13);
    g.fillStyle(skd,1).fillRect(cx-3,B-51,5,2);
  }

  _dk(c,f){return((Math.floor(Math.min(255,(c>>16&0xff)*f))<<16)|(Math.floor(Math.min(255,(c>>8&0xff)*f))<<8)|Math.floor(Math.min(255,(c&0xff)*f)));}
}
