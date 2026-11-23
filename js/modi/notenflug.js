/*
 * Modus „Notenflug“: Eine Note gleitet von rechts nach links über das
 * Notensystem auf die Rakete mit dem Begleiter zu. Das Kind tippt den Namen,
 * bevor die Note die Rakete erreicht. Zu spät oder falsch kostet eines von
 * drei Herzen. Wellen mit je 10 Noten, jede Welle etwa 15 % schneller.
 * Punkte pro Note = Welle × Anzahl der gewählten Noten × Combo (x1 bis x5).
 *
 * Aufbau nach dem Stitch-Entwurf (docs/plan-v3.md, Abschnitt Notenflug):
 * Kopfkarte mit Welle und Tempostufe, Combo, Punkten und Herzen; Balken für
 * die Flugzeit; Bühne mit Schildern („Note 3 von 10“ beziehungsweise nach
 * einem Fehler die Lage, rechts die Schlüssel-Bahn), Rakete, leuchtender
 * Note, „Fang mich!“ (nur Welle 1) und Sprechzeile; Hinweiszeile mit Ton an
 * oder aus; Buchstabentasten, die ihren Ton spielen.
 * Nach einer richtigen Antwort macht die Rakete einen Satz, und die nächste
 * Note startet sofort. Nur nach einem Fehler oder „zu spät“ hält das Spiel
 * an (Lösung, Hinweis, Merkhilfe, „Weiter“ unter den Tasten).
 * Darunter (Paket 7): Rückmeldung als Karte, Klavier-Lotse (Klaviatur.baue,
 * auf- und zuklappbar, gemerkt in flugKlaviatur), Merkspruch-Karte
 * (umgebung.merksprueche, Tipp wechselt Linien und Zwischenräume), Tempo-Knopf
 * (L.naechstesFlugTempo, gilt ab der nächsten Note) und Pause (Knopf, Leertaste,
 * Escape, verborgener Tab; Fläche #flug-pause-flaeche mit „Weiterfliegen“).
 * Buchstabentasten antworten über Modi.hilfen.tastenEingabe.
 * Regeln und Wertung: js/spiel-logik.js (NOTENFLUG, flugAntwort, flugTrefferPunkte).
 * Nutzt die Ansicht #ansicht-notenflug aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var T = window.Texte;
  var t = T.t;
  var N = window.Noten;
  var H = window.Modi.hilfen;
  var B = window.Bausteine;

  // Geometrie im Koordinatensystem von js/notensystem.js: breites System für die Flugbahn
  var BREITE = 200;           // Ende der Linien rechts
  var NOTE_X = 150;           // x-Mitte der Note ohne Versatz
  var START_DX = 36;          // Startversatz der Note nach rechts
  var RAKETE_X = 76;          // Mitte der Rakete, direkt vor dem Schlüssel (auch vor den Punkten des Bassschlüssels)
  var RAKETE_Y = 52;          // Mittellinie
  var ZIEL_DX = RAKETE_X + 22 - NOTE_X; // hier berührt der Notenkopf die Nase der Rakete
  var PAUSE_VOR_START = 1400; // Millisekunden
  var PAUSE_NACH_RICHTIG = 300;  // Funkeln und Raketensatz, ohne Halt
  var LEVEL_EINBLENDUNG = 1000;  // „Welle 3!“
  var PAUSE_NACH_FEHLER = 4500;
  var KNAPP = 0.25;           // unter 25 % Restzeit wird der Balken orange

  var umgebung = null;
  var flug = null;
  var zustand = null;   // aktuelle Note: { note, vergangen, dauer, offen, dx, level, nr }
  var knoepfe = [];
  var timer = null;
  var raf = null;
  var letzteZeit = null;
  var pausiert = false;       // Flug steht, weil der Tab versteckt oder die Runde angehalten ist
  var angehalten = false;     // angehalten über pausiere(true), zum Beispiel Fenster „Runde beenden?“
  var wartetAufWeiter = null; // Funktion, die nach „Weiter“ läuft
  var tasten = null;          // Buchstabentasten (Modi.hilfen.tastenEingabe)
  var sprech = null;          // Sprechzeile in der Bühne
  var fangMass = null;        // Umrechnung SVG → Bühne für „Fang mich!“: { links, skala }
  var nutzerPause = false;    // Pause über den Knopf, Leertaste, Escape oder versteckten Tab (mit Fläche)
  var klaviatur = null;       // Klavier-Lotse (js/klaviatur.js)
  var lotseAntwort = null;    // { nr, ton } der Lotse-Taste, mit der gerade geantwortet wurde
  var merkRaeume = false;     // Merkspruch: false Linien, true Zwischenräume
  var leertasteGefangen = false;

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return flug && umgebung && umgebung.laeuft();
  }

  // Ton-Knopf in der Hinweiszeile („Ton an“ oder „Ton aus“)
  $("flug-ton").replaceWith(B.tonKnopf({ mitText: true }));

  function starte(u) {
    stoppe();
    umgebung = u;
    flug = L.neuerFlug(u.noten.length, u.flugTempo);
    nutzerPause = false;
    knoepfe = H.antwortKnoepfe($("flug-antworten"), u.antworten, beantworte);
    tasten = H.tastenEingabe({
      antworten: function () { return umgebung.antworten; },
      offen: function () { return aktiv() && !!zustand && zustand.offen && !angehalten && !nutzerPause && !$("ansicht-notenflug").hidden; },
      beiAntwort: beantworte,
      anzeige: $("flug-tasten"),
      tipp: "flug.tastenTipp",
      tippTouch: "flug.tastenTippTouch",
      // Bereich der Antworten, zum Beispiel „C bis G“ (wie auf der Startseite)
      tippWerte: function () {
        var a = umgebung.antworten;
        return { von: a[0].anzeige, bis: a[a.length - 1].anzeige };
      }
    });
    if (!sprech) {
      sprech = B.sprechZeile({ tier: u.tier, text: "" });
      $("flug-sprech").appendChild(sprech);
    }
    sage(t("flug.start"));
    baueLotse(u);
    zeigeTempo();
    zeigePause();
    zeigeMerkspruch(u.noten[0] && u.noten[0].schluessel);
    $("flug-level-einblendung").hidden = true;
    u.zeigeAnsicht();
    zeigeRueckmeldung(false);
    zeigeStatus();
    zeigeZeit(1);
    zeigeSchilder(null);
    zeichneSystem(null);
    sperreKnoepfe(true);
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
    angehalten = false;
    nutzerPause = false;
    wartetAufWeiter = null;
    lotseAntwort = null;
    if (tasten) tasten.zuruecksetzen();
    zeigePause();
  }

  function sage(text) {
    B.setzeSprechZeile(sprech, umgebung.tier, text);
  }

  /* ---------- Kopfkarte: Welle, Combo, Punkte, Herzen ---------- */

  function zeigeStatus(comboHuepft) {
    var level = zustand ? zustand.level : flug.level;
    $("flug-level").textContent = t("flug.level", { level: level, stufe: t(L.flugTempoStufe(level)) });

    var combo = $("flug-combo");
    B.setzePille(combo, t("flug.combo", { n: flug.combo }), t("flug.comboAria", { n: flug.serie }));
    combo.classList.toggle("ist-voll", flug.combo >= L.NOTENFLUG.maxCombo);
    if (comboHuepft) {
      combo.classList.remove("huepft");
      void combo.offsetWidth; // Animation neu starten
      combo.classList.add("huepft");
    }

    $("flug-punkte").textContent = H.punkteText(flug.punkte);

    var leben = L.NOTENFLUG.leben;
    var rest = Math.max(0, leben - flug.fehler);
    var herzen = $("flug-herzen");
    herzen.innerHTML = "";
    for (var i = 0; i < leben; i++) {
      var h = document.createElement("span");
      h.className = "flug-herz" + (i < rest ? "" : " ist-leer");
      h.innerHTML = window.Symbole.zeichne(i < rest ? "herz" : "herz-leer");
      herzen.appendChild(h);
    }
    herzen.setAttribute("aria-label", t("flug.herzenAria", { n: rest }));
  }

  /** Balken für die Flugzeit: `rest` = Anteil der verbleibenden Zeit (1 bis 0). */
  function zeigeZeit(rest) {
    var b = $("flug-zeit");
    B.setzeFortschritt(b, Math.round(rest * 100), 100);
    b.classList.toggle("fortschritt-orange", rest < KNAPP);
    b.classList.toggle("fortschritt-blau", rest >= KNAPP);
  }

  /* ---------- Bühne ---------- */

  /** Schilder: links „Note 3 von 10“ oder nach einem Fehler die Lage, rechts die Schlüssel-Bahn. */
  function zeigeSchilder(note, mitLage) {
    var nr = zustand ? zustand.nr : flug.imLevel + 1;
    $("flug-ziel-text").textContent = mitLage && note
      ? t("flug.ziel", { lage: lageText(note.position), name: note.anzeige })
      : t("flug.schildNote", { nr: nr, anzahl: L.NOTENFLUG.notenProLevel });
    $("flug-schild-ziel").classList.toggle("zeigt-lage", !!mitLage);
    var schluessel = (note && note.schluessel) || (umgebung.noten[0] && umgebung.noten[0].schluessel) || "violin";
    var bahn = $("flug-schild-bahn");
    if (bahn.dataset.schluessel !== schluessel) {
      $("flug-bahn-symbol").innerHTML = window.Notensystem.schluesselSymbol(schluessel);
      bahn.dataset.schluessel = schluessel;
    }
    $("flug-bahn-text").textContent = t("flug.bahn." + schluessel);
  }

  /** Kurze Lage einer Position (0 = unterste Linie), zum Beispiel „2. Linie“ oder „1. Hilfslinie unten“. */
  function lageText(p) {
    var ord = T.liste("flug.ord");
    function o(n) { return ord[n - 1] || n + "."; }
    if (p >= 0 && p <= 8) return t(p % 2 === 0 ? "flug.lage.linie" : "flug.lage.raum", { ord: o(p % 2 === 0 ? p / 2 + 1 : (p + 1) / 2) });
    if (p === -1) return t("flug.lage.unter");
    if (p === 9) return t("flug.lage.ueber");
    if (p < 0) {
      return p % 2 === 0 ? t("flug.lage.hilfUnten", { ord: o(-p / 2) }) : t("flug.lage.unterHilf", { ord: o((-p - 1) / 2) });
    }
    return p % 2 === 0 ? t("flug.lage.hilfOben", { ord: o((p - 8) / 2) }) : t("flug.lage.ueberHilf", { ord: o((p - 9) / 2) });
  }

  /** Rakete mit dem Kopf des Begleiters im Fenster, Nase nach rechts zur Note. */
  function rakete() {
    var kopf = window.Tiere.kopf(umgebung.tier, "normal", "")
      .replace("<svg ", '<svg x="-6.4" y="-6.2" width="11" height="11" ');
    return '<defs><radialGradient id="flug-schein-verlauf">' +
        '<stop offset="0" stop-color="#ffd54a" stop-opacity="0.9"/><stop offset="0.6" stop-color="#ffe58a" stop-opacity="0.45"/>' +
        '<stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>' +
      '<g class="flug-rakete" transform="translate(' + RAKETE_X + " " + RAKETE_Y + ')" aria-hidden="true"><g class="flug-rakete-innen">' +
        '<path class="rakete-flamme" d="M-15 -3.2 L-23 0 L-15 3.2 Z"/>' +
        '<path class="rakete-fluegel" d="M-8 -5.5 L-14 -11 L-3 -5.5 Z M-8 5.5 L-14 11 L-3 5.5 Z"/>' +
        '<path class="rakete-rumpf" d="M-15 -6.5 L5 -6.5 C12 -6.5 18 -3 21 0 C18 3 12 6.5 5 6.5 L-15 6.5 Z"/>' +
        '<path class="rakete-nase" d="M10 -5.2 C15 -3.8 18.5 -1.8 21 0 C18.5 1.8 15 3.8 10 5.2 Z"/>' +
        '<circle class="rakete-fenster" cx="-1" cy="-0.7" r="6"/>' + kopf +
      "</g></g>";
  }

  function zeichneSystem(note, beschriftung) {
    var box = $("flug-notensystem");
    // Nach der Antwort (mit Beschriftung) Linie oder Zwischenraum hinterlegen; namensPlatz hält die Größe fest.
    var svg = window.Notensystem.zeichne(note, { bereich: umgebung.bereich, beschriftung: beschriftung,
      markiere: !!beschriftung, namensPlatz: H.namensPlatz(umgebung), breite: BREITE, noteX: NOTE_X });
    if (note) {
      // Weicher Schein hinter dem fliegenden Notenkopf (nicht nach der Antwort)
      var schein = beschriftung ? "" : '<circle class="note-schein" cx="' + NOTE_X + '" cy="' + (72 - note.position * 5) +
        '" r="16" fill="url(#flug-schein-verlauf)"/>';
      svg = svg.replace('<g class="note-gruppe">', rakete() + '<g class="note-gruppe">' + schein);
    } else {
      svg = svg.replace("</svg>", rakete() + "</svg>");
    }
    box.innerHTML = svg;
    $("flug-buehne").classList.remove("ist-richtig", "ist-falsch");
    messeFang();
  }

  /** Merkt sich, wo das SVG in der Bühne liegt, damit „Fang mich!“ unter der Note mitfliegt. */
  function messeFang() {
    var svg = $("flug-notensystem").querySelector("svg");
    var buehne = $("flug-buehne").getBoundingClientRect();
    if (!svg || !buehne.width) { fangMass = null; return; }
    var r = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var skala = Math.min(r.width / vb.width, r.height / vb.height);
    var fang = $("flug-fang");
    var zeile = fang.parentNode.getBoundingClientRect();
    fangMass = { links: r.left - zeile.left + (r.width - vb.width * skala) / 2 - vb.x * skala, skala: skala,
      breite: fang.offsetWidth, max: zeile.width };
  }

  function setzeVersatz(dx) {
    var g = $("flug-notensystem").querySelector(".note-gruppe");
    if (g) g.setAttribute("transform", "translate(" + dx.toFixed(2) + " 0)");
    var fang = $("flug-fang");
    if (!fang.hidden && fangMass) {
      // Mitte unter dem Notenkopf, aber nie über den Rand der Bühne hinaus
      var x = fangMass.links + (NOTE_X + dx) * fangMass.skala - fangMass.breite / 2;
      x = Math.max(0, Math.min(fangMass.max - fangMass.breite, x));
      fang.style.transform = "translateX(" + x.toFixed(1) + "px)";
    }
  }

  function raketeAnimiere(klasse) {
    var r = $("flug-notensystem").querySelector(".flug-rakete-innen");
    if (!r) return;
    r.classList.remove("satz", "wackeln");
    void r.getBoundingClientRect();
    r.classList.add(klasse);
  }

  function sperreKnoepfe(gesperrt) {
    $("flug-antworten").classList.toggle("gesperrt", gesperrt);
    knoepfe.forEach(function (b) { b.setAttribute("aria-disabled", gesperrt ? "true" : "false"); });
  }

  /** Rückmeldung nach einem Fehler unter den Tasten ein- oder ausblenden. */
  function zeigeRueckmeldung(an) {
    $("flug-rueckmeldung").hidden = !an;
    if (!an) {
      $("flug-merkhilfe").hidden = true;
      $("flug-weiter").hidden = true;
      $("flug-text").textContent = "";
    }
  }

  /* ---------- Ablauf ---------- */

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
    $("flug-level-einblendung").hidden = true;
    tasten.zuruecksetzen();
    var note = waehleNote();
    var nachFehler = !$("flug-rueckmeldung").hidden;
    zustand = { note: note, vergangen: 0, dauer: L.flugzeit(flug.level, flug.tempo), offen: true, dx: START_DX,
      level: flug.level, nr: flug.imLevel + 1 };
    zeigeRueckmeldung(false);
    zeigeStatus();
    zeigeZeit(1);
    zeigeSchilder(note, false);
    // „Fang mich!“ nur in Welle 1, danach kennt das Kind das Spiel
    $("flug-fang").hidden = zustand.level !== 1;
    zeichneSystem(note);
    setzeVersatz(START_DX);
    knoepfe.forEach(function (b) {
      b.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      H.markiereAntwort(b);
    });
    sperreKnoepfe(false);
    setzeLotseZurueck();
    zeigeMerkspruch(note.schluessel);
    if (nachFehler || zustand.nr === 1) sage(t("flug.schnell"));
    letzteZeit = null;
    if (!document.hidden && !angehalten && !nutzerPause) raf = requestAnimationFrame(schritt);
    else pausiert = true;
  }

  function schritt(zeit) {
    raf = null;
    if (!aktiv() || !zustand || !zustand.offen) return;
    // Große Sprünge (zum Beispiel nach einer Pause des Browsers) zählen nicht.
    var dt = letzteZeit === null ? 0 : Math.min(zeit - letzteZeit, 100);
    letzteZeit = zeit;
    zustand.vergangen += dt;
    var anteil = Math.min(1, zustand.vergangen / zustand.dauer);
    zustand.dx = START_DX + (ZIEL_DX - START_DX) * anteil;
    setzeVersatz(zustand.dx);
    zeigeZeit(1 - anteil);
    if (anteil >= 1) {
      werte(null);
      return;
    }
    raf = requestAnimationFrame(schritt);
  }

  /* Pause bei verstecktem Tab oder über pausiere(true), danach geht der Flug an derselben Stelle weiter. */
  function halteAn() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    pausiert = true;
  }

  function laufWeiter() {
    if (!pausiert || document.hidden || angehalten || nutzerPause) return;
    pausiert = false;
    if (aktiv() && zustand && zustand.offen) {
      letzteZeit = null;
      raf = requestAnimationFrame(schritt);
    }
  }

  // Versteckter Tab: dieselbe Pause wie über den Knopf, weiter geht es mit „Weiterfliegen“.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (aktiv() && !$("ansicht-notenflug").hidden) setzePause(true); else halteAn();
    } else {
      laufWeiter();
    }
  });

  window.addEventListener("resize", function () { if (aktiv()) messeFang(); });

  /** Hält den Flug an (true) oder lässt ihn weiterlaufen (false), siehe js/modi.js. */
  function pausiere(an) {
    angehalten = !!an;
    if (angehalten) halteAn(); else laufWeiter();
  }

  /** Ton der getippten Antwort: genau die gewählte Note, im Modus „Einfach“ der Buchstabe in der Oktave der Note. */
  function spieleAntwort(name, note) {
    if (!window.Klang.an()) return;
    var a = umgebung.antworten.filter(function (x) { return x.name === name; })[0];
    if (!a) return;
    var stufe = typeof a.stufe === "number" ? a.stufe : Math.floor(note.stufe / 7) * 7 + N.BUCHSTABEN.indexOf(a.buchstabe);
    var ton = N.ton(stufe, a.vorzeichen || 0);
    if (ton && window.Klang.bereit()) window.Klang.spiele(ton.halbton);
  }

  function beantworte(name) {
    if (!aktiv() || !zustand || !zustand.offen || angehalten || nutzerPause) return; // eine Antwort pro Note
    spieleAntwort(name, zustand.note);
    lotseAntwort = null;
    werte(name);
  }

  /* ---------- Klavier-Lotse ---------- */

  function lotseOffen() {
    var gemerkt = umgebung ? umgebung.flugKlaviatur : null;
    if (gemerkt === true || gemerkt === false) return gemerkt;
    return !!(window.matchMedia && window.matchMedia("(min-width: 768px)").matches);
  }

  function zeigeLotseOffen(offen) {
    var knopf = $("flug-lotse-knopf");
    $("flug-klaviatur").hidden = !offen;
    $("flug-lotse").classList.toggle("ist-zu", !offen);
    knopf.setAttribute("aria-expanded", offen ? "true" : "false");
    knopf.textContent = t(offen ? "flug.lotseVerbergen" : "flug.lotseZeigen");
  }

  function baueLotse(u) {
    klaviatur = window.Klaviatur.baue($("flug-klaviatur"), u.namen, lotseTipp);
    setzeLotseZurueck();
    // Tonumfang je Schlüssel, zum Beispiel „Violinschlüssel: c¹ bis h¹“
    $("flug-lotse-bereich").textContent = u.bereichText || "";
    zeigeLotseOffen(lotseOffen());
  }

  /** Markierungen entfernen und die weißen Tasten mit ihrem Buchstaben beschriften. */
  function setzeLotseZurueck() {
    if (!klaviatur) return;
    klaviatur.zuruecksetzen();
    klaviatur.tasten.forEach(function (tt) {
      if (tt.art === "weiss") tt.el.querySelector(".taste-name").textContent = N.buchstabenAnzeige(tt.buchstabe, 0);
    });
  }

  /** Tipp auf eine Lotse-Taste (der Ton klingt schon, siehe js/klaviatur.js). */
  function lotseTipp(nr) {
    if (!aktiv() || !zustand || !zustand.offen || angehalten || nutzerPause) return;
    var taste = klaviatur.tasten[nr];
    // Schwarze Tasten antworten nur, wenn Noten mit Vorzeichen gewählt sind; sonst klingen sie nur.
    if (taste.art === "schwarz" && !umgebung.noten.some(function (n) { return n.vorzeichen; })) return;
    var ton = klaviatur.tastenTon(nr, zustand.note, umgebung.antwortmodus);
    lotseAntwort = { nr: nr, ton: ton };
    werte(N.antwortSchluessel(ton, umgebung.antwortmodus));
  }

  /** Nach der Antwort: getippte Lotse-Taste markieren, nach einem Fehler leuchtet die richtige Taste. */
  function zeigeLotseAntwort(richtig, note) {
    if (!klaviatur) return;
    if (lotseAntwort) {
      klaviatur.zeigeAntwort(lotseAntwort.nr, { richtig: richtig, note: note }, lotseAntwort.ton);
      return;
    }
    if (richtig) return;
    $("flug-klaviatur").classList.add("gesperrt");
    klaviatur.tasten.forEach(function (tt) {
      if (tt.halbton !== note.halbton) return;
      tt.el.classList.add("ist-loesung");
      tt.el.querySelector(".taste-marke").textContent = "✓";
      tt.el.querySelector(".taste-name").textContent = note.anzeige;
    });
  }

  $("flug-lotse-knopf").addEventListener("click", function () {
    var offen = $("flug-klaviatur").hidden;
    zeigeLotseOffen(offen);
    if (umgebung) { umgebung.flugKlaviatur = offen; umgebung.merkeFlug("flugKlaviatur", offen); }
  });

  /* ---------- Merkspruch, Tempo und Pause ---------- */

  function zeigeMerkspruch(schluessel) {
    schluessel = schluessel === "bass" ? "bass" : "violin";
    $("flug-merk-titel").textContent = t("flug.merk.titel." + schluessel);
    var alle = (umgebung && umgebung.merksprueche) || {};
    var art = merkRaeume ? "raeume" : "linien";
    var eintrag = alle[schluessel] && alle[schluessel][art];
    var text = eintrag ? (eintrag[T.sprache()] || eintrag.de || "") : "";
    var knopf = $("flug-merk-spruch");
    knopf.innerHTML = "";
    knopf.appendChild(document.createTextNode(t(merkRaeume ? "flug.merk.raeume" : "flug.merk.linien") + ": "));
    // *E*s → fettes E: die Anfangsbuchstaben ergeben die Noten
    text.split(/(\*[^*]+\*)/).forEach(function (teil) {
      if (!teil) return;
      if (teil.charAt(0) === "*" && teil.length > 2) {
        var b = document.createElement("strong");
        b.textContent = teil.slice(1, -1);
        knopf.appendChild(b);
      } else {
        knopf.appendChild(document.createTextNode(teil));
      }
    });
    knopf.setAttribute("aria-label", knopf.textContent + ". " + t("flug.merk.tippen"));
    knopf.title = t("flug.merk.tippen");
  }

  $("flug-merk-spruch").addEventListener("click", function () {
    merkRaeume = !merkRaeume;
    zeigeMerkspruch(zustand ? zustand.note.schluessel : (umgebung && umgebung.noten[0] && umgebung.noten[0].schluessel));
  });

  /** Tempofaktor als Text: deutsch „0,75“ und „1,0“, englisch „0.75“ und „1.0“. */
  function tempoText(tempo) {
    var s = tempo % 1 === 0 ? tempo.toFixed(1) : String(tempo);
    return T.sprache() === "en" ? s : s.replace(".", ",");
  }

  function zeigeTempo() {
    var tempo = flug ? flug.tempo : 1;
    $("flug-tempo-text").textContent = tempoText(tempo) + "x";
    $("flug-tempo").setAttribute("aria-label", t("flug.tempoAria", { wert: tempoText(tempo) }));
  }

  // Tempo: 0,5x → 0,75x → 1,0x → 1,25x; gilt ab der nächsten Note
  $("flug-tempo").addEventListener("click", function () {
    if (!flug) return;
    flug.tempo = L.naechstesFlugTempo(flug.tempo);
    if (umgebung) { umgebung.flugTempo = flug.tempo; umgebung.merkeFlug("flugTempo", flug.tempo); }
    zeigeTempo();
  });

  function zeigePause() {
    $("flug-pause-flaeche").hidden = !nutzerPause;
    $("flug-buehne").classList.toggle("ist-pause", nutzerPause);
    Array.prototype.forEach.call(document.querySelectorAll(".flug-pause-knopf"), function (k) {
      k.querySelector(".flug-knopf-symbol").innerHTML = window.Symbole.zeichne(nutzerPause ? "weiter" : "pause");
      var text = k.querySelector(".flug-pause-text");
      if (text) text.textContent = t(nutzerPause ? "flug.weiter" : "flug.pause");
      k.setAttribute("aria-label", t(nutzerPause ? "flug.weiterAria" : "flug.pauseAria"));
      k.setAttribute("aria-pressed", nutzerPause ? "true" : "false");
    });
  }

  /** Pause an oder aus. Pausen kosten nichts und zählen nicht. */
  function setzePause(an) {
    if (!aktiv()) return;
    an = !!an;
    if (an === nutzerPause) return;
    nutzerPause = an;
    zeigePause();
    if (an) {
      halteAn();
      $("flug-weiterfliegen").focus({ preventScroll: true });
    } else {
      laufWeiter();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll(".flug-pause-knopf"), function (k) {
    k.addEventListener("click", function () { setzePause(!nutzerPause); });
  });
  $("flug-weiterfliegen").addEventListener("click", function () { setzePause(false); });

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
    tasten.zuruecksetzen();

    knoepfe.forEach(function (b) {
      if (b.dataset.name === note.antwort) H.markiereAntwort(b, richtig ? "ist-richtig" : "ist-loesung", true);
      else if (b.dataset.name === name) H.markiereAntwort(b, "ist-falsch", false);
    });
    zeigeLotseAntwort(richtig, note);
    lotseAntwort = null;

    var danach = e.beendet ? beende : (e.levelGeschafft ? zeigeLevel : naechsteNote);

    // Richtig: kein Halt. Die Note funkelt, die Rakete macht einen Satz, gleich kommt die nächste.
    if (richtig) {
      $("flug-notensystem").querySelector(".note-gruppe").classList.add("funkelt");
      $("flug-buehne").classList.add("ist-richtig");
      raketeAnimiere("satz");
      zeigeStatus(true);
      var lob = T.liste("rueckmeldung.lob", { name: note.anzeige });
      sage(lob[Math.floor(Math.random() * lob.length)]);
      timer = setTimeout(danach, PAUSE_NACH_RICHTIG);
      return;
    }

    // Lösung an der Stelle zeigen, an der die Note gerade ist (Name passt rechts daneben).
    zeichneSystem(note, note.anzeige);
    setzeVersatz(Math.min(0, zustand.dx));
    $("flug-buehne").classList.add("ist-falsch");
    $("flug-fang").hidden = true;
    sage(t("flug.sprechFehler"));
    raketeAnimiere("wackeln");
    zeigeStatus();
    zeigeSchilder(note, true);
    zeigeRueckmeldung(true);
    H.zeigeMerkhilfe(umgebung, note, "flug-merkhilfe");

    var werteText = { name: note.anzeige, hinweis: note.hinweis };
    var text = t(name === null ? "flug.zuSpaet" : "flug.falsch", werteText);
    if (e.levelGeschafft) text += t("flug.levelGeschafft", { level: zustand.level });
    if (e.beendet) text += t("flug.dritterFehler");
    $("flug-text").textContent = text;
    umgebung.zeigeTier($("flug-tier"), "oje");

    wartetAufWeiter = danach;
    var weiter = $("flug-weiter");
    weiter.textContent = e.beendet ? t("flug.zumErgebnis") : t("runde.weiter");
    H.zeigeWeiter(weiter);
    if (!e.beendet) timer = setTimeout(weiterNachFehler, PAUSE_NACH_FEHLER);
  }

  /** Kurze Einblendung „Welle 3!“ ohne Knopf, danach die erste Note der neuen Welle. */
  function zeigeLevel() {
    clearTimeout(timer);
    wartetAufWeiter = null;
    if (!aktiv()) return;
    $("flug-weiter").hidden = true;
    var el = $("flug-level-einblendung");
    el.textContent = t("flug.levelEinblendung", { level: flug.level });
    el.hidden = false;
    timer = setTimeout(naechsteNote, LEVEL_EINBLENDUNG);
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
      richtige: f.richtige,
      art: "flug",
      wellen: f.level,
      besteCombo: f.besteCombo,
      titel: t("flug.ueberschrift", { n: f.richtige }),
      spruch: f.levelGeschafft >= 3 ? t("flug.wow") : (f.levelGeschafft > 0 ? t("flug.toll") : t("ende.nochmal")),
      stimmung: f.levelGeschafft > 0 ? "froh" : "normal",
      zeilen: [
        [t("flug.geschaffte"), String(f.levelGeschafft)],
        // Rechnung zur erreichten Welle, zum Beispiel „3 Noten × Welle 2 × Tempo 0,75 = 5, dazu die Combo“
        [t("flug.proNote"), t("flug.rechnung", { noten: f.notenAnzahl, level: f.level, tempo: tempoText(f.tempo),
          punkte: Math.max(1, Math.round(L.flugPunkteProNote(f) * f.tempo)) })]
      ]
    });
  }

  $("flug-weiter").addEventListener("click", weiterNachFehler);

  /* Tastatur: Buchstabe (mit Shift ♯ oder ♭, im genauen Modus mit Oktavziffer), siehe Modi.hilfen.tastenEingabe. */
  // Leertaste oder Escape schalten die Pause um (nicht, solange eine Rückfrage offen ist).
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-notenflug").hidden) return;
    if ((ev.key === " " || ev.key === "Escape") && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
      if (document.querySelector("dialog[open]")) return;
      ev.preventDefault();
      leertasteGefangen = ev.key === " ";
      if (!ev.repeat) setzePause(!nutzerPause);
      return;
    }
    if (tasten) tasten.taste(ev);
  });
  // Die Leertaste soll keinen fokussierten Knopf auslösen, wenn sie die Pause umschaltet.
  document.addEventListener("keyup", function (ev) {
    if (ev.key === " " && leertasteGefangen) { ev.preventDefault(); leertasteGefangen = false; }
  });

  window.Modi.registriere({
    id: "notenflug",
    get name() { return t("modus.notenflug"); },
    symbol: "🚀",
    ansicht: "notenflug",
    starte: starte,
    stoppe: stoppe,
    pausiere: pausiere
  });
})();
