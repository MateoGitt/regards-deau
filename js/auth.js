const AUTH = (() => {
  const SESSION_KEY = 'regards_session';

  const ROLES = {
    admin:      { label: 'Administrateur', level: 4 },
    patron:     { label: 'Patron',         level: 3 },
    commercial: { label: 'Commercial',     level: 2 },
    technicien: { label: 'Technicien',     level: 1 },
  };

  const ACCESS = {
    dashboard:  ['admin','patron','commercial','technicien'],
    planning:   ['admin','patron','technicien'],
    fiches:     ['admin','patron','technicien'],
    clients:    ['admin','patron','commercial'],
    chantiers:  ['admin','patron','commercial'],
    stock:      ['admin','patron'],
    stats:      ['admin','patron','commercial'],
    equipe:     ['admin','patron'],
    settings:   ['admin','patron'],
  };

  let currentUser = null;

  function login(email, password) {
    const users = DB.getAll('users');
    const user = users.find(u => u.email === email && u.password === password && u.active !== false);
    if (!user) return false;
    currentUser = user;
    // Sauvegarder avec expiration 30 jours
    const session = {
      uid: user.id,
      email: user.email,
      ts: Date.now(),
      exp: Date.now() + 30 * 24 * 3600 * 1000
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem(SESSION_KEY);
  }

  function checkSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      // Vérifier expiration
      if (!session.exp || Date.now() > session.exp) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      // Recharger l'utilisateur depuis la DB
      const users = DB.getAll('users');
      const user = users.find(u => u.id === session.uid && u.email === session.email);
      if (!user || user.active === false) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      currentUser = user;
      // Renouveler la session
      session.exp = Date.now() + 30 * 24 * 3600 * 1000;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    } catch(e) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
  }

  function getUser() { return currentUser; }

  function canAccess(page) {
    if (!currentUser) return false;
    return (ACCESS[page] || []).includes(currentUser.role);
  }

  function isAtLeast(role) {
    if (!currentUser) return false;
    return (ROLES[currentUser.role]?.level || 0) >= (ROLES[role]?.level || 0);
  }

  function getRoleLabel(role) {
    return ROLES[role]?.label || role;
  }

  return { login, logout, checkSession, getUser, canAccess, isAtLeast, getRoleLabel, ROLES, ACCESS };
})();

window.AUTH = AUTH;
