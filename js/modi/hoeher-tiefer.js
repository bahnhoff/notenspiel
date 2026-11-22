/*
 * Modus „Höher oder tiefer“: Zwei Noten stehen nebeneinander im selben
 * System. Das Kind tippt die höhere an, in manchen Aufgaben die tiefere.
 * Gleich hohe Noten kommen nicht vor, auch keine gleich klingenden (fis und
 * ges): Verglichen wird die Tonhöhe. Am Anfang liegen die Noten eine Terz
 * oder mehr auseinander, später nur noch eine Sekunde (oder f und fis).
 * 10 Aufgaben, Wertung wie im klassischen Spiel (js/spiel-logik.js): Die
 * gesuchte Note ist die Aufgabe, die andere Note wird passend dazu gewählt.
 * Tastatur: Pfeil links und rechts, oder Tab und Eingabe.
 * Nutzt die Ansicht #ansicht-hoeher aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1300; // Millisekunden
  var ANTEIL_TIEFER = 0.35;      // so oft lautet die Frage „Welche ist tiefer?“
  // Breites System mit zwei Notenplätzen; Trefferflächen links und rechts.
  var FORM = { breite: 196, links: 82, rechts: 154, start: 54, mitte: 118 };
  var SVG_NS = "http://www.w3.org/2000/svg";

  var umgebung = null;
  var runde = null;
  var weiterTimer = null;
  var aufgabe = null;   // { frage: "hoeher" | "tiefer", ziel, partner, zielLinks }
  var letzteSeite = "";

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return runde && umgebung && umgebung.laeuft();
  }

  /**
   * Nur Noten aus Schlüsseln mit mindestens zwei verschiedenen Noten, damit
   * es immer einen Partner im selben Schlüssel gibt (wichtig bei freier
   * Notenauswahl, zum Beispiel nur eine Bassnote neben mehreren Violinnoten).
   */
  function paarfaehig(noten) {
    var hoehen = {};
    noten.forEach(function (n) {
      hoehen[n.schluessel] = hoehen[n.schluessel] || {};
      hoehen[n.schluessel][n.halbton] = true;
    });
    var liste = noten.filter(function (n) { return Object.keys(hoehen[n.schluessel]).length >= 2; });
    return liste.length ? liste : noten;
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    runde = L.neueRunde(paarfaehig(u.noten), { vorrang: u.schwierig, aufgaben: u.aufgaben });
    letzteSeite = "";
    u.zeigeTier($("ht-tier"), "normal");
    u.zeigeAnsicht();
    zeigeAufgabe();
  }

  function stoppe() {
    clearTimeout(weiterTimer);
    runde = null;
    aufgabe = null;
  }

  /* ---------- Aufgabe bilden ---------- */

  function wort(frage) { return frage === "hoeher" ? "höher" : "tiefer"; }

  /**
   * Andere Note im selben Schlüssel: bei „höher“ tiefer als das Ziel, bei
   * „tiefer“ höher (nach Tonhöhe). Abstand in Stufen je nach Fortschritt (0 bis 1):
   * erst 2 und mehr (Terz und größer), dann 2 bis 3, am Ende 1 (Sekunde).
   * f und fis (gleiche Stufe) zählen wie eine Sekunde.
   */
  function partnerFuer(ziel, frage, fortschritt, streng) {
    var kandidaten = umgebung.noten.filter(function (n) {
      return n.schluessel === ziel.schluessel && (frage === "hoeher" ? n.halbton < ziel.halbton : n.halbton > ziel.halbton);
    });
    if (kandidaten.length === 0) return null;
    function abstand(n) { return Math.max(1, Math.abs(n.stufe - ziel.stufe)); }
    var wunsch;
    if (fortschritt < 0.4) wunsch = kandidaten.filter(function (n) { return abstand(n) >= 2; });
    else if (fortschritt < 0.7) wunsch = kandidaten.filter(function (n) { return abstand(n) === 2 || abstand(n) === 3; });
    else wunsch = kandidaten.filter(function (n) { return abstand(n) === 1; });
    var liste = wunsch.length || streng ? wunsch : kandidaten;
    return liste.length ? liste[Math.floor(Math.random() * liste.length)] : null;
  }

  function bildeAufgabe() {
    var ziel = runde.aktuell.note;
    var fortschritt = runde.aufgabe / runde.anzahl;
    var frage = runde.aufgabe > 0 && Math.random() < ANTEIL_TIEFER ? "tiefer" : "hoeher";
    var andere = frage === "hoeher" ? "tiefer" : "hoeher";
    // Erst den passenden Abstand suchen (notfalls mit umgekehrter Frage), dann jeden Abstand.
    var partner = partnerFuer(ziel, frage, fortschritt, true);
    if (!partner && runde.aufgabe > 0 && (partner = partnerFuer(ziel, andere, fortschritt, true))) frage = andere;
    if (!partner) partner = partnerFuer(ziel, frage, fortschritt, false);
    if (!partner && (partner = partnerFuer(ziel, andere, fortschritt, false))) frage = andere;
    // Nur bei einem Bereich mit einer einzigen Note möglich: dann bleibt die Aufgabe trivial.
    if (!partner) partner = ziel;
    aufgabe = { frage: frage, ziel: ziel, partner: partner, zielLinks: Math.random() < 0.5 };
  }

  function noteAuf(seite) {
    var links = seite === "links";
    return links === aufgabe.zielLinks ? aufgabe.ziel : aufgabe.partner;
  }

  /* ---------- Zeichnen ---------- */

  function svgElement(tag, attribute) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attribute).forEach(function (k) { el.setAttribute(k, attribute[k]); });
    return el;
  }

  /** Zeichnet beide Noten. `auswertung` = { getippt: Seite } nach der Antwort. */
  function zeichne(auswertung) {
    var box = $("ht-notensystem");
    var links = noteAuf("links"), rechts = noteAuf("rechts");
    box.innerHTML = window.Notensystem.zeichne(links, {
      bereich: umgebung.bereich,
      breite: FORM.breite,
      noteX: FORM.links,
      schluessel: aufgabe.ziel.schluessel,
      weitere: [{ position: rechts.position, x: FORM.rechts, vorzeichen: rechts.vorzeichen }]
    });
    var svg = box.querySelector("svg");
    var vb = svg.viewBox.baseVal;
    var zielSeite = aufgabe.zielLinks ? "links" : "rechts";
    svg.setAttribute("aria-label", window.Noten.SCHLUESSEL[aufgabe.ziel.schluessel].name + " mit zwei Noten" +
      (auswertung ? ": links " + links.name + ", rechts " + rechts.name : ""));

    // Die linke Note ist die Hauptnote, die rechte steht in .note-weitere.
    var gruppen = { links: svg.querySelector(".note-gruppe"), rechts: svg.querySelector(".note-weitere") };
    var bereiche = { links: [FORM.start, FORM.mitte], rechts: [FORM.mitte, FORM.breite] };

    ["links", "rechts"].forEach(function (seite) {
      var x0 = bereiche[seite][0], x1 = bereiche[seite][1];
      var status = "";
      if (auswertung) {
        if (seite === zielSeite) status = auswertung.getippt === seite ? "richtig" : "loesung";
        else if (auswertung.getippt === seite) status = "falsch";
      }
      // Farbiger Hintergrund hinter den Linien
      if (status) {
        svg.insertBefore(svgElement("rect", {
          "class": "ht-feld ht-feld-" + status, x: x0 + 2, y: vb.y + 2, width: x1 - x0 - 4, height: vb.height - 4, rx: 6
        }), svg.firstChild);
        gruppen[seite].classList.add("ht-note-" + (status === "falsch" ? "falsch" : "richtig"));
        // Name und Zeichen neben der Note, damit die Rückmeldung nicht nur über Farbe läuft
        var note = noteAuf(seite);
        var text = svgElement("text", {
          "class": "ht-name ht-name-" + status, x: (seite === "links" ? FORM.links : FORM.rechts) + 10,
          y: window.Notensystem.yVon(note.position) + 4.5, "font-size": "13", "font-weight": "800", fill: "currentColor"
        });
        text.textContent = note.name + (status === "falsch" ? " ✗" : " ✓");
        svg.appendChild(text);
      }
      // Trefferfläche über der ganzen Höhe, per Tastatur erreichbar
      var ziel = svgElement("g", {
        "class": "ht-ziel", tabindex: auswertung ? "-1" : "0", role: "button",
        "aria-label": (seite === "links" ? "Linke Note" : "Rechte Note") + (auswertung ? ", " + noteAuf(seite).name : ""),
        "data-seite": seite
      });
      if (auswertung) ziel.setAttribute("aria-disabled", "true");
      ziel.appendChild(svgElement("rect", { x: x0 + 1, y: vb.y + 1, width: x1 - x0 - 2, height: vb.height - 2, rx: 6 }));
      ziel.addEventListener("click", function () { beantworte(seite); });
      ziel.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); beantworte(seite); }
      });
      svg.appendChild(ziel);
    });
  }

  /* ---------- Ablauf ---------- */

  function zeigeStatus() {
    $("ht-aufgabe").textContent = "Aufgabe " + (runde.aufgabe + 1) + " von " + runde.anzahl;
    H.zeigeSterne($("ht-sterne"), $("ht-punkte"), runde.sterne, L.REGELN.startSterne, runde.punkte);
  }

  function zeigeAufgabe() {
    bildeAufgabe();
    zeigeStatus();
    var w = $("ht-wort");
    w.textContent = (aufgabe.frage === "hoeher" ? "⬆ " : "⬇ ") + wort(aufgabe.frage);
    w.className = "ht-wort ht-wort-" + aufgabe.frage;
    $("ht-notensystem").classList.remove("ist-richtig", "ist-falsch");
    zeichne(null);
    $("ht-weiter").hidden = true;
    $("ht-text").textContent = "Tippe auf die Note, die " + wort(aufgabe.frage) + " ist.";
    var fokus = document.activeElement;
    if (letzteSeite && (fokus === document.body || fokus === $("ht-weiter") ||
        (fokus && fokus.classList && fokus.classList.contains("ht-ziel")) || !document.contains(fokus))) {
      var z = $("ht-notensystem").querySelector('.ht-ziel[data-seite="' + letzteSeite + '"]');
      if (z && z.focus) z.focus({ preventScroll: true });
    }
  }

  function beantworte(seite) {
    if (!aktiv() || !aufgabe) return;
    var getippt = noteAuf(seite);
    var a = L.antworte(runde, getippt.name);
    if (!a) return; // schon beantwortet: weitere Tipps zählen nicht
    var hatFokus = document.activeElement && document.activeElement.classList &&
      document.activeElement.classList.contains("ht-ziel");
    letzteSeite = hatFokus ? seite : "";
    var ziel = aufgabe.ziel, partner = aufgabe.partner;
    var gegen = aufgabe.frage === "hoeher" ? "tiefer" : "höher";

    zeigeStatus();
    zeichne({ getippt: seite });
    $("ht-notensystem").classList.add(a.richtig ? "ist-richtig" : "ist-falsch");
    var text;
    if (a.richtig) {
      text = "✓ Richtig! " + ziel.name + " ist " + wort(aufgabe.frage) + " als " + partner.name + ".";
      if (a.serie > 0 && a.serie % 3 === 0) text += " " + a.nachricht;
    } else {
      text = "✗ Die " + (aufgabe.zielLinks ? "linke" : "rechte") + " Note " + ziel.name + " ist " + wort(aufgabe.frage) +
        ", " + partner.name + " ist " + gegen + "." + (ziel.position === partner.position
          ? " Ein Kreuz macht eine Note einen Halbton höher, ein B einen Halbton tiefer."
          : " Höhere Noten stehen weiter oben.");
    }
    $("ht-text").textContent = text;
    umgebung.zeigeTier($("ht-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      weiterTimer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      var weiter = $("ht-weiter");
      weiter.hidden = false;
      weiter.focus({ preventScroll: true });
      if (weiter.scrollIntoView) weiter.scrollIntoView({ block: "nearest" });
    }
  }

  function naechsteAufgabe() {
    clearTimeout(weiterTimer);
    if (!aktiv()) return;
    var w = L.weiter(runde);
    if (!w) return; // doppelter Aufruf
    if (w.beendet) {
      var r = runde;
      runde = null;
      aufgabe = null;
      H.klassischesEnde(umgebung, r);
      return;
    }
    umgebung.zeigeTier($("ht-tier"), "normal");
    zeigeAufgabe();
  }

  $("ht-weiter").addEventListener("click", naechsteAufgabe);

  /* Tastatur: Pfeil links oder rechts wählt die Note. */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-hoeher").hidden || runde.gesperrt || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      ev.preventDefault();
      beantworte(ev.key === "ArrowLeft" ? "links" : "rechts");
    }
  });

  window.Modi.registriere({
    id: "hoeher-tiefer",
    name: "Höher oder tiefer",
    symbol: "↕️",
    ansicht: "hoeher",
    reise: true,
    starte: starte,
    stoppe: stoppe
  });
})();
