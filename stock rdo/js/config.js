/* ============================================================
   config.js — Constantes, clés de stockage, données initiales
   ============================================================ */

/* hashPwd défini ici en premier car utilisé dans DEFAULTS_USERS */
function hashPwd(p) {
  var h = 0;
  for (var i = 0; i < p.length; i++) {
    h = ((h << 5) - h) + p.charCodeAt(i);
    h |= 0;
  }
  return 'h' + Math.abs(h).toString(36);
}

var CFG = {
  SK:      'rd_stock_v2',      // Clé données principales
  UK:      'rd_users_v2',      // Clé utilisateurs
  SK_SES:  'rd_session_v2',    // Clé session
  BLK:     'rd_bak_log_v2',    // Clé historique sauvegardes
  LBK:     'rd_last_bak_v2',   // Clé date dernière sauvegarde
  DK:      'rd_dark_v2',       // Clé mode sombre
  APP:     "Regards d'eau — Gestion de stock",
  VERSION: '2.0',
  EMAIL:   'info@regards-deau.be',
};

/* Données initiales (premier lancement) */
var DEFAULTS = {
  cats: [
    { id:1, name:'Equipements piscine',  color:'#4BA3C3', subs:['Pompes','Filtres','Robots','Volets','Chauffage'] },
    { id:2, name:'Traitement eau',       color:'#059669', subs:['Chlore','Brome','Sel','pH','Algicide'] },
    { id:3, name:'Spa & Jacuzzi',        color:'#7C3AED', subs:['Pompes spa','Produits spa','Accessoires'] },
    { id:4, name:'Hammam & Sauna',       color:'#D97706', subs:['Generateurs','Bancs','Accessoires'] },
    { id:5, name:'Construction',         color:'#6B7280', subs:['Liner','Coque','Beton','Plomberie'] },
    { id:6, name:'Pieces detachees',     color:'#DC2626', subs:['Joints','Filtres','Vannes'] },
  ],
  sups: [
    { id:1, name:'SCP Benelux',    contact:'',phone:'',email:'',web:'www.scpeurope.com',   notes:'' },
    { id:2, name:'Hayward',        contact:'',phone:'',email:'',web:'www.hayward.fr',       notes:'' },
    { id:3, name:'Bayrol',         contact:'',phone:'',email:'',web:'www.bayrol.fr',        notes:'' },
    { id:4, name:'Zodiac',         contact:'',phone:'',email:'',web:'www.zodiac.com',       notes:'' },
    { id:5, name:'Astral Pool',    contact:'',phone:'',email:'',web:'www.astralpool.com',   notes:'' },
    { id:6, name:'Tylo',           contact:'',phone:'',email:'',web:'www.tylo.com',         notes:'Specialiste sauna' },
  ],
  prods: [
    { id:1,  name:"Pompe Hayward Super Pump 1.5cv", sku:'PMP-001', cid:1, sub:'Pompes',         qty:5,  thr:2, sups:['Hayward'],   loc:'Zone A-01', stk:'actif', notes:'' },
    { id:2,  name:"Robot Zodiac CX20",              sku:'ROB-001', cid:1, sub:'Robots',         qty:3,  thr:1, sups:['Zodiac'],    loc:'Zone B-01', stk:'actif', notes:'' },
    { id:3,  name:"Chlore choc granules 5kg",       sku:'CHL-001', cid:2, sub:'Chlore',         qty:24, thr:5, sups:['Bayrol','SCP Benelux'], loc:'Zone C-01', stk:'actif', notes:'' },
    { id:4,  name:"pH moins liquide 5L",            sku:'PHM-001', cid:2, sub:'pH',             qty:1,  thr:4, sups:['Bayrol'],   loc:'Zone C-02', stk:'actif', notes:'' },
    { id:5,  name:"Filtre sable Astral D400",       sku:'FLT-001', cid:1, sub:'Filtres',        qty:2,  thr:1, sups:['Astral Pool'], loc:'Zone A-02', stk:'actif', notes:'' },
    { id:6,  name:"Sel electrolyseur 25kg",         sku:'SEL-001', cid:2, sub:'Sel',            qty:0,  thr:3, sups:['Bayrol'],   loc:'Zone C-03', stk:'actif', notes:'' },
    { id:7,  name:"Generateur hammam Tylo 6kW",     sku:'HAM-001', cid:4, sub:'Generateurs',    qty:1,  thr:1, sups:['Tylo'],     loc:'Zone D-01', stk:'actif', notes:'' },
    { id:8,  name:"Brome comprime 1kg",             sku:'BRM-001', cid:3, sub:'Produits spa',   qty:8,  thr:3, sups:['Bayrol'],   loc:'Zone C-04', stk:'actif', notes:'' },
  ],
  mvts:  [],
  nid:   9,   // Prochain ID produit
  nmid:  1,   // Prochain ID mouvement
  ncid:  7,   // Prochain ID catégorie
  nsid:  7,   // Prochain ID fournisseur
};

var DEFAULTS_USERS = [
  { id:1, name:'admin', full:'Administrateur', pwd: hashPwd('admin123'), role:'admin' },
];
