# 🪑 Klasopstelling Generator

Een interactieve webapplicatie waarmee je eenvoudig klasopstellingen kunt genereren op basis van leerlingenlijsten en vaste plaatsen. Speciaal ontworpen voor docenten die snel en visueel klasindelingen willen maken.

## ✨ Functionaliteiten

- 🎒 Leerlingen invoeren (één naam per regel)
- 📌 Vaste plaatsen instellen voor specifieke leerlingen
- 🎨 Vier kleurenthema's: Blauw, Rood, Groen en Geel
- 🌗 Donkere modus met automatische kleuraanpassingen
- 🧠 Drie verschillende opstellingslayouts: `2-2-2`, `2-3-2`, en `3-3`
- 👌 Drag-and-drop leerlingen voor finetuning van plattegrond
- 🎲 Willekeurige plaatsing van overige leerlingen (Fisher-Yates algoritme)
- 💾 Opslaan en laden van lijsten met duplicaatdetectie
- 📸 Download een HD afbeelding van de opstelling (3x schaal)
- 🎯 Toegankelijke interface met ARIA-labels

## 🖼️ Voorbeeld

![Voorbeeld van de klasopstelling](./screenshot.png)

## 🚀 Gebruik

1. Open `index.html` in je browser (geen installatie nodig)
2. Voer de namen van leerlingen in
3. (Optioneel) Voeg vaste plaatsen toe
4. Kies een opstellingslayout en klik op **Genereer Opstellingen**
5. Pas de opstelling aan met drag-and-drop
6. Sla op, download of wissel van layout
7. (Optioneel) Schakel tussen licht/donker thema of kies een andere kleur

## �� Projectstructuur

- `index.html` – hoofdapplicatie
- `style.css` – styling en thema's
- `app.js` – applicatielogica
- `logo.png` – applicatielogo
- Externe dependency:
  - [`html2canvas`](https://github.com/niklasvh/html2canvas) (voor HD screenshots)

## 🛠️ Ontwikkelaarsinfo

De applicatie is gebouwd met moderne JavaScript klassen:
- `State` – beheert applicatiestatus en persistentie
- `SeatingGenerator` – genereert en beheert opstellingen
- `ListManager` – beheert opslaan/laden van lijsten
- `TabManager` – beheert layout tabs
- `NotificationSystem` – toont feedback aan gebruikers
- `EventHandlers` – centrale event handling

## ⚖️ Licentie

MIT License – zie [LICENSE](./LICENSE)

> Vrij te gebruiken, delen en aanpassen. Ook voor commerciële toepassingen. Vermeld wel de originele auteur.

## 🙌 Dank & bijdragen

Voel je vrij om issues te melden of pull requests in te dienen. Feedback is welkom!


