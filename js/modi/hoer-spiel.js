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
 * Aufbau wie im Entwurf (Plan Version 3): Steuerzeile mit „Nochmal hören“,
 * Bezugston-Kästchen und Sprechzeile des Begleiters, drei Antwortkarten mit
 * Ziffer und Schlüssel (der Name erst nach der Antwort), Spielzeug-Klavier
 * zum Vergleichen (klingt nur, zählt nichts). Nach jeder Antwort liegt ein
 * Banner mit „Nächste Note →“ über der Kopfkarte.
 * Nutzt die Ansicht #ansicht-hoeren aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var T = window.Texte;
  var H = window.Modi.hilfen;
  var B = window.Bausteine;
  var N = window.Noten;
  var PAUSE_NACH_RICHTIG = 1800; // Millisekunden (Zeit, das Banner zu lesen)
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
  var sprech = null;     // Sprechzeile des Begleiters (js/bausteine.js)
  var klaviatur = null;  // Spielzeug-Klavier

  function sage(text) {
    if (!sprech) {
      sprech = B.sprechZeile({ tier: umgebung.tier, text: text });
      $("hoeren-sprech").appendChild(sprech);
    } else {
      B.setzeSprechZeile(sprech, umgebung.tier, text);
    }
  }

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
    baueKlavier(u);
    u.zeigeAnsicht();
    zeigeAufgabe();
    // starte() läuft im Tipp auf die Kachel: Jetzt darf der Ton beginnen.
    var mitTon = Ton.bereit();
    zeigeTonHinweis(mitTon);
    if (mitTon && Ton.spiele(MITTLERES_C)) {
      sage(T.t("hoeren.einleitung", { name: mittleresC }));
      offen = false;
      timer = setTimeout(function () {
        if (!aktiv()) return;
        offen = true;
        spieleAufgabe();
        sage(T.t("hoeren.gehoert"));
      }, PAUSE_BEZUGSTON);
    } else {
      offen = true;
      sage(T.t("hoeren.passt"));
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
    // Ton in der App ausgeschaltet (Klang.setzeAn): Hinweis mit Knopf „Ton einschalten“
    if (!Ton.an()) {
      box.textContent = T.t("hoeren.tonAus") + " ";
      var k = document.createElement("button");
      k.type = "button";
      k.className = "knopf knopf-klein knopf-neben knopf-ton-ein";
      k.textContent = T.t("ton.einschaltenKnopf");
      k.addEventListener("click", function () {
        Ton.setzeAn(true);
        zeigeTonHinweis(Ton.bereit());
        spieleAufgabe();
      });
      box.appendChild(k);
      box.hidden = false;
      return;
    }
    if (!mitTon) {
      box.textContent = T.t("hoeren.keinTon");
      box.hidden = false;
      return;
    }
    // Der Hinweis „Kein Ton?“ bleibt stehen, bis der Ton wirklich läuft. Ihn bei
    // jedem „Nochmal hören“ erst aus- und nach 900 ms wieder einzublenden, ließ
    // den Inhalt darunter springen, während das Kind tippt.
    hinweisTimer = setTimeout(function () {
      if (!aktiv()) return;
      if (Ton.laeuft()) {
        box.hidden = true;
      } else {
        box.textContent = T.t("hoeren.stumm");
        box.hidden = false;
      }
    }, 900);
  }

  function spieleAufgabe() {
    if (!aktiv() || !runde.aktuell) return;
    if (!Ton.spiele(runde.aktuell.note.halbton)) return;
    // Kleine Wellen-Animation am Lautsprecher von „Nochmal hören“
    var k = $("hoeren-nochmal");
    k.classList.remove("spielt");
    void k.offsetWidth;
    k.classList.add("spielt");
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

  /** Beschriftung unter einer Karte: vor der Antwort nur der Schlüssel, danach mit Namen. */
  function kartenText(n, mitName) {
    var schluessel = T.t("hoeren.karte." + n.schluessel);
    return mitName ? T.t("hoeren.karteName", { schluessel: schluessel, name: n.anzeige }) : schluessel;
  }

  /** Spielzeug-Klavier über den gewählten Bereich: klingt nur, antwortet nicht. */
  function baueKlavier(u) {
    klaviatur = window.Klaviatur.baue($("hoeren-klaviatur"), u.namen, function () { /* nur Ton */ });
    klaviatur.tasten.forEach(function (tt) {
      if (tt.art === "weiss") tt.el.querySelector(".taste-name").textContent = tt.anzeige;
    });
  }

  function zeigeAufgabe() {
    zeigeStatus();
    optionen = waehleOptionen(runde.aktuell.note);
    var box = $("hoeren-optionen");
    box.innerHTML = "";
    box.classList.remove("gesperrt");
    var tippen = window.Symbole.zeichne("tippen");
    knoepfe = optionen.map(function (n, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "knopf hoer-option";
      b.setAttribute("aria-label", T.t("hoeren.note", { nr: i + 1 }) + ", " + kartenText(n, false));
      b.innerHTML = '<span class="hoer-ziffer" aria-hidden="true">' + (i + 1) + "</span>" +
        '<span class="hoer-tippen" aria-hidden="true">' + tippen + "</span>" +
        '<span class="hoer-marke" aria-hidden="true"></span>' +
        '<span class="hoer-system">' + window.Notensystem.zeichne(n, { bereich: umgebung.bereich, breite: FORM.breite, noteX: FORM.noteX }) + "</span>" +
        '<span class="hoer-name" aria-hidden="true">' + kartenText(n, false) + "</span>";
      b.addEventListener("click", function () { beantworte(i); });
      box.appendChild(b);
      return b;
    });
    $("hoeren-banner").hidden = true;
    var fokus = document.activeElement;
    if (letzterKnopf >= 0 && knoepfe[letzterKnopf] &&
        (fokus === document.body || fokus === $("hoeren-weiter") || !document.contains(fokus))) {
      knoepfe[letzterKnopf].focus({ preventScroll: true });
    }
  }

  /** Banner über der Kopfkarte: Titel, Untertitel und das Merktier. */
  function zeigeBanner(a, gewaehlt) {
    var banner = $("hoeren-banner");
    banner.classList.toggle("ist-richtig", a.richtig);
    banner.classList.toggle("ist-falsch", !a.richtig);
    $("hoeren-banner-titel").textContent = a.richtig
      ? T.t("hoeren.bannerRichtig", { name: a.note.anzeige })
      : T.t("hoeren.bannerFalsch");
    $("hoeren-banner-unter").textContent = a.richtig
      ? a.note.hinweis
      : T.t(a.note.halbton < gewaehlt.halbton ? "hoeren.tiefer" : "hoeren.hoeher", { name: a.note.anzeige, gewaehlt: gewaehlt.anzeige });
    var hilfe = umgebung.merkhilfe(a.note);
    $("hoeren-merkhilfe-bild").innerHTML = hilfe ? window.Tiere.zeichne(hilfe.tier, "froh", hilfe.name) : "";
    $("hoeren-merkhilfe-bild").hidden = !hilfe;
    banner.hidden = false;
    // Die Merkhilfe bleibt beim Begleiter in der Sprechzeile.
    sage((a.richtig ? "✓ " : "✗ ") + (hilfe ? hilfe.text : (a.richtig ? T.t("hoeren.richtig", { name: a.note.anzeige }) : T.t("hoeren.falsch", { name: a.note.anzeige }).replace(/^✗ /, ""))));
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
      // Nach der Antwort tragen alle Karten den Namen.
      b.querySelector(".hoer-name").textContent = kartenText(n, true);
      var marke = "", status = "";
      if (n.name === a.note.name) { marke = "✓"; status = a.richtig ? "ist-richtig" : "ist-loesung"; }
      else if (k === i) { marke = "✗"; status = "ist-falsch"; }
      if (status) {
        b.classList.add(status);
        // Bei der gesuchten Note Linie oder Zwischenraum hinterlegen
        if (marke === "✓") {
          b.querySelector(".hoer-system").innerHTML = window.Notensystem.zeichne(n,
            { bereich: umgebung.bereich, breite: FORM.breite, noteX: FORM.noteX, markiere: true });
        }
        b.querySelector(".hoer-marke").textContent = marke;
        b.setAttribute("aria-label", T.t(marke === "✓" ? "runde.richtig" : "runde.falsch",
          { name: T.t("hoeren.noteName", { nr: k + 1, name: n.anzeige }) }));
      }
    });
    zeigeStatus();
    zeigeBanner(a, gewaehlt);
    H.zeigeWeiter($("hoeren-weiter"));
    // Das ganze Banner zeigen, auch wenn die Seite gerade beim Spielzeug-Klavier steht
    $("hoeren-banner").scrollIntoView({ block: "nearest" });

    if (a.richtig) {
      // Kurzer Dur-Akkord als Lob, dann geht es von selbst weiter.
      var h = a.note.halbton;
      Ton.akkord([h, h + 4, h + 7]);
      timer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      // Den richtigen Ton noch einmal vorspielen, damit Ton und Note zusammenpassen.
      spieleAufgabe();
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
    sage(T.t("hoeren.weiter"));
    zeigeAufgabe();
    // „Nächste Note →“ ist ein Tipp: Der Ton darf gleich beginnen.
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
      sage(T.t("hoeren.gehoert"));
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
