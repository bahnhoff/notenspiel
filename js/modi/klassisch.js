/*
 * Modus „Welche Note ist das?“ (klassisch): Note im Notensystem, Kind tippt
 * den Namen. 10 Aufgaben, 3 Sterne, Regeln in js/spiel-logik.js. Die Runde
 * geht auch nach drei Fehlern bis zur letzten Aufgabe weiter.
 * Buchstabentasten antworten über Modi.hilfen.tastenEingabe.
 * Nutzt die Ansicht #ansicht-runde aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var t = window.Texte.t;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1200; // Millisekunden

  var umgebung = null;
  var runde = null;
  var weiterTimer = null;
  var knoepfe = [];
  var letzterAntwortKnopf = -1;
  var tasten = null;   // Buchstabentasten (Modi.hilfen.tastenEingabe)

  function $(id) { return document.getElementById(id); }

  function starte(u) {
    stoppe();
    umgebung = u;
    runde = L.neueRunde(u.noten, { vorrang: u.schwierig, aufgaben: u.aufgaben });
    letzterAntwortKnopf = -1;
    knoepfe = H.antwortKnoepfe($("antworten"), u.antworten, beantworte);
    tasten = H.tastenEingabe({
      antworten: function () { return umgebung.antworten; },
      offen: function () { return aktiv() && !runde.gesperrt && !$("ansicht-runde").hidden; },
      beiAntwort: beantworte,
      anzeige: $("runde-tasten")
    });
    u.zeigeTier($("runde-tier"), "normal");
    u.zeigeAnsicht();
    zeigeAufgabe();
    $("sprechblase-text").textContent = t("klassisch.start");
  }

  function stoppe() {
    clearTimeout(weiterTimer);
    runde = null;
    if (tasten) tasten.zuruecksetzen();
  }

  function aktiv() {
    return runde && umgebung && umgebung.laeuft();
  }

  function zeigeStatus() {
    $("aufgabe-nr").textContent = H.aufgabeText(runde);
    H.zeigeSterne($("sterne-anzeige"), $("punkte-anzeige"), runde.sterne, L.REGELN.startSterne, runde.punkte);
  }

  function zeigeAufgabe() {
    zeigeStatus();
    tasten.zuruecksetzen();
    $("notensystem").innerHTML = window.Notensystem.zeichne(runde.aktuell.note, { bereich: umgebung.bereich, namensPlatz: H.namensPlatz(umgebung) });
    $("notensystem").classList.remove("ist-falsch", "ist-richtig");
    $("knopf-weiter").hidden = true;
    $("merkhilfe").hidden = true;
    knoepfe.forEach(function (b) {
      b.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      b.setAttribute("aria-disabled", "false");
      H.markiereAntwort(b);
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
    tasten.zuruecksetzen();
    $("antworten").classList.add("gesperrt");

    knoepfe.forEach(function (b, i) {
      b.setAttribute("aria-disabled", "true");
      if (b.dataset.name === name) letzterAntwortKnopf = i;
      if (b.dataset.name === a.note.antwort) H.markiereAntwort(b, a.richtig ? "ist-richtig" : "ist-loesung", true);
      else if (b.dataset.name === name) H.markiereAntwort(b, "ist-falsch", false);
    });

    zeigeStatus();
    $("notensystem").innerHTML = window.Notensystem.zeichne(a.note, { beschriftung: a.note.anzeige, bereich: umgebung.bereich,
      markiere: true, namensPlatz: H.namensPlatz(umgebung) });
    $("notensystem").classList.add(a.richtig ? "ist-richtig" : "ist-falsch");

    H.zeigeMerkhilfe(umgebung, a.note, "merkhilfe");
    $("sprechblase-text").textContent = (a.richtig ? "✓ " : "✗ ") + a.nachricht;
    umgebung.zeigeTier($("runde-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      weiterTimer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      // Auf kleinen Bildschirmen den Hinweis und die Schaltfläche sichtbar machen.
      H.zeigeWeiter($("knopf-weiter"));
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
    $("sprechblase-text").textContent = t("runde.undDiese");
    umgebung.zeigeTier($("runde-tier"), "normal");
    zeigeAufgabe();
  }

  function beende() {
    var r = runde;
    runde = null;
    H.klassischesEnde(umgebung, r);
  }

  /* Tastatur: dieselbe Tastenlogik wie im Notenflug (Modi.hilfen.tastenEingabe). */
  document.addEventListener("keydown", function (ev) {
    if (tasten && aktiv() && !$("ansicht-runde").hidden) tasten.taste(ev);
  });

  $("knopf-weiter").addEventListener("click", naechsteAufgabe);

  window.Modi.registriere({
    id: "klassisch",
    get name() { return t("modus.klassisch"); },
    symbol: "🎵",
    hauptspiel: true,
    ansicht: "runde",
    reise: true,
    fehlerUeben: true,
    starte: starte,
    stoppe: stoppe
  });
})();
