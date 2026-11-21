/*
 * Oberfläche: Ansichten wechseln, Runde anzeigen, Spielstand speichern.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var SPEICHER_SCHLUESSEL = "welche-note-ist-das.spielstand.v1";
  var PAUSE_NACH_RICHTIG = 1200; // Millisekunden

  var speicherVerfuegbar = true;
  var noten = L.aktiveNoten(window.NOTEN_KONFIGURATION);
  var stand = ladeSpielstand();
  var runde = null;
  var weiterTimer = null;
  var letzterAntwortKnopf = -1;
  var bereich = [
    Math.min.apply(null, noten.map(function (n) { return n.position; })),
    Math.max.apply(null, noten.map(function (n) { return n.position; }))
  ];

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
    if (!s) {
      speicherVerfuegbar = false;
      return L.leererSpielstand();
    }
    try {
      var roh = s.getItem(SPEICHER_SCHLUESSEL);
      return L.bereinigeSpielstand(roh ? JSON.parse(roh) : null);
    } catch (e) {
      return L.leererSpielstand();
    }
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
    for (var i = 0; i < L.TIERE.length; i++) if (L.TIERE[i].id === id) return L.TIERE[i].name;
    return "";
  }

  function zeigeTier(element, stimmung) {
    element.innerHTML = window.Tiere.zeichne(stand.tier, stimmung, tierName(stand.tier));
    element.className = element.className.replace(/\s*stimmung-\S+/g, "") + " stimmung-" + stimmung;
  }

  function sterneText(anzahl) {
    return anzahl === 1 ? "1 Stern" : anzahl + " Sterne";
  }

  function sternSymbole(voll, gesamt) {
    var html = "";
    for (var i = 0; i < gesamt; i++) {
      html += i < voll
        ? '<span class="stern stern-voll" aria-hidden="true">★</span>'
        : '<span class="stern stern-leer" aria-hidden="true">☆</span>';
    }
    return html;
  }

  /* ---------- Ansichten ---------- */

  var ANSICHTEN = ["start", "runde", "ergebnis", "tiere", "rekorde"];

  function zeigeAnsicht(name) {
    ANSICHTEN.forEach(function (n) { $("ansicht-" + n).hidden = n !== name; });
    window.scrollTo(0, 0);
    var titel = $("titel-" + name);
    if (titel) titel.focus({ preventScroll: true });
  }

  function zurStartseite() {
    // Eine laufende Runde wird ohne Ergebniseintrag verworfen.
    clearTimeout(weiterTimer);
    runde = null;
    zeigeTier($("start-tier"), "normal");
    $("hinweis-speicher").hidden = speicherVerfuegbar;
    zeigeAnsicht("start");
  }

  /* ---------- Spielrunde ---------- */

  function baueAntwortKnoepfe() {
    var box = $("antworten");
    box.innerHTML = "";
    noten.forEach(function (note, index) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "knopf knopf-antwort";
      b.dataset.id = note.id;
      b.dataset.index = String(index);
      b.innerHTML = '<span class="antwort-name">' + note.name + '</span><span class="antwort-marke" aria-hidden="true"></span>';
      b.setAttribute("aria-label", note.name);
      b.addEventListener("click", function () { beantworte(note.id, index); });
      box.appendChild(b);
    });
  }

  function starteRunde() {
    clearTimeout(weiterTimer);
    runde = L.neueRunde(noten, { vorrang: stand.schwierig });
    letzterAntwortKnopf = -1;
    baueAntwortKnoepfe();
    zeigeTier($("runde-tier"), "normal");
    zeigeAnsicht("runde");
    zeigeAufgabe();
    $("sprechblase-text").textContent = "Schau genau hin. Welche Note ist das?";
  }

  function zeigeStatus() {
    $("aufgabe-nr").textContent = "Aufgabe " + (runde.aufgabe + 1) + " von " + L.REGELN.aufgabenProRunde;
    var sterne = $("sterne-anzeige");
    sterne.innerHTML = sternSymbole(runde.sterne, L.REGELN.startSterne);
    sterne.setAttribute("aria-label", runde.sterne + " von " + L.REGELN.startSterne + " Sternen");
    $("punkte-anzeige").textContent = runde.punkte + " Punkte";
  }

  function zeigeAufgabe() {
    zeigeStatus();
    $("notensystem").innerHTML = window.Notensystem.zeichne(runde.aktuell.note, { bereich: bereich });
    $("notensystem").classList.remove("ist-falsch", "ist-richtig");
    $("knopf-weiter").hidden = true;
    var knoepfe = document.querySelectorAll(".knopf-antwort");
    Array.prototype.forEach.call(knoepfe, function (b) {
      b.classList.remove("ist-richtig", "ist-falsch", "ist-loesung");
      b.setAttribute("aria-disabled", "false");
      b.querySelector(".antwort-marke").textContent = "";
    });
    $("antworten").classList.remove("gesperrt");
    // Tastaturfokus auf derselben Schaltfläche lassen wie bei der letzten Antwort.
    if (letzterAntwortKnopf >= 0 && knoepfe[letzterAntwortKnopf] &&
        (document.activeElement === document.body || document.activeElement === $("knopf-weiter") ||
         (document.activeElement && document.activeElement.classList.contains("knopf-antwort")))) {
      knoepfe[letzterAntwortKnopf].focus({ preventScroll: true });
    }
  }

  function beantworte(id, index) {
    if (!runde) return;
    var a = L.antworte(runde, id);
    if (!a) return; // schon beantwortet: weitere Tipps zählen nicht
    letzterAntwortKnopf = index;
    $("antworten").classList.add("gesperrt");

    var knoepfe = document.querySelectorAll(".knopf-antwort");
    Array.prototype.forEach.call(knoepfe, function (b) {
      b.setAttribute("aria-disabled", "true");
      if (b.dataset.id === a.note.id) {
        b.classList.add(a.richtig ? "ist-richtig" : "ist-loesung");
        b.querySelector(".antwort-marke").textContent = "✓";
        b.setAttribute("aria-label", b.querySelector(".antwort-name").textContent + ", richtig");
      } else if (b.dataset.id === id) {
        b.classList.add("ist-falsch");
        b.querySelector(".antwort-marke").textContent = "✗";
        b.setAttribute("aria-label", b.querySelector(".antwort-name").textContent + ", falsch");
      }
    });

    zeigeStatus();
    $("notensystem").innerHTML = window.Notensystem.zeichne(a.note, { beschriftung: a.note.name, bereich: bereich });
    $("notensystem").classList.add(a.richtig ? "ist-richtig" : "ist-falsch");

    var praefix = a.richtig ? "✓ " : "✗ ";
    $("sprechblase-text").textContent = praefix + a.nachricht;
    zeigeTier($("runde-tier"), a.richtig ? "froh" : "oje");

    if (a.richtig) {
      weiterTimer = setTimeout(naechsteAufgabe, PAUSE_NACH_RICHTIG);
    } else {
      var weiterKnopf = $("knopf-weiter");
      weiterKnopf.hidden = false;
      weiterKnopf.focus({ preventScroll: true });
      // Auf kleinen Bildschirmen den Hinweis und die Schaltfläche sichtbar machen.
      if (weiterKnopf.scrollIntoView) weiterKnopf.scrollIntoView({ block: "nearest" });
    }
  }

  function naechsteAufgabe() {
    clearTimeout(weiterTimer);
    if (!runde) return;
    var w = L.weiter(runde);
    if (!w) return; // doppelter Aufruf
    if (w.beendet) {
      zeigeErgebnis();
      return;
    }
    $("sprechblase-text").textContent = "Und diese hier?";
    zeigeTier($("runde-tier"), "normal");
    zeigeAufgabe();
  }

  /* ---------- Ergebnis ---------- */

  function zeigeErgebnis() {
    var verbucht = L.verbucheRunde(stand, runde, Date.now());
    if (!verbucht) return;
    stand = verbucht.stand;
    speichereSpielstand();
    var e = verbucht.ergebnis;

    $("titel-ergebnis").textContent = e.vorzeitig ? "Runde vorbei" : "Geschafft!";
    var spruch;
    if (e.vorzeitig) spruch = "Versuchen wir’s noch mal?";
    else if (e.richtige === L.REGELN.aufgabenProRunde) spruch = "Alles richtig. Du bist ein Notenprofi!";
    else spruch = "Toll gemacht!";

    var neuesTier = verbucht.neueTiere.length ? verbucht.neueTiere[verbucht.neueTiere.length - 1] : null;
    zeigeTier($("ergebnis-tier"), e.vorzeitig ? "normal" : "froh");
    $("ergebnis-spruch").textContent = spruch;

    $("ergebnis-richtige").textContent = e.richtige + " von " + L.REGELN.aufgabenProRunde;
    $("ergebnis-punkte").textContent = e.punkte;
    $("ergebnis-bonus").textContent = e.bonus +
      (e.bonus > 0 ? " (" + sterneText(e.verbleibendeSterne) + " × " + L.REGELN.bonusProStern + ")" : "");
    $("ergebnis-gesamt").textContent = e.gesamt + " Punkte";
    $("ergebnis-sterne").innerHTML = e.neueSterne > 0
      ? '<span class="sterne-reihe" aria-hidden="true">' + sternSymbole(e.neueSterne, e.neueSterne) + "</span> " + e.neueSterne
      : "0";

    var box = $("neues-tier");
    if (neuesTier) {
      box.innerHTML = '<div class="tier-mittel">' + window.Tiere.zeichne(neuesTier.id, "froh", neuesTier.name) + "</div>" +
        '<p><strong>Neues Tier: ' + neuesTier.name + "!</strong><br>Du kannst es unter „Meine Tiere“ auswählen.</p>";
      box.hidden = false;
    } else {
      box.hidden = true;
      box.innerHTML = "";
    }
    runde = null;
    zeigeAnsicht("ergebnis");
  }

  /* ---------- Meine Tiere ---------- */

  function zeigeTiere() {
    $("tiere-sterne").innerHTML = '<span class="stern stern-voll" aria-hidden="true">★</span> Gesammelte Sterne: <strong>' + stand.sterne + "</strong>";
    var naechstes = L.naechstesTier(stand.sterne);
    $("tiere-naechstes").textContent = naechstes
      ? "Noch " + sterneText(naechstes.fehlend) + " bis zum " + naechstes.tier.name + "."
      : "Du hast alle Tiere gefunden.";

    var liste = $("tier-liste");
    liste.innerHTML = "";
    L.TIERE.forEach(function (tier) {
      var frei = stand.sterne >= tier.sterne;
      var li = document.createElement("li");
      li.className = "tier-karte" + (frei ? "" : " gesperrt");
      if (frei) {
        var gewaehlt = stand.tier === tier.id;
        li.innerHTML = '<div class="tier-mittel">' + window.Tiere.zeichne(tier.id, gewaehlt ? "froh" : "normal", tier.name) + "</div>" +
          '<p class="tier-name">' + tier.name + "</p>";
        var b = document.createElement("button");
        b.type = "button";
        b.className = "knopf " + (gewaehlt ? "knopf-gewaehlt" : "knopf-neben");
        b.setAttribute("aria-pressed", gewaehlt ? "true" : "false");
        b.textContent = gewaehlt ? "✓ Ausgewählt" : "Auswählen";
        b.addEventListener("click", function () {
          stand.tier = tier.id;
          speichereSpielstand();
          zeigeTiere();
          var neu = liste.querySelector('[data-tier="' + tier.id + '"] button');
          if (neu) neu.focus();
        });
        li.appendChild(b);
      } else {
        li.innerHTML = '<div class="tier-mittel tier-schatten">' + window.Tiere.zeichne(tier.id, "normal", "Noch nicht freigeschaltet") + "</div>" +
          '<p class="tier-name">???</p><p class="tier-info">Ab ' + tier.sterne + " Sternen</p>";
      }
      li.dataset.tier = tier.id;
      liste.appendChild(li);
    });
    zeigeAnsicht("tiere");
  }

  /* ---------- Meine Rekorde ---------- */

  function zeigeRekorde() {
    var liste = $("rekord-liste");
    liste.innerHTML = "";
    var rekorde = L.sortiereRekorde(stand.rekorde).slice(0, L.REGELN.maxRekorde);
    rekorde.forEach(function (r, i) {
      var li = document.createElement("li");
      li.className = "rekord";
      var datum = "";
      try { datum = new Date(r.zeit).toLocaleDateString("de-DE"); } catch (e) { datum = ""; }
      li.innerHTML = '<span class="rekord-platz">' + (i + 1) + ".</span>" +
        '<span class="rekord-punkte">' + r.gesamt + " Punkte</span>" +
        '<span class="rekord-sterne"><span class="stern stern-voll" aria-hidden="true">★</span> ' + sterneText(r.sterne) + "</span>" +
        '<span class="rekord-datum">' + datum + "</span>";
      liste.appendChild(li);
    });
    $("rekorde-leer").hidden = rekorde.length > 0;
    liste.hidden = rekorde.length === 0;
    zeigeAnsicht("rekorde");
  }

  /* ---------- Tastatur ---------- */

  document.addEventListener("keydown", function (ev) {
    if ($("ansicht-runde").hidden || !runde || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var taste = (ev.key || "").toUpperCase();
    if (!runde.gesperrt) {
      for (var i = 0; i < noten.length; i++) {
        if (noten[i].name.toUpperCase() === taste) {
          ev.preventDefault();
          beantworte(noten[i].id, i);
          return;
        }
      }
    }
  });

  /* ---------- Start ---------- */

  $("knopf-start").addEventListener("click", starteRunde);
  $("knopf-nochmal").addEventListener("click", starteRunde);
  $("knopf-tiere").addEventListener("click", zeigeTiere);
  $("knopf-rekorde").addEventListener("click", zeigeRekorde);
  $("knopf-runde-zurueck").addEventListener("click", zurStartseite);
  $("knopf-ergebnis-start").addEventListener("click", zurStartseite);
  $("knopf-weiter").addEventListener("click", naechsteAufgabe);
  Array.prototype.forEach.call(document.querySelectorAll(".knopf-zurueck"), function (b) {
    b.addEventListener("click", zurStartseite);
  });

  if (noten.length === 0) {
    $("knopf-start").disabled = true;
    $("hinweis-speicher").hidden = false;
    $("hinweis-speicher").textContent = "Der aktive Übungssatz enthält keine Noten. Prüfe die Datei js/noten-konfiguration.js.";
    zeigeTier($("start-tier"), "normal");
    return;
  }

  zurStartseite();
  // Beim ersten Laden nicht den Titel fokussieren, damit kein Fokusrahmen erscheint.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
})();
