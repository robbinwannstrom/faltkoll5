export interface FieldProblemItem {
  id: string;
  category: 'Schakt' | 'VA' | 'Grund' | 'Betong' | 'Allmänt';
  title: string;
  keywords: string[];
  cause: string;
  solution: string;
  amaReference: string;
  proTip: string;
}

export const FIELD_PROBLEMS_DB: FieldProblemItem[] = [
  {
    id: 'prob_1',
    category: 'Schakt',
    title: 'Schaktbotten är lerig / blöt och bärigheten sviktar',
    keywords: ['lera', 'blöt', 'schaktbotten', 'gyttja', 'bärighet', 'sörja', 'vatten i schakt', 'regn'],
    cause: 'Regnvatten eller högt grundvatten har mjukat upp mineraljorden, eller så har grävmaskinen kört runt och stört den orörda lerstrukturen.',
    solution: 'Schakta inte runt i blöt lera. Skrapa försiktigt av det uppblötta skiktet ner till orörd fast lera. Rulla omedelbart ut fiberduk (geotextil) klass N3 över hela ytan med minst 60 cm överlapp. Lägg ett bärande förstärkningslager med grov kross (t.ex. bergkross 0–90 eller 0–150 mm) innan finare makadam fylls på.',
    amaReference: 'AMA Anläggning 20 CBE.1 & YJJ.1',
    proTip: 'Kör ALDRIG med larvfötterna på ren lera efter regn. Lägg ut massorna framför maskinen så att grävaren alltid står på utrullad duk och krossbädd.',
  },
  {
    id: 'prob_2',
    category: 'Grund',
    title: 'Kryssmåttet slår fel (diagonalerna diffar mer än 5 mm)',
    keywords: ['kryssmått', 'diagonal', 'skevt', 'vinkel', 'pythagoras', '3-4-5', 'diffar', 'millimeter', 'kantelement'],
    cause: 'Grundens hörn bildar inte exakt 90 grader (vinkelräta). Ena långsidan eller kortsidan är förskjuten parallellt eller vinklad.',
    solution: 'Mät upp båda diagonalerna (hörn A till D, och hörn B till C). Beräkna differensen. Det hörn som tillhör den längre diagonalen ska flyttas inåt med halva differensen. Kontrollmät med 3-4-5-metoden längs hörnen. Toleransen enligt AMA är maximalt ±3–5 mm på en villagrund.',
    amaReference: 'AMA Hus 21 BEB.1 & SS-EN 13670',
    proTip: 'Lås alltid ena långsidan (baslinjen) orubbligt först. Justera sedan enbart kortsidorna tills båda diagonalmåtten är på millimetern identiska.',
  },
  {
    id: 'prob_3',
    category: 'VA',
    title: 'Avloppsrör får för dåligt fall eller bakfall',
    keywords: ['bakfall', 'avlopp', 'fall', 'lutning', 'stopp i rör', 'va', 'rörbädd', 'vattenpass'],
    cause: 'Rörgraven är ojämn, eller så har makadambädden satt sig efter att rören lagts.',
    solution: 'Markavloppsrör (110 mm) ska ha en kontinuerlig lutning på minst 10–20 promille (1–2 cm fall per meter). Justera rörbädden under röret med tvättad makadam (fraktion 4–8 eller 8–16 mm). Palla ALDRIG under med träbitar eller stenar – rörbädden måste ge jämnt stöd längs hela rörets undersida.',
    amaReference: 'AMA Anläggning 20 PBB.1 & Svenskt Vatten P92',
    proTip: 'Använd digitalt fallvattenpass eller mät in med laser vid varje muff. Provspola alltid med ett par hinkar vatten och se att det rinner undan blixtsnabbt innan isoleringen täcks på!',
  },
  {
    id: 'prob_4',
    category: 'Schakt',
    title: 'Makadam tränger ner i undergrunden (leran äter gruset)',
    keywords: ['makadam tränger ner', 'fiberduk', 'separationsduk', 'geotextil', 'lerbotten', 'omlott'],
    cause: 'Fiberduken har glidit isär vid utläggning, trasats sönder av grova stenar, eller lagts med för snålt överlapp.',
    solution: 'Lyft på gruset och skarva om fiberduken med minst 50 cm överlapp. Använd fiberduk med lägst nålfiltad bruksklass N2 (helst N3 vid trafikering). Lägg lite ballast på skarvarna så inte vinden eller backande lastbilar rullar upp duken.',
    amaReference: 'AMA Anläggning 20 YJJ.12',
    proTip: 'Kör inte dumper eller lastbil direkt på duken. Det måste alltid ligga minst 20–30 cm massor mellan däck/larver och fiberduken.',
  },
  {
    id: 'prob_5',
    category: 'Betong',
    title: 'Kantelementen (L-elementen) kalvar / trycks ut vid gjutning',
    keywords: ['kantelement', 'kalvar', 'trycks ut', 'balk rör sig', 'mothåll', 'gjutning', 'betongtryck'],
    cause: 'Det hydrostatiska trycket från den flytande betongen är enormt (ca 2,4 ton/m³). Kantelementen saknar tillräckligt yttre mothåll.',
    solution: 'Fyll upp med makadam eller schaktmassor som ett tungt yttre mothåll mot utsidan av kantelementen upp till minst halva höjden. Sätt skråstöttor i trä med jordankare var 1,5 meter runt hela sockeln. Fäst kantelementen i cellplastbotten med godkända fästkilar.',
    amaReference: 'AMA Hus 21 GBB & Leverantörsanvisning Grund',
    proTip: 'Spruta inte betongen med pumpen direkt mot kantelementets insida. Lägg betongen i mitten av plattan och låt den flyta ut mot kanterna i lugn takt.',
  },
  {
    id: 'prob_6',
    category: 'Schakt',
    title: 'Bergklack i schaktbotten hindrar rör eller rätt grundhöjd',
    keywords: ['berg', 'bergknalle', 'spränga', 'snigeldynamit', 'hydraulhammare', 'bergklack', 'schaktdjup'],
    cause: 'Oväntat berg som ligger grundare än geotekniska handlingar angav.',
    solution: 'Vid mindre klackar: knacka bort med grävmaskinens hydraulhammare. Vid större bergvolym: borra och använd snigeldynamit (expanderande murbruk) eller tillkalla bergsprängare med sprängbesiktning. Lämna alltid minst 10–15 cm utrymme under rör för mjuk rörbädd så att inte röret vilar stenhårt mot berg.',
    amaReference: 'AMA Anläggning 20 CBF.1',
    proTip: 'Fota bergklacken med måttband och laserhöjd innan åtgärd – detta är en klassisk ÄTA (ändrings- och tilläggsarbete) som beställaren ska ersätta.',
  },
  {
    id: 'prob_7',
    category: 'VA',
    title: 'Dagvattenrör ligger ovanför frostfritt djup',
    keywords: ['frostfritt', 'tjäle', 'tjäldjup', 'frysa', 'ispropp', 'isolera rör', 'markskiva'],
    cause: 'Kommunens anslutningspunkt ligger för grunt eller så medger inte tomtens fall tillräckligt schaktdjup.',
    solution: 'Om röret ligger grundare än frostfritt djup (normalt 1,2–1,8 meter beroende på klimatzon): isolera röret ovanifrån med markskivor av extruderad cellplast (XPS, t.ex. Sundolitt eller Jackon). Skivan ska vara minst 600 mm bred och läggas 10 cm ovanför rörets hjässa.',
    amaReference: 'AMA Anläggning 20 PBB.2 & Värme- och frostisolering i mark',
    proTip: 'En skiva som läggs som ett "U" eller brett tak över röret leder bort frosten effektivt och förhindrar att dagvattnet fryser till isproppar i mars.',
  },
  {
    id: 'prob_8',
    category: 'Grund',
    title: 'Armeringsmattan ligger platt på cellplasten utan distanser',
    keywords: ['armering', 'distanser', 'armeringsmatta', 'klossar', 'täckskikt', 'korrosion'],
    cause: 'Man har trampat ner armeringen eller glömt att sätta plastdistanser under mattan.',
    solution: 'Armeringsjärnen MÅSTE omslutas helt av betong för att ge bärighet och skydd mot rost (täckskikt minst 30–50 mm). Placera armeringsdistanser (speedies eller plastklossar) med ca 0,8 meters mellanrum i ett rutmönster. Lyft upp mattan så den vilar stadigt på distanserna.',
    amaReference: 'AMA Hus 21 EBB & SS-EN 1992-1-1 (Eurokod 2)',
    proTip: 'Gå inte direkt på armeringen efter att distanserna är satta, då knäcks plastklossarna. Lägg ut träreglar att gå på under gjutningen.',
  },
  {
    id: 'prob_9',
    category: 'Grund',
    title: 'Dräneringsröret hamnar högre än kantbalkens underkant',
    keywords: ['dränering', 'kantbalk', 'sockel', 'fukt', 'dränrör höjd', 'platta'],
    cause: 'Schakten har inte dragits tillräckligt djupt runt grundens ytterkant.',
    solution: 'Dräneringsrörets högsta punkt (hjässa) MÅSTE ligga under underkanten på husgrundens bärande isolering. Schakta ur en separat dräneringsränna runt plattan så att röret hamnar på rätt djup, och bädda in med tvättad makadam 8–16 mm.',
    amaReference: 'AMA Anläggning 20 PBB.51 & Boverkets Byggregler',
    proTip: 'Ligger dräneringsröret för högt kommer vatten att sugas in i grundbädden innan det ens når dräneringsröret!',
  },
  {
    id: 'prob_10',
    category: 'Schakt',
    title: 'Kabel eller optoslang påträffad utan markering',
    keywords: ['kabel', 'elledning', 'fiber', 'gräva av kabel', 'ledningskollen', 'olycka'],
    cause: 'Kabeln var felaktigt inmätt på ledningskartan eller saknade varningsband.',
    solution: 'Stoppa omedelbart maskinschaktningen! Handgräv försiktigt runt ledningen tills den är helt frilagd. Kontrollera med spänningsprovare / larma nätägaren vid misstanke om skada. Spänn upp skyddsvirke eller märk ut med röd sprayfärg.',
    amaReference: 'Arbetsmiljöverket & EBR Elsäkerhetsanvisningar',
    proTip: 'Fota kabelns läge med måttband mot fixpunkt innan du täcker igen. Notera alltid avvikelsen i fältanteckningarna!',
  },
];
