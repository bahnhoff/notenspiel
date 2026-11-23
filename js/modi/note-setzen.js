/*
 * Modus „Note setzen“: Der Name steht da, zum Beispiel „f1“. Das Kind tippt
 * im Notensystem die richtige Linie oder den Zwischenraum an. Die Note
 * erscheint dort und lässt sich mit ▲ und ▼ verschieben, „Prüfen“ wertet.
 * Jeder Tipp ins System zählt zur nächstgelegenen Linie oder zum nächsten
 * Zwischenraum, auch auf Hilfslinien. Tastatur: Pfeiltasten und Eingabe.
 * Im einfachen Antwortmodus steht nur der Buchstabe da („F“), und jede
 * Position mit diesem Buchstaben zählt. Danach steht der genaue Name dabei.
 * Sind Vorzeichen-Noten gewählt, gibt es Knöpfe ♮, ♯ und ♭: Das Vorzeichen
 * gehört zur Antwort (fis¹ ist nicht f¹, und auch nicht ges¹).
 * 10 Aufgaben, Wertung wie im klassischen Spiel (js/spiel-logik.js).
 * Aufbau wie im Entwurf (Plan Version 3): ab Tablet-Breite Notenkarte und
 * Bedienung im Verhältnis 8 zu 4, an der gesetzten Note ein kleines Schild mit
 * dem gesuchten Namen (verrät nichts), Statuszeile „Violinschlüssel · Note d“.
 * Nutzt die Ansicht #ansicht-setzen aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var T = window.Texte;
  var N = window.Noten;
  var H = window.Modi.hilfen;
  var PAUSE_NACH_RICHTIG = 1300; // Millisekunden
  // Schmales System, damit Linien und Zwischenräume auf dem Handy groß sind.
  var FORM_STAMM = { breite: 114, noteX: 66, falschX: 92 };
  // Mit Vorzeichen breiter, damit ♯ und ♭ vor beiden Noten Platz haben.
  var FORM_VORZEICHEN = { breite: 132, noteX: 76, falschX: 110 };
  var FORM = FORM_STAMM;

  var umgebung = null;
  var runde = null;
  var weiterTimer = null;
  var gewaehlt = null;    // gesetzte Position oder null
  var vorzeichen = 0;     // gewähltes Vorzeichen: 0, 1 (♯) oder -1 (♭)
  var mitVorzeichen = false;
  var erlaubt = [0, 8];   // tiefste und höchste Position zum Antippen

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return runde && umgebung && umgebung.laeuft();
  }

  function starte(u) {
    stoppe();
    umgebung = u;
    runde = L.neueRunde(u.noten, { vorrang: u.schwierig, aufgaben: u.aufgaben });
    // Etwas Platz über und unter dem Bereich, damit auch falsche Stellen antippbar sind.
    erlaubt = [Math.min(u.bereich[0], 0) - 2, Math.max(u.bereich[1], 8) + 2];
    mitVorzeichen = u.noten.some(function (n) { return n.vorzeichen; });
    FORM = mitVorzeichen ? FORM_VORZEICHEN : FORM_STAMM;
    $("setzen-vorzeichen").hidden = !mitVorzeichen;
    u.zeigeTier($("setzen-tier"), "normal");
    u.zeigeAnsicht();
    zeigeAufgabe();
  }

  function stoppe() {
    clearTimeout(weiterTimer);
    runde = null;
    gewaehlt = null;
  }

  function note() { return runde.aktuell.note; }

  function stufeVon(position) {
    return position + N.SCHLUESSEL[note().schluessel].untersteLinie;
  }

  function zeichne(optionen) {
    var o = { bereich: erlaubt, breite: FORM.breite, noteX: FORM.noteX, falschX: FORM.falschX, schluessel: note().schluessel,
      namensPlatz: H.namensPlatz(umgebung) };
    for (var k in optionen) o[k] = optionen[k];
    var n = optionen.note !== undefined ? optionen.note : null;
    $("setzen-notensystem").innerHTML = window.Notensystem.zeichne(n, o);
  }

  /** Zeile über der Fußzeile: Schlüssel und gesuchte Note. */
  function zeigeStatuszeile(name) {
    $("setzen-status").textContent = T.t("setzen.status", { schluessel: T.t("schluessel." + note().schluessel), name: name });
  }

  function zeigeStatus() {
    $("setzen-aufgabe").textContent = H.aufgabeText(runde);
    H.zeigeSterne($("setzen-sterne"), $("setzen-punkte"), runde.sterne, L.REGELN.startSterne, runde.punkte);
  }

  function zeigeVorzeichenKnoepfe(gesperrt) {
    Array.prototype.forEach.call($("setzen-vorzeichen").querySelectorAll(".knopf-vorzeichen"), function (b) {
      var an = Number(b.dataset.vorzeichen) === vorzeichen;
      b.classList.toggle("ist-an", an);
      b.setAttribute("aria-pressed", an ? "true" : "false");
      b.disabled = gesperrt;
    });
  }

  function waehleVorzeichen(vz) {
    if (!aktiv() || runde.gesperrt) return;
    vorzeichen = vz;
    zeigeVorzeichenKnoepfe(false);
    if (gewaehlt !== null) setze(gewaehlt);
  }

  function zeigeAufgabe() {
    gewaehlt = null;
    vorzeichen = 0;
    zeigeVorzeichenKnoepfe(false);
    zeigeStatus();
    $("setzen-name").textContent = note().antwortAnzeige || note().anzeige;
    zeigeStatuszeile(note().antwortAnzeige || note().anzeige);
    var system = $("setzen-notensystem");
    system.classList.remove("ist-falsch", "ist-richtig", "hat-vorschau");
    system.classList.add("ist-offen");
    system.setAttribute("aria-valuemin", String(erlaubt[0]));
    system.setAttribute("aria-valuemax", String(erlaubt[1]));
    system.setAttribute("aria-valuenow", "4");
    system.setAttribute("aria-valuetext", T.t("setzen.nochKeine"));
    zeichne({});
    $("setzen-weiter").hidden = true;
    $("setzen-merkhilfe").hidden = true;
    $("setzen-pruefen").disabled = true;
    $("setzen-hoeher").disabled = false;
    $("setzen-tiefer").disabled = false;
    $("setzen-text").textContent = (umgebung.antwortmodus === "einfach"
      ? T.t("setzen.tippeEinfach", { name: note().antwortAnzeige })
      : T.t("setzen.tippeGenau", { name: note().anzeige })) +
      (mitVorzeichen ? T.t("setzen.vorzeichenWahl") : "") + T.t("setzen.dannPruefen");
  }

  /** Setzt die Vorschau-Note an eine Position. */
  function setze(position) {
    if (!aktiv() || runde.gesperrt) return;
    position = Math.max(erlaubt[0], Math.min(erlaubt[1], position));
    gewaehlt = position;
    var system = $("setzen-notensystem");
    system.classList.add("hat-vorschau");
    // Das Schild zeigt den gesuchten Namen, nicht den der Position.
    zeichne({ note: { position: position, schluessel: note().schluessel, vorzeichen: vorzeichen },
      schild: note().antwortAnzeige || note().anzeige });
    system.setAttribute("aria-valuenow", String(position));
    system.setAttribute("aria-valuetext", N.hinweis(note().schluessel, stufeVon(position), vorzeichen));
    $("setzen-pruefen").disabled = false;
  }

  function verschiebe(schritte) {
    if (!aktiv() || runde.gesperrt) return;
    setze(gewaehlt === null ? 4 : gewaehlt + schritte);
  }

  /** Antippen im System: nächstgelegene Linie oder nächster Zwischenraum. */
  function beiTipp(ev) {
    if (!aktiv() || runde.gesperrt) return;
    var svg = $("setzen-notensystem").querySelector("svg");
    if (!svg || !svg.getScreenCTM) return;
    var punkt = svg.createSVGPoint();
    punkt.x = ev.clientX;
    punkt.y = ev.clientY;
    var matrix = svg.getScreenCTM();
    if (!matrix) return;
    var lage = punkt.matrixTransform(matrix.inverse());
    setze(window.Notensystem.positionVon(lage.y));
  }

  function pruefe() {
    if (!aktiv() || runde.gesperrt || gewaehlt === null) return;
    var ton = N.ton(stufeVon(gewaehlt), vorzeichen);
    var gesetzt = ton.name;
    var gesetztAnzeige = ton.anzeige;
    var a = L.antworte(runde, N.antwortSchluessel(ton, umgebung.antwortmodus));
    if (!a) return; // schon geprüft
    // Im einfachen Modus kann eine andere Oktave richtig sein: dann die gesetzte Note zeigen.
    var gezeigt = a.note;
    if (a.richtig && gesetzt !== a.note.name) {
      gezeigt = N.note(window.NOTEN_KONFIGURATION, a.note.schluessel, ton.stufe, ton.vorzeichen);
    }
    zeigeVorzeichenKnoepfe(true);
    $("setzen-pruefen").disabled = true;
    $("setzen-hoeher").disabled = true;
    $("setzen-tiefer").disabled = true;
    var system = $("setzen-notensystem");
    system.classList.remove("ist-offen", "hat-vorschau");
    system.classList.add(a.richtig ? "ist-richtig" : "ist-falsch");
    // Bei falscher Antwort steht der Name oben, damit er die falsch gesetzte Note nicht verdeckt.
    zeichne({ note: gezeigt, beschriftung: a.richtig ? gezeigt.anzeige : undefined, falsch: a.richtig ? undefined : gewaehlt,
      falschVorzeichen: vorzeichen, markiere: true });
    $("setzen-name").textContent = gezeigt.anzeige;
    zeigeStatuszeile(gezeigt.anzeige);
    zeigeStatus();
    H.zeigeMerkhilfe(umgebung, gezeigt, "setzen-merkhilfe");
    $("setzen-text").textContent = a.richtig
      ? "✓ " + (gezeigt === a.note ? a.nachricht : T.liste("rueckmeldung.lob", { name: gezeigt.anzeige })[0])
      : T.t("setzen.falsch", { gesetzt: gesetztAnzeige, name: a.note.anzeige, hinweis: a.note.hinweis });
    umgebung.zeigeTier($("setzen-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      weiterTimer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      H.zeigeWeiter($("setzen-weiter"));
    }
  }

  function naechsteAufgabe() {
    clearTimeout(weiterTimer);
    if (!aktiv()) return;
    var w = L.weiter(runde);
    if (!w) return; // doppelter Aufruf
    if (w.beendet) {
      var r = runde;
      runde = null;
      H.klassischesEnde(umgebung, r);
      return;
    }
    umgebung.zeigeTier($("setzen-tier"), "normal");
    zeigeAufgabe();
    if (document.activeElement === $("setzen-weiter") || document.activeElement === document.body) {
      $("setzen-notensystem").focus({ preventScroll: true });
    }
  }

  $("setzen-notensystem").addEventListener("click", beiTipp);
  $("setzen-notensystem").addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowUp" || ev.key === "ArrowRight") { ev.preventDefault(); verschiebe(1); }
    else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft") { ev.preventDefault(); verschiebe(-1); }
    else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pruefe(); }
  });
  $("setzen-hoeher").addEventListener("click", function () { verschiebe(1); });
  Array.prototype.forEach.call($("setzen-vorzeichen").querySelectorAll(".knopf-vorzeichen"), function (b) {
    // Zeichen im Stil des Notensystems statt Schriftzeichen, die auf manchen Geräten winzig sind
    b.innerHTML = window.Notensystem.symbol(Number(b.dataset.vorzeichen));
    b.addEventListener("click", function () { waehleVorzeichen(Number(b.dataset.vorzeichen)); });
  });
  $("setzen-tiefer").addEventListener("click", function () { verschiebe(-1); });
  $("setzen-pruefen").addEventListener("click", pruefe);
  $("setzen-weiter").addEventListener("click", naechsteAufgabe);

  window.Modi.registriere({
    id: "note-setzen",
    get name() { return T.t("modus.note-setzen"); },
    symbol: "✏️",
    ansicht: "setzen",
    reise: true,
    fehlerUeben: true,
    starte: starte,
    stoppe: stoppe
  });
})();
