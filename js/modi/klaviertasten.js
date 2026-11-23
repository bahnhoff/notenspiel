/*
 * Modus „Klaviertasten“: Note im Notensystem, darunter eine Klaviatur über
 * den gewählten Bereich. Das Kind tippt die passende Taste. Hat die
 * Notenauswahl Lücken, zeigt die Klaviatur trotzdem alle weißen Tasten von der
 * tiefsten bis zur höchsten gewählten Note, damit sie wie ein Klavier aussieht.
 * Alle Tasten sind tippbar, auch die schwarzen. Ohne gewählte Vorzeichen-Noten
 * zählt eine schwarze Taste als falsche Antwort. Alle Tasten liegen in einer Reihe. Für eine
 * schwarze Taste zählt die Tonhöhe: fis¹ und ges¹ sind dieselbe Taste. Das mittlere C ist markiert.
 * Jede Taste spielt beim Drücken ihren Ton (js/klang.js). Die Klaviatur selbst
 * baut js/klaviatur.js (auch für „Fehler üben“).
 * Im einfachen Antwortmodus zählt jede Taste mit dem richtigen Buchstaben.
 * Aufbau wie im Entwurf: Begleiter mit der kurzen Aufgabe oben rechts über der
 * Bühne, darunter die Klaviatur mit zwei Zusatztasten unter der tiefsten Note.
 * Die Zieltaste leuchtet erst nach der Antwort mit Namensschild auf; Merkhilfe,
 * Rückmeldung und „Weiter“ stehen als Karte unter der Klaviatur.
 * 10 Aufgaben, Wertung wie im klassischen Spiel (js/spiel-logik.js).
 * Nutzt die Ansicht #ansicht-klavier aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var T = window.Texte;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1200; // Millisekunden

  var umgebung = null;
  var runde = null;
  var weiterTimer = null;
  var klaviatur = null;          // gemeinsame Klaviatur (js/klaviatur.js)
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
    klaviatur = window.Klaviatur.baue($("klaviatur"), u.namen, beantworte, { unten: 2 });
    u.zeigeTier($("klavier-tier"), "normal");
    $("klavier-frage-text").textContent = T.t(klaviatur.mitSchwarz ? "klavier.start" : "klavier.startWeiss");
    u.zeigeAnsicht();
    zeigeAufgabe();
  }

  function stoppe() {
    clearTimeout(weiterTimer);
    runde = null;
    window.Klang.pausiere();
  }

  /* ---------- Ablauf ---------- */

  function zeigeStatus() {
    $("klavier-aufgabe").textContent = H.aufgabeText(runde);
    H.zeigeSterne($("klavier-sterne"), $("klavier-punkte"), runde.sterne, L.REGELN.startSterne, runde.punkte);
  }

  function zeigeAufgabe() {
    zeigeStatus();
    var system = $("klavier-notensystem");
    system.innerHTML = window.Notensystem.zeichne(runde.aktuell.note, { bereich: umgebung.bereich, namensPlatz: H.namensPlatz(umgebung) });
    system.classList.remove("ist-falsch", "ist-richtig");
    $("klavier-weiter").hidden = true;
    $("klavier-merkhilfe").hidden = true;
    $("klavier-rueckmeldung").hidden = true;
    klaviatur.zuruecksetzen();
    var tasten = klaviatur.tasten;
    var fokus = document.activeElement;
    if (letzteTaste >= 0 && tasten[letzteTaste] && (fokus === document.body || fokus === $("klavier-weiter") ||
        (fokus && (fokus.classList.contains("taste") || fokus.classList.contains("taste-schwarz-knopf"))))) {
      tasten[letzteTaste].el.focus({ preventScroll: true });
    }
  }

  /** `nr` = Nummer der getippten Taste. */
  function beantworte(nr) {
    if (!aktiv()) return;
    var ton = klaviatur.tastenTon(nr, runde.aktuell.note, umgebung.antwortmodus);
    var a = L.antworte(runde, window.Noten.antwortSchluessel(ton, umgebung.antwortmodus));
    if (!a) return; // schon beantwortet: weitere Tipps zählen nicht
    letzteTaste = nr;
    klaviatur.zeigeAntwort(nr, a, ton);

    zeigeStatus();
    var system = $("klavier-notensystem");
    system.innerHTML = window.Notensystem.zeichne(a.note, { beschriftung: a.note.anzeige, bereich: umgebung.bereich,
      markiere: true, namensPlatz: H.namensPlatz(umgebung) });
    system.classList.add(a.richtig ? "ist-richtig" : "ist-falsch");
    H.zeigeMerkhilfe(umgebung, a.note, "klavier-merkhilfe");
    $("klavier-text").textContent = (a.richtig ? "✓ " : "✗ ") + a.nachricht;
    $("klavier-rueckmeldung").hidden = false;
    umgebung.zeigeTier($("klavier-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      weiterTimer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      H.zeigeWeiter($("klavier-weiter"));
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
    umgebung.zeigeTier($("klavier-tier"), "normal");
    zeigeAufgabe();
  }

  $("klavier-weiter").addEventListener("click", naechsteAufgabe);

  /* Tastatur: Buchstabe tippen, wenn er auf der Klaviatur eindeutig ist (nur weiße Tasten). */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-klavier").hidden || runde.gesperrt || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var taste = window.Noten.tasteZuBuchstabe(ev.key);
    if (!taste) return;
    var treffer = klaviatur.weisseMit(taste);
    // Gibt es den Buchstaben mehrmals (Zusatztasten), zählen nur Tasten aus der Notenauswahl.
    if (treffer.length > 1) {
      var gewaehlt = {};
      umgebung.namen.forEach(function (n) { gewaehlt[n.name] = true; });
      var drin = treffer.filter(function (nr) { return gewaehlt[klaviatur.tasten[nr].name]; });
      if (drin.length === 1 || (drin.length > 1 && umgebung.antwortmodus === "einfach")) treffer = drin;
    }
    // Im einfachen Modus zählt jede Taste mit dem Buchstaben, dann reicht die erste.
    if (treffer.length === 1 || (treffer.length > 1 && umgebung.antwortmodus === "einfach")) {
      ev.preventDefault();
      klaviatur.klinge(treffer[0]);
      beantworte(treffer[0]);
    }
  });

  window.Modi.registriere({
    id: "klaviertasten",
    get name() { return T.t("modus.klaviertasten"); },
    symbol: "🎹",
    ansicht: "klavier",
    reise: true,
    fehlerUeben: true,
    starte: starte,
    stoppe: stoppe
  });
})();
