# GFS Studio

Eine klar gestaltete Desktop-Präsentationsvorlage für eine GFS. Das reduzierte Layout setzt auf Papierweiß, Schwarz und Rot statt auf typische KI-Verläufe.

## Starten

Im Projektordner einen lokalen Webserver starten, zum Beispiel:

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> im Browser öffnen.

## Anpassen und präsentieren

- **Texte bearbeiten** wählen und einen Text direkt anklicken. Die Änderungen werden lokal im Browser gespeichert.
- Mit **Elemente** öffnet sich das Menü für eigene Texte, Formen und Bilder. Elemente lassen sich auf der Folie ziehen, über die Liste auswählen, formatieren und löschen; Texte per Doppelklick ändern. Formen können Rechtecke, Kreise oder Linien sein.
- Über **KI & Folien → Folien** einzelne Layouts wie Titel, Kapiteltrenner, Zitat, zwei Spalten, Bild, Video oder Fazit ergänzen. Das ist keine fertige Gesamtpräsentation; jede Folie wird einzeln hinzugefügt und kann wieder gelöscht werden.
- Texte eigener Folien lassen sich verschieben, in Farbe, Größe, Schrift, Ausrichtung und Fettschrift anpassen.
- Im **Elemente**-Menü können YouTube- und Vimeo-Links als Video-Element eingebettet werden. Die Videowiedergabe lädt Inhalte vom jeweiligen Anbieter.
- Änderungen werden automatisch im Browser gespeichert. **Projekt sichern** lädt eine JSON-Sicherung herunter; über **Projekt laden** kann sie später wiederhergestellt werden.
- Über **Datei exportieren** oder die Schnellaktionen unter der Folie als ODP, OTP oder PPTX exportieren. Text und einfache Formen werden als bearbeitbare Präsentationselemente übernommen; Animationen und aufwendige Design-Details werden vereinfacht, Bilder, Videos und 3D-Modelle durch beschriftete Platzhalter ersetzt. Für PDF den Druckdialog öffnen und **Als PDF speichern** wählen. Das ältere binäre `.ppt`-Format wird von PowerPoint erzeugt: PPTX öffnen und dort **Speichern unter → PowerPoint 97–2003 (.ppt)** wählen.
- Mit **Vorlage zurücksetzen** lassen sich alle eigenen Texte wieder durch die Beispieltexte ersetzen.
- Mit **← / →**, den Folienpunkten oder den Navigationsschaltflächen zwischen Folien wechseln.
- Unter **Design** zwischen Editorial (Rot), Ozean (Blau), Botanik (Grün), Terrakotta, Kobaltblau und Flieder wählen.
- Unter **Übergang** für jede Folie einzeln Schnitt, Farb-Wischer, Zoom, 3D-Klappe, Sturzflug, Glitch oder Wirbel einstellen. Die Auswahl der aktuellen Folie wird beim Wechsel angepasst und lokal gespeichert.
- **Beim ersten Besuch** öffnen sich die **KI-Einstellungen**. Dort den NVIDIA-API-Schlüssel eintragen; standardmäßig wird NVIDIA Nemotron 3 Ultra 550B A55B über NVIDIA NIM verwendet. Modellkennung und Antwortstil sind einstellbar. Der Schlüssel bleibt im Browser (optional nur für die Sitzung) und wird erst bei Chat/Info-Check direkt an NVIDIA gesendet; er wird nicht in Projektdateien exportiert. Anfragen enthalten den aktuellen Folientext. Nur auf einem vertrauenswürdigen Gerät speichern.
- **KI & Folien → KI-Chat** behält den Gesprächskontext während des geöffneten Chats, bietet Schnellaktionen und kann über **Neuer Chat** zurückgesetzt werden. Der Chat berät, ohne ungefragt Folien oder Texte einzufügen; Ergänzungen werden nur nach einer ausdrücklichen Bitte in der aktuellen Nachricht ausgeführt. Mit **Werkzeuge erlauben** kann der Assistent außerdem eine Folienübersicht abrufen, Design und Übergang ändern oder die deutschsprachige Wikipedia durchsuchen. Aktionen erscheinen im Chat; Wikipedia-Treffer sind verlinkt und dienen nur als Ausgangspunkt für die eigene Quellenprüfung. Ohne aktivierte Werkzeuge bleibt der Chat rein beratend.
- **Info-Check** fragt NVIDIA NIM an, sobald ein Schlüssel eingerichtet ist. Er kann Quellenlücken markieren und Aussagen analysieren, aber keine Fakten live verifizieren. Der Chat kann Wikipedia-Ergebnisse auf ausdrückliche Anfrage abrufen; der Info-Check selbst führt keine Live-Recherche durch.
- Auf der letzten Folie ein eigenes **GLB-Modell** laden oder in die Ansicht ziehen. Das Modell lässt sich drehen und zoomen; zusätzlich gibt es automatische Drehung, Kamera-Reset sowie Licht- und Schattenregler. Modelle werden nur lokal im Browser geladen und nicht gespeichert.
- Mit **F** oder der Vollbildschaltfläche die Präsentation im Vollbild zeigen.
- Mit **Präsentieren** oder **P** den ablenkungsfreien Präsentationsmodus starten; **Esc** beendet ihn. Mit **← / →**, **Bild hoch/runter** oder Leertaste geht es weiter.
- Zum Drucken oder Speichern als PDF **Datei exportieren → PDF** wählen. Die Druckansicht enthält alle Folien.

Die Vorlage ist für Desktop-Präsentationen ausgelegt und enthält keine mobile Sonderdarstellung. Sie führt durch Einstieg, Leitfrage, Gliederung, Kernideen, Aha-Moment, Fazit, Fragerunde und 3D-Modell. Eigene Elemente und Bilddaten werden lokal im Browser gespeichert; die JSON-Projektdatei ermöglicht die Sicherung und Übertragung auf ein anderes Gerät. Für die 3D-Ansicht wird beim Öffnen eine Bibliothek aus dem Google CDN geladen; dafür ist eine Internetverbindung erforderlich. **Vorlage zurücksetzen** stellt Texte, Elemente, Design und alle Folienübergänge wieder auf den Ausgangszustand.
