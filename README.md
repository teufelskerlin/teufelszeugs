# Krümels Lernwelt

Statische Lern-Seite für GitHub Pages. Alle Fortschritte liegen im Browser (localStorage) unter Schlüsseln, die mit `kruemel:` beginnen.

## Aufbau
- `index.html` – Übersicht mit Krümel, Kleiderschrank, Trainer-Karten und Backup
- `kruemel.js` – Profil, Belohnungen, Accessoires, Krümel-Grafik, Backup
- `style.css` – gemeinsames Design
- `<fach>-<trainer>.html` – einzelne Trainer, alle direkt im Hauptverzeichnis (keine Ordner nötig)

## Neuen Trainer ergänzen
1. Neue Datei anlegen, z. B. `mathe-einmaleins.html` (am einfachsten den Verb-Trainer kopieren).
2. In `kruemel.js` oben in `K.TRAINERS` eintragen: `id`, `subject`, `title`, `desc`, `path`, `total`, optional `reward`.
3. Im Trainer nach jeder Antwort aufrufen:
   `const r = {ok, gaveUp, combo, fixed}; Kruemel.react(Kruemel.award("<id>", r), r);`
4. Trainer-eigene Daten: `Kruemel.trainer(id)` lesen, `Kruemel.saveTrainer(id, daten)` speichern.
   Für die Fortschrittsanzeige auf der Übersicht `mastery: {eintrag: anzahlRichtig}` pflegen.
5. Optional ein Spezial-Teil: in `ITEMS` mit `reward:"<id>"` anlegen und bei voller Meisterung `Kruemel.grantReward("<item-id>")` aufrufen.

## Regeln, damit kein Fortschritt verloren geht
- Speicher-Schlüssel (`kruemel:profile`, `kruemel:trainer:<id>`) und Trainer-IDs nie umbenennen.
- Felder im Profil nur ergänzen. Bei echten Formatänderungen `SCHEMA` erhöhen und in `upgrade()` umrechnen.
