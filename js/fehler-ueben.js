/*
 * „Fehler üben“ nach einer Runde mit Fehlern (kein eigener Spielmodus, siehe
 * js/modi.js). Für jede verwechselte Note (höchstens 3, häufigste Fehler
 * zuerst) zwei kurze Aufgaben: erst die Note im Notensystem erkennen
 * (Antwortknöpfe wie im klassischen Spiel), dann dieselbe Note auf der
 * Klaviatur finden (js/klaviatur.js, Tasten klingen). Antwortmodus Einfach
 * oder Genau wie eingestellt.
 *
 * Kein Druck: keine Punkte, keine Sterne, kein Rekord, kein vorzeitiges Ende.
 * Nach einer falschen Antwort zeigt das Spiel die Lösung mit Hinweis, und die
 * Aufgabe kommt am Ende noch einmal. Ablauf in js/spiel-logik.js
 * (neueUebung, uebungsAntwort, uebungWeiter).
 *
 * Die App ruft FehlerUeben.starte(umgebung) auf. `umgebung` enthält:
 *   noten, antworten, namen, antwortmodus, bereich   wie bei den Modi (js/modi.js);
 *                  `noten` sind hier die Noten der Übung (SpielLogik.uebungsNoten)
 *   zeigeAnsicht(), zeigeTier(el, stimmung), merkhilfe(note)   wie bei den Modi
 *   ende({ geuebt, aufgaben, spruch })   zeigt das Ergebnisfenster der App mit
 *                  zwei Werte-Kärtchen und ohne Sterne („Nochmal spielen“
 *                  startet den Modus der Runde neu)
 * Nutzt die Ansicht #ansicht-ueben aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var N = window.Noten;
  var T = window.Texte;
  var t = T.t;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1200; // Millisekunden

  var umgebung = null;
  var uebung = null;
  var timer = null;
  var knoepfe = [];
  var klaviatur = null;

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return uebung && !uebung.beendet && umgebung;
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    uebung = L.neueUebung(u.noten);
    knoepfe = H.antwortKnoepfe($("ueben-antworten"), u.antworten, beantworteName);
    klaviatur = window.Klaviatur.baue($("ueben-klaviatur"), u.namen, beantworteTaste);
    u.zeigeTier($("ueben-tier"), "normal");
    u.zeigeAnsicht();
    zeigeAufgabe();
  }

  function stoppe() {
    clearTimeout(timer);
    uebung = null;
    window.Klang.pausiere();
  }

  function aufgabe() { return L.uebungsAufgabe(uebung); }

  function zeichne(note, nachAntwort) {
    $("ueben-notensystem").innerHTML = window.Notensystem.zeichne(note, {
      bereich: umgebung.bereich,
      namensPlatz: H.namensPlatz(umgebung),
      beschriftung: nachAntwort ? note.anzeige : undefined,
      markiere: nachAntwort
    });
  }

  function zeigeAufgabe() {
    var a = aufgabe();
    var klavier = a.art === "klavier";
    $("ueben-aufgabe").textContent = t("ueben.aufgabe", { nr: uebung.nr + 1, anzahl: uebung.aufgaben.length });
    $("titel-ueben").textContent = t(klavier ? "ueben.klavier" : "ueben.erkennen");
    $("ansicht-ueben").classList.toggle("ist-klavier", klavier);
    zeichne(a.note, false);
    $("ueben-notensystem").classList.remove("ist-richtig", "ist-falsch");
    $("ueben-antworten").hidden = klavier;
    $("ueben-klaviatur").hidden = !klavier;
    $("ueben-weiter").hidden = true;
    $("ueben-merkhilfe").hidden = true;
    $("ueben-antworten").classList.remove("gesperrt");
    knoepfe.forEach(function (b) {
      b.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      b.setAttribute("aria-disabled", "false");
      H.markiereAntwort(b);
    });
    klaviatur.zuruecksetzen();
    // Gleich nach dem Erkennen derselben Note darf der Name genannt werden.
    var vorher = uebung.nr > 0 ? uebung.aufgaben[uebung.nr - 1] : null;
    var direktDanach = vorher && vorher.note.id === a.note.id && vorher.art === "erkennen";
    $("ueben-text").textContent = klavier
      ? (direktDanach ? t("ueben.startKlavier", { name: a.note.anzeige }) : t("ueben.startKlavierOhne"))
      : t("ueben.startErkennen");
    umgebung.zeigeTier($("ueben-tier"), "normal");
    if (document.activeElement === $("ueben-weiter")) $("titel-ueben").focus({ preventScroll: true });
  }

  function beantworteName(name) {
    if (!aktiv() || uebung.gesperrt || aufgabe().art !== "erkennen") return;
    var note = aufgabe().note;
    var richtig = L.istRichtig(note, name);
    var wiederholung = aufgabe().wiederholung;
    if (L.uebungsAntwort(uebung, richtig) === null) return;
    $("ueben-antworten").classList.add("gesperrt");
    knoepfe.forEach(function (b) {
      b.setAttribute("aria-disabled", "true");
      if (b.dataset.name === note.antwort) H.markiereAntwort(b, richtig ? "ist-richtig" : "ist-loesung", true);
      else if (b.dataset.name === name) H.markiereAntwort(b, "ist-falsch", false);
    });
    zeigeRueckmeldung(note, richtig, wiederholung);
  }

  function beantworteTaste(nr) {
    if (!aktiv() || uebung.gesperrt || aufgabe().art !== "klavier") return;
    var note = aufgabe().note;
    var ton = klaviatur.tastenTon(nr, note, umgebung.antwortmodus);
    var richtig = L.istRichtig(note, N.antwortSchluessel(ton, umgebung.antwortmodus));
    var wiederholung = aufgabe().wiederholung;
    if (L.uebungsAntwort(uebung, richtig) === null) return;
    klaviatur.zeigeAntwort(nr, { richtig: richtig, note: note }, ton);
    zeigeRueckmeldung(note, richtig, wiederholung);
  }

  function zeigeRueckmeldung(note, richtig, wiederholung) {
    zeichne(note, true);
    $("ueben-notensystem").classList.add(richtig ? "ist-richtig" : "ist-falsch");
    H.zeigeMerkhilfe(umgebung, note, "ueben-merkhilfe");
    var lob = T.liste("rueckmeldung.lob", { name: note.anzeige });
    $("ueben-text").textContent = richtig
      ? "✓ " + lob[Math.floor(Math.random() * lob.length)]
      : "✗ " + t("rueckmeldung.falsch", { name: note.anzeige, hinweis: note.hinweis }) + (wiederholung ? "" : t("ueben.falschDazu"));
    umgebung.zeigeTier($("ueben-tier"), richtig ? "froh" : "oje");
    if (richtig) timer = setTimeout(naechste, PAUSE_NACH_RICHTIG);
    else H.zeigeWeiter($("ueben-weiter"));
  }

  function naechste() {
    clearTimeout(timer);
    if (!aktiv()) return;
    var w = L.uebungWeiter(uebung);
    if (!w) return; // doppelter Aufruf
    if (w.beendet) zeigeEnde();
    else zeigeAufgabe();
  }

  /** „f¹“, „f¹ und a¹“, „f¹, a¹ und g¹“ (englisch „F4, A4, and G4“). */
  function namensListe(namen) {
    if (namen.length <= 1) return namen.join("");
    if (namen.length === 2) return namen[0] + t("ueben.und") + namen[1];
    return namen.slice(0, -1).join(", ") + t("ueben.undLetzte") + namen[namen.length - 1];
  }

  /** Ende: Ergebnisfenster über der Übung mit „Geübte Noten“ und „Aufgaben“. */
  function zeigeEnde() {
    clearTimeout(timer);
    umgebung.ende({
      geuebt: umgebung.noten.length,
      aufgaben: uebung.aufgaben.length,
      spruch: t("ueben.ende", { namen: namensListe(umgebung.noten.map(function (n) { return n.anzeige; })) })
    });
  }

  $("ueben-weiter").addEventListener("click", naechste);

  /* Tastatur wie in den Modi: Buchstabe für einen eindeutigen Antwortknopf oder eine weiße Taste. */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-ueben").hidden || uebung.gesperrt || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var taste = N.tasteZuBuchstabe(ev.key);
    if (!taste) return;
    if (aufgabe().art === "erkennen") {
      var treffer = umgebung.antworten.filter(function (a) { return a.buchstabe === taste && !a.vorzeichen; });
      if (treffer.length === 1) { ev.preventDefault(); beantworteName(treffer[0].name); }
    } else {
      var tasten = klaviatur.weisseMit(taste);
      if (tasten.length === 1 || (tasten.length > 1 && umgebung.antwortmodus === "einfach")) {
        ev.preventDefault();
        klaviatur.klinge(tasten[0]);
        beantworteTaste(tasten[0]);
      }
    }
  });

  window.FehlerUeben = { starte: starte, stoppe: stoppe };
})();
