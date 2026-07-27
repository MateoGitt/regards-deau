/* ============================================================
   app.js — Point d'entrée, initialisation, démarrage
   ============================================================ */

function startApp() {
  // Afficher les infos utilisateur dans la sidebar
  var sbUser = document.getElementById('sb-user');
  if (sbUser && currentUser) {
    sbUser.innerHTML =
      '<div class="sb-av">' + initials(currentUser.full || currentUser.name) + '</div>' +
      '<div><div class="sb-uname">' + (currentUser.full || currentUser.name) + '</div>' +
      '<div class="sb-urole">' + roleLabel(currentUser.role) + '</div></div>';
  }

  // Responsive : bouton menu mobile
  var menuBtn = document.getElementById('menu-btn');
  function checkMobile() {
    if (menuBtn) menuBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  }
  checkMobile();
  window.addEventListener('resize', checkMobile);

  // Modals
  initModals();

  // Afficher la page d'accueil
  showPage('dash');
  uAB();
  rBB('bbanner');

  // Mise à jour périodique du badge alertes
  setInterval(uAB, 60000);
}

/* ── POINT D'ENTRÉE ─────────────────────────────────────── */
window.addEventListener('load', function() {
  // Dark mode
  if (localStorage.getItem(CFG.DK)) document.body.classList.add('dark');

  // Initialiser les données
  initData();

  // Vérifier session
  if (checkSession()) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    startApp();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    setTimeout(function() {
      var lu = document.getElementById('login-user');
      if (lu) lu.focus();
    }, 100);
  }
});
