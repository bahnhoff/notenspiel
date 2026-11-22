/*
 * Modus „Klaviertasten“: Note im Notensystem, darunter eine Klaviatur über
 * den gewählten Bereich. Das Kind tippt die passende Taste. Hat die
 * Notenauswahl Lücken, zeigt die Klaviatur trotzdem alle weißen Tasten von der
 * tiefsten bis zur höchsten gewählten Note, damit sie wie ein Klavier aussieht.
 * Schwarze Tasten sind nur für gewählte Vorzeichen-Noten tippbar, sonst
 * Dekoration. Für eine schwarze Taste zählt die Tonhöhe: fis¹ und ges¹ sind
 * dieselbe Taste. Das mittlere C ist markiert.
 * Im einfachen Antwortmodus zählt jede Taste mit dem richtigen Buchstaben.
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
  var tasten = [];               // alle Tasten: { art, el, toene, halbton, name, … }
  var weisse = [];               // nur die weißen Tasten, tief nach hoch
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
    baueKlaviatur(u.namen);
    u.zeigeTier($("klavier-tier"), "normal");
    u.zeigeAnsicht();
    ordneTasten(true);
    zeigeAufgabe();
    var mitSchwarz = tasten.some(function (t) { return t.art === "schwarz"; });
    $("klavier-text").textContent = mitSchwarz ? "Welche Taste passt zu dieser Note?" : "Welche weiße Taste passt zu dieser Note?";
  }

  function stoppe() {
    clearTimeout(weiterTimer);
    runde = null;
  }

  /* ---------- Klaviatur ---------- */

  /**
   * Baut die Tasten von der tiefsten bis zur höchsten Note, ohne Lücken.
   * Jede Taste kennt ihre Töne (`toene`, Noten.ton): eine weiße Taste einen,
   * eine schwarze zwei gleich klingende (fis¹ und ges¹). Schwarze Tasten
   * werden nur für gewählte Vorzeichen-Noten zu Knöpfen, sonst bleiben sie
   * Dekoration an der weißen Taste davor.
   */
  function baueKlaviatur(namen) {
    var N = window.Noten;
    tasten = [];
    weisse = [];
    if (namen.length === 0) return;
    // Vorzeichen-Noten brauchen die weiße Nachbartaste, damit ihre schwarze Taste Platz hat.
    var tief = Infinity, hoch = -Infinity, hoehen = {};
    namen.forEach(function (n) {
      tief = Math.min(tief, n.vorzeichen < 0 ? n.stufe - 1 : n.stufe);
      hoch = Math.max(hoch, n.vorzeichen > 0 ? n.stufe + 1 : n.stufe);
      if (n.vorzeichen) hoehen[n.halbton] = n.name;
    });
    for (var s = tief; s <= hoch; s++) {
      var ton = N.ton(s, 0);
      var weiss = { art: "weiss", toene: [ton], halbton: ton.halbton, buchstabe: ton.buchstabe, name: ton.name, schwarz: null };
      weiss.el = weisseTaste(weiss);
      tasten.push(weiss);
      weisse.push(weiss);
      if (SCHWARZ_NACH[ton.buchstabe] && s < hoch) {
        var kreuz = N.ton(s, 1);
        var schwarz = { art: "schwarz", toene: [kreuz, N.ton(s + 1, -1)], halbton: kreuz.halbton,
          name: hoehen[kreuz.halbton] || kreuz.name, waehlbar: hoehen[kreuz.halbton] !== undefined };
        if (schwarz.waehlbar) {
          schwarz.el = schwarzeTaste(schwarz);
          tasten.push(schwarz);
        }
        weiss.schwarz = schwarz;
      }
    }
    tasten.forEach(function (t, i) {
      t.el.addEventListener("click", function () { beantworte(i); });
    });
  }

  function weisseTaste(t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "taste";
    var mitte = t.toene[0].stufe === 28; // c¹, das mittlere C
    if (mitte) b.classList.add("taste-mitte");
    b.innerHTML = '<span class="taste-schwarz" aria-hidden="true"></span>' +
      '<span class="taste-marke" aria-hidden="true"></span>' +
      '<span class="taste-name" aria-hidden="true"></span>' +
      (mitte ? '<span class="taste-mitte-zeichen" aria-hidden="true">c¹</span>' : "");
    b.setAttribute("aria-label", "Taste " + t.name + (mitte ? ", mittleres C" : ""));
    return b;
  }

  function schwarzeTaste(t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "taste-schwarz-knopf";
    b.innerHTML = '<span class="taste-marke" aria-hidden="true"></span><span class="taste-name" aria-hidden="true"></span>';
    b.setAttribute("aria-label", "Schwarze Taste " + t.name);
    return b;
  }

  /**
   * Verteilt die weißen Tasten auf Reihen, damit jede mindestens 48 px breit
   * ist und nichts seitlich scrollt. Passt alles in eine Reihe, bleibt es bei
   * einer. Sonst kommen ganze Oktaven (ab c) in eine Reihe, solange sie
   * hineinpassen; zu lange Oktaven werden zwischen e und f geteilt, wo keine
   * schwarze Taste liegt. Tiefe Reihen stehen unten, hohe oben. Wählbare
   * schwarze Tasten liegen als eigene Knöpfe über der Fuge zur nächsten Taste.
   */
  function ordneTasten(erzwingen) {
    var box = $("klaviatur");
    var breite = box.parentNode.clientWidth || 320;
    var proReihe = Math.max(1, Math.floor(breite / MIN_TASTE));
    if (!erzwingen && proReihe === tastenProReihe) return;
    tastenProReihe = proReihe;

    var oktaven = [];
    weisse.forEach(function (t) {
      var letzte = oktaven[oktaven.length - 1];
      if (!letzte || t.buchstabe === "c") oktaven.push([t]);
      else letzte.push(t);
    });
    var teile = [];
    oktaven.forEach(function (o) {
      if (o.length <= proReihe) { teile.push(o); return; }
      var f = -1;
      o.forEach(function (t, i) { if (t.buchstabe === "f") f = i; });
      (f > 0 ? [o.slice(0, f), o.slice(f)] : [o]).forEach(function (stueck) {
        for (var k = 0; k < stueck.length; k += proReihe) teile.push(stueck.slice(k, k + proReihe));
      });
    });
    var reihen = [];
    teile.forEach(function (o) {
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
      div.style.setProperty("--spalten", String(spalten));
      reihe.forEach(function (t, i) {
        var schwarz = reihe[i + 1] ? t.schwarz : null;
        t.el.classList.toggle("mit-schwarz", !!schwarz && !schwarz.waehlbar);
        div.appendChild(t.el);
        if (schwarz && schwarz.waehlbar) {
          schwarz.el.style.left = ((i + 1) * 100 / spalten) + "%";
          div.appendChild(schwarz.el);
        }
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
      t.el.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      t.el.setAttribute("aria-disabled", "false");
      t.el.querySelector(".taste-marke").textContent = "";
      t.el.querySelector(".taste-name").textContent = "";
    });
    var fokus = document.activeElement;
    if (letzteTaste >= 0 && tasten[letzteTaste] && (fokus === document.body || fokus === $("klavier-weiter") ||
        (fokus && (fokus.classList.contains("taste") || fokus.classList.contains("taste-schwarz-knopf"))))) {
      tasten[letzteTaste].el.focus({ preventScroll: true });
    }
  }

  /**
   * Antwort einer Taste: Von ihren Tönen zählt der, der zur Note passt
   * (SpielLogik.istRichtig mit Noten.antwortSchluessel), sonst der gewählte.
   */
  function tastenTon(taste, note) {
    var N = window.Noten;
    var modus = umgebung.antwortmodus;
    var passend = taste.toene.filter(function (t) { return L.istRichtig(note, N.antwortSchluessel(t, modus)); })[0];
    return passend || taste.toene.filter(function (t) { return t.name === taste.name; })[0] || taste.toene[0];
  }

  function beschrifte(t, klasse, marke, name) {
    if (klasse) t.el.classList.add(klasse);
    if (marke) t.el.querySelector(".taste-marke").textContent = marke;
    t.el.querySelector(".taste-name").textContent = name;
  }

  /** `nr` = Nummer der getippten Taste. */
  function beantworte(nr) {
    if (!aktiv()) return;
    var getippt = tasten[nr];
    var ton = tastenTon(getippt, runde.aktuell.note);
    var a = L.antworte(runde, window.Noten.antwortSchluessel(ton, umgebung.antwortmodus));
    if (!a) return; // schon beantwortet: weitere Tipps zählen nicht
    letzteTaste = nr;
    $("klaviatur").classList.add("gesperrt");
    tasten.forEach(function (t, i) {
      t.el.setAttribute("aria-disabled", "true");
      if (i === nr && a.richtig) {
        // Richtig, im einfachen Modus auch in einer anderen Oktave.
        beschrifte(t, "ist-richtig", "✓", ton.name);
      } else if (t.halbton === a.note.halbton) {
        // Genau die gezeigte Note: bei falscher Antwort als Lösung, sonst nur beschriftet.
        beschrifte(t, a.richtig ? "" : "ist-loesung", a.richtig ? "" : "✓", a.note.name);
      } else if (i === nr) {
        beschrifte(t, "ist-falsch", "✗", ton.name);
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

  /* Tastatur: Buchstabe tippen, wenn er auf der Klaviatur eindeutig ist (nur weiße Tasten). */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-klavier").hidden || runde.gesperrt || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var taste = (ev.key || "").toLowerCase();
    if (!/^[a-h]$/.test(taste)) return;
    var treffer = [];
    tasten.forEach(function (t, i) { if (t.art === "weiss" && t.buchstabe === taste) treffer.push(i); });
    // Im einfachen Modus zählt jede Taste mit dem Buchstaben, dann reicht die erste.
    if (treffer.length === 1 || (treffer.length > 1 && umgebung.antwortmodus === "einfach")) {
      ev.preventDefault();
      beantworte(treffer[0]);
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
