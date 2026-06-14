class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 夜空の背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000008, 0x000008, 0x08083a, 0x08083a, 1);
    bg.fillRect(0, 0, W, H);

    // 星（大小混在）
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.65);
      const bright = Math.random();
      const r = bright > 0.9 ? 1.5 : bright > 0.7 ? 1 : 0.5;
      const alpha = Math.random() * 0.5 + 0.5;
      this.add.circle(x, y, r, 0xffffff, alpha);
    }

    // 月
    const moon = this.add.graphics();
    moon.fillStyle(0xfffde8, 1);
    moon.fillCircle(W - 60, 55, 28);
    moon.fillStyle(0x08083a, 1);
    moon.fillCircle(W - 50, 50, 24);

    // 山シルエット
    const mtn = this.add.graphics();
    mtn.fillStyle(0x0a0a20, 1);
    // 右の山
    mtn.fillTriangle(W, H*0.5, W*0.65, H*0.22, W*1.1, H*0.22);
    // 左の山
    mtn.fillTriangle(-20, H*0.55, W*0.3, H*0.18, W*0.62, H*0.55);
    // 手前の丘
    mtn.fillStyle(0x060612, 1);
    mtn.fillEllipse(W/2, H*0.72, W*1.4, H*0.4);

    // 城のシルエット
    this.drawCastleSilhouette(W/2, H*0.52);

    // ゴールドの区切りライン
    const line1 = this.add.graphics();
    line1.lineStyle(1, 0xccaa44, 0.8);
    line1.lineBetween(30, H*0.59, W-30, H*0.59);

    // SHINING FORCE ロゴ
    this.add.text(W/2, H*0.625, 'SHINING FORCE', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#ccaa44',
      letterSpacing: 6,
      stroke: '#331100', strokeThickness: 3,
    }).setOrigin(0.5);

    // 2026 メインタイトル
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000033, 0.6);
    titleBg.fillRoundedRect(W/2 - 120, H*0.665, 240, 52, 4);
    titleBg.lineStyle(1, 0x4466aa, 0.8);
    titleBg.strokeRoundedRect(W/2 - 120, H*0.665, 240, 52, 4);

    this.add.text(W/2, H*0.695, '2 0 2 6', {
      fontSize: '38px', fontFamily: 'Georgia, serif',
      color: '#88ccff',
      stroke: '#001144', strokeThickness: 5,
      shadow: { x: 0, y: 0, color: '#4488ff', blur: 12, fill: true },
    }).setOrigin(0.5);

    const line2 = this.add.graphics();
    line2.lineStyle(1, 0xccaa44, 0.8);
    line2.lineBetween(30, H*0.755, W-30, H*0.755);

    // キャラクターシルエット一覧
    this.drawHeroSilhouettes(W/2, H*0.8);

    this.add.text(W/2, H*0.84, '〜 60人の仲間と共に、光を守れ 〜', {
      fontSize: '11px', fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      color: '#8899bb',
    }).setOrigin(0.5);

    // スタートボタン
    const startBg = this.add.graphics();
    startBg.fillStyle(0x0a2255, 1);
    startBg.fillRoundedRect(W/2 - 90, H*0.88, 180, 42, 8);
    startBg.lineStyle(2, 0x4488cc, 1);
    startBg.strokeRoundedRect(W/2 - 90, H*0.88, 180, 42, 8);

    const startTxt = this.add.text(W/2, H*0.88 + 21, '▶  は じ め る', {
      fontSize: '16px', fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const startHitArea = this.add.rectangle(W/2, H*0.88 + 21, 180, 42)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [startTxt, startBg],
      alpha: { from: 0.65, to: 1 },
      duration: 900, yoyo: true, repeat: -1,
    });

    startHitArea.on('pointerdown', () => {
      this.cameras.main.fade(600, 0, 0, 0);
      this.time.delayedCall(600, () => this.scene.start('Battle'));
    });

    // コピーライト
    this.add.text(W/2, H - 10, '© 2026 Shining Force 2026 Project', {
      fontSize: '9px', color: '#445566',
    }).setOrigin(0.5, 1);
  }

  drawCastleSilhouette(cx, y) {
    const g = this.add.graphics();
    g.fillStyle(0x050510, 1);
    // メインタワー
    g.fillRect(cx - 18, y - 60, 36, 80);
    // 屋根
    g.fillTriangle(cx, y - 90, cx - 22, y - 60, cx + 22, y - 60);
    // 側塔（左）
    g.fillRect(cx - 52, y - 40, 22, 60);
    g.fillTriangle(cx - 41, y - 58, cx - 55, y - 40, cx - 27, y - 40);
    // 側塔（右）
    g.fillRect(cx + 30, y - 40, 22, 60);
    g.fillTriangle(cx + 41, y - 58, cx + 27, y - 40, cx + 55, y - 40);
    // 城壁
    g.fillRect(cx - 80, y + 10, 160, 30);
    // 門
    g.fillStyle(0x08083a, 1);
    g.fillRect(cx - 10, y + 15, 20, 25);

    // 窓の光
    g.fillStyle(0xffee88, 0.6);
    g.fillRect(cx - 5, y - 48, 10, 12);
    g.fillRect(cx - 46, y - 30, 8, 10);
    g.fillRect(cx + 38, y - 30, 8, 10);
  }

  drawHeroSilhouettes(cx, y) {
    const shapes = [
      { dx: -80, color: 0x4466cc, type: 'sword' },
      { dx: -44, color: 0xcc4444, type: 'axe' },
      { dx: -8,  color: 0xaa44cc, type: 'staff' },
      { dx: 28,  color: 0x44cc88, type: 'bow' },
      { dx: 64,  color: 0xffcc44, type: 'healer' },
    ];
    shapes.forEach(s => {
      this.drawMiniHero(cx + s.dx, y, s.color);
    });
  }

  drawMiniHero(x, y, color) {
    const g = this.add.graphics();
    // 頭
    g.fillStyle(color, 0.9);
    g.fillRect(x - 4, y - 16, 8, 8);
    // 体
    g.fillRect(x - 5, y - 8, 10, 10);
    // 足
    g.fillRect(x - 4, y + 2, 3, 5);
    g.fillRect(x + 1, y + 2, 3, 5);
    // 武器（右腕）
    g.fillStyle(0xddccaa, 0.8);
    g.fillRect(x + 5, y - 10, 2, 10);
  }
}
