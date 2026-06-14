const config = {
  type: Phaser.CANVAS,
  width: 480,
  height: 720,
  backgroundColor: '#0a0a1a',
  parent: 'game-container',
  scene: [BootScene, TitleScene, EventScene, ExploreScene, BattleScene, BattleCutinScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

const game = new Phaser.Game(config);
