/*
 * Gemeinsame Schnittstelle für Spielmodi
 * ======================================
 *
 * Jeder Modus ist eine eigene Datei unter js/modi/ und meldet sich so an:
 *
 *   Modi.registriere({
 *     id: "notenflug",        // Kennung, auch für die Rekorde (a–z, 0–9, -)
 *     get name() { return Texte.t("modus.notenflug"); },
 *                             // Name auf der Startseite und bei den Rekorden,
 *                             // als Getter, damit er der gewählten Sprache folgt
 *     symbol: "🚀",           // optional, Bild vor dem Namen auf der Startseite
 *                             // (die App setzt es über modusSymbol in js/app.js ein,
 *                             // mit data-symbol = id, damit gezeichnete Symbole es
 *                             // an einer Stelle ersetzen können)
 *     hauptspiel: false,      // true nur beim klassischen Spiel (großer Knopf „Noten üben“)
 *     startKarte: false,      // optional true: eigene, große Karte direkt unter dem
 *                             // Hauptknopf statt Kachel (Tägliche Notenreise)
 *     karteInfo: function () { … },        // optional, bei startKarte: Kurzinfo
 *                             // wie „3 Spiele à 5 Aufgaben“
 *     ansicht: "notenflug",   // zeigt <section id="ansicht-notenflug" class="ansicht"> in index.html
 *     starte: function (umgebung) { … },  // neue Runde beginnen
 *     stoppe: function () { … },          // optional: Runde verwerfen (Timer, Animation, Ton)
 *     reise: true,            // optional: taugt als Etappe der Täglichen Notenreise,
 *                             // beachtet dann umgebung.aufgaben
 *     kachelInfo: function (status) { … }, // optional: kurzer Statustext unter dem Namen
 *                             // auf Kachel oder Karte; status = { tagesreise }
 *     fehlerUeben: true       // optional: Nach einer Runde mit Fehlern bietet das
 *                             // Ergebnis „Fehler üben“ an (braucht `verlauf` im Ergebnis)
 *   });
 *
 * Die Datei wird in index.html vor js/app.js eingebunden. Die App zeigt den
 * Modus dann auf der Startseite (ohne startKarte als Kachel unter „Mehr
 * Spiele“, in der Reihenfolge der Anmeldung) und bei den Rekorden.
 *
 * Die App ruft `starte(umgebung)` bei jedem Start und bei „Noch eine Runde“
 * auf. `umgebung` enthält:
 *   noten          erzeugte Noten der aktuellen Einstellungen (siehe js/noten.js).
 *                  `note.antwort` ist das, was als Antwort zählt: im einfachen
 *                  Modus der Buchstabe ("D", "Fis", "Es"), im genauen der Name
 *                  ("d²", "fis¹"). `note.vorzeichen` ist 0, 1 (♯) oder -1 (♭),
 *                  `note.halbton` die Tonhöhe (fis und ges gleich), `note.stufe`
 *                  die Stufe des Stammtons (fis¹ steht wie f¹ im System).
 *   antworten      die Antwortknöpfe { name, anzeige, stufe, oktave, buchstabe, vorzeichen },
 *                  `name` ist der sprachunabhängige Schlüssel und wird an
 *                  SpielLogik.antworte gegeben, `anzeige` die Beschriftung.
 *                  Genau: eindeutige Notennamen, tief nach hoch. Einfach: nur die
 *                  vorkommenden Antworten C Cis D Es … H (stufe und oktave null).
 *   namen          eindeutige genaue Notennamen (Noten.ton), tief nach hoch, in beiden Modi
 *   antwortmodus   "einfach" oder "genau". Für andere Antworten (Klaviertaste,
 *                  gesetzte Position) liefert Noten.antwortSchluessel(note,
 *                  antwortmodus) den Schlüssel zum Vergleich. Rückmeldungen
 *                  nennen immer den genauen Namen.
 *                  Sprache: `name` und `antwort` sind deutsche Schlüssel und
 *                  ändern sich nie. Angezeigt werden `note.anzeige` (c¹ oder C4)
 *                  und `note.antwortAnzeige` (einfach „Fis“ oder „F♯“). Alle
 *                  Texte kommen aus js/texte.js über Texte.t(…).
 *   bereich        [tiefste, höchste Position] für Notensystem.zeichne(…, { bereich })
 *   einstellungen  { schluessel: ["violin", "bass"], noten: [Kennungen], merktiere, antwortmodus }
 *   schwierig      Notenkennungen, die zuletzt Mühe gemacht haben
 *   aufgaben       optional: Zahl der Aufgaben, zum Beispiel 5 in der Notenreise.
 *                  Fehlt sie, gilt die normale Rundenlänge (10). Modi mit
 *                  `reise: true` geben sie an SpielLogik.neueRunde weiter.
 *   tagesreise     { heute, serie }: Notenreise heute schon geschafft?
 *                  Tage in Folge (siehe SpielLogik.tagesreiseStatus)
 *   zeigeAnsicht(name)        blendet die Ansicht des Modus ein, mit `name`
 *                             eine andere Ansicht (für die Notenreise)
 *   zeigeTier(el, stimmung)   zeichnet das gewählte Begleittier ("normal", "froh", "oje")
 *   merkhilfe(note)           { tier, name, text, zusatz } oder null, wenn Merktiere aus sind.
 *                             zusatz (optional): „nur einen Halbton höher“ bei Vorzeichen-Noten
 *   laeuft()                  false, sobald die Runde verworfen oder beendet ist
 *   beende(ergebnis)          schließt die Runde ab. Die App nimmt pro Start nur
 *                             den ersten Aufruf an, verbucht Sterne, Rekord und
 *                             neue Tiere und zeigt den Ergebnisbildschirm: Überschrift
 *                             (titel), Fortschritt zum nächsten Tier mit Silhouette,
 *                             Details und bei einem Top-5-Rekord den Knopf
 *                             „Rekord speichern“, der die Namensabfrage öffnet.
 *
 * `ergebnis` für beende():
 *   gesamt        Punkte für die Rekorde
 *   neueSterne    Sterne für die gemeinsame Sammlung
 *   rekordSterne  optional, Sterne im Rekordeintrag (sonst neueSterne)
 *   titel         Überschrift mit der Kernzahl, zum Beispiel „9 von 10 richtig“
 *                 (ende.richtigVon) oder bei Spielen ohne Aufgabenzahl „14 Noten
 *                 richtig“ (Notenflug), „6 Paare in 11 Zügen“ (Memory)
 *   spruch        Satz des Begleittiers
 *   stimmung      "froh" oder "normal"
 *   zeilen        [[Bezeichnung, Wert], …] Details vor der Gesamtpunktzahl
 *   schwierig     optional { gefragt: [Kennungen], neu: [Kennungen] }
 *   tagesreise    optional true: Die Tägliche Notenreise ist geschafft. Die App
 *                 vergibt dann den Extrastern (höchstens einmal pro Kalendertag)
 *                 und zählt die Tagesserie weiter.
 *   verlauf       optional [{ note, richtig }, …] (runde.verlauf). Bei Modi mit
 *                 `fehlerUeben: true` wählt die App daraus die Noten für
 *                 „Fehler üben“ (SpielLogik.uebungsNoten).
 *
 * Klassische Wertung: Runden laufen immer bis zur letzten Aufgabe, auch nach
 * drei Fehlern (die Sterne sinken bis 0). Nur der Notenflug endet nach drei
 * Fehlern. `klassischesEnde` (unten) liefert zusätzlich `geschafft` (immer
 * true), `richtige`, `aufgaben` und immer `verlauf`. Die Notenreise wertet
 * damit ihre Etappen aus und sammelt den Verlauf der Etappen, deren Modus
 * `fehlerUeben` hat.
 *
 * Buchstabentasten
 * ----------------
 * Modi mit Antwortknöpfen nutzen die gemeinsame Tastenlogik tastenEingabe
 * (unten): Buchstabe, Shift + Buchstabe für ♯ oder ♭, im genauen Modus bei
 * mehreren Oktaven die Oktavziffer. Unter den Knöpfen steht dafür ein
 * Element mit der Klasse `tasten-zeile` (Tipp und getippter Anfang).
 *
 * Ruhige Spielfläche
 * ------------------
 * Reihenfolge in jeder Spielansicht: Kopfzeile, Notensystem, Antworten (Knöpfe,
 * Klaviatur, Steuerung), darunter die Rückmeldung (Tier, Merkhilfe, Hinweis,
 * „Weiter“). Zwischen Aufgabe und Rückmeldung bewegen sich Notensystem und
 * Antworten nicht: Wächst die Rückmeldung, wächst nur der Bereich darunter.
 * Dafür zeichnen die Modi das System mit `namensPlatz` (Hilfe namensPlatz
 * unten), damit die Beschriftung nach der Antwort Breite und Höhe nicht
 * ändert, und zeigen „Weiter“ über die Hilfe zeigeWeiter. Nach der Antwort
 * hinterlegt `markiere: true` Linie oder Zwischenraum der Note.
 *
 * Fehler üben
 * -----------
 * Kein eigener Modus (erscheint nicht auf der Startseite und bei den
 * Rekorden), sondern eine eigene Ansicht #ansicht-ueben mit der Datei
 * js/fehler-ueben.js. Die App startet sie vom Ergebnis aus mit
 * FehlerUeben.starte(umgebung) und bricht sie beim Verlassen mit
 * FehlerUeben.stoppe() ab. Ablauf und Auswahl der Noten stehen in
 * js/spiel-logik.js (uebungsNoten, neueUebung …). Die Übung nutzt die
 * Antwortknöpfe (antwortKnoepfe unten) und die gemeinsame Klaviatur aus
 * js/klaviatur.js, verbucht nichts und speichert nichts.
 *
 * Zurück-Knöpfe mit der Klasse `knopf-zurueck` führen zur Startseite. Die App
 * ruft dabei `stoppe()` auf und verwirft die Runde ohne Ergebnis.
 *
 * Gemeinsame Hilfen für mehrere Modi stehen unter `Modi.hilfen`.
 */
(function (root) {
  "use strict";

  var liste = [];
  function t(schluessel, werte) { return root.Texte.t(schluessel, werte); }

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
   * Oktave (oder Vorzeichen im genauen Modus) steht jede Oktave in einer
   * eigenen Reihe (tief unten, hoch oben), gleiche Buchstaben stehen
   * untereinander. Vorzeichen-Noten einer Oktave stehen in einer eigenen Reihe
   * darüber (fis¹ über f¹), bei Platzkonflikt (dis¹ und des¹) Kreuz und B
   * getrennt. `beiKlick(name)` wird beim Antippen aufgerufen.
   */
  function antwortKnoepfe(box, antworten, beiKlick) {
    box.innerHTML = "";
    var reihen = {};
    var oktaven = {};
    antworten.forEach(function (a) {
      oktaven[a.oktave] = true;
      var vz = a.vorzeichen && a.oktave !== null ? a.vorzeichen : 0;
      var k = a.oktave + ":" + vz;
      if (!reihen[k]) reihen[k] = [];
      reihen[k].push(a);
    });
    // Kreuz und B einer Oktave in eine Reihe, wenn kein Buchstabe doppelt vorkommt.
    var liste = [];
    // Object.keys liefert ganzzahlige Oktaven aufsteigend, tief zuerst.
    Object.keys(oktaven).forEach(function (o) {
      var stamm = reihen[o + ":0"], kreuz = reihen[o + ":1"] || [], b = reihen[o + ":-1"] || [];
      if (stamm) liste.push(stamm);
      var doppelt = kreuz.some(function (x) { return b.some(function (y) { return y.buchstabe === x.buchstabe; }); });
      if (doppelt) { liste.push(kreuz); liste.push(b); }
      else if (kreuz.length + b.length) liste.push(kreuz.concat(b));
    });
    var einfach = liste.length === 1;
    box.classList.toggle("antworten-einfach", einfach);
    box.classList.toggle("antworten-oktaven", !einfach);
    var knoepfe = [];
    liste.forEach(function (eintraege) {
      var reihe = document.createElement("div");
      reihe.className = "antwort-reihe";
      eintraege.forEach(function (a) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "knopf knopf-antwort" + (a.vorzeichen ? " knopf-antwort-vorzeichen" : "");
        b.dataset.name = a.name;
        b.dataset.anzeige = a.anzeige || a.name;
        if (!einfach) b.style.gridColumn = String(root.Noten.BUCHSTABEN.indexOf(a.buchstabe) + 1);
        b.innerHTML = '<span class="antwort-name"></span><span class="antwort-marke" aria-hidden="true"></span>';
        b.querySelector(".antwort-name").textContent = b.dataset.anzeige;
        b.setAttribute("aria-label", b.dataset.anzeige);
        b.addEventListener("click", function () { beiKlick(a.name); });
        reihe.appendChild(b);
        knoepfe.push(b);
      });
      box.appendChild(reihe);
    });
    return knoepfe;
  }

  function sterneText(n) { return t("sterne", { n: n }); }
  function punkteText(n) { return t("punkte", { n: n }); }

  /** Aufgabennummer, zum Beispiel „Aufgabe 3 von 10“. */
  function aufgabeText(runde) { return t("runde.aufgabe", { nr: runde.aufgabe + 1, anzahl: runde.anzahl }); }

  /**
   * Markiert einen Antwortknopf nach der Antwort: Klasse, Zeichen ✓ oder ✗
   * und aria-label „c¹, richtig“. Ohne `richtig` wird er zurückgesetzt.
   */
  function markiereAntwort(b, klasse, richtig) {
    if (klasse) b.classList.add(klasse);
    b.querySelector(".antwort-marke").textContent = richtig === undefined ? "" : (richtig ? "✓" : "✗");
    b.setAttribute("aria-label", richtig === undefined ? b.dataset.anzeige
      : t(richtig ? "runde.richtig" : "runde.falsch", { name: b.dataset.anzeige }));
  }

  /** Sterne und Punkte im Kopf einer Ansicht anzeigen. */
  function zeigeSterne(sterneEl, punkteEl, sterne, gesamt, punkte) {
    sterneEl.innerHTML = sternSymbole(sterne, gesamt);
    sterneEl.setAttribute("aria-label", t("sterne.aria", { n: sterne, gesamt: gesamt }));
    if (punkteEl) punkteEl.textContent = punkteText(punkte);
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
    var text = document.getElementById(id + "-text");
    text.textContent = hilfe.text;
    if (hilfe.zusatz) {
      // Vorzeichen-Note mit dem Tier des Stammtons: „nur einen Halbton höher“ etwas kleiner darunter
      var zusatz = document.createElement("span");
      zusatz.className = "merkhilfe-zusatz";
      zusatz.textContent = hilfe.zusatz;
      text.appendChild(document.createTextNode(" "));
      text.appendChild(zusatz);
    }
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
    if (e.richtige === e.aufgaben) spruch = t("ende.profi");
    else if (e.neueSterne === 0) spruch = t("ende.nochmal");
    else spruch = t("ende.toll");
    umgebung.beende({
      gesamt: e.gesamt,
      neueSterne: e.neueSterne,
      titel: t("ende.richtigVon", { richtige: e.richtige, aufgaben: e.aufgaben }),
      spruch: spruch,
      stimmung: e.neueSterne > 0 ? "froh" : "normal",
      zeilen: [
        [t("ende.punkteDafuer"), String(e.punkte)],
        [t("ende.bonus"), e.bonus + (e.bonus > 0 ? " (" + sterneText(e.verbleibendeSterne) + " × " + L.REGELN.bonusProStern + ")" : "")]
      ],
      schwierig: e.schwierig,
      verlauf: runde.verlauf.slice(),
      geschafft: true,  // Runden laufen immer bis zur letzten Aufgabe
      richtige: e.richtige,
      aufgaben: e.aufgaben
    });
  }

  /**
   * Zeichenzahl des längsten Notennamens der Auswahl (c¹ = 2, fis¹ = 4, F♯4 = 3)
   * für Notensystem.zeichne(…, { namensPlatz }). So bleibt das System gleich
   * groß, wenn nach der Antwort der Name neben der Note erscheint.
   */
  function namensPlatz(umgebung) {
    return (umgebung.namen || []).reduce(function (max, n) {
      return Math.max(max, String(n.anzeige || n.name || "").length);
    }, 0);
  }

  /**
   * Zeigt „Weiter“ nach einer falschen Antwort und setzt den Fokus darauf.
   * Die Seite scrollt nur so weit wie nötig, damit der Knopf sichtbar wird.
   * Notensystem und Antworten stehen darüber und bleiben so möglichst im Bild.
   */
  function zeigeWeiter(knopf) {
    knopf.hidden = false;
    knopf.focus({ preventScroll: true });
    if (knopf.scrollIntoView) knopf.scrollIntoView({ block: "nearest" });
  }

  /* ---------- Buchstabentasten ---------- */

  var WARTEN_AUF_ZIFFER = 1000; // Millisekunden, die der genaue Modus auf eine Oktavziffer wartet

  /** Hat das Gerät eine Maus oder ein Touchpad (und damit meist eine Tastatur)? */
  function tastaturGeraet() {
    return !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }

  /**
   * Antwortknöpfe zu einer getippten Buchstabentaste (siehe tastenEingabe):
   * ohne Shift der Stammton, mit Shift die Note mit ♯ oder, wenn es zum
   * Buchstaben nur eine ♭-Note gibt, diese. Deutsch ist die Taste B die Note
   * B (h mit ♭), H die Note H; englisch ist B die Note B, Shift + B dann B♭.
   * Liefert { kandidaten, buchstabe, vorzeichen } oder null bei anderen Tasten.
   */
  function tastenKandidaten(antworten, taste, shift) {
    var klein = String(taste || "").toLowerCase();
    var buchstabe, vorzeichen = null;
    if (root.Texte.sprache() !== "en" && klein === "b") {
      buchstabe = "h";
      vorzeichen = -1;
    } else {
      buchstabe = root.Noten.tasteZuBuchstabe(klein);
      if (!buchstabe) return null;
    }
    var mitBuchstabe = antworten.filter(function (a) { return a.buchstabe === buchstabe; });
    if (vorzeichen === null) {
      if (!shift) vorzeichen = 0;
      else vorzeichen = mitBuchstabe.some(function (a) { return a.vorzeichen === 1; }) ? 1 : -1;
    }
    return {
      buchstabe: buchstabe,
      vorzeichen: vorzeichen,
      kandidaten: mitBuchstabe.filter(function (a) { return (a.vorzeichen || 0) === vorzeichen; })
    };
  }

  /**
   * Gemeinsame Tastenlogik für Antwortknöpfe (Notenflug, Welche Note ist das?).
   *   Einfach: Buchstabe = Stammton, Shift + Buchstabe = ♯ (oder die einzige ♭-Note).
   *   Genau:   Ist der Buchstabe unter den Antworten eindeutig, zählt er sofort.
   *            Sonst wartet das Spiel bis zu 1 Sekunde auf die Oktavziffer:
   *            deutsch die Hochzahl (1 für c¹, 0 oder keine für c; ohne Note
   *            der kleinen Oktave zählt „keine“ für die große, also C),
   *            englisch die Ziffer (4 für C4). Die Anzeige zeigt den Anfang („d…“).
   * `optionen`:
   *   antworten()      aktuelle Antwortknöpfe (umgebung.antworten)
   *   offen()          true, solange eine Antwort angenommen wird
   *   beiAntwort(name) wie ein Klick auf den Antwortknopf
   *   anzeige          Element unter den Knöpfen: Tipp auf Geräten mit Tastatur,
   *                    beim Warten auf die Ziffer der getippte Anfang
   * Liefert { taste(ev), zuruecksetzen() }. Der Modus ruft taste(ev) im
   * keydown-Handler auf, wenn seine Ansicht sichtbar ist, und zuruecksetzen()
   * bei jeder neuen Aufgabe.
   */
  function tastenEingabe(optionen) {
    var wartend = null;   // { kandidaten, text }
    var timer = null;

    function zeige() {
      var el = optionen.anzeige;
      if (!el) return;
      el.classList.toggle("tippt", !!wartend);
      el.classList.toggle("tasten-tipp-an", !!wartend || tastaturGeraet());
      el.textContent = wartend ? wartend.text + "…" : (tastaturGeraet() ? t("tasten.tipp") : "");
    }

    function zuruecksetzen() {
      clearTimeout(timer);
      timer = null;
      wartend = null;
      zeige();
    }

    function antworte(a) {
      zuruecksetzen();
      if (a && optionen.offen()) optionen.beiAntwort(a.name);
    }

    function oktaveZurZiffer(ziffer) {
      var z = Number(ziffer);
      if (root.Texte.sprache() === "en") return z;
      return z === 0 ? 3 : 3 + z;   // deutsch: c = 0 oder keine, c¹ = 1, c² = 2 …
    }

    /** Ohne Ziffer nach 1 Sekunde: deutsch die kleine Oktave (c), sonst die einzige große (C). */
    function ohneZiffer() {
      var w = wartend;
      if (!w || root.Texte.sprache() === "en") { zuruecksetzen(); return; }
      var klein = w.kandidaten.filter(function (a) { return a.oktave === 3; });
      var gross = w.kandidaten.filter(function (a) { return a.oktave < 3; });
      antworte(klein[0] || (gross.length === 1 ? gross[0] : null));
    }

    function taste(ev) {
      if (ev.altKey || ev.ctrlKey || ev.metaKey || !optionen.offen()) return false;
      if (wartend && /^[0-9]$/.test(ev.key)) {
        var oktave = oktaveZurZiffer(ev.key);
        var treffer = wartend.kandidaten.filter(function (a) { return a.oktave === oktave; });
        ev.preventDefault();
        antworte(treffer[0] || null);
        return true;
      }
      var k = tastenKandidaten(optionen.antworten(), ev.key, ev.shiftKey);
      if (!k) return false;
      if (k.kandidaten.length === 0) { zuruecksetzen(); return false; }
      ev.preventDefault();
      if (k.kandidaten.length === 1) {
        antworte(k.kandidaten[0]);
        return true;
      }
      // Genau mit mehreren Oktaven: auf die Ziffer warten
      zuruecksetzen();
      var text = root.Texte.sprache() === "en"
        ? root.Noten.buchstabenAnzeige(k.buchstabe, k.vorzeichen)
        : root.Noten.buchstabenAnzeige(k.buchstabe, k.vorzeichen).toLowerCase();
      wartend = { kandidaten: k.kandidaten, text: text };
      timer = setTimeout(ohneZiffer, WARTEN_AUF_ZIFFER);
      zeige();
      return true;
    }

    zeige();
    return { taste: taste, zuruecksetzen: zuruecksetzen };
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
      punkteText: punkteText,
      aufgabeText: aufgabeText,
      markiereAntwort: markiereAntwort,
      zeigeSterne: zeigeSterne,
      antwortKnoepfe: antwortKnoepfe,
      zeigeMerkhilfe: zeigeMerkhilfe,
      klassischesEnde: klassischesEnde,
      namensPlatz: namensPlatz,
      zeigeWeiter: zeigeWeiter,
      tastenKandidaten: tastenKandidaten,
      tastenEingabe: tastenEingabe,
      tastaturGeraet: tastaturGeraet,
      mische: mische
    }
  };
})(this);
