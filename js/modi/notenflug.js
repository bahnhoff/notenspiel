/*
 * Modus „Notenflug“: Eine Note gleitet von rechts nach links über das
 * Notensystem. Das Kind tippt den Namen, bevor die Note den Schlüssel
 * erreicht. Zu spät oder falsch kostet einen von drei Sternen.
 * Level mit je 10 Noten, jedes Level etwa 15 % schneller.
 * Regeln und Wertung: js/spiel-logik.js (NOTENFLUG, flugAntwort).
 * Nutzt die Ansicht #ansicht-notenflug aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var t = window.Texte.t;
  var H = window.Modi.hilfen;
  var START_DX = 34;          // Startversatz der Note nach rechts (SVG-Einheiten)
  var ZIEL_DX = -46;          // hier erreicht die Note den Schlüssel
  var PAUSE_VOR_START = 1400; // Millisekunden
  var PAUSE_NACH_RICHTIG = 900;
  var PAUSE_NACH_LEVEL = 2200;
  var PAUSE_NACH_FEHLER = 4500;

  var umgebung = null;
  var flug = null;
  var zustand = null;   // aktuelle Note: { note, vergangen, dauer, offen, dx }
  var knoepfe = [];
  var timer = null;
  var raf = null;
  var letzteZeit = null;
  var pausiert = false;
  var wartetAufWeiter = null; // Funktion, die nach „Weiter“ läuft

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return flug && umgebung && umgebung.laeuft();
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    flug = L.neuerFlug();
    knoepfe = H.antwortKnoepfe($("flug-antworten"), u.antworten, beantworte);
    u.zeigeTier($("flug-tier"), "normal");
    u.zeigeAnsicht();
    $("flug-merkhilfe").hidden = true;
    $("flug-weiter").hidden = true;
    zeigeStatus();
    zeichneSystem(null);
    sperreKnoepfe(true);
    $("flug-text").textContent = t("flug.start");
    timer = setTimeout(naechsteNote, PAUSE_VOR_START);
  }

  function stoppe() {
    clearTimeout(timer);
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    timer = null;
    flug = null;
    zustand = null;
    pausiert = false;
    wartetAufWeiter = null;
  }

  function zeigeStatus() {
    var leben = L.NOTENFLUG.leben;
    H.zeigeSterne($("flug-sterne"), $("flug-punkte"), leben - flug.fehler, leben, flug.punkte);
    // Während eine Note fliegt oder ausgewertet wird, zählt ihre eigene Nummer.
    var level = zustand ? zustand.level : flug.level;
    var nr = zustand ? zustand.nr : flug.imLevel + 1;
    $("flug-level").textContent = t("flug.level", { level: level, nr: nr, anzahl: L.NOTENFLUG.notenProLevel });
  }

  function zeichneSystem(note, beschriftung) {
    var box = $("flug-notensystem");
    box.innerHTML = window.Notensystem.zeichne(note, { bereich: umgebung.bereich, beschriftung: beschriftung });
    box.classList.remove("ist-richtig", "ist-falsch");
  }

  function setzeVersatz(dx) {
    var g = $("flug-notensystem").querySelector(".note-gruppe");
    if (g) g.setAttribute("transform", "translate(" + dx.toFixed(2) + " 0)");
  }

  function sperreKnoepfe(gesperrt) {
    $("flug-antworten").classList.toggle("gesperrt", gesperrt);
    knoepfe.forEach(function (b) { b.setAttribute("aria-disabled", gesperrt ? "true" : "false"); });
  }

  function waehleNote() {
    var vorher = zustand && zustand.note;
    var kandidaten = umgebung.noten.filter(function (n) { return !vorher || n.id !== vorher.id; });
    if (kandidaten.length === 0) kandidaten = umgebung.noten;
    return kandidaten[Math.floor(Math.random() * kandidaten.length)];
  }

  function naechsteNote() {
    clearTimeout(timer);
    wartetAufWeiter = null;
    if (!aktiv()) return;
    var note = waehleNote();
    zustand = { note: note, vergangen: 0, dauer: L.flugzeit(flug.level), offen: true, dx: START_DX,
      level: flug.level, nr: flug.imLevel + 1 };
    zeigeStatus();
    zeichneSystem(note);
    setzeVersatz(START_DX);
    $("flug-weiter").hidden = true;
    $("flug-merkhilfe").hidden = true;
    knoepfe.forEach(function (b) {
      b.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      H.markiereAntwort(b);
    });
    sperreKnoepfe(false);
    umgebung.zeigeTier($("flug-tier"), "normal");
    $("flug-text").textContent = t("flug.schnell");
    letzteZeit = null;
    if (!document.hidden) raf = requestAnimationFrame(schritt);
    else pausiert = true;
  }

  function schritt(zeit) {
    raf = null;
    if (!aktiv() || !zustand || !zustand.offen) return;
    // Große Sprünge (zum Beispiel nach einer Pause des Browsers) zählen nicht.
    var dt = letzteZeit === null ? 0 : Math.min(zeit - letzteZeit, 100);
    letzteZeit = zeit;
    zustand.vergangen += dt;
    var t = Math.min(1, zustand.vergangen / zustand.dauer);
    zustand.dx = START_DX + (ZIEL_DX - START_DX) * t;
    setzeVersatz(zustand.dx);
    if (t >= 1) {
      werte(null);
      return;
    }
    raf = requestAnimationFrame(schritt);
  }

  /* Pause bei verstecktem Tab, danach geht der Flug an derselben Stelle weiter. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      pausiert = true;
    } else if (pausiert) {
      pausiert = false;
      if (aktiv() && zustand && zustand.offen) {
        letzteZeit = null;
        raf = requestAnimationFrame(schritt);
      }
    }
  });

  function beantworte(name) {
    if (!aktiv() || !zustand || !zustand.offen) return; // eine Antwort pro Note
    werte(name);
  }

  /** Wertet die aktuelle Note aus. `name` = getippter Name oder null bei „zu spät“. */
  function werte(name) {
    zustand.offen = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    var note = zustand.note;
    var richtig = name !== null && L.istRichtig(note, name);
    var e = L.flugAntwort(flug, richtig);
    if (!e) return;
    sperreKnoepfe(true);

    knoepfe.forEach(function (b) {
      if (b.dataset.name === note.antwort) H.markiereAntwort(b, richtig ? "ist-richtig" : "ist-loesung", true);
      else if (b.dataset.name === name) H.markiereAntwort(b, "ist-falsch", false);
    });

    // Lösung an der Stelle zeigen, an der die Note gerade ist (Name passt rechts daneben).
    zeichneSystem(note, note.anzeige);
    setzeVersatz(Math.min(0, zustand.dx));
    $("flug-notensystem").classList.add(richtig ? "ist-richtig" : "ist-falsch");
    zeigeStatus();
    H.zeigeMerkhilfe(umgebung, note, "flug-merkhilfe");

    var text;
    var werte = { name: note.anzeige, hinweis: note.hinweis };
    if (richtig) text = t("flug.super", werte);
    else if (name === null) text = t("flug.zuSpaet", werte);
    else text = t("flug.falsch", werte);
    if (e.levelGeschafft) text += t("flug.levelGeschafft", { level: zustand.level });
    if (e.beendet) text += t("flug.dritterFehler");
    $("flug-text").textContent = text;
    umgebung.zeigeTier($("flug-tier"), richtig ? "froh" : "oje");

    var danach = e.beendet ? beende : naechsteNote;
    if (richtig) {
      timer = setTimeout(danach, e.levelGeschafft ? PAUSE_NACH_LEVEL : PAUSE_NACH_RICHTIG);
    } else {
      wartetAufWeiter = danach;
      var weiter = $("flug-weiter");
      weiter.textContent = e.beendet ? t("flug.zumErgebnis") : t("runde.weiter");
      weiter.hidden = false;
      weiter.focus({ preventScroll: true });
      if (weiter.scrollIntoView) weiter.scrollIntoView({ block: "nearest" });
      if (!e.beendet) timer = setTimeout(weiterNachFehler, PAUSE_NACH_FEHLER);
    }
  }

  function weiterNachFehler() {
    var f = wartetAufWeiter;
    wartetAufWeiter = null;
    clearTimeout(timer);
    if (f && aktiv()) f();
  }

  function beende() {
    clearTimeout(timer);
    if (!aktiv()) return;
    var f = flug;
    var sterne = L.flugSterne(f);
    flug = null;
    zustand = null;
    umgebung.beende({
      gesamt: f.punkte,
      neueSterne: sterne,
      titel: t("flug.vorbei"),
      spruch: f.levelGeschafft >= 3 ? t("flug.wow") : (f.levelGeschafft > 0 ? t("flug.toll") : t("ende.nochmal")),
      stimmung: f.levelGeschafft > 0 ? "froh" : "normal",
      zeilen: [
        [t("flug.erreicht"), String(f.level)],
        [t("flug.geschaffte"), String(f.levelGeschafft)],
        [t("flug.richtige"), String(f.richtige)]
      ]
    });
  }

  $("flug-weiter").addEventListener("click", weiterNachFehler);

  /* Tastatur: Buchstabe tippen, wenn er unter den Antworten (ohne Vorzeichen-Noten) eindeutig ist. */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-notenflug").hidden || !zustand || !zustand.offen || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var taste = window.Noten.tasteZuBuchstabe(ev.key);
    if (!taste) return;
    var treffer = umgebung.antworten.filter(function (a) { return a.buchstabe === taste && !a.vorzeichen; });
    if (treffer.length === 1) {
      ev.preventDefault();
      beantworte(treffer[0].name);
    }
  });

  window.Modi.registriere({
    id: "notenflug",
    get name() { return t("modus.notenflug"); },
    symbol: "🚀",
    ansicht: "notenflug",
    starte: starte,
    stoppe: stoppe
  });
})();
