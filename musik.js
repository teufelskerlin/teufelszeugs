/* Musik-Grafiken für die Musik-Trainer: Notensystem, Violinschlüssel, Noten */
(function(){
"use strict";
const M = window.Musik = {};

// Notensystem: Linien bei y = TOP + i*GAP (i=0 oben: f'', i=4 unten: e')
const GAP = 16, TOP = 40;
M.GAP = GAP; M.TOP = TOP;
M.lineY = i => TOP + i*GAP;
M.BOTTOM = TOP + 4*GAP;

// C-Dur von g bis g''. Index i in NOTES, Position p relativ zu c' (c' = 0, e' = unterste Linie = 2)
M.NOTES = ["g","a","h","c'","d'","e'","f'","g'","a'","h'","c''","d''","e''","f''","g''"];
M.OFFSET = 3;                         // NOTES[i] liegt auf Position p = i - OFFSET
M.posOf = i => i - M.OFFSET;
M.yOf = p => M.BOTTOM - (p-2)*(GAP/2);
M.onLine = p => p % 2 === 0;
// Tonhöhen in Hz (gleichstufig, a' = 440)
M.FREQ = {"g":196.00,"a":220.00,"h":246.94,"c'":261.63,"d'":293.66,"e'":329.63,"f'":349.23,"g'":392.00,"a'":440.00,"h'":493.88,"c''":523.25,"d''":587.33,"e''":659.26,"f''":698.46,"g''":783.99};          // Linien und Hilfslinien
// Hilfslinien unter dem System (c' = 1. Hilfslinie, a = 2. Hilfslinie)
M.ledgersFor = p => { const out = []; for(let q = 0; q >= p; q -= 2) out.push(M.yOf(q)); return out; };

M.staff = (x1, x2) => [0,1,2,3,4].map(i=>`<line x1="${x1}" x2="${x2}" y1="${M.lineY(i)}" y2="${M.lineY(i)}" stroke="currentColor" stroke-width="1.6"/>`).join("");

M.clef = (x=22) => `<g transform="translate(${x-22} 0)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
  <path d="M38 91 C31 92 28 84 33 79 C40 73 51 79 50 90 C49 101 36 107 26 100 C14 91 20 74 33 64 C44 55 49 44 45 31 C43 23 36 22 34 31 C31 46 37 92 39 114 C40 124 33 130 27 126 C22 122 24 115 30 116" stroke-width="3.2"/>
  <circle cx="28" cy="120" r="4" fill="currentColor" stroke="none"/></g>`;

M.timeSig = (x, top, bottom) => `<g font-family="'Bricolage Grotesque', system-ui, sans-serif" font-weight="800" font-size="30" text-anchor="middle" fill="currentColor"><text x="${x}" y="${M.lineY(2)-3}">${top}</text><text x="${x}" y="${M.lineY(4)-3}">${bottom}</text></g>`;

// Notenkopf + Hals. kind: "w" (ganz), "h" (halb), "q" (viertel), "e" (achtel); dot = punktiert
M.note = function(x, y, kind="q", opt={}){
  const color = opt.color || "currentColor";
  const up = opt.stemUp !== undefined ? opt.stemUp : y >= M.lineY(2);
  let s = "";
  if(opt.ledger){ s += opt.ledger.map(ly=>`<line x1="${x-14}" x2="${x+14}" y1="${ly}" y2="${ly}" stroke="currentColor" stroke-width="1.6"/>`).join(""); }
  if(kind==="w"){
    s += `<ellipse cx="${x}" cy="${y}" rx="9.5" ry="6.3" fill="var(--sheet, #fff)" stroke="${color}" stroke-width="3.2"/>`;
  }else{
    const open = kind==="h";
    s += `<ellipse cx="${x}" cy="${y}" rx="8.2" ry="5.8" transform="rotate(-20 ${x} ${y})" fill="${open ? "var(--sheet, #fff)" : color}" stroke="${color}" stroke-width="${open ? 2.8 : 1}"/>`;
    const sx = up ? x + 7.4 : x - 7.4, sy = y + (up ? -2 : 2), ey = up ? y - 44 : y + 44;
    s += `<line x1="${sx}" x2="${sx}" y1="${sy}" y2="${ey}" stroke="${color}" stroke-width="2.2"/>`;
    if(kind==="s"){
      for(const off of [0, 9]){
        const fy = up ? ey + off : ey - off;
        s += up
          ? `<path d="M${sx} ${fy} C${sx+1} ${fy+8} ${sx+13} ${fy+11} ${sx+10} ${fy+24} C${sx+9} ${fy+16} ${sx+4} ${fy+14} ${sx} ${fy+12} Z" fill="${color}"/>`
          : `<path d="M${sx} ${fy} C${sx+1} ${fy-8} ${sx+13} ${fy-11} ${sx+10} ${fy-24} C${sx+9} ${fy-16} ${sx+4} ${fy-14} ${sx} ${fy-12} Z" fill="${color}"/>`;
      }
    }
    if(kind==="e"){
      s += up
        ? `<path d="M${sx} ${ey} C${sx+1} ${ey+10} ${sx+14} ${ey+14} ${sx+10} ${ey+30} C${sx+9} ${ey+20} ${sx+4} ${ey+17} ${sx} ${ey+15} Z" fill="${color}"/>`
        : `<path d="M${sx} ${ey} C${sx+1} ${ey-10} ${sx+14} ${ey-14} ${sx+10} ${ey-30} C${sx+9} ${ey-20} ${sx+4} ${ey-17} ${sx} ${ey-15} Z" fill="${color}"/>`;
    }
  }
  if(opt.dot) s += `<circle cx="${x+15}" cy="${y-4}" r="2.8" fill="${color}"/>`;
  return s;
};
})();
