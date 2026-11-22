/*
 * Gemeinsame Schnittstelle für Spielmodi
 * ======================================
 *
 * Jeder Modus ist eine eigene Datei unter js/modi/ und meldet sich so an:
 *
 *   Modi.registriere({
 *     id: "notenflug",        // Kennung, auch für die Rekorde (a–z, 0–9, -)
 *     name: "Notenflug",      // Name auf der Startseite und bei den Rekorden
 *     symbol: "🚀",           // optional, Bild vor dem Namen auf der Startseite
 *     hauptspiel: false,      // true nur beim klassischen Spiel (großer Start-Knopf)
 *     ansicht: "notenflug",   // zeigt <section id="ansicht-notenflug" class="ansicht"> in index.html
 *     starte: function (umgebung) { … },  // neue Runde beginnen
 *     stoppe: function () { … },          // optional: Runde verwerfen (Timer, Animation, Ton)
 *     reise: true,            // optional: taugt als Etappe der Täglichen Notenreise,
 *                             // beachtet dann umgebung.aufgaben
 *     kachelInfo: function (status) { … } // optional: kurzer Text unter dem Namen
 *                             // auf der Startseite; status = { tagesreise }
 *   });
 *
 * Die Datei wird in index.html vor js/app.js eingebunden. Die App zeigt den
 * Modus dann auf der Startseite und bei den Rekorden.
 *
 * Die App ruft `starte(umgebung)` bei jedem Start und bei „Noch eine Runde“
 * auf. `umgebung` enthält:
 *   noten          erzeugte Noten der aktuellen Einstellungen (siehe js/noten.js)
 *   antworten      eindeutige Notennamen, tief nach hoch: { name, stufe, oktave, buchstabe }
 *   bereich        [tiefste, höchste Position] für Notensystem.zeichne(…, { bereich })
 *   einstellungen  { schluessel: ["violin", "bass"], noten: [Kennungen], merktiere }
 *   schwierig      Notenkennungen, die zuletzt Mühe gemacht haben
 *   aufgaben       optional: Zahl der Aufgaben, zum Beispiel 5 in der Notenreise.
 *                  Fehlt sie, gilt die normale Rundenlänge (10). Modi mit
 *                  `reise: true` geben sie an SpielLogik.neueRunde weiter.
 *   tagesreise     { heute, serie }: Notenreise heute schon geschafft?
 *                  Tage in Folge (siehe SpielLogik.tagesreiseStatus)
 *   zeigeAnsicht(name)        blendet die Ansicht des Modus ein, mit `name`
 *                             eine andere Ansicht (für die Notenreise)
 *   zeigeTier(el, stimmung)   zeichnet das gewählte Begleittier ("normal", "froh", "oje")
 *   merkhilfe(note)           { tier, name, text } oder null, wenn Merktiere aus sind
 *   laeuft()                  false, sobald die Runde verworfen oder beendet ist
 *   beende(ergebnis)          schließt die Runde ab. Die App nimmt pro Start nur
 *                             den ersten Aufruf an, verbucht Sterne, Rekord und
 *                             neue Tiere und zeigt den Ergebnisbildschirm samt
 *                             Namensabfrage bei einem Top-5-Rekord.
 *
 * `ergebnis` für beende():
 *   gesamt        Punkte für die Rekorde
 *   neueSterne    Sterne für die gemeinsame Sammlung
 *   rekordSterne  optional, Sterne im Rekordeintrag (sonst neueSterne)
 *   titel         Überschrift, zum Beispiel "Geschafft!"
 *   spruch        Satz des Begleittiers
 *   stimmung      "froh" oder "normal"
 *   zeilen        [[Bezeichnung, Wert], …] Details vor der Gesamtpunktzahl
 *   schwierig     optional { gefragt: [Kennungen], neu: [Kennungen] }
 *   tagesreise    optional true: Die Tägliche Notenreise ist geschafft. Die App
 *                 vergibt dann den Extrastern (höchstens einmal pro Kalendertag)
 *                 und zählt die Tagesserie weiter.
 *
 * `klassischesEnde` (unten) liefert zusätzlich `geschafft` (Runde ohne dritten
 * Fehler beendet), `richtige` und `aufgaben`. Die Notenreise wertet damit
 * ihre Etappen aus; die App ignoriert diese Felder.
 *
 * Zurück-Knöpfe mit der Klasse `knopf-zurueck` führen zur Startseite. Die App
 * ruft dabei `stoppe()` auf und verwirft die Runde ohne Ergebnis.
 *
 * Gemeinsame Hilfen für mehrere Modi stehen unter `Modi.hilfen`.
 */
(function (root) {
  "use strict";

  var liste = [];

  function registriere(modus) {
    if (!modus || !/^[a-z0-9-]{1,30}$/.test(modus.id) || typeof modus.starte !== "function") {
      throw new Error("Ungültiger Spielmodus: " + (modus && modus.id));
    }
    if (hole(modus.id)) throw new Error("Spielmodus doppelt angemeldet: " + modus.id);
    liste.push(modus);
    return modus;
  }

  function hole(id) {
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }

  /* ---------- Hilfen ---------- */

  function sternSymbole(voll, gesamt) {
    var html = "";
    for (var i = 0; i < gesamt; i++) {
      html += i < voll
        ? '<span class="stern stern-voll" aria-hidden="true">★</span>'
        : '<span class="stern stern-leer" aria-hidden="true">☆</span>';
    }
    return html;
  }

  /**
   * Baut Antwortschaltflächen für Notennamen in `box`. Bei mehr als einer
   * Oktave steht jede Oktave in einer eigenen Reihe (tief unten, hoch oben),
   * gleiche Buchstaben stehen untereinander. `beiKlick(name)` wird beim
   * Antippen aufgerufen. Liefert die Schaltflächen in aufsteigender Reihenfolge.
   */
  function antwortKnoepfe(box, antworten, beiKlick) {
    box.innerHTML = "";
    var reihen = {};
    var oktaven = [];
    antworten.forEach(function (a) {
      if (!reihen[a.oktave]) { reihen[a.oktave] = []; oktaven.push(a.oktave); }
      reihen[a.oktave].push(a);
    });
    var einfach = oktaven.length === 1;
    box.classList.toggle("antworten-einfach", einfach);
    box.classList.toggle("antworten-oktaven", !einfach);
    var knoepfe = [];
    oktaven.forEach(function (oktave) {
      var reihe = document.createElement("div");
      reihe.className = "antwort-reihe";
      reihen[oktave].forEach(function (a) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "knopf knopf-antwort";
        b.dataset.name = a.name;
        if (!einfach) b.style.gridColumn = String(root.Noten.BUCHSTABEN.indexOf(a.buchstabe) + 1);
        b.innerHTML = '<span class="antwort-name"></span><span class="antwort-marke" aria-hidden="true"></span>';
        b.querySelector(".antwort-name").textContent = a.name;
        b.setAttribute("aria-label", a.name);
        b.addEventListener("click", function () { beiKlick(a.name); });
        reihe.appendChild(b);
        knoepfe.push(b);
      });
      box.appendChild(reihe);
    });
    return knoepfe;
  }

  function sterneText(n) { return n === 1 ? "1 Stern" : n + " Sterne"; }

  /** Sterne und Punkte im Kopf einer Ansicht anzeigen. */
  function zeigeSterne(sterneEl, punkteEl, sterne, gesamt, punkte) {
    sterneEl.innerHTML = sternSymbole(sterne, gesamt);
    sterneEl.setAttribute("aria-label", sterne + " von " + gesamt + " Sternen");
    if (punkteEl) punkteEl.textContent = punkte + " Punkte";
  }

  /**
   * Zeigt nach der Antwort das Merktier, zum Beispiel „d¹ wie Delfin“.
   * `id` ist die Kennung der Box, Bild und Text heißen id-bild und id-text.
   */
  function zeigeMerkhilfe(umgebung, note, id) {
    var box = document.getElementById(id);
    var hilfe = note ? umgebung.merkhilfe(note) : null;
    if (!hilfe) {
      box.hidden = true;
      return;
    }
    document.getElementById(id + "-bild").innerHTML = root.Tiere.zeichne(hilfe.tier, "froh", hilfe.name);
    document.getElementById(id + "-text").textContent = hilfe.text;
    box.hidden = false;
  }

  /**
   * Schließt eine Runde (10 Aufgaben oder umgebung.aufgaben) nach den klassischen Regeln ab
   * (js/spiel-logik.js) und übergibt das Ergebnis an die App.
   */
  function klassischesEnde(umgebung, runde) {
    var L = root.SpielLogik;
    var e = L.klassischesErgebnis(runde);
    var spruch;
    if (e.vorzeitig) spruch = "Versuchen wir’s noch mal?";
    else if (e.richtige === e.aufgaben) spruch = "Alles richtig. Du bist ein Notenprofi!";
    else spruch = "Toll gemacht!";
    umgebung.beende({
      gesamt: e.gesamt,
      neueSterne: e.neueSterne,
      titel: e.vorzeitig ? "Runde vorbei" : "Geschafft!",
      spruch: spruch,
      stimmung: e.vorzeitig ? "normal" : "froh",
      zeilen: [
        ["Richtige Antworten", e.richtige + " von " + e.aufgaben],
        ["Punkte dafür", String(e.punkte)],
        ["Bonus", e.bonus + (e.bonus > 0 ? " (" + sterneText(e.verbleibendeSterne) + " × " + L.REGELN.bonusProStern + ")" : "")]
      ],
      schwierig: e.schwierig,
      geschafft: !e.vorzeitig,
      richtige: e.richtige,
      aufgaben: e.aufgaben
    });
  }

  /** Zufällige Reihenfolge (Fisher-Yates), ändert die Liste nicht. */
  function mische(liste, zufall) {
    var a = liste.slice();
    zufall = zufall || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(zufall() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  root.Modi = {
    registriere: registriere,
    hole: hole,
    liste: function () { return liste.slice(); },
    hilfen: {
      sternSymbole: sternSymbole,
      sterneText: sterneText,
      zeigeSterne: zeigeSterne,
      antwortKnoepfe: antwortKnoepfe,
      zeigeMerkhilfe: zeigeMerkhilfe,
      klassischesEnde: klassischesEnde,
      mische: mische
    }
  };
})(this);
