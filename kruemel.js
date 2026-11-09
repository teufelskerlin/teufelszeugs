/* Krümels Lernwelt – gemeinsamer Kern für alle Trainer.
   Neue Trainer: in TRAINERS eintragen, Ordner anlegen, Kruemel.award() aufrufen. */
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

// =====================================================================
// Einstellungen
// =====================================================================
K.DAILY_GOAL = 20;            // richtige Antworten pro Tag, egal in welchem Trainer
K.TRAINER_DAILY_FULL = 40;    // danach gibt ein Trainer an dem Tag nur halbe XP und keine Grund-Münzen
K.MASTERY = 3;                // so oft richtig = gemeistert
const COIN = {correct:1, combo5:3, fixed:3, dailyGoal:10, stageUp:20};
const SCHEMA = 1;
const PROFILE_KEY = "kruemel:profile";
const TKEY = id => "kruemel:trainer:" + id;
const LEGACY_GAME = "irregular-verbs-game-v1", LEGACY_MISTAKES = "irregular-verbs-mistakes-v1";

const STAGES = K.STAGES = [
  {xp:0, name:"Ei"}, {xp:60, name:"Frisch geschlüpft"}, {xp:200, name:"Baby"}, {xp:450, name:"Kind"},
  {xp:850, name:"Teenie"}, {xp:1400, name:"Groß und stark"}, {xp:2200, name:"Legende"}
];
const COLORS = ["#F3EBDD","#9BE0C0","#6CCCA8","#5DB8D6","#7D95F7","#A47BF5","#F4B93A"];

// =====================================================================
// Speicher
// =====================================================================
const read = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const write = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } };

const dayStr = (d=new Date()) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const daysBetween = (a,b) => Math.round((new Date(b+"T12:00")-new Date(a+"T12:00"))/86400000);
const today = () => dayStr();

function freshProfile(){
  return {version:SCHEMA, name:"Krümel", xp:0, coins:20, mood:70, owned:[], wear:{},
    lastPlayed:null, day:null, dayCorrect:0, goalDay:null, dayStreak:0,
    trainerDay:{day:null, counts:{}}, intro:null,
    bestDayStreak:0, time:{total:0, day:null, today:0, trainers:{}}};
}
function freshTrainer(){ return {mistakes:{}, mastery:{}, bestCombo:0}; }

// Spielstand der ersten Version (eine einzelne Datei) in das neue Format übersetzen
function fromLegacy(g, m){
  const p = freshProfile();
  const t = freshTrainer();
  if(g){
    for(const f of ["name","xp","mood","lastPlayed","day","dayCorrect","goalDay","dayStreak"]) if(g[f]!==undefined && g[f]!==null) p[f] = g[f];
    if(Array.isArray(g.owned)) p.owned = g.owned.slice();
    if(g.wear) p.wear = Object.assign({}, g.wear);
    if(g.coins !== undefined){ p.coins = g.coins; }
    else { const earlier = Math.round((g.xp||0)/6); p.coins = earlier + 20; p.intro = {kind:"wardrobe", earlier}; }
    t.bestCombo = g.bestCombo || 0;
  }
  if(m) t.mistakes = Object.assign({}, m);
  return {profile:p, trainer:t};
}

function upgrade(p){
  // Spätere Formatänderungen hier nachrüsten: if(p.version < 2){ ...; p.version = 2; }
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
    P = freshProfile();
    P.intro = {kind:"welcome"};
  }
}
P = upgrade(P);
write(PROFILE_KEY, P);

K.profile = () => P;
K.save = () => write(PROFILE_KEY, P);
K.trainer = id => Object.assign(freshTrainer(), read(TKEY(id)) || {});
K.saveTrainer = (id, data) => write(TKEY(id), data);
K.masteredCount = id => { const t = K.trainer(id); return Object.values(t.mastery||{}).filter(n=>n>=K.MASTERY).length; };

// =====================================================================
// Abgeleitete Werte
// =====================================================================
K.stageIndex = (xp=P.xp) => { let i=0; STAGES.forEach((s,k)=>{ if(xp>=s.xp) i=k; }); return i; };
K.effMood = () => {
  if(!P.lastPlayed) return P.mood;
  const gap = daysBetween(P.lastPlayed, today());
  return gap>=2 ? Math.max(10, P.mood - 15*(gap-1)) : P.mood;
};
K.dayCorrect = () => P.day===today() ? P.dayCorrect : 0;
K.dayStreak = () => (P.goalDay && daysBetween(P.goalDay, today())<=1) ? P.dayStreak : 0;

// =====================================================================
// Accessoires
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
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i=>[i.id,i]));
K.ITEMS = ITEMS;

// =====================================================================
// Krümel zeichnen
// =====================================================================
function petSVG(stage, mood, wear=P.wear||{}){
  const c = COLORS[stage];
  if(stage===0){
    const frac = (P.xp - STAGES[0].xp)/(STAGES[1].xp - STAGES[0].xp);
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


K.petSVG = petSVG;

// =====================================================================
// Belohnungen
// =====================================================================
const events = [];
// r = {ok, gaveUp, combo, fixed}
K.award = function(trainerId, r){
  const t = today();
  const moodNow = K.effMood();
  const stBefore = K.stageIndex();
  if(P.day !== t){ P.day = t; P.dayCorrect = 0; }
  if(P.trainerDay.day !== t) P.trainerDay = {day:t, counts:{}};
  P.lastPlayed = t;
  const res = {xp:0, coins:0, full:true, events:[]};
  if(r.ok){
    const n = P.trainerDay.counts[trainerId] = (P.trainerDay.counts[trainerId]||0) + 1;
    res.full = n <= K.TRAINER_DAILY_FULL;
    let xp = 10 + Math.min((r.combo||1)-1, 10) + (r.fixed ? 15 : 0);
    if(!res.full) xp = Math.ceil(xp/2);
    let coins = (res.full ? COIN.correct : 0);
    if(r.combo && r.combo % 5 === 0) coins += COIN.combo5;
    if(r.fixed) coins += COIN.fixed;
    P.xp += xp; res.xp = xp;
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
  const stAfter = K.stageIndex();
  if(stAfter > stBefore){
    P.coins += COIN.stageUp; res.coins += COIN.stageUp;
    res.events.push({type:"stage", from:stBefore, to:stAfter});
  }
  K.save();
  return res;
};

// Spezial-Teil für ein gemeistertes Thema
K.grantReward = function(itemId){
  const it = ITEM_BY_ID[itemId];
  if(!it || P.owned.includes(itemId)) return false;
  P.owned.push(itemId);
  K.save();
  celebrate("Spezial-Teil freigeschaltet!", "Du hast alles gemeistert und bekommst: " + it.name + ". Du findest es im Kleiderschrank.");
  return true;
};


// Bonus-Münzen (z. B. für Rekorde)
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
// Oberfläche
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
  cel.innerHTML = `<div class="celebrate-card"><div class="big" id="kCelPet"></div><h2 id="kCelTitle"></h2><p id="kCelText"></p><button type="button" class="primary" id="kCelOk">Weiter</button></div>`;
  document.body.append(cel);

  $("kName").onclick = renameStart;
  $("kWardrobeBtn").onclick = () => openShop($("kShop").hidden);
  $("kShopClose").onclick = () => { openShop(false); $("kWardrobeBtn").focus(); };
  $("kCelOk").onclick = nextCelebration;
  cel.addEventListener("keydown", e=>{ if(e.key==="Escape"||e.key==="Enter"){ e.preventDefault(); nextCelebration(); } });

  K.render();
  setTimeout(()=>{
    const m = K.effMood();
    if(P.lastPlayed && m < 40) K.say("Ich hab dich vermisst…", 3500);
    else if(!P.lastPlayed) K.say("Hallo! Füttere mich mit Wissen!", 3500);
    else K.say(opts.greeting || "Hi! Los geht's!", 2500);
  }, 400);
  setTimeout(showIntro, 650);
};

function showIntro(){
  const i = P.intro; if(!i) return;
  P.intro = null; K.save();
  if(i.kind==="wardrobe") celebrate("Neu: " + P.name + "s Kleiderschrank!", (i.earlier>0 ? "Für alles, was du schon geübt hast, bekommst du " + i.earlier + " 🪙, plus 20 🪙 Startgeschenk." : "Als Startgeschenk bekommst du 20 🪙.") + " Such " + P.name + " was Schickes aus!");
  else if(i.kind==="moved") celebrate(P.name + " ist umgezogen!", "Willkommen in der Lernwelt. Dein Fortschritt, deine Münzen und deine Sachen sind alle mitgekommen.");
  else if(i.kind==="imported") celebrate("Spielstand geladen!", P.name + " ist wieder da, mit allem, was du schon geschafft hast.");
  else celebrate("Hallo, ich bin " + P.name + "!", "Ich bin noch ein Ei. Mit jeder richtigen Antwort wachse ich. Als Startgeschenk bekommst du 20 🪙 für den Kleiderschrank.");
}

K.render = function(){
  if(!$("kPet")) return;
  const st = K.stageIndex(), mood = K.effMood();
  const wear = tryOn ? Object.assign({}, P.wear, {[ITEM_BY_ID[tryOn].slot]:tryOn}) : P.wear;
  $("kPet").innerHTML = petSVG(st, mood, wear);
  $("kPet").classList.toggle("egg-wobble", st===0);
  if(!$("kNameInput")) $("kName").textContent = P.name;
  $("kStage").textContent = STAGES[st].name;
  if(st < STAGES.length-1){
    const a = STAGES[st].xp, b = STAGES[st+1].xp;
    $("kXpLabel").textContent = st===0 ? "Bis zum Schlüpfen" : "Bis zum Wachsen";
    $("kXpNum").textContent = (b - P.xp) + " XP";
    $("kXpFill").style.width = Math.min(100,(P.xp-a)/(b-a)*100) + "%";
  }else{
    $("kXpLabel").textContent = "Höchste Stufe erreicht";
    $("kXpNum").textContent = P.xp + " XP";
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
};

let bubbleTimer;
K.say = function(text, ms=2200){
  const b = $("kBubble"); if(!b) return;
  b.textContent = text; b.classList.add("show");
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(()=>b.classList.remove("show"), ms);
};
function animate(cls){ const p = $("kPet"); p.classList.remove("hop","droop"); void p.offsetWidth; p.classList.add(cls); }
const pick = a => a[Math.floor(Math.random()*a.length)];
const LINES_OK = ["Lecker!","Mehr davon!","Mjam!","Stark!","Yes!","Läuft bei dir!","Nice!"];
const LINES_BAD = ["Upsi…","Fast!","Nochmal üben?","Hmm…","Wird schon!"];
const LINES_IDK = ["Kein Stress, Brudi.","Merk's dir!","Nächstes Mal!"];

// Trainer rufen das nach jeder Antwort auf
K.react = function(res, r){
  if(r.ok){
    const f = $("kFloat");
    f.textContent = "+" + res.xp + " XP" + (res.coins ? "\n+" + res.coins + " 🪙" : "");
    f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    animate("hop");
    if(r.fixed) K.say("Fehler besiegt!");
    else if(r.combo && r.combo % 5 === 0) K.say(r.combo + "er-Serie! 🔥");
    else if(!res.full) K.say("Ich bin satt davon… probier mal was anderes!");
    else K.say(pick(LINES_OK));
  }else{
    animate("droop");
    K.say(r.gaveUp ? pick(LINES_IDK) : pick(LINES_BAD));
  }
  for(const e of res.events){
    if(e.type==="goal" && e.record) celebrate("Neuer Rekord: " + P.dayStreak + " Tage am Stück!", "So lange hast du noch nie durchgehalten. " + P.name + " platzt vor Stolz!");
    if(e.type==="goal") celebrate("Tagesziel geschafft!", "Bonus: +" + COIN.dailyGoal + " 🪙. " + (P.dayStreak>1 ? P.dayStreak + " Tage am Stück! " + P.name + " ist mega stolz auf dich." : P.name + " ist satt und glücklich. Komm morgen wieder, dann startet deine Tages-Serie!"));
    if(e.type==="stage") celebrate(e.from===0 ? P.name + " ist geschlüpft!" : P.name + " ist gewachsen!", "Neue Stufe: " + STAGES[e.to].name + ". Geschenk: +" + COIN.stageUp + " 🪙" + (ITEMS.some(i=>i.minStage===e.to) ? " und neue Sachen im Kleiderschrank!" : "."));
    if(e.type==="full") celebrate("Pause für dieses Thema?", "Du hast heute schon " + K.TRAINER_DAILY_FULL + " richtige Antworten hier. Ab jetzt gibt es in diesem Trainer halbe XP und weniger Münzen. In einem anderen Trainer gibt es wieder volle Belohnung!");
  }
  K.render();
  const c = $("kCoins"); if(c && res.coins){ c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
};

// ---- Feier-Dialog ----
const queue = [];
let returnFocus = null;
let holding = false;
K.hold = function(on){ holding = on; if(!on && queue.length && $("kCel") && $("kCel").hidden) nextCelebration(); };
function celebrate(title, text){
  queue.push({title, text});
  if(!holding && $("kCel") && $("kCel").hidden) nextCelebration();
}
K.celebrate = celebrate;
function nextCelebration(){
  const cel = $("kCel"); if(!cel) return;
  const c = queue.shift();
  if(!c){ cel.hidden = true; if(returnFocus && returnFocus.focus) returnFocus.focus(); returnFocus = null; return; }
  if(cel.hidden) returnFocus = document.activeElement;
  $("kCelPet").innerHTML = petSVG(K.stageIndex(), 100, P.wear);
  $("kCelTitle").textContent = c.title;
  $("kCelText").textContent = c.text;
  cel.hidden = false;
  $("kCelOk").focus();
}

// ---- Namen ändern ----
function renameStart(){
  const btn = $("kName");
  const inp = document.createElement("input");
  inp.className = "name-input"; inp.id = "kNameInput"; inp.value = P.name; inp.maxLength = 18;
  inp.setAttribute("aria-label","Name für dein Monster");
  btn.replaceWith(inp); inp.focus(); inp.select();
  inp.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); inp.blur(); } if(e.key==="Escape"){ inp.value = P.name; inp.blur(); } });
  inp.addEventListener("blur", ()=>{
    const v = inp.value.trim();
    if(v && v!==P.name){ P.name = v; K.save(); }
    inp.replaceWith(btn); K.render();
  }, {once:true});
}

// ---- Kleiderschrank ----
function itemState(it){
  if(P.wear[it.slot]===it.id) return "worn";
  if(P.owned.includes(it.id)) return "owned";
  if(it.reward) return "reward";
  if(it.minStage && K.stageIndex() < it.minStage) return "locked";
  if(tryOn===it.id) return "trying";
  return P.coins >= it.price ? "buy" : "poor";
}
function renderShop(){
  const st = K.stageIndex();
  $("kShopNote").textContent = st===0
    ? "Du hast " + P.coins + " 🪙. Du kannst schon einkaufen. Sehen kann man die Sachen, sobald " + P.name + " geschlüpft ist."
    : "Du hast " + P.coins + " 🪙. Tippe etwas an, um es anzuprobieren. Nochmal tippen zum Kaufen.";
  const body = $("kShopBody"); body.textContent = "";
  const prev = Math.max(1, st);
  for(const [slot,label] of SLOTS){
    const h = document.createElement("h3"); h.textContent = label; body.append(h);
    const grid = document.createElement("div"); grid.className = "items";
    for(const it of ITEMS.filter(i=>i.slot===slot)){
      const state = itemState(it);
      const b = document.createElement("button"); b.type = "button"; b.className = "item " + state;
      const mini = document.createElement("span"); mini.className = "mini";
      mini.innerHTML = petSVG(prev, 80, Object.assign({}, P.wear, {[slot]:it.id}));
      const n = document.createElement("span"); n.className = "iname"; n.textContent = it.name;
      const tr = it.reward ? K.TRAINERS.find(x=>x.id===it.reward) : null;
      const t = document.createElement("span"); t.className = "istat";
      t.textContent =
        state==="worn" ? "trägt er ✓" : state==="owned" ? "anziehen" :
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
  const state = itemState(it);
  if(state==="worn"){ delete P.wear[it.slot]; tryOn = null; K.save(); K.say("Ausgezogen."); }
  else if(state==="owned"){ P.wear[it.slot] = it.id; tryOn = null; K.save(); animate("hop"); K.say("Schick!"); }
  else if(state==="reward"){ K.say("Gibt's nur, wenn du " + (tr ? tr.title : "das Thema") + " meisterst!", 3000); }
  else if(state==="locked"){ K.say("Erst wenn ich " + STAGES[it.minStage].name + " bin!"); }
  else if(state==="poor"){ tryOn = it.id; K.say("Noch " + (it.price-P.coins) + " 🪙 sammeln!"); }
  else if(state==="buy"){ tryOn = it.id; K.say("Steht mir, oder?"); }
  else if(state==="trying"){
    P.coins -= it.price; P.owned.push(it.id); P.wear[it.slot] = it.id; tryOn = null;
    K.save(); animate("hop"); K.say("Juhu, danke!");
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
})();
