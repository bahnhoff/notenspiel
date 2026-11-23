/*
 * Gemeinsame Bausteine der Oberfläche (Plan Version 3, docs/plan-v3.md).
 * Läuft nach js/texte.js, js/tiere.js, js/klang.js und js/symbole.js, vor
 * den Modi und js/app.js.
 *
 * Fortschrittsbalken
 *   var b = Bausteine.fortschritt({ wert: 2, max: 5, text: "…", farbe: "blau" });
 *   Bausteine.setzeFortschritt(b, wert, max, text)
 *   Schmaler Balken (12 px) mit role="progressbar". `text` ist der Text für
 *   Screenreader (aria-valuetext). Farben: "gruen" (Standard), "blau",
 *   "orange". Ein schon vorhandenes Element mit der Klasse `fortschritt` und
 *   einem Kind `.fortschritt-fuellung` (wie #menue-fortschritt in index.html)
 *   lässt sich ebenso mit setzeFortschritt füllen.
 *
 * Pillen für Zähler
 *   var p = Bausteine.pille({ symbol: "stern", text: "12", art: "gold", aria: "12 Sterne", knopf: false });
 *   Bausteine.setzePille(p, text, aria)
 *   Einheitliche Pille mit gezeichnetem Symbol (js/symbole.js) und Zahl, 36 px
 *   hoch, auf dem Handy 32 px. Arten: "" (weiß), "gold", "rosa", "gruen".
 *   Mit `knopf: true` ein <button> (Tippfläche mindestens 44 px), sonst ein
 *   <span role="img"> mit `aria` als Beschriftung.
 *
 * Rückfrage
 *   Bausteine.frage({ titel, text, ja, nein }, beiJa, beiNein)
 *   Kleines Fenster (<dialog id="rueckfrage"> in index.html) mit zwei Tasten.
 *   „nein“ ist die sichere Haupttaste und hat den Fokus; Escape zählt als nein.
 *   Benutzt für „Runde beenden?“ und später für „Einstellungen zurücksetzen?“.
 *
 * Ton an oder aus
 *   var k = Bausteine.tonKnopf({ mitText: true });
 *   Knopf mit Lautsprecher (mit oder ohne Wellen). Ein Tipp schaltet Klang um;
 *   alle Ton-Knöpfe folgen dem Zustand von selbst. mitText zeigt „Ton an“ oder
 *   „Ton aus“ neben dem Symbol (Notenflug), sonst nur das Symbol (Startseite).
 *
 * Oberes Menü und Fußzeile
 *   Bausteine.menue.baue({ stand, navigiere, rundeLaeuft, pausiere, reiseAktiv })
 *   Bausteine.menue.zeige(ansicht)    nach jedem Ansichtswechsel (js/app.js)
 *   Bausteine.menue.aktualisiere()    nach Änderungen an Sternen, Noten, Tier
 *   Das Menü (#oberes-menue) erscheint auf allen Ansichten außer Startseite
 *   und Ergebnis, die Fußzeile (#fusszeile) überall außer im Notenflug.
 *   `navigiere(ziel)` mit ziel "start", "reise", "tiere" oder "einstellungen"
 *   führt die App aus. Läuft eine Runde (`rundeLaeuft()`), fragt das Menü
 *   vorher „Runde beenden?“ und ruft solange `pausiere(true)` und danach
 *   `pausiere(false)` auf.
 */
(function (root) {
  "use strict";

  var T = root.Texte;
  var t = T.t;

  function $(id) { return document.getElementById(id); }

  function element(tag, klasse, text) {
    var el = document.createElement(tag);
    if (klasse) el.className = klasse;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function symbol(id, klasse) {
    var s = element("span", klasse || "pille-symbol");
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = root.Symbole.zeichne(id);
    return s;
  }

  /* ---------- Fortschrittsbalken ---------- */

  function fortschritt(o) {
    o = o || {};
    var b = element("div", "fortschritt" + (o.farbe && o.farbe !== "gruen" ? " fortschritt-" + o.farbe : ""));
    b.setAttribute("role", "progressbar");
    b.appendChild(element("span", "fortschritt-fuellung"));
    setzeFortschritt(b, o.wert || 0, o.max || 1, o.text);
    return b;
  }

  function setzeFortschritt(b, wert, max, text) {
    max = max > 0 ? max : 1;
    wert = Math.max(0, Math.min(max, wert || 0));
    b.setAttribute("aria-valuemin", "0");
    b.setAttribute("aria-valuemax", String(max));
    b.setAttribute("aria-valuenow", String(Math.round(wert * 100) / 100));
    if (text) b.setAttribute("aria-valuetext", text); else b.removeAttribute("aria-valuetext");
    b.querySelector(".fortschritt-fuellung").style.width = (wert / max * 100) + "%";
  }

  /* ---------- Pillen ---------- */

  function pille(o) {
    o = o || {};
    var p = element(o.knopf ? "button" : "span", "pille" + (o.art ? " pille-" + o.art : ""));
    if (o.knopf) p.type = "button";
    else p.setAttribute("role", "img");
    if (o.symbol) p.appendChild(symbol(o.symbol));
    p.appendChild(element("span", "pille-zahl"));
    setzePille(p, o.text, o.aria);
    return p;
  }

  function setzePille(p, text, aria) {
    p.querySelector(".pille-zahl").textContent = text === undefined ? "" : String(text);
    if (aria) p.setAttribute("aria-label", aria);
  }

  /* ---------- Rückfrage ---------- */

  var offeneFrage = null;

  function frage(o, beiJa, beiNein) {
    var d = $("rueckfrage");
    if (!d) { if (beiJa) beiJa(); return; }
    $("rueckfrage-titel").textContent = o.titel || "";
    $("rueckfrage-text").textContent = o.text || "";
    $("rueckfrage-text").hidden = !o.text;
    $("rueckfrage-ja").textContent = o.ja || t("frage.ja");
    $("rueckfrage-nein").textContent = o.nein || t("frage.nein");
    var vorher = document.activeElement;
    offeneFrage = { ja: beiJa, nein: beiNein, vorher: vorher };
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    $("rueckfrage-nein").focus();
  }

  function schliesseFrage(ja) {
    var d = $("rueckfrage");
    var f = offeneFrage;
    offeneFrage = null;
    if (d.open) { if (d.close) d.close(); else d.removeAttribute("open"); }
    if (!f) return;
    if (!ja && f.vorher && f.vorher.focus && document.contains(f.vorher)) f.vorher.focus({ preventScroll: true });
    var fn = ja ? f.ja : f.nein;
    if (fn) fn();
  }

  function bindeFrage() {
    var d = $("rueckfrage");
    if (!d) return;
    $("rueckfrage-ja").addEventListener("click", function () { schliesseFrage(true); });
    $("rueckfrage-nein").addEventListener("click", function () { schliesseFrage(false); });
    // Escape (Ereignis „cancel“) zählt als „nein“.
    d.addEventListener("cancel", function (ev) { ev.preventDefault(); schliesseFrage(false); });
  }

  /* ---------- Ton an oder aus ---------- */

  var tonKnoepfe = [];

  function zeigeTon(k) {
    var an = root.Klang.an();
    k.innerHTML = "";
    k.appendChild(symbol(an ? "ton-an" : "ton-aus", "ton-symbol"));
    if (k.dataset.mitText) k.appendChild(element("span", "ton-text", t(an ? "ton.an" : "ton.aus")));
    k.setAttribute("aria-label", t(an ? "ton.ausschalten" : "ton.einschalten"));
    k.classList.toggle("ist-aus", !an);
  }

  function tonKnopf(o) {
    o = o || {};
    var k = element("button", "ton-knopf" + (o.mitText ? " ton-knopf-text" : ""));
    k.type = "button";
    if (o.mitText) k.dataset.mitText = "1";
    k.addEventListener("click", function () {
      var an = !root.Klang.an();
      root.Klang.setzeAn(an);
      if (an) root.Klang.bereit();
    });
    tonKnoepfe.push(k);
    zeigeTon(k);
    return k;
  }

  root.Klang.beiWechsel(function () { tonKnoepfe.forEach(zeigeTon); });

  /* ---------- Oberes Menü und Fußzeile ---------- */

  var menueOptionen = null;
  var aktuelleAnsicht = "";

  // Ansichten ohne Menü (Plan: Startseite und Ergebnisfenster)
  var OHNE_MENUE = { start: true, ergebnis: true };
  // Ansichten ohne Fußzeile (Notenflug: Scrollen lenkt im Flug ab)
  var OHNE_FUSS = { notenflug: true };
  // Ansichten, die ein Spiel zeigen: dort entfällt der runde Zoo-Knopf links
  var SPIELE = { runde: true, notenflug: true, klavier: true, setzen: true, memory: true, hoeren: true, melodie: true, ueben: true };
  // Ziel jedes Reiters, als Name der Ansicht
  var ZIEL_ANSICHT = { start: "start", reise: "reise", tiere: "tiere", einstellungen: "einstellungen" };

  function aktiverReiter(ansicht) {
    if (ansicht === "tiere") return "tiere";
    if (ansicht === "reise" || (SPIELE[ansicht] && menueOptionen.reiseAktiv && menueOptionen.reiseAktiv())) return "reise";
    if (ansicht === "rekorde" || ansicht === "einstellungen") return "";
    return "start";
  }

  function aktualisiere() {
    if (!menueOptionen) return;
    var stand = menueOptionen.stand();
    var L = root.SpielLogik;
    var n = L.naechstesTier(stand);
    setzeFortschritt($("menue-fortschritt"), n ? n.gesammelt : 1, n ? n.schritt : 1,
      n ? t("tiere.noch", { sterne: t("sterne", { n: n.fehlend }) }) : t("tiere.alle"));
    setzePille($("menue-sterne"), stand.sterne, t("menue.sterneAria", { n: stand.sterne }));
    setzePille($("menue-noten"), stand.notenGesamt, t("menue.notenAria", { n: stand.notenGesamt }));
    $("menue-heim").innerHTML = root.Tiere.kopf(stand.tier, "normal", "");
    var reiter = aktiverReiter(aktuelleAnsicht);
    Array.prototype.forEach.call(document.querySelectorAll("#oberes-menue .menue-reiter-knopf"), function (b) {
      if (b.dataset.ziel === reiter) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    $("fuss-zeile").textContent = t("fuss.zeile", { version: menueOptionen.version || "" });
  }

  function zeige(ansicht) {
    aktuelleAnsicht = ansicht;
    var menue = $("oberes-menue");
    menue.hidden = !!OHNE_MENUE[ansicht];
    menue.classList.toggle("im-spiel", !!SPIELE[ansicht]);
    $("fusszeile").hidden = !!OHNE_FUSS[ansicht];
    document.body.classList.toggle("mit-menue", !menue.hidden);
    aktualisiere();
  }

  function waehle(ziel) {
    if (!menueOptionen) return;
    // Ein Tipp auf das Ziel, das schon offen ist, ändert nichts.
    if (ZIEL_ANSICHT[ziel] === aktuelleAnsicht) return;
    if (!menueOptionen.rundeLaeuft()) { menueOptionen.navigiere(ziel); return; }
    if (menueOptionen.pausiere) menueOptionen.pausiere(true);
    frage({ titel: t("frage.rundeTitel"), text: t("frage.rundeText"), ja: t("frage.rundeJa"), nein: t("frage.rundeNein") },
      function () { menueOptionen.navigiere(ziel); },
      function () { if (menueOptionen.pausiere) menueOptionen.pausiere(false); });
  }

  function baue(o) {
    menueOptionen = o;
    Array.prototype.forEach.call(document.querySelectorAll("#oberes-menue [data-ziel]"), function (b) {
      b.addEventListener("click", function () { waehle(b.dataset.ziel); });
    });
    bindeFrage();
  }

  root.Bausteine = {
    fortschritt: fortschritt,
    setzeFortschritt: setzeFortschritt,
    pille: pille,
    setzePille: setzePille,
    frage: frage,
    tonKnopf: tonKnopf,
    menue: { baue: baue, zeige: zeige, aktualisiere: aktualisiere }
  };
})(this);
