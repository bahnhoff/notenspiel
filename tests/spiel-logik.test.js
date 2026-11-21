/*
 * Tests der Spiellogik. Start: node --test tests/spiel-logik.test.js
 * Die Tests brauchen nur Node.js ab Version 18, keine weiteren Pakete.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");
const L = require("../js/spiel-logik.js");

function ladeKonfiguration() {
  const code = fs.readFileSync(path.join(__dirname, "..", "js", "noten-konfiguration.js"), "utf8");
  const kontext = { window: {} };
  vm.runInNewContext(code, kontext);
  return kontext.window.NOTEN_KONFIGURATION;
}

const KONFIG = ladeKonfiguration();
const NOTEN = L.aktiveNoten(KONFIG);

/** Spielt eine Runde; `falschBei` enthält die Aufgabennummern (1 bis 10) mit falscher Antwort. */
function spiele(falschBei, optionen) {
  const runde = L.neueRunde(NOTEN, optionen);
  let ende = null;
  while (!ende) {
    const nr = runde.aufgabe + 1;
    const richtig = runde.aktuell.note.id;
    const falsch = NOTEN.find((n) => n.id !== richtig).id;
    L.antworte(runde, falschBei.includes(nr) ? falsch : richtig);
    const w = L.weiter(runde);
    if (w.beendet) ende = w.ergebnis;
  }
  return { runde, ergebnis: ende };
}

test("aktiver Übungssatz: C, D, E, F, G im Violinschlüssel auf den richtigen Positionen", () => {
  assert.deepEqual(NOTEN.map((n) => n.name), ["C", "D", "E", "F", "G"]);
  assert.deepEqual(NOTEN.map((n) => n.position), [-2, -1, 0, 1, 2]);
  assert.ok(NOTEN.every((n) => n.schluessel === "violin"));
  assert.equal(new Set(NOTEN.map((n) => n.id)).size, NOTEN.length);
});

test("deutscher Notenname H für den Stammton zwischen A und C", () => {
  const h = KONFIG.noten.find((n) => n.id === "violin-H4");
  assert.equal(h.name, "H");
  const satz = L.aktiveNoten(Object.assign({}, KONFIG, { aktiverUebungssatz: "violin-c4-h4" }));
  assert.deepEqual(satz.map((n) => n.name), ["C", "D", "E", "F", "G", "A", "H"]);
});

test("Rundenstart: 0 Punkte, 3 Sterne, Aufgabe 1", () => {
  const r = L.neueRunde(NOTEN);
  assert.equal(r.punkte, 0);
  assert.equal(r.sterne, 3);
  assert.equal(r.aufgabe, 0);
  assert.ok(r.aktuell.note);
});

test("zehn richtige Antworten ergeben 130 Punkte und drei Sterne", () => {
  const { ergebnis } = spiele([]);
  assert.equal(ergebnis.richtige, 10);
  assert.equal(ergebnis.punkte, 100);
  assert.equal(ergebnis.bonus, 30);
  assert.equal(ergebnis.gesamt, 130);
  assert.equal(ergebnis.neueSterne, 3);
});

test("neun richtige Antworten und ein Fehler ergeben 110 Punkte und zwei Sterne", () => {
  for (let nr = 1; nr <= 10; nr++) {
    const { ergebnis } = spiele([nr]);
    assert.equal(ergebnis.gesamt, 110, "Fehler bei Aufgabe " + nr);
    assert.equal(ergebnis.punkte, 90);
    assert.equal(ergebnis.bonus, 20);
    assert.equal(ergebnis.neueSterne, 2);
    assert.equal(ergebnis.vorzeitig, false);
  }
});

test("dritter Fehler vor Aufgabe 10 beendet die Runde ohne Bonus und ohne Sterne", () => {
  const { runde, ergebnis } = spiele([1, 4, 6]);
  assert.equal(runde.verlauf.length, 6);
  assert.equal(ergebnis.vorzeitig, true);
  assert.equal(ergebnis.punkte, 30);
  assert.equal(ergebnis.bonus, 0);
  assert.equal(ergebnis.gesamt, 30);
  assert.equal(ergebnis.neueSterne, 0);
});

test("dritter Fehler bei Aufgabe 10 beendet die Runde ohne Bonus und ohne Sterne", () => {
  const { runde, ergebnis } = spiele([2, 5, 10]);
  assert.equal(runde.verlauf.length, 10);
  assert.equal(ergebnis.vorzeitig, true);
  assert.equal(ergebnis.gesamt, 70);
  assert.equal(ergebnis.neueSterne, 0);
});

test("jede Aufgabe nimmt genau eine Antwort an", () => {
  const r = L.neueRunde(NOTEN);
  const id = r.aktuell.note.id;
  assert.ok(L.antworte(r, id));
  assert.equal(L.antworte(r, id), null);
  assert.equal(L.antworte(r, "violin-C4"), null);
  assert.equal(r.punkte, 10);
  assert.ok(L.weiter(r));
  assert.equal(L.weiter(r), null, "doppeltes Weiter überspringt keine Aufgabe");
  assert.equal(r.aufgabe, 1);
});

test("dieselbe Notenposition erscheint nie direkt zweimal hintereinander", () => {
  for (let i = 0; i < 300; i++) {
    const falsch = [1 + (i % 10), 1 + ((i * 3) % 10)].filter((v, k, a) => a.indexOf(v) === k);
    const { runde } = spiele(falsch, { vorrang: i % 2 ? ["violin-D4"] : [] });
    for (let k = 1; k < runde.verlauf.length; k++) {
      assert.notEqual(L.positionsSchluessel(runde.verlauf[k].note), L.positionsSchluessel(runde.verlauf[k - 1].note));
    }
  }
});

test("eine falsch beantwortete Note kehrt nach zwei bis drei anderen Noten zurück", () => {
  for (let i = 0; i < 200; i++) {
    const { runde } = spiele([2]);
    const falscheNote = runde.verlauf[1].note.id;
    const wiederholung = runde.verlauf.findIndex((v, k) => k > 1 && v.wiederholung && v.note.id === falscheNote);
    assert.ok(wiederholung === 4 || wiederholung === 5, "Wiederholung bei Index " + wiederholung);
    const dazwischen = runde.verlauf.slice(2, wiederholung).map((v) => v.note.id);
    assert.ok(!dazwischen.includes(falscheNote), "dazwischen nicht dieselbe Note");
  }
});

test("ohne Platz in der Runde wandert die Note in die nächste Runde und kommt dort bevorzugt", () => {
  const { runde, ergebnis } = spiele([9]);
  const falscheNote = runde.verlauf[8].note.id;
  assert.ok(ergebnis.uebertrag.includes(falscheNote));
  const naechste = L.neueRunde(NOTEN, { vorrang: ergebnis.uebertrag });
  const id = naechste.aktuell.note.id;
  L.antworte(naechste, id);
  L.weiter(naechste);
  const zweite = naechste.aktuell;
  if (id !== falscheNote) {
    assert.equal(zweite.note.id, falscheNote);
    assert.equal(zweite.wiederholung, true);
  }
});

test("bei vorzeitigem Ende kommen ausstehende Wiederholungen in die nächste Runde", () => {
  const { ergebnis } = spiele([1, 2, 3]);
  assert.ok(ergebnis.uebertrag.length >= 1);
});

test("Verbuchung: genau einmal pro Runde", () => {
  const { runde } = spiele([]);
  const stand = L.leererSpielstand();
  const v1 = L.verbucheRunde(stand, runde, 1000);
  assert.equal(v1.stand.sterne, 3);
  assert.equal(v1.stand.rekorde.length, 1);
  assert.equal(L.verbucheRunde(v1.stand, runde, 1001), null);
});

test("vorzeitiges Ende: Punkte kommen in die Rekorde, gesammelte Sterne bleiben", () => {
  const { runde } = spiele([1, 2, 3]);
  const stand = Object.assign(L.leererSpielstand(), { sterne: 7 });
  const v = L.verbucheRunde(stand, runde, 5);
  assert.equal(v.stand.sterne, 7);
  assert.equal(v.stand.rekorde[0].gesamt, 0);
  assert.equal(v.stand.rekorde[0].sterne, 0);
});

test("Häschen bei 5 und Kätzchen bei 10 Sternen", () => {
  let stand = L.leererSpielstand();
  const freigeschaltet = [];
  for (let i = 0; i < 4; i++) {
    const v = L.verbucheRunde(stand, spiele([]).runde, i);
    stand = v.stand;
    freigeschaltet.push({ sterne: stand.sterne, neu: v.neueTiere.map((t) => t.id) });
  }
  assert.deepEqual(freigeschaltet, [
    { sterne: 3, neu: [] },
    { sterne: 6, neu: ["hase"] },
    { sterne: 9, neu: [] },
    { sterne: 12, neu: ["katze"] }
  ]);
  assert.equal(L.naechstesTier(4).fehlend, 1);
  assert.equal(L.naechstesTier(5).tier.id, "katze");
  assert.equal(L.naechstesTier(10), null);
});

test("Rekorde: fünf beste, nach Punkten, dann Sternen, dann neuerem Ergebnis", () => {
  const sortiert = L.sortiereRekorde([
    { gesamt: 100, sterne: 1, zeit: 1, nr: 1 },
    { gesamt: 130, sterne: 3, zeit: 2, nr: 2 },
    { gesamt: 100, sterne: 2, zeit: 3, nr: 3 },
    { gesamt: 100, sterne: 2, zeit: 4, nr: 4 },
    { gesamt: 50, sterne: 0, zeit: 5, nr: 5 }
  ]);
  assert.deepEqual(sortiert.map((r) => r.nr), [2, 4, 3, 1, 5]);

  let stand = L.leererSpielstand();
  const fehlerListen = [[], [1], [1, 2], [1, 2, 3], [], [4], [1, 5]];
  fehlerListen.forEach((f, i) => { stand = L.verbucheRunde(stand, spiele(f).runde, 100 + i).stand; });
  assert.equal(stand.rekorde.length, 5);
  assert.deepEqual(stand.rekorde.map((r) => r.gesamt), [130, 130, 110, 110, 90]);
  assert.equal(stand.rekorde[0].zeit, 104, "bei Gleichstand steht das neuere Ergebnis oben");
});

test("beschädigter Spielstand führt zu einem gültigen leeren Stand", () => {
  for (const roh of [null, "x", 42, [], { sterne: -3, tier: "drache", rekorde: "kaputt" }, { sterne: 2, tier: "katze" }]) {
    const s = L.bereinigeSpielstand(roh);
    assert.ok(s.sterne >= 0);
    assert.equal(s.tier, "fuchs");
    assert.ok(Array.isArray(s.rekorde));
  }
  const ok = L.bereinigeSpielstand({ sterne: 12, tier: "katze", rekorde: [{ gesamt: 130, sterne: 3, zeit: 1 }] });
  assert.equal(ok.tier, "katze");
  assert.equal(ok.rekorde.length, 1);
});

test("Rückmeldungen und Hinweise", () => {
  const r = L.neueRunde(NOTEN, { zufall: () => 0 });
  const note = r.aktuell.note;
  const falsch = NOTEN.find((n) => n.id !== note.id).id;
  const a = L.antworte(r, falsch);
  assert.equal(a.nachricht, "Das ist " + note.name + ". " + note.hinweis);

  const d = NOTEN.find((n) => n.id === "violin-D4");
  assert.equal(d.hinweis, "Die Note liegt knapp unter der untersten Linie.");

  const r2 = L.neueRunde(NOTEN, { zufall: () => 0 });
  const meldungen = [];
  for (let i = 0; i < 3; i++) {
    meldungen.push(L.antworte(r2, r2.aktuell.note.id).nachricht);
    L.weiter(r2);
  }
  assert.match(meldungen[0], /^Genau, das ist [CDEFG]!$/);
  assert.equal(meldungen[2], "Drei Richtige in Folge!");
});
