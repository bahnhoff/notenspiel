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
    // Fehlende oder alte Einstellungen werden in die aktuelle Form mit Notenlisten übersetzt.
    geladen.einstellungen = N.einstellungen(K, geladen.einstellungen);
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

  /** Reicht die Auswahl zum Spielen? Mindestens 3 verschiedene Notennamen. */
  function auswahlReicht(a) {
    return a.antworten.length >= N.MINDEST_NOTEN;
  }

  /** Kurzbeschreibung der Noten eines Schlüssels, zum Beispiel „c¹ bis g¹“ oder „c¹, e¹, g¹“. */
  function notenText(noten) {
    if (noten.length === 0) return "keine Noten";
    var erste = noten[0], letzte = noten[noten.length - 1];
    if (noten.length === 1) return erste.name;
    if (letzte.stufe - erste.stufe === noten.length - 1) return erste.name + " bis " + letzte.name;
    if (noten.length <= 5) return noten.map(function (n) { return n.name; }).join(", ");
    return noten.length + " Noten von " + erste.name + " bis " + letzte.name;
  }

  function auswahlText(a) {
    return stand.einstellungen.schluessel.map(function (s) {
      return N.SCHLUESSEL[s].name + ": " + notenText(a.noten.filter(function (n) { return n.schluessel === s; }));
    }).join(" · ");
  }

  var ZU_WENIG = "Wähle in den Einstellungen mindestens " + N.MINDEST_NOTEN + " verschiedene Noten aus, dann kann es losgehen.";

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
    var reicht = auswahlReicht(a);
    $("knopf-start").disabled = !reicht;
    Array.prototype.forEach.call(document.querySelectorAll("#start-modi .knopf-modus"), function (b) { b.disabled = !reicht; });
    $("start-auswahl").textContent = reicht ? auswahlText(a) : ZU_WENIG;
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
      bereich: a.bereich,
      einstellungen: JSON.parse(JSON.stringify(stand.einstellungen)),
      schwierig: stand.schwierig.slice(),
      tagesreise: L.tagesreiseStatus(stand, Date.now()),
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

  /** Merktier zur Note, zum Beispiel „d¹ wie Delfin“, oder null, wenn ausgeschaltet. */
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
    var reise = v.tagesreise;
    if (reise) {
      zeile("Extrastern für heute", reise.extrastern ? "★ 1" : "Heute schon bekommen");
      zeile("Tagesserie", reise.serie === 1 ? "1 Tag" : reise.serie + " Tage in Folge");
    }
    zeile("Gesamtpunktzahl", (e.gesamt || 0) + " Punkte", "ergebnis-gesamt");
    var sterne = element("span");
    var anzahl = (e.neueSterne || 0) + (reise && reise.extrastern ? 1 : 0);
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

  var OKTAVEN = ["", "", "Große Oktave", "Kleine Oktave", "Eingestrichene Oktave", "Zweigestrichene Oktave", "Dreigestrichene Oktave"];
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
    fs.appendChild(element("legend", "", "Noten im " + N.SCHLUESSEL[sl].name));
    var verfuegbar = N.verfuegbareNoten(K, sl);
    var alleIds = verfuegbar.map(function (n) { return n.id; });
    function setze(ids) {
      return function (x) {
        x.noten = x.noten.filter(function (id) { return alleIds.indexOf(id) === -1; }).concat(ids);
      };
    }

    // Schnellwahl: setzt nur die Häkchen dieses Schlüssels.
    var schnell = element("div", "noten-schnellwahl");
    schnell.setAttribute("role", "group");
    schnell.setAttribute("aria-label", "Schnellwahl " + N.SCHLUESSEL[sl].name);
    var wahlen = N.bereichsListe(K, sl).map(function (b) {
      return { id: b.id, text: b.name, info: N.name(N.stufe(b.von)) + "–" + N.name(N.stufe(b.bis)), ids: N.bereichsKennungen(K, sl, b.id) };
    }).concat([{ id: "alle", text: "Alle", ids: alleIds }, { id: "keine", text: "Keine", ids: [] }]);
    wahlen.forEach(function (w) {
      var b = element("button", "knopf knopf-klein knopf-schnellwahl");
      b.type = "button";
      b.dataset.fokus = sl + "-schnell-" + w.id;
      b.appendChild(element("span", "schnellwahl-name", w.text));
      if (w.info) b.appendChild(element("span", "schnellwahl-info", w.info));
      b.addEventListener("click", function () { aendereEinstellung(setze(w.ids), b.dataset.fokus); });
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
      var gitter = element("div", "noten-gitter");
      o.noten.forEach(function (n) {
        var an = e.noten.indexOf(n.id) !== -1;
        var b = element("button", "noten-wahl" + (an ? " ist-an" : ""));
        b.type = "button";
        b.dataset.fokus = n.id;
        b.setAttribute("aria-pressed", an ? "true" : "false");
        b.setAttribute("aria-label", n.name);
        b.style.gridColumn = String(N.BUCHSTABEN.indexOf(n.buchstabe) % 7 + 1);
        b.appendChild(element("span", "noten-wahl-haken", an ? "✓" : "")).setAttribute("aria-hidden", "true");
        b.appendChild(element("span", "noten-wahl-name", n.name)).setAttribute("aria-hidden", "true");
        b.addEventListener("click", function () {
          aendereEinstellung(function (x) {
            if (an) x.noten = x.noten.filter(function (id) { return id !== n.id; });
            else x.noten = x.noten.concat([n.id]);
          }, n.id);
        });
        gitter.appendChild(b);
      });
      reihe.appendChild(gitter);
      fs.appendChild(reihe);
    });
    f.appendChild(fs);
  }

  function baueEinstellungen() {
    var f = $("einstellungen-formular");
    var e = stand.einstellungen;
    f.innerHTML = "";

    var fs = element("fieldset", "einstellung");
    fs.appendChild(element("legend", "", "Schlüssel"));
    ["violin", "bass"].forEach(function (sl) {
      var an = e.schluessel.indexOf(sl) !== -1;
      fs.appendChild(kaestchen(N.SCHLUESSEL[sl].name, "schluessel-" + sl, an, false, function (neu) {
        if (!neu && e.schluessel.length === 1) {
          // Mindestens ein Schlüssel bleibt angekreuzt.
          baueEinstellungen();
          einstellungsHinweis = "Ein Schlüssel bleibt immer angekreuzt.";
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
    mt.appendChild(element("legend", "", "Merktiere"));
    mt.appendChild(kaestchen("Merktier nach der Antwort, zum Beispiel „d¹ wie Delfin“", "merktiere", e.merktiere, true, function (neu) {
      aendereEinstellung(function (x) { x.merktiere = neu; }, "merktiere");
    }));
    f.appendChild(mt);
    f.appendChild(element("p", "einstellungen-info", "Die Einstellungen gelten für alle Spiele und werden auf diesem Gerät gespeichert."));
    zeigeEinstellungsHinweis();
  }

  /** Freundlicher Hinweis oben: zu wenige Noten oder letzter Schlüssel. */
  function zeigeEinstellungsHinweis() {
    var el = $("einstellungen-hinweis");
    if (!el) return;
    var a = auswahl();
    var text = einstellungsHinweis;
    if (!auswahlReicht(a)) {
      text = (text ? text + " " : "") + "Kreuze mindestens " + N.MINDEST_NOTEN + " verschiedene Noten an, sonst können die Spiele nicht starten." +
        (a.antworten.length ? " Gewählt: " + a.antworten.map(function (x) { return x.name; }).join(", ") + "." : "");
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

  function baueStartseite() {
    var box = $("start-modi");
    box.innerHTML = "";
    window.Modi.liste().forEach(function (modus) {
      if (modus.hauptspiel) return;
      // Kachel mit großem Symbol und kurzem Namen
      var b = element("button", "knopf knopf-neben knopf-modus");
      b.type = "button";
      b.dataset.modus = modus.id;
      if (modus.symbol) b.appendChild(element("span", "modus-symbol", modus.symbol)).setAttribute("aria-hidden", "true");
      b.appendChild(element("span", "modus-name", modus.name));
      if (modus.kachelInfo) {
        b.classList.add("knopf-modus-info");
        b.appendChild(element("span", "modus-info"));
      }
      b.addEventListener("click", function () { starteModus(modus); });
      box.appendChild(b);
    });
    box.hidden = box.children.length === 0;
    $("titel-modi").hidden = box.hidden;
  }

  /** Kurze Zusatztexte auf den Kacheln, zum Beispiel „Heute geschafft ✓“. */
  function aktualisiereKacheln() {
    var status = { tagesreise: L.tagesreiseStatus(stand, Date.now()) };
    window.Modi.liste().forEach(function (modus) {
      if (!modus.kachelInfo) return;
      var info = document.querySelector('#start-modi [data-modus="' + modus.id + '"] .modus-info');
      if (info) info.textContent = modus.kachelInfo(status) || "";
    });
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
