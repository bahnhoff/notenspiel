/*
 * Klavierton für die Spiele (Hör-Spiel, Klaviertasten).
 *
 * Der Ton entsteht lokal mit der Web Audio API (keine Audiodateien): einige
 * Obertöne mit abklingender Hüllkurve, ähnlich einer Klaviersaite. Der
 * AudioContext startet erst nach einem Tipp: vor `spiele` immer `bereit()`
 * aus einer Nutzeraktion heraus aufrufen. Ohne Web Audio liefert `bereit()`
 * false, und `spiele` tut nichts.
 */
(function (root) {
  "use strict";

  root.Klang = (function () {
    var Kontext = window.AudioContext || window.webkitAudioContext;
    var ctx = null;
    var aktive = [];
    // Teiltöne: [Vielfaches, Lautstärke]. Höhere klingen schneller ab.
    var TEILTOENE = [[1, 1], [2, 0.5], [3, 0.28], [4, 0.16], [5, 0.1], [6, 0.06], [7, 0.035]];

    // Fehler beim Wecken oder Schlafenlegen nicht als Konsolenfehler melden.
    function leise(versprechen) {
      if (versprechen && versprechen.catch) versprechen.catch(function () { /* egal */ });
    }

    function frequenz(midi) {
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

    /** Spielt einen Ton (Tonhöhe als MIDI-Nummer, siehe Noten.halbton). */
    function spiele(halbton) {
      if (!ctx) return false;
      stoppeAlle();
      var f = frequenz(halbton);
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
})(window);
