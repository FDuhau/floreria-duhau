// ── CSS para lista de precios ─────────────────────────────────────────────────
(function injectLpCss(){
  const s = document.createElement('style');
  s.textContent = `
    .lp-section { margin-bottom: 32px; }
    .lp-section-header {
      display: flex; align-items: center; justify-content: space-between;
      background: #111110; color: #F7F5F2; border-radius: 4px;
      padding: 12px 20px; margin-bottom: 0; cursor: pointer;
    }
    .lp-section-header:hover { background: #1E1E1C; }
    .lp-section-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; display:flex;align-items:center;gap:10px; }
    .lp-section-actions { display:flex; gap:8px; align-items:center; }
    .lp-items-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px; padding: 16px 0 4px;
    }
    .lp-card {
      background: #FDFCFB; border: 1px solid #E4E2DC; border-radius: 4px;
      overflow: hidden; transition: box-shadow .2s;
    }
    .lp-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.09); }
    .lp-card-photo {
      width: 100%; height: 150px; object-fit: cover; display: block;
      background: linear-gradient(135deg, #EDE8E2, #D8D4CC);
    }
    .lp-card-photo-placeholder {
      width: 100%; height: 150px; background: linear-gradient(135deg,#EDE8E2,#D8D4CC);
      display: flex; flex-direction:column; align-items: center; justify-content: center;
      font-size: 36px; color: var(--mid-gray); gap: 6px; cursor:pointer;
    }
    .lp-card-photo-placeholder span { font-size:11px; letter-spacing:1px; text-transform:uppercase; }
    .lp-card-body { padding: 14px 16px; }
    .lp-card-name {
      font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 500;
      color: var(--charcoal); margin-bottom: 3px; border:none; background:transparent;
      width:100%; outline:none; padding:2px 0; border-bottom:1px solid transparent;
      transition: border-color .2s;
    }
    .lp-card-name:focus { border-bottom-color: var(--sage); }
    .lp-card-desc {
      font-size: 11.5px; color: var(--mid-gray); margin-bottom: 10px; line-height: 1.5;
      border:none; background:transparent; width:100%; outline:none; resize:none;
      min-height:32px; font-family:'DM Sans',sans-serif; padding:2px 0;
      border-bottom:1px solid transparent; transition: border-color .2s;
    }
    .lp-card-desc:focus { border-bottom-color: var(--sage); }
    .lp-card-footer { display:flex; align-items:center; justify-content:space-between; }
    .lp-price-input {
      font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500;
      color: #1A1A1A; border:none; background:transparent; outline:none; width:130px;
      border-bottom:1px solid transparent; transition: border-color .2s;
    }
    .lp-price-input:focus { border-bottom-color: var(--sage); }
    .lp-card-actions { display:flex; gap:4px; }
    .lp-photo-strip { display:flex; gap:5px; flex-wrap:wrap; padding:10px 14px 0; }
    .lp-photo-thumb {
      position:relative; width:60px; height:60px; border-radius:5px; overflow:hidden;
      border:1px solid var(--light-gray); flex-shrink:0;
    }
    .lp-photo-thumb img { width:100%;height:100%;object-fit:cover;cursor:pointer; }
    .lp-photo-del {
      position:absolute;top:2px;right:2px;background:rgba(0,0,0,.55);color:white;
      border:none;border-radius:50%;width:16px;height:16px;font-size:10px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;line-height:1;
    }
    .lp-add-photo {
      width:60px;height:60px;border-radius:5px;border:2px dashed var(--light-gray);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      cursor:pointer;font-size:10px;color:var(--mid-gray);gap:2px;flex-shrink:0;
    }
  `;
  document.head.appendChild(s);
})();
