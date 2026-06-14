// shop.js — ショップUIシステム
// ExploreScene から呼ばれる。Phaser.Sceneに描画する。

class ShopUI {
  constructor(scene) {
    this._scene = scene;
    this._objs  = [];
    this._cursor = 0;
    this._mode   = 'top';   // 'top' | 'buy_list'
    this._onClose = null;
    this._shopId  = null;
    this._stock   = [];
  }

  open(shopId, onClose) {
    this._shopId  = shopId;
    this._onClose = onClose;
    this._mode    = 'top';
    this._cursor  = 0;
    const shop = SHOP_DATA[shopId];
    this._stock = shop ? shop.stock : [];
    this._buildUI();
    this._setupKeys();
  }

  close() {
    this._destroyAll();
    if (this._onClose) { this._onClose(); this._onClose = null; }
  }

  // ────────────────────────────────
  _buildUI() {
    this._destroyAll();
    const s = this._scene;
    const W = s.scale.width;
    const H = s.scale.height;
    const shop = SHOP_DATA[this._shopId];
    if (!shop) return;

    // オーバーレイ
    const ov = s.add.rectangle(W/2, H/2, W, H, 0x000020, 0.7).setDepth(50);
    this._objs.push(ov);

    const PX = 20, PY = 60;
    const BW = W - PX*2, BH = H - PY*2;

    // 外枠
    const box = s.add.graphics().setDepth(51);
    box.fillStyle(0x000830, 1);
    box.fillRoundedRect(PX, PY, BW, BH, 6);
    box.lineStyle(2, 0x006080, 1);
    box.strokeRoundedRect(PX, PY, BW, BH, 6);
    this._objs.push(box);

    // タイトル
    const title = s.add.text(W/2, PY + 18, shop.name, {
      fontSize: '14px', color: '#ffe040',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5, 0).setDepth(52);
    this._objs.push(title);

    // 店員セリフ
    const msg = s.add.text(PX + 12, PY + 42, shop.npcDialog, {
      fontSize: '11px', color: '#e0e0e0',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      wordWrap: { width: BW - 24, useAdvancedWrap: true },
    }).setDepth(52);
    this._objs.push(msg);

    // 区切り線
    const line = s.add.graphics().setDepth(52);
    line.lineStyle(1, 0x004060, 1);
    line.lineBetween(PX + 8, PY + 70, PX + BW - 8, PY + 70);
    this._objs.push(line);

    if (this._mode === 'top') {
      this._buildTopMenu(PX, PY, BW);
    } else {
      this._buildBuyList(PX, PY, BW, BH);
    }

    // 所持金
    const goldTxt = s.add.text(PX + 12, PY + BH - 28, `所持金: ${TownEngine.gold} G`, {
      fontSize: '12px', color: '#ffe040',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setDepth(52);
    this._objs.push(goldTxt);
    this._goldTxt = goldTxt;
  }

  _buildTopMenu(PX, PY, BW) {
    const s = this._scene;
    const items = ['買う', 'やめる'];
    items.forEach((label, i) => {
      const y = PY + 88 + i * 30;
      const isSelected = (i === this._cursor && this._mode === 'top');
      const color = isSelected ? '#ffe040' : '#e0e0e0';
      const prefix = isSelected ? '▶ ' : '　';
      const txt = s.add.text(PX + 20, y, prefix + label, {
        fontSize: '13px', color,
        fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      }).setDepth(52);
      this._objs.push(txt);

      // タッチ対応
      const hit = s.add.rectangle(PX + BW/2, y + 10, BW - 20, 26).setInteractive().setDepth(53).setAlpha(0.01);
      this._objs.push(hit);
      hit.on('pointerdown', () => { this._cursor = i; this._selectTop(); });
    });
  }

  _buildBuyList(PX, PY, BW, BH) {
    const s = this._scene;
    s.add.text(PX + 20, PY + 78, '── 購入アイテム ──', {
      fontSize: '11px', color: '#88aacc',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setDepth(52);

    this._stock.forEach((item, i) => {
      const y = PY + 100 + i * 32;
      const isSelected = (i === this._cursor);
      const color = isSelected ? '#ffe040' : '#e0e0e0';
      const prefix = isSelected ? '▶ ' : '　';
      const txt = s.add.text(PX + 20, y, `${prefix}${item.name}`, {
        fontSize: '12px', color,
        fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      }).setDepth(52);
      const priceTxt = s.add.text(PX + BW - 60, y, `${item.price}G`, {
        fontSize: '12px', color: isSelected ? '#ffe040' : '#aaccff',
        fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      }).setDepth(52);
      this._objs.push(txt, priceTxt);

      const hit = s.add.rectangle(PX + BW/2, y + 10, BW - 20, 28).setInteractive().setDepth(53).setAlpha(0.01);
      this._objs.push(hit);
      hit.on('pointerdown', () => { this._cursor = i; this._buyItem(i); });
    });

    // 説明文
    if (this._cursor < this._stock.length) {
      const desc = s.add.text(PX + 12, PY + BH - 50, this._stock[this._cursor].desc || '', {
        fontSize: '11px', color: '#88ccff',
        fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
      }).setDepth(52);
      this._objs.push(desc);
    }

    // 戻るボタン
    const backTxt = s.add.text(PX + BW - 70, PY + 78, '← 戻る', {
      fontSize: '11px', color: '#aaaaaa',
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setInteractive().setDepth(52);
    backTxt.on('pointerdown', () => { this._mode = 'top'; this._cursor = 0; this._buildUI(); });
    this._objs.push(backTxt);
  }

  _selectTop() {
    if (this._cursor === 0) {
      this._mode = 'buy_list';
      this._cursor = 0;
      this._buildUI();
    } else {
      this.close();
    }
  }

  _buyItem(idx) {
    const item = this._stock[idx];
    if (!item) return;
    const result = TownEngine.buyItem(this._shopId, item.id);
    if (result.ok) {
      this._showMsg(`${item.name}を買った！`);
    } else {
      this._showMsg(result.msg);
    }
    this._buildUI();
  }

  _showMsg(text) {
    const s = this._scene;
    const W = s.scale.width;
    const popup = s.add.text(W/2, 40, text, {
      fontSize: '13px', color: '#ffffff',
      backgroundColor: '#004080',
      padding: { x: 10, y: 6 },
      fontFamily: 'Hiragino Kaku Gothic ProN, sans-serif',
    }).setOrigin(0.5).setDepth(60);
    this._objs.push(popup);
    s.time.delayedCall(1200, () => { if (popup.active) popup.destroy(); });
  }

  _setupKeys() {
    const s = this._scene;
    if (this._keyHandler) {
      s.input.keyboard.off('keydown', this._keyHandler);
    }
    this._keyHandler = (e) => {
      if (!this._scene) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this._cursor = Math.max(0, this._cursor - 1);
        this._buildUI();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        const max = (this._mode === 'top') ? 1 : this._stock.length - 1;
        this._cursor = Math.min(max, this._cursor + 1);
        this._buildUI();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        if (this._mode === 'top') this._selectTop();
        else this._buyItem(this._cursor);
      } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        if (this._mode === 'buy_list') { this._mode = 'top'; this._cursor = 0; this._buildUI(); }
        else this.close();
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
