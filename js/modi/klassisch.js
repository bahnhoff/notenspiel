/*
 * Modus „Welche Note ist das?“ (klassisch): Note im Notensystem, Kind tippt
 * den Namen. 10 Aufgaben, 3 Sterne, Regeln in js/spiel-logik.js.
 * Nutzt die Ansicht #ansicht-runde aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1200; // Millisekunden

  var umgebung = null;
  var runde = null;
  var weiterTimer = null;
  var knoepfe = [];
  var letzterAntwortKnopf = -1;

  function $(id) { return document.getElementById(id); }

  function starte(u) {
    stoppe();
    umgebung = u;
    runde = L.neueRunde(u.noten, { vorrang: u.schwierig, aufgaben: u.aufgaben });
    letzterAntwortKnopf = -1;
    knoepfe = H.antwortKnoepfe($("antworten"), u.antworten, beantworte);
    u.zeigeTier($("runde-tier"), "normal");
    u.zeigeAnsicht();
    zeigeAufgabe();
    $("sprechblase-text").textContent = "Schau genau hin. Welche Note ist das?";
  }

  function stoppe() {
    clearTimeout(weiterTimer);
    runde = null;
  }

  function aktiv() {
    return runde && umgebung && umgebung.laeuft();
  }

  function zeigeStatus() {
    $("aufgabe-nr").textContent = "Aufgabe " + (runde.aufgabe + 1) + " von " + runde.anzahl;
    H.zeigeSterne($("sterne-anzeige"), $("punkte-anzeige"), runde.sterne, L.REGELN.startSterne, runde.punkte);
  }

  function zeigeAufgabe() {
    zeigeStatus();
    $("notensystem").innerHTML = window.Notensystem.zeichne(runde.aktuell.note, { bereich: umgebung.bereich });
    $("notensystem").classList.remove("ist-falsch", "ist-richtig");
    $("knopf-weiter").hidden = true;
    $("merkhilfe").hidden = true;
    knoepfe.forEach(function (b) {
      b.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      b.setAttribute("aria-disabled", "false");
      b.setAttribute("aria-label", b.dataset.name);
      b.querySelector(".antwort-marke").textContent = "";
    });
    $("antworten").classList.remove("gesperrt");
    // Tastaturfokus auf derselben Schaltfläche lassen wie bei der letzten Antwort.
    var fokus = document.activeElement;
    if (letzterAntwortKnopf >= 0 && knoepfe[letzterAntwortKnopf] &&
        (fokus === document.body || fokus === $("knopf-weiter") || (fokus && fokus.classList.contains("knopf-antwort")))) {
      knoepfe[letzterAntwortKnopf].focus({ preventScroll: true });
    }
  }

  function beantworte(name) {
    if (!aktiv()) return;
    var a = L.antworte(runde, name);
    if (!a) return; // schon beantwortet: weitere Tipps zählen nicht
    letzterAntwortKnopf = -1;
    $("antworten").classList.add("gesperrt");

    knoepfe.forEach(function (b, i) {
      b.setAttribute("aria-disabled", "true");
      if (b.dataset.name === name) letzterAntwortKnopf = i;
      if (b.dataset.name === a.note.name) {
        b.classList.add(a.richtig ? "ist-richtig" : "ist-loesung");
        b.querySelector(".antwort-marke").textContent = "✓";
        b.setAttribute("aria-label", b.dataset.name + ", richtig");
      } else if (b.dataset.name === name) {
        b.classList.add("ist-falsch");
        b.querySelector(".antwort-marke").textContent = "✗";
        b.setAttribute("aria-label", b.dataset.name + ", falsch");
      }
    });

    zeigeStatus();
    $("notensystem").innerHTML = window.Notensystem.zeichne(a.note, { beschriftung: a.note.name, bereich: umgebung.bereich });
    $("notensystem").classList.add(a.richtig ? "ist-richtig" : "ist-falsch");

    H.zeigeMerkhilfe(umgebung, a.note, "merkhilfe");
    $("sprechblase-text").textContent = (a.richtig ? "✓ " : "✗ ") + a.nachricht;
    umgebung.zeigeTier($("runde-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      weiterTimer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      var weiterKnopf = $("knopf-weiter");
      weiterKnopf.hidden = false;
      weiterKnopf.focus({ preventScroll: true });
      // Auf kleinen Bildschirmen den Hinweis und die Schaltfläche sichtbar machen.
      if (weiterKnopf.scrollIntoView) weiterKnopf.scrollIntoView({ block: "nearest" });
    }
  }

  function naechsteAufgabe() {
    clearTimeout(weiterTimer);
    if (!aktiv()) return;
    var w = L.weiter(runde);
    if (!w) return; // doppelter Aufruf
    if (w.beendet) {
      beende();
      return;
    }
    $("sprechblase-text").textContent = "Und diese hier?";
    umgebung.zeigeTier($("runde-tier"), "normal");
    zeigeAufgabe();
  }

  function beende() {
    var r = runde;
    runde = null;
    H.klassischesEnde(umgebung, r);
  }

  /* Tastatur: Buchstabe tippen, wenn er unter den Antworten eindeutig ist. */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-runde").hidden || runde.gesperrt || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var taste = (ev.key || "").toLowerCase();
    if (!/^[a-h]$/.test(taste)) return;
    var treffer = umgebung.antworten.filter(function (a) { return a.buchstabe === taste; });
    if (treffer.length === 1) {
      ev.preventDefault();
      beantworte(treffer[0].name);
    }
  });

  $("knopf-weiter").addEventListener("click", naechsteAufgabe);

  window.Modi.registriere({
    id: "klassisch",
    name: "Welche Note ist das?",
    symbol: "🎵",
    hauptspiel: true,
    ansicht: "runde",
    reise: true,
    starte: starte,
    stoppe: stoppe
  });
})();
