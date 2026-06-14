// BattleCutinScene — 戦闘カットイン（横顔サイドビュー・4フレームアニメ・MDパレット）
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
    const atkCx=Math.floor(W*0.27), defCx=Math.floor(W*0.73), sprY=Math.floor(H*0.44);
    this.atkCx=atkCx; this.defCx=defCx; this.sprY=sprY;
    this.atkGfx=this.add.graphics(); this.defGfx=this.add.graphics();
    this._drawLarge(this.atkGfx,atkCx,sprY,this.atk,false,0);
    this._drawLarge(this.defGfx,defCx,sprY,this.def,true,0);
    this.atkGfx.x=-220; this.defGfx.x=220;
    this._buildStatusPanel(W,H);
    this.fxGfx=this.add.graphics().setDepth(50);
    this.tweens.add({targets:this.atkGfx,x:0,duration:220,ease:'Back.easeOut'});
    this.tweens.add({targets:this.defGfx,x:0,duration:220,ease:'Back.easeOut',
      onComplete:()=>this.time.delayedCall(100,()=>this.isMagic?this._doMagicAnim():this._doPhysAnim())
    });
  }

  // ════════════════════════════════════════════
  // ピクセルアート戦闘背景（草原フィールド）
  // ════════════════════════════════════════════
  _buildBG(W,H){
    const g=this.add.graphics();
    const skyH=Math.floor(H*0.35);
    const groundH=H-skyH;

    // --- 空（ディザリングで青グラデ） ---
    for(let y=0;y<skyH;y+=2){
      const ratio=y/skyH;
      // 奇数行・偶数行で色を変えてディザ
      const c1=ratio<0.4?0x004060:ratio<0.7?0x0060A0:0x40A0E0;
      const c2=ratio<0.4?0x0060A0:ratio<0.7?0x40A0E0:0x40A0E0;
      g.fillStyle(c1,1).fillRect(0,y,W,1);
      g.fillStyle(c2,1).fillRect(0,y+1,W,1);
    }

    // --- 地平線の丘シルエット ---
    const hillY=skyH;
    g.fillStyle(0x004000,1);
    for(let x=0;x<W;x++){
      const h=Math.floor(10+8*Math.sin(x*0.05)+5*Math.sin(x*0.12+1.5)+3*Math.sin(x*0.22+0.8));
      g.fillRect(x,hillY-h,1,h+2);
    }
    // 丘ハイライト（稜線）
    g.fillStyle(0x006000,1);
    for(let x=0;x<W;x++){
      const h=Math.floor(10+8*Math.sin(x*0.05)+5*Math.sin(x*0.12+1.5)+3*Math.sin(x*0.22+0.8));
      g.fillRect(x,hillY-h-1,1,2);
    }

    // --- 地面（左半面：攻撃側、右半面：防御側） ---
    // 左地面
    g.fillStyle(0x008000,1).fillRect(0,hillY,W/2,groundH);
    // 右地面（やや暗め）
    g.fillStyle(0x006000,1).fillRect(W/2,hillY,W/2,groundH);

    // --- 地面ディザリング（明暗縞） ---
    g.fillStyle(0x00A000,1);
    for(let y=hillY;y<hillY+groundH;y+=6){
      for(let x=0;x<W/2;x+=4) g.fillRect(x,y,2,2);
    }
    g.fillStyle(0x004000,1);
    for(let y=hillY+3;y<hillY+groundH;y+=6){
      for(let x=W/2;x<W;x+=4) g.fillRect(x,y,2,2);
    }

    // --- 前景草（地面上部の草ツンツン） ---
    g.fillStyle(0x00C000,1);
    for(let x=0;x<W;x+=3){
      const h=2+Math.floor(Math.sin(x*0.3)*1.5);
      g.fillRect(x,hillY,1,h+1);
    }
    g.fillStyle(0x00A000,1);
    for(let x=1;x<W;x+=5){
      g.fillRect(x,hillY+1,1,3);
    }

    // --- 上部バナー（PAL3スタイル：暗緑枠）---
    g.fillStyle(0x000020,1).fillRect(0,0,W,40);
    g.fillStyle(0x002000,1).fillRect(0,38,W,2); // 外枠（暗緑）
    g.fillStyle(0x004000,1).fillRect(0,36,W,2); // 内枠（中緑）
    g.fillStyle(0x002000,1).fillRect(0,0,W,2);
    this.add.text(W/2,20,'⚔  BATTLE  ⚔',{
      fontSize:'16px',color:'#E0E0E0',fontFamily:'Georgia, serif',stroke:'#000020',strokeThickness:3,
    }).setOrigin(0.5);

    // --- 中央分割ライン ---
    g.fillStyle(0x202020,1).fillRect(W/2-1,0,3,H);
    g.fillStyle(0xC0C0C0,1).fillRect(W/2,0,1,H);

    // --- 下部バナー ---
    g.fillStyle(0x000020,1).fillRect(0,H-52,W,52);
    g.fillStyle(0x002000,1).fillRect(0,H-52,W,2);
    g.fillStyle(0x004000,1).fillRect(0,H-50,W,2);
    this.logTxt=this.add.text(W/2,H-26,'',{
      fontSize:'13px',color:'#E0E0E0',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif',stroke:'#000020',strokeThickness:2,
    }).setOrigin(0.5);

    // --- 魔法時：元素カラーオーバーレイ ---
    if(this.isMagic&&this.element!=='NONE'){
      const ec=this.element==='FIRE'?0x400000:this.element==='BLIZZARD'?0x000040:0x404000;
      g.fillStyle(ec,0.25).fillRect(0,0,W,H);
    }
  }

  // ════════════════════════════════════════════
  // ステータスパネル（PAL3カラー）
  // ════════════════════════════════════════════
  _buildStatusPanel(W,H){
    const g=this.add.graphics();
    const pY=40,pH=56,PW=W/2-12;
    const a=this.atk, d=this.def;

    // 左パネル
    g.fillStyle(0x000020,0.9).fillRect(0,pY,W/2-2,pH);
    g.fillStyle(0x002000,1).fillRect(0,pY,W/2-2,2).fillRect(0,pY+pH-2,W/2-2,2).fillRect(0,pY,2,pH).fillRect(W/2-4,pY,2,pH);
    g.fillStyle(0x004000,1).fillRect(2,pY+2,W/2-6,2).fillRect(2,pY+pH-4,W/2-6,2);

    // 右パネル
    g.fillStyle(0x000020,0.9).fillRect(W/2+2,pY,W/2-2,pH);
    g.fillStyle(0x002000,1).fillRect(W/2+2,pY,W/2-2,2).fillRect(W/2+2,pY+pH-2,W/2-2,2).fillRect(W/2+2,pY,2,pH).fillRect(W-2,pY,2,pH);
    g.fillStyle(0x004000,1).fillRect(W/2+4,pY+2,W/2-6,2).fillRect(W/2+4,pY+pH-4,W/2-6,2);

    this.add.text(W/2,pY+pH/2,'VS',{fontSize:'13px',color:'#FFE040',fontFamily:'Georgia,serif',stroke:'#000020',strokeThickness:3}).setOrigin(0.5);

    const aR=a.hp/a.maxHp, dR=d.hp/d.maxHp;
    this.add.text(8,pY+6,a.name,{fontSize:'11px',color:'#E0E0E0',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'});
    this.add.text(8,pY+18,`Lv${a.level} ${a.clsName||''}`,{fontSize:'9px',color:'#808080',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'});
    this._hpBar(g,8,pY+30,PW,a.hp,a.maxHp,aR>0.5?0x00E000:aR>0.25?0xE0E000:0xE00000);
    this.atkHpTxt=this.add.text(8,pY+38,`HP ${a.hp}/${a.maxHp}`,{fontSize:'9px',color:'#E0E000',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'});

    this.add.text(W/2+6,pY+6,d.name,{fontSize:'11px',color:'#E0E0E0',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'});
    this.add.text(W/2+6,pY+18,`Lv${d.level} ${d.clsName||''}`,{fontSize:'9px',color:'#808080',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'});
    this._hpBar(g,W/2+6,pY+30,PW,d.hp,d.maxHp,dR>0.5?0x00E000:dR>0.25?0xE0E000:0xE00000);
    this.defHpTxt=this.add.text(W/2+6,pY+38,`HP ${d.hp}/${d.maxHp}`,{fontSize:'9px',color:'#E0E000',fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'});

    this.hpBarGfx=this.add.graphics();
  }

  _hpBar(g,x,y,w,hp,max,col){
    const f=Math.max(0,Math.round(w*hp/max));
    g.fillStyle(0x202020,1).fillRect(x,y,w,6);
    g.fillStyle(col,1).fillRect(x,y,f,6);
    g.fillStyle(0xC0C0C0,0.4).fillRect(x,y,f,2); // ハイライト
    g.fillStyle(0x202020,0.8).strokeRect(x,y,w,6);
  }

  _updateHpBars(aHp,dHp){
    const g=this.hpBarGfx,W=480;
    g.clear();
    const pY=40,PW=W/2-12;
    const a=this.atk,d=this.def;
    const aR=aHp/a.maxHp,dR=dHp/d.maxHp;
    this._hpBar(g,8,pY+30,PW,aHp,a.maxHp,aR>0.5?0x00E000:aR>0.25?0xE0E000:0xE00000);
    this._hpBar(g,W/2+6,pY+30,PW,dHp,d.maxHp,dR>0.5?0x00E000:dR>0.25?0xE0E000:0xE00000);
    this.atkHpTxt.setText(`HP ${aHp}/${a.maxHp}`);
    this.defHpTxt.setText(`HP ${dHp}/${d.maxHp}`);
  }

  // ════════════════════════════════════════════
  // 物理攻撃アニメ（4フレーム: idle→ready→swing→return）
  // ════════════════════════════════════════════
  _doPhysAnim(){
    const isPlayer=this.atk.isPlayer;
    this.logTxt.setText(`${this.atk.name} の攻撃！`);

    // frame1 READY（構え: 武器引き）
    this.atkGfx.clear(); this._drawLarge(this.atkGfx,this.atkCx,this.sprY,this.atk,false,1);
    this.tweens.add({targets:this.atkGfx,x:isPlayer?6:-6,duration:80,ease:'Linear',
      onComplete:()=>{
        // frame2 SWING（振り抜き）
        this.atkGfx.clear(); this._drawLarge(this.atkGfx,this.atkCx,this.sprY,this.atk,false,2);
        this.tweens.add({targets:this.atkGfx,x:isPlayer?-22:22,duration:120,ease:'Linear',
          onComplete:()=>{
            this._flashScreen(0xE0E0E0,0.85,30,()=>{
              this._showDmgNum(this.atkDmg,!isPlayer?this.atkCx:this.defCx,this.sprY-40,this.isCrit);
              this._updateHpBars(this.atk.hp,Math.max(0,this.def.hp-this.atkDmg));
              this.logTxt.setText(this.isCrit?`クリティカル！ ${this.atkDmg} ダメージ！`:`${this.atkDmg} ダメージ！`);
              this.cameras.main.shake(160,0.006);
              // frame3 RETURN
              this.atkGfx.clear(); this._drawLarge(this.atkGfx,this.atkCx,this.sprY,this.atk,false,3);
              this.time.delayedCall(1000,()=>{
                this.tweens.add({targets:this.atkGfx,x:0,duration:100,ease:'Linear',
                  onComplete:()=>{
                    // frame0 IDLE
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

  // ════════════════════════════════════════════
  // 魔法アニメ
  // ════════════════════════════════════════════
  _doMagicAnim(){
    const W=480,H=720;
    this.logTxt.setText(`${this.atk.name} の ${this.magicName}！`);
    this._castEffect(()=>{
      this._elementEffect(W,H,()=>{
        const isPlayer=this.atk.isPlayer;
        this._showDmgNum(this.atkDmg,!isPlayer?this.atkCx:this.defCx,this.sprY-40,false);
        this._updateHpBars(this.atk.hp,Math.max(0,this.def.hp-this.atkDmg));
        this.logTxt.setText(`${this.atkDmg} ダメージ！`);
        this.cameras.main.shake(120,0.005);
        this.time.delayedCall(1000,()=>this._finishScene());
      });
    });
  }

  _castEffect(cb){
    const cx=this.atk.isPlayer?this.atkCx:this.defCx, cy=this.sprY-20;
    const ec=this._elemColor(); let frame=0;
    this.time.addEvent({delay:40,repeat:7,callback:()=>{
      this.fxGfx.clear(); frame++;
      const r=18+frame*9;
      this.fxGfx.lineStyle(2,ec,1-frame/10).strokeCircle(cx,cy,r);
      this.fxGfx.lineStyle(1,0xE0E0E0,0.5).strokeCircle(cx,cy,r-6);
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
    const cols=[0xFF2200,0xFF5500,0xFF8800,0xFFAA00,0xFFE040,0xE0E0E0];
    this.time.addEvent({delay:45,repeat:12,callback:()=>{
      this.fxGfx.clear(); f++;
      cols.forEach((c,i)=>{const r=f*8-i*10;if(r>0){const a=Math.max(0,1-f/14-i*0.08);this.fxGfx.fillStyle(c,a).fillCircle(cx,cy,r);}});
      for(let p=0;p<4;p++){const ang=(f*37+p*90)*Math.PI/180,pr=f*10;this.fxGfx.fillStyle(0xFF6600,Math.max(0,0.8-f/15)).fillCircle(cx+Math.cos(ang)*pr,cy+Math.sin(ang)*pr-f*4,5-p);}
      if(f>=12){this.fxGfx.clear();cb();}
    }});
  }

  _blizzardFX(W,H,cb){
    const cx=this.atk.isPlayer?this.defCx:this.atkCx, cy=this.sprY-20;
    let f=0;
    this.time.addEvent({delay:50,repeat:10,callback:()=>{
      this.fxGfx.clear(); f++;
      this.fxGfx.fillStyle(0x40A0E0,Math.max(0,0.8-f/12)).fillCircle(cx,cy,f*7);
      this.fxGfx.fillStyle(0xC0E0FF,Math.max(0,0.6-f/12)).fillCircle(cx,cy,f*4);
      for(let a=0;a<6;a++){const ang=a*60*Math.PI/180,len=f*14,ex=cx+Math.cos(ang)*len,ey=cy+Math.sin(ang)*len;this.fxGfx.lineStyle(2,0x40A0E0,Math.max(0,0.9-f/12)).lineBetween(cx,cy,ex,ey);this.fxGfx.fillStyle(0xE0E0E0,Math.max(0,0.8-f/12)).fillRect(ex-3,ey-3,6,6);}
      if(f>=10){this.fxGfx.clear();cb();}
    }});
  }

  _thunderFX(W,H,cb){
    const cx=this.atk.isPlayer?this.defCx:this.atkCx, cy=this.sprY-20;
    let f=0;
    this.time.addEvent({delay:55,repeat:9,callback:()=>{
      this.fxGfx.clear(); f++;
      if(f%2===0)return;
      const sY=80,steps=10,segH=(cy-sY)/steps;
      [3,6].forEach(lw=>{
        this.fxGfx.lineStyle(lw,lw===3?0xFFFF44:0xE0E0E0,lw===3?0.9:0.4);
        this.fxGfx.beginPath(); this.fxGfx.moveTo(cx,sY);
        for(let s=1;s<=steps;s++) this.fxGfx.lineTo(cx+((s%2===0)?-1:1)*(Math.random()*22+6),sY+segH*s);
        this.fxGfx.strokePath();
      });
      this.fxGfx.fillStyle(0xFFFF88,0.6).fillCircle(cx,cy,f*5);
      if(f>=9){this.fxGfx.clear();cb();}
    }});
  }

  _genericFX(W,H,cb){
    const cx=this.atk.isPlayer?this.defCx:this.atkCx, cy=this.sprY-20;
    let f=0;
    this.time.addEvent({delay:50,repeat:8,callback:()=>{
      this.fxGfx.clear(); f++;
      this.fxGfx.fillStyle(0xE0E0E0,Math.max(0,0.8-f/9)).fillCircle(cx,cy,f*12);
      this.fxGfx.fillStyle(0x40A0FF,Math.max(0,0.6-f/9)).fillCircle(cx,cy,f*7);
      if(f>=8){this.fxGfx.clear();cb();}
    }});
  }

  _elemColor(){
    return this.element==='FIRE'?0xFF6600:this.element==='BLIZZARD'?0x40A0E0:this.element==='THUNDER'?0xFFE040:0x40A0FF;
  }

  // ════════════════════════════════════════════
  // 反撃アニメ
  // ════════════════════════════════════════════
  _doCounter(){
    if(this.defDmg<=0||this.def.hp<=this.atkDmg){this._finishScene();return;}
    const isPlayer=this.atk.isPlayer;
    this.time.delayedCall(160,()=>{
      this.logTxt.setText(`${this.def.name} の反撃！`);
      // 防御側: frame2(swing)
      this.defGfx.clear(); this._drawLarge(this.defGfx,this.defCx,this.sprY,this.def,true,2);
      this.tweens.add({targets:this.defGfx,x:isPlayer?20:-20,duration:120,ease:'Linear',
        onComplete:()=>{
          this._flashScreen(0xFF8000,0.65,30,()=>{
            this._showDmgNum(this.defDmg,isPlayer?this.atkCx:this.defCx,this.sprY-40,false);
            this._updateHpBars(Math.max(0,this.atk.hp-this.defDmg),Math.max(0,this.def.hp-this.atkDmg));
            this.logTxt.setText(`${this.defDmg} ダメージ！`);
            this.cameras.main.shake(100,0.004);
            this.time.delayedCall(1000,()=>{
              this.defGfx.clear(); this._drawLarge(this.defGfx,this.defCx,this.sprY,this.def,true,0);
              this.tweens.add({targets:this.defGfx,x:0,duration:100,ease:'Linear',onComplete:()=>this._finishScene()});
            });
          });
        }
      });
    });
  }

  // ════════════════════════════════════════════
  // ユーティリティ
  // ════════════════════════════════════════════
  _flashScreen(color,alpha,dur,cb){
    const fl=this.add.graphics().fillStyle(color,alpha).fillRect(0,0,480,720).setDepth(100);
    this.tweens.add({targets:fl,alpha:0,duration:dur,onComplete:()=>{fl.destroy();cb&&cb();}});
  }

  _showDmgNum(dmg,cx,cy,isCrit){
    const col=isCrit?'#FF8000':'#C0C0C0';
    const txt=isCrit?`★${dmg}！`:`${dmg}`;
    const t=this.add.text(cx,cy,txt,{fontSize:isCrit?'34px':'28px',color:col,stroke:'#000020',strokeThickness:5,fontFamily:'Georgia,serif'}).setOrigin(0.5).setDepth(200);
    this.tweens.add({targets:t,y:cy-44,alpha:0,duration:900,delay:200,ease:'Quad.easeOut',onComplete:()=>t.destroy()});
  }

  _finishScene(){
    this.time.delayedCall(800,()=>{
      this.cameras.main.fade(280,0,0,0,false,(cam,prog)=>{
        if(prog>=1){this.onDone&&this.onDone();this.scene.resume('Battle');this.scene.stop('BattleCutin');}
      });
    });
  }

  // ════════════════════════════════════════════
  // 大型スプライト描画（横顔サイドビュー）
  // af = attack frame: 0=idle, 1=ready, 2=swing, 3=return
  // mirrored=true → facing left (defender)
  // ════════════════════════════════════════════
  _drawLarge(g,cx,cy,unit,mirrored,af){
    g.clear();
    const col=unit.color||0x0060C0;
    const isE=!unit.isPlayer;
    const m=mirrored?-1:1; // 向き: 1=右向き, -1=左向き
    const cls=unit.cls||'WARRIOR';
    // 武器オフセット（攻撃フレーム別）
    const wOff=af===0?0:af===1?m*(-8):af===2?m*12:m*(-4);
    const bOff=af===2?m*3:0; // 体の前傾
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
    this.add.text(cx,cy+50,unit.name,{fontSize:'11px',color:'#E0E0E0',stroke:'#000020',strokeThickness:3,fontFamily:'Hiragino Kaku Gothic ProN, sans-serif'}).setOrigin(0.5,0);
  }

  // ── 横顔スプライト共通ヘルパー ──────────────
  // B = bottom reference, m = direction (1=right, -1=left)
  // PAL1: sk=skin, ad=armor dark, am=armor mid, al=armor light
  //        wd=weapon dark, wm=weapon mid, wl=weapon light, ol=outline

  _lgHero(g,cx,cy,col,isE,m,boss,wOff,bOff){
    const sk=0xE08060,skd=0xA04020,sks=0x602000,ol=0x200000;
    const ad=0x004080,am=0x0060C0,al=0x40A0FF;
    const wd=0x604000,wm=0xA08000,wl=0xFFE040;
    const B=cy+35,bx=bOff;
    // 影
    g.fillStyle(0x000000,0.15).fillEllipse(cx,B+3,32,7);
    // ブーツ
    g.fillStyle(0x202020,1).fillRect(cx-5+bx,B-4,7,5).fillRect(cx+m*2+bx,B-4,6,5);
    // 足（前足を少し前に）
    g.fillStyle(ad,1).fillRect(cx-5+bx,B-20,6,16);
    g.fillStyle(am,1).fillRect(cx+m*1+bx,B-22,6,18);
    g.fillStyle(al,1).fillRect(cx+m*1+bx,B-22,2,7);
    // 盾（反対側）
    g.fillStyle(0x004080,1).fillRect(cx-m*12,B-44,7,17);
    g.fillStyle(0x40A0FF,1).fillRect(cx-m*11,B-43,4,7);
    g.fillStyle(wl,1).fillRect(cx-m*9,B-40,2,5);
    // 体（鎧）
    g.fillStyle(am,1).fillRect(cx-6+bx,B-44,14,24);
    // ディザリング（鎧光沢）
    g.fillStyle(al,1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx-5+bx+i*2,B-43+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+6+bx,B-30,2,9).fillRect(cx+4+bx,B-22,2,5);
    // ベルト
    g.fillStyle(wd,1).fillRect(cx-6+bx,B-22,14,2);
    // 剣腕
    g.fillStyle(am,1).fillRect(cx+m*6+bx,B-42,m*7,9);
    // 剣（wOff=武器フレームオフセット）
    const sx=cx+m*12+bx+wOff;
    g.fillStyle(wm,1).fillRect(sx,B-66,m*3,32);
    g.fillStyle(wl,1).fillRect(sx,B-66,m*2,30);
    g.fillStyle(wl,1).fillRect(sx-m*4,B-36,m*9,2);
    g.fillStyle(wd,1).fillRect(sx-m*2,B-34,m*4,6);
    // 頭（横顔プロファイル）
    g.fillStyle(0xC06020,1).fillRect(cx-5,B-66,13,5); // 髪
    g.fillStyle(0x804000,1).fillRect(cx-5,B-63,3,3);
    g.fillStyle(ad,1).fillRect(cx-6,B-68,14,7); // 兜
    g.fillStyle(al,1).fillRect(cx-5,B-67,6,2);
    g.fillStyle(skd,1).fillRect(cx-4,B-61,13,14); // 顔ベース
    g.fillStyle(sk,1).fillRect(cx-3,B-60,10,12);
    g.fillStyle(sks,1).fillRect(cx-3,B-50,4,2);
    g.fillStyle(ol,1).fillRect(cx+m*2,B-58,2,2); // 目
    g.fillStyle(0xE0E0E0,1).fillRect(cx+m*3,B-57,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*5,B-54,m*2,2); // 鼻
    g.fillStyle(sks,1).fillRect(cx+m*2,B-51,3,1); // 口
    if(boss){g.fillStyle(wl,1).fillTriangle(cx-5,B-68,cx+3,B-76,cx+8,B-68);}
  }

  _lgWarrior(g,cx,cy,col,isE,m,boss,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const ad=isE?0x402000:0x400000,am=isE?0x804000:0x800000,al=isE?0xC06000:0xC00000;
    const wd=0x604000,wm=0xA08000,wl=0xFFE040;
    const B=cy+35,bx=bOff;
    g.fillStyle(0x000000,0.15).fillEllipse(cx,B+3,32,7);
    g.fillStyle(0x202020,1).fillRect(cx-5+bx,B-4,7,5).fillRect(cx+m*2+bx,B-4,6,5);
    g.fillStyle(ad,1).fillRect(cx-5+bx,B-20,6,16);
    g.fillStyle(am,1).fillRect(cx+m*1+bx,B-22,6,18);
    g.fillStyle(al,1).fillRect(cx+m*1+bx,B-22,2,6);
    // 盾
    g.fillStyle(0x604000,1).fillRect(cx-m*13,B-46,8,18);
    g.fillStyle(0x806020,1).fillRect(cx-m*12,B-45,5,9);
    // 体
    g.fillStyle(am,1).fillRect(cx-6+bx,B-46,14,26);
    g.fillStyle(al,1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx-5+bx+i*2,B-45+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+6+bx,B-30,2,10);
    g.fillStyle(wd,1).fillRect(cx-6+bx,B-22,14,2);
    // 大剣
    g.fillStyle(am,1).fillRect(cx+m*6+bx,B-44,m*7,8);
    const sx=cx+m*12+bx+wOff;
    g.fillStyle(wm,1).fillRect(sx,B-70,m*4,38);
    g.fillStyle(wl,1).fillRect(sx,B-70,m*3,36);
    g.fillStyle(0xC0C0C0,1).fillRect(sx,B-72,m*4,2);
    g.fillStyle(wl,1).fillRect(sx-m*5,B-34,m*11,3);
    g.fillStyle(wd,1).fillRect(sx-m*2,B-32,m*5,7);
    // 頭
    g.fillStyle(isE?0x404020:0x606060,1).fillRect(cx-5,B-64,13,4);
    g.fillStyle(isE?0x402000:ad,1).fillRect(cx-6,B-68,14,7);
    g.fillStyle(isE?0x608040:al,0.6).fillRect(cx-5,B-67,5,2);
    g.fillStyle(skd,1).fillRect(cx-4,B-61,13,14);
    g.fillStyle(sk,1).fillRect(cx-3,B-60,10,12);
    g.fillStyle(isE?0xFF2200:ol,1).fillRect(cx+m*2,B-58,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx+m*3,B-57,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*5,B-54,m*2,2);
    if(boss){g.fillStyle(isE?0xFF2200:wl,1).fillCircle(cx+m*5,B-64,4);}
  }

  _lgKnight(g,cx,cy,col,isE,m,wOff,bOff){
    const hC=isE?0x604000:col,B=cy+35,bx=bOff;
    const al=isE?0xA06020:0x40A0FF,ad=isE?0x402000:0x004080;
    const wm=0xA08000,wl=0xFFE040,wd=0x604000;
    g.fillStyle(0x000000,0.15).fillEllipse(cx,B+3,52,8);
    // 馬体
    g.fillStyle(hC,1).fillEllipse(cx,B-10,54,22);
    g.fillStyle(this._dk(hC,0.8),1);
    [[-20,-16,7,18],[-8,-4,7,16],[m*6,-4,6,16],[m*8,-16,6,18]].forEach(([dx,dy,w,h])=>g.fillRect(cx+dx,B+dy,w,h));
    // 騎士胴
    g.fillStyle(col,1).fillRect(cx-8+bx,B-54,16,26);
    g.fillStyle(al,1); for(let i=0;i<3;i++)for(let j=0;j<2;j++)if((i+j)%2===0) g.fillRect(cx-7+bx+i*2,B-53+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+6+bx,B-36,2,10);
    // ランス
    g.fillStyle(al,1).fillRect(cx+m*8+bx,B-52,m*6,8);
    const lx=cx+m*12+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(lx,B-74,m*3,46);
    g.fillStyle(0xE0E0E0,1).fillRect(lx,B-74,m*2,44);
    g.fillStyle(wl,1).fillTriangle(lx,B-76,lx+m*3,B-76,lx+m*1,B-82);
    // 頭
    g.fillStyle(ad,1).fillRect(cx-5,B-68,12,8);
    g.fillStyle(al,1).fillRect(cx-4,B-67,4,2);
    g.fillStyle(isE?0x808040:0xE08060,1).fillRect(cx-3,B-62,10,12);
    g.fillStyle(isE?0x606020:0xA04020,1).fillRect(cx-3,B-52,4,2);
    g.fillStyle(0x200000,1).fillRect(cx+m*2,B-60,2,2);
  }

  _lgMage(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020;
    const B=cy+35,bx=bOff;
    g.fillStyle(0x000000,0.15).fillEllipse(cx,B+3,28,6);
    // 足・ローブ裾
    g.fillStyle(col,1).fillRect(cx-7+bx,B-46,14,46);
    // ディザ
    g.fillStyle(this._dk(col,0.7),1); for(let i=0;i<4;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx+4+bx+i*2,B-26+j*2,2,2);
    // 杖
    g.fillStyle(0x806020,1).fillRect(cx+m*8+bx+wOff,B-74,m*3,44);
    g.fillStyle(0xCC66FF,1).fillCircle(cx+m*9+bx+wOff,B-76,8);
    g.fillStyle(0xE0E0E0,1).fillCircle(cx+m*9+bx+wOff,B-78,4);
    g.fillStyle(0xFFE040,0.8); for(let i=0;i<4;i++){const a=i*90*Math.PI/180;g.fillRect(cx+m*9+bx+wOff+Math.cos(a)*9-1,B-76+Math.sin(a)*9-1,2,2);}
    // 腕
    g.fillStyle(col,1).fillRect(cx+m*6+bx,B-48,m*6,8);
    // 帽子
    g.fillStyle(col,1).fillTriangle(cx,B-72,cx-10,B-54,cx+10,B-54).fillRect(cx-11,B-56,22,6);
    g.fillStyle(this._dk(col,0.8),1).fillTriangle(cx,B-70,cx-6,B-56,cx,B-56);
    // 頭
    g.fillStyle(skd,1).fillRect(cx-4,B-56,11,13);
    g.fillStyle(sk,1).fillRect(cx-3,B-55,8,11);
    g.fillStyle(isE?0xFF2200:0x200000,1).fillRect(cx+m*1,B-53,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx+m*2,B-52,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*4,B-50,m*2,2);
  }

  _lgHealer(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,B=cy+35,bx=bOff;
    const robe=isE?0x406040:0xE0E0E0;
    g.fillStyle(0x000000,0.12).fillEllipse(cx,B+3,28,6);
    // ローブ
    g.fillStyle(robe,1).fillRect(cx-7+bx,B-46,14,46).fillRect(cx-9+bx,B-26,4,26).fillRect(cx+5+bx,B-26,4,26);
    g.fillStyle(this._dk(robe,0.8),1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx+3+bx+i*2,B-26+j*2,2,2);
    // 十字
    g.fillStyle(col,1).fillRect(cx-1+bx,B-44,2,14).fillRect(cx-5+bx,B-37,10,3);
    // スタッフ（聖杖）
    g.fillStyle(0xA08040,1).fillRect(cx+m*7+bx+wOff,B-66,m*3,40);
    g.fillStyle(col,1).fillRect(cx+m*6+bx+wOff,B-68,m*7,3);
    g.fillStyle(0xFFE040,1).fillTriangle(cx+m*9+bx+wOff,B-72,cx+m*7+bx+wOff,B-64,cx+m*11+bx+wOff,B-64);
    g.fillStyle(col,1).fillRect(cx+m*7+bx,B-46,m*5,7);
    // 頭
    g.fillStyle(robe,1).fillRect(cx-5,B-70,11,5);
    g.fillStyle(0xC0C0C0,1).fillRect(cx-5,B-73,11,5);
    g.fillStyle(sk,1).fillRect(cx-4,B-66,10,14);
    g.fillStyle(this._dk(0xE08060,0.8),1).fillRect(cx-4,B-54,4,2);
    g.fillStyle(isE?0xFF2200:0x200000,1).fillRect(cx+m*1,B-63,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx+m*2,B-62,1,1);
  }

  _lgArcher(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const ad=isE?0x402000:0x2A4A2A,am=isE?0x804000:col,al=isE?0xC06000:this._dk(col,1.4);
    const B=cy+35,bx=bOff;
    g.fillStyle(0x000000,0.13).fillEllipse(cx,B+3,28,6);
    g.fillStyle(0x202020,1).fillRect(cx-5+bx,B-4,6,5).fillRect(cx+m*1+bx,B-4,5,5);
    g.fillStyle(ad,1).fillRect(cx-5+bx,B-20,5,16);
    g.fillStyle(am,1).fillRect(cx+m*1+bx,B-22,5,18);
    g.fillStyle(am,1).fillRect(cx-6+bx,B-44,12,24);
    g.fillStyle(al,1).fillRect(cx-5+bx,B-43,4,8);
    g.fillStyle(ad,1).fillRect(cx+5+bx,B-28,2,8);
    // 弓（反対側）
    const bx2=cx-m*12;
    g.lineStyle(3,0x806020,1).beginPath().moveTo(bx2,B-62).lineTo(bx2-m*5,B-42).lineTo(bx2,B-22).strokePath();
    g.lineStyle(1,0xC0A060,1).lineBetween(bx2,B-62,bx2,B-22);
    // 矢（wOff適用）
    g.lineStyle(1,0x806020,1).lineBetween(bx2+m*2,B-44+wOff,cx+m*12,B-44+wOff);
    g.fillStyle(0xC0C0C0,1).fillTriangle(cx+m*12,B-44+wOff,cx+m*9,B-46+wOff,cx+m*9,B-42+wOff);
    // 腕
    g.fillStyle(am,1).fillRect(cx+m*5+bx,B-42,m*5,7).fillRect(cx-m*8,B-44,m*4,7);
    // 頭
    g.fillStyle(ad,1).fillRect(cx-5,B-66,12,5);
    g.fillStyle(am,0.7).fillRect(cx-5,B-69,12,5);
    g.fillStyle(skd,1).fillRect(cx-4,B-63,12,14);
    g.fillStyle(sk,1).fillRect(cx-3,B-62,9,12);
    g.fillStyle(skd,1).fillRect(cx-3,B-52,4,2);
    g.fillStyle(ol,1).fillRect(cx+m*2,B-60,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx+m*3,B-59,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*5,B-56,m*2,2);
  }

  _lgBirdman(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,B=cy+35,bx=bOff;
    g.fillStyle(0x000000,0.12).fillEllipse(cx,B+3,30,6);
    // 翼（折りたたみ）
    g.fillStyle(col,0.7).fillTriangle(cx-m*2,B-30,cx-m*22,B-54,cx-m*4,B-18);
    g.fillStyle(this._dk(col,0.85),0.6).fillTriangle(cx-m*2,B-28,cx-m*18,B-50,cx-m*3,B-18);
    // 足（かぎ爪）
    g.fillStyle(0x806020,1).fillRect(cx-5+bx,B-4,6,5).fillRect(cx+m*2+bx,B-4,5,5);
    g.fillStyle(0x604000,1); [[cx-5+bx,B],[cx-3+bx,B],[cx+m*2+bx,B],[cx+m*4+bx,B]].forEach(([x,y])=>g.fillRect(x,y,2,5));
    // 脚
    g.fillStyle(0x806020,1).fillRect(cx-5+bx,B-20,5,16).fillRect(cx+m*2+bx,B-22,5,18);
    // 胴
    g.fillStyle(col,1).fillRect(cx-6+bx,B-44,14,24);
    g.fillStyle(this._dk(col,0.7),1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx+4+bx+i*2,B-28+j*2,2,2);
    // 武器（ランス）
    g.fillStyle(col,1).fillRect(cx+m*7+bx,B-44,m*6,8);
    const lx=cx+m*12+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(lx,B-66,m*3,38);
    g.fillStyle(0xE0E0E0,1).fillRect(lx,B-66,m*2,36);
    g.fillStyle(0xFFE040,1).fillTriangle(lx,B-68,lx+m*3,B-68,lx+m*1,B-74);
    // 頭（鳥系、くちばし）
    g.fillStyle(sk,1).fillRect(cx-4,B-62,11,13);
    g.fillStyle(this._dk(sk,0.8),1).fillRect(cx-4,B-52,5,2);
    g.fillStyle(col,1).fillRect(cx-5,B-70,12,10); // 頭部
    g.fillStyle(0xFF5500,1).fillTriangle(cx+m*5,B-58,cx+m*10,B-56,cx+m*5,B-54); // くちばし
    g.fillStyle(0x200000,1).fillRect(cx+m*2,B-63,2,2); // 目
    g.fillStyle(0xFFE040,1).fillRect(cx+m*3,B-62,1,1);
  }

  _lgCentaur(g,cx,cy,col,isE,m,wOff,bOff){
    const hC=isE?0x604000:0x806020,B=cy+35,bx=bOff;
    const al=isE?0xA06020:0x40A0FF,ad=isE?0x402000:0x004080;
    g.fillStyle(0x000000,0.15).fillEllipse(cx,B+3,58,9);
    // 馬体（横向き）
    g.fillStyle(hC,1).fillEllipse(cx,B-10,56,22);
    g.fillStyle(this._dk(hC,0.8),1);
    [[-24,-16,7,18],[-12,-4,7,14],[m*8,-4,7,14],[m*10,-16,7,18]].forEach(([dx,dy,w,h])=>g.fillRect(cx+dx,B+dy,w,h));
    g.fillStyle(0xC08040,1); for(let i=0;i<4;i++) g.fillRect(cx-22+i*16,B-4,4,6);
    // 騎士上半身
    g.fillStyle(col,1).fillRect(cx-8+bx,B-52,16,28);
    g.fillStyle(al,1); for(let i=0;i<3;i++)for(let j=0;j<2;j++)if((i+j)%2===0) g.fillRect(cx-7+bx+i*2,B-51+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+6+bx,B-36,2,10);
    // ランス
    g.fillStyle(al,1).fillRect(cx+m*8+bx,B-50,m*5,8);
    const lx=cx+m*12+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(lx,B-72,m*3,44);
    g.fillStyle(0xE0E0E0,1).fillRect(lx,B-72,m*2,42);
    g.fillStyle(0xFFE040,1).fillTriangle(lx,B-74,lx+m*3,B-74,lx+m*1,B-80);
    // 頭
    g.fillStyle(ad,1).fillRect(cx-5,B-66,13,8);
    g.fillStyle(al,1).fillRect(cx-4,B-65,5,2);
    g.fillStyle(isE?0x808040:0xE08060,1).fillRect(cx-3,B-60,11,13);
    g.fillStyle(isE?0x606020:0xA04020,1).fillRect(cx-3,B-50,4,2);
    g.fillStyle(0x200000,1).fillRect(cx+m*2,B-58,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx+m*3,B-57,1,1);
  }

  _lgMonk(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const B=cy+35,bx=bOff;
    g.fillStyle(0x000000,0.12).fillEllipse(cx,B+3,28,6);
    g.fillStyle(0x202020,1).fillRect(cx-5+bx,B-4,6,4).fillRect(cx+m*1+bx,B-4,5,4);
    g.fillStyle(sk,1).fillRect(cx-5+bx,B-20,5,16).fillRect(cx+m*1+bx,B-22,5,18);
    // 道着
    g.fillStyle(col,1).fillRect(cx-6+bx,B-44,13,24);
    g.fillStyle(0xFFE040,1).fillRect(cx-6+bx,B-22,13,2); // 帯
    g.fillStyle(this._dk(col,0.8),1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx+4+bx+i*2,B-30+j*2,2,2);
    // 拳（前に突き出す）
    g.fillStyle(sk,1).fillRect(cx+m*7+bx+wOff,B-38,m*10,8);
    g.fillStyle(skd,1).fillRect(cx+m*7+bx+wOff,B-36,m*3,2);
    // 気のオーラ
    g.fillStyle(0xFFAA00,0.3).fillCircle(cx+m*12+bx+wOff,B-34,14);
    g.fillStyle(0xFFE040,0.5).fillCircle(cx+m*12+bx+wOff,B-34,8);
    // 頭（剃り）
    g.fillStyle(skd,1).fillRect(cx-4,B-62,12,13);
    g.fillStyle(sk,1).fillRect(cx-3,B-61,10,11);
    g.fillStyle(skd,1).fillRect(cx-3,B-51,4,2);
    g.fillStyle(ol,1).fillRect(cx+m*2,B-59,2,2);
    g.fillStyle(0xE0E0E0,1).fillRect(cx+m*3,B-58,1,1);
    g.fillStyle(skd,1).fillRect(cx+m*4,B-55,m*2,2);
  }

  _lgRogue(g,cx,cy,col,isE,m,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const am=isE?0x402000:col,ad=isE?0x201000:this._dk(col,0.6);
    const B=cy+35,bx=bOff;
    g.fillStyle(0x000000,0.12).fillEllipse(cx,B+3,26,5);
    g.fillStyle(0x101010,1).fillRect(cx-5+bx,B-4,6,5).fillRect(cx+m*1+bx,B-4,5,5);
    g.fillStyle(am,1).fillRect(cx-5+bx,B-20,5,16).fillRect(cx+m*1+bx,B-22,5,18);
    g.fillStyle(col,1).fillRect(cx-6+bx,B-44,13,24);
    g.fillStyle(col,0.6).fillTriangle(cx-6+bx,B-44,cx-14+bx,B-24,cx-6+bx,B-28);
    g.fillStyle(ad,1); for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx+3+bx+i*2,B-30+j*2,2,2);
    // ダガー×2
    g.fillStyle(am,1).fillRect(cx+m*6+bx,B-44,m*6,7).fillRect(cx+m*5+bx,B-36,m*5,6);
    const d1x=cx+m*12+bx+wOff,d2x=cx+m*10+bx+wOff;
    g.fillStyle(0xC0C0C0,1).fillRect(d1x,B-56,m*2,18).fillRect(d2x,B-50,m*2,14);
    g.fillStyle(0xE0E0E0,1).fillRect(d1x,B-56,m*1,17).fillRect(d2x,B-50,m*1,13);
    g.fillStyle(0xA08000,1).fillRect(d1x-m*2,B-40,m*5,2).fillRect(d2x-m*2,B-38,m*4,2);
    g.fillStyle(am,1).fillRect(d1x-m*1,B-38,m*2,5).fillRect(d2x-m*1,B-36,m*2,4);
    // 頭（フード）
    g.fillStyle(ad,1).fillRect(cx-5,B-70,12,8);
    g.fillStyle(col,1).fillRect(cx-4,B-68,10,5);
    g.fillStyle(skd,1).fillRect(cx-3,B-64,10,13);
    g.fillStyle(sk,1).fillRect(cx-2,B-63,7,10);
    g.fillStyle(skd,1).fillRect(cx-2,B-54,4,2);
    g.fillStyle(0x33CC66,1).fillRect(cx+m*1,B-61,2,2).fillRect(cx+m*4,B-61,2,2);
    g.fillStyle(0xE0E0E0,0.7).fillRect(cx+m*2,B-60,1,1).fillRect(cx+m*5,B-60,1,1);
  }

  _lgBaron(g,cx,cy,col,isE,m,boss,wOff,bOff){
    const sk=isE?0x808040:0xE08060,skd=isE?0x606020:0xA04020,ol=0x200000;
    const ad=isE?0x402000:0x202040,am=isE?0x804000:0x404080,al=isE?0xC06000:0x8080C0;
    const wd=0x604000,wm=0xA08000,wl=0xFFE040;
    const B=cy+35,bx=bOff;
    g.fillStyle(0x000000,0.15).fillEllipse(cx,B+3,32,7);
    g.fillStyle(0x202020,1).fillRect(cx-5+bx,B-4,7,5).fillRect(cx+m*2+bx,B-4,6,5);
    g.fillStyle(ad,1).fillRect(cx-5+bx,B-20,6,16).fillRect(cx+m*1+bx,B-22,6,18);
    g.fillStyle(al,1).fillRect(cx+m*1+bx,B-22,2,6);
    // 盾（大型）
    g.fillStyle(0x202040,1).fillRect(cx-m*14,B-48,9,20);
    g.fillStyle(al,1).fillRect(cx-m*13,B-47,6,10);
    g.fillStyle(wl,1).fillRect(cx-m*11,B-42,3,7);
    // 体（重装備）
    g.fillStyle(am,1).fillRect(cx-7+bx,B-46,15,26);
    g.fillStyle(al,1); for(let i=0;i<4;i++)for(let j=0;j<3;j++)if((i+j)%2===0) g.fillRect(cx-6+bx+i*2,B-45+j*2,2,2);
    g.fillStyle(ad,1).fillRect(cx+6+bx,B-30,2,10).fillRect(cx+5+bx,B-22,2,5);
    // 暗黒紋章
    g.fillStyle(0x000020,0.5).fillRect(cx-4+bx,B-38,8,6);
    g.fillStyle(wd,1).fillRect(cx-6+bx,B-22,15,3);
    // 大剣（暗黒剣）
    g.fillStyle(am,1).fillRect(cx+m*7+bx,B-44,m*7,9);
    const sx=cx+m*13+bx+wOff;
    g.fillStyle(0x4040A0,1).fillRect(sx,B-72,m*4,40);
    g.fillStyle(0x8080C0,1).fillRect(sx,B-72,m*2,38);
    g.fillStyle(wl,1).fillRect(sx-m*5,B-35,m*12,3);
    g.fillStyle(wd,1).fillRect(sx-m*2,B-33,m*5,7);
    // 頭（暗黒兜）
    g.fillStyle(ad,1).fillRect(cx-6,B-70,14,8);
    if(boss){g.fillStyle(0xFF2200,1).fillTriangle(cx-6,B-70,cx+1,B-78,cx+8,B-70);}
    g.fillStyle(0x000020,0.8).fillRect(cx-4,B-63,11,5); // バイザー部
    g.fillStyle(0xFF2200,1).fillRect(cx+m*1,B-61,2,2); // 目（赤い輝き）
    g.fillStyle(skd,1).fillRect(cx-3,B-60,10,12);
    g.fillStyle(skd,1).fillRect(cx-3,B-50,4,2);
  }

  _dk(c,f){return((Math.floor(Math.min(255,(c>>16&0xff)*f))<<16)|(Math.floor(Math.min(255,(c>>8&0xff)*f))<<8)|Math.floor(Math.min(255,(c&0xff)*f)));}
}
