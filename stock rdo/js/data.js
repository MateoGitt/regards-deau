/* ============================================================
   data.js — Chargement, sauvegarde, variables globales
   ============================================================ */

/* Variables globales */
var cats, sups, prods, mvts;
var nid, nmid, ncid, nsid;
var users;
var currentUser = null;

/* ── CHARGEMENT ─────────────────────────────────────────── */
function loadData() {
  try {
    var d = JSON.parse(localStorage.getItem(CFG.SK));
    if (d && d.prods) return d;
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULTS)); // copie profonde
}

function loadUsers() {
  try {
    var u = JSON.parse(localStorage.getItem(CFG.UK));
    if (u && u.length) return u;
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULTS_USERS));
}

/* ── SAUVEGARDE ─────────────────────────────────────────── */
function sv(silent) {
  localStorage.setItem(CFG.SK, JSON.stringify({ cats, sups, prods, mvts, nid, nmid, ncid, nsid }));
  localStorage.setItem(CFG.UK, JSON.stringify(users));
  updSaveStatus();
  if (!silent) toast('Sauvegarde OK', 'ok');
}

function saveUsers(u) {
  users = u;
  localStorage.setItem(CFG.UK, JSON.stringify(users));
}

function updSaveStatus() {
  var el = document.getElementById('savest');
  if (el) el.textContent = 'Sauvegarde a ' + new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

/* ── INITIALISATION ─────────────────────────────────────── */
function initData() {
  var d = loadData();
  cats  = d.cats;
  sups  = d.sups;
  prods = d.prods;
  mvts  = d.mvts;
  nid   = d.nid;
  nmid  = d.nmid;
  ncid  = d.ncid;
  nsid  = d.nsid;
  users = loadUsers();
}

/* ── UTILITAIRES ────────────────────────────────────────── */
function fc(n) {
  return Number(n || 0).toLocaleString('fr-FR');
}

function fd(d) {
  return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function fds(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function gcn(id) {
  var c = cats.find(function(c) { return c.id === id; });
  return c ? c.name : '--';
}

function gcc(id) {
  var c = cats.find(function(c) { return c.id === id; });
  return c ? c.color : '#4BA3C3';
}

/* Statut de stock d'un produit */
function st(p) {
  if (p.stk === 'surcommande' || p.stk === 'discontinue') return p.stk;
  if (p.qty === 0) return 'out';
  if (p.qty <= p.thr) return 'low';
  return 'ok';
}

/* Badge HTML statut */
function stBadge(p) {
  if (p.stk === 'surcommande') return '<span class="badge" style="background:var(--bll);color:var(--bl)">Sur commande</span>';
  if (p.stk === 'discontinue') return '<span class="badge" style="background:var(--sur2);color:var(--mut)">Discontinue</span>';
  var s = st(p);
  if (s === 'out') return '<span class="badge bout">Rupture</span>';
  if (s === 'low') return '<span class="badge blow">Stock bas</span>';
  return '<span class="badge bok">OK</span>';
}

/* Icône SVG helper */
function svgIcon(path, size) {
  size = size || 13;
  return '<svg viewBox="0 0 24 24" style="width:'+size+'px;height:'+size+'px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">'+path+'</svg>';
}

/* Mettre à jour le badge alertes dans le nav */
function uAB() {
  var n = prods.filter(function(p) {
    var s = st(p);
    return s === 'out' || s === 'low';
  }).length;
  var el = document.getElementById('alrcnt');
  if (el) { el.textContent = n; el.style.display = n > 0 ? 'inline' : 'none'; }
}

/* Initiales */
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
}

/* Role label */
function roleLabel(r) {
  return { admin:'Administrateur', patron:'Patron', magasinier:'Magasinier', technicien:'Technicien' }[r] || r;
}
