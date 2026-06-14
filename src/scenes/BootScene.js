class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // グラフィックはすべてコード生成（画像ファイル不要）
  }

  create() {
    this.scene.start('Title');
  }
}
