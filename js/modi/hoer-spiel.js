/*
 * Modus „Hör-Spiel“: Das Spiel spielt einen Ton, das Kind wählt aus drei
 * gezeigten Noten die passende. Zum Einstieg erklingt c¹ als Bezugston.
 * „Nochmal hören“ ist immer da. 10 Aufgaben, Wertung wie im klassischen
 * Spiel (js/spiel-logik.js). Tastatur: 1, 2, 3 wählen eine Note.
 *
 * Der Ton entsteht lokal mit der Web Audio API (keine Audiodateien): einige
 * Obertöne mit abklingender Hüllkurve, ähnlich einer Klaviersaite. Der
 * AudioContext startet erst nach einem Tipp (Kachel, „Noch eine Runde“,
 * „Nochmal hören“). Ohne Web Audio bleibt das Spiel bedienbar und zeigt
 * einen Hinweis.
 * Nutzt die Ansicht #ansicht-hoeren aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1300; // Millisekunden
  var PAUSE_BEZUGSTON = 1600;    // vom Bezugston c¹ bis zum ersten Aufgabenton
  var MITTLERES_C = 28;          // Stufe von c¹ (js/noten.js)
  var OPTIONEN = 3;
  // Schmales System für die drei Notenkarten
  var FORM = { breite: 92, noteX: 70 };

  /* ---------- Klavierton ---------- */

  var Ton = (function () {
    var Kontext = window.AudioContext || window.webkitAudioContext;
    var ctx = null;
    var aktive = [];
    var HALBTOENE = [0, 2, 4, 5, 7, 9, 11];
    // Teiltöne: [Vielfaches, Lautstärke]. Höhere klingen schneller ab.
    var TEILTOENE = [[1, 1], [2, 0.5], [3, 0.28], [4, 0.16], [5, 0.1], [6, 0.06], [7, 0.035]];

    // Fehler beim Wecken oder Schlafenlegen nicht als Konsolenfehler melden.
    function leise(versprechen) {
      if (versprechen && versprechen.catch) versprechen.catch(function () { /* egal */ });
    }

    function frequenz(stufe) {
      var midi = (Math.floor(stufe / 7) + 1) * 12 + HALBTOENE[stufe % 7];
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /** Erzeugt oder weckt den AudioContext. Nur nach einer Nutzeraktion aufrufen. */
    function bereit() {
      if (!Kontext) return false;
      try {
        if (!ctx) {
          // iPhone: Ton auch bei Stummschalter, weil das Kind ihn ausdrücklich startet.
          if (navigator.audioSession) navigator.audioSession.type = "playback";
          ctx = new Kontext();
        }
        if (ctx.state === "suspended" && ctx.resume) leise(ctx.resume());
        return true;
      } catch (e) {
        ctx = null;
        return false;
      }
    }

    function stoppeAlle() {
      if (!ctx) return;
      var t = ctx.currentTime;
      aktive.forEach(function (q) {
        try {
          q.gain.gain.cancelScheduledValues(t);
          q.gain.gain.setTargetAtTime(0, t, 0.015);
          q.osc.stop(t + 0.08);
        } catch (e) { /* schon beendet */ }
      });
      aktive = [];
    }

    /** Spielt eine Note (Stufe wie in js/noten.js). */
    function spiele(stufe) {
      if (!ctx) return false;
      stoppeAlle();
      var f = frequenz(stufe);
      var start = ctx.currentTime + 0.03;
      // Tiefe Töne klingen länger nach als hohe.
      var dauer = Math.max(1.2, Math.min(2.8, 3.2 - f / 400));
      var ausgang = ctx.createGain();
      ausgang.gain.value = 0.5;
      var filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(9000, f * 9), start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2.5), start + dauer);
      filter.connect(ausgang);
      ausgang.connect(ctx.destination);
      var summe = TEILTOENE.reduce(function (s, t) { return s + t[1]; }, 0);
      TEILTOENE.forEach(function (t, i) {
        var n = t[0];
        if (f * n > 12000) return;
        var osc = ctx.createOscillator();
        osc.type = "sine";
        // leichte Spreizung der Obertöne wie bei einer gespannten Saite
        osc.frequency.value = f * n * Math.sqrt(1 + 0.0004 * n * n);
        var g = ctx.createGain();
        var spitze = 0.9 * t[1] / summe;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(spitze, start + 0.005);
        // schneller erster Abfall nach dem Anschlag, dann langes Ausklingen
        g.gain.setTargetAtTime(spitze * 0.45, start + 0.005, 0.06 / (1 + i * 0.4));
        g.gain.setTargetAtTime(0.0001, start + 0.12, dauer / (3 + i));
        osc.connect(g);
        g.connect(filter);
        osc.start(start);
        osc.stop(start + dauer + 0.2);
        var quelle = { osc: osc, gain: g };
        aktive.push(quelle);
        osc.onended = function () {
          try { g.disconnect(); } catch (e) { /* egal */ }
          aktive = aktive.filter(function (q) { return q !== quelle; });
        };
      });
      return true;
    }

    /** Stoppt alle Töne und legt den AudioContext schlafen. */
    function pausiere() {
      stoppeAlle();
      if (ctx && ctx.state === "running" && ctx.suspend) leise(ctx.suspend());
    }

    return {
      verfuegbar: !!Kontext,
      bereit: bereit,
      spiele: spiele,
      stoppeAlle: stoppeAlle,
      pausiere: pausiere,
      laeuft: function () { return !!ctx && ctx.state === "running"; }
    };
  })();

  /* ---------- Spiel ---------- */

  var umgebung = null;
  var runde = null;
  var timer = null;
  var hinweisTimer = null;
  var optionen = [];     // Noten auf den drei Karten
  var knoepfe = [];
  var offen = false;     // erst nach dem ersten Aufgabenton antworten
  var letzterKnopf = -1;

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return runde && umgebung && umgebung.laeuft();
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    runde = L.neueRunde(u.noten, { vorrang: u.schwierig, aufgaben: u.aufgaben });
    letzterKnopf = -1;
    u.zeigeTier($("hoeren-tier"), "normal");
    u.zeigeAnsicht();
    zeigeAufgabe();
    // starte() läuft im Tipp auf die Kachel: Jetzt darf der Ton beginnen.
    var mitTon = Ton.bereit();
    zeigeTonHinweis(mitTon);
    if (mitTon && Ton.spiele(MITTLERES_C)) {
      $("hoeren-text").textContent = "Hör zu: Das ist c¹, das mittlere C. Gleich kommt dein Ton.";
      offen = false;
      timer = setTimeout(function () {
        if (!aktiv()) return;
        offen = true;
        spieleAufgabe();
        $("hoeren-text").textContent = "Welche Note hast du gehört?";
      }, PAUSE_BEZUGSTON);
    } else {
      offen = true;
      $("hoeren-text").textContent = "Welche Note passt zum Ton?";
    }
  }

  function stoppe() {
    clearTimeout(timer);
    clearTimeout(hinweisTimer);
    runde = null;
    offen = false;
    Ton.pausiere();
  }

  /** Hinweis ohne Web Audio oder wenn der Ton nicht anläuft (zum Beispiel stummes Gerät). */
  function zeigeTonHinweis(mitTon) {
    var box = $("hoeren-hinweis");
    clearTimeout(hinweisTimer);
    if (!mitTon) {
      box.textContent = "🔇 Dieser Browser kann hier keinen Ton abspielen. Du kannst trotzdem raten und spielen.";
      box.hidden = false;
      return;
    }
    box.hidden = true;
    hinweisTimer = setTimeout(function () {
      if (!aktiv()) return;
      if (!Ton.laeuft()) {
        box.textContent = "🔇 Kein Ton? Schalte den Ton am Gerät ein und tippe auf „Nochmal hören“.";
        box.hidden = false;
      }
    }, 900);
  }

  function spieleAufgabe() {
    if (!aktiv() || !runde.aktuell) return;
    Ton.spiele(runde.aktuell.note.stufe);
  }

  /* Wählt zwei andere Noten mit anderem Namen, möglichst nicht direkt benachbart. */
  function waehleOptionen(ziel) {
    var andere = H.mische(umgebung.noten.filter(function (n) { return n.stufe !== ziel.stufe; }));
    var gewaehlt = [ziel];
    function passt(n, mindestens) {
      return gewaehlt.every(function (g) { return Math.abs(g.stufe - n.stufe) >= mindestens; });
    }
    [2, 1].forEach(function (mindestens) {
      andere.forEach(function (n) {
        if (gewaehlt.length < OPTIONEN && passt(n, mindestens)) gewaehlt.push(n);
      });
    });
    return H.mische(gewaehlt);
  }

  function zeigeStatus() {
    $("hoeren-aufgabe").textContent = "Aufgabe " + (runde.aufgabe + 1) + " von " + runde.anzahl;
    H.zeigeSterne($("hoeren-sterne"), $("hoeren-punkte"), runde.sterne, L.REGELN.startSterne, runde.punkte);
  }

  function zeigeAufgabe() {
    zeigeStatus();
    optionen = waehleOptionen(runde.aktuell.note);
    var box = $("hoeren-optionen");
    box.innerHTML = "";
    box.classList.remove("gesperrt");
    knoepfe = optionen.map(function (n, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "knopf hoer-option";
      b.setAttribute("aria-label", "Note " + (i + 1));
      b.innerHTML = '<span class="hoer-marke" aria-hidden="true"></span>' +
        window.Notensystem.zeichne(n, { bereich: umgebung.bereich, breite: FORM.breite, noteX: FORM.noteX }) +
        '<span class="hoer-name" aria-hidden="true"></span>';
      b.addEventListener("click", function () { beantworte(i); });
      box.appendChild(b);
      return b;
    });
    $("hoeren-weiter").hidden = true;
    $("hoeren-merkhilfe").hidden = true;
    var fokus = document.activeElement;
    if (letzterKnopf >= 0 && knoepfe[letzterKnopf] &&
        (fokus === document.body || fokus === $("hoeren-weiter") || !document.contains(fokus))) {
      knoepfe[letzterKnopf].focus({ preventScroll: true });
    }
  }

  function beantworte(i) {
    if (!aktiv() || !offen) return;
    var gewaehlt = optionen[i];
    var a = L.antworte(runde, gewaehlt.name);
    if (!a) return; // schon beantwortet: weitere Tipps zählen nicht
    letzterKnopf = i;
    $("hoeren-optionen").classList.add("gesperrt");
    knoepfe.forEach(function (b, k) {
      var n = optionen[k];
      b.setAttribute("aria-disabled", "true");
      var marke = "", status = "";
      if (n.name === a.note.name) { marke = "✓"; status = a.richtig ? "ist-richtig" : "ist-loesung"; }
      else if (k === i) { marke = "✗"; status = "ist-falsch"; }
      if (status) {
        b.classList.add(status);
        b.querySelector(".hoer-marke").textContent = marke;
        b.querySelector(".hoer-name").textContent = n.name;
        b.setAttribute("aria-label", "Note " + (k + 1) + ": " + n.name + (marke === "✓" ? ", richtig" : ", falsch"));
      }
    });
    zeigeStatus();
    H.zeigeMerkhilfe(umgebung, a.note, "hoeren-merkhilfe");
    $("hoeren-text").textContent = a.richtig
      ? "✓ " + (a.serie > 0 && a.serie % 3 === 0 ? a.nachricht : "Richtig, das war " + a.note.name + "!")
      : "✗ Das war " + a.note.name + ". Hör noch einmal hin.";
    umgebung.zeigeTier($("hoeren-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      timer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      // Den richtigen Ton noch einmal vorspielen, damit Ton und Note zusammenpassen.
      spieleAufgabe();
      var weiter = $("hoeren-weiter");
      weiter.hidden = false;
      weiter.focus({ preventScroll: true });
      if (weiter.scrollIntoView) weiter.scrollIntoView({ block: "nearest" });
    }
  }

  function naechsteAufgabe() {
    clearTimeout(timer);
    if (!aktiv()) return;
    var w = L.weiter(runde);
    if (!w) return; // doppelter Aufruf
    if (w.beendet) {
      var r = runde;
      runde = null;
      Ton.pausiere();
      H.klassischesEnde(umgebung, r);
      return;
    }
    umgebung.zeigeTier($("hoeren-tier"), "normal");
    $("hoeren-text").textContent = "Und welcher Ton ist das?";
    zeigeAufgabe();
    timer = setTimeout(spieleAufgabe, 250);
  }

  $("hoeren-nochmal").addEventListener("click", function () {
    if (!aktiv()) return;
    var mitTon = Ton.bereit();
    zeigeTonHinweis(mitTon);
    if (!mitTon) return;
    clearTimeout(timer);
    if (!offen) {
      // noch in der Einleitung: gleich den Aufgabenton spielen
      offen = true;
      $("hoeren-text").textContent = "Welche Note hast du gehört?";
    }
    spieleAufgabe();
    if (runde.gesperrt && runde.letzteAntwort && runde.letzteAntwort.richtig) {
      timer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    }
  });

  $("hoeren-bezug").addEventListener("click", function () {
    if (!aktiv()) return;
    var mitTon = Ton.bereit();
    zeigeTonHinweis(mitTon);
    if (mitTon) Ton.spiele(MITTLERES_C);
  });

  $("hoeren-weiter").addEventListener("click", naechsteAufgabe);

  /* Tastatur: 1, 2, 3 wählen eine Note. */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-hoeren").hidden || runde.gesperrt || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var nr = Number(ev.key);
    if (nr >= 1 && nr <= knoepfe.length) {
      ev.preventDefault();
      beantworte(nr - 1);
    }
  });

  // Tab im Hintergrund: Ton sofort stoppen.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) Ton.stoppeAlle();
  });

  window.Modi.registriere({
    id: "hoer-spiel",
    name: "Hör-Spiel",
    symbol: "👂",
    ansicht: "hoeren",
    starte: starte,
    stoppe: stoppe
  });
})();
