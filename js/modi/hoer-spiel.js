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
  var T = window.Texte;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1300; // Millisekunden
  var PAUSE_BEZUGSTON = 1600;    // vom Bezugston c¹ bis zum ersten Aufgabenton
  var MITTLERES_C = 60;          // Tonhöhe von c¹ (MIDI-Nummer, siehe Noten.halbton)
  var OPTIONEN = 3;
  // Schmales System für die drei Notenkarten, mit Vorzeichen etwas breiter
  var FORM_STAMM = { breite: 92, noteX: 70 };
  var FORM_VORZEICHEN = { breite: 100, noteX: 78 };
  var FORM = FORM_STAMM;

  var Ton = window.Klang; // Klavierton aus js/klang.js


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
    FORM = u.noten.some(function (n) { return n.vorzeichen; }) ? FORM_VORZEICHEN : FORM_STAMM;
    var mittleresC = window.Noten.anzeigeName(28, 0);
    $("hoeren-bezug-name").textContent = mittleresC;
    $("hoeren-bezug").setAttribute("aria-label", T.t("hoeren.bezugAria", { name: mittleresC }));
    u.zeigeTier($("hoeren-tier"), "normal");
    u.zeigeAnsicht();
    zeigeAufgabe();
    // starte() läuft im Tipp auf die Kachel: Jetzt darf der Ton beginnen.
    var mitTon = Ton.bereit();
    zeigeTonHinweis(mitTon);
    if (mitTon && Ton.spiele(MITTLERES_C)) {
      $("hoeren-text").textContent = T.t("hoeren.einleitung", { name: mittleresC });
      offen = false;
      timer = setTimeout(function () {
        if (!aktiv()) return;
        offen = true;
        spieleAufgabe();
        $("hoeren-text").textContent = T.t("hoeren.gehoert");
      }, PAUSE_BEZUGSTON);
    } else {
      offen = true;
      $("hoeren-text").textContent = T.t("hoeren.passt");
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
      box.textContent = T.t("hoeren.keinTon");
      box.hidden = false;
      return;
    }
    box.hidden = true;
    hinweisTimer = setTimeout(function () {
      if (!aktiv()) return;
      if (!Ton.laeuft()) {
        box.textContent = T.t("hoeren.stumm");
        box.hidden = false;
      }
    }, 900);
  }

  function spieleAufgabe() {
    if (!aktiv() || !runde.aktuell) return;
    Ton.spiele(runde.aktuell.note.halbton);
  }

  /*
   * Wählt zwei andere Noten mit anderer Tonhöhe (fis und ges nie zusammen),
   * möglichst mindestens eine kleine Terz entfernt.
   */
  function waehleOptionen(ziel) {
    var andere = H.mische(umgebung.noten.filter(function (n) { return n.halbton !== ziel.halbton; }));
    var gewaehlt = [ziel];
    function passt(n, mindestens) {
      return gewaehlt.every(function (g) { return Math.abs(g.halbton - n.halbton) >= mindestens; });
    }
    [3, 1].forEach(function (mindestens) {
      andere.forEach(function (n) {
        if (gewaehlt.length < OPTIONEN && passt(n, mindestens)) gewaehlt.push(n);
      });
    });
    return H.mische(gewaehlt);
  }

  function zeigeStatus() {
    $("hoeren-aufgabe").textContent = H.aufgabeText(runde);
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
      b.setAttribute("aria-label", T.t("hoeren.note", { nr: i + 1 }));
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
        b.querySelector(".hoer-name").textContent = n.anzeige;
        b.setAttribute("aria-label", T.t(marke === "✓" ? "runde.richtig" : "runde.falsch",
          { name: T.t("hoeren.noteName", { nr: k + 1, name: n.anzeige }) }));
      }
    });
    zeigeStatus();
    H.zeigeMerkhilfe(umgebung, a.note, "hoeren-merkhilfe");
    $("hoeren-text").textContent = a.richtig
      ? "✓ " + (a.serie > 0 && a.serie % 3 === 0 ? a.nachricht : T.t("hoeren.richtig", { name: a.note.anzeige }))
      : T.t("hoeren.falsch", { name: a.note.anzeige });
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
    $("hoeren-text").textContent = T.t("hoeren.weiter");
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
      $("hoeren-text").textContent = T.t("hoeren.gehoert");
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
    get name() { return T.t("modus.hoer-spiel"); },
    symbol: "👂",
    ansicht: "hoeren",
    starte: starte,
    stoppe: stoppe
  });
})();
