/*
 * Modus „Klaviertasten“: Note im Notensystem, darunter eine Klaviatur über
 * den gewählten Bereich. Das Kind tippt die passende weiße Taste.
 * Die schwarzen Tasten sind nur Dekoration. Das mittlere C ist markiert.
 * 10 Aufgaben, Wertung wie im klassischen Spiel (js/spiel-logik.js).
 * Nutzt die Ansicht #ansicht-klavier aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1200; // Millisekunden
  var MIN_TASTE = 48;            // kleinste Breite einer weißen Taste in Pixeln
  var MAX_TASTE = 80;            // größte Breite, damit wenige Tasten nicht riesig werden
  var SCHWARZ_NACH = { c: true, d: true, f: true, g: true, a: true };

  var umgebung = null;
  var runde = null;
  var weiterTimer = null;
  var tasten = [];
  var tastenProReihe = 0;
  var letzteTaste = -1;

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return runde && umgebung && umgebung.laeuft();
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    runde = L.neueRunde(u.noten, { vorrang: u.schwierig, aufgaben: u.aufgaben });
    letzteTaste = -1;
    baueTasten(u.antworten);
    u.zeigeTier($("klavier-tier"), "normal");
    u.zeigeAnsicht();
    ordneTasten(true);
    zeigeAufgabe();
    $("klavier-text").textContent = "Welche weiße Taste passt zu dieser Note?";
  }

  function stoppe() {
    clearTimeout(weiterTimer);
    runde = null;
  }

  /* ---------- Klaviatur ---------- */

  function baueTasten(antworten) {
    tasten = antworten.map(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "taste";
      b.dataset.name = a.name;
      b.dataset.buchstabe = a.buchstabe;
      var mitte = a.name === "c1";
      if (mitte) b.classList.add("taste-mitte");
      b.innerHTML = '<span class="taste-schwarz" aria-hidden="true"></span>' +
        '<span class="taste-marke" aria-hidden="true"></span>' +
        '<span class="taste-name" aria-hidden="true"></span>' +
        (mitte ? '<span class="taste-mitte-zeichen" aria-hidden="true">c1</span>' : "");
      b.setAttribute("aria-label", "Taste " + a.name + (mitte ? ", mittleres C" : ""));
      b.addEventListener("click", function () { beantworte(a.name); });
      return b;
    });
  }

  /**
   * Verteilt die Tasten auf Reihen, damit jede weiße Taste mindestens
   * 48 px breit ist und nichts seitlich scrollt. Passt alles in eine Reihe,
   * bleibt es bei einer. Sonst kommen ganze Oktaven (ab c) in eine Reihe,
   * solange sie hineinpassen; tiefe Reihen stehen unten, hohe oben.
   */
  function ordneTasten(erzwingen) {
    var box = $("klaviatur");
    var breite = box.parentNode.clientWidth || 320;
    var proReihe = Math.max(1, Math.floor(breite / MIN_TASTE));
    if (!erzwingen && proReihe === tastenProReihe) return;
    tastenProReihe = proReihe;

    // Oktaven bilden, zu lange Oktaven (nur bei sehr schmalen Bildschirmen) teilen
    var oktaven = [];
    tasten.forEach(function (t) {
      var letzte = oktaven[oktaven.length - 1];
      if (!letzte || t.dataset.buchstabe === "c" || letzte.length >= proReihe) oktaven.push([t]);
      else letzte.push(t);
    });
    var reihen = [];
    oktaven.forEach(function (o) {
      var letzte = reihen[reihen.length - 1];
      if (letzte && letzte.length + o.length <= proReihe) reihen[reihen.length - 1] = letzte.concat(o);
      else reihen.push(o);
    });
    box.innerHTML = "";
    box.classList.toggle("klaviatur-mehrreihig", reihen.length > 1);
    // Alle Reihen gleich breit aufteilen, damit die Tasten untereinander gleich groß sind.
    var spalten = Math.max.apply(null, reihen.map(function (r) { return r.length; }));
    box.style.maxWidth = (spalten * MAX_TASTE) + "px";
    reihen.forEach(function (reihe) {
      var div = document.createElement("div");
      div.className = "klavier-reihe";
      div.style.gridTemplateColumns = "repeat(" + spalten + ", minmax(0, 1fr))";
      reihe.forEach(function (t, i) {
        var naechste = reihe[i + 1];
        t.classList.toggle("mit-schwarz", !!naechste && !!SCHWARZ_NACH[t.dataset.buchstabe]);
        div.appendChild(t);
      });
      box.appendChild(div);
    });
  }

  window.addEventListener("resize", function () {
    if (runde && !$("ansicht-klavier").hidden) ordneTasten(false);
  });

  /* ---------- Ablauf ---------- */

  function zeigeStatus() {
    $("klavier-aufgabe").textContent = "Aufgabe " + (runde.aufgabe + 1) + " von " + runde.anzahl;
    H.zeigeSterne($("klavier-sterne"), $("klavier-punkte"), runde.sterne, L.REGELN.startSterne, runde.punkte);
  }

  function zeigeAufgabe() {
    zeigeStatus();
    var system = $("klavier-notensystem");
    system.innerHTML = window.Notensystem.zeichne(runde.aktuell.note, { bereich: umgebung.bereich });
    system.classList.remove("ist-falsch", "ist-richtig");
    $("klavier-weiter").hidden = true;
    $("klavier-merkhilfe").hidden = true;
    $("klaviatur").classList.remove("gesperrt");
    tasten.forEach(function (t) {
      t.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      t.setAttribute("aria-disabled", "false");
      t.querySelector(".taste-marke").textContent = "";
      t.querySelector(".taste-name").textContent = "";
    });
    var fokus = document.activeElement;
    if (letzteTaste >= 0 && tasten[letzteTaste] &&
        (fokus === document.body || fokus === $("klavier-weiter") || (fokus && fokus.classList.contains("taste")))) {
      tasten[letzteTaste].focus({ preventScroll: true });
    }
  }

  function beantworte(name) {
    if (!aktiv()) return;
    var a = L.antworte(runde, name);
    if (!a) return; // schon beantwortet: weitere Tipps zählen nicht
    $("klaviatur").classList.add("gesperrt");
    tasten.forEach(function (t, i) {
      t.setAttribute("aria-disabled", "true");
      if (t.dataset.name === name) letzteTaste = i;
      if (t.dataset.name === a.note.name) {
        t.classList.add(a.richtig ? "ist-richtig" : "ist-loesung");
        t.querySelector(".taste-marke").textContent = "✓";
        t.querySelector(".taste-name").textContent = t.dataset.name;
      } else if (t.dataset.name === name) {
        t.classList.add("ist-falsch");
        t.querySelector(".taste-marke").textContent = "✗";
        t.querySelector(".taste-name").textContent = t.dataset.name;
      }
    });

    zeigeStatus();
    var system = $("klavier-notensystem");
    system.innerHTML = window.Notensystem.zeichne(a.note, { beschriftung: a.note.name, bereich: umgebung.bereich });
    system.classList.add(a.richtig ? "ist-richtig" : "ist-falsch");
    H.zeigeMerkhilfe(umgebung, a.note, "klavier-merkhilfe");
    $("klavier-text").textContent = (a.richtig ? "✓ " : "✗ ") + a.nachricht;
    umgebung.zeigeTier($("klavier-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      weiterTimer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      var weiter = $("klavier-weiter");
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
      H.klassischesEnde(umgebung, r);
      return;
    }
    $("klavier-text").textContent = "Und diese hier?";
    umgebung.zeigeTier($("klavier-tier"), "normal");
    zeigeAufgabe();
  }

  $("klavier-weiter").addEventListener("click", naechsteAufgabe);

  /* Tastatur: Buchstabe tippen, wenn er auf der Klaviatur eindeutig ist. */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-klavier").hidden || runde.gesperrt || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var taste = (ev.key || "").toLowerCase();
    if (!/^[a-h]$/.test(taste)) return;
    var treffer = umgebung.antworten.filter(function (a) { return a.buchstabe === taste; });
    if (treffer.length === 1) {
      ev.preventDefault();
      beantworte(treffer[0].name);
    }
  });

  window.Modi.registriere({
    id: "klaviertasten",
    name: "Klaviertasten",
    symbol: "🎹",
    ansicht: "klavier",
    reise: true,
    starte: starte,
    stoppe: stoppe
  });
})();
