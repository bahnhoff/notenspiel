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

test("nach drei Fehlern geht die Runde bis zur zehnten Aufgabe weiter, ohne Bonus und Sterne", () => {
  const { runde, ergebnis } = spiele([1, 2, 4, 6]);
  assert.equal(runde.verlauf.length, 10);
  assert.deepEqual([ergebnis.vorzeitig, ergebnis.gesamt, ergebnis.neueSterne], [false, 60, 0]);
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
  assert.equal(lage("violin", "c1", "g1"), "c¹@-2 d¹@-1 e¹@0 f¹@1 g¹@2");
  assert.equal(lage("bass", "C", "D"), "C@-4 D@-3");
  assert.equal(lage("bass", "f", "f"), "f@6");
  assert.equal(lage("bass", "c1", "c1"), "c¹@10");
  assert.equal(lage("violin", "c3", "c3"), "c³@12");
  const [h1] = N.notenImBereich(K, "violin", "h1", "h1");
  assert.equal(h1.hinweis, "Die Note liegt auf der mittleren Linie.");
  const [c] = N.notenImBereich(K, "violin", "c1", "c1");
  assert.match(c.hinweis, /^Die Note liegt auf der ersten Hilfslinie unter dem System\./);
  assert.equal(c.tier, "chamaeleon");
  assert.equal(c.id, "violin-c1");
  assert.equal(N.notenImBereich(K, "violin", "f2", "f2")[0].tier, "fuchs");
});

test("alte Einstellungen werden in Notenlisten übersetzt", () => {
  const roh = L.bereinigeSpielstand({ einstellungen: { schluessel: "beide", bereich: { violin: "oktave1", bass: "oktave1" }, merktiere: false } }).einstellungen;
  const e = N.einstellungen(K, roh);
  assert.deepEqual([e.schluessel, e.merktiere, e.noten.length], [["violin", "bass"], false, 16]);
  assert.equal(N.fuerEinstellungen(K, e).namen.map((a) => a.name).join(" "), "c d e f g a h c¹ d¹ e¹ f¹ g¹ a¹ h¹ c²");
  assert.deepEqual(N.einstellungen(K, null).noten, ["violin-c1", "violin-d1", "violin-e1", "violin-f1", "violin-g1", "bass-c", "bass-d", "bass-e", "bass-f", "bass-g"]);
});

test("freie Notenauswahl mit Lücken und gemischten Schlüsseln", () => {
  const e = { schluessel: ["violin", "bass"], noten: ["violin-c1", "violin-e1", "violin-g1", "bass-c1", "bass-G", "bass-x9", "violin-c1"], merktiere: true };
  const a = N.fuerEinstellungen(K, L.bereinigeSpielstand({ einstellungen: e }).einstellungen);
  assert.deepEqual(a.noten.map((n) => n.id), ["violin-c1", "violin-e1", "violin-g1", "bass-G", "bass-c1"]);
  assert.equal(a.namen.map((x) => x.name).join(" "), "G c¹ e¹ g¹");
  assert.equal(N.stufe("c¹"), N.stufe("c1"));
  assert.equal(N.fuerEinstellungen(K, { schluessel: ["bass"], noten: e.noten }).noten.length, 2);
});

test("Antwortmodus: alte Spielstände bekommen Einfach, Genau bleibt erhalten", () => {
  const alt = L.bereinigeSpielstand({ einstellungen: { schluessel: ["violin"], noten: ["violin-c1"], merktiere: true } }).einstellungen;
  assert.equal(N.einstellungen(K, alt).antwortmodus, "einfach");
  const genau = L.bereinigeSpielstand({ einstellungen: { schluessel: ["violin"], noten: [], antwortmodus: "genau" } }).einstellungen;
  assert.equal(N.einstellungen(K, genau).antwortmodus, "genau");
});

test("Antwortmodus Einfach: nur Buchstaben, jede Oktave zählt", () => {
  const a = N.fuerEinstellungen(K, { schluessel: ["violin"], noten: ["violin-c1", "violin-d1", "violin-g1", "violin-c2", "violin-d2"] });
  assert.equal(a.antworten.map((x) => x.name).join(" "), "C D G");
  const runde = L.neueRunde(a.noten.filter((n) => n.id === "violin-d2"));
  assert.equal(L.antworte(runde, "D").richtig, true);
  const genau = N.fuerEinstellungen(K, { schluessel: ["violin"], noten: ["violin-d1", "violin-d2", "violin-e1"], antwortmodus: "genau" });
  assert.equal(L.istRichtig(genau.noten.find((n) => n.id === "violin-d2"), "d¹"), false);
});

test("Vorzeichen-Noten: Namen, Positionen und Antworten in beiden Schlüsseln", () => {
  const lage = (sl, ids) => N.verfuegbareNoten(K, sl).filter((n) => ids.includes(n.id)).map((n) => n.name + "@" + n.position).join(" ");
  assert.equal(lage("violin", ["violin-fis1", "violin-ges1", "violin-es2", "violin-b1"]), "fis¹@1 ges¹@2 b¹@4 es²@7");
  assert.equal(lage("bass", ["bass-B", "bass-Fis", "bass-cis"]), "Fis@-1 B@2 cis@3");
  const a = N.fuerEinstellungen(K, L.bereinigeSpielstand({ einstellungen: { schluessel: ["violin"], noten: ["violin-f1", "violin-fis1", "violin-ges1", "violin-b1", "violin-h1"] } }).einstellungen);
  assert.equal(a.antworten.map((x) => x.name).join(" "), "F Fis Ges B H");
  const fis = a.noten.find((n) => n.id === "violin-fis1");
  assert.equal(fis.hinweis, "Die Note liegt im ersten Zwischenraum von unten und hat ein Kreuz.");
  assert.equal(fis.tier, "fisch");
  assert.deepEqual([L.istRichtig(fis, "Fis"), L.istRichtig(fis, "Ges"), L.istRichtig(fis, "F")], [true, false, false]);
});

test("englische Notennamen: C4, B3, B♭3, F♯4, C2, E♭5; Antworten bleiben deutsch", () => {
  const englisch = (name) => { const z = N.zerlege(name); return N.englischerName(z.stufe, z.vorzeichen); };
  assert.deepEqual(["c1", "h", "b", "fis1", "C", "es2"].map(englisch), ["C4", "B3", "B♭3", "F♯4", "C2", "E♭5"]);
  const Texte = require("../js/texte.js");
  Texte.setzeSprache("en");
  try {
    const a = N.fuerEinstellungen(K, { schluessel: ["violin"], noten: ["violin-fis1", "violin-b1", "violin-h1"], antwortmodus: "einfach" });
    assert.equal(a.antworten.map((x) => x.name + "=" + x.anzeige).join(" "), "Fis=F♯ B=B♭ H=B");
    assert.equal(a.noten.find((n) => n.id === "violin-h1").anzeige, "B4");
    assert.equal(a.noten.find((n) => n.id === "violin-fis1").tier, "fisch");
  } finally {
    Texte.setzeSprache("de");
  }
});

test("Mindestauswahl: 3 verschiedene Antworten, im einfachen Modus Buchstaben", () => {
  const noten = ["violin-c1", "violin-c2", "violin-d1"];
  assert.equal(N.auswahlReicht(N.fuerEinstellungen(K, { schluessel: ["violin"], noten, antwortmodus: "einfach" })), false);
  assert.equal(N.auswahlReicht(N.fuerEinstellungen(K, { schluessel: ["violin"], noten, antwortmodus: "genau" })), true);
  assert.equal(N.auswahlReicht(N.fuerEinstellungen(K, { schluessel: ["violin"], noten: noten.concat(["violin-cis1"]) })), true);
});

test("alle 5 Sterne ein neues Tier, seltene erst ab 50 Sternen", () => {
  let stand = L.leererSpielstand();
  const zufall = festerZufall();
  let v = L.verbucheErgebnis(stand, "klassisch", { gesamt: 130, neueSterne: 3 }, 1, zufall);
  assert.equal(v.neueTiere.length, 0);
  v = L.verbucheErgebnis(v.stand, "klassisch", { gesamt: 130, neueSterne: 3 }, 2, zufall);
  assert.equal(v.neueTiere.length, 1);
  assert.equal(v.stand.entdeckt.length, 2);
  const naechstes = L.naechstesTier(v.stand);
  assert.deepEqual([naechstes.fehlend, naechstes.gesammelt, naechstes.schritt], [4, 1, 5]);
  // Das vorgemerkte Tier (Silhouette im Ergebnis) kommt als Nächstes.
  const vorgemerkt = naechstes.id;
  v = L.verbucheErgebnis(v.stand, "klassisch", { gesamt: 0, neueSterne: 4 }, 2, zufall);
  assert.deepEqual(v.neueTiere.map((t) => t.id), [vorgemerkt]);
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

test("Notenflug: jedes Level 15 % schneller, Punkte = Level × gewählte Noten, Ende nach drei Fehlern", () => {
  assert.equal(L.flugzeit(1), 8000);
  assert.ok(Math.abs(L.flugzeit(2) - 8000 / 1.15) < 1e-9);
  const flug = L.neuerFlug(3);
  assert.equal(L.flugPunkteProNote(flug), 3);
  assert.equal(L.flugPunkteProNote(flug, 3), 9);
  for (let i = 0; i < 10; i++) L.flugAntwort(flug, true);
  assert.equal(flug.level, 2);
  L.flugAntwort(flug, true);
  assert.equal(flug.punkte, 10 * 3 + 6);
  L.flugAntwort(flug, false);
  L.flugAntwort(flug, false);
  assert.deepEqual(L.flugAntwort(flug, false), { levelGeschafft: false, beendet: true });
  assert.equal(L.flugAntwort(flug, true), null);
  assert.equal(L.flugSterne(flug), 1);
});

test("Noten-Memory: Sterne nach Zügen und Punkte, Normal und Schwer", () => {
  assert.deepEqual([6, 9, 10, 13, 14].map((z) => L.memorySterne(z)), [3, 3, 2, 2, 1]);
  assert.equal(L.memoryPunkte(6, 3), 90);
  assert.deepEqual([10, 16, 17, 22, 23].map((z) => L.memorySterne(z, 10, "schwer")), [3, 3, 2, 2, 1]);
  assert.equal(L.memoryPunkte(10, 3, "schwer"), 210);
  // Variante im Rekord und gemerkte Stufe überstehen Speichern und Laden; alte Stände starten mit „normal“.
  const v = L.verbucheErgebnis(Object.assign(L.leererSpielstand(), { memoryStufe: "schwer" }), "noten-memory", { gesamt: 210, neueSterne: 3, variante: "schwer" }, 1);
  const geladen = L.bereinigeSpielstand(JSON.parse(JSON.stringify(v.stand)));
  assert.deepEqual([geladen.rekorde["noten-memory"][0].variante, geladen.memoryStufe], ["schwer", "schwer"]);
  assert.equal(L.bereinigeSpielstand({ sterne: 3 }).memoryStufe, "normal");
});

test("Notenreise: Extrastern höchstens einmal pro Kalendertag", () => {
  const morgens = new Date(2026, 10, 21, 8).getTime();
  const abends = new Date(2026, 10, 21, 19).getTime();
  const erste = L.verbucheErgebnis(L.leererSpielstand(), "notenreise", { gesamt: 200, neueSterne: 3, tagesreise: true }, morgens);
  assert.deepEqual(erste.tagesreise, { extrastern: true, serie: 1 });
  assert.equal(erste.stand.sterne, 4);
  const zweite = L.verbucheErgebnis(erste.stand, "notenreise", { gesamt: 200, neueSterne: 3, tagesreise: true }, abends);
  assert.deepEqual(zweite.tagesreise, { extrastern: false, serie: 1 });
  assert.equal(zweite.stand.sterne, 7);
});

test("Notenreise: Tagesserie zählt aufeinanderfolgende Tage, auch über den Monatswechsel", () => {
  let stand = L.leererSpielstand();
  const reise = (j, m, t) => {
    const v = L.verbucheErgebnis(stand, "notenreise", { gesamt: 0, neueSterne: 0, tagesreise: true }, new Date(j, m, t, 12).getTime());
    stand = v.stand;
    return v.tagesreise.serie;
  };
  assert.equal(reise(2026, 10, 29), 1);
  assert.equal(reise(2026, 10, 30), 2);
  assert.equal(reise(2026, 11, 1), 3);
  assert.deepEqual(L.tagesreiseStatus(stand, new Date(2026, 11, 2, 9).getTime()), { heute: false, serie: 3 });
  assert.equal(reise(2026, 11, 3), 1); // ein Tag Pause: Serie beginnt neu
  assert.equal(L.bereinigeSpielstand(JSON.parse(JSON.stringify(stand))).reise.serie, 1);
});

test("Fehler üben: höchstens 3 verwechselte Noten, häufigste zuerst, je Note zwei Aufgaben", () => {
  const [a, b, c, d] = NOTEN;
  const v = (note, richtig) => ({ note, richtig });
  const verlauf = [v(a, false), v(b, true), v(c, false), v(b, false), v(c, false), v(d, false), v(a, true)];
  assert.deepEqual(L.uebungsNoten(verlauf).map((n) => n.id), [c.id, a.id, b.id]);
  assert.deepEqual(L.uebungsNoten([v(a, true)]), []);
  const u = L.neueUebung([c, a]);
  assert.deepEqual(u.aufgaben.map((x) => x.art), ["erkennen", "klavier", "erkennen", "klavier"]);
  // Eine falsche Antwort hängt die Aufgabe einmal ans Ende.
  assert.equal(L.uebungsAntwort(u, false), false);
  assert.equal(L.uebungsAntwort(u, true), null);
  assert.equal(u.aufgaben.length, 5);
  assert.deepEqual([u.aufgaben[4].note.id, u.aufgaben[4].art], [c.id, "erkennen"]);
});

test("Spiel eine Melodie: 5 Melodien aus 4 bis 7 Noten der Auswahl, Lieder behalten ihre Abstände", () => {
  const zufall = festerZufall();
  const auswahlen = [
    NOTEN, // c¹ bis g¹: Hänschen klein, Alle meine Entchen … passen
    N.fuerEinstellungen(K, { schluessel: ["violin", "bass"], noten: ["violin-c1", "violin-e1", "violin-fis1", "bass-c", "bass-g"] }).noten
  ];
  for (const noten of auswahlen) {
    const ids = noten.map((n) => n.id);
    const melodien = L.neueMelodien(noten, zufall);
    assert.equal(melodien.length, 5);
    for (const m of melodien) {
      assert.ok(m.noten.length >= 4 && m.noten.length <= 7);
      assert.equal(m.dauern.length, m.noten.length);
      assert.ok(m.noten.every((n) => ids.includes(n.id) && n.schluessel === m.noten[0].schluessel));
      if (m.lied) {
        const lied = L.LIEDER.find((l) => l.id === m.lied).toene;
        assert.deepEqual(m.noten.map((n) => n.halbton - m.noten[0].halbton), lied.map((t) => t - lied[0]));
      }
    }
  }
  assert.ok(L.neueMelodien(NOTEN, zufall).filter((m) => m.lied).length >= 4);
  assert.deepEqual([0, 2, 3, 5, 6].map(L.melodieSterne), [3, 3, 2, 2, 1]);
});
