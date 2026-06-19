// ═══════════════════════════════════════════════════════════
// STOCK
// ═══════════════════════════════════════════════════════════
const STOCK = {
  view: 'products',

  render() {
    const products = DB.getAll('products');
    const locations = DB.getAll('locations');
    const alertes = products.filter(p => p.qty <= p.qty_min).length;
    const ruptures = products.filter(p => p.qty === 0).length;
    const valeur = products.reduce((s,p) => s + p.qty * p.price_buy, 0);

    const el = document.getElementById('page-stock');
    el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Stock & Inventaire</div>
        <div class="page-subtitle">${products.length} produits · ${locations.length} emplacements</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="STOCK.setView('products')">📦 Produits</button>
        <button class="btn btn-ghost btn-sm" onclick="STOCK.setView('locations')">🗂️ Emplacements</button>
        <button class="btn btn-ghost btn-sm" onclick="STOCK.setView('moves')">📋 Mouvements</button>
        <button class="btn btn-ghost btn-sm" onclick="STOCK.openScanner()">📷 Scanner</button>
        <button class="btn btn-primary btn-sm" onclick="STOCK.openNewProduct()">+ Produit</button>
      </div>
    </div>
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-icon">⚠️</div><div class="kpi-label">Alertes stock</div><div class="kpi-value" style="color:${alertes>0?'var(--warning)':'var(--success)'}">${alertes}</div></div>
      <div class="kpi-card"><div class="kpi-icon">🚫</div><div class="kpi-label">Ruptures</div><div class="kpi-value" style="color:${ruptures>0?'var(--danger)':'var(--success)'}">${ruptures}</div></div>
      <div class="kpi-card"><div class="kpi-icon">💰</div><div class="kpi-label">Valeur stock</div><div class="kpi-value" style="font-size:20px">${U.fmtEur(valeur)}</div></div>
      <div class="kpi-card"><div class="kpi-icon">📦</div><div class="kpi-label">Emplacements</div><div class="kpi-value">${locations.length}</div></div>
    </div>
    <div id="stock-view"></div>
    ${this.modalsHtml()}`;
    this.setView('products');
  },

  setView(v) {
    this.view = v;
    if (v === 'products') this.renderProducts();
    else if (v === 'locations') this.renderLocations();
    else if (v === 'moves') this.renderMoves();
  },

  renderProducts() {
    const products = DB.getAll('products');
    const locations = DB.getAll('locations');
    document.getElementById('stock-view').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <input class="form-control" id="stock-search" placeholder="🔍 Rechercher produit, SKU..." style="flex:1" oninput="STOCK.filterProducts(this.value)">
      <select class="form-control" id="stock-categ" style="width:160px" onchange="STOCK.filterProducts()">
        <option value="">Toutes catégories</option>
        <option value="equipement">Équipements</option>
        <option value="traitement">Traitement eau</option>
        <option value="pieces">Pièces détachées</option>
        <option value="consommable">Consommables</option>
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
        <input type="checkbox" id="stock-filter-alerte" onchange="STOCK.filterProducts()"> Alertes seulement
      </label>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table id="stock-table">
          <thead><tr><th>SKU</th><th>Produit</th><th>Catégorie</th><th>Emplacement</th><th>Qté</th><th>Min</th><th>Prix achat</th><th>Prix vente</th><th></th></tr></thead>
          <tbody id="stock-tbody">
            ${this.buildProductRows(products, locations)}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  buildProductRows(products, locations) {
    if (!locations) locations = DB.getAll('locations');
    return products.map(p => {
      const loc = locations.find(l => l.id === p.location_id);
      const isAlerte = p.qty <= p.qty_min;
      const isRupture = p.qty === 0;
      const rowColor = isRupture ? 'background:rgba(239,68,68,.05)' : isAlerte ? 'background:rgba(245,158,11,.05)' : '';
      return `<tr style="${rowColor}">
        <td><code style="font-size:12px;background:var(--bg);padding:2px 6px;border-radius:4px">${p.sku}</code></td>
        <td><strong>${p.name}</strong><br><span style="font-size:11px;color:var(--text-muted)">${p.brand||''} ${p.ref_fab||''}</span></td>
        <td><span class="badge" style="background:var(--info)20;color:var(--info)">${p.category||'—'}</span></td>
        <td>${loc ? `<span style="font-weight:700;color:var(--accent)">${loc.label}</span><br><span style="font-size:11px;color:var(--text-muted)">${loc.description||''}</span>` : '—'}</td>
        <td><span style="font-size:18px;font-weight:800;color:${isRupture?'var(--danger)':isAlerte?'var(--warning)':'var(--success)'}">${p.qty}</span> <span style="font-size:12px;color:var(--text-muted)">${p.unit}</span></td>
        <td style="color:var(--text-muted)">${p.qty_min}</td>
        <td>${U.fmtEur(p.price_buy)}</td>
        <td>${U.fmtEur(p.price_sell)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-success btn-sm" onclick="STOCK.openMove('${p.id}','in')" title="Entrée">⬆️</button>
          <button class="btn btn-warning btn-sm" onclick="STOCK.openMove('${p.id}','out')" title="Sortie">⬇️</button>
          <button class="btn btn-ghost btn-sm" onclick="U.printLabel(DB.getById('products','${p.id}'),DB.getById('locations','${p.location_id}'))" title="Étiquette">🏷️</button>
          <button class="btn btn-ghost btn-sm" onclick="STOCK.openEditProduct('${p.id}')" title="Modifier">✏️</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-muted)">Aucun produit</td></tr>';
  },

  filterProducts(val) {
    const search = (document.getElementById('stock-search')?.value||'').toLowerCase();
    const categ = document.getElementById('stock-categ')?.value||'';
    const alerteOnly = document.getElementById('stock-filter-alerte')?.checked||false;
    const locations = DB.getAll('locations');
    let products = DB.getAll('products');
    if (search) products = products.filter(p => `${p.sku} ${p.name} ${p.brand}`.toLowerCase().includes(search));
    if (categ) products = products.filter(p => p.category === categ);
    if (alerteOnly) products = products.filter(p => p.qty <= p.qty_min);
    document.getElementById('stock-tbody').innerHTML = this.buildProductRows(products, locations);
  },

  renderLocations() {
    const locations = DB.getAll('locations');
    const products = DB.getAll('products');
    document.getElementById('stock-view').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-weight:700">Carte des emplacements</div>
      <button class="btn btn-primary btn-sm" onclick="STOCK.openNewLocation()">+ Emplacement</button>
    </div>
    <div class="location-grid">
      ${locations.map(loc => {
        const prods = products.filter(p => p.location_id === loc.id);
        return `<div class="location-card" onclick="STOCK.showLocation('${loc.id}')">
          <div class="location-label">${loc.label}</div>
          <div class="location-desc">${loc.description||''}</div>
          <div class="location-count">${prods.length} produit(s)</div>
          ${prods.slice(0,2).map(p=>`<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${p.name.slice(0,25)}...</div>`).join('')}
        </div>`;
      }).join('')}
      <div class="location-card" style="border:2px dashed var(--border);opacity:.6" onclick="STOCK.openNewLocation()">
        <div style="font-size:32px">+</div>
        <div class="location-desc">Ajouter un emplacement</div>
      </div>
    </div>`;
  },

  renderMoves() {
    const moves = DB.getAll('stock_moves').sort((a,b) => b.date?.localeCompare(a.date||'')||0);
    document.getElementById('stock-view').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Historique des mouvements</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Quantité</th><th>Motif</th><th>Référence</th><th>Utilisateur</th></tr></thead>
          <tbody>
            ${moves.map(m => {
              const p = DB.getById('products', m.product_id);
              const u = DB.getById('users', m.user_id);
              return `<tr>
                <td>${U.fmtDate(m.date)}</td>
                <td>${p?.name||m.product_id}</td>
                <td>${m.type==='in'?'<span style="color:var(--success);font-weight:700">⬆️ Entrée</span>':'<span style="color:var(--warning);font-weight:700">⬇️ Sortie</span>'}</td>
                <td><strong>${m.qty}</strong> ${p?.unit||''}</td>
                <td>${m.reason||'—'}</td>
                <td><code style="font-size:12px">${m.ref||'—'}</code></td>
                <td>${u?.name||'—'}</td>
              </tr>`;
            }).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Aucun mouvement</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  openMove(productId, type) {
    const p = DB.getById('products', productId);
    document.getElementById('modal-move').classList.add('open');
    document.getElementById('modal-move-title').textContent = type === 'in' ? '⬆️ Entrée de stock' : '⬇️ Sortie de stock';
    document.getElementById('fm-product-id').value = productId;
    document.getElementById('fm-type').value = type;
    document.getElementById('fm-product-name').textContent = p?.name||'';
    document.getElementById('fm-current-qty').textContent = `Stock actuel: ${p?.qty||0} ${p?.unit||''}`;
    document.getElementById('fm-qty').value = 1;
    document.getElementById('fm-reason').value = '';
    document.getElementById('fm-ref').value = '';
  },

  saveMove() {
    const productId = document.getElementById('fm-product-id').value;
    const type = document.getElementById('fm-type').value;
    const qty = parseFloat(document.getElementById('fm-qty').value)||0;
    const p = DB.getById('products', productId);
    if (!p || qty <= 0) { U.toast('Quantité invalide','error'); return; }

    const newQty = type === 'in' ? p.qty + qty : Math.max(0, p.qty - qty);
    p.qty = newQty;
    DB.save('products', p);

    const move = {
      id: DB.genId(),
      product_id: productId,
      type,
      qty,
      date: U.today(),
      user_id: AUTH.getUser().id,
      reason: document.getElementById('fm-reason').value,
      ref: document.getElementById('fm-ref').value,
    };
    DB.save('stock_moves', move);
    U.closeModal('modal-move');
    STOCK.render();
    U.toast(`${type==='in'?'Entrée':'Sortie'} enregistrée — Stock: ${newQty}`, 'success');
  },

  openScanner() {
    document.getElementById('modal-scanner').classList.add('open');
    this.startCamera();
  },

  startCamera() {
    const video = document.getElementById('scanner-video');
    if (!navigator.mediaDevices) { U.toast('Caméra non disponible','error'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        this._stream = stream;
        this.scanLoop(video);
      })
      .catch(() => U.toast('Accès caméra refusé','error'));
  },

  scanLoop(video) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scan = () => {
      if (!document.getElementById('modal-scanner').classList.contains('open')) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        // Note: en production, utiliser jsQR ou ZXing pour décoder
        // Pour la démo, un champ manuel est disponible
      }
      requestAnimationFrame(scan);
    };
    scan();
  },

  stopCamera() {
    this._stream?.getTracks().forEach(t => t.stop());
    U.closeModal('modal-scanner');
  },

  scanManual() {
    const code = document.getElementById('scanner-manual').value.trim();
    if (!code) return;
    const p = DB.getAll('products').find(p => p.sku === code || p.barcode === code);
    if (p) {
      document.getElementById('scanner-result').innerHTML = `
        <div class="card" style="margin-top:12px">
          <div class="card-body">
            <div style="font-weight:700;font-size:16px">${p.name}</div>
            <div style="color:var(--text-muted);font-size:13px">SKU: ${p.sku}</div>
            <div style="font-size:24px;font-weight:800;margin:8px 0;color:var(--success)">${p.qty} ${p.unit}</div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn btn-success" onclick="STOCK.stopCamera();STOCK.openMove('${p.id}','in')">⬆️ Entrée</button>
              <button class="btn btn-warning" onclick="STOCK.stopCamera();STOCK.openMove('${p.id}','out')">⬇️ Sortie</button>
            </div>
          </div>
        </div>`;
    } else {
      document.getElementById('scanner-result').innerHTML = `<div style="color:var(--danger);margin-top:10px">❌ Produit non trouvé: "${code}"</div>`;
    }
  },

  openNewProduct() {
    const locations = DB.getAll('locations');
    document.getElementById('modal-product').classList.add('open');
    document.getElementById('modal-product-title').textContent = 'Nouveau produit';
    document.getElementById('form-product').reset();
    document.getElementById('fp2-id').value = '';
  },

  openEditProduct(id) {
    const p = DB.getById('products', id);
    if (!p) return;
    document.getElementById('modal-product').classList.add('open');
    document.getElementById('modal-product-title').textContent = 'Modifier produit';
    document.getElementById('fp2-id').value = p.id;
    document.getElementById('fp2-sku').value = p.sku||'';
    document.getElementById('fp2-name').value = p.name||'';
    document.getElementById('fp2-category').value = p.category||'';
    document.getElementById('fp2-unit').value = p.unit||'pce';
    document.getElementById('fp2-qty').value = p.qty||0;
    document.getElementById('fp2-qty-min').value = p.qty_min||0;
    document.getElementById('fp2-price-buy').value = p.price_buy||0;
    document.getElementById('fp2-price-sell').value = p.price_sell||0;
    document.getElementById('fp2-location').value = p.location_id||'';
    document.getElementById('fp2-brand').value = p.brand||'';
    document.getElementById('fp2-ref-fab').value = p.ref_fab||'';
    document.getElementById('fp2-barcode').value = p.barcode||'';
    document.getElementById('fp2-equip').value = p.equipment_type||'universel';
  },

  saveProduct() {
    const id = document.getElementById('fp2-id').value || DB.genId();
    const product = {
      id,
      sku: document.getElementById('fp2-sku').value,
      name: document.getElementById('fp2-name').value,
      category: document.getElementById('fp2-category').value,
      unit: document.getElementById('fp2-unit').value,
      qty: parseFloat(document.getElementById('fp2-qty').value)||0,
      qty_min: parseFloat(document.getElementById('fp2-qty-min').value)||0,
      price_buy: parseFloat(document.getElementById('fp2-price-buy').value)||0,
      price_sell: parseFloat(document.getElementById('fp2-price-sell').value)||0,
      location_id: document.getElementById('fp2-location').value,
      brand: document.getElementById('fp2-brand').value,
      ref_fab: document.getElementById('fp2-ref-fab').value,
      barcode: document.getElementById('fp2-barcode').value,
      equipment_type: document.getElementById('fp2-equip').value,
    };
    DB.save('products', product);
    U.closeModal('modal-product');
    STOCK.render();
    U.toast('Produit enregistré', 'success');
  },

  openNewLocation() {
    document.getElementById('modal-location').classList.add('open');
    document.getElementById('form-location').reset();
    document.getElementById('fl-id').value = '';
  },

  saveLocation() {
    const id = document.getElementById('fl-id').value || DB.genId();
    const zone = document.getElementById('fl-zone').value.toUpperCase();
    const row = document.getElementById('fl-row').value;
    const shelf = document.getElementById('fl-shelf').value;
    const loc = {
      id,
      zone,
      row,
      shelf,
      label: `${zone}-${row}-${shelf}`,
      description: document.getElementById('fl-desc').value,
    };
    DB.save('locations', loc);
    U.closeModal('modal-location');
    STOCK.renderLocations();
    U.toast('Emplacement créé', 'success');
  },

  showLocation(id) {
    const loc = DB.getById('locations', id);
    const products = DB.getAll('products').filter(p => p.location_id === id);
    U.toast(`${loc.label}: ${products.length} produit(s)`, 'info');
  },

  modalsHtml() {
    const locations = DB.getAll('locations');
    return `
    <!-- Modal mouvement stock -->
    <div class="modal-overlay" id="modal-move">
      <div class="modal-box modal-sm">
        <div class="modal-header">
          <div class="modal-title" id="modal-move-title">Mouvement</div>
          <button class="modal-close" onclick="U.closeModal('modal-move')">×</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="fm-product-id">
          <input type="hidden" id="fm-type">
          <div style="font-weight:700;font-size:16px;margin-bottom:4px" id="fm-product-name"></div>
          <div style="color:var(--text-muted);font-size:13px;margin-bottom:16px" id="fm-current-qty"></div>
          <div class="form-group"><label class="form-label">Quantité *</label><input class="form-control" id="fm-qty" type="number" min="0.01" step=".01" required></div>
          <div class="form-group"><label class="form-label">Motif</label><input class="form-control" id="fm-reason" placeholder="Ex: Intervention client Martin, Achat fournisseur..."></div>
          <div class="form-group"><label class="form-label">Référence</label><input class="form-control" id="fm-ref" placeholder="N° fiche, bon de livraison..."></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="U.closeModal('modal-move')">Annuler</button>
          <button class="btn btn-primary" onclick="STOCK.saveMove()">✅ Confirmer</button>
        </div>
      </div>
    </div>

    <!-- Modal scanner -->
    <div class="modal-overlay" id="modal-scanner">
      <div class="modal-box modal-sm">
        <div class="modal-header">
          <div class="modal-title">📷 Scanner QR / Code-barres</div>
          <button class="modal-close" onclick="STOCK.stopCamera()">×</button>
        </div>
        <div class="modal-body">
          <div style="position:relative;margin-bottom:16px">
            <video id="scanner-video" style="width:100%;border-radius:8px;background:#000" playsinline></video>
          </div>
          <div style="text-align:center;color:var(--text-muted);font-size:13px;margin-bottom:12px">— ou saisie manuelle —</div>
          <div style="display:flex;gap:8px">
            <input class="form-control" id="scanner-manual" placeholder="SKU ou code-barres..." onkeydown="if(event.key==='Enter')STOCK.scanManual()">
            <button class="btn btn-primary" onclick="STOCK.scanManual()">🔍</button>
          </div>
          <div id="scanner-result"></div>
        </div>
      </div>
    </div>

    <!-- Modal produit -->
    <div class="modal-overlay" id="modal-product">
      <div class="modal-box modal-lg">
        <div class="modal-header">
          <div class="modal-title" id="modal-product-title">Produit</div>
          <button class="modal-close" onclick="U.closeModal('modal-product')">×</button>
        </div>
        <form id="form-product" class="modal-body" onsubmit="event.preventDefault();STOCK.saveProduct()">
          <input type="hidden" id="fp2-id">
          <div class="form-row">
            <div class="form-group"><label class="form-label">SKU / Référence interne *</label><input class="form-control" id="fp2-sku" required placeholder="AQ-PMP-001"></div>
            <div class="form-group"><label class="form-label">Code-barres / EAN</label><input class="form-control" id="fp2-barcode" placeholder="3701234567890"></div>
          </div>
          <div class="form-group"><label class="form-label">Nom du produit *</label><input class="form-control" id="fp2-name" required></div>
          <div class="form-row-3">
            <div class="form-group"><label class="form-label">Catégorie</label>
              <select class="form-control" id="fp2-category">
                <option value="equipement">Équipements</option>
                <option value="traitement">Traitement eau</option>
                <option value="pieces">Pièces détachées</option>
                <option value="consommable">Consommables</option>
                <option value="construction">Construction</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Unité</label>
              <select class="form-control" id="fp2-unit">
                <option value="pce">Pièce</option>
                <option value="kg">Kilogramme</option>
                <option value="L">Litre</option>
                <option value="sac">Sac</option>
                <option value="bidon">Bidon</option>
                <option value="boite">Boîte</option>
                <option value="m">Mètre</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Type équipement</label>
              <select class="form-control" id="fp2-equip">
                <option value="universel">Universel</option>
                <option value="piscine">Piscine</option>
                <option value="spa">Spa</option>
                <option value="hammam">Hammam</option>
                <option value="sauna">Sauna</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Stock actuel</label><input class="form-control" id="fp2-qty" type="number" step=".01" min="0"></div>
            <div class="form-group"><label class="form-label">Stock minimum (alerte)</label><input class="form-control" id="fp2-qty-min" type="number" step=".01" min="0"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Prix achat HT (€)</label><input class="form-control" id="fp2-price-buy" type="number" step=".01" min="0"></div>
            <div class="form-group"><label class="form-label">Prix vente HT (€)</label><input class="form-control" id="fp2-price-sell" type="number" step=".01" min="0"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Marque</label><input class="form-control" id="fp2-brand" placeholder="Hayward, Zodiac..."></div>
            <div class="form-group"><label class="form-label">Référence fabricant</label><input class="form-control" id="fp2-ref-fab"></div>
          </div>
          <div class="form-group"><label class="form-label">Emplacement</label>
            <select class="form-control" id="fp2-location">
              <option value="">— Aucun emplacement —</option>
              ${locations.map(l=>`<option value="${l.id}">${l.label} — ${l.description}</option>`).join('')}
            </select>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="U.closeModal('modal-product')">Annuler</button>
          <button class="btn btn-primary" onclick="STOCK.saveProduct()">💾 Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Modal emplacement -->
    <div class="modal-overlay" id="modal-location">
      <div class="modal-box modal-sm">
        <div class="modal-header">
          <div class="modal-title">Nouvel emplacement</div>
          <button class="modal-close" onclick="U.closeModal('modal-location')">×</button>
        </div>
        <form id="form-location" class="modal-body" onsubmit="event.preventDefault();STOCK.saveLocation()">
          <input type="hidden" id="fl-id">
          <div style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Format: Zone - Rangée - Étagère (ex: A-1-1)</div>
          <div class="form-row-3">
            <div class="form-group"><label class="form-label">Zone</label><input class="form-control" id="fl-zone" placeholder="A" maxlength="2"></div>
            <div class="form-group"><label class="form-label">Rangée</label><input class="form-control" id="fl-row" placeholder="1"></div>
            <div class="form-group"><label class="form-label">Étagère</label><input class="form-control" id="fl-shelf" placeholder="1"></div>
          </div>
          <div class="form-group"><label class="form-label">Description</label><input class="form-control" id="fl-desc" placeholder="Ex: Pompes électriques"></div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="U.closeModal('modal-location')">Annuler</button>
          <button class="btn btn-primary" onclick="STOCK.saveLocation()">✅ Créer</button>
        </div>
      </div>
    </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// STATISTIQUES
// ═══════════════════════════════════════════════════════════
const STATS = {
  render() {
    const fiches = DB.getAll('fiches');
    const chantiers = DB.getAll('chantiers');
    const users = DB.getAll('users').filter(u => u.role === 'technicien');
    const el = document.getElementById('page-stats');

    const fichesByType = {};
    fiches.forEach(f => { fichesByType[f.type] = (fichesByType[f.type]||0) + 1; });
    const chantiersByState = {};
    chantiers.forEach(c => { chantiersByState[c.state] = (chantiersByState[c.state]||0) + 1; });
    const techStats = users.map(u => ({
      name: u.name,
      color: u.color,
      count: fiches.filter(f => f.technician_id === u.id).length,
    }));

    el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Statistiques</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><div class="card-title">📋 Fiches par type</div></div>
        <div class="card-body">
          ${Object.entries(fichesByType).map(([type, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
              <span>${U.FICHE_LABELS[type]||type}</span>
              <span style="font-weight:800;font-size:18px">${count}</span>
            </div>`).join('') || '<div style="color:var(--text-muted)">Aucune donnée</div>'}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🏗️ Chantiers par état</div></div>
        <div class="card-body">
          ${Object.entries(chantiersByState).map(([state, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
              <span>${U.stateBadge(state)}</span>
              <span style="font-weight:800;font-size:18px">${count}</span>
            </div>`).join('') || '<div style="color:var(--text-muted)">Aucune donnée</div>'}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">👷 Activité techniciens</div></div>
        <div class="card-body">
          ${techStats.map(t => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <div class="user-avatar" style="background:${t.color}">${U.initials(t.name)}</div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:13px">${t.name}</div>
                <div style="background:var(--bg);border-radius:4px;height:6px;margin-top:4px">
                  <div style="background:${t.color};width:${Math.min(100,(t.count/Math.max(...techStats.map(x=>x.count),1))*100)}%;height:6px;border-radius:4px"></div>
                </div>
              </div>
              <span style="font-weight:800">${t.count}</span>
            </div>`).join('') || '<div style="color:var(--text-muted)">Aucun technicien</div>'}
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="card-header"><div class="card-title">💰 CA chantiers facturés</div></div>
      <div class="card-body">
        <div style="font-size:40px;font-weight:900;color:var(--success)">${U.fmtEur(chantiers.filter(c=>c.state==='facture').reduce((s,c)=>s+(c.amount_ht||0),0))}</div>
        <div style="color:var(--text-muted);margin-top:4px">Total HT facturé · ${chantiers.filter(c=>c.state==='facture').length} chantiers</div>
        <div style="margin-top:12px;font-size:16px;font-weight:700;color:var(--accent)">
          En cours: ${U.fmtEur(chantiers.filter(c=>c.state==='en_cours').reduce((s,c)=>s+(c.amount_ht||0),0))}
        </div>
        <div style="margin-top:4px;font-size:16px;font-weight:700;color:var(--warning)">
          En devis: ${U.fmtEur(chantiers.filter(c=>c.state==='devis').reduce((s,c)=>s+(c.amount_ht||0),0))}
        </div>
      </div>
    </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// ÉQUIPE
// ═══════════════════════════════════════════════════════════
const EQUIPE = {
  render() {
    const users = DB.getAll('users');
    const el = document.getElementById('page-equipe');
    el.innerHTML = `
    <div class="page-header">
      <div class="page-title">Équipe</div>
      <button class="btn btn-primary" onclick="EQUIPE.openNew()">+ Nouvel utilisateur</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            ${users.map(u => `<tr>
              <td><div style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar" style="background:${u.color}">${U.initials(u.name)}</div>
                <div><div style="font-weight:600">${u.name}</div></div>
              </div></td>
              <td>${u.email}</td>
              <td>${U.stateBadge(u.role)}</td>
              <td>${u.active ? '<span style="color:var(--success);font-weight:700">● Actif</span>' : '<span style="color:var(--text-muted)">○ Inactif</span>'}</td>
              <td><button class="btn btn-ghost btn-sm" onclick="EQUIPE.openEdit('${u.id}')">✏️</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ${this.modalHtml()}`;
  },

  openNew() {
    document.getElementById('modal-user').classList.add('open');
    document.getElementById('modal-user-title').textContent = 'Nouvel utilisateur';
    document.getElementById('form-user').reset();
    document.getElementById('fu-id').value = '';
    document.getElementById('fu-active').checked = true;
    document.getElementById('fu-color').value = '#0ea5e9';
  },

  openEdit(id) {
    const u = DB.getById('users', id);
    if (!u) return;
    document.getElementById('modal-user').classList.add('open');
    document.getElementById('modal-user-title').textContent = 'Modifier utilisateur';
    document.getElementById('fu-id').value = u.id;
    document.getElementById('fu-name').value = u.name||'';
    document.getElementById('fu-email').value = u.email||'';
    document.getElementById('fu-password').value = u.password||'';
    document.getElementById('fu-role').value = u.role||'technicien';
    document.getElementById('fu-color').value = u.color||'#0ea5e9';
    document.getElementById('fu-active').checked = u.active !== false;
  },

  save() {
    const id = document.getElementById('fu-id').value || DB.genId();
    const user = {
      id,
      name: document.getElementById('fu-name').value,
      email: document.getElementById('fu-email').value,
      password: document.getElementById('fu-password').value,
      role: document.getElementById('fu-role').value,
      color: document.getElementById('fu-color').value,
      active: document.getElementById('fu-active').checked,
    };
    DB.save('users', user);
    U.closeModal('modal-user');
    EQUIPE.render();
    U.toast('Utilisateur enregistré', 'success');
  },

  modalHtml() {
    return `
    <div class="modal-overlay" id="modal-user">
      <div class="modal-box modal-sm">
        <div class="modal-header">
          <div class="modal-title" id="modal-user-title">Utilisateur</div>
          <button class="modal-close" onclick="U.closeModal('modal-user')">×</button>
        </div>
        <form id="form-user" class="modal-body" onsubmit="event.preventDefault();EQUIPE.save()">
          <input type="hidden" id="fu-id">
          <div class="form-group"><label class="form-label">Nom complet *</label><input class="form-control" id="fu-name" required></div>
          <div class="form-group"><label class="form-label">Email (identifiant) *</label><input class="form-control" id="fu-email" type="email" required></div>
          <div class="form-group"><label class="form-label">Mot de passe *</label><input class="form-control" id="fu-password" required placeholder="Min. 6 caractères"></div>
          <div class="form-group"><label class="form-label">Rôle *</label>
            <select class="form-control" id="fu-role" required>
              <option value="technicien">👷 Technicien</option>
              <option value="commercial">💼 Commercial</option>
              <option value="patron">👔 Patron</option>
              <option value="admin">⚙️ Administrateur</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Couleur</label><input class="form-control" id="fu-color" type="color"></div>
          <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="fu-active"> Compte actif</label></div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="U.closeModal('modal-user')">Annuler</button>
          <button class="btn btn-primary" onclick="EQUIPE.save()">💾 Enregistrer</button>
        </div>
      </div>
    </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// PARAMÈTRES
// ═══════════════════════════════════════════════════════════
const SETTINGS = {
  render() {
    const el = document.getElementById('page-settings');
    el.innerHTML = `
    <div class="page-header"><div class="page-title">Paramètres</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><div class="card-title">🔥 Configuration Firebase</div></div>
        <div class="card-body">
          ${DEMO_MODE ? '<div style="background:var(--warning)20;border:1px solid var(--warning)40;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:var(--warning)">⚠️ Mode démo actif — Les données sont stockées localement uniquement</div>' : '<div style="background:var(--success)20;border:1px solid var(--success)40;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:var(--success)">✅ Firebase connecté</div>'}
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Pour activer la synchronisation entre appareils, éditez le fichier <code>js/config.js</code> avec vos clés Firebase.</p>
          <div style="background:var(--bg);border-radius:8px;padding:12px;font-size:12px;font-family:monospace;color:var(--text-muted)">
            apiKey: "${FIREBASE_CONFIG.apiKey}"<br>
            projectId: "${FIREBASE_CONFIG.projectId}"
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🌙 Apparence</div></div>
        <div class="card-body">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0">
            <div><div style="font-weight:600">Mode sombre</div><div style="font-size:12px;color:var(--text-muted)">Interface en mode nuit</div></div>
            <label style="cursor:pointer">
              <input type="checkbox" id="dark-toggle" ${document.body.classList.contains('dark')?'checked':''} onchange="document.body.classList.toggle('dark',this.checked);localStorage.setItem('aquapro_dark',this.checked?'1':'0')">
            </label>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">💾 Données</div></div>
        <div class="card-body">
          <button class="btn btn-warning" onclick="SETTINGS.exportData()" style="width:100%;margin-bottom:10px">📥 Exporter toutes les données (JSON)</button>
          <button class="btn btn-danger" onclick="SETTINGS.resetDemo()" style="width:100%">🔄 Réinitialiser les données démo</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📧 EmailJS (envoi fiches)</div></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">Service ID</label><input class="form-control" id="ejs-service" value="${localStorage.getItem('ejs_service')||''}" placeholder="service_xxxxx"></div>
          <div class="form-group"><label class="form-label">Template ID</label><input class="form-control" id="ejs-template" value="${localStorage.getItem('ejs_template')||''}" placeholder="template_xxxxx"></div>
          <div class="form-group"><label class="form-label">Public Key</label><input class="form-control" id="ejs-key" value="${localStorage.getItem('ejs_key')||''}" placeholder="xxxxxxxxxxxxxxx"></div>
          <button class="btn btn-primary" onclick="SETTINGS.saveEmailJS()" style="width:100%">💾 Sauvegarder</button>
        </div>
      </div>
    </div>`;
  },

  exportData() {
    const data = {};
    ['users','clients','products','locations','stock_moves','chantiers','fiches','planning'].forEach(k => {
      data[k] = DB.getAll(k);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aquapro_backup_${U.today()}.json`;
    a.click();
    U.toast('Export téléchargé', 'success');
  },

  resetDemo() {
    if (!confirm('Réinitialiser toutes les données avec les données de démonstration ?')) return;
    localStorage.removeItem('aquapro_initialized');
    DB.initDemo();
    U.toast('Données réinitialisées', 'success');
    setTimeout(() => location.reload(), 1000);
  },

  saveEmailJS() {
    localStorage.setItem('ejs_service', document.getElementById('ejs-service').value);
    localStorage.setItem('ejs_template', document.getElementById('ejs-template').value);
    localStorage.setItem('ejs_key', document.getElementById('ejs-key').value);
    U.toast('EmailJS configuré', 'success');
  }
};

window.STOCK = STOCK;
window.STATS = STATS;
window.EQUIPE = EQUIPE;
window.SETTINGS = SETTINGS;
