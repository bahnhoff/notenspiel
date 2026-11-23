/*
 * Oberfläche: Ansichten wechseln, Modi starten und verbuchen, Einstellungen,
 * Tiersammlung, Rekorde mit Namen, Spielstand speichern, Sprache umschalten.
 * Alle Texte kommen aus js/texte.js.
 * Die Spielmodi selbst stehen in js/modi/ (Schnittstelle: js/modi.js).
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var N = window.Noten;
  var K = window.NOTEN_KONFIGURATION || {};
  var H = window.Modi.hilfen;
  var T = window.Texte;
  var t = T.t;
  var SPEICHER_SCHLUESSEL = "welche-note-ist-das.spielstand.v1";

  var speicherVerfuegbar = true;
  var stand = ladeSpielstand();
  T.setzeSprache(stand.sprache);
  var aktiverModus = null;   // laufender oder zuletzt gespielter Modus
  var startNr = 0;           // jede gestartete Runde bekommt eine neue Nummer
  var laufendeNr = -1;       // Nummer der Runde, die noch verbucht werden darf
  var offenerRekord = null;  // { modus, nr } für die Namensabfrage
  var rekordModus = null;    // Modus des offenen Rekords (Text der Namensabfrage)
  var uebungsNoten = [];     // Noten für „Fehler üben“ aus der letzten Runde

  function $(id) { return document.getElementById(id); }

  /* ---------- Speicher ---------- */

  function speicher() {
    try {
      var s = window.localStorage;
      var probe = SPEICHER_SCHLUESSEL + ".probe";
      s.setItem(probe, "1");
      s.removeItem(probe);
      return s;
    } catch (e) {
      return null;
    }
  }

  function ladeSpielstand() {
    var s = speicher();
    var geladen;
    if (!s) {
      speicherVerfuegbar = false;
      geladen = L.leererSpielstand();
    } else {
      try {
        var roh = s.getItem(SPEICHER_SCHLUESSEL);
        geladen = L.bereinigeSpielstand(roh ? JSON.parse(roh) : null);
      } catch (e) {
        geladen = L.leererSpielstand();
      }
    }
    // Fehlende oder alte Einstellungen werden in die aktuelle Form mit Notenlisten übersetzt.
    geladen.einstellungen = N.einstellungen(K, geladen.einstellungen);
    // Ohne gemerkte Sprache (erster Start, ältere Spielstände) gilt die Browsersprache.
    if (!geladen.sprache) geladen.sprache = T.browserSprache(window.navigator && window.navigator.language);
    return geladen;
  }

  function speichereSpielstand() {
    var s = speicher();
    if (!s) return;
    try {
      s.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(stand));
    } catch (e) {
      /* Speicher voll oder gesperrt: Das Spiel läuft trotzdem weiter. */
    }
  }

  /* ---------- Hilfen ---------- */

  function tierName(id) {
    var t = L.tierVon(id);
    return t ? t.name : "";
  }

  function zeigeTier(element, stimmung) {
    element.innerHTML = window.Tiere.zeichne(stand.tier, stimmung, tierName(stand.tier));
    element.className = element.className.replace(/\s*stimmung-\S+/g, "") + " stimmung-" + stimmung;
  }

  function sterneText(anzahl) {
    return H.sterneText(anzahl);
  }

  function element(tag, klasse, text) {
    var el = document.createElement(tag);
    if (klasse) el.className = klasse;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function auswahl() {
    return N.fuerEinstellungen(K, stand.einstellungen);
  }

  /** Reicht die Auswahl zum Spielen? Mindestens 3 verschiedene Antworten (siehe Noten.auswahlReicht). */
  function auswahlReicht(a) {
    return N.auswahlReicht(a);
  }

  /** Kurzbeschreibung der Noten eines Schlüssels, zum Beispiel „c¹ bis g¹“ oder „c¹, e¹, g¹“. */
  function notenText(noten) {
    if (noten.length === 0) return t("auswahl.keine");
    var erste = noten[0], letzte = noten[noten.length - 1];
    if (noten.length === 1) return erste.anzeige;
    var lueckenlos = noten.every(function (n) { return !n.vorzeichen; }) && letzte.stufe - erste.stufe === noten.length - 1;
    if (lueckenlos) return t("auswahl.bis", { von: erste.anzeige, bis: letzte.anzeige });
    if (noten.length <= 5) return noten.map(function (n) { return n.anzeige; }).join(", ");
    return t("auswahl.viele", { n: noten.length, von: erste.anzeige, bis: letzte.anzeige });
  }

  function auswahlText(a) {
    return stand.einstellungen.schluessel.map(function (s) {
      return N.SCHLUESSEL[s].name + ": " + notenText(a.noten.filter(function (n) { return n.schluessel === s; }));
    }).join(" · ");
  }

  /** Hinweis auf der Startseite, wenn die Auswahl nicht reicht. */
  function zuWenigText(a) {
    return t(a.antwortmodus === "einfach" ? "start.zuWenigEinfach" : "start.zuWenigGenau", { n: N.MINDEST_NOTEN });
  }

  /* ---------- Ansichten ---------- */

  function zeigeAnsicht(name) {
    Array.prototype.forEach.call(document.querySelectorAll("section.ansicht"), function (s) {
      s.hidden = s.id !== "ansicht-" + name;
    });
    window.scrollTo(0, 0);
    var titel = $("titel-" + name) || document.querySelector("#ansicht-" + name + " h1");
    if (titel) titel.focus({ preventScroll: true });
  }

  function stoppeModus() {
    laufendeNr = -1;
    if (aktiverModus && aktiverModus.stoppe) aktiverModus.stoppe();
    window.FehlerUeben.stoppe();
  }

  function zurStartseite() {
    // Eine laufende Runde wird ohne Ergebniseintrag verworfen.
    stoppeModus();
    offenerRekord = null;
    zeigeTier($("start-tier"), "normal");
    $("hinweis-speicher").hidden = speicherVerfuegbar;
    var a = auswahl();
    var reicht = auswahlReicht(a);
    $("knopf-start").disabled = !reicht;
    Array.prototype.forEach.call(document.querySelectorAll("#start-modi .knopf-modus, #start-karten .start-karte"), function (b) { b.disabled = !reicht; });
    // Zeile im Hauptknopf: „10 Aufgaben · C bis G“ (Bereich der Antworten aus der Auswahl)
    $("start-unterzeile").textContent = reicht ? t("start.uebenInfo", { n: L.REGELN.aufgabenProRunde,
      von: a.antworten[0].anzeige, bis: a.antworten[a.antworten.length - 1].anzeige }) : "";
    $("start-auswahl").textContent = reicht ? auswahlText(a) : zuWenigText(a);
    $("start-auswahl").classList.toggle("start-auswahl-hinweis", !reicht);
    aktualisiereKacheln();
    zeigeAnsicht("start");
  }

  /* ---------- Modi starten und verbuchen ---------- */

  function starteModus(modus) {
    if (!modus) return;
    stoppeModus();
    offenerRekord = null;
    aktiverModus = modus;
    var a = auswahl();
    if (!auswahlReicht(a)) return;
    var nr = ++startNr;
    laufendeNr = nr;
    modus.starte({
      noten: a.noten,
      antworten: a.antworten,
      namen: a.namen,
      antwortmodus: a.antwortmodus,
      bereich: a.bereich,
      einstellungen: JSON.parse(JSON.stringify(stand.einstellungen)),
      schwierig: stand.schwierig.slice(),
      tagesreise: L.tagesreiseStatus(stand, Date.now()),
      memoryStufe: stand.memoryStufe,
      merkeMemoryStufe: function (stufe) {
        if (stufe !== "normal" && stufe !== "schwer") return;
        stand.memoryStufe = stufe;
        speichereSpielstand();
      },
      zeigeAnsicht: function (name) { zeigeAnsicht(name || modus.ansicht || modus.id); },
      zeigeTier: zeigeTier,
      merkhilfe: merkhilfe,
      laeuft: function () { return laufendeNr === nr; },
      beende: function (ergebnis) {
        if (laufendeNr !== nr) return false; // jede Runde nur einmal verbuchen
        laufendeNr = -1;
        verbuche(modus, ergebnis || {});
        return true;
      }
    });
  }

  /**
   * Merktier zur Note, zum Beispiel „d¹ wie Delfin“ oder „D4 – D is for Dolphin“,
   * oder null, wenn ausgeschaltet.
   */
  function merkhilfe(note) {
    if (!stand.einstellungen.merktiere || !note || !note.tier || !window.Tiere.hat(note.tier)) return null;
    var name = window.Tiere.name(note.tier);
    var werte = { name: note.anzeige || note.name, buchstabe: N.buchstabenAnzeige(note.buchstabe, 0), tier: name };
    // Vorzeichen-Note ohne eigenes Tier: „cis¹ – C wie Chamäleon, nur einen Halbton höher“
    if (note.tierVomStamm) {
      return { tier: note.tier, name: name, text: t("merkhilfe.stamm", werte),
        zusatz: t(note.vorzeichen > 0 ? "merkhilfe.hoeher" : "merkhilfe.tiefer") };
    }
    return { tier: note.tier, name: name, text: t("merkhilfe.text", werte) };
  }

  function verbuche(modus, e) {
    var v = L.verbucheErgebnis(stand, modus.id, e, Date.now());
    stand = v.stand;
    speichereSpielstand();
    zeigeErgebnis(modus, e, v);
  }

  /* ---------- Ergebnis ---------- */

  function zeigeErgebnis(modus, e, v) {
    $("titel-ergebnis").textContent = e.titel || t("ende.geschafft");
    zeigeTier($("ergebnis-tier"), e.stimmung || "froh");
    $("ergebnis-spruch").textContent = e.spruch || t("ende.toll");

    var liste = $("ergebnis-liste");
    liste.innerHTML = "";
    function zeile(bezeichnung, wert, klasse) {
      var div = element("div", klasse);
      div.appendChild(element("dt", "", bezeichnung));
      var dd = element("dd");
      if (typeof wert === "string") dd.textContent = wert; else dd.appendChild(wert);
      div.appendChild(dd);
      liste.appendChild(div);
    }
    (e.zeilen || []).forEach(function (z) { zeile(z[0], String(z[1])); });
    var reise = v.tagesreise;
    if (reise) {
      zeile(t("ergebnis.extrastern"), reise.extrastern ? "★ 1" : t("ergebnis.schonBekommen"));
      zeile(t("ergebnis.serie"), t("tage", { n: reise.serie }));
    }
    zeile(t("ergebnis.gesamt"), H.punkteText(e.gesamt || 0), "ergebnis-gesamt");
    var sterne = element("span");
    var anzahl = (e.neueSterne || 0) + (reise && reise.extrastern ? 1 : 0);
    if (anzahl > 0) sterne.innerHTML = '<span class="sterne-reihe" aria-hidden="true">' + H.sternSymbole(anzahl, anzahl) + "</span> ";
    sterne.appendChild(document.createTextNode(String(anzahl)));
    zeile(t("ergebnis.neueSterne"), sterne);

    zeigeTierFortschritt();

    var box = $("neues-tier");
    var neuesTier = v.neueTiere.length ? v.neueTiere[v.neueTiere.length - 1] : null;
    if (neuesTier) {
      box.innerHTML = '<div class="tier-mittel">' + window.Tiere.zeichne(neuesTier.id, "froh", neuesTier.name) + "</div>" +
        "<p><strong></strong><br></p>";
      box.querySelector("strong").textContent = t("ergebnis.neuesTier", { name: neuesTier.name });
      box.querySelector("p").appendChild(document.createTextNode(t("ergebnis.auswaehlen")));
      box.hidden = false;
    } else {
      box.hidden = true;
      box.innerHTML = "";
    }

    // „Fehler üben“ nur bei Modi, die es anbieten, und mindestens einem Fehler
    uebungsNoten = modus.fehlerUeben ? L.uebungsNoten(e.verlauf) : [];
    $("knopf-ueben").hidden = uebungsNoten.length === 0;
    // Mit „Fehler üben“ ist das der Hauptknopf, „Noch eine Runde“ tritt zurück.
    $("knopf-nochmal").classList.toggle("knopf-haupt", uebungsNoten.length === 0);
    $("knopf-nochmal").classList.toggle("knopf-neben", uebungsNoten.length > 0);

    // Top-5-Rekord: erst ein Knopf „Rekord speichern“, die Namensabfrage öffnet sich beim Antippen.
    $("rekord-name").hidden = true;
    offenerRekord = v.rekord || null;
    if (offenerRekord && e.variante) offenerRekord.variante = e.variante;
    rekordModus = v.rekord ? modus : null;
    $("rekord-zeile").hidden = !v.rekord;
    if (v.rekord) $("rekord-zeile-info").textContent = t("rekordName.neu", { platz: v.rekord.platz + 1, modus: rekordTitel(modus, offenerRekord) });

    zeigeAnsicht("ergebnis");
  }

  /** „2 von 5 Sternen bis zum nächsten Tier“ mit grauer Silhouette des vorgemerkten Tiers. */
  function zeigeTierFortschritt() {
    var box = $("tier-fortschritt");
    var n = L.naechstesTier(stand);
    if (!n) { box.hidden = true; return; }
    $("tier-fortschritt-bild").innerHTML = n.id ? window.Tiere.zeichne(n.id, "normal", t("ergebnis.geheim"), true) : "";
    $("tier-fortschritt-bild").hidden = !n.id;
    $("tier-fortschritt-sterne").innerHTML = H.sternSymbole(n.gesammelt, n.schritt);
    $("tier-fortschritt-text").textContent = t("ergebnis.naechstesTier", { gesammelt: n.gesammelt, schritt: n.schritt });
    box.hidden = false;
  }

  /* ---------- Fehler üben ---------- */

  /**
   * Startet die Übung zu den Fehlern der letzten Runde (js/fehler-ueben.js).
   * Sie verbucht nichts: keine Punkte, Sterne oder Rekorde, Spielstand unverändert.
   */
  function starteUebung() {
    var modus = aktiverModus;
    var a = auswahl();
    if (uebungsNoten.length === 0 || !auswahlReicht(a)) return;
    stoppeModus();
    offenerRekord = null;
    window.FehlerUeben.starte({
      noten: uebungsNoten.slice(),
      antworten: a.antworten,
      namen: a.namen,
      antwortmodus: a.antwortmodus,
      bereich: a.bereich,
      zeigeAnsicht: function () { zeigeAnsicht("ueben"); },
      zeigeTier: zeigeTier,
      merkhilfe: merkhilfe,
      nochmal: function () { starteModus(modus || hauptspiel); },
      startseite: zurStartseite
    });
  }

  /* ---------- Namen in den Rekorden ---------- */

  /** Name des Modus für die Rekordzeile, mit Variante: „Noten-Memory · Schwer“. */
  function rekordTitel(modus, rekord) {
    return modus.name + (rekord && rekord.variante ? " · " + t("variante." + rekord.variante) : "");
  }

  function zeigeNamensabfrage(modus, rekord) {
    offenerRekord = rekord;
    $("rekord-name").hidden = false;
    $("rekord-name-info").textContent = t("rekordName.neu", { platz: rekord.platz + 1, modus: rekordTitel(modus, rekord) });
    $("rekord-name-fertig").textContent = "";
    $("name-formular").hidden = false;
    $("knopf-ohne-name").hidden = false;
    var eingabe = $("name-eingabe");
    eingabe.value = stand.namen[0] || "";

    var schnell = $("namen-schnellwahl");
    schnell.innerHTML = "";
    stand.namen.forEach(function (name, i) {
      var b = element("button", "knopf " + (i === 0 ? "knopf-haupt" : "knopf-neben") + " knopf-name", name);
      b.type = "button";
      b.addEventListener("click", function () { speichereName(name); });
      schnell.appendChild(b);
    });
    schnell.hidden = stand.namen.length === 0;
  }

  function speichereName(name) {
    if (!offenerRekord) return;
    var gesetzt = L.setzeRekordName(stand, offenerRekord.modus, offenerRekord.nr, name);
    speichereSpielstand();
    offenerRekord = null;
    $("namen-schnellwahl").hidden = true;
    $("name-formular").hidden = true;
    $("knopf-ohne-name").hidden = true;
    $("rekord-name-fertig").textContent = gesetzt ? t("rekordName.fuer", { name: gesetzt }) : t("rekordName.ohneGespeichert");
    $("knopf-nochmal").focus({ preventScroll: true });
  }

  // „Rekord speichern“ öffnet die Namensabfrage.
  $("knopf-rekord-speichern").addEventListener("click", function () {
    if (!offenerRekord || !rekordModus) return;
    $("rekord-zeile").hidden = true;
    zeigeNamensabfrage(rekordModus, offenerRekord);
    $("name-eingabe").focus({ preventScroll: true });
    $("rekord-name").scrollIntoView({ block: "nearest" });
  });

  $("name-formular").addEventListener("submit", function (ev) {
    ev.preventDefault();
    speichereName($("name-eingabe").value);
  });
  $("knopf-ohne-name").addEventListener("click", function () { speichereName(""); });

  /* ---------- Meine Tiere ---------- */

  function zeigeTiere(fokusTier) {
    $("tiere-sterne").innerHTML = '<span class="stern stern-voll" aria-hidden="true">★</span> <span></span> <strong>' + stand.sterne + "</strong>";
    $("tiere-sterne").querySelector("span:not(.stern)").textContent = t("tiere.gesammelt");
    var naechstes = L.naechstesTier(stand);
    $("tiere-naechstes").textContent = (naechstes
      ? t("tiere.noch", { sterne: sterneText(naechstes.fehlend) })
      : t("tiere.alle")) + t("tiere.entdeckt", { n: stand.entdeckt.length, gesamt: L.TIERE.length });

    var liste = $("tier-liste");
    liste.innerHTML = "";
    L.TIERE.forEach(function (tier) {
      var frei = stand.entdeckt.indexOf(tier.id) !== -1;
      var li = element("li", "tier-karte" + (frei ? "" : " gesperrt") + (tier.selten ? " selten" : ""));
      li.dataset.tier = tier.id;
      if (frei) {
        var gewaehlt = stand.tier === tier.id;
        li.innerHTML = '<div class="tier-mittel">' + window.Tiere.zeichne(tier.id, gewaehlt ? "froh" : "normal", tier.name) + "</div>";
        li.appendChild(element("p", "tier-name", tier.name));
        if (tier.selten) li.appendChild(element("p", "tier-info", t("tiere.selten")));
        var b = element("button", "knopf " + (gewaehlt ? "knopf-gewaehlt" : "knopf-neben"), t(gewaehlt ? "tiere.begleiter" : "tiere.auswaehlen"));
        b.type = "button";
        b.setAttribute("aria-pressed", gewaehlt ? "true" : "false");
        b.setAttribute("aria-label", t(gewaehlt ? "tiere.istBegleiter" : "tiere.alsBegleiter", { name: tier.name }));
        b.addEventListener("click", function () {
          stand.tier = tier.id;
          speichereSpielstand();
          zeigeTiere(tier.id);
        });
        li.appendChild(b);
      } else {
        li.innerHTML = '<div class="tier-mittel">' + window.Tiere.zeichne(tier.id, "normal", t("tiere.unentdeckt"), true) + "</div>";
        li.appendChild(element("p", "tier-name", "???"));
        if (tier.selten) li.appendChild(element("p", "tier-info", t("tiere.seltenAb", { n: L.SELTEN_AB_STERNEN })));
      }
      liste.appendChild(li);
    });
    if (fokusTier) {
      var knopf = liste.querySelector('[data-tier="' + fokusTier + '"] button');
      if (knopf) knopf.focus({ preventScroll: true });
      return;
    }
    zeigeAnsicht("tiere");
  }

  /* ---------- Rekorde ---------- */

  function zeigeRekorde() {
    var inhalt = $("rekorde-inhalt");
    inhalt.innerHTML = "";
    // Nur angemeldete Modi: Rekorde entfernter Modi bleiben im Spielstand, erscheinen hier aber nicht.
    window.Modi.liste().forEach(function (modus) {
      var abschnitt = element("section", "rekord-abschnitt");
      var titelId = "rekorde-" + modus.id;
      // Überschrift mit dem gezeichneten Symbol des Spiels im getönten Kästchen (wie auf der Startseite)
      var h2 = element("h2", "rekord-modus");
      h2.appendChild(modusSymbol(modus));
      h2.appendChild(element("span", "rekord-modus-name", modus.name));
      h2.id = titelId;
      abschnitt.setAttribute("aria-labelledby", titelId);
      abschnitt.appendChild(h2);
      var rekorde = L.sortiereRekorde(stand.rekorde[modus.id] || []).slice(0, L.REGELN.maxRekorde);
      if (rekorde.length === 0) {
        abschnitt.appendChild(element("p", "leer-hinweis", t("rekorde.leer")));
      } else {
        var ol = element("ol", "rekord-liste");
        rekorde.forEach(function (r, i) {
          var li = element("li", "rekord");
          var datum = "";
          try { datum = new Date(r.zeit).toLocaleDateString(t("rekorde.datum")); } catch (e) { datum = ""; }
          li.appendChild(element("span", "rekord-platz", (i + 1) + "."));
          var punkte = li.appendChild(element("span", "rekord-punkte", H.punkteText(r.gesamt)));
          // Variante als kleines Schild hinter den Punkten, zum Beispiel „Schwer“ im Noten-Memory
          if (r.variante) punkte.appendChild(element("span", "rekord-variante", t("variante." + r.variante)));
          var st = element("span", "rekord-sterne");
          st.innerHTML = '<span class="stern stern-voll" aria-hidden="true">★</span> ';
          st.appendChild(document.createTextNode(sterneText(r.sterne)));
          li.appendChild(st);
          // Alte Rekorde haben kein Namensfeld und zeigen keinen Namen.
          if (typeof r.name === "string") {
            li.appendChild(element("span", "rekord-name-text" + (r.name ? "" : " ohne-name"), r.name || t("rekordName.ohne")));
          }
          li.appendChild(element("span", "rekord-datum", datum));
          ol.appendChild(li);
        });
        abschnitt.appendChild(ol);
      }
      inhalt.appendChild(abschnitt);
    });
    zeigeAnsicht("rekorde");
  }

  /* ---------- Einstellungen ---------- */

  var einstellungsHinweis = "";

  /** Speichert eine Änderung, baut die Ansicht neu und setzt den Fokus wieder auf das Bedienelement. */
  function aendereEinstellung(aenderung, fokus) {
    einstellungsHinweis = "";
    aenderung(stand.einstellungen);
    speichereSpielstand();
    baueEinstellungen();
    var el = document.querySelector('#einstellungen-formular [data-fokus="' + fokus + '"]');
    if (el) el.focus({ preventScroll: true });
  }

  /** Kästchen oder Schalter mit Beschriftung. */
  function kaestchen(text, fokus, an, schalter, beiWechsel) {
    var label = element("label", schalter ? "wahl wahl-schalter" : "wahl");
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = an;
    input.dataset.fokus = fokus;
    if (schalter) input.setAttribute("role", "switch");
    input.addEventListener("change", function () { beiWechsel(input.checked); });
    label.appendChild(input);
    label.appendChild(element("span", "wahl-text", text));
    return label;
  }

  function notenGruppe(f, sl, e) {
    var fs = element("fieldset", "einstellung");
    var OKTAVEN = T.liste("einst.oktaven");
    fs.appendChild(element("legend", "", t("einst.noten." + sl)));
    var verfuegbar = N.verfuegbareNoten(K, sl);
    var alleIds = verfuegbar.map(function (n) { return n.id; });
    var stammIds = verfuegbar.filter(function (n) { return !n.vorzeichen; }).map(function (n) { return n.id; });
    // Schnellwahl setzt die Stammtöne dieses Schlüssels, Vorzeichen-Noten bleiben, „Keine“ leert alles.
    function setze(ids, ersetzt) {
      return function (x) {
        x.noten = x.noten.filter(function (id) { return ersetzt.indexOf(id) === -1; }).concat(ids);
      };
    }

    // Schnellwahl: setzt nur die Häkchen dieses Schlüssels.
    var schnell = element("div", "noten-schnellwahl");
    schnell.setAttribute("role", "group");
    schnell.setAttribute("aria-label", t("einst.schnellwahl", { schluessel: N.SCHLUESSEL[sl].name }));
    var wahlen = N.bereichsListe(K, sl).map(function (b) {
      var text = T.sprache() === "en" && b.nameEnglisch ? b.nameEnglisch : b.name;
      return { id: b.id, text: text, info: N.anzeigeName(N.stufe(b.von), 0) + "–" + N.anzeigeName(N.stufe(b.bis), 0), ids: N.bereichsKennungen(K, sl, b.id) };
    }).concat([{ id: "alle", text: t("einst.alle"), ids: stammIds }, { id: "keine", text: t("einst.keine"), ids: [], alles: true }]);
    wahlen.forEach(function (w) {
      var b = element("button", "knopf knopf-klein knopf-schnellwahl");
      b.type = "button";
      b.dataset.fokus = sl + "-schnell-" + w.id;
      b.appendChild(element("span", "schnellwahl-name", w.text));
      if (w.info) b.appendChild(element("span", "schnellwahl-info", w.info));
      b.addEventListener("click", function () { aendereEinstellung(setze(w.ids, w.alles ? alleIds : stammIds), b.dataset.fokus); });
      schnell.appendChild(b);
    });
    fs.appendChild(schnell);

    // Ankreuz-Knöpfe, eine Reihe pro Oktave, Buchstaben in festen Spalten.
    var oktaven = [];
    verfuegbar.forEach(function (n) {
      var letzte = oktaven[oktaven.length - 1];
      if (!letzte || letzte.oktave !== n.oktave) oktaven.push(letzte = { oktave: n.oktave, noten: [] });
      letzte.noten.push(n);
    });
    oktaven.forEach(function (o) {
      var reihe = element("div", "noten-oktave");
      reihe.setAttribute("role", "group");
      var titel = element("p", "noten-oktave-titel", OKTAVEN[o.oktave] || "");
      titel.id = "oktave-" + sl + "-" + o.oktave;
      reihe.setAttribute("aria-labelledby", titel.id);
      reihe.appendChild(titel);
      function wahlKnopf(n) {
        var an = e.noten.indexOf(n.id) !== -1;
        var b = element("button", "noten-wahl" + (an ? " ist-an" : ""));
        b.type = "button";
        b.dataset.fokus = n.id;
        b.setAttribute("aria-pressed", an ? "true" : "false");
        b.setAttribute("aria-label", n.anzeige);
        b.style.gridColumn = String(N.BUCHSTABEN.indexOf(n.buchstabe) % 7 + 1);
        b.appendChild(element("span", "noten-wahl-haken", an ? "✓" : "")).setAttribute("aria-hidden", "true");
        b.appendChild(element("span", "noten-wahl-name", n.anzeige)).setAttribute("aria-hidden", "true");
        b.addEventListener("click", function () {
          aendereEinstellung(function (x) {
            if (an) x.noten = x.noten.filter(function (id) { return id !== n.id; });
            else x.noten = x.noten.concat([n.id]);
          }, n.id);
        });
        return b;
      }
      var gitter = element("div", "noten-gitter");
      o.noten.forEach(function (n) { if (!n.vorzeichen) gitter.appendChild(wahlKnopf(n)); });
      reihe.appendChild(gitter);
      // Vorzeichen-Noten je Oktave in abgesetzten Zeilen „mit ♯“ und „mit ♭“
      [[1, "einst.mitKreuz"], [-1, "einst.mitB"]].forEach(function (art) {
        var noten = o.noten.filter(function (n) { return n.vorzeichen === art[0]; });
        if (noten.length === 0) return;
        var zeile = element("div", "noten-vorzeichen");
        zeile.setAttribute("role", "group");
        zeile.setAttribute("aria-label", t(art[1], { oktave: OKTAVEN[o.oktave] || "" }));
        var titel = zeile.appendChild(element("span", "noten-vorzeichen-titel", t("einst.mit")));
        titel.setAttribute("aria-hidden", "true");
        titel.insertAdjacentHTML("beforeend", window.Notensystem.symbol(art[0]));
        var g = element("div", "noten-gitter noten-gitter-vorzeichen");
        noten.forEach(function (n) { g.appendChild(wahlKnopf(n)); });
        zeile.appendChild(g);
        reihe.appendChild(zeile);
      });
      fs.appendChild(reihe);
    });
    f.appendChild(fs);
  }

  /** Umschalter „Antworten: Einfach / Genau“ als zwei große Knöpfe. */
  function antwortGruppe(f, e) {
    var fs = element("fieldset", "einstellung");
    fs.appendChild(element("legend", "", t("einst.antworten")));
    var schalter = element("div", "antwort-umschalter");
    // Beispiele in der aktuellen Sprache: c¹ und d² (Stufen 28 und 36), englisch C4 und D5
    var c1 = N.anzeigeName(28, 0), d2 = N.anzeigeName(36, 0);
    [
      { id: "einfach", text: t("einst.einfach"), info: "C D E …" },
      { id: "genau", text: t("einst.genau"), info: c1 + " " + d2 + " …" }
    ].forEach(function (w) {
      var an = e.antwortmodus === w.id;
      var b = element("button", "knopf antwort-modus" + (an ? " ist-an" : ""));
      b.type = "button";
      b.dataset.fokus = "antwortmodus-" + w.id;
      b.setAttribute("aria-pressed", an ? "true" : "false");
      b.appendChild(element("span", "antwort-modus-name", (an ? "✓ " : "") + w.text));
      b.appendChild(element("span", "antwort-modus-info", w.info)).setAttribute("aria-hidden", "true");
      b.addEventListener("click", function () {
        aendereEinstellung(function (x) { x.antwortmodus = w.id; }, b.dataset.fokus);
      });
      schalter.appendChild(b);
    });
    fs.appendChild(schalter);
    fs.appendChild(element("p", "antwort-modus-erklaerung", e.antwortmodus === "genau"
      ? t("einst.erklaerungGenau", { a: c1, b: d2 })
      : t("einst.erklaerungEinfach")));
    f.appendChild(fs);
  }

  function baueEinstellungen() {
    var f = $("einstellungen-formular");
    var e = stand.einstellungen;
    f.innerHTML = "";

    antwortGruppe(f, e);

    var fs = element("fieldset", "einstellung");
    fs.appendChild(element("legend", "", t("einst.schluessel")));
    ["violin", "bass"].forEach(function (sl) {
      var an = e.schluessel.indexOf(sl) !== -1;
      fs.appendChild(kaestchen(N.SCHLUESSEL[sl].name, "schluessel-" + sl, an, false, function (neu) {
        if (!neu && e.schluessel.length === 1) {
          // Mindestens ein Schlüssel bleibt angekreuzt.
          baueEinstellungen();
          einstellungsHinweis = t("einst.einSchluessel");
          zeigeEinstellungsHinweis();
          var el = document.querySelector('#einstellungen-formular [data-fokus="schluessel-' + sl + '"]');
          if (el) el.focus({ preventScroll: true });
          return;
        }
        aendereEinstellung(function (x) {
          x.schluessel = ["violin", "bass"].filter(function (s) { return s === sl ? neu : x.schluessel.indexOf(s) !== -1; });
        }, "schluessel-" + sl);
      }));
    });
    f.appendChild(fs);

    var hinweis = element("p", "einstellungen-hinweis");
    hinweis.id = "einstellungen-hinweis";
    hinweis.setAttribute("role", "status");
    f.appendChild(hinweis);

    e.schluessel.forEach(function (sl) { notenGruppe(f, sl, e); });

    var mt = element("fieldset", "einstellung");
    mt.appendChild(element("legend", "", t("einst.merktiere")));
    // Beispiel „d¹ wie Delfin“ oder „D4 – D is for Dolphin“ (d¹ = Stufe 29)
    var beispiel = t("merkhilfe.text", { name: N.anzeigeName(29, 0), buchstabe: "D", tier: window.Tiere.name("delfin") });
    mt.appendChild(kaestchen(t("einst.merktiereText", { beispiel: beispiel }), "merktiere", e.merktiere, true, function (neu) {
      aendereEinstellung(function (x) { x.merktiere = neu; }, "merktiere");
    }));
    f.appendChild(mt);
    f.appendChild(element("p", "einstellungen-info", t("einst.info")));
    zeigeEinstellungsHinweis();
  }

  /** Freundlicher Hinweis oben: zu wenige Noten oder letzter Schlüssel. */
  function zeigeEinstellungsHinweis() {
    var el = $("einstellungen-hinweis");
    if (!el) return;
    var a = auswahl();
    var text = einstellungsHinweis;
    if (!auswahlReicht(a)) {
      var bitte = a.antwortmodus === "einfach"
        ? t("einst.zuWenigEinfach", { c1: N.anzeigeName(28, 0), c2: N.anzeigeName(35, 0), n: N.MINDEST_NOTEN })
        : t("einst.zuWenigGenau", { n: N.MINDEST_NOTEN });
      text = (text ? text + " " : "") + bitte +
        (a.antworten.length ? t("einst.gewaehlt", { liste: a.antworten.map(function (x) { return x.anzeige; }).join(", ") }) : "");
    }
    el.textContent = text;
    el.hidden = !text;
  }

  function zeigeEinstellungen() {
    einstellungsHinweis = "";
    baueEinstellungen();
    zeigeAnsicht("einstellungen");
  }

  /* ---------- Startseite ---------- */

  /**
   * Symbol eines Modus auf der Startseite (Kachel und Karte): die Zeichnung
   * aus js/symbole.js zur Kennung des Modus, nur ohne Zeichnung das Emoji
   * `modus.symbol`. `data-symbol` trägt die Kennung, wie bei den Knöpfen mit
   * der Klasse `knopf-symbol` in index.html.
   */
  function modusSymbol(modus) {
    var el = element("span", "modus-symbol");
    var svg = window.Symbole.zeichne(modus.id);
    if (svg) el.innerHTML = svg;
    else el.textContent = modus.symbol || "";
    el.dataset.symbol = modus.id;
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  /**
   * Baut die Startseite aus den angemeldeten Modi (js/modi.js):
   * hauptspiel → großer Knopf „Noten üben“ (fest in index.html),
   * startKarte → eigene Karte darunter (Tägliche Notenreise),
   * alle anderen → Kacheln unter „Mehr Spiele“. Ein neuer Modus erscheint
   * damit ohne Änderung hier.
   */
  function baueStartseite() {
    var box = $("start-modi");
    var karten = $("start-karten");
    box.innerHTML = "";
    karten.innerHTML = "";
    window.Modi.liste().forEach(function (modus) {
      if (modus.hauptspiel) return;
      var b;
      if (modus.startKarte) {
        // Karte über die ganze Breite: Symbol links, Name, Kurzinfo und Status rechts daneben
        b = element("button", "knopf start-karte");
        var text = element("span", "karte-text");
        text.appendChild(element("span", "karte-name", modus.name));
        if (modus.karteInfo) text.appendChild(element("span", "karte-info", modus.karteInfo()));
        if (modus.kachelInfo) text.appendChild(element("span", "modus-info karte-status"));
        b.appendChild(modusSymbol(modus));
        b.appendChild(text);
        b.appendChild(element("span", "karte-pfeil", "›")).setAttribute("aria-hidden", "true");
        karten.appendChild(b);
      } else {
        // Kachel: Symbol im getönten Kästchen links, Name und kurze Unterzeile rechts
        b = element("button", "knopf knopf-neben knopf-modus");
        b.appendChild(modusSymbol(modus));
        var kachelText = element("span", "modus-text");
        kachelText.appendChild(element("span", "modus-name", modus.name));
        var unter = t("kachel." + modus.id);
        if (unter !== "kachel." + modus.id) kachelText.appendChild(element("span", "modus-unterzeile", unter));
        b.appendChild(kachelText);
        if (modus.kachelInfo) {
          b.classList.add("knopf-modus-info");
          b.appendChild(element("span", "modus-info"));
        }
        box.appendChild(b);
      }
      b.type = "button";
      b.dataset.modus = modus.id;
      b.addEventListener("click", function () { starteModus(modus); });
    });
    karten.hidden = karten.children.length === 0;
    box.hidden = box.children.length === 0;
    $("titel-modi").hidden = box.hidden;
    $("start-modi-anzahl").textContent = t("start.anzahlSpiele", { n: box.children.length });
    $("start-modi-anzahl").hidden = box.hidden;
  }

  /** Kurze Zusatztexte auf Kacheln und Karten, zum Beispiel „Heute geschafft ✓“. */
  function aktualisiereKacheln() {
    var status = { tagesreise: L.tagesreiseStatus(stand, Date.now()) };
    window.Modi.liste().forEach(function (modus) {
      if (!modus.kachelInfo) return;
      var info = document.querySelector('#ansicht-start [data-modus="' + modus.id + '"] .modus-info');
      if (info) info.textContent = modus.kachelInfo(status) || "";
    });
  }

  /* ---------- Sprache ---------- */

  /** Überträgt die gemerkte Sprache auf alle festen Texte und den Umschalter. */
  function wendeSpracheAn() {
    T.setzeSprache(stand.sprache);
    T.wendeAn(document);
    Array.prototype.forEach.call(document.querySelectorAll(".sprach-knopf"), function (b) {
      var an = b.dataset.sprache === T.sprache();
      b.classList.toggle("ist-an", an);
      b.setAttribute("aria-pressed", an ? "true" : "false");
    });
  }

  // Wechsel nur auf der Startseite: übersetzt sofort alle Texte, ohne Neuladen.
  Array.prototype.forEach.call(document.querySelectorAll(".sprach-knopf"), function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.sprache === stand.sprache) return;
      stand.sprache = b.dataset.sprache;
      speichereSpielstand();
      wendeSpracheAn();
      baueStartseite();
      zurStartseite();
      b.focus({ preventScroll: true });
    });
  });

  var hauptspiel = window.Modi.liste().filter(function (m) { return m.hauptspiel; })[0] || window.Modi.liste()[0];

  $("knopf-start").addEventListener("click", function () { starteModus(hauptspiel); });
  $("knopf-nochmal").addEventListener("click", function () { starteModus(aktiverModus || hauptspiel); });
  $("knopf-tiere").addEventListener("click", function () { zeigeTiere(); });
  $("knopf-rekorde").addEventListener("click", zeigeRekorde);
  $("knopf-einstellungen").addEventListener("click", zeigeEinstellungen);
  $("knopf-ergebnis-start").addEventListener("click", zurStartseite);
  $("knopf-ueben").addEventListener("click", starteUebung);
  Array.prototype.forEach.call(document.querySelectorAll(".knopf-zurueck"), function (b) {
    b.addEventListener("click", zurStartseite);
  });

  window.Symbole.setzeEin(document); // gezeichnete Symbole in Menü- und Ergebnisknöpfen
  wendeSpracheAn();
  baueStartseite();
  speichereSpielstand(); // übernimmt eine Migration alter Spielstände sofort
  zurStartseite();
  // Beim ersten Laden nicht den Titel fokussieren, damit kein Fokusrahmen erscheint.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
})();
