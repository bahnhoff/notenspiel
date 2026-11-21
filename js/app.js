/*
 * Oberfläche: Ansichten wechseln, Modi starten und verbuchen, Einstellungen,
 * Tiersammlung, Rekorde mit Namen, Spielstand speichern.
 * Die Spielmodi selbst stehen in js/modi/ (Schnittstelle: js/modi.js).
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var N = window.Noten;
  var K = window.NOTEN_KONFIGURATION || {};
  var H = window.Modi.hilfen;
  var SPEICHER_SCHLUESSEL = "welche-note-ist-das.spielstand.v1";

  var speicherVerfuegbar = true;
  var stand = ladeSpielstand();
  var aktiverModus = null;   // laufender oder zuletzt gespielter Modus
  var startNr = 0;           // jede gestartete Runde bekommt eine neue Nummer
  var laufendeNr = -1;       // Nummer der Runde, die noch verbucht werden darf
  var offenerRekord = null;  // { modus, nr } für die Namensabfrage

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
    if (!geladen.einstellungen) geladen.einstellungen = L.bereinigeEinstellungen(K.standardEinstellungen) || L.bereinigeEinstellungen({});
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
    return anzahl === 1 ? "1 Stern" : anzahl + " Sterne";
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

  function auswahlText() {
    var e = stand.einstellungen;
    return ["violin", "bass"].filter(function (s) {
      return e.schluessel === s || e.schluessel === "beide";
    }).map(function (s) {
      var b = N.bereichVon(K, s, e.bereich[s]);
      return N.SCHLUESSEL[s].name + ": " + (b ? b.von + " bis " + b.bis : "?");
    }).join(" · ");
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
  }

  function zurStartseite() {
    // Eine laufende Runde wird ohne Ergebniseintrag verworfen.
    stoppeModus();
    offenerRekord = null;
    zeigeTier($("start-tier"), "normal");
    $("hinweis-speicher").hidden = speicherVerfuegbar;
    var a = auswahl();
    $("knopf-start").disabled = a.noten.length === 0;
    $("start-auswahl").textContent = a.noten.length ? auswahlText() : "Der gewählte Bereich enthält keine Noten. Prüfe js/noten-konfiguration.js.";
    zeigeAnsicht("start");
  }

  /* ---------- Modi starten und verbuchen ---------- */

  function starteModus(modus) {
    if (!modus) return;
    stoppeModus();
    offenerRekord = null;
    aktiverModus = modus;
    var a = auswahl();
    if (a.noten.length === 0) return;
    var nr = ++startNr;
    laufendeNr = nr;
    modus.starte({
      noten: a.noten,
      antworten: a.antworten,
      bereich: a.bereich,
      einstellungen: JSON.parse(JSON.stringify(stand.einstellungen)),
      schwierig: stand.schwierig.slice(),
      zeigeAnsicht: function () { zeigeAnsicht(modus.ansicht || modus.id); },
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

  /** Merktier zur Note, zum Beispiel „d1 wie Delfin“, oder null, wenn ausgeschaltet. */
  function merkhilfe(note) {
    if (!stand.einstellungen.merktiere || !note || !note.tier || !window.Tiere.hat(note.tier)) return null;
    var name = window.Tiere.NAMEN[note.tier] || note.tier;
    return { tier: note.tier, name: name, text: note.name + " wie " + name };
  }

  function verbuche(modus, e) {
    var v = L.verbucheErgebnis(stand, modus.id, e, Date.now());
    stand = v.stand;
    speichereSpielstand();
    zeigeErgebnis(modus, e, v);
  }

  /* ---------- Ergebnis ---------- */

  function zeigeErgebnis(modus, e, v) {
    $("titel-ergebnis").textContent = e.titel || "Geschafft!";
    zeigeTier($("ergebnis-tier"), e.stimmung || "froh");
    $("ergebnis-spruch").textContent = e.spruch || "Toll gemacht!";

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
    zeile("Gesamtpunktzahl", (e.gesamt || 0) + " Punkte", "ergebnis-gesamt");
    var sterne = element("span");
    var anzahl = e.neueSterne || 0;
    if (anzahl > 0) sterne.innerHTML = '<span class="sterne-reihe" aria-hidden="true">' + H.sternSymbole(anzahl, anzahl) + "</span> ";
    sterne.appendChild(document.createTextNode(String(anzahl)));
    zeile("Neue Sterne", sterne);

    var box = $("neues-tier");
    var neuesTier = v.neueTiere.length ? v.neueTiere[v.neueTiere.length - 1] : null;
    if (neuesTier) {
      box.innerHTML = '<div class="tier-mittel">' + window.Tiere.zeichne(neuesTier.id, "froh", neuesTier.name) + "</div>" +
        "<p><strong>Neues Tier: " + neuesTier.name + "!</strong><br>Du kannst es unter „Meine Tiere“ auswählen.</p>";
      box.hidden = false;
    } else {
      box.hidden = true;
      box.innerHTML = "";
    }

    zeigeAnsicht("ergebnis");
    if (v.rekord) zeigeNamensabfrage(modus, v.rekord);
    else $("rekord-name").hidden = true;
  }

  /* ---------- Namen in den Rekorden ---------- */

  function zeigeNamensabfrage(modus, rekord) {
    offenerRekord = rekord;
    $("rekord-name").hidden = false;
    $("rekord-name-info").textContent = "Neuer Rekord: Platz " + (rekord.platz + 1) + " bei „" + modus.name + "“.";
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
    $("rekord-name-fertig").textContent = gesetzt ? "✓ Rekord für " + gesetzt + " gespeichert." : "✓ Rekord ohne Namen gespeichert.";
    $("knopf-nochmal").focus({ preventScroll: true });
  }

  $("name-formular").addEventListener("submit", function (ev) {
    ev.preventDefault();
    speichereName($("name-eingabe").value);
  });
  $("knopf-ohne-name").addEventListener("click", function () { speichereName(""); });

  /* ---------- Meine Tiere ---------- */

  function zeigeTiere(fokusTier) {
    $("tiere-sterne").innerHTML = '<span class="stern stern-voll" aria-hidden="true">★</span> Gesammelte Sterne: <strong>' + stand.sterne + "</strong>";
    var naechstes = L.naechstesTier(stand);
    $("tiere-naechstes").textContent = (naechstes
      ? "Noch " + sterneText(naechstes.fehlend) + " bis zum nächsten Tier."
      : "Du hast alle Tiere entdeckt!") + " Entdeckt: " + stand.entdeckt.length + " von " + L.TIERE.length + ".";

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
        if (tier.selten) li.appendChild(element("p", "tier-info", "✨ Selten"));
        var b = element("button", "knopf " + (gewaehlt ? "knopf-gewaehlt" : "knopf-neben"), gewaehlt ? "✓ Begleiter" : "Auswählen");
        b.type = "button";
        b.setAttribute("aria-pressed", gewaehlt ? "true" : "false");
        b.setAttribute("aria-label", tier.name + (gewaehlt ? " ist dein Begleiter" : " als Begleiter auswählen"));
        b.addEventListener("click", function () {
          stand.tier = tier.id;
          speichereSpielstand();
          zeigeTiere(tier.id);
        });
        li.appendChild(b);
      } else {
        li.innerHTML = '<div class="tier-mittel">' + window.Tiere.zeichne(tier.id, "normal", "Noch nicht entdeckt", true) + "</div>";
        li.appendChild(element("p", "tier-name", "???"));
        if (tier.selten) li.appendChild(element("p", "tier-info", "✨ Selten, ab " + L.SELTEN_AB_STERNEN + " Sternen"));
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
    window.Modi.liste().forEach(function (modus) {
      var abschnitt = element("section", "rekord-abschnitt");
      var titelId = "rekorde-" + modus.id;
      var h2 = element("h2", "rekord-modus", modus.name);
      h2.id = titelId;
      abschnitt.setAttribute("aria-labelledby", titelId);
      abschnitt.appendChild(h2);
      var rekorde = L.sortiereRekorde(stand.rekorde[modus.id] || []).slice(0, L.REGELN.maxRekorde);
      if (rekorde.length === 0) {
        abschnitt.appendChild(element("p", "leer-hinweis", "Noch keine Rekorde. Spiel eine Runde, dann steht dein Ergebnis hier."));
      } else {
        var ol = element("ol", "rekord-liste");
        rekorde.forEach(function (r, i) {
          var li = element("li", "rekord");
          var datum = "";
          try { datum = new Date(r.zeit).toLocaleDateString("de-DE"); } catch (e) { datum = ""; }
          li.appendChild(element("span", "rekord-platz", (i + 1) + "."));
          li.appendChild(element("span", "rekord-punkte", r.gesamt + " Punkte"));
          var st = element("span", "rekord-sterne");
          st.innerHTML = '<span class="stern stern-voll" aria-hidden="true">★</span> ';
          st.appendChild(document.createTextNode(sterneText(r.sterne)));
          li.appendChild(st);
          // Alte Rekorde haben kein Namensfeld und zeigen keinen Namen.
          if (typeof r.name === "string") {
            li.appendChild(element("span", "rekord-name-text" + (r.name ? "" : " ohne-name"), r.name || "Ohne Namen"));
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

  function gruppe(formular, titel, name, optionen, wert, beiWahl) {
    var fs = element("fieldset", "einstellung");
    fs.appendChild(element("legend", "", titel));
    optionen.forEach(function (o) {
      var label = element("label", "wahl");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = o.wert;
      input.checked = o.wert === wert;
      input.addEventListener("change", function () { if (input.checked) beiWahl(o.wert); });
      label.appendChild(input);
      label.appendChild(element("span", "wahl-text", o.text));
      fs.appendChild(label);
    });
    formular.appendChild(fs);
    return fs;
  }

  function aendereEinstellung(aenderung, fokusName) {
    aenderung(stand.einstellungen);
    speichereSpielstand();
    baueEinstellungen();
    var feld = document.querySelector('#einstellungen-formular input[name="' + fokusName + '"]:checked');
    if (feld) feld.focus({ preventScroll: true });
  }

  function baueEinstellungen() {
    var f = $("einstellungen-formular");
    var e = stand.einstellungen;
    f.innerHTML = "";
    gruppe(f, "Schlüssel", "schluessel", [
      { wert: "violin", text: "Violinschlüssel" },
      { wert: "bass", text: "Bassschlüssel" },
      { wert: "beide", text: "Beide gemischt" }
    ], e.schluessel, function (w) {
      aendereEinstellung(function (x) { x.schluessel = w; }, "schluessel");
    });
    ["violin", "bass"].forEach(function (s) {
      if (e.schluessel !== s && e.schluessel !== "beide") return;
      var aktuell = N.bereichVon(K, s, e.bereich[s]);
      gruppe(f, "Tonumfang im " + N.SCHLUESSEL[s].name, "bereich-" + s, N.bereichsListe(K, s).map(function (b) {
        return { wert: b.id, text: b.name };
      }), aktuell ? aktuell.id : "", function (w) {
        aendereEinstellung(function (x) { x.bereich[s] = w; }, "bereich-" + s);
      });
    });
    gruppe(f, "Merktiere nach der Antwort", "merktiere", [
      { wert: "an", text: "An, zum Beispiel „d1 wie Delfin“" },
      { wert: "aus", text: "Aus" }
    ], e.merktiere ? "an" : "aus", function (w) {
      aendereEinstellung(function (x) { x.merktiere = w === "an"; }, "merktiere");
    });
    var info = element("p", "einstellungen-info", "Die Einstellungen gelten für alle Spiele und werden auf diesem Gerät gespeichert.");
    f.appendChild(info);
  }

  function zeigeEinstellungen() {
    baueEinstellungen();
    zeigeAnsicht("einstellungen");
  }

  /* ---------- Startseite ---------- */

  function baueStartseite() {
    var box = $("start-modi");
    box.innerHTML = "";
    window.Modi.liste().forEach(function (modus) {
      if (modus.hauptspiel) return;
      var b = element("button", "knopf knopf-neben knopf-modus");
      b.type = "button";
      if (modus.symbol) b.appendChild(element("span", "modus-symbol", modus.symbol)).setAttribute("aria-hidden", "true");
      b.appendChild(document.createTextNode(" " + modus.name));
      b.addEventListener("click", function () { starteModus(modus); });
      box.appendChild(b);
    });
    box.hidden = box.children.length === 0;
  }

  var hauptspiel = window.Modi.liste().filter(function (m) { return m.hauptspiel; })[0] || window.Modi.liste()[0];

  $("knopf-start").addEventListener("click", function () { starteModus(hauptspiel); });
  $("knopf-nochmal").addEventListener("click", function () { starteModus(aktiverModus || hauptspiel); });
  $("knopf-tiere").addEventListener("click", function () { zeigeTiere(); });
  $("knopf-rekorde").addEventListener("click", zeigeRekorde);
  $("knopf-einstellungen").addEventListener("click", zeigeEinstellungen);
  $("knopf-ergebnis-start").addEventListener("click", zurStartseite);
  Array.prototype.forEach.call(document.querySelectorAll(".knopf-zurueck"), function (b) {
    b.addEventListener("click", zurStartseite);
  });

  baueStartseite();
  speichereSpielstand(); // übernimmt eine Migration alter Spielstände sofort
  zurStartseite();
  // Beim ersten Laden nicht den Titel fokussieren, damit kein Fokusrahmen erscheint.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
})();
