/* ============================================================
   auth.js — Authentification et gestion de session
   ============================================================ */

/* ── CONNEXION ──────────────────────────────────────────── */
function doLogin(e) {
  if (e) e.preventDefault();
  var name = document.getElementById('login-user').value.trim();
  var pass = document.getElementById('login-pass').value;
  var err  = document.getElementById('login-error');
  err.style.display = 'none';

  if (!name || !pass) {
    err.textContent = 'Remplissez tous les champs.';
    err.style.display = 'block';
    return;
  }

  var u = users.find(function(u) { return u.name === name && u.pwd === hashPwd(pass); });
  if (!u) {
    err.textContent = 'Identifiant ou mot de passe incorrect.';
    err.style.display = 'block';
    document.getElementById('login-pass').value = '';
    return;
  }

  currentUser = u;
  var session = { uid: u.id, name: u.name, exp: Date.now() + 30 * 24 * 3600 * 1000 };
  localStorage.setItem(CFG.SK_SES, JSON.stringify(session));

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  startApp();
}

/* ── SESSION ────────────────────────────────────────────── */
function checkSession() {
  try {
    var s = JSON.parse(localStorage.getItem(CFG.SK_SES) || 'null');
    if (!s || Date.now() > s.exp) return false;
    var u = users.find(function(u) { return u.id === s.uid && u.name === s.name; });
    if (!u) return false;
    currentUser = u;
    s.exp = Date.now() + 30 * 24 * 3600 * 1000;
    localStorage.setItem(CFG.SK_SES, JSON.stringify(s));
    return true;
  } catch(e) { return false; }
}

/* ── DÉCONNEXION ────────────────────────────────────────── */
function doLogout() {
  if (!confirm('Se deconnecter ?')) return;
  localStorage.removeItem(CFG.SK_SES);
  location.reload();
}

/* ── AFFICHER / CACHER MOT DE PASSE ────────────────────── */
function togglePwd() {
  var i   = document.getElementById('login-pass');
  var svg = document.getElementById('eye-icon');
  if (i.type === 'password') {
    i.type = 'text';
    svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    i.type = 'password';
    svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

/* ── MOT DE PASSE OUBLIÉ ────────────────────────────────── */
function sendForgot() {
  var email = document.getElementById('forgot-email').value.trim();
  if (!email) { alert('Veuillez saisir votre identifiant.'); return; }
  var s = encodeURIComponent('Reinitialisation mot de passe - Regards eau Stock');
  var b = encodeURIComponent('Bonjour,\n\nL\'utilisateur "' + email + '" demande une reinitialisation de mot de passe.\n\nCordialement');
  window.location.href = 'mailto:' + CFG.EMAIL + '?subject=' + s + '&body=' + b;
}

/* ── FORMULAIRE INSCRIPTION ─────────────────────────────── */
function toggleRegister() {
  var f = document.getElementById('register-form');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function doRegister() {
  var full     = (document.getElementById('reg-full') || {value:''}).value.trim();
  var username = (document.getElementById('reg-user') || {value:''}).value.trim().toLowerCase();
  var pass     = (document.getElementById('reg-pass') || {value:''}).value;
  var role     = (document.getElementById('reg-role') || {value:'user'}).value;
  var err      = document.getElementById('reg-error');
  if (err) err.style.display = 'none';

  if (!full || !username || !pass) {
    if (err) { err.textContent = 'Tous les champs sont obligatoires.'; err.style.display = 'block'; } return;
  }
  if (pass.length < 6) {
    if (err) { err.textContent = 'Mot de passe minimum 6 caracteres.'; err.style.display = 'block'; } return;
  }
  if (users.find(function(u) { return u.name === username; })) {
    if (err) { err.textContent = 'Identifiant deja utilise.'; err.style.display = 'block'; } return;
  }

  var newId = users.reduce(function(max, u) { return Math.max(max, u.id); }, 0) + 1;
  users.push({ id: newId, name: username, full: full, pwd: hashPwd(pass), role: role });
  saveUsers(users);

  var rf = document.getElementById('register-form');
  if (rf) rf.style.display = 'none';
  var lu = document.getElementById('login-user');
  if (lu) lu.value = username;
  var lerr = document.getElementById('login-error');
  if (lerr) {
    lerr.textContent = 'Compte cree ! Connectez-vous.';
    lerr.style.color = '#059669';
    lerr.style.display = 'block';
    setTimeout(function() { lerr.style.display = 'none'; lerr.style.color = ''; }, 4000);
  }
}
