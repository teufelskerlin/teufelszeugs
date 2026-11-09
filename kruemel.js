/* Krümels Lernwelt – gemeinsamer Kern für alle Trainer.
   Neue Trainer: in TRAINERS eintragen, Datei anlegen, Kruemel.award() aufrufen (siehe README). */
(function(){
"use strict";
const K = window.Kruemel = {};

// =====================================================================
// Trainer-Verzeichnis – hier neue Trainer ergänzen
// =====================================================================
K.TRAINERS = [
  { id:"irregular-verbs", subject:"Englisch", title:"Irregular verbs",
    desc:"Infinitive, simple past und Deutsch", path:"englisch-irregular-verbs.html",
    total:89, reward:"ukcap" }
];
// Fächer, die ein Tier als Lieblingsfach haben kann (auch künftige)
const SUBJECTS = [...new Set(K.TRAINERS.map(t=>t.subject).concat(["Mathe","Musik"]))];

// =====================================================================
// Einstellungen
// =====================================================================
K.DAILY_GOAL = 20;
K.TRAINER_DAILY_FULL = 40;
K.MASTERY = 3;
const FAV_BONUS = 1.2;  // +20 % XP im Lieblingsfach des aktiven Tiers
const COIN = {correct:1, combo5:3, fixed:3, dailyGoal:10, stageUp:20};
const SCHEMA = 2;
const PROFILE_KEY = "kruemel:profile";
const TKEY = id => "kruemel:trainer:" + id;
const LEGACY_GAME = "irregular-verbs-game-v1", LEGACY_MISTAKES = "irregular-verbs-mistakes-v1";

// Wachstumsstufen von Krümel (Ur-Monster)
const STAGES = K.STAGES = [
  {xp:0, name:"Ei"}, {xp:60, name:"Frisch geschlüpft"}, {xp:200, name:"Baby"}, {xp:450, name:"Kind"},
  {xp:850, name:"Teenie"}, {xp:1400, name:"Groß und stark"}, {xp:2200, name:"Legende"}
];
const COLORS = ["#F3EBDD","#9BE0C0","#6CCCA8","#5DB8D6","#7D95F7","#A47BF5","#F4B93A"];

// =====================================================================
// Speicher und Datum
// =====================================================================
const read = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const write = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } };
const dayStr = (d=new Date()) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const daysBetween = (a,b) => Math.round((new Date(b+"T12:00")-new Date(a+"T12:00"))/86400000);
const today = () => dayStr();
const pick = a => a[Math.floor(Math.random()*a.length)];

// =====================================================================
// Accessoires (Kleiderschrank – bisher nur für Krümel)
// =====================================================================
const SLOTS = K.SLOTS = [["head","Auf den Kopf"],["eyes","Für die Augen"],["neck","Um den Hals"],["extra","Extras"]];
const SW = 'stroke="currentColor" stroke-linejoin="round"';
const heart = (cx,cy) => `M${cx} ${cy+9} C${cx-15} ${cy} ${cx-12} ${cy-13} ${cx} ${cy-5} C${cx+12} ${cy-13} ${cx+15} ${cy} ${cx} ${cy+9}Z`;
const ITEMS = [
  {id:"cap", slot:"head", name:"Basecap", price:15, svg:`<path d="M-28 -84 C-28 -114 28 -114 28 -84 Z" fill="#E74C3C" ${SW} stroke-width="3"/><path d="M20 -86 q22 -4 26 2 q-4 6 -26 4 z" fill="#C0392B" ${SW} stroke-width="3"/><circle cx="0" cy="-109" r="4" fill="#C0392B"/>`},
  {id:"bow", slot:"head", name:"Schleife", price:15, svg:`<path d="M20 -86 l-16 -12 l0 22 z M20 -86 l16 -12 l0 22 z" fill="#FF7EB6" ${SW} stroke-width="3"/><circle cx="20" cy="-86" r="5" fill="#E84393" stroke="currentColor" stroke-width="2.5"/>`},
  {id:"party", slot:"head", name:"Partyhut", price:25, svg:`<path d="M-16 -86 L0 -128 L16 -86 Z" fill="#FDCB6E" ${SW} stroke-width="3"/><path d="M-10 -99 l17 -6 M-5 -112 l10 -4" stroke="#E84393" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-130" r="6" fill="#E84393" stroke="currentColor" stroke-width="2.5"/>`},
  {id:"phones", slot:"head", name:"Kopfhörer", price:40, minStage:2, svg:`<path d="M-44 -56 C-46 -114 46 -114 44 -56" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><rect x="-55" y="-68" width="16" height="27" rx="7" fill="#00B894" stroke="currentColor" stroke-width="3"/><rect x="39" y="-68" width="16" height="27" rx="7" fill="#00B894" stroke="currentColor" stroke-width="3"/>`},
  {id:"wizard", slot:"head", name:"Zauberhut", price:70, minStage:4, svg:`<path d="M-20 -88 L6 -144 L22 -88 Z" fill="#6C5CE7" ${SW} stroke-width="3"/><ellipse cx="0" cy="-88" rx="34" ry="7" fill="#6C5CE7" stroke="currentColor" stroke-width="3"/><path d="M5 -122 l2.5 5 l5.5 1 l-4 4 l1 5.5 l-5 -2.5 l-5 2.5 l1 -5.5 l-4 -4 l5.5 -1z" fill="#FDCB6E"/>`},
  {id:"sun", slot:"eyes", name:"Sonnenbrille", price:20, svg:`<rect x="-28" y="-58" width="23" height="15" rx="5" fill="#1B2F6E" stroke="currentColor" stroke-width="2.5"/><rect x="5" y="-58" width="23" height="15" rx="5" fill="#1B2F6E" stroke="currentColor" stroke-width="2.5"/><path d="M-5 -53 h10 M-28 -54 l-15 -4 M28 -54 l15 -4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M-24 -54 l7 -2 M9 -54 l7 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`},
  {id:"nerd", slot:"eyes", name:"Nerd-Brille", price:20, svg:`<circle cx="-15" cy="-50" r="11" fill="#fff" fill-opacity=".25" stroke="currentColor" stroke-width="3"/><circle cx="15" cy="-50" r="11" fill="#fff" fill-opacity=".25" stroke="currentColor" stroke-width="3"/><path d="M-4 -51 h8 M-26 -52 l-17 -3 M26 -52 l17 -3" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`},
  {id:"patch", slot:"eyes", name:"Augenklappe", price:30, svg:`<path d="M-44 -72 L44 -44" stroke="currentColor" stroke-width="3"/><ellipse cx="15" cy="-50" rx="11" ry="10" fill="#2D3436" stroke="currentColor" stroke-width="2.5"/>`},
  {id:"hearts", slot:"eyes", name:"Herzbrille", price:35, minStage:2, svg:`<path d="${heart(-15,-51)} ${heart(15,-51)}" fill="#FF4F8B" ${SW} stroke-width="2.5"/><path d="M-4 -52 h8 M-28 -53 l-15 -3 M28 -53 l15 -3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`},
  {id:"bowtie", slot:"neck", name:"Fliege", price:15, svg:`<path d="M0 -14 l-16 -9 v18 z M0 -14 l16 -9 v18 z" fill="#E84393" ${SW} stroke-width="3"/><circle cx="0" cy="-14" r="4.5" fill="#C0306F" stroke="currentColor" stroke-width="2.5"/>`},
  {id:"bandana", slot:"neck", name:"Halstuch", price:20, svg:`<path d="M-34 -22 Q0 -12 34 -22 L0 4 Z" fill="#0984E3" ${SW} stroke-width="3"/><circle cx="-7" cy="-12" r="2" fill="#fff"/><circle cx="8" cy="-9" r="2" fill="#fff"/><circle cx="1" cy="-3" r="2" fill="#fff"/>`},
  {id:"scarf", slot:"neck", name:"Schal", price:25, svg:`<path d="M22 -16 l5 24 l11 -2 l-5 -24 z" fill="#E17055" ${SW} stroke-width="3"/><path d="M-42 -25 Q0 -9 42 -25 L42 -15 Q0 1 -42 -15 Z" fill="#E17055" ${SW} stroke-width="3"/><path d="M-28 -20 v8 M-12 -16 v8 M4 -15 v8 M20 -18 v8" stroke="#FAB1A0" stroke-width="3"/>`},
  {id:"chain", slot:"neck", name:"Goldkette", price:55, minStage:3, svg:`<path d="M-30 -26 Q0 -2 30 -26" fill="none" stroke="#F4B93A" stroke-width="5" stroke-dasharray="0.1 6" stroke-linecap="round"/><circle cx="0" cy="-10" r="8" fill="#F4B93A" stroke="currentColor" stroke-width="2.5"/><circle cx="-2" cy="-12" r="3" fill="#fff" opacity=".6"/>`},
  {id:"flower", slot:"extra", name:"Blume", price:15, svg:`<path d="M40 -22 Q48 -40 50 -52" fill="none" stroke="#2E7D4F" stroke-width="3"/><g fill="#FF7EB6" stroke="currentColor" stroke-width="2"><circle cx="50" cy="-63" r="5"/><circle cx="58" cy="-57" r="5"/><circle cx="55" cy="-48" r="5"/><circle cx="45" cy="-48" r="5"/><circle cx="42" cy="-57" r="5"/></g><circle cx="50" cy="-55" r="4" fill="#FDCB6E" stroke="currentColor" stroke-width="2"/>`},
  {id:"balloon", slot:"extra", name:"Luftballon", price:25, svg:`<path d="M40 -24 Q52 -50 47 -78" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="48" cy="-95" rx="13" ry="16" fill="#E74C3C" stroke="currentColor" stroke-width="2.5"/><path d="M44 -79 l4 -2 l4 2 z" fill="#E74C3C" ${SW} stroke-width="2"/><ellipse cx="43" cy="-100" rx="3" ry="5" fill="#fff" opacity=".5"/>`},
  {id:"skate", slot:"extra", name:"Skateboard", price:45, minStage:3, layer:"under", svg:`<rect x="-46" y="2" width="92" height="7" rx="3.5" fill="#E17055" stroke="currentColor" stroke-width="2.5"/><circle cx="-29" cy="13" r="4.5" fill="#636E72" stroke="currentColor" stroke-width="2"/><circle cx="29" cy="13" r="4.5" fill="#636E72" stroke="currentColor" stroke-width="2"/>`},
  {id:"wand", slot:"extra", name:"Zauberstab", price:60, minStage:4, svg:`<path d="M38 -24 L60 -60" stroke="#2D3436" stroke-width="4" stroke-linecap="round"/><path d="M62 -78 l3.5 7 l7.5 1.5 l-5.5 5 l1.5 7.5 l-7 -3.5 l-7 3.5 l1.5 -7.5 l-5.5 -5 l7.5 -1.5z" fill="#FDCB6E" ${SW} stroke-width="2"/>`}
];

ITEMS.push(
  {id:"ukcap", slot:"head", name:"London-Cap", reward:"irregular-verbs", svg:`<path d="M-28 -84 C-28 -114 28 -114 28 -84 Z" fill="#1F3A93" stroke="currentColor" stroke-linejoin="round" stroke-width="3"/><path d="M0 -110 V-86 M-25 -95 H25" stroke="#fff" stroke-width="7"/><path d="M0 -110 V-86 M-25 -95 H25" stroke="#D63031" stroke-width="3"/><path d="M20 -86 q22 -4 26 2 q-4 6 -26 4 z" fill="#D63031" stroke="currentColor" stroke-linejoin="round" stroke-width="3"/>`}
);

ITEMS.push(
  {id:"ukcap", slot:"head", name:"London-Cap", reward:"irregular-verbs", svg:`<path d="M-28 -84 C-28 -114 28 -114 28 -84 Z" fill="#1F3A93" stroke="currentColor" stroke-linejoin="round" stroke-width="3"/><path d="M0 -110 V-86 M-25 -95 H25" stroke="#fff" stroke-width="7"/><path d="M0 -110 V-86 M-25 -95 H25" stroke="#D63031" stroke-width="3"/><path d="M20 -86 q22 -4 26 2 q-4 6 -26 4 z" fill="#D63031" stroke="currentColor" stroke-linejoin="round" stroke-width="3"/>`}
);
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i=>[i.id,i]));
K.ITEMS = ITEMS;

// Krümel zeichnen
function petSVG(stage, mood, wear={}, xp=0){
  const c = COLORS[stage];
  if(stage===0){
    const frac = (xp - STAGES[0].xp)/(STAGES[1].xp - STAGES[0].xp);
    const crack = frac>0.45 ? `<path d="M38 62 l7 6 l6 -7 l7 7 l6 -6 l6 6 l6 -5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : "";
    const crack2 = frac>0.8 ? `<path d="M48 82 l5 -5 l5 5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>` : "";
    return `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="113" rx="28" ry="4" fill="currentColor" opacity=".12"/>
      <g class="body-g"><ellipse cx="60" cy="70" rx="31" ry="40" fill="${c}" stroke="currentColor" stroke-width="3"/>
      <circle cx="48" cy="52" r="6" fill="#9BE0C0"/><circle cx="72" cy="78" r="8" fill="#9BE0C0"/><circle cx="70" cy="44" r="4" fill="#F4B93A"/><circle cx="46" cy="90" r="4" fill="#F4B93A"/>
      ${crack}${crack2}</g></svg>`;
  }
  const s = [0,.62,.7,.78,.86,.94,1][stage];
  const happy = mood>=60, sad = mood<30;
  const eyes = happy
    ? `<ellipse cx="-15" cy="-50" rx="6" ry="8" fill="currentColor"/><ellipse cx="15" cy="-50" rx="6" ry="8" fill="currentColor"/><circle cx="-13" cy="-53" r="2.3" fill="#fff"/><circle cx="17" cy="-53" r="2.3" fill="#fff"/>`
    : sad
    ? `<path d="M-22 -50 q7 6 14 0 M8 -50 q7 6 14 0" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path d="M-21 -60 l10 4 M21 -60 l-10 4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="-15" cy="-50" r="5.5" fill="currentColor"/><circle cx="15" cy="-50" r="5.5" fill="currentColor"/>`;
  const mouth = happy
    ? `<path d="M-12 -33 q12 14 24 0 z" fill="currentColor"/><path d="M-6 -28 q6 4 12 0" fill="#E84393"/>`
    : sad
    ? `<path d="M-9 -27 q9 -8 18 0" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`
    : `<path d="M-8 -31 h16" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`;
  const tear = sad ? `<path d="M-20 -42 q-4 8 0 10 q4 -2 0 -10z" fill="#5DB8D6"/>` : "";
  const cheeks = happy ? `<ellipse cx="-27" cy="-38" rx="6" ry="3.5" fill="#E84393" opacity=".35"/><ellipse cx="27" cy="-38" rx="6" ry="3.5" fill="#E84393" opacity=".35"/>` : "";
  const feet = stage>=2 ? `<ellipse cx="-20" cy="-3" rx="12" ry="7" fill="${c}" stroke="currentColor" stroke-width="3"/><ellipse cx="20" cy="-3" rx="12" ry="7" fill="${c}" stroke="currentColor" stroke-width="3"/>` : "";
  const ears = stage>=3 ? `<path d="M-30 -78 l-8 -26 l22 14 z M30 -78 l8 -26 l-22 14 z" fill="${c}" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>` : "";
  const wings = stage>=4 ? `<path d="M-40 -58 C-66 -86 -92 -58 -76 -34 C-68 -24 -54 -30 -42 -36 Z M40 -58 C66 -86 92 -58 76 -34 C68 -24 54 -30 42 -36 Z" fill="#E9F0FF" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>` : "";
  const crown = stage>=5 ? `<path d="M-18 -92 l6 -16 l7 9 l5 -13 l5 13 l7 -9 l6 16 z" fill="#F4B93A" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>` : "";
  const belly = `<ellipse cx="0" cy="-22" rx="24" ry="16" fill="#fff" opacity=".45"/>`;
  const sparkles = stage>=6 ? `<g fill="#F4B93A"><path d="M14 18 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z"/><path d="M100 30 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z"/><path d="M104 88 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2z"/></g>` : "";
  const acc = slot => { const it = ITEM_BY_ID[wear[slot]]; return it ? it.svg : ""; };
  const extra = ITEM_BY_ID[wear.extra];
  const under = extra && extra.layer==="under" ? extra.svg : "";
  const front = extra && extra.layer!=="under" ? extra.svg : "";
  const head = acc("head");
  const lift = under ? 14*s : 0;
  return `<svg viewBox="0 0 120 120" aria-hidden="true">${sparkles}<ellipse cx="60" cy="113" rx="${32*s+6}" ry="4" fill="currentColor" opacity=".12"/>
    <g class="body-g"><g transform="translate(60 ${112-lift}) scale(${s})">
      ${under}${wings}${ears}${feet}
      <path d="M-46 -40 C-46 -78 -24 -92 0 -92 C24 -92 46 -78 46 -40 C46 -12 30 -6 0 -6 C-30 -6 -46 -12 -46 -40 Z" fill="${c}" stroke="currentColor" stroke-width="3.5"/>
      ${belly}${acc("neck")}${head ? head : crown}${eyes}${tear}${cheeks}${mouth}${acc("eyes")}${front}
    </g></g></svg>`;
}




// =====================================================================
// Zoo: Seltenheiten, Tierarten, Eier, Charaktere
// =====================================================================
const RARITY = K.RARITY = {
  common:    {label:"Gewöhnlich", chance:55,  color:"#7F8C9D"},
  rare:      {label:"Selten",     chance:30,  color:"#0984E3"},
  epic:      {label:"Episch",     chance:11,  color:"#8E44AD"},
  legendary: {label:"Legendär",   chance:3.5, color:"#E67E22"},
  mythic:    {label:"Mythisch",   chance:0.5, color:"#E84393"},
  starter:   {label:"Einzigartig", chance:0,  color:"#00A884"}
};
const RARITY_ORDER = ["common","rare","epic","legendary","mythic"];
const ZOO_STAGES = [0, 60, 250, 600, 1100];   // XP-Schwellen für neue Tierarten
K.REROLL_COST = 40;

const SC = 'stroke="currentColor" stroke-linejoin="round"';
const S3 = SC + ' stroke-width="3"';
let gidCounter = 0;
const gid = () => "kg" + (++gidCounter);

// Gesicht relativ zur Augenmitte (x,y), Größe k
function face(x, y, mood, k=1, noMouth=false){
  const happy = mood>=60, sad = mood<30;
  const eyes = happy
    ? `<ellipse cx="-15" cy="0" rx="6" ry="8" fill="currentColor"/><ellipse cx="15" cy="0" rx="6" ry="8" fill="currentColor"/><circle cx="-13" cy="-3" r="2.3" fill="#fff"/><circle cx="17" cy="-3" r="2.3" fill="#fff"/>`
    : sad
    ? `<path d="M-22 0 q7 6 14 0 M8 0 q7 6 14 0" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path d="M-21 -10 l10 4 M21 -10 l-10 4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M-20 8 q-4 8 0 10 q4 -2 0 -10z" fill="#5DB8D6"/>`
    : `<circle cx="-15" cy="0" r="5.5" fill="currentColor"/><circle cx="15" cy="0" r="5.5" fill="currentColor"/>`;
  const mouth = noMouth ? "" : happy
    ? `<path d="M-12 17 q12 14 24 0 z" fill="currentColor"/><path d="M-6 22 q6 4 12 0" fill="#E84393"/>`
    : sad ? `<path d="M-9 23 q9 -8 18 0" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`
    : `<path d="M-8 19 h16" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`;
  const cheeks = happy ? `<ellipse cx="-27" cy="12" rx="6" ry="3.5" fill="#E84393" opacity=".35"/><ellipse cx="27" cy="12" rx="6" ry="3.5" fill="#E84393" opacity=".35"/>` : "";
  return `<g transform="translate(${x} ${y}) scale(${k})">${cheeks}${eyes}${mouth}</g>`;
}
const star = (x,y,r,fill="#FDCB6E") => `<path d="M${x} ${y-r} L${x+r*.3} ${y-r*.3} L${x+r} ${y} L${x+r*.3} ${y+r*.3} L${x} ${y+r} L${x-r*.3} ${y+r*.3} L${x-r} ${y} L${x-r*.3} ${y-r*.3}Z" fill="${fill}"/>`;
const flame = (x,y,h,w,c) => `<path d="M${x} ${y} C${x-w} ${y-h*.35} ${x-w*.4} ${y-h*.7} ${x} ${y-h} C${x+w*.4} ${y-h*.7} ${x+w} ${y-h*.35} ${x} ${y}Z" fill="${c}" ${SC} stroke-width="2.5"/>`;
const wrap = (inner, s, lift=0, back="", shadowW=34) =>
  `<svg viewBox="0 0 120 120" aria-hidden="true">${back}<ellipse cx="60" cy="113" rx="${shadowW*s+6}" ry="4" fill="currentColor" opacity=".12"/><g class="body-g"><g transform="translate(60 ${112-lift}) scale(${s})">${inner}</g></g></svg>`;

const SPECIES = K.SPECIES = {
  kruemel: {name:"Ur-Monster", rarity:"starter", def:"Krümel"},

  // ---------- Gewöhnlich ----------
  eier: {name:"Ei-Familie", rarity:"common", def:"Eddi",
    forms:["Weißes Ei","Spiegelei","Rührei","Frühstücksei"],
    draw(f, m){
      if(f===1) return wrap(`<ellipse cx="-11" cy="-3" rx="8" ry="4.5" fill="#F39C12" ${S3}/><ellipse cx="11" cy="-3" rx="8" ry="4.5" fill="#F39C12" ${S3}/><ellipse cx="0" cy="-42" rx="27" ry="35" fill="#FBF7EF" ${S3}/><ellipse cx="-13" cy="-60" rx="4" ry="8" fill="#fff"/>${face(0,-46,m,.75)}`, .85);
      if(f===2) return wrap(`<path d="M-50 -8 C-56 -26 -34 -34 -16 -28 C-6 -42 22 -38 30 -26 C50 -28 58 -10 42 -4 C22 2 -30 3 -50 -8Z" fill="#fff" ${S3}/><circle cx="0" cy="-20" r="17" fill="#FDCB6E" ${S3}/><ellipse cx="-7" cy="-28" rx="5" ry="3" fill="#fff" opacity=".7"/>${face(0,-21,m,.5)}`, .95, 0, "", 46);
      if(f===3) return wrap(`<g fill="#FFE066" ${S3}><circle cx="-26" cy="-14" r="14"/><circle cx="26" cy="-14" r="14"/><circle cx="-14" cy="-38" r="14"/><circle cx="16" cy="-40" r="13"/><circle cx="0" cy="-24" r="21"/></g><g fill="#2ECC71"><circle cx="-31" cy="-22" r="2.5"/><circle cx="22" cy="-48" r="2.5"/><circle cx="33" cy="-8" r="2"/><circle cx="-20" cy="-46" r="2"/></g>${face(0,-26,m,.6)}`, 1, 0, "", 40);
      return wrap(`<path d="M34 -6 L46 -60" stroke="#B2BEC3" stroke-width="4" stroke-linecap="round"/><ellipse cx="47" cy="-67" rx="5" ry="8" fill="#DFE6E9" stroke="currentColor" stroke-width="2"/><path d="M-21 -80 C-28 -66 -27 -50 -22 -40 L22 -40 C27 -50 28 -66 21 -80 Z" fill="#FBF7EF" ${S3}/><ellipse cx="0" cy="-80" rx="20" ry="5" fill="#FDCB6E" stroke="currentColor" stroke-width="2.5"/><path d="M-22 -79 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l4 -4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>${face(0,-60,m,.58)}<path d="M-30 -42 L30 -42 Q30 -20 14 -14 L14 -6 L24 0 L-24 0 L-14 -6 L-14 -14 Q-30 -20 -30 -42Z" fill="#74B9FF" ${S3}/><g fill="#fff"><circle cx="-14" cy="-32" r="3"/><circle cx="0" cy="-28" r="3"/><circle cx="14" cy="-32" r="3"/></g>`, 1);
    }},
  tropfi: {name:"Tropfi", rarity:"common", def:"Tropfi",
    forms:["Tröpfchen","Tropfen","Wolkentropfi","Regenbogentropfi"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const rainbow = f>=4 ? ["#FF7675","#FDCB6E","#55EFC4","#74B9FF"].map((c,i)=>{const r=62-i*6;return `<path d="M${-r} -24 A${r} ${r} 0 0 1 ${r} -24" fill="none" stroke="${c}" stroke-width="6"/>`;}).join("") : "";
      const bubbles = f>=2 ? `<g fill="#DFF1FF" stroke="currentColor" stroke-width="2"><circle cx="48" cy="-58" r="6"/><circle cx="56" cy="-40" r="4"/><circle cx="-50" cy="-68" r="5"/></g>` : "";
      const cloud = f>=3 ? `<path d="M-22 -92 a10 10 0 0 1 8 -14 a13 13 0 0 1 26 0 a10 10 0 0 1 8 14 z" fill="#fff" ${S3}/>` : "";
      return wrap(`${rainbow}${bubbles}<path d="M0 -96 C14 -70 40 -54 40 -32 C40 -12 22 0 0 0 C-22 0 -40 -12 -40 -32 C-40 -54 -14 -70 0 -96Z" fill="#74B9FF" ${S3}/><ellipse cx="-20" cy="-44" rx="5" ry="10" fill="#fff" opacity=".6"/>${cloud}${face(0,-32,m,.85)}`, s);
    }},
  kiesel: {name:"Kiesel", rarity:"common", def:"Kiki",
    forms:["Kieselchen","Kiesel","Moos-Kiesel","Blumenfels"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const speck = f>=2 ? `<g fill="#636E72" opacity=".45"><circle cx="-28" cy="-18" r="3"/><circle cx="30" cy="-14" r="2.5"/><circle cx="24" cy="-42" r="3"/><circle cx="-14" cy="-10" r="2"/></g>` : "";
      const moss = f>=3 ? `<path d="M-32 -48 C-22 -64 24 -66 38 -46 C30 -42 24 -48 16 -44 C8 -50 -4 -44 -10 -48 C-18 -44 -24 -48 -32 -48Z" fill="#55A84A" ${S3}/>` : "";
      const flower = f>=4 ? `<path d="M6 -58 L6 -76" stroke="#2E7D4F" stroke-width="3"/><g fill="#FF7EB6" stroke="currentColor" stroke-width="2"><circle cx="6" cy="-90" r="5.5"/><circle cx="14" cy="-84" r="5.5"/><circle cx="11" cy="-75" r="5.5"/><circle cx="1" cy="-75" r="5.5"/><circle cx="-2" cy="-84" r="5.5"/></g><circle cx="6" cy="-82" r="4" fill="#FDCB6E" stroke="currentColor" stroke-width="2"/>` : "";
      return wrap(`${flower}<path d="M-46 -24 C-48 -48 -20 -60 4 -58 C30 -56 50 -42 48 -22 C46 -6 24 0 0 0 C-24 0 -44 -8 -46 -24Z" fill="#B2BEC3" ${S3}/>${speck}${moss}${face(0,-28,m,.8)}`, s, 0, "", 40);
    }},

  // ---------- Selten ----------
  pilzi: {name:"Pilzi", rarity:"rare", def:"Pilzi",
    forms:["Pilzchen","Fliegenpilz","Pilzfamilie","Zauberpilz"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const cap = ["","#A0522D","#E74C3C","#E74C3C","#6C5CE7"][f];
      const dotFill = f>=4 ? "#FDCB6E" : "#fff";
      const dots = f>=2 ? `<g fill="${dotFill}"><ellipse cx="-24" cy="-56" rx="6" ry="4"/><ellipse cx="0" cy="-68" rx="7" ry="5"/><ellipse cx="24" cy="-56" rx="6" ry="4"/><ellipse cx="-36" cy="-44" rx="4" ry="3"/><ellipse cx="36" cy="-44" rx="4" ry="3"/></g>` : "";
      const one = (c) => `<path d="M-16 0 C-18 -18 -14 -34 -12 -40 L12 -40 C14 -34 18 -18 16 0 Z" fill="#FFF3E0" ${S3}/><path d="M-46 -38 C-46 -84 46 -84 46 -38 C30 -32 -30 -32 -46 -38Z" fill="${c}" ${S3}/>`;
      const buddy = f>=3 ? `<g transform="translate(52 0) scale(.38)">${one(cap)}<g fill="#fff"><ellipse cx="0" cy="-62" rx="9" ry="6"/></g>${face(0,-18,m,.7)}</g>` : "";
      const glow = f>=4 ? `<circle cx="0" cy="-50" r="58" fill="#A29BFE" opacity=".18"/>${star(-46,-80,6)}${star(44,-86,5)}${star(-54,-30,4)}` : "";
      return wrap(`${glow}${one(cap)}${dots}${buddy}${face(0,-18,m,.55)}`, s);
    }},
  glimmi: {name:"Glimmi", rarity:"rare", def:"Glimmi",
    forms:["Glimmlarve","Glimmi","Leuchtkäfer","Sternenlicht"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const body = f===1 ? "#A3E4D7" : "#55EFC4";
      const aura = f>=4 ? `<circle cx="0" cy="-44" r="58" fill="#FDCB6E" opacity=".2"/>${star(-50,-84,5,"#FFF6C8")}${star(50,-74,4,"#FFF6C8")}${star(-56,-20,4,"#FFF6C8")}${star(54,-24,5,"#FFF6C8")}` : "";
      const wings = f>=2 ? `<ellipse cx="-24" cy="-62" rx="15" ry="25" transform="rotate(-32 -24 -62)" fill="#E8FBFF" ${S3}/><ellipse cx="24" cy="-62" rx="15" ry="25" transform="rotate(32 24 -62)" fill="#E8FBFF" ${S3}/>` : "";
      const tail = f>=3 ? `<circle cx="0" cy="-10" r="22" fill="#FDCB6E" opacity=".35"/><circle cx="0" cy="-10" r="13" fill="#FDCB6E" ${S3}/>` : "";
      const ant = `<path d="M-10 -64 Q-16 -82 -24 -86 M10 -64 Q16 -82 24 -86" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="-24" cy="-86" r="4" fill="#FDCB6E" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="-86" r="4" fill="#FDCB6E" stroke="currentColor" stroke-width="2"/>`;
      const segs = f===1 ? `<path d="M-26 -30 q26 8 52 0 M-22 -16 q22 6 44 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/>` : "";
      return wrap(`${aura}${wings}${tail}${ant}<circle cx="0" cy="-40" r="30" fill="${body}" ${S3}/>${segs}${face(0,-44,m,.72)}`, s, 4);
    }},

  // ---------- Episch ----------
  drachi: {name:"Drachi", rarity:"epic", def:"Drachi",
    forms:["Drachenbaby","Drachi","Flugdrache","Feuerdrache"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const c = ["","#6CCCA8","#00B894","#E17055","#D63031"][f];
      const wing = `<path d="M-34 -58 L-72 -82 L-66 -64 L-80 -58 L-66 -48 L-72 -36 L-36 -40Z" fill="#B983FF" ${S3}/>`;
      const wings = f>=3 ? wing + `<g transform="scale(-1 1)">${wing}</g>` : "";
      const spikes = f>=2 ? `<path d="M-14 -86 L-6 -100 L2 -86 Z M6 -86 L16 -98 L22 -82 Z" fill="#FDCB6E" ${S3}/>` : "";
      const tail = f>=2 ? `<path d="M-34 -16 C-52 -12 -64 -22 -62 -40 L-54 -32 C-52 -24 -44 -22 -36 -26Z" fill="${c}" ${S3}/>` : "";
      const fire = f>=4 ? `<path d="M30 -32 C46 -42 58 -34 66 -42 C62 -28 54 -26 66 -20 C52 -18 42 -22 30 -26Z" fill="#FDCB6E" ${SC} stroke-width="2.5"/>` : "";
      return wrap(`${wings}${tail}<ellipse cx="-16" cy="-4" rx="11" ry="6" fill="${c}" ${S3}/><ellipse cx="16" cy="-4" rx="11" ry="6" fill="${c}" ${S3}/><path d="M-22 -80 l-8 -14 l16 6z M22 -80 l8 -14 l-16 6z" fill="#FDCB6E" ${S3}/>${spikes}<path d="M-40 -38 C-40 -74 -20 -88 0 -88 C24 -88 42 -72 42 -40 C42 -12 26 -6 0 -6 C-26 -6 -40 -14 -40 -38Z" fill="${c}" ${S3}/><ellipse cx="0" cy="-24" rx="22" ry="14" fill="#fff" opacity=".35"/><path d="M-12 -28 h24 M-10 -19 h20" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>${fire}${face(0,-54,m,.75)}`, s);
    }},
  qualli: {name:"Qualli", rarity:"epic", def:"Qualli",
    forms:["Quallchen","Qualli","Glitzerqualle","Leuchtqualle"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const c = f>=4 ? "#A29BFE" : "#FD79A8";
      const xs = [[-12,0,12],[-24,-12,0,12,24],[-30,-20,-10,0,10,20,30],[-30,-20,-10,0,10,20,30]][f-1];
      const tent = xs.map((x,i)=>`<path d="M${x} -46 q${i%2?6:-6} 11 0 22 q${i%2?-6:6} 11 0 22" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M${x} -46 q${i%2?6:-6} 11 0 22 q${i%2?-6:6} 11 0 22" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>`).join("");
      const dots = f>=3 ? `<g fill="#fff" opacity=".8"><circle cx="-24" cy="-66" r="3"/><circle cx="20" cy="-74" r="2.5"/><circle cx="28" cy="-58" r="2"/><circle cx="-8" cy="-82" r="2"/></g>` : "";
      const aura = f>=4 ? `<circle cx="0" cy="-56" r="56" fill="#A29BFE" opacity=".2"/>${star(-48,-92,5)}${star(46,-84,4)}${star(-54,-30,4)}${star(52,-26,5)}` : "";
      return wrap(`${aura}${tent}<path d="M-42 -50 C-42 -98 42 -98 42 -50 Q31 -42 21 -50 Q10 -42 0 -50 Q-10 -42 -21 -50 Q-31 -42 -42 -50Z" fill="${c}" ${S3}/><ellipse cx="-20" cy="-78" rx="8" ry="5" fill="#fff" opacity=".5"/>${dots}${face(0,-66,m,.7)}`, s, 6);
    }},

  // ---------- Legendär ----------
  phoenix: {name:"Phönix", rarity:"legendary", def:"Flammi",
    forms:["Glutküken","Feuervogel","Flammenflügel","Phönix"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const g = gid();
      const defs = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDCB6E"/><stop offset=".6" stop-color="#F39C12"/><stop offset="1" stop-color="#E17055"/></linearGradient></defs>`;
      const aura = f>=4 ? `<circle cx="0" cy="-48" r="60" fill="#FDCB6E" opacity=".2"/>${star(-52,-90,5)}${star(52,-84,6)}${star(56,-30,4)}` : "";
      const tail = f>=4 ? [-60,-80,-100].map(a=>`<g transform="rotate(${a} -24 -18)">${flame(-24,-18,46,12,"#E17055")}</g>`).join("") : "";
      const wing = `<path d="M-30 -48 C-62 -60 -74 -30 -56 -16 C-50 -26 -42 -28 -32 -30Z" fill="#F39C12" ${S3}/><path d="M-46 -44 C-56 -42 -60 -32 -54 -24" fill="none" stroke="#FDCB6E" stroke-width="3" stroke-linecap="round"/>`;
      const wings = f>=3 ? wing + `<g transform="scale(-1 1)">${wing}</g>` : "";
      const crest = f>=2 ? flame(-10,-70,22,8,"#FDCB6E") + flame(10,-70,22,8,"#E17055") + flame(0,-72,32,10,"#F39C12") : flame(0,-70,14,6,"#F39C12");
      const feet = `<path d="M-10 -8 l-5 8 M-10 -8 v8 M-10 -8 l5 8 M10 -8 l-5 8 M10 -8 v8 M10 -8 l5 8" stroke="#E17055" stroke-width="3" stroke-linecap="round"/>`;
      return wrap(`${defs}${aura}${tail}${wings}${feet}${crest}<ellipse cx="0" cy="-40" rx="32" ry="34" fill="url(#${g})" ${S3}/><ellipse cx="0" cy="-26" rx="18" ry="14" fill="#FFF3D6" opacity=".55"/>${face(0,-48,m,.65,true)}<path d="M-7 -40 l7 10 l7 -10 z" fill="#FDCB6E" ${SC} stroke-width="2"/>`, s);
    }},

  // ---------- Mythisch ----------
  sternenwal: {name:"Sternenwal", rarity:"mythic", def:"Nova",
    forms:["Sternchenwal","Sternenwal","Galaxiewal","Kosmoswal"],
    draw(f, m){
      const s = [0,.62,.75,.88,1][f];
      const g = gid();
      const defs = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6C5CE7"/><stop offset="1" stop-color="#2D3561"/></linearGradient></defs>`;
      const halo = f>=4 ? `<circle cx="0" cy="-40" r="62" fill="#6C5CE7" opacity=".18"/><ellipse cx="0" cy="-40" rx="64" ry="13" fill="none" stroke="#FDCB6E" stroke-width="2.5" opacity=".85"/>${star(-56,-90,5)}${star(54,-88,6)}${star(60,-10,4)}${star(-62,-6,4)}${star(0,-104,4)}` : "";
      const spout = f>=2 ? `<path d="M16 -62 Q12 -72 6 -80 M16 -62 Q20 -74 26 -84" fill="none" stroke="#74B9FF" stroke-width="3" stroke-linecap="round"/>${star(6,-84,5,"#fff")}${star(27,-89,6,"#FDCB6E")}${star(16,-76,3.5,"#fff")}` : "";
      const swirl = f>=3 ? `<path d="M-14 -34 c6 -8 18 -2 14 6 c-4 8 -18 6 -20 -4 c-2 -12 14 -20 26 -12" fill="none" stroke="#FD79A8" stroke-width="2.5" opacity=".8" stroke-linecap="round"/>` : "";
      return wrap(`${defs}${halo}${spout}<path d="M-44 -30 C-56 -34 -66 -50 -70 -56 C-60 -52 -54 -46 -50 -40 C-56 -30 -60 -16 -68 -8 C-58 -12 -50 -20 -44 -26Z" fill="url(#${g})" ${S3}/><path d="M-46 -30 C-46 -66 20 -72 40 -46 C50 -32 46 -10 28 -6 L-26 -6 C-40 -8 -46 -18 -46 -30Z" fill="url(#${g})" ${S3}/><ellipse cx="4" cy="-15" rx="30" ry="6" fill="#A29BFE" opacity=".55"/>${swirl}${star(-28,-42,3,"#fff")}${star(-6,-56,2.5,"#fff")}${star(-34,-22,2,"#fff")}${star(30,-22,2.5,"#fff")}<circle cx="7.75" cy="-38" r="6.5" fill="#fff"/><circle cx="24.25" cy="-38" r="6.5" fill="#fff"/><ellipse cx="16" cy="-27" rx="8" ry="5" fill="#fff" opacity=".85"/>${face(16,-38,m,.55)}`, s, 4, "", 44);
    }}
};

// Eier je Seltenheit
function rarityEgg(rarity, frac){
  const g = gid();
  let fill = "#F5F0E6", deco = "", defs = "", outside = "";
  if(rarity==="common") deco = `<g fill="#B2BEC3"><circle cx="48" cy="52" r="2.5"/><circle cx="70" cy="64" r="2"/><circle cx="56" cy="88" r="2.5"/><circle cx="74" cy="90" r="1.8"/></g>`;
  if(rarity==="rare"){ fill = "#DFF1FF"; deco = `<g fill="#74B9FF"><circle cx="48" cy="54" r="6"/><circle cx="72" cy="76" r="8"/><circle cx="68" cy="46" r="4"/><circle cx="48" cy="90" r="5"/></g>`; }
  if(rarity==="epic"){ fill = "#EBDDFF"; deco = `<path d="M30 72 l7 -8 l7 8 l7 -8 l7 8 l7 -8 l7 8 l7 -8 l7 8 l6 -6" fill="none" stroke="#8E44AD" stroke-width="5" stroke-linejoin="round"/><g fill="#8E44AD"><circle cx="52" cy="50" r="3"/><circle cx="68" cy="48" r="3"/><circle cx="60" cy="94" r="3"/></g>`; }
  if(rarity==="legendary"){ fill = `url(#${g})`; defs = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B3"/><stop offset=".5" stop-color="#F9CA24"/><stop offset="1" stop-color="#E67E22"/></linearGradient></defs>`; deco = `${star(50,54,6,"#fff")}${star(70,82,5,"#fff")}`; outside = `${star(20,40,5)}${star(100,60,4)}`; }
  if(rarity==="mythic"){ fill = `url(#${g})`; defs = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FD79A8"/><stop offset=".35" stop-color="#A29BFE"/><stop offset=".7" stop-color="#74B9FF"/><stop offset="1" stop-color="#55EFC4"/></linearGradient></defs>`; deco = `${star(48,52,5,"#fff")}${star(72,70,6,"#fff")}${star(54,90,4,"#fff")}`; outside = `<circle cx="60" cy="70" r="52" fill="#A29BFE" opacity=".15"/>${star(16,36,6)}${star(104,46,5,"#FD79A8")}${star(102,100,4,"#55EFC4")}${star(18,96,4,"#74B9FF")}`; }
  const crack = frac>0.45 ? `<path d="M38 62 l7 6 l6 -7 l7 7 l6 -6 l6 6 l6 -5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : "";
  const crack2 = frac>0.8 ? `<path d="M48 84 l5 -5 l5 5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>` : "";
  return `<svg viewBox="0 0 120 120" aria-hidden="true">${defs}${outside}<ellipse cx="60" cy="113" rx="28" ry="4" fill="currentColor" opacity=".12"/><g class="body-g"><ellipse cx="60" cy="70" rx="31" ry="40" fill="${fill}" stroke="currentColor" stroke-width="3"/>${deco}${crack}${crack2}</g></svg>`;
}

// Charaktere
const CHARS = K.CHARS = {
  verfressen: {label:"Verfressen", emoji:"😋",
    ok:["Mjam!","Lecker!","Mehr davon!"], bad:["Mein Magen knurrt…","Schmeckt komisch."], idle:["Hab ich Hunger!","Gibt's bald Snacks?"],
    chat:["{b}, hast du was zu essen?","Wollen wir Kekse suchen, {b}?"], reply:["Nur wenn's Snacks gibt!","Mjam, klar!"]},
  frech: {label:"Frech", emoji:"😜",
    ok:["Easy!","Zu leicht!","Wusst ich doch!"], bad:["Pff, war nur ein Test.","Ups, egal!"], idle:["Wetten, ich bin schneller?","Langweilig hier!"],
    chat:["Fang mich doch, {b}!","{b}, du hast da was im Gesicht. Reingelegt!"], reply:["Nö!","Wer zuerst da ist!"]},
  schuechtern: {label:"Schüchtern", emoji:"🙈",
    ok:["Oh… richtig!","Juhu… leise."], bad:["Schon okay…","Nicht schlimm…"], idle:["Hallo…","Äh… hi."],
    chat:["Ähm… {b}? Hallo…","Darf ich mitspielen, {b}?"], reply:["Oh… okay.","…gern."]},
  sportlich: {label:"Sportlich", emoji:"💪",
    ok:["Tor!","Weiter, weiter!","Jawoll!"], bad:["Nochmal Anlauf!","Training macht's!"], idle:["Komm, eine Runde noch!","Ich mach Hampelmänner."],
    chat:["Wettrennen, {b}?","{b}, hüpf mit mir!"], reply:["Bin dabei!","Los geht's!"]},
  vertraeumt: {label:"Verträumt", emoji:"🌙",
    ok:["Wie schön…","Hach, richtig."], bad:["Huch, ich hab geträumt.","Wo war ich?"], idle:["Guck mal, die Wolken…","Ich träum von Sternen."],
    chat:["{b}, siehst du die Wolke da?","Ich hab von dir geträumt, {b}."], reply:["Hach, wie schön.","Erzähl mehr…"]},
  angeber: {label:"Angeberisch", emoji:"😎",
    ok:["Natürlich richtig!","Ich bin der Beste!"], bad:["Das zählt nicht!","Hab ich absichtlich gemacht."], idle:["Schau, wie toll ich bin!","Applaus bitte!"],
    chat:["{b}, schau, wie hoch ich hüpfe!","Ich hab die schönste Farbe, {b}!"], reply:["Pff, ich kann das besser.","Na ja, ganz okay."]},
  gemuetlich: {label:"Gemütlich", emoji:"🛋️",
    ok:["Gemütlich richtig.","Feini."], bad:["Kein Stress.","Machen wir später."], idle:["Erstmal 'n Nickerchen.","Schön ruhig hier."],
    chat:["{b}, wollen wir chillen?","Komm, {b}, wir machen Pause."], reply:["Gute Idee…","Gähn… klar."]}
};


// =====================================================================
// Profil
// =====================================================================
function freshProfile(){
  return {version:SCHEMA, coins:20, mood:70, owned:[],
    pets:[], activePet:null, nextPetId:1,
    lastPlayed:null, day:null, dayCorrect:0, goalDay:null, dayStreak:0, bestDayStreak:0,
    trainerDay:{day:null, counts:{}}, intro:null, zooIntro:false,
    time:{total:0, day:null, today:0, trainers:{}}};
}
function freshTrainer(){ return {mistakes:{}, mastery:{}, bestCombo:0}; }
function newPet(species, extra={}){
  return Object.assign({species, name: species==="kruemel" ? "Krümel" : "Geheimnisvolles Ei", xp:0, wear:{},
    character: pick(Object.keys(CHARS)), fav: pick(SUBJECTS), born: today(), grown:false, named: species==="kruemel"}, extra);
}

// Erste Version (einzelne Datei) → Format v1
function fromLegacy(g, m){
  const p = {version:1, name:"Krümel", xp:0, coins:20, mood:70, owned:[], wear:{}};
  const t = freshTrainer();
  if(g){
    for(const f of ["name","xp","mood","lastPlayed","day","dayCorrect","goalDay","dayStreak"]) if(g[f]!==undefined && g[f]!==null) p[f] = g[f];
    if(Array.isArray(g.owned)) p.owned = g.owned.slice();
    if(g.wear) p.wear = Object.assign({}, g.wear);
    if(g.coins !== undefined) p.coins = g.coins;
    else { const earlier = Math.round((g.xp||0)/6); p.coins = earlier + 20; p.intro = {kind:"wardrobe", earlier}; }
    t.bestCombo = g.bestCombo || 0;
  }
  if(m) t.mistakes = Object.assign({}, m);
  return {profile:p, trainer:t};
}

function upgrade(p){
  // v1 → v2: Krümel wird das erste Tier im Zoo
  if(!p.pets){
    const k = newPet("kruemel", {id:"p1", name:p.name||"Krümel", xp:p.xp||0, wear:p.wear||{}, character:"verfressen", fav:"Englisch"});
    p.pets = [k]; p.activePet = "p1"; p.nextPetId = 2;
    delete p.name; delete p.xp; delete p.wear;
    p.zooIntro = true;
  }
  const base = freshProfile();
  for(const k in base) if(p[k] === undefined) p[k] = base[k];
  if((p.dayStreak||0) > (p.bestDayStreak||0)) p.bestDayStreak = p.dayStreak;
  p.version = SCHEMA;
  return p;
}

let P = read(PROFILE_KEY);
if(!P){
  const g = read(LEGACY_GAME), m = read(LEGACY_MISTAKES);
  if(g || m){
    const r = fromLegacy(g, m);
    P = r.profile;
    if(!read(TKEY("irregular-verbs"))) write(TKEY("irregular-verbs"), r.trainer);
    P.intro = P.intro || {kind:"moved"};
  }else{
    P = {version:1, intro:{kind:"welcome"}};
  }
}
P = upgrade(P);
if(P.intro && P.intro.kind==="welcome") P.zooIntro = false;
write(PROFILE_KEY, P);

K.profile = () => P;
K.save = () => write(PROFILE_KEY, P);
K.trainer = id => Object.assign(freshTrainer(), read(TKEY(id)) || {});
K.saveTrainer = (id, data) => write(TKEY(id), data);
K.masteredCount = id => { const t = K.trainer(id); return Object.values(t.mastery||{}).filter(n=>n>=K.MASTERY).length; };

// =====================================================================
// Tiere
// =====================================================================
K.pets = () => P.pets;
K.active = () => P.pets.find(p=>p.id===P.activePet) || P.pets[0];
K.kruemel = () => P.pets.find(p=>p.species==="kruemel");
const petById = id => P.pets.find(p=>p.id===id);
function stagesOf(pet){
  if(pet.species==="kruemel") return STAGES;
  const sp = SPECIES[pet.species];
  return ZOO_STAGES.map((xp,i)=>({xp, name: i===0 ? "Ei" : sp.forms[i-1]}));
}
K.stagesOf = stagesOf;
K.petStage = pet => { let i=0; stagesOf(pet).forEach((s,k)=>{ if(pet.xp>=s.xp) i=k; }); return i; };
K.isEgg = pet => K.petStage(pet)===0;
K.isMax = pet => K.petStage(pet)===stagesOf(pet).length-1;
K.stageIndex = () => K.petStage(K.active());
K.drawPet = function(pet, mood, wear){
  const st = K.petStage(pet);
  if(pet.species==="kruemel") return petSVG(st, mood, wear || pet.wear || {}, pet.xp);
  if(st===0){ const s = stagesOf(pet); return rarityEgg(SPECIES[pet.species].rarity, (pet.xp - s[0].xp)/(s[1].xp - s[0].xp)); }
  return SPECIES[pet.species].draw(st, mood);
};
K.petLabel = pet => {
  const st = K.petStage(pet), sp = SPECIES[pet.species];
  return stagesOf(pet)[st].name + (pet.species!=="kruemel" ? " (" + RARITY[sp.rarity].label + ")" : "");
};
function rollSpecies(){
  let r = Math.random()*100, rar = RARITY_ORDER[0];
  for(const k of RARITY_ORDER){ if(r < RARITY[k].chance){ rar = k; break; } r -= RARITY[k].chance; }
  return pick(Object.keys(SPECIES).filter(id=>SPECIES[id].rarity===rar));
}
function spawnEgg(){
  const egg = newPet(rollSpecies(), {id:"p" + P.nextPetId++});
  P.pets.push(egg);
  return egg;
}
// Tier ist ausgewachsen → neues Ei (nur eins gleichzeitig)
function checkGrown(pet, events){
  if(!K.isMax(pet) || pet.grown) return;
  pet.grown = true;
  if(P.pets.some(p=>K.isEgg(p))) return;
  const egg = spawnEgg();
  P.activePet = egg.id;
  events.push({type:"newEgg", pet:egg.id, from:pet.id});
}
K.setActive = function(id){ if(petById(id)){ P.activePet = id; K.save(); K.render(); } };
K.reroll = function(id){
  const pet = petById(id);
  if(!pet || !K.isEgg(pet) || P.coins < K.REROLL_COST) return null;
  P.coins -= K.REROLL_COST;
  pet.species = rollSpecies();
  pet.character = pick(Object.keys(CHARS));
  pet.fav = pick(SUBJECTS);
  K.save(); K.render();
  return SPECIES[pet.species].rarity;
};
K.renamePet = function(id, name){ const p = petById(id); if(p && name){ p.name = name; p.named = true; K.save(); K.render(); } };

// =====================================================================
// Abgeleitete Werte
// =====================================================================
K.effMood = () => {
  if(!P.lastPlayed) return P.mood;
  const gap = daysBetween(P.lastPlayed, today());
  return gap>=2 ? Math.max(10, P.mood - 15*(gap-1)) : P.mood;
};
K.dayCorrect = () => P.day===today() ? P.dayCorrect : 0;
K.dayStreak = () => (P.goalDay && daysBetween(P.goalDay, today())<=1) ? P.dayStreak : 0;

// =====================================================================
// Belohnungen
// =====================================================================
// r = {ok, gaveUp, combo, fixed}
K.award = function(trainerId, r){
  const t = today();
  const moodNow = K.effMood();
  const pet = K.active();
  const stBefore = K.petStage(pet);
  const subject = (K.TRAINERS.find(x=>x.id===trainerId)||{}).subject;
  if(P.day !== t){ P.day = t; P.dayCorrect = 0; }
  if(P.trainerDay.day !== t) P.trainerDay = {day:t, counts:{}};
  P.lastPlayed = t;
  const res = {xp:0, coins:0, full:true, fav:false, events:[]};
  if(r.ok){
    const n = P.trainerDay.counts[trainerId] = (P.trainerDay.counts[trainerId]||0) + 1;
    res.full = n <= K.TRAINER_DAILY_FULL;
    let xp = 10 + Math.min((r.combo||1)-1, 10) + (r.fixed ? 15 : 0);
    if(!res.full) xp = Math.ceil(xp/2);
    if(subject && pet.fav === subject){ xp = Math.round(xp*FAV_BONUS); res.fav = true; }
    let coins = (res.full ? COIN.correct : 0);
    if(r.combo && r.combo % 5 === 0) coins += COIN.combo5;
    if(r.fixed) coins += COIN.fixed;
    pet.xp += xp; res.xp = xp;
    P.mood = Math.min(100, moodNow + 6);
    P.dayCorrect++;
    if(P.dayCorrect === K.DAILY_GOAL){
      P.dayStreak = (P.goalDay && daysBetween(P.goalDay, t)===1) ? P.dayStreak+1 : 1;
      P.goalDay = t;
      coins += COIN.dailyGoal;
      const record = P.dayStreak > (P.bestDayStreak||0);
      if(record) P.bestDayStreak = P.dayStreak;
      res.events.push({type:"goal", record: record && P.dayStreak > 1});
    }
    if(n === K.TRAINER_DAILY_FULL + 1) res.events.push({type:"full"});
    P.coins += coins; res.coins = coins;
  }else{
    P.mood = Math.max(0, moodNow - (r.gaveUp ? 3 : 4));
  }
  const stAfter = K.petStage(pet);
  if(stAfter > stBefore){
    P.coins += COIN.stageUp; res.coins += COIN.stageUp;
    res.events.push({type:"stage", pet:pet.id, from:stBefore, to:stAfter});
    checkGrown(pet, res.events);
  }
  K.save();
  return res;
};

K.grantReward = function(itemId){
  const it = ITEM_BY_ID[itemId];
  if(!it || P.owned.includes(itemId)) return false;
  P.owned.push(itemId);
  K.save();
  celebrate("Spezial-Teil freigeschaltet!", "Du hast alles gemeistert und bekommst: " + it.name + ". Du findest es im Kleiderschrank.", {pet: (K.kruemel()||K.active()).id});
  return true;
};

K.bonusCoins = function(n){
  P.coins += n; K.save(); K.render();
  const c = document.getElementById("kCoins"); if(c){ c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
};

// =====================================================================
// Übungszeit – zählt nur aktive Zeit (Tab sichtbar, Eingabe in den letzten 60 s)
// =====================================================================
const IDLE_MS = 60000, TICK = 5;
function timeRoll(o){ const t = today(); if(o.day !== t){ o.day = t; o.today = 0; } return o; }
K.trackTime = function(trainerId){
  let last = Date.now();
  const poke = () => { last = Date.now(); };
  ["keydown","pointerdown","input"].forEach(ev => document.addEventListener(ev, poke, true));
  setInterval(() => {
    if(document.visibilityState !== "visible" || Date.now() - last > IDLE_MS) return;
    const tm = timeRoll(P.time);
    tm.total += TICK; tm.today += TICK;
    const tr = timeRoll(tm.trainers[trainerId] = tm.trainers[trainerId] || {total:0, day:null, today:0});
    tr.total += TICK; tr.today += TICK;
    K.save();
  }, TICK*1000);
};
K.timeStats = function(trainerId){
  const t = today();
  const o = trainerId ? (P.time.trainers[trainerId] || {total:0, day:null, today:0}) : P.time;
  return {today: o.day === t ? o.today : 0, total: o.total};
};
K.fmtTime = function(sec){
  const m = Math.floor(sec/60);
  if(m < 1) return "unter 1 Min";
  if(m < 60) return m + " Min";
  const h = Math.floor(m/60), r = m % 60;
  return h + " Std" + (r ? " " + r + " Min" : "");
};

// =====================================================================
// Backup
// =====================================================================
K.exportCode = function(){
  const data = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && k.startsWith("kruemel:")) data[k] = read(k);
  }
  const json = JSON.stringify({kruemelBackup:1, saved:new Date().toISOString(), data});
  return "KRUEMEL1:" + btoa(unescape(encodeURIComponent(json)));
};
K.importCode = function(code){
  code = (code||"").trim().replace(/\s+/g,"");
  const m = code.match(/^KRUEMEL([01]):(.+)$/);
  if(!m) throw new Error("Das ist kein gültiger Spielstand-Code.");
  let obj;
  try{ obj = JSON.parse(decodeURIComponent(escape(atob(m[2])))); }catch(e){ throw new Error("Der Code ist unvollständig oder beschädigt."); }
  let entries;
  if(m[1]==="1"){
    if(!obj || !obj.data) throw new Error("Der Code enthält keinen Spielstand.");
    entries = obj.data;
  }else{
    const r = fromLegacy(obj.game, obj.mistakes);
    r.profile.intro = r.profile.intro || {kind:"imported"};
    entries = {[PROFILE_KEY]: r.profile, [TKEY("irregular-verbs")]: r.trainer};
  }
  const old = [];
  for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.startsWith("kruemel:")) old.push(k); }
  old.forEach(k=>localStorage.removeItem(k));
  for(const k in entries) if(k.startsWith("kruemel:")) write(k, entries[k]);
  return true;
};

// =====================================================================
// Oberfläche: Begleiter-Panel
// =====================================================================
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let tryOn = null, opts = {};

K.mount = function(el, options={}){
  opts = options;
  el.classList.add("buddy");
  el.innerHTML = `
    <div class="pet-wrap"><div class="bubble" id="kBubble" aria-live="polite"></div><div id="kPet"></div><div class="float" id="kFloat" aria-hidden="true"></div></div>
    <div class="stats">
      <div class="name-row"><button type="button" class="pet-name" id="kName" title="Namen ändern"></button><span class="stage" id="kStage"></span></div>
      <div class="bar"><div class="bar-label"><span id="kXpLabel"></span><span id="kXpNum"></span></div><div class="track"><div class="fill xp" id="kXpFill"></div></div></div>
      <div class="bar"><div class="bar-label"><span>Laune</span><span id="kMoodLabel"></span></div><div class="track"><div class="fill mood" id="kMoodFill"></div></div></div>
      <div class="bar"><div class="bar-label"><span>Tagesziel</span><span id="kGoalLabel"></span></div><div class="track"><div class="fill goal" id="kGoalFill"></div></div></div>
      <div class="chips" id="kChips"></div>
    </div>
    <button type="button" class="wardrobe-btn" id="kWardrobeBtn" aria-expanded="false" aria-controls="kShop">👕 Kleiderschrank öffnen</button>`;
  const shop = document.createElement("section");
  shop.className = "shop"; shop.id = "kShop"; shop.hidden = true; shop.setAttribute("aria-labelledby","kShopTitle");
  shop.innerHTML = `<div class="shop-head"><h2 id="kShopTitle">Kleiderschrank</h2><button type="button" class="shop-close" id="kShopClose">Fertig</button></div><p class="shop-note" id="kShopNote"></p><div id="kShopBody"></div>`;
  el.after(shop);
  const cel = document.createElement("div");
  cel.className = "celebrate"; cel.id = "kCel"; cel.hidden = true;
  cel.setAttribute("role","dialog"); cel.setAttribute("aria-modal","true"); cel.setAttribute("aria-labelledby","kCelTitle");
  cel.innerHTML = `<div class="celebrate-card"><div class="big" id="kCelPet"></div><h2 id="kCelTitle"></h2><p id="kCelText"></p><div id="kCelName" hidden><label for="kCelNameInput" class="cel-label">Wie soll es heißen?</label><input id="kCelNameInput" class="name-input cel-name" maxlength="18"></div><button type="button" class="primary" id="kCelOk">Weiter</button></div>`;
  document.body.append(cel);

  $("kName").onclick = renameStart;
  $("kWardrobeBtn").onclick = () => openShop($("kShop").hidden);
  $("kShopClose").onclick = () => { openShop(false); $("kWardrobeBtn").focus(); };
  $("kCelOk").onclick = nextCelebration;
  cel.addEventListener("keydown", e=>{ if(e.key==="Escape"||e.key==="Enter"){ e.preventDefault(); nextCelebration(); } });

  // Bereits ausgewachsene Tiere (z. B. Krümel als Legende) bekommen ihr Ei
  const ev = []; P.pets.forEach(p=>checkGrown(p, ev)); if(ev.length) K.save();

  K.render();
  setTimeout(()=>{
    const m = K.effMood(), c = CHARS[K.active().character];
    if(K.isEgg(K.active()) && K.active().species!=="kruemel") K.say("*wackel wackel*", 2500);
    else if(P.lastPlayed && m < 40) K.say("Ich hab dich vermisst…", 3500);
    else if(!P.lastPlayed) K.say("Hallo! Füttere mich mit Wissen!", 3500);
    else K.say(c ? pick(c.idle) : (opts.greeting || "Hi!"), 2500);
  }, 400);
  setTimeout(()=>{ showIntro(); ev.forEach(e=>reactEvent(e)); }, 650);
};

function showIntro(){
  const i = P.intro;
  if(i){
    P.intro = null;
    const kn = (K.kruemel()||K.active()).name;
    if(i.kind==="wardrobe") celebrate("Neu: " + kn + "s Kleiderschrank!", (i.earlier>0 ? "Für alles, was du schon geübt hast, bekommst du " + i.earlier + " 🪙, plus 20 🪙 Startgeschenk." : "Als Startgeschenk bekommst du 20 🪙.") + " Such " + kn + " was Schickes aus!");
    else if(i.kind==="moved") celebrate(kn + " ist umgezogen!", "Willkommen in der Lernwelt. Dein Fortschritt, deine Münzen und deine Sachen sind alle mitgekommen.");
    else if(i.kind==="imported") celebrate("Spielstand geladen!", kn + " ist wieder da, mit allem, was du schon geschafft hast.");
    else celebrate("Hallo, ich bin " + kn + "!", "Ich bin noch ein Ei. Mit jeder richtigen Antwort wachse ich. Als Startgeschenk bekommst du 20 🪙 für den Kleiderschrank.");
  }
  if(P.zooIntro){
    P.zooIntro = false;
    const kn = (K.kruemel()||K.active()).name;
    celebrate("Neu: dein Zoo!", "Wenn " + kn + " ausgewachsen ist, taucht ein Zufalls-Ei auf. Manche sind ganz gewöhnlich, manche unglaublich selten. Jedes Tier hat seinen eigenen Charakter und ein Lieblingsfach. Schau auf der Übersicht in deinen Zoo!");
  }
  K.save();
}

K.render = function(){
  if($("kPet")){
    const pet = K.active(), st = K.petStage(pet), mood = K.effMood(), stages = stagesOf(pet);
    const isK = pet.species==="kruemel";
    const wear = isK && tryOn ? Object.assign({}, pet.wear, {[ITEM_BY_ID[tryOn].slot]:tryOn}) : null;
    $("kPet").innerHTML = K.drawPet(pet, mood, wear);
    $("kPet").classList.toggle("egg-wobble", st===0);
    if(!$("kNameInput")) $("kName").textContent = pet.name;
    $("kStage").textContent = K.petLabel(pet);
    if(st < stages.length-1){
      const a = stages[st].xp, b = stages[st+1].xp;
      $("kXpLabel").textContent = st===0 ? "Bis zum Schlüpfen" : "Bis zum Wachsen";
      $("kXpNum").textContent = (b - pet.xp) + " XP";
      $("kXpFill").style.width = Math.min(100,(pet.xp-a)/(b-a)*100) + "%";
    }else{
      $("kXpLabel").textContent = "Ausgewachsen";
      $("kXpNum").textContent = pet.xp + " XP";
      $("kXpFill").style.width = "100%";
    }
    $("kMoodFill").style.width = mood + "%";
    $("kMoodLabel").textContent = mood>=80 ? "überglücklich" : mood>=60 ? "fröhlich" : mood>=30 ? "geht so" : "traurig";
    const dc = K.dayCorrect();
    $("kGoalFill").style.width = Math.min(100, dc/K.DAILY_GOAL*100) + "%";
    $("kGoalLabel").textContent = dc>=K.DAILY_GOAL ? "geschafft ✓" : dc + " / " + K.DAILY_GOAL;
    const ds = K.dayStreak();
    const chips = (opts.chips ? opts.chips() : []).concat([
      {text:"📅 " + ds + (ds===1?" Tag":" Tage") + " am Stück" + ((P.bestDayStreak||0) > 0 ? " (Rekord " + P.bestDayStreak + ")" : "")},
      {text:"🪙 " + P.coins, cls:"coins", id:"kCoins"}
    ]);
    $("kChips").innerHTML = chips.map(c=>`<span class="chip ${c.cls||""}"${c.id?` id="${c.id}"`:""}>${esc(c.text)}</span>`).join("");
    if(!$("kShop").hidden) renderShop();
  }
  if(zoo) renderZoo();
};

let bubbleTimer;
K.say = function(text, ms=2200){
  const b = $("kBubble"); if(!b) return;
  b.textContent = text; b.classList.add("show");
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(()=>b.classList.remove("show"), ms);
};
function animate(cls){ const p = $("kPet"); if(!p) return; p.classList.remove("hop","droop"); void p.offsetWidth; p.classList.add(cls); }
const LINES_IDK = ["Kein Stress, Brudi.","Merk's dir!","Nächstes Mal!"];

K.react = function(res, r){
  const c = CHARS[K.active().character] || CHARS.verfressen;
  if(r.ok){
    const f = $("kFloat");
    f.textContent = "+" + res.xp + " XP" + (res.fav ? " ❤️" : "") + (res.coins ? "\n+" + res.coins + " 🪙" : "");
    f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    animate("hop");
    if(r.fixed) K.say("Fehler besiegt!");
    else if(r.combo && r.combo % 5 === 0) K.say(r.combo + "er-Serie! 🔥");
    else if(!res.full) K.say("Ich bin satt davon… probier mal was anderes!");
    else K.say(pick(c.ok));
  }else{
    animate("droop");
    K.say(r.gaveUp ? pick(LINES_IDK) : pick(c.bad));
  }
  res.events.forEach(reactEvent);
  K.render();
  const cc = $("kCoins"); if(cc && res.coins){ cc.classList.remove("bump"); void cc.offsetWidth; cc.classList.add("bump"); }
};

function reactEvent(e){
  if(e.type==="goal" && e.record) celebrate("Neuer Rekord: " + P.dayStreak + " Tage am Stück!", "So lange hast du noch nie durchgehalten. " + K.active().name + " platzt vor Stolz!");
  if(e.type==="goal") celebrate("Tagesziel geschafft!", "Bonus: +" + COIN.dailyGoal + " 🪙. " + (P.dayStreak>1 ? P.dayStreak + " Tage am Stück! " + K.active().name + " ist mega stolz auf dich." : K.active().name + " ist satt und glücklich. Komm morgen wieder, dann startet deine Tages-Serie!"));
  if(e.type==="stage"){
    const pet = petById(e.pet), sp = SPECIES[pet.species], stages = stagesOf(pet);
    if(pet.species==="kruemel"){
      celebrate(e.from===0 ? pet.name + " ist geschlüpft!" : pet.name + " ist gewachsen!", "Neue Stufe: " + stages[e.to].name + ". Geschenk: +" + COIN.stageUp + " 🪙" + (ITEMS.some(i=>i.minStage===e.to) ? " und neue Sachen im Kleiderschrank!" : "."), {pet:pet.id});
    }else if(e.from===0){
      const ch = CHARS[pet.character];
      celebrate("Es ist geschlüpft!", "Art: " + sp.name + ". Seltenheit: " + RARITY[sp.rarity].label + ". Charakter: " + ch.emoji + " " + ch.label + ". Lieblingsfach: " + pet.fav + ". Geschenk: +" + COIN.stageUp + " 🪙", {pet:pet.id, nameFor:pet.id});
    }else{
      celebrate(pet.name + " ist gewachsen!", "Neue Stufe: " + stages[e.to].name + ". Geschenk: +" + COIN.stageUp + " 🪙", {pet:pet.id});
    }
  }
  if(e.type==="newEgg"){
    const egg = petById(e.pet), from = petById(e.from);
    celebrate("Ein neues Ei!", from.name + " ist ausgewachsen. Dafür liegt jetzt ein neues Ei im Zoo, und ab sofort wächst das Ei. Seltenheit: " + RARITY[SPECIES[egg.species].rarity].label + ". Im Zoo kannst du jederzeit wechseln, wer wächst.", {pet:egg.id});
  }
  if(e.type==="full") celebrate("Pause für dieses Thema?", "Du hast heute schon " + K.TRAINER_DAILY_FULL + " richtige Antworten hier. Ab jetzt gibt es in diesem Trainer halbe XP und weniger Münzen. In einem anderen Trainer gibt es wieder volle Belohnung!");
}

// ---- Feier-Dialog ----
const queue = [];
let returnFocus = null, holding = false, current = null;
K.hold = function(on){ holding = on; if(!on && queue.length && $("kCel") && $("kCel").hidden) nextCelebration(); };
function celebrate(title, text, o={}){
  queue.push({title, text, o});
  if(!holding && $("kCel") && $("kCel").hidden) nextCelebration();
}
K.celebrate = celebrate;
function nextCelebration(){
  const cel = $("kCel"); if(!cel) return;
  if(current && current.o.nameFor){
    const v = $("kCelNameInput").value.trim();
    if(v) K.renamePet(current.o.nameFor, v);
  }
  const c = current = queue.shift();
  if(!c){ cel.hidden = true; if(returnFocus && returnFocus.focus) returnFocus.focus(); returnFocus = null; K.render(); return; }
  if(cel.hidden) returnFocus = document.activeElement;
  const pet = (c.o.pet && petById(c.o.pet)) || K.active();
  $("kCelPet").innerHTML = K.drawPet(pet, 100);
  $("kCelTitle").textContent = c.title;
  $("kCelText").textContent = c.text;
  $("kCelName").hidden = !c.o.nameFor;
  cel.hidden = false;
  if(c.o.nameFor){
    const p = petById(c.o.nameFor);
    $("kCelNameInput").value = p.named ? p.name : SPECIES[p.species].def;
    $("kCelNameInput").focus(); $("kCelNameInput").select();
  }else $("kCelOk").focus();
}

// ---- Namen ändern (aktives Tier) ----
function renameStart(){
  const btn = $("kName"), pet = K.active();
  const inp = document.createElement("input");
  inp.className = "name-input"; inp.id = "kNameInput"; inp.value = pet.name; inp.maxLength = 18;
  inp.setAttribute("aria-label","Name für dein Tier");
  btn.replaceWith(inp); inp.focus(); inp.select();
  inp.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); inp.blur(); } if(e.key==="Escape"){ inp.value = pet.name; inp.blur(); } });
  inp.addEventListener("blur", ()=>{
    const v = inp.value.trim();
    inp.replaceWith(btn);
    if(v && v!==pet.name) K.renamePet(pet.id, v); else K.render();
  }, {once:true});
}

// ---- Kleiderschrank (Krümel) ----
function itemState(it){
  const k = K.kruemel();
  if(k.wear[it.slot]===it.id) return "worn";
  if(P.owned.includes(it.id)) return "owned";
  if(it.reward) return "reward";
  if(it.minStage && K.petStage(k) < it.minStage) return "locked";
  if(tryOn===it.id) return "trying";
  return P.coins >= it.price ? "buy" : "poor";
}
function renderShop(){
  const k = K.kruemel(), st = K.petStage(k);
  const notK = K.active().species!=="kruemel";
  $("kShopNote").textContent = (notK ? "Bisher kann nur " + k.name + " Sachen tragen. " : "") + (st===0
    ? "Du hast " + P.coins + " 🪙. Du kannst schon einkaufen. Sehen kann man die Sachen, sobald " + k.name + " geschlüpft ist."
    : "Du hast " + P.coins + " 🪙. Tippe etwas an, um es anzuprobieren. Nochmal tippen zum Kaufen.");
  const body = $("kShopBody"); body.textContent = "";
  const prev = Math.max(1, st);
  for(const [slot,label] of SLOTS){
    const h = document.createElement("h3"); h.textContent = label; body.append(h);
    const grid = document.createElement("div"); grid.className = "items";
    for(const it of ITEMS.filter(i=>i.slot===slot)){
      const state = itemState(it);
      const b = document.createElement("button"); b.type = "button"; b.className = "item " + state;
      const mini = document.createElement("span"); mini.className = "mini";
      mini.innerHTML = petSVG(prev, 80, Object.assign({}, k.wear, {[slot]:it.id}), k.xp);
      const n = document.createElement("span"); n.className = "iname"; n.textContent = it.name;
      const tr = it.reward ? K.TRAINERS.find(x=>x.id===it.reward) : null;
      const t = document.createElement("span"); t.className = "istat";
      t.textContent =
        state==="worn" ? "trägt " + k.name + " ✓" : state==="owned" ? "anziehen" :
        state==="reward" ? "🎓 " + (tr ? tr.title + " meistern" : "Spezial") :
        state==="locked" ? "🔒 ab Stufe " + STAGES[it.minStage].name :
        state==="trying" ? "kaufen: " + it.price + " 🪙" :
        state==="buy" ? it.price + " 🪙" : it.price + " 🪙 (noch " + (it.price-P.coins) + ")";
      b.append(mini, n, t);
      b.onclick = () => itemClick(it, tr);
      grid.append(b);
    }
    body.append(grid);
  }
}
function itemClick(it, tr){
  const k = K.kruemel(), state = itemState(it);
  const talk = (txt, ms) => { if(K.active()===k) K.say(txt, ms); };
  if(state==="worn"){ delete k.wear[it.slot]; tryOn = null; K.save(); talk("Ausgezogen."); }
  else if(state==="owned"){ k.wear[it.slot] = it.id; tryOn = null; K.save(); if(K.active()===k) animate("hop"); talk("Schick!"); }
  else if(state==="reward"){ talk("Gibt's nur, wenn du " + (tr ? tr.title : "das Thema") + " meisterst!", 3000); }
  else if(state==="locked"){ talk("Erst wenn ich " + STAGES[it.minStage].name + " bin!"); }
  else if(state==="poor"){ tryOn = it.id; talk("Noch " + (it.price-P.coins) + " 🪙 sammeln!"); }
  else if(state==="buy"){ tryOn = it.id; talk("Steht mir, oder?"); }
  else if(state==="trying"){
    P.coins -= it.price; P.owned.push(it.id); k.wear[it.slot] = it.id; tryOn = null;
    K.save(); if(K.active()===k) animate("hop"); talk("Juhu, danke!");
  }
  K.render();
}
function openShop(open){
  $("kShop").hidden = !open;
  $("kWardrobeBtn").setAttribute("aria-expanded", open);
  $("kWardrobeBtn").textContent = open ? "👕 Kleiderschrank schließen" : "👕 Kleiderschrank öffnen";
  tryOn = null;
  K.render();
  if(open) $("kShop").scrollIntoView({behavior:"smooth", block:"nearest"});
}

// =====================================================================
// Oberfläche: Zoo
// =====================================================================
let zoo = null;
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

K.mountZoo = function(el){
  el.classList.add("zoo");
  el.innerHTML = `<h2 class="subject">Dein Zoo</h2><p class="zoo-hint">Tippe ein Tier an.</p><div class="meadow" id="kMeadow"></div><div class="zoo-detail" id="kZooDetail" aria-live="polite"></div>`;
  zoo = {el, sel: K.active().id, pos:{}, busy:{}, nodes:{}, armed:false};
  renderZoo();
  setInterval(wander, 2600);
  setInterval(interact, 8000);
  setTimeout(interact, 2500);
};

function renderZoo(){
  const meadow = $("kMeadow"); if(!meadow) return;
  const mood = K.effMood();
  const n = P.pets.length;
  const size = n > 8 ? 64 : n > 5 ? 74 : 86;
  // Knoten anlegen oder aktualisieren
  P.pets.forEach((pet, i) => {
    let node = zoo.nodes[pet.id];
    if(!node){
      node = document.createElement("button");
      node.type = "button"; node.className = "zpet";
      node.innerHTML = `<span class="bubble zbubble"></span><span class="zsvg"></span>`;
      node.onclick = () => { zoo.sel = pet.id; zoo.armed = false; hop(pet.id); zsay(pet.id, K.isEgg(pet) ? "*wackel*" : pick((CHARS[pet.character]||CHARS.verfressen).idle)); renderZoo(); };
      meadow.append(node);
      zoo.nodes[pet.id] = node;
      zoo.pos[pet.id] = {x: 8 + ((i*37) % 80), lane: i % 3, flip:false};
    }
    const pos = zoo.pos[pet.id];
    node.style.width = node.style.height = (K.isEgg(pet) ? size*.75 : size) + "px";
    node.style.left = pos.x + "%";
    node.style.bottom = (8 + pos.lane*14) + "px";
    node.style.zIndex = 10 - pos.lane;
    node.classList.toggle("sel", zoo.sel===pet.id);
    node.classList.toggle("active", P.activePet===pet.id);
    node.setAttribute("aria-label", pet.name + ", " + K.petLabel(pet) + (P.activePet===pet.id ? ", wächst gerade" : ""));
    node.querySelector(".zsvg").innerHTML = K.drawPet(pet, mood);
    node.querySelector(".zsvg").classList.toggle("flip", pos.flip);
  });
  renderDetail();
}

function renderDetail(){
  const box = $("kZooDetail"); if(!box) return;
  const pet = petById(zoo.sel) || K.active();
  const sp = SPECIES[pet.species], egg = K.isEgg(pet) && pet.species!=="kruemel";
  const rar = RARITY[sp.rarity], ch = CHARS[pet.character], st = K.petStage(pet), stages = stagesOf(pet);
  const max = st >= stages.length-1;
  const pct = max ? 100 : Math.min(100, (pet.xp - stages[st].xp) / (stages[st+1].xp - stages[st].xp) * 100);
  box.innerHTML = `
    <div class="zd-pet">${K.drawPet(pet, K.effMood())}</div>
    <div class="zd-info">
      <p class="zd-name">${esc(pet.name)}</p>
      <p><span class="rarity" style="--rc:${rar.color}">${rar.label}</span> ${egg ? "Was wohl drin ist?" : esc(sp.name) + ": " + esc(stages[st].name)}</p>
      <p>Charakter: ${egg ? "???" : ch.emoji + " " + ch.label}<br>Lieblingsfach: ${egg ? "???" : "❤️ " + esc(pet.fav)}</p>
      <div class="bar"><div class="bar-label"><span>${max ? "Ausgewachsen" : st===0 ? "Bis zum Schlüpfen" : "Bis zum Wachsen"}</span><span>${max ? pet.xp + " XP" : (stages[st+1].xp - pet.xp) + " XP"}</span></div><div class="track"><div class="fill xp" style="width:${pct}%"></div></div></div>
      <div class="row">
        ${P.activePet===pet.id ? `<span class="chip grow">🌱 Wächst gerade</span>` : `<button type="button" class="primary small" id="kGrowBtn">🌱 Dieses Tier wachsen lassen</button>`}
        ${egg ? `<button type="button" class="secondary small" id="kRerollBtn"${P.coins < K.REROLL_COST ? " disabled" : ""}>${zoo.armed ? "Wirklich tauschen? Nochmal tippen" : "🎲 Anderes Ei (" + K.REROLL_COST + " 🪙)"}</button>` : ""}
      </div>
      ${egg ? `<p class="zd-note">${P.coins < K.REROLL_COST ? "Für ein anderes Ei brauchst du " + K.REROLL_COST + " 🪙, du hast " + P.coins + "." : "Ein anderes Ei ersetzt dieses. Die XP bleiben erhalten."}</p>
      <details class="odds"><summary>Wie selten ist was?</summary><table>${RARITY_ORDER.map(k=>`<tr><td><span class="rarity" style="--rc:${RARITY[k].color}">${RARITY[k].label}</span></td><td>${String(RARITY[k].chance).replace(".",",")} %</td><td>${Math.round(1/(RARITY[k].chance/100)) <= 2 ? "fast jedes 2. Ei" : "etwa jedes " + Math.round(100/RARITY[k].chance) + ". Ei"}</td></tr>`).join("")}</table></details>` : ""}
    </div>`;
  const g = $("kGrowBtn");
  if(g) g.onclick = () => { K.setActive(pet.id); hop(pet.id); zsay(pet.id, pet.species==="kruemel" || !egg ? "Juhu, ich wachse!" : "*freudiges Wackeln*"); };
  const r = $("kRerollBtn");
  if(r) r.onclick = () => {
    if(!zoo.armed){ zoo.armed = true; renderDetail(); return; }
    zoo.armed = false;
    const rarity = K.reroll(pet.id);
    if(rarity){ hop(pet.id); zsay(pet.id, RARITY[rarity].label + "!", 2600); }
  };
}

function zsay(id, text, ms=2400){
  const node = zoo && zoo.nodes[id]; if(!node) return;
  const b = node.querySelector(".zbubble");
  b.textContent = text; b.classList.add("show");
  clearTimeout(b._t); b._t = setTimeout(()=>b.classList.remove("show"), ms);
}
function hop(id){
  const node = zoo && zoo.nodes[id]; if(!node) return;
  const s = node.querySelector(".zsvg"); s.classList.remove("hop"); void s.offsetWidth; s.classList.add("hop");
}
function moveTo(id, x){
  const pos = zoo.pos[id], node = zoo.nodes[id];
  x = Math.max(4, Math.min(90, x));
  if(reduceMotion){ return; }
  pos.flip = x < pos.x;
  pos.x = x;
  node.style.left = x + "%";
  const s = node.querySelector(".zsvg");
  s.classList.toggle("flip", pos.flip);
  node.classList.add("walking"); clearTimeout(node._w); node._w = setTimeout(()=>node.classList.remove("walking"), 2400);
}
function wander(){
  if(!zoo || document.hidden) return;
  for(const pet of P.pets){
    if(K.isEgg(pet) || zoo.busy[pet.id] || Math.random() < .55) continue;
    moveTo(pet.id, zoo.pos[pet.id].x + (Math.random()*40 - 20));
  }
}
function interact(){
  if(!zoo || document.hidden) return;
  const hatched = P.pets.filter(p=>!K.isEgg(p));
  if(hatched.length < 2){
    if(hatched.length===1 && Math.random() < .5) zsay(hatched[0].id, pick(CHARS[hatched[0].character].idle));
    return;
  }
  const a = pick(hatched), b = pick(hatched.filter(p=>p!==a));
  if(zoo.busy[a.id] || zoo.busy[b.id]) return;
  zoo.busy[a.id] = zoo.busy[b.id] = true;
  const bx = zoo.pos[b.id].x;
  const ax = bx > 50 ? bx - 13 : bx + 13;
  moveTo(a.id, ax);
  zoo.pos[a.id].lane = zoo.pos[b.id].lane;
  zoo.nodes[a.id].style.bottom = (8 + zoo.pos[a.id].lane*14) + "px";
  // anschauen
  setTimeout(()=>{
    const aLeft = zoo.pos[a.id].x < zoo.pos[b.id].x;
    zoo.pos[a.id].flip = !aLeft; zoo.pos[b.id].flip = aLeft;
    zoo.nodes[a.id].querySelector(".zsvg").classList.toggle("flip", !aLeft);
    zoo.nodes[b.id].querySelector(".zsvg").classList.toggle("flip", aLeft);
    zsay(a.id, pick(CHARS[a.character].chat).replace("{b}", b.name), 2600); hop(a.id);
  }, reduceMotion ? 0 : 2500);
  setTimeout(()=>{ zsay(b.id, pick(CHARS[b.character].reply), 2600); hop(b.id); }, reduceMotion ? 1800 : 4300);
  setTimeout(()=>{ zoo.busy[a.id] = zoo.busy[b.id] = false; }, reduceMotion ? 4000 : 7000);
}
})();
