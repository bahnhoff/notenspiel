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

const kontext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "noten-konfiguration.js"), "utf8"), kontext);
const NOTEN = L.aktiveNoten(kontext.window.NOTEN_KONFIGURATION);

/** Spielt eine Runde; `falschBei` enthält die Aufgabennummern (1 bis 10) mit falscher Antwort. */
function spiele(falschBei) {
  const runde = L.neueRunde(NOTEN);
  for (;;) {
    const richtig = runde.aktuell.note.id;
    const falsch = NOTEN.find((n) => n.id !== richtig).id;
    L.antworte(runde, falschBei.includes(runde.aufgabe + 1) ? falsch : richtig);
    const w = L.weiter(runde);
    if (w.beendet) return { runde, ergebnis: w.ergebnis };
  }
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
  const id = r.aktuell.note.id;
  L.antworte(r, id);
  assert.equal(L.antworte(r, id), null);
  assert.equal(r.punkte, 10);
});

test("eine falsch beantwortete Note kommt nach zwei bis drei anderen Noten zurück", () => {
  const { runde } = spiele([2]);
  const note = runde.verlauf[1].note.id;
  const zurueck = runde.verlauf.findIndex((v, i) => i > 1 && v.note.id === note);
  assert.ok(zurueck === 4 || zurueck === 5);
});
