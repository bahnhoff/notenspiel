/*
 * Kurze Tests der Spielregeln. Start: node --test tests/spiel-logik.test.js
 * Braucht nur Node.js ab Version 18.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const L = require("../js/spiel-logik.js");
const N = require("../js/noten.js");

const kontext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "noten-konfiguration.js"), "utf8"), kontext);
const K = kontext.window.NOTEN_KONFIGURATION;
const NOTEN = N.fuerEinstellungen(K, K.standardEinstellungen).noten;

/** Spielt eine Runde; `falschBei` enthält die Aufgabennummern (1 bis 10) mit falscher Antwort. */
function spiele(falschBei) {
  const runde = L.neueRunde(NOTEN);
  for (;;) {
    const richtig = runde.aktuell.note.name;
    const falsch = NOTEN.find((n) => n.name !== richtig).name;
    L.antworte(runde, falschBei.includes(runde.aufgabe + 1) ? falsch : richtig);
    const w = L.weiter(runde);
    if (w.beendet) return { runde, ergebnis: w.ergebnis };
  }
}

/** Zufall mit fester Folge, damit Tests wiederholbar sind. */
function festerZufall() {
  let x = 0.37;
  return () => (x = (x * 9301 + 0.49297) % 1);
}

test("Wertung: 10 richtig = 130 Punkte und 3 Sterne, 9 richtig = 110 Punkte und 2 Sterne", () => {
  assert.equal(spiele([]).ergebnis.gesamt, 130);
  assert.equal(spiele([]).ergebnis.neueSterne, 3);
  assert.equal(spiele([4]).ergebnis.gesamt, 110);
  assert.equal(spiele([4]).ergebnis.neueSterne, 2);
});

test("der dritte Fehler beendet die Runde ohne Bonus und Sterne, auch bei Aufgabe 10", () => {
  const frueh = spiele([1, 2, 4]).ergebnis;
  assert.deepEqual([frueh.vorzeitig, frueh.gesamt, frueh.neueSterne], [true, 10, 0]);
  const spaet = spiele([2, 5, 10]).ergebnis;
  assert.deepEqual([spaet.vorzeitig, spaet.gesamt, spaet.neueSterne], [true, 70, 0]);
});

test("jede Aufgabe zählt nur eine Antwort", () => {
  const r = L.neueRunde(NOTEN);
  const name = r.aktuell.note.name;
  L.antworte(r, name);
  assert.equal(L.antworte(r, name), null);
  assert.equal(r.punkte, 10);
});

test("eine falsch beantwortete Note kommt nach zwei bis drei anderen Noten zurück", () => {
  const { runde } = spiele([2]);
  const note = runde.verlauf[1].note.id;
  const zurueck = runde.verlauf.findIndex((v, i) => i > 1 && v.note.id === note);
  assert.ok(zurueck === 4 || zurueck === 5);
});

test("Notennamen und Positionen in beiden Schlüsseln", () => {
  const lage = (sl, von, bis) => N.notenImBereich(K, sl, von, bis).map((n) => n.name + "@" + n.position).join(" ");
  assert.equal(lage("violin", "c1", "g1"), "c1@-2 d1@-1 e1@0 f1@1 g1@2");
  assert.equal(lage("bass", "C", "D"), "C@-4 D@-3");
  assert.equal(lage("bass", "f", "f"), "f@6");
  assert.equal(lage("bass", "c1", "c1"), "c1@10");
  assert.equal(lage("violin", "c3", "c3"), "c3@12");
  const [h1] = N.notenImBereich(K, "violin", "h1", "h1");
  assert.equal(h1.hinweis, "Die Note liegt auf der mittleren Linie.");
  const [c] = N.notenImBereich(K, "violin", "c1", "c1");
  assert.match(c.hinweis, /^Die Note liegt auf der ersten Hilfslinie unter dem System\./);
  assert.equal(c.tier, "chamaeleon");
  assert.equal(N.notenImBereich(K, "violin", "f2", "f2")[0].tier, "fuchs");
  const beide = N.fuerEinstellungen(K, { schluessel: "beide", bereich: { violin: "oktave1", bass: "oktave1" } });
  assert.equal(beide.antworten.map((a) => a.name).join(" "), "c d e f g a h c1 d1 e1 f1 g1 a1 h1 c2");
});

test("alle 5 Sterne ein neues Tier, seltene erst ab 50 Sternen", () => {
  let stand = L.leererSpielstand();
  const zufall = festerZufall();
  let v = L.verbucheErgebnis(stand, "klassisch", { gesamt: 130, neueSterne: 3 }, 1, zufall);
  assert.equal(v.neueTiere.length, 0);
  v = L.verbucheErgebnis(v.stand, "klassisch", { gesamt: 130, neueSterne: 3 }, 2, zufall);
  assert.equal(v.neueTiere.length, 1);
  assert.equal(v.stand.entdeckt.length, 2);
  assert.deepEqual(L.naechstesTier(v.stand), { fehlend: 4 });
  stand = v.stand;
  stand.sterne = 44;
  v = L.verbucheErgebnis(stand, "klassisch", { gesamt: 0, neueSterne: 3 }, 3, zufall);
  assert.equal(v.stand.entdeckt.length, 10);
  assert.ok(v.stand.entdeckt.every((id) => !L.tierVon(id).selten));
  v = L.verbucheErgebnis(v.stand, "klassisch", { gesamt: 0, neueSterne: 1000 }, 4, zufall);
  assert.equal(v.stand.entdeckt.length, L.TIERE.length);
});

test("Rekorde pro Modus mit Namen, nur Top 5 fragen nach dem Namen", () => {
  let stand = L.leererSpielstand();
  for (let i = 0; i < 5; i++) stand = L.verbucheErgebnis(stand, "klassisch", { gesamt: 100, neueSterne: 1 }, i, festerZufall()).stand;
  const schwach = L.verbucheErgebnis(stand, "klassisch", { gesamt: 50, neueSterne: 0 }, 9, festerZufall());
  assert.equal(schwach.rekord, null);
  const stark = L.verbucheErgebnis(stand, "klassisch", { gesamt: 130, neueSterne: 3 }, 9, festerZufall());
  assert.deepEqual([stark.rekord.platz, stark.stand.rekorde.klassisch.length], [0, 5]);
  L.setzeRekordName(stark.stand, "klassisch", stark.rekord.nr, "  Kind A mit sehr langem Namen  ");
  assert.equal(stark.stand.rekorde.klassisch[0].name, "Kind A mit sehr lang");
  assert.deepEqual(stark.stand.namen, ["Kind A mit sehr lang"]);
  assert.equal(L.verbucheErgebnis(stark.stand, "memory", { gesamt: 10, neueSterne: 1 }, 10).stand.rekorde.memory.length, 1);
});

test("Migration eines alten Spielstands", () => {
  const alt = {
    version: 1, sterne: 17, tier: "katze", zaehler: 4, schwierig: ["violin-C4", "violin-F5"],
    rekorde: [{ gesamt: 120, sterne: 2, zeit: 5, nr: 3 }]
  };
  const neu = L.bereinigeSpielstand(alt, festerZufall());
  assert.equal(neu.version, 2);
  assert.equal(neu.sterne, 17);
  assert.equal(neu.tier, "katze");
  assert.deepEqual(neu.entdeckt.slice(0, 3), ["fuchs", "hase", "katze"]);
  assert.equal(neu.entdeckt.length, 4);
  assert.deepEqual(neu.schwierig, ["violin-c1", "violin-f2"]);
  assert.deepEqual(neu.rekorde.klassisch, [{ gesamt: 120, sterne: 2, zeit: 5, nr: 3 }]);
  assert.equal(neu.einstellungen, null);
});

test("Notenflug: jedes Level 15 % schneller, Punkte 10 × Level, Ende nach drei Fehlern", () => {
  assert.equal(L.flugzeit(1), 8000);
  assert.ok(Math.abs(L.flugzeit(2) - 8000 / 1.15) < 1e-9);
  const flug = L.neuerFlug();
  for (let i = 0; i < 10; i++) L.flugAntwort(flug, true);
  assert.equal(flug.level, 2);
  L.flugAntwort(flug, true);
  assert.equal(flug.punkte, 10 * 10 + 20);
  L.flugAntwort(flug, false);
  L.flugAntwort(flug, false);
  assert.deepEqual(L.flugAntwort(flug, false), { levelGeschafft: false, beendet: true });
  assert.equal(L.flugAntwort(flug, true), null);
  assert.equal(L.flugSterne(flug), 1);
});

test("Noten-Memory: Sterne nach Zügen und Punkte", () => {
  assert.deepEqual([6, 9, 10, 13, 14].map((z) => L.memorySterne(z)), [3, 3, 2, 2, 1]);
  assert.equal(L.memoryPunkte(6, 3), 90);
});
