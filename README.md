# 🪑 Klasopstelling Generator

![Klasopstelling Generator Logo](./logo.png)

> **De slimste manier om je klas in te delen.**
>
> Een krachtige, interactieve webapplicatie speciaal ontworpen voor docenten om snel en eenvoudig klasopstellingen te genereren, visualiseren en beheren.

---

## 📖 Over dit Project

De **Klasopstelling Generator** helpt docenten bij het maken van de perfecte plattegrond. Of je nu een vaste opstelling wilt, leerlingen willekeurig wilt plaatsen, of rekening wilt houden met specifieke wensen (zoals vaste plaatsen of leerlingen die niet naast elkaar mogen zitten) – deze tool maakt het mogelijk.

Geen gedoe meer met pen en papier of ingewikkelde Excel-sheets. Alles werkt direct in je browser, zonder installatie.

## ✨ Belangrijkste Functionaliteiten

*   **⚡ Direct aan de slag**: Geen account of installatie nodig.
*   **🎨 Visuele Pracht**: Duidelijke interface met 4 kleurenthema's en een **Dark Mode** 🌗.
*   **🧠 Slimme Algoritmes**:
    *   Genereer willekeurige indelingen met het Fisher-Yates algoritme.
    *   Kies uit standaard layouts (`2-2-2`, `2-3-2`, `3-3`) of maak je eigen **Custom Layout**.
*   **📌 Volledige Controle**:
    *   Sleep leerlingen naar een andere plek (**Drag & Drop**).
    *   Stel **vaste plaatsen** in voor specifieke leerlingen.
    *   **Scheid leerlingen** die niet naast elkaar mogen zitten (conflictpreventie).
*   **💾 Opslaan & Beheren**: Sla meerdere klassenlijsten op in je browser en laad ze wanneer nodig.
*   **📸 Exporteren**: Download je plattegrond direct als **HD afbeelding** om te printen of te projecteren.

## 🚀 Aan de Slag

Je kunt de applicatie direct gebruiken door het bestand `index.html` te openen in een moderne webbrowser (Chrome, Firefox, Edge, Safari).

### Installatie
Er is **geen installatie** vereist.
1. Download de broncode (ZIP) of clone de repository.
2. Dubbelklik op `index.html`.
3. Klaar!

## 📚 Gebruikshandleiding

Volg deze eenvoudige stappen om je eerste klasopstelling te maken:

### 1. Leerlingen Invoeren
Typ of plak de namen van je leerlingen in het tekstvak aan de linkerkant. Zorg voor één naam per regel.
> *Tip: Kopieer de namen direct uit je administratiesysteem (zoals Magister of Somtoday).*

### 2. Regels Instellen (Optioneel)
*   **Vaste Plaatsen**: Wil je dat Jantje altijd vooraan zit? Voeg een vaste plaats toe.
*   **Scheiden**: Praten Pietje en Klaasje te veel? Voeg ze toe als "Scheidingspaar" en de generator zet ze uit elkaar.

### 3. Layout Kiezen
Selecteer een van de tabbladen voor de gewenste opstelling:
*   **2-2-2**: Rijen van 3 groepen van 2 tafels.
*   **2-3-2**: Rijen met een middenblok van 3.
*   **3-3**: Twee grote blokken van 3.
*   **Custom**: Bepaal zelf hoeveel rijen en hoe groot de groepen zijn.

### 4. Genereren & Aanpassen
Klik op de knop **Genereer Opstellingen**.
*   Niet tevreden? Klik nogmaals voor een nieuwe willekeurige indeling.
*   Wil je nog iets wijzigen? Sleep leerlingen eenvoudig naar een andere plek met je muis.

### 5. Opslaan & Delen
*   **Opslaan**: Sla de lijst met namen en regels op voor later gebruik via "Lijstbeheer".
*   **Downloaden**: Klik op "Download Plattegrond" om een afbeelding op te slaan.

## 🛠️ Technische Details

Deze applicatie is gebouwd met moderne webtechnologieën en is volledig client-side (alles draait in je browser, er wordt niets naar een server gestuurd).

*   **Frontend**: HTML5, CSS3 (met CSS Variables), Vanilla JavaScript (ES6+).
*   **Data Opslag**: `localStorage` API voor het onthouden van lijsten en instellingen.
*   **Screenshot**: Gebruikt `html2canvas` voor het renderen van de DOM naar een afbeelding.

### Bestandsstructuur
*   `index.html`: De structuur van de pagina.
*   `style.css`: Alle styling, thema's en animaties.
*   `app.js`: De logica (State management, Generator algoritme, UI interacties).

## 🤝 Bijdragen

Heb je ideeën voor verbeteringen of heb je een bug gevonden?
1. Fork dit project.
2. Maak een feature branch (`git checkout -b feature/nieuwe-functie`).
3. Commit je wijzigingen.
4. Open een Pull Request.

## ⚖️ Licentie

Dit project is gelicenseerd onder de **MIT License**.
Je bent vrij om dit project te gebruiken, aan te passen en te verspreiden, ook voor commerciële doeleinden, mits je de originele auteursvermelding behoudt.

---
*Gemaakt met ❤️ voor het onderwijs.*
