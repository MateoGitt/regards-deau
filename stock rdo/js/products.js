/* ============================================================
   products.js — Gestion des produits & catalogue
   ============================================================ */

var editProdId = null;

/* ── FILTRES ────────────────────────────────────────────── */
function fillProdFilters() {
  var selCat = document.getElementById('prod-cat');
  var selSup = document.getElementById('prod-sup');
  if (!selCat || !selSup) return;

  var curCat = selCat.value, curSup = selSup.value;

  selCat.innerHTML = '<option value="">Toutes categories</option>' +
    cats.map(function(c) { return '<option value="' + c.id + '"' + (c.id == curCat ? ' selected' : '') + '>' + c.name + '</option>'; }).join('');

  selSup.innerHTML = '<option value="">Tous fournisseurs</option>' +
    sups.map(function(s) { return '<option' + (s.name === curSup ? ' selected' : '') + '>' + s.name + '</option>'; }).join('');
}

/* ── RENDU TABLEAU ──────────────────────────────────────── */
function renderProd() {
  var q      = (document.getElementById('prod-srch')    ? document.getElementById('prod-srch').value    : '').toLowerCase();
  var cid    = parseInt(document.getElementById('prod-cat')    ? document.getElementById('prod-cat').value    : '') || 0;
  var sup    = document.getElementById('prod-sup')    ? document.getElementById('prod-sup').value    : '';
  var status = document.getElementById('prod-status') ? document.getElementById('prod-status').value : '';

  var list = prods.filter(function(p) {
    if (q && !(p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.sups||[]).join(' ').toLowerCase().includes(q))) return false;
    if (cid && p.cid !== cid) return false;
    if (sup && !(p.sups||[]).includes(sup)) return false;
    if (status && st(p) !== status) return false;
    return true;
  });

  var tb = document.getElementById('prod-tbody');
  if (!tb) return;

  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="8"><div class="es">' +
      '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>' +
      '<p>Aucun produit</p></div></td></tr>';
    return;
  }

  var editIco = svgIcon('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>');
  var upIco   = svgIcon('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>');
  var dnIco   = svgIcon('<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>');

  tb.innerHTML = list.map(function(p) {
    var s = st(p);
    var rowBg = s === 'out' ? 'background:rgba(220,38,38,.04)' : s === 'low' ? 'background:rgba(217,119,6,.04)' : '';
    var catColor = gcc(p.cid);
    var qtyColor = s === 'out' ? 'var(--re)' : s === 'low' ? 'var(--am)' : 'var(--gr)';

    return '<tr style="' + rowBg + '">' +
      '<td><span class="sku">' + p.sku + '</span></td>' +
      '<td><div style="font-weight:600">' + p.name + '</div>' + (p.loc ? '<div style="font-size:11px;color:var(--mut)">' + p.loc + '</div>' : '') + '</td>' +
      '<td><span style="font-size:12px;background:' + catColor + '22;color:' + catColor + ';padding:2px 9px;border-radius:20px;font-weight:600">' + gcn(p.cid) + '</span></td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (p.sups||[]).join(', ') + '</td>' +
      '<td style="font-weight:800;font-size:18px;color:' + qtyColor + '">' + p.qty + '<span style="font-size:11px;font-weight:400;color:var(--mut)"> u.</span></td>' +
      '<td style="font-size:12px;color:var(--mut)">' + p.thr + '</td>' +
      '<td>' + stBadge(p) + '</td>' +
      '<td><div class="acts">' +
        '<button class="btn ic sm" onclick="openEditProd(' + p.id + ')" title="Modifier">' + editIco + '</button>' +
        '<button class="btn ic sm" onclick="quickIn(' + p.id + ')" title="Entree rapide" style="color:var(--gr)">' + upIco + '</button>' +
        '<button class="btn ic sm" onclick="quickOut(' + p.id + ')" title="Sortie rapide" style="color:var(--re)">' + dnIco + '</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

/* ── MODAL PRODUIT ──────────────────────────────────────── */
function openAddProd() {
  editProdId = null;
  document.getElementById('mo-prod-title').textContent = 'Nouveau produit';
  document.getElementById('fp-del').style.display = 'none';
  ['fp-name','fp-sku','fp-sub','fp-loc','fp-notes'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('fp-qty').value = 0;
  document.getElementById('fp-thr').value = 0;
  document.getElementById('fp-stk').value = 'actif';
  fillMoPCat();
  fillMoPSups([]);
  openMo('mo-prod');
}

function openEditProd(id) {
  var p = prods.find(function(p) { return p.id === id; });
  if (!p) return;
  editProdId = id;
  document.getElementById('mo-prod-title').textContent = 'Modifier le produit';
  document.getElementById('fp-del').style.display = 'inline-flex';
  document.getElementById('fp-name').value  = p.name;
  document.getElementById('fp-sku').value   = p.sku;
  document.getElementById('fp-sub').value   = p.sub  || '';
  document.getElementById('fp-qty').value   = p.qty;
  document.getElementById('fp-thr').value   = p.thr;
  document.getElementById('fp-loc').value   = p.loc  || '';
  document.getElementById('fp-notes').value = p.notes|| '';
  document.getElementById('fp-stk').value   = p.stk  || 'actif';
  fillMoPCat(p.cid);
  fillMoPSups(p.sups || []);
  openMo('mo-prod');
}

function fillMoPCat(sel) {
  document.getElementById('fp-cat').innerHTML = cats.map(function(c) {
    return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + c.name + '</option>';
  }).join('');
}

function fillMoPSups(selected) {
  var wrap = document.getElementById('fp-sups');
  wrap.innerHTML = sups.map(function(s) {
    var checked = selected.includes(s.name);
    return '<label style="display:flex;align-items:center;gap:7px;padding:6px 0;cursor:pointer;font-size:13px">' +
      '<input type="checkbox" value="' + s.name + '"' + (checked ? ' checked' : '') + ' style="width:15px;height:15px">' +
      s.name + '</label>';
  }).join('');
}

function getSelectedSups() {
  var boxes = document.querySelectorAll('#fp-sups input[type="checkbox"]');
  var result = [];
  boxes.forEach(function(b) { if (b.checked) result.push(b.value); });
  return result;
}

function saveProd() {
  var name = document.getElementById('fp-name').value.trim();
  var sku  = document.getElementById('fp-sku').value.trim();
  if (!name || !sku) { toast('Nom et SKU obligatoires', 'er'); return; }

  var p = {
    id:    editProdId || nid++,
    name:  name,
    sku:   sku,
    cid:   parseInt(document.getElementById('fp-cat').value) || cats[0].id,
    sub:   document.getElementById('fp-sub').value.trim(),
    qty:   parseFloat(document.getElementById('fp-qty').value) || 0,
    thr:   parseFloat(document.getElementById('fp-thr').value) || 0,
    sups:  getSelectedSups(),
    loc:   document.getElementById('fp-loc').value.trim(),
    stk:   document.getElementById('fp-stk').value || 'actif',
    notes: document.getElementById('fp-notes').value.trim(),
  };

  if (editProdId) {
    var i = prods.findIndex(function(x) { return x.id === editProdId; });
    prods[i] = p;
  } else {
    prods.push(p);
  }
  sv(true); closeMo('mo-prod'); renderProd(); uAB();
  toast(editProdId ? 'Produit modifie' : 'Produit ajoute');
}

function delProd() {
  if (!confirm('Supprimer ce produit ?')) return;
  prods = prods.filter(function(p) { return p.id !== editProdId; });
  sv(true); closeMo('mo-prod'); renderProd(); uAB();
  toast('Produit supprime', 'er');
}

/* ── ENTRÉE / SORTIE RAPIDE ─────────────────────────────── */
function quickIn(id) {
  var q = parseFloat(prompt('Entree rapide — Quantite a ajouter :', '1'));
  if (isNaN(q) || q <= 0) return;
  var p = prods.find(function(p) { return p.id === id; });
  if (!p) return;
  p.qty += q;
  addMvt('in', p, q, 'Entree rapide', '');
  sv(true); renderProd(); uAB();
  toast('+' + q + ' — ' + p.name);
}

function quickOut(id) {
  var q = parseFloat(prompt('Sortie rapide — Quantite a retirer :', '1'));
  if (isNaN(q) || q <= 0) return;
  var p = prods.find(function(p) { return p.id === id; });
  if (!p) return;
  p.qty = Math.max(0, p.qty - q);
  addMvt('out', p, q, 'Sortie rapide', '');
  sv(true); renderProd(); uAB();
  toast('-' + q + ' — ' + p.name, 'wa');
}

/* ── EXPORT CSV ─────────────────────────────────────────── */
function exportProdCSV() {
  var h = ['SKU','Nom','Categorie','Sous-categorie','Fournisseurs','Stock','Seuil','Statut','Emplacement'];
  var rows = prods.map(function(p) {
    return [p.sku, p.name, gcn(p.cid), p.sub||'', (p.sups||[]).join(' / '), p.qty, p.thr, st(p), p.loc||''];
  });
  dlCSV([h].concat(rows), 'RegardsEau_Stock_' + new Date().toISOString().slice(0,10));
  toast('Export CSV OK');
}

/* ── IMPORT CSV ─────────────────────────────────────────── */
function openImportCSV() { openMo('mo-import'); }

function doImportCSV(inp) {
  var file = inp.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var lines = e.target.result.split('\n');
      var header = lines[0].split(';').map(function(h) { return h.replace(/^"|"$/g,'').trim().toLowerCase(); });
      var added = 0, updated = 0;
      for (var i = 1; i < lines.length; i++) {
        var row = lines[i].split(';').map(function(v) { return v.replace(/^"|"$/g,'').trim(); });
        if (!row[0]) continue;
        var sku = row[header.indexOf('sku')] || '';
        var nom = row[header.indexOf('nom')] || '';
        if (!sku || !nom) continue;

        var cat = cats.find(function(c) { return c.name.toLowerCase() === (row[header.indexOf('categorie')]||'').toLowerCase(); });
        var existing = prods.find(function(p) { return p.sku === sku; });

        var prod = {
          id:    existing ? existing.id : nid++,
          name:  nom,
          sku:   sku,
          cid:   cat ? cat.id : cats[0].id,
          sub:   row[header.indexOf('sous-categorie')] || '',
          qty:   parseFloat(row[header.indexOf('stock')]) || 0,
          thr:   parseFloat(row[header.indexOf('seuil')]) || 0,
          sups:  (row[header.indexOf('fournisseur')] || row[header.indexOf('fournisseurs')] || '').split('/').map(function(s){return s.trim();}).filter(Boolean),
          loc:   '',
          stk:   row[header.indexOf('statut')] || 'actif',
          notes: '',
        };

        if (existing) { prods[prods.indexOf(existing)] = prod; updated++; }
        else          { prods.push(prod); added++; }
      }
      sv(true); closeMo('mo-import'); renderProd(); uAB();
      toast(added + ' ajoute(s), ' + updated + ' modifie(s)');
    } catch(err) {
      toast('Erreur lecture CSV', 'er');
      console.error(err);
    }
    inp.value = '';
  };
  reader.readAsText(file, 'utf-8');
}

/* ── HELPER CSV ─────────────────────────────────────────── */
function dlCSV(rows, filename) {
  var csv = rows.map(function(r) {
    return r.map(function(v) { return '"' + String(v||'').replace(/"/g,'""') + '"'; }).join(';');
  }).join('\n');
  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '.csv';
  a.click();
}
