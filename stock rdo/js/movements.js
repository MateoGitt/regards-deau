/* ============================================================
   movements.js — Mouvements de stock (entrées / sorties / ajustements)
   ============================================================ */

var curMvtType = 'in';

/* ── INITIALISATION ─────────────────────────────────────── */
function fillMvtProd() {
  var sel = document.getElementById('mvt-prod');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Choisir un produit --</option>' +
    prods.map(function(p) {
      return '<option value="' + p.id + '">' + p.name + ' — ' + p.qty + ' u. (' + p.sku + ')</option>';
    }).join('');
}

/* ── TYPE DE MOUVEMENT ──────────────────────────────────── */
function setMvtType(t) {
  curMvtType = t;
  ['in','out','adj'].forEach(function(x) {
    var btn = document.getElementById('mvt-' + x);
    if (btn) btn.classList.toggle('on', x === t);
  });
  // Afficher/masquer champ destination selon le type
  var destField = document.getElementById('mvt-dest-field');
  if (destField) destField.style.display = (t === 'out') ? 'block' : 'none';
}

/* ── ENREGISTRER UN MOUVEMENT ───────────────────────────── */
function saveMvt() {
  var pid  = parseInt(document.getElementById('mvt-prod').value);
  var qty  = parseFloat(document.getElementById('mvt-qty').value) || 0;
  var ref  = document.getElementById('mvt-ref')  ? document.getElementById('mvt-ref').value.trim()  : '';
  var note = document.getElementById('mvt-note') ? document.getElementById('mvt-note').value.trim() : '';
  var dest = document.getElementById('mvt-dest') ? document.getElementById('mvt-dest').value.trim() : '';

  if (!pid || qty <= 0) { toast('Produit et quantite obligatoires', 'er'); return; }

  var p = prods.find(function(p) { return p.id === pid; });
  if (!p) return;

  if (curMvtType === 'in') {
    p.qty += qty;
  } else if (curMvtType === 'out') {
    if (p.qty < qty && !confirm('Stock insuffisant (' + p.qty + ' disponible). Continuer quand meme ?')) return;
    p.qty = Math.max(0, p.qty - qty);
  } else {
    // Ajustement : on fixe la quantité
    p.qty = qty;
  }

  addMvt(curMvtType, p, qty, ref, note, dest);
  sv(true);

  // Reset form
  document.getElementById('mvt-qty').value = '';
  if (document.getElementById('mvt-ref'))  document.getElementById('mvt-ref').value  = '';
  if (document.getElementById('mvt-note')) document.getElementById('mvt-note').value = '';
  if (document.getElementById('mvt-dest')) document.getElementById('mvt-dest').value = '';

  fillMvtProd();
  renderMvtHist();
  uAB();

  var msg = curMvtType === 'in'  ? '+' + qty + ' — ' + p.name :
            curMvtType === 'out' ? '-' + qty + ' — ' + p.name :
            'Stock ajuste a ' + qty + ' — ' + p.name;
  toast(msg, curMvtType === 'out' ? 'wa' : 'ok');
}

/* ── AJOUTER AU TABLEAU DES MOUVEMENTS ──────────────────── */
function addMvt(type, p, qty, ref, note, dest) {
  mvts.push({
    id:       nmid++,
    date:     new Date().toISOString(),
    type:     type,
    pid:      p.id,
    pname:    p.name,
    psku:     p.sku,
    qty:      qty,
    qtyAfter: p.qty,
    ref:      ref  || '',
    note:     note || '',
    dest:     dest || '',
    user:     currentUser ? currentUser.full || currentUser.name : '',
  });
}

/* ── HISTORIQUE RÉCENT (page mouvements) ────────────────── */
function renderMvtHist() {
  var list = mvts.slice().reverse().slice(0, 50);
  var tb   = document.getElementById('mvt-tbody');
  if (!tb) return;

  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="9"><div class="es"><p>Aucun mouvement enregistre</p></div></td></tr>';
    return;
  }

  tb.innerHTML = list.map(function(m) {
    var col  = m.type === 'in' ? 'var(--gr)' : m.type === 'out' ? 'var(--re)' : 'var(--am)';
    var sign = m.type === 'in' ? '+' : m.type === 'out' ? '-' : '';
    var badge = m.type === 'in'
      ? '<span class="badge bok">Entree</span>'
      : m.type === 'out'
      ? '<span class="badge bout">Sortie</span>'
      : '<span class="badge blow">Ajust.</span>';
    return '<tr>' +
      '<td style="font-size:12px;color:var(--mut);white-space:nowrap">' + fd(m.date) + '</td>' +
      '<td style="font-weight:500">' + m.pname + '</td>' +
      '<td>' + badge + '</td>' +
      '<td style="font-weight:700;color:' + col + '">' + sign + m.qty + '</td>' +
      '<td style="font-family:monospace">' + m.qtyAfter + '</td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (m.dest || '--') + '</td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (m.ref  || '--') + '</td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (m.note || '--') + '</td>' +
      '<td style="font-size:12px;color:var(--mut)">' + (m.user || '--') + '</td>' +
    '</tr>';
  }).join('');
}
