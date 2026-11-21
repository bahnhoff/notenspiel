/*
 * Modus „Noten-Memory“: 6 Paare aus Notenkarte und Namenskarte, Raster 3 × 4.
 * Ein Zug = zwei Karten aufdecken. Sterne nach Zügen: bis 9 Züge 3,
 * bis 13 Züge 2, sonst 1. Punkte: 10 pro Paar plus 10 pro Stern.
 * Hat der gewählte Bereich weniger als 6 Noten, gibt es entsprechend
 * weniger Paare (Regeln: js/spiel-logik.js, memorySterne).
 * Nutzt die Ansicht #ansicht-memory aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var H = window.Modi.hilfen;
  var ZUDECKEN_NACH = 1300;  // Millisekunden, bis ein falsches Paar wieder zugeht
  var ENDE_NACH = 1200;

  var umgebung = null;
  var spiel = null;   // { karten, offen, paare, gefunden, zuege, fertig }
  var timer = null;

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return spiel && umgebung && umgebung.laeuft();
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    // Noten mit verschiedenen Namen wählen (bei beiden Schlüsseln gibt es c1 zweimal).
    var namen = {};
    var auswahl = H.mische(u.noten).filter(function (n) {
      if (namen[n.name]) return false;
      namen[n.name] = true;
      return true;
    }).slice(0, L.MEMORY.paare);
    var karten = [];
    auswahl.forEach(function (n) {
      karten.push({ art: "note", note: n });
      karten.push({ art: "name", note: n });
    });
    spiel = { karten: H.mische(karten), offen: [], paare: auswahl.length, gefunden: 0, zuege: 0, fertig: false };
    baueKarten();
    u.zeigeTier($("memory-tier"), "normal");
    $("memory-merkhilfe").hidden = true;
    $("memory-text").textContent = "Finde zu jeder Note den passenden Namen.";
    zeigeStatus();
    u.zeigeAnsicht();
  }

  function stoppe() {
    clearTimeout(timer);
    timer = null;
    spiel = null;
  }

  function zeigeStatus() {
    $("memory-zuege").textContent = spiel.zuege === 1 ? "1 Zug" : spiel.zuege + " Züge";
    $("memory-paare").textContent = spiel.gefunden + " von " + spiel.paare + " Paaren";
  }

  function baueKarten() {
    var box = $("memory-karten");
    box.innerHTML = "";
    box.classList.toggle("memory-wenige", spiel.karten.length < 12);
    spiel.karten.forEach(function (k, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "memory-karte";
      b.innerHTML = '<span class="karte-rueckseite" aria-hidden="true">♪</span>' +
        '<span class="karte-vorderseite" aria-hidden="true"></span>' +
        '<span class="karte-marke" aria-hidden="true"></span>';
      var vorne = b.querySelector(".karte-vorderseite");
      if (k.art === "note") {
        vorne.innerHTML = window.Notensystem.zeichne(k.note, { bereich: umgebung.bereich, breite: 94, noteX: 74 });
      } else {
        vorne.textContent = k.note.name;
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
    var text = "Karte " + (i + 1);
    if (k.zustand === "zu") text += ", verdeckt";
    else text += k.art === "note" ? ", Notenkarte" : ", Name " + k.note.name;
    if (k.zustand === "gefunden") text += ", gefunden";
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
    if (a.note.name === b.note.name && a.art !== b.art) {
      a.zustand = b.zustand = "gefunden";
      beschrifte(a, spiel.offen[0]);
      beschrifte(b, spiel.offen[1]);
      spiel.offen = [];
      spiel.gefunden += 1;
      H.zeigeMerkhilfe(umgebung, a.note, "memory-merkhilfe");
      $("memory-text").textContent = "✓ Paar gefunden: " + a.note.name + ".";
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
      $("memory-text").textContent = "✗ Kein Paar. Merk dir die Karten.";
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
    var sterne = L.memorySterne(s.zuege, s.paare);
    umgebung.beende({
      gesamt: L.memoryPunkte(s.paare, sterne),
      neueSterne: sterne,
      titel: "Alle Paare gefunden!",
      spruch: sterne === 3 ? "Was für ein Gedächtnis!" : "Toll gemacht!",
      stimmung: "froh",
      zeilen: [
        ["Züge", String(s.zuege)],
        ["Punkte für " + s.paare + " Paare", String(s.paare * L.MEMORY.punkteProPaar)],
        ["Bonus", String(sterne * L.MEMORY.punkteProStern) + " (" + H.sterneText(sterne) + " × " + L.MEMORY.punkteProStern + ")"]
      ]
    });
  }

  window.Modi.registriere({
    id: "noten-memory",
    name: "Noten-Memory",
    symbol: "🃏",
    ansicht: "memory",
    starte: starte,
    stoppe: stoppe
  });
})();
