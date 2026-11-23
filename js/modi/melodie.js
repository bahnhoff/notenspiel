/*
 * Modus „Spiel eine Melodie“: Im Notensystem stehen 4 bis 7 Noten aus der
 * Auswahl, darunter die gemeinsame Klaviatur (js/klaviatur.js). Die aktuelle
 * Note ist orange hinterlegt, das Kind spielt die Noten der Reihe nach. Jede
 * Taste klingt. Eine falsche Taste leuchtet kurz rot, die Note bleibt markiert,
 * es gibt keinen Abbruch; ab dem zweiten Fehler an derselben Note kommt der
 * Hinweis zur Lage dazu. Nach der letzten Note erklingt die ganze Melodie,
 * die Noten leuchten dabei nacheinander, danach steht der Name des Lieds da.
 *
 * Die Melodien kommen aus SpielLogik.neueMelodien: bekannte Kinderlied-Anfänge,
 * die in die Auswahl passen, sonst zufällige Folgen aus kleinen Schritten.
 * Für eine Taste zählt wie bei „Klaviertasten“ der Antwortmodus: im einfachen
 * Modus jede Taste mit dem richtigen Buchstaben, im genauen die Tonhöhe.
 * 5 Melodien pro Runde, Sterne nach falschen Tasten (SpielLogik.melodieSterne),
 * 10 Punkte pro Melodie plus 10 pro Stern.
 * Als Etappe der Notenreise (`umgebung.etappe`) sind es 2 Melodien; als
 * „richtig“ zählt dort jede Note, die beim ersten Versuch getroffen wurde.
 *
 * Ruhige Spielfläche: Das System wird pro Melodie einmal gezeichnet, danach
 * wechseln nur Klassen (aktuell, gespielt, leuchtet). Seine Breite ist für
 * die ganze Runde fest (Platz für 7 Noten), die Klaviatur bleibt stehen.
 * Nutzt die Ansicht #ansicht-melodie aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var N = window.Noten;
  var T = window.Texte;
  var H = window.Modi.hilfen;

  var SCHLAG = 430;           // Millisekunden pro Viertel beim Vorspielen
  var PAUSE_VOR_MELODIE = 450;
  var AUFLEUCHTEN = 380;      // so lange leuchtet eine getippte Taste

  var umgebung = null;
  var melodien = null;
  var nr = 0;                 // Nummer der Melodie in der Runde
  var wertung = null;         // SpielLogik.neueMelodieRunde: Position, Fehler, Tipps, richtige Noten
  var zustand = "spielen";    // "spielen", "hoeren" (Melodie erklingt), "fertig"
  var klaviatur = null;
  var timer = [];
  var tastenTimer = {};
  var layout = null;          // { erste, letzte, breite } für die ganze Runde

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return melodien && umgebung && umgebung.laeuft();
  }

  function spaeter(fn, ms) {
    var id = setTimeout(function () {
      timer = timer.filter(function (x) { return x !== id; });
      if (aktiv()) fn();
    }, ms);
    timer.push(id);
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    melodien = L.neueMelodien(u.noten, null, u.etappe ? L.MELODIE.melodienProEtappe : 0);
    nr = 0;
    wertung = L.neueMelodieRunde();
    // Mit Vorzeichen-Noten brauchen ♯ und ♭ vor jeder Note mehr Platz.
    var mitVorzeichen = u.noten.some(function (n) { return n.vorzeichen; });
    var abstand = mitVorzeichen ? 33 : 28;
    var erste = mitVorzeichen ? 82 : 72;
    var letzte = erste + (L.MELODIE.maxLaenge - 1) * abstand;
    layout = { erste: erste, letzte: letzte, abstand: abstand, breite: letzte + 16 };
    klaviatur = window.Klaviatur.baue($("melodie-klaviatur"), u.namen, tippe);
    u.zeigeTier($("melodie-tier"), "normal");
    u.zeigeAnsicht();
    zeigeMelodie();
  }

  function stoppe() {
    timer.forEach(clearTimeout);
    timer = [];
    Object.keys(tastenTimer).forEach(function (k) { clearTimeout(tastenTimer[k]); });
    tastenTimer = {};
    melodien = null;
    window.Klang.pausiere();
  }

  /* ---------- Anzeige ---------- */

  function melodie() { return melodien[nr]; }

  function zeigeStatus() {
    $("melodie-aufgabe").textContent = T.t("melodie.nr", { nr: nr + 1, anzahl: melodien.length });
    H.zeigeSterne($("melodie-sterne"), $("melodie-punkte"), L.melodieSterne(wertung.fehler), 3,
      (nr + (zustand === "spielen" ? 0 : 1)) * L.MELODIE.punkteProMelodie);
  }

  /** x-Mitte jeder Note: gleichmäßig verteilt und mittig im festen Bereich für 7 Noten. */
  function xPositionen(anzahl) {
    var abstand = anzahl > 1 ? Math.min((layout.letzte - layout.erste) / (anzahl - 1), layout.abstand * 1.6) : 0;
    var mitte = (layout.erste + layout.letzte) / 2;
    var xs = [];
    for (var i = 0; i < anzahl; i++) xs.push(Math.round((mitte + (i - (anzahl - 1) / 2) * abstand) * 10) / 10);
    return xs;
  }

  function zeichneSystem() {
    var m = melodie();
    var xs = xPositionen(m.noten.length);
    var schluessel = m.noten[0].schluessel;
    $("melodie-notensystem").innerHTML = window.Notensystem.zeichne(null, {
      schluessel: schluessel,
      bereich: umgebung.bereich,
      breite: layout.breite,
      weitere: m.noten.map(function (n, i) {
        return { position: n.position, x: xs[i], vorzeichen: n.vorzeichen, klasse: "melodie-note", nr: i, marke: true };
      }),
      beschreibung: T.t("melodie.systemAria", { schluessel: T.t("schluessel." + schluessel), n: m.noten.length })
    });
  }

  /** Klassen der Noten: aktuell (orange hinterlegt), gespielt (grün), leuchtet (beim Vorspielen). */
  function markiere(leuchtet) {
    var noten = $("melodie-notensystem").querySelectorAll(".melodie-note");
    Array.prototype.forEach.call(noten, function (g, i) {
      g.classList.toggle("ist-aktuell", zustand === "spielen" && i === wertung.pos);
      g.classList.toggle("ist-gespielt", zustand !== "spielen" || i < wertung.pos);
      g.classList.toggle("leuchtet", i === leuchtet);
    });
  }

  function zeigeKnoepfe(sichtbar, frei) {
    $("melodie-weiter").hidden = !sichtbar;
    $("melodie-nochmal").hidden = !sichtbar;
    $("melodie-weiter").disabled = !frei;
    $("melodie-nochmal").disabled = !frei;
  }

  function zeigeMelodie() {
    L.melodieNaechste(wertung);
    zustand = "spielen";
    klaviatur.zuruecksetzen();
    zeichneSystem();
    markiere();
    zeigeStatus();
    zeigeKnoepfe(false, false);
    $("melodie-text").textContent = T.t("melodie.start");
    umgebung.zeigeTier($("melodie-tier"), "normal");
  }

  /** Getippte Taste kurz grün oder rot, mit ihrem Namen. */
  function leuchteTaste(nr, richtig, ton) {
    var t = klaviatur.tasten[nr];
    clearTimeout(tastenTimer[nr]);
    t.el.classList.remove("ist-richtig", "ist-falsch");
    t.el.classList.add(richtig ? "ist-richtig" : "ist-falsch");
    t.el.querySelector(".taste-name").textContent = ton.anzeige;
    tastenTimer[nr] = setTimeout(function () {
      delete tastenTimer[nr];
      t.el.classList.remove("ist-richtig", "ist-falsch");
      t.el.querySelector(".taste-name").textContent = "";
    }, richtig ? AUFLEUCHTEN : AUFLEUCHTEN * 2);
  }

  /* ---------- Ablauf ---------- */

  /** `tnr` = Nummer der getippten Taste (der Ton klingt schon, siehe js/klaviatur.js). */
  function tippe(tnr) {
    if (!aktiv() || zustand !== "spielen") return;
    var m = melodie();
    var note = m.noten[wertung.pos];
    var ton = klaviatur.tastenTon(tnr, note, umgebung.antwortmodus);
    var richtig = L.istRichtig(note, N.antwortSchluessel(ton, umgebung.antwortmodus));
    leuchteTaste(tnr, richtig, ton);
    var e = L.melodieTaste(wertung, richtig, m.noten.length);
    if (!richtig) {
      $("melodie-text").textContent = L.melodieFehlerHier(wertung) >= 2
        ? T.t("melodie.falschHinweis", { getippt: ton.anzeige, hinweis: note.hinweis })
        : T.t("melodie.falsch", { getippt: ton.anzeige });
      umgebung.zeigeTier($("melodie-tier"), "oje");
      zeigeStatus();
      return;
    }
    umgebung.zeigeTier($("melodie-tier"), "froh");
    if (!e.fertig) {
      $("melodie-text").textContent = T.t("melodie.richtig", { name: note.anzeige });
      markiere();
      return;
    }
    // Letzte Note: ganze Melodie vorspielen
    zustand = "hoeren";
    $("melodie-klaviatur").classList.add("gesperrt");
    markiere();
    zeigeStatus();
    $("melodie-text").textContent = T.t("melodie.hoer");
    spaeter(function () { spieleMelodie(nachMelodie); }, PAUSE_VOR_MELODIE);
  }

  /** Spielt die Melodie im Takt der Dauern; die Noten leuchten nacheinander auf. */
  function spieleMelodie(danach) {
    var m = melodie();
    var zeit = 0;
    m.noten.forEach(function (n, i) {
      spaeter(function () {
        markiere(i);
        if (window.Klang.bereit()) window.Klang.spiele(n.halbton);
      }, zeit);
      zeit += m.dauern[i] * SCHLAG;
    });
    spaeter(function () { markiere(); danach(); }, zeit);
  }

  function nachMelodie() {
    zustand = "fertig";
    var m = melodie();
    $("melodie-text").textContent = m.lied ? T.t("melodie.lied", { lied: T.t("lied." + m.lied) }) : T.t("melodie.eigene");
    zeigeKnoepfe(true, true);
    H.zeigeWeiter($("melodie-weiter"));
  }

  function nochmalHoeren() {
    if (!aktiv() || zustand !== "fertig") return;
    window.Klang.bereit(); // aus dem Tipp heraus, damit der Ton sicher startet
    zustand = "hoeren";
    zeigeKnoepfe(true, false);
    spieleMelodie(function () {
      zustand = "fertig";
      zeigeKnoepfe(true, true);
      $("melodie-nochmal").focus({ preventScroll: true });
    });
  }

  function weiter() {
    if (!aktiv() || zustand !== "fertig") return;
    window.Klang.stoppeAlle();
    nr++;
    if (nr < melodien.length) {
      zeigeMelodie();
      return;
    }
    var anzahl = melodien.length;
    var sterne = L.melodieSterne(wertung.fehler);
    var f = wertung.fehler;
    melodien = null;
    umgebung.beende({
      gesamt: L.melodiePunkte(anzahl, sterne),
      richtige: wertung.notenRichtig,
      aufgaben: wertung.notenGesamt,
      neueSterne: sterne,
      titel: T.t("melodie.ueberschrift", { n: anzahl }),
      spruch: f === 0 ? T.t("melodie.ohneFehler") : (sterne >= 2 ? T.t("ende.toll") : T.t("ende.geschafft")),
      stimmung: "froh",
      zeilen: [
        [T.t("melodie.zeileFehler"), String(f)],
        [T.t("melodie.zeilePunkte", { n: anzahl }), String(anzahl * L.MELODIE.punkteProMelodie)],
        [T.t("ende.bonus"), (sterne * L.MELODIE.punkteProStern) + " (" + H.sterneText(sterne) + " × " + L.MELODIE.punkteProStern + ")"]
      ]
    });
  }

  $("melodie-weiter").addEventListener("click", weiter);
  $("melodie-nochmal").addEventListener("click", nochmalHoeren);

  /* Tastatur: Buchstabe tippen, wenn er auf der Klaviatur eindeutig ist (nur weiße Tasten). */
  document.addEventListener("keydown", function (ev) {
    if (!aktiv() || $("ansicht-melodie").hidden || zustand !== "spielen" || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var b = N.tasteZuBuchstabe(ev.key);
    if (!b) return;
    var treffer = klaviatur.weisseMit(b);
    if (treffer.length === 1 || (treffer.length > 1 && umgebung.antwortmodus === "einfach")) {
      ev.preventDefault();
      klaviatur.klinge(treffer[0]);
      tippe(treffer[0]);
    }
  });

  window.Modi.registriere({
    id: "melodie",
    get name() { return T.t("modus.melodie"); },
    symbol: "🎶",
    ansicht: "melodie",
    reise: true,
    starte: starte,
    stoppe: stoppe
  });
})();
