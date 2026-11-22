/*
 * Gemeinsame Klaviatur für „Klaviertasten“, „Spiel eine Melodie“ und „Fehler üben“.
 *
 *   var k = Klaviatur.baue(box, namen, beiTipp);
 *
 * Baut in `box` (Element mit der Klasse `klaviatur`) die Tasten von der
 * tiefsten bis zur höchsten Note aus `namen` (umgebung.namen), ohne Lücken,
 * alle in einer Reihe wie bei einem echten Klavier. Alle Tasten sind Knöpfe,
 * auch die schwarzen, und spielen beim Drücken ihren Ton (js/klang.js).
 * Für eine schwarze Taste zählt die Tonhöhe: fis¹ und ges¹ sind dieselbe
 * Taste. Das mittlere C ist markiert. `beiTipp(nr)` bekommt die Nummer der
 * Taste in `k.tasten`.
 *
 * Rückgabe:
 *   tasten            alle Tasten { art, el, toene, halbton, buchstabe, name, anzeige }
 *   mitSchwarz        gibt es schwarze Tasten?
 *   klinge(nr)        Ton der Taste spielen (nur im Tipp, sonst bleibt der Ton aus)
 *   zuruecksetzen()   Markierungen entfernen, Tasten wieder freigeben
 *   tastenTon(nr, note, antwortmodus)  der Ton der Taste, der als Antwort zählt
 *   zeigeAntwort(nr, a, ton)  markiert nach SpielLogik.antworte: getippt, Lösung
 *   weisseMit(buchstabe)      Nummern der weißen Tasten mit diesem Buchstaben
 */
(function (root) {
  "use strict";

  var SCHWARZ_NACH = { c: true, d: true, f: true, g: true, a: true };

  function weisseTaste(t) {
    var T = root.Texte;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "taste";
    var mitte = t.toene[0].stufe === 28; // c¹, das mittlere C
    if (mitte) b.classList.add("taste-mitte");
    b.innerHTML = '<span class="taste-marke" aria-hidden="true"></span>' +
      '<span class="taste-name" aria-hidden="true"></span>' +
      (mitte ? '<span class="taste-mitte-zeichen" aria-hidden="true">' + root.Noten.anzeigeName(28, 0) + "</span>" : "");
    b.setAttribute("aria-label", T.t("klavier.taste", { name: t.anzeige }) + (mitte ? T.t("klavier.mitte") : ""));
    return b;
  }

  function schwarzeTaste(t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "taste-schwarz-knopf";
    b.innerHTML = '<span class="taste-marke" aria-hidden="true"></span><span class="taste-name" aria-hidden="true"></span>';
    b.setAttribute("aria-label", root.Texte.t("klavier.schwarz", { name: t.anzeige }));
    return b;
  }

  /**
   * Legt alle Tasten in eine Reihe. Die weißen Tasten teilen sich die volle
   * Breite (CSS-Raster mit --tasten Spalten), die Höhe regelt das CSS. Jede
   * schwarze Taste liegt gleich breit über der Fuge zur nächsten weißen Taste.
   */
  function ordne(box, weisse) {
    box.innerHTML = "";
    var anzahl = weisse.length;
    if (anzahl === 0) return;
    var div = document.createElement("div");
    div.className = "klavier-reihe";
    box.style.setProperty("--tasten", String(anzahl));
    weisse.forEach(function (t, i) {
      div.appendChild(t.el);
      var schwarz = i < anzahl - 1 ? t.schwarz : null;
      if (!schwarz) return;
      schwarz.el.style.left = ((i + 1) * 100 / anzahl) + "%";
      div.appendChild(schwarz.el);
    });
    box.appendChild(div);
  }

  var MINDEST_WEISSE = 7;

  function baue(box, namen, beiTipp) {
    var N = root.Noten;
    var L = root.SpielLogik;
    var tasten = [], weisse = [];
    if (namen.length > 0) {
      // Vorzeichen-Noten brauchen die weiße Nachbartaste, damit ihre schwarze Taste Platz hat.
      var tief = Infinity, hoch = -Infinity, hoehen = {}, hoehenAnzeige = {};
      namen.forEach(function (n) {
        tief = Math.min(tief, n.vorzeichen < 0 ? n.stufe - 1 : n.stufe);
        hoch = Math.max(hoch, n.vorzeichen > 0 ? n.stufe + 1 : n.stufe);
        if (n.vorzeichen) { hoehen[n.halbton] = n.name; hoehenAnzeige[n.halbton] = n.anzeige; }
      });
      // Mindestens 7 weiße Tasten (eine ganze Oktave), auch bei kleiner Notenauswahl.
      // Fehlende Tasten kommen oben dazu: aus c¹ bis g¹ wird c¹ bis h¹.
      while (hoch - tief + 1 < MINDEST_WEISSE) hoch++;
      for (var s = tief; s <= hoch; s++) {
        var ton = N.ton(s, 0);
        var weiss = { art: "weiss", toene: [ton], halbton: ton.halbton, buchstabe: ton.buchstabe, name: ton.name, anzeige: ton.anzeige, schwarz: null };
        weiss.el = weisseTaste(weiss);
        tasten.push(weiss);
        weisse.push(weiss);
        if (SCHWARZ_NACH[ton.buchstabe] && s < hoch) {
          var kreuz = N.ton(s, 1);
          var schwarz = { art: "schwarz", toene: [kreuz, N.ton(s + 1, -1)], halbton: kreuz.halbton,
            name: hoehen[kreuz.halbton] || kreuz.name, anzeige: hoehenAnzeige[kreuz.halbton] || kreuz.anzeige };
          schwarz.el = schwarzeTaste(schwarz);
          tasten.push(schwarz);
          weiss.schwarz = schwarz;
        }
      }
    }

    function klinge(nr) {
      if (root.Klang.bereit()) root.Klang.spiele(tasten[nr].halbton);
    }

    tasten.forEach(function (t, i) {
      t.el.addEventListener("click", function () { klinge(i); beiTipp(i); });
    });
    ordne(box, weisse);

    function beschrifte(t, klasse, marke, name) {
      if (klasse) t.el.classList.add(klasse);
      if (marke) t.el.querySelector(".taste-marke").textContent = marke;
      t.el.querySelector(".taste-name").textContent = name;
    }

    return {
      tasten: tasten,
      mitSchwarz: tasten.some(function (t) { return t.art === "schwarz"; }),
      klinge: klinge,

      zuruecksetzen: function () {
        box.classList.remove("gesperrt");
        tasten.forEach(function (t) {
          t.el.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
          t.el.setAttribute("aria-disabled", "false");
          t.el.querySelector(".taste-marke").textContent = "";
          t.el.querySelector(".taste-name").textContent = "";
        });
      },

      /**
       * Antwort einer Taste: Von ihren Tönen zählt der, der zur Note passt
       * (SpielLogik.istRichtig mit Noten.antwortSchluessel), sonst der gewählte.
       */
      tastenTon: function (nr, note, antwortmodus) {
        var taste = tasten[nr];
        var passend = taste.toene.filter(function (t) { return L.istRichtig(note, N.antwortSchluessel(t, antwortmodus)); })[0];
        return passend || taste.toene.filter(function (t) { return t.name === taste.name; })[0] || taste.toene[0];
      },

      /** `a` = { richtig, note } nach der Antwort, `ton` = tastenTon der getippten Taste. */
      zeigeAntwort: function (nr, a, ton) {
        box.classList.add("gesperrt");
        tasten.forEach(function (t, i) {
          t.el.setAttribute("aria-disabled", "true");
          if (i === nr && a.richtig) {
            // Richtig, im einfachen Modus auch in einer anderen Oktave.
            beschrifte(t, "ist-richtig", "✓", ton.anzeige);
          } else if (t.halbton === a.note.halbton) {
            // Genau die gezeigte Note: bei falscher Antwort als Lösung, sonst nur beschriftet.
            beschrifte(t, a.richtig ? "" : "ist-loesung", a.richtig ? "" : "✓", a.note.anzeige);
          } else if (i === nr) {
            beschrifte(t, "ist-falsch", "✗", ton.anzeige);
          }
        });
      },

      weisseMit: function (buchstabe) {
        var treffer = [];
        tasten.forEach(function (t, i) { if (t.art === "weiss" && t.buchstabe === buchstabe) treffer.push(i); });
        return treffer;
      }
    };
  }

  root.Klaviatur = { baue: baue };
})(this);
