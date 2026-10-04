# Lärarstyrda Övningar, Övningskoder & Fristående Fältverktyg

Ett komplett system för yrkeslärare att skapa anpassade övningar baserade på standardmallar, dela ut dem till elever via enkla 6-ställiga övningskoder, styra kontobehörigheter från Adminpanelen samt göra Försyn & Skadeguide, Fältboken och Fotopärmen fullt tillgängliga som självständiga verktyg utan krav på aktivt projekt.

---

## Användarval & Bekräftade Beslut

> [!IMPORTANT]
> Följande val bekräftades under fas 1:
> - **Inmatning av övningskod**: Elever anger lärarens 6-siffriga övningskod direkt i översikten (Dashboard) via en tydlig snabbruta ("Anslut med övningskod"). Övningen importeras omedelbart med lärarens alla moment, länkar och toleranser.
> - **Fristående verktyg i menyn**: Försyn & Skadeguide, Fältboken och Fotopärm omdirigerar inte längre till "Skapa nytt projekt". De öppnas direkt som en interaktiv utbildningsguide, fria fältanteckningar och ett samlat fotogalleri.
> - **Lärarbehörighet & Konton**: Huvudadmin har en dedikerad inställningsswitch i Adminpanelen: *"Tillåt lärare att skapa lärarkonton"* (standard: AV). Lärare kan alltid skapa och administrera elevkonton, men kan aldrig se, ändra eller ta bort administratörskonton.

---

## 1. Översikt & Kärnkoncept

### Vad förändringen levererar
1. **Lärarpanel & Övningsbyggare ("Skapa Skolövning")**:
   - Lärare och Admin kan skapa anpassade övningsuppgifter.
   - Kan utgå från befintliga moduler (Schakt, Husgrund, Plattsättning, Enskilt avlopp m.fl.) som mall.
   - Läraren kan addera egna extramoment, justera toleranskrav (t.ex. ±3 mm istället för standard ±5 mm), lägga till externa länkar (AMA-föreskrifter, ritnings-PDF:er, instruktionsfilmer) samt bocka i om fotobevis är obligatoriskt.
   - Ändringarna isoleras helt till den specifika övningen och påverkar inte appens standardmallar.
2. **Övningskoder för elever**:
   - Varje sparad lärarövning tilldelas en lättläst 6-teckens kod (t.ex. `GRUND-26` eller `SCH-842`).
   - Eleven klickar på "Ange övningskod" i Dashboarden, skriver in koden och får direkt övningen laddad med sitt eget namn som utförare.
3. **Roll- och behörighetsregler**:
   - **Elev**: Ser endast sina egna övningar och kan ansluta via övningskod.
   - **Lärare**: Kan skapa/redigera övningar, dela ut koder, se elevernas inlämnade kontroller och skapa elevkonton (samt lärarkonton om admin tillåtit detta).
   - **Admin**: Full behörighet inklusive licenser, radering och toggle för lärares behörighetsnivå.
4. **Fristående verktyg från hamburgermenyn**:
   - **Försyn & Skadeguide**: Fungerar som en komplett digital uppslagsbok och interaktiv guide för försyn av fasader, socklar, kantsten och asfalt före schaktstart.
   - **Fältboken**: Fria snabbanteckningar och minnesnoteringar som sparas lokalt och kan kopplas till en övning i efterhand.
   - **Fotopärm**: Centralt bildarkiv som visar alla foton tagna i appen eller ett referensgalleri för godkända/underkända anläggningsmoment.

---

## 2. Användarupplevelse & Gränssnittsdesign

### Elevflöde (Ange övningskod)
```
+---------------------------------------------------------------+
|  FältKoll                       [Johan (Elev)] [🔔 1] [Logga ut]|
+---------------------------------------------------------------+
|  👋 Välkommen Johan!                                          |
|                                                               |
|  +---------------------------------------------------------+  |
|  | 🔑 Ange Lärarens Övningskod                             |  |
|  | [ GRUND-26              ] [ Hämta övning ]              |  |
|  | T.ex. GRUND-26 eller SCH-104 från din yrkeslärare       |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  Mina Pågående Övningar                     [ + Skapa egen ]  |
|  +---------------------------------------------------------+  |
|  | 🏗️ Husgrund Typ A (Skapad av Lärare Lindqvist)          |  |
|  | 5 moment · 1 extern länk · 0/5 klara                    |  |
|  +---------------------------------------------------------+  |
+---------------------------------------------------------------+
```

### Lärarflöde (Övningsbyggare)
* Läraren väljer **"Övningsmallar & Kursuppgifter"** från menyn eller översikten.
* Klickar på **"Skapa ny övning"** -> Väljer grundmall (eller tom mall).
* En ren byggarvy med enkla switchar och fält:
  - **Grundinfo**: Titel, beskrivning, kursmål och deadline.
  - **Externa resurser / Länkar**: Lägg till länk med rubrik (t.ex. "AMA Tabell 13.5", "Ritning A-40", YouTube-klipp).
  - **Momenthantering**: Ändra befintliga moment, ändra toleransintervall, ställ in om foto krävs, eller lägg till helt nya moment.
  - **Generera kod**: Klicka på "Publicera till elever" för att få den 6-ställiga delningskoden.

### Adminpanel (Behörighets-switch)
* Under sektionen för användarhantering i `AccountsView`:
  - Switch: **"Tillåt yrkeslärare att skapa nya lärarkonton"** (PÅ/AV).
  - Tydlig info om att Lärare aldrig kan administrera Huvudadmin.

---

## 3. Nyckelbeslut & Avvägningar

| Område | Valt tillvägagångssätt | Fördelar / Motivering |
| :--- | :--- | :--- |
| **Kodlagring** | Övningskoder sparas i ett gemensamt övningsbibliotek (serverns lagring + offline synk). | Eleven kan slå in koden oavsett enhet och ladda ner uppgiften på en sekund. |
| **Fristående Guider** | Gör `TutorialModal`, `QuickNotesModal` och `PhotoArchiveModal` oberoende av `activeProjectId`. | Tar bort den förvirrande "tvingande nyskapandet av projekt" som upplevdes som en bugg. |
| **Rollisolering** | Strikt filtrering av användarlistan baserat på inloggad användares roll (`ADMIN` vs `TEACHER` vs `STUDENT`). | Lärare ser enbart elever och kan inte av misstag eller illvilja redigera Admin. |

---

## 4. Teknisk Arkitektur & Dataflöde

### Systemdiagram

```
┌───────────────────────────────────────────────────────────┐
│                        FältKoll App                       │
├─────────────────────────────┬─────────────────────────────┤
│        Elevgränssnitt       │       Lärargränssnitt       │
│  - Översikt & Övningskod    │  - Övningsbyggare           │
│  - Momentkontroll & Foton   │  - Momentredigerare & Länkar│
│  - Inlämning till lärare    │  - Kodgenerator (6 tecken)  │
└──────────────┬──────────────┴──────────────┬──────────────┘
               │                             │
               ▼                             ▼
┌───────────────────────────────────────────────────────────┐
│               Gemensam Övnings- & Auth-hubb               │
│  - ExerciseTemplates / SharedExercises                    │
│  - LocalStorage (Offline) + /api/exercises API Proxy      │
│  - Behörighetskontroll: ADMIN > TEACHER > STUDENT         │
└───────────────────────────────────────────────────────────┘
```

### Datamodell för Lärarövning
```ts
export interface TeacherExercise {
  code: string;            // t.ex. "GRUND-26"
  title: string;
  description: string;
  category: ProjectCategory;
  authorId: string;
  authorName: string;
  createdAt: string;
  links: Array<{ title: string; url: string; type?: 'AMA' | 'DRAWING' | 'VIDEO' | 'OTHER' }>;
  moments: CheckMoment[];  // Unika anpassade moment med toleranser och fotokrav
}
```

---

## 5. Implementeringssteg vid godkännande

1. **Fristående verktyg**:
   - Uppdatera `NavigationMenuModal.tsx` och `App.tsx` så att "Försyn & Skadeguide", "Fältboken" och "Fotopärm" öppnas direkt utan att omdirigera till nytt projekt.
2. **Behörighetsstyrning**:
   - Lägg till inställningen `allowTeachersCreateTeachers` i licens/systeminställningar.
   - Dölj administratörskonton för lärare i `AccountsView.tsx` och begränsa skapande av lärarkonton till administratör om flaggan är av.
3. **Lärarbyggare & Övningsmallar**:
   - Skapa `ExerciseBuilderModal.tsx` för lärare/admin med mallimportering, länkar, extra moment och kodgenerering.
   - Skapa `/api/exercises` i `server.ts` (med offline-fallback) för delning mellan lärare och elever via koder.
4. **Övningskods-inmatning för elever**:
   - Lägg till inmatningsfältet för övningskod i `DashboardView.tsx`.
   - Skapa projektinstans med elevens namn direkt när koden anges.
5. **Verifiering**:
   - Testa inloggning som lärare och elev, generering av övningskod och import, samt verifiera att Försyn/Fältbok fungerar fristående.
