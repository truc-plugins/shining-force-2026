// church.js — 教会（安全地帯）UIシステム
// ExploreScene から呼ばれる。Phaser.Sceneに描画する。

class ChurchUI {
  constructor(scene) {
    this._scene   = scene;
    this._objs    = [];
    this._cursor  = 0;
    this._onClose = null;
    this._churchId = null;
  }

  open(churchId, onClose) {
    this._churchId = churchId;
    this._onClose  = onClose;
    this._cursor   = 0;
    this._buildUI();
    this._setupKeys();
  }

  close() {
    this._destroyAll();
    if (this._onClose) { this._onClose(); this._onClose = null; }
  }

  _buildUI() {
    this._destroyAll();
    const s = this._scene;
    const W = s.scale.width;
    const H = s.scale.height;
    const church = CHURCH_DATA[this._churchId];
    if (!church) return;

    // オーバーレイ
    const ov = s.add.rectangle(W/2, H/2, W, H, 0x000020, 0.75).setDepth(50);
    this._objs.push(ov);

    const PX = 30, PY = 120;
    const BW = W - PX*2;

    // 外枠
    const box = s.add.graphics().setDepth(51);
    box.fillStyle(0x000830, 1);
    box.fillRoundedRect(PX, PY, BW, 320, 6);
    box.lineStyle(2, 0x4060a0, 1);
    box.strokeRoundedRect(PX, PY, BW, 320, 6);
    this._objs.push(box);

    // タイトル
    const title = s.add.text(W/2, PY + 16, church.name, {
      fontSize: '14px', color: '#ffe040',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5, 0).setDepth(52);
    this._objs.push(title);

    // 店員セリフ
    const msg = s.add.text(PX + 14, PY + 42, `「${church.npcDialog}」`, {
      fontSize: '11px', color: '#e0e0e0',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      wordWrap: { width: BW - 28, useAdvancedWrap: true },
    }).setDepth(52);
    this._objs.push(msg);

    // 区切り線
    const line = s.add.graphics().setDepth(52);
    line.lineStyle(1, 0x204060, 1);
    line.lineBetween(PX + 8, PY + 72, PX + BW - 8, PY + 72);
    this._objs.push(line);

    // メニュー項目
    church.menu.forEach((item, i) => {
      const y = PY + 88 + i * 38;
      const isSel = (i === this._cursor);
      const color = isSel ? '#ffe040' : '#e0e0e0';
      const prefix = isSel ? '▶ ' : '　';
      const costStr = (item.cost > 0) ? `  ${item.cost}G` : '';
      const txt = s.add.text(PX + 20, y, `${prefix}${item.label}${costStr}`, {
        fontSize: '13px', color,
        fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      }).setDepth(52);
      this._objs.push(txt);

      const hit = s.add.rectangle(W/2, y + 12, BW - 20, 32).setInteractive().setDepth(53).setAlpha(0.01);
      this._objs.push(hit);
      hit.on('pointerdown', () => { this._cursor = i; this._select(i); });
    });
  }

  _select(idx) {
    const church = CHURCH_DATA[this._churchId];
    if (!church) return;
    const item = church.menu[idx];
    if (!item) return;

    switch (item.action) {
      case 'fullHeal': {
        const r = TownEngine.fullHeal();
        this._showMsg(r.msg);
        break;
      }
      case 'revive': {
        // 死亡メンバーがいない想定（将来実装）
        this._showMsg('今は蘇生が必要なメンバーはいない。');
        break;
      }
      case 'save': {
        const r = TownEngine.save();
        this._showMsg(r.msg);
        break;
      }
      case 'exit':
      default:
        this.close();
        return;
    }
  }

  _showMsg(text) {
    const s = this._scene;
    const W = s.scale.width;
    const popup = s.add.text(W/2, 50, text, {
      fontSize: '13px', color: '#ffffff',
      backgroundColor: '#004080',
      padding: { x: 10, y: 6 },
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(60);
    this._objs.push(popup);
    s.time.delayedCall(1400, () => { if (popup && popup.active) popup.destroy(); });
  }

  _setupKeys() {
    const s = this._scene;
    if (this._keyHandler) s.input.keyboard.off('keydown', this._keyHandler);
    this._keyHandler = (e) => {
      const church = CHURCH_DATA[this._churchId];
      if (!church) return;
      const maxIdx = church.menu.length - 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this._cursor = Math.max(0, this._cursor - 1);
        this._buildUI();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this._cursor = Math.min(maxIdx, this._cursor + 1);
        this._buildUI();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        this._select(this._cursor);
      } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        this.close();
      }
    };
    s.input.keyboard.on('keydown', this._keyHandler);
  }

  _destroyAll() {
    this._objs.forEach(o => { if (o && o.active) o.destroy(); });
    this._objs = [];
    if (this._keyHandler && this._scene) {
      this._scene.input.keyboard.off('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }
}
