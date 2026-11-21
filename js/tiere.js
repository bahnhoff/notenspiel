/*
 * Eigene Tierzeichnungen im einheitlichen Stil: runder Kopf, kleiner Körper,
 * dunkle Umrisse, große Augen. Stimmung: "normal", "froh" oder "oje".
 */
(function (root) {
  "use strict";

  var UMRISS = 'stroke="#3d2b1f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  var FARBEN = {
    fuchs: { fell: "#f08a3c", hell: "#fff4e3", innen: "#7a3b17" },
    hase: { fell: "#d9d4ce", hell: "#ffffff", innen: "#f4a9b8" },
    katze: { fell: "#9aa5b4", hell: "#f3f1ee", innen: "#f4a9b8" }
  };

  function ohren(art, f) {
    if (art === "fuchs") {
      return '<path d="M30 44 L32 8 L56 30 Z" fill="' + f.fell + '" ' + UMRISS + "/>" +
        '<path d="M90 44 L88 8 L64 30 Z" fill="' + f.fell + '" ' + UMRISS + "/>" +
        '<path d="M35 34 L36 18 L48 30 Z" fill="' + f.innen + '"/>' +
        '<path d="M85 34 L84 18 L72 30 Z" fill="' + f.innen + '"/>';
    }
    if (art === "hase") {
      return '<ellipse cx="44" cy="20" rx="9" ry="24" transform="rotate(-10 44 20)" fill="' + f.fell + '" ' + UMRISS + "/>" +
        '<ellipse cx="76" cy="20" rx="9" ry="24" transform="rotate(10 76 20)" fill="' + f.fell + '" ' + UMRISS + "/>" +
        '<ellipse cx="44" cy="22" rx="4" ry="16" transform="rotate(-10 44 22)" fill="' + f.innen + '"/>' +
        '<ellipse cx="76" cy="22" rx="4" ry="16" transform="rotate(10 76 22)" fill="' + f.innen + '"/>';
    }
    // Katze
    return '<path d="M30 42 L30 14 L54 30 Z" fill="' + f.fell + '" ' + UMRISS + "/>" +
      '<path d="M90 42 L90 14 L66 30 Z" fill="' + f.fell + '" ' + UMRISS + "/>" +
      '<path d="M34 34 L34 22 L46 30 Z" fill="' + f.innen + '"/>' +
      '<path d="M86 34 L86 22 L74 30 Z" fill="' + f.innen + '"/>';
  }

  function schwanz(art, f) {
    if (art === "fuchs") {
      return '<path d="M80 100 C104 98 112 78 104 64 C100 80 92 88 78 90 Z" fill="' + f.fell + '" ' + UMRISS + "/>" +
        '<path d="M104 64 C107 70 107 76 105 80 C101 76 101 70 104 64 Z" fill="' + f.hell + '"/>';
    }
    if (art === "hase") {
      return '<circle cx="86" cy="100" r="8" fill="' + f.hell + '" ' + UMRISS + "/>";
    }
    return '<path d="M82 102 C104 102 108 86 100 74" fill="none" stroke="#3d2b1f" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M82 102 C104 102 108 86 100 74" fill="none" stroke="' + f.fell + '" stroke-width="4.5" stroke-linecap="round"/>';
  }

  function gesicht(art, f, stimmung) {
    var teile = [];
    // helle Gesichtspartie
    if (art === "fuchs") {
      teile.push('<path d="M28 56 C40 50 50 58 60 64 C70 58 80 50 92 56 C90 76 76 84 60 84 C44 84 30 76 28 56 Z" fill="' + f.hell + '"/>');
    } else {
      teile.push('<ellipse cx="60" cy="70" rx="18" ry="12" fill="' + f.hell + '"/>');
    }
    if (art === "katze") {
      // Streifen auf der Stirn
      teile.push('<path d="M54 30 L56 40 M60 28 L60 40 M66 30 L64 40" stroke="#6f7a89" stroke-width="2.5" stroke-linecap="round"/>');
    }
    // Augen
    if (stimmung === "froh") {
      teile.push('<path d="M41 54 Q47 46 53 54" fill="none" stroke="#2a1d14" stroke-width="3" stroke-linecap="round"/>');
      teile.push('<path d="M67 54 Q73 46 79 54" fill="none" stroke="#2a1d14" stroke-width="3" stroke-linecap="round"/>');
    } else {
      teile.push('<ellipse cx="47" cy="52" rx="5" ry="6" fill="#2a1d14"/><circle cx="48.6" cy="49.8" r="1.8" fill="#fff"/>');
      teile.push('<ellipse cx="73" cy="52" rx="5" ry="6" fill="#2a1d14"/><circle cx="74.6" cy="49.8" r="1.8" fill="#fff"/>');
      if (stimmung === "oje") {
        teile.push('<path d="M40 44 L51 40 M80 44 L69 40" stroke="#2a1d14" stroke-width="2.5" stroke-linecap="round"/>');
      }
    }
    // Bäckchen
    teile.push('<ellipse cx="38" cy="64" rx="6" ry="3.5" fill="#f27c8c" opacity="0.45"/>');
    teile.push('<ellipse cx="82" cy="64" rx="6" ry="3.5" fill="#f27c8c" opacity="0.45"/>');
    // Nase
    var nase = art === "fuchs" ? "#2a1d14" : "#e7788b";
    teile.push('<ellipse cx="60" cy="64" rx="4.5" ry="3.2" fill="' + nase + '"/>');
    // Mund
    if (stimmung === "froh") {
      teile.push('<path d="M53 69 Q60 79 67 69 Z" fill="#c2414f" stroke="#2a1d14" stroke-width="2" stroke-linejoin="round"/>');
    } else if (stimmung === "oje") {
      teile.push('<ellipse cx="60" cy="73" rx="3" ry="3.5" fill="#2a1d14"/>');
    } else {
      teile.push('<path d="M54 69 Q57 72 60 69 Q63 72 66 69" fill="none" stroke="#2a1d14" stroke-width="2" stroke-linecap="round"/>');
    }
    if (art === "katze" || art === "hase") {
      teile.push('<path d="M20 64 L36 66 M20 72 L36 70 M100 64 L84 66 M100 72 L84 70" stroke="#3d2b1f" stroke-width="1.6" stroke-linecap="round"/>');
    }
    return teile.join("");
  }

  function zeichne(art, stimmung, beschriftung) {
    var f = FARBEN[art] || FARBEN.fuchs;
    var kopfFarbe = f.fell;
    return '<svg class="tier-svg" viewBox="0 0 120 120" role="img" aria-label="' + (beschriftung || "") + '" xmlns="http://www.w3.org/2000/svg">' +
      schwanz(art, f) +
      // Körper und Bauch
      '<ellipse cx="60" cy="96" rx="27" ry="20" fill="' + f.fell + '" ' + UMRISS + "/>" +
      '<ellipse cx="60" cy="100" rx="15" ry="13" fill="' + f.hell + '"/>' +
      // Pfoten
      '<ellipse cx="47" cy="114" rx="8" ry="5" fill="' + f.fell + '" ' + UMRISS + "/>" +
      '<ellipse cx="73" cy="114" rx="8" ry="5" fill="' + f.fell + '" ' + UMRISS + "/>" +
      ohren(art, f) +
      // Kopf
      '<ellipse cx="60" cy="58" rx="34" ry="29" fill="' + kopfFarbe + '" ' + UMRISS + "/>" +
      gesicht(art, f, stimmung) +
      "</svg>";
  }

  root.Tiere = { zeichne: zeichne };
})(this);
