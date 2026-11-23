/*
 * Modus „Noten-Memory“: Paare aus Notenkarte und Namenskarte.
 * Vor dem Spiel wählt das Kind die Stufe mit zwei großen Knöpfen, Antippen
 * startet sofort. Die letzte Wahl merkt sich der Spielstand (memoryStufe)
 * und ist beim nächsten Mal vorausgewählt.
 *   Normal: 6 Paare, Raster 3 × 4 (breit 4 × 3). Hat der gewählte Bereich
 *           weniger als 6 Noten, gibt es entsprechend weniger Paare.
 *   Schwer: 10 Paare, Raster 4 × 5 (breit 5 × 4). Braucht 10 verschiedene
 *           Namenskarten, sonst ist der Knopf ausgegraut mit Hinweis.
 * Ein Zug = zwei Karten aufdecken. Sterne und Punkte je Stufe stehen in
 * js/spiel-logik.js (MEMORY, memorySterne, memoryPunkte). Schwere Runden
 * kommen mit `variante: "schwer"` in die gemeinsame Rekordliste.
 * Namenskarten zeigen den Antwortschlüssel (note.antwort): im einfachen Modus
 * nur den Buchstaben („F“, „Fis“), dann kommt jeder höchstens einmal vor.
 * Nutzt die Ansicht #ansicht-memory aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var T = window.Texte;
  var H = window.Modi.hilfen;
  var ZUDECKEN_NACH = 1300;  // Millisekunden, bis ein falsches Paar wieder zugeht
  var ENDE_NACH = 1200;

  var umgebung = null;
  var spiel = null;   // { stufe, karten, offen, paare, gefunden, zuege, fertig }
  var timer = null;
  var wahlOffen = false;

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return spiel && umgebung && umgebung.laeuft();
  }

  /**
   * Noten mit verschiedenen Namenskarten (bei beiden Schlüsseln gibt es c¹
   * zweimal, im einfachen Modus zählt nur der Buchstabe), damit Paare eindeutig sind.
   */
  function eindeutige(noten) {
    var namen = {};
    return H.mische(noten).filter(function (n) {
      if (namen[n.antwort]) return false;
      namen[n.antwort] = true;
      return true;
    });
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    zeigeWahl();
    u.zeigeAnsicht();
  }

  /** Wahl der Stufe vor dem Spiel. Die zuletzt gewählte ist hervorgehoben. */
  function zeigeWahl() {
    var schwerGeht = eindeutige(umgebung.noten).length >= L.MEMORY.schwer.paare;
    var vorwahl = umgebung.memoryStufe === "schwer" && schwerGeht ? "schwer" : "normal";
    ["normal", "schwer"].forEach(function (stufe) {
      var b = $("memory-stufe-" + stufe);
      var regel = L.MEMORY[stufe];
      var an = stufe === vorwahl;
      b.classList.toggle("knopf-haupt", an);
      b.classList.toggle("knopf-neben", !an);
      b.classList.toggle("ist-an", an);
      b.querySelector(".stufe-info").textContent = T.t("memory.paareInfo", { n: regel.paare });
      var raster = b.querySelector(".stufe-raster");
      raster.innerHTML = new Array(regel.paare * 2 + 1).join("<i></i>");
      raster.style.setProperty("--spalten", stufe === "schwer" ? 4 : 3);
    });
    var schwer = $("memory-stufe-schwer");
    schwer.disabled = !schwerGeht;
    $("memory-zu-wenig").hidden = schwerGeht;
    if (schwerGeht) schwer.removeAttribute("aria-describedby");
    else schwer.setAttribute("aria-describedby", "memory-zu-wenig");
    $("memory-wahl").hidden = false;
    $("memory-spiel").hidden = true;
    $("memory-status").hidden = true;
    wahlOffen = true;
  }

  function starteSpiel(stufe) {
    if (!wahlOffen || !umgebung || !umgebung.laeuft()) return;
    wahlOffen = false;
    umgebung.merkeMemoryStufe(stufe);
    var regel = L.MEMORY[stufe];
    var auswahl = eindeutige(umgebung.noten).slice(0, regel.paare);
    var karten = [];
    auswahl.forEach(function (n) {
      karten.push({ art: "note", note: n });
      karten.push({ art: "name", note: n });
    });
    spiel = { stufe: stufe, karten: H.mische(karten), offen: [], paare: auswahl.length, gefunden: 0, zuege: 0, fertig: false };
    $("memory-wahl").hidden = true;
    $("memory-spiel").hidden = false;
    $("memory-status").hidden = false;
    baueKarten();
    umgebung.zeigeTier($("memory-tier"), "normal");
    $("memory-merkhilfe").hidden = true;
    $("memory-text").textContent = T.t("memory.start");
    zeigeStatus();
    // Der angetippte Knopf ist jetzt versteckt: Fokus auf den Titel wie beim Öffnen der Ansicht.
    $("titel-memory").focus({ preventScroll: true });
  }

  function stoppe() {
    clearTimeout(timer);
    timer = null;
    spiel = null;
    wahlOffen = false;
  }

  function zeigeStatus() {
    $("memory-zuege").textContent = T.t("memory.zuege", { n: spiel.zuege });
    $("memory-paare").textContent = T.t("memory.paare", { gefunden: spiel.gefunden, paare: spiel.paare });
  }

  function baueKarten() {
    var box = $("memory-karten");
    box.innerHTML = "";
    box.classList.toggle("memory-schwer", spiel.stufe === "schwer");
    // Kartenzahl für das Raster: Bei wenigen Tönen gibt es weniger Paare, die Reihen sollen trotzdem aufgehen.
    box.setAttribute("data-karten", String(spiel.karten.length));
    spiel.karten.forEach(function (k, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "memory-karte";
      b.innerHTML = '<span class="karte-rueckseite" aria-hidden="true">♪</span>' +
        '<span class="karte-vorderseite" aria-hidden="true"></span>' +
        '<span class="karte-marke" aria-hidden="true"></span>';
      var vorne = b.querySelector(".karte-vorderseite");
      if (k.art === "note") {
        // Mit Vorzeichen-Noten etwas breiter, damit ♯ und ♭ nicht am Schlüssel kleben.
        var vz = umgebung.noten.some(function (n) { return n.vorzeichen; });
        vorne.innerHTML = window.Notensystem.zeichne(k.note, { bereich: umgebung.bereich, breite: vz ? 100 : 94, noteX: vz ? 80 : 74 });
      } else {
        vorne.textContent = k.note.antwortAnzeige;
        vorne.classList.add("karte-name");
      }
      b.addEventListener("click", function () { decke(i); });
      k.knopf = b;
      k.zustand = "zu";
      beschrifte(k, i);
      box.appendChild(b);
    });
  }

  function beschrifte(k, i) {
    var text = T.t("memory.karte", { nr: i + 1 });
    if (k.zustand === "zu") text += T.t("memory.verdeckt");
    else text += k.art === "note" ? T.t("memory.notenkarte") : T.t("memory.name", { name: k.note.antwortAnzeige });
    if (k.zustand === "gefunden") text += T.t("memory.gefunden");
    k.knopf.setAttribute("aria-label", text);
    k.knopf.classList.toggle("ist-offen", k.zustand !== "zu");
    k.knopf.classList.toggle("ist-gefunden", k.zustand === "gefunden");
    k.knopf.querySelector(".karte-marke").textContent = k.zustand === "gefunden" ? "✓" : (k.knopf.classList.contains("ist-kein-paar") ? "✗" : "");
  }

  function deckeZu() {
    clearTimeout(timer);
    timer = null;
    spiel.offen.forEach(function (i) {
      var k = spiel.karten[i];
      k.zustand = "zu";
      k.knopf.classList.remove("ist-kein-paar");
      beschrifte(k, i);
    });
    spiel.offen = [];
  }

  function decke(i) {
    if (!aktiv() || spiel.fertig) return;
    var k = spiel.karten[i];
    if (k.zustand !== "zu") return; // offene oder gefundene Karten zählen nicht
    // Liegt noch ein falsches Paar offen, geht es sofort zu.
    if (spiel.offen.length === 2) deckeZu();
    k.zustand = "offen";
    spiel.offen.push(i);
    beschrifte(k, i);
    if (spiel.offen.length < 2) return;

    spiel.zuege += 1;
    var a = spiel.karten[spiel.offen[0]];
    var b = spiel.karten[spiel.offen[1]];
    if (a.note.antwort === b.note.antwort && a.art !== b.art) {
      a.zustand = b.zustand = "gefunden";
      beschrifte(a, spiel.offen[0]);
      beschrifte(b, spiel.offen[1]);
      spiel.offen = [];
      spiel.gefunden += 1;
      H.zeigeMerkhilfe(umgebung, a.note, "memory-merkhilfe");
      $("memory-text").textContent = T.t("memory.paar", { name: a.note.anzeige });
      umgebung.zeigeTier($("memory-tier"), "froh");
      if (spiel.gefunden === spiel.paare) {
        spiel.fertig = true;
        timer = setTimeout(beende, ENDE_NACH);
      }
    } else {
      a.knopf.classList.add("ist-kein-paar");
      b.knopf.classList.add("ist-kein-paar");
      beschrifte(a, spiel.offen[0]);
      beschrifte(b, spiel.offen[1]);
      $("memory-merkhilfe").hidden = true;
      $("memory-text").textContent = T.t("memory.keinPaar");
      umgebung.zeigeTier($("memory-tier"), "oje");
      timer = setTimeout(deckeZu, ZUDECKEN_NACH);
    }
    zeigeStatus();
  }

  function beende() {
    clearTimeout(timer);
    if (!aktiv()) return;
    var s = spiel;
    spiel = null;
    var sterne = L.memorySterne(s.zuege, s.paare, s.stufe);
    var regel = L.MEMORY[s.stufe];
    umgebung.beende({
      gesamt: L.memoryPunkte(s.paare, sterne, s.stufe),
      neueSterne: sterne,
      variante: s.stufe === "schwer" ? "schwer" : undefined,
      titel: T.t("memory.ueberschrift", { paare: s.paare, zuege: s.zuege }),
      spruch: T.t("memory.alle") + " " + (sterne === 3 ? T.t("memory.gedaechtnis") : T.t("ende.toll")),
      stimmung: "froh",
      zeilen: [
        [T.t("memory.zeileStufe"), T.t("memory." + s.stufe)],
        [T.t("memory.zeileZuege"), String(s.zuege)],
        [T.t("memory.zeilePunkte", { n: s.paare }), String(s.paare * regel.punkteProPaar)],
        [T.t("ende.bonus"), String(sterne * regel.punkteProStern) + " (" + H.sterneText(sterne) + " × " + regel.punkteProStern + ")"]
      ]
    });
  }

  ["normal", "schwer"].forEach(function (stufe) {
    $("memory-stufe-" + stufe).addEventListener("click", function () { starteSpiel(stufe); });
  });

  window.Modi.registriere({
    id: "noten-memory",
    get name() { return T.t("modus.noten-memory"); },
    symbol: "🃏",
    ansicht: "memory",
    starte: starte,
    stoppe: stoppe
  });
})();
