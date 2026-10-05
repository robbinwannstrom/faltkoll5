# Implementation Plan: Strikt Dokumentimport (PDF, TXT & Direkttext) för Övningar

## 1. Bakgrund & Problembeskrivning
Vid import av dokumentet "Enskilt Avlopp" genererades moment som inte fanns i underlaget (bland annat generiska standardmoment för schakt, provgrop och slamavskiljare). Detta berodde på att importmotorn hade en mallbaserad reservgenerator som lade till fasta fördefinierade moment när specifik text saknades eller inte matchades rad för rad.

Användaren har klargjort följande krav:
1. **Strikt tolkning:** Skapa **enbart** moment som uttryckligen finns i det uppladdade underlaget. Inga påhittade eller generiska tilläggsmoment.
2. **Filformat & Inmatning:** Stöd för **PDF-filer**, **TXT-filer (.txt, .md)** samt **direkt inklistrad text**.
3. **Genomskinlighet:** Läraren ska kunna se och granska den extraherade texten innan övningen genereras.

---

## 2. Arkitektur & Komponentändringar

### A. Utökad inläsning i Lärarens Övningsskapare (`TeacherExerciseCreatorModal.tsx`)
- **Stöd för `.txt` och `.md`:** Filväljaren och drag-and-drop-ytan uppdateras till att acceptera både `.pdf`, `.txt` och `.md`.
- **Automatisk textavkänning:** När en `.txt`-fil väljs läses innehållet omedelbart in som UTF-8-text via `FileReader.readAsText()`.
- **Fluktuerande / flexibel inmatning:** Flikarna i importvyn förenklas och görs intuitiva:
  - **Flik 1 (Filuppladdning):** Ladda upp PDF- eller TXT-fil med direkt filvalidering och storleksvisning.
  - **Flik 2 (Klistra in text):** Rektangulärt textfält där läraren kan klistra in text direkt från Word, e-post eller anteckningar.
- **Förhandsgranskning av underlagstext:** När text finns tillgänglig visas en ren, läsbar förhandsvisning av underlaget innan analysen startas, så att läraren vet exakt vilket innehåll som ligger till grund för övningen.

### B. Strikt och trogen tolkning på servern (`server.ts`)
- **Strikt AI-prompthantering (`gemini-3.8-flash`):**
  - Prompten instruerar modellen att strikt extrahera *endast* de punkter och instruktioner som finns i det medskickade underlaget.
  - Ingen extrapolation eller generiska fyllnadsmoment tillåts. Om dokumentet har 2 moment skapas 2 moment; har det 4 moment skapas 4 moment.
  - Befintliga rubriker, krav och formuleringar bevaras ordagrant.
- **Deterministisk textparsning utan hallucinationer:**
  - Om AI inte kan anropas (offline/nätverksfel) eller om texten är strukturerad med siffror/punkter, parsas rader direkt (t.ex. `1.`, `2.`, `Steg`, bindestreck eller stycken).
  - De generiska hårdkodade reservmallarna för Enskilt Avlopp / Grund tas bort till förmån för **texttrogen extrahering** ur den faktiska texten.
- **Bifogat underlag:**
  - PDF:er bevaras som bifogat ritningsunderlag för eleverna, och för TXT-filer sparas texten som en tillgänglig instruktionsbilaga.

### C. Klienttjänst (`src/services/exerciseService.ts`)
- Uppdatera API-anropet så att `importExerciseFromDocument` skickar `textContent`, `fileName`, `fileType` ('PDF' | 'TXT' | 'PASTE') samt eventuell base64-data.

---

## 3. Verifieringsplan & Testning

1. **Test av TXT-fil:**
   - Skapa ett testdokument med exakt 2 specifika kontrollpunkter för Enskilt Avlopp (t.ex. kontroll av fiberduk och fall på spridningsrör).
   - Verifiera via API att övningen skapas med exakt dessa 2 moment och inga andra.
2. **Test av inklistrad text:**
   - Klistra in en rå textlista och kör analys.
   - Kontrollera att momentens titlar och instruktioner stämmer ordagrant överens med den inklistrade texten.
3. **Test av PDF-uppladdning:**
   - Testa PDF-uppladdning och verifiera att filen hanteras korrekt både som visningsbilaga och innehållstolkning.
4. **Kompilering & Lint:**
   - Köra `compile_applet` och `lint_applet` för att säkerställa noll syntaxfel eller regressioner.
