export interface MomentAiQuestion {
  question: string;
  instantAnswer: string;
  tag?: string;
}

export interface MomentAiData {
  momentId: string;
  instructionExcerpt: string;
  questions: MomentAiQuestion[];
}

export const MOMENT_AI_QUESTIONS: Record<string, MomentAiData> = {
  // ==========================================
  // HUSGRUND (PLATTA PÅ MARK)
  // ==========================================
  '1.1': {
    momentId: '1.1',
    instructionExcerpt:
      'Kontrollera ledningsanvisning via Ledningskollen.se innan markarbeten påbörjas... Montera profilställningar och spänn upp profilsnören... Kontrollera 90°-vinklar och kryssmått.',
    questions: [
      {
        question: 'Vad är Ledningskollen.se och varför är det ett lagkrav?',
        instantAnswer:
          'Ledningskollen.se är en statlig webbtjänst där alla nätägare (el, fiber, tele, fjärrvärme, kommunalt VA) får en förfrågan innan du gräver. Det är ett absolut krav eftersom du kan gräva av en högspänningskabel (livsfara) eller optofiber (skadestånd på hundratusentals kronor). Du måste ha godkänd ledningskoll och märka ut ledningarna med sprayfärg i marken innan grävmaskinen sätter skopan i jorden.',
        tag: 'Säkerhet & Lag',
      },
      {
        question: 'Vad är en profilställning och hur fungerar profilsnören?',
        instantAnswer:
          'En profilställning består av trästolpar och en vågrät bräda som slås ner utanför schakten i hörnen. Mellan profilerna spänns tunna, stumma snören (profilsnören) upp. Skärningspunkten mellan två snören markerar husets exakta hörn och fasadlinje. Eftersom de sitter en bit utanför schaktgropen rivs de inte av grävmaskinen när schaktningen pågår.',
        tag: 'Mätteknik',
      },
      {
        question: 'Varför är kryssmått och 90-gradersvinklar så kritiska?',
        instantAnswer:
          'Ett kryssmått är diagonalmätningen mellan motstående hörn på grunden. Om grundens sidor är 10 m och 8 m kan grunden ändå vara ett parallellogram (skevt som en romb) om inte diagonalerna är exakt lika långa. Om diagonalerna skiljer mer än ±5 mm blir alla rum i huset skeva, klinkergolv får sneda passbitar och takstolar passar inte.',
        tag: 'Geometri & Tolerans',
      },
      {
        question: 'Vad betyder en "fast fixpunkt" vid inmätning?',
        instantAnswer:
          'En fixpunkt är en orubblig referenspunkt med känd plushöjd (t.ex. en bult i berg, ett brunnslock eller kommunens stompunkt). Från denna fixpunkt nollar du din rotationslaser varje morgon så att alla schakt- och gjuthöjder hamnar på exakt rätt millimeter över havet.',
        tag: 'Höjdsättning',
      },
    ],
  },
  '1.2': {
    momentId: '1.2',
    instructionExcerpt:
      'Schakta bort all matjord och organiska jordlager inom hela byggnadsytan plus minst 1,5–2 meter utanför husets blivande kantelement. Lägg matjorden i separata avskilda upplag.',
    questions: [
      {
        question: 'Vad är matjord och varför kan den ALDRIG ligga kvar under grunden?',
        instantAnswer:
          'Matjord är det översta organiska jordlagret (humus, multnande växtdelar, rötter, mask). När organiskt material bryts ner minskar dess volym med tiden. Dessutom har matjord mycket hög vattenhållande förmåga och kan inte packas stumt. Lämnas matjord kvar under betongplattan kommer den att komprimeras ojämnt, vilket leder till sättningar och att hela husgrunden spricker.',
        tag: 'Geoteknik',
      },
      {
        question: 'Varför ska man schakta minst 1,5–2 meter utanför kantelementen?',
        instantAnswer:
          'Grunden behöver en tryckutbredningszon. Husets tyngd sprider sig nedåt i marken i en kon (ofta ca 45 graders vinkel). Om man bara schaktar precis vid kantelementets kant rasar bärlagret ut i schaktkanten. Dessutom behövs arbetsutrymme för att lägga dränering, dagvattenrör och montera yttre mothåll/stöttor mot kantelementen.',
        tag: 'Schaktkrav',
      },
      {
        question: 'Varför måste matjorden läggas i ett helt separat upplag?',
        instantAnswer:
          'Matjord är en värdefull resurs för framtida finplanering, gräsmattor och planteringar. Om du blandar ihop matjord med lera, pinnmo eller stenkross blir materialet odugligt som fyllnadsmassor och går inte att sälja eller använda. Separata massupplag sparar stora deponikostnader.',
        tag: 'Masshantering',
      },
    ],
  },
  '1.3': {
    momentId: '1.3',
    instructionExcerpt:
      'Rensa schaktbotten till fast, orörd mineraljord eller berg. Kontrollera schaktbotten mot fastställda plushöjder med laser.',
    questions: [
      {
        question: 'Vad räknas som "orörd mineraljord"?',
        instantAnswer:
          'Mineraljord är naturliga jordarter som morän, sand, grus eller fast lera som inte innehåller multnande växtdelar. "Orörd" betyder att marken legat opåverkad sedan istiden. Om du gräver för djupt och fyller tillbaka med lösa massor är den inte längre orörd och måste packas om eller förstärkas med kross.',
        tag: 'AMA Definition',
      },
      {
        question: 'Vad gör man om schaktbotten består av mjuk och blöt lera?',
        instantAnswer:
          'Lera har dålig bärighet och blir snabbt till såpa om det regnar eller om maskiner kör i den. Åtgärd enligt AMA: 1) Avbryt direkt och kör inte i botten med tunga maskiner, 2) Rulla ut fiberduk med hög rivstyrka (klass N3), 3) Förstärk med grovt bergskross (t.ex. 0/90 eller 20/90 mm) i ett packat bärande skikt innan kapillärbrytande makadam läggs.',
        tag: 'Fältåtgärd',
      },
      {
        question: 'Vad är en "plushöjd" och hur kontrolleras den med laser?',
        instantAnswer:
          'Plushöjden (t.ex. +24.850) anger höjden i meter över nollplanet (RH2000). Med rotationslasern sätter du mottagaren på en mätstång. Mottagaren piper med fast ton när du står på exakt projekterad nivå. Det visar om schaktbotten ska grävas djupare eller om du träffat rätt nivå.',
        tag: 'Laser & Mätning',
      },
    ],
  },
  '1.4': {
    momentId: '1.4',
    instructionExcerpt:
      'Rulla ut geotextil (lägst klass N2, vid sämre bärighet klass N3) över hela schaktbotten. Skarva duken med minst 50 cm överlapp i alla fogar.',
    questions: [
      {
        question: 'Vad är skillnaden mellan fiberduk klass N1, N2 och N3?',
        instantAnswer:
          'Klassningen (NorGeoSpec) beskriver dukens mekaniska draghållfasthet och punkteringsmotstånd mot vassa stenar:\n• N1: Tunn duk, används främst för dräneringsrör och rabatter.\n• N2: Standardduk för normala husgrunder och markbeläggningar på fast underlag.\n• N3: Extra kraftig duk för dålig bärighet, blöt lera, tung dumperkörning eller grovt sprängstensunderlag.',
        tag: 'Materialkunskap',
      },
      {
        question: 'Varför måste fiberduken ha minst 50 cm överlapp i alla skarvar?',
        instantAnswer:
          'När makadam tippas eller schaktas ut med hjullastare utsätts duken för enorma sidokrafter. Vid för litet överlapp (t.ex. 10 cm) glider våderna isär. Då väller underliggande lera upp och tränger in i makadambädden, vilket gör att kapillärbrytningen upphör och grunden tappar bärighet.',
        tag: 'AMA Regler',
      },
      {
        question: 'Hur fäster man fiberduken så den inte blåser bort?',
        instantAnswer:
          'Lägg några spadar makadam eller rundade stenar direkt på skarvarna och hörnen allt eftersom du rullar ut den. Dra också upp duken minst 30–50 cm längs schaktkanterna så att inte jordmassor kan rasa in över gruset.',
        tag: 'Fälttips',
      },
    ],
  },
  '1.5': {
    momentId: '1.5',
    instructionExcerpt:
      'Lägg dräneringsrör (slitsade plaströr) runt grundens ytterperimeter. Rörens högsta punkt måste ligga under underkant på kantelementens isolering. Säkerställ kontinuerligt fall (minst 5 mm/m) mot dräneringsbrunn.',
    questions: [
      {
        question: 'Vad är ett slitsat dräneringsrör och hur fungerar det?',
        instantAnswer:
          'Ett dräneringsrör har små längsgående spår (slitsar) i plastväggen. När grundvatten stiger runt huset rinner vattnet genom slitsarna in i röret och leds bort med självfall till en dräneringsbrunn eller stenkista.',
        tag: 'VA-teknik',
      },
      {
        question: 'Varför måste dränrörets högsta punkt ligga UNDER kantelementens isolering?',
        instantAnswer:
          'Om dräneringsröret läggs för högt (i nivå med eller ovanför grundens underkant) kan grundvatten och smältvatten stiga upp i cellplasten och betongplattan innan det når dräneringsröret. Rörhjässan (överkant på röret) ska alltid ligga under kantbalkens underkant.',
        tag: 'Byggfel & Skydd',
      },
      {
        question: 'Hur mycket fall krävs (5 mm/m) och hur mäts det?',
        instantAnswer:
          'Ett fall på minst 5 mm per meter (0,5 %) är AMA-krav för dräneringsledningar. Det betyder att på en 10 meter lång vägg ska röret sjunka minst 5 centimeter. Kontrollera med vattenpass eller rotationslaser direkt på röret.',
        tag: 'Tolerans',
      },
    ],
  },
  '1.6': {
    momentId: '1.6',
    instructionExcerpt:
      'Montera täta markrör (orange 110 mm) för takavvattning (stuprör) separerat från dräneringsledningarna. Montera spol- och rensbrunnar vid strategiska hörn.',
    questions: [
      {
        question: 'Varför får man ALDRIG blanda ihop takvatten och dränering i samma rör?',
        instantAnswer:
          'Taket fångar upp enorma volymer vatten vid ett skyfall (hundratals liter per minut). Dräneringsrören är perforerade med hål. Om du kopplar stuprören till dräneringen kommer takvattnet att tryckas ut ur hålen och tryckvattna grunden inifrån! Det leder garanterat till fuktskador och källaröversvämning. Dagvatten och dränering ska alltid gå i separata system.',
        tag: 'Kritiskt Byggfel',
      },
      {
        question: 'Vad skiljer orange markrör från vanliga vita inomhusavloppsrör?',
        instantAnswer:
          'Orangea markrör (PVC/PP, styvhetsklass SN4 eller SN8) är extra kraftiga och tål jordtryck, markrörelser, tjäle och kyla utan att krossas eller deformeras. Vita inomhusrör (HT-PP) är inte UV-resistenta och har för tunn godstjocklek för att klara markbelastning.',
        tag: 'Materialkunskap',
      },
      {
        question: 'Vad har spol- och rensbrunnar för funktion?',
        instantAnswer:
          'De gör det möjligt att spola rent ledningarna med högtryck och inspektera med rörkamera om löv, grus eller rötter täpper till systemet om 10–20 år utan att behöva gräva upp hela trädgården.',
        tag: 'Drift & Underhåll',
      },
    ],
  },
  '1.7': {
    momentId: '1.7',
    instructionExcerpt:
      'Förlägg avloppsledningar (110/75/50 mm PP/PVC) för wc, kök, bad och tvättstuga. Säkerställ korrekt fall (1–2 cm/meter / 1:50–1:100). Fäst och fixera rören i makadamet.',
    questions: [
      {
        question: 'Varför får avlopp varken ha för lite eller för mycket fall?',
        instantAnswer:
          '• För lite fall (<1 cm/m): Vattnet rinner för långsamt och fasta partiklar (avföring, papper) stannar kvar och skapar stopp.\n• För kraftigt fall (>2–3 cm/m): Vattnet rinner undan blixtsnabbt före pappret och fekalierna, så det torrläggs och fastnar i röret.\nStandard enligt AMA och Svenskt Vatten är därför 1–2 cm per meter (1:50 till 1:100).',
        tag: 'VVS-fysik',
      },
      {
        question: 'Hur fixerar man rören så att fallet inte ändras vid gjutning?',
        instantAnswer:
          'Rören kilas och bäddas noga med tvättad makadam runtom och najjas fast eller förankras med stålband/armeringsjärn. När betongbilen trycker ut tung betong och vibrostaven vibrerar vill tomma rör flyta upp eller knäckas om de inte är stenhårt fixerade.',
        tag: 'Gjutklar',
      },
      {
        question: 'Varför måste alla avstick proppas med riktiga rörproppar?',
        instantAnswer:
          'Om en enda makadamsten, cellplastbit eller skvätt betong ramlar ner i ett öppet avloppsrör bildas en cementpropp. Då måste man bila upp hela den nygjutna betongplattan för att byta röret. Sätt alltid på riktiga fabriksgummiproppar med klämring.',
        tag: 'Fältregel',
      },
    ],
  },
  '1.8': {
    momentId: '1.8',
    instructionExcerpt:
      'Lägg in skyddsrör för inkommande servisvatten (PEM 32/40 mm), elservis, optofiber och eventuell jordvärme/bergvärme under grunden upp till blivande teknikrum.',
    questions: [
      {
        question: 'Vad är en PEM-slang och vad står beteckningen för?',
        instantAnswer:
          'PEM står för PolyEten Medeldensitet (ofta svart plastslang med blå längsgående rand för dricksvatten). Den tål högt vattentryck (ofta PN10/PN12,5 bar) och är godkänd för markförläggning under husgrunder.',
        tag: 'Materialkunskap',
      },
      {
        question: 'Varför måste böjarna på tomrören ha minst 1 meters radie?',
        instantAnswer:
          'Styva elkablar och grova PEM-slangar kan inte böjas i 90-graders skarpa vinklar. Gör du en för skarp böj under plattan fastnar kabeln eller slangen halvvägs och går inte att trycka igenom.',
        tag: 'Byggteknik',
      },
      {
        question: 'Vad gör dragtråden och varför ska den surras ordentligt?',
        instantAnswer:
          'Dragtråden är en stark nylontråd eller ståltråd inuti tomröret som används för att dra igenom den riktiga kabeln senare. Den måste surras fast i båda ändarna så att den inte sugs in i röret när massor skyfflas eller när vatten rinner igenom.',
        tag: 'Fältråd',
      },
    ],
  },
  '1.9': {
    momentId: '1.9',
    instructionExcerpt:
      'Lägg ut perforerad radonslang i slingor i det kapillärbrytande makadamlagret alternativt montera godkänd radonduk enligt geoteknisk radonriskklass.',
    questions: [
      {
        question: 'Vad är markradon och varför är det farligt?',
        instantAnswer:
          'Radon är en osynlig, luktfri radioaktiv gas som bildas när uran bryts ner naturligt i berggrunden och marken. Gasen sugs in i hus genom otätheter i grunden och är den näst vanligaste orsaken till lungcancer i Sverige efter rökning. Boverkets gränsvärde är max 200 Bq/m³.',
        tag: 'Hälsa & BBR',
      },
      {
        question: 'Hur fungerar en perforerad radonslang i makadambädden?',
        instantAnswer:
          'Slangen läggs i serpentinslingor i makadamen under hela huset och leds upp till en ventilationshuv på taket eller till teknikrummet. Om radonmätningen efter inflyttning visar höga halter kopplar man på en mekanisk radonfläkt som skapar undertryck under huset och suger ut gasen innan den tränger in.',
        tag: 'Radonskydd',
      },
      {
        question: 'Vad är en radonmanschett och var ska den sitta?',
        instantAnswer:
          'Det är en elastisk krage i gummi eller butyl som tätar stenhårt runt varje rörgenomföring (avlopp, vatten, el) där röret bryter igenom radonduken eller betongen så att inte gas kan läcka upp längs rörväggen.',
        tag: 'Tätning',
      },
    ],
  },
  '1.10': {
    momentId: '1.10',
    instructionExcerpt:
      'Väg av och finjustera det kapillärbrytande makadamlagret med rotationslaser. Höjdavvikelsen under kantelementen får maximalt vara ±5 mm från projekterad plushöjd.',
    questions: [
      {
        question: 'Vad innebär en tolerans på ±5 mm?',
        instantAnswer:
          'Det innebär att ytan under kantelementen får avvika högst 5 millimeter uppåt eller 5 millimeter nedåt från ritningens exakta höjd. Om underlaget diffar 15–20 mm kommer kantelementen att vicka, spricka eller bli vågiga, och husets väggar kommer att luta.',
        tag: 'AMA Tolerans',
      },
      {
        question: 'Varför kontrollerar man lasern mot en fixpunkt både morgon och kväll?',
        instantAnswer:
          'Ett laserstativ kan sjunka några millimeter i mjuk mark under dagen, eller rubbas av vibrationer från en dumper eller vält. Om du inte kontrollerar lasern mot samma fasta referenspunkt (t.ex. berg eller sockel) kan hela grunden bli byggd snett.',
        tag: 'Mätnoggrannhet',
      },
      {
        question: 'Hur skapar man en avdragningsbädd med millimeterprecision?',
        instantAnswer:
          'Lägg ner avdragningsrör i makadamen, väg in dem med lasern på exakt höjd och dra sedan av makadamen med en lång rätskiva i aluminium. Rensa bort större stenar under kantelementens fot.',
        tag: 'Hantverk',
      },
    ],
  },
  '1.11': {
    momentId: '1.11',
    instructionExcerpt:
      'Fyll upp med tvättat kapillärbrytande makadam/singel. Exempel på tre godkända fraktioner: 1) 8–16 mm (vanligast på skolan), 2) 16–22 mm, 3) 16–32 mm. Packa i skikt om max 20–30 cm med vibratorplatta.',
    questions: [
      {
        question: 'Vilka makadamfraktioner fungerar och varför har skolan 8/16 mm?',
        instantAnswer:
          'Tre godkända kapillärbrytande fraktioner är:\n1. 8/16 mm – Skolans favorit! Mycket lätt att skotta och jämna till med handredskap i övningsbädden, samtidigt som den har god bärighet och låser sig bra.\n2. 16/22 mm – Något grövre makadam med utmärkt dräneringsförmåga.\n3. 16/32 mm – Traditionell grov makadam för djupa fyllningar och stora markbäddar.\nAlla tre fungerar utmärkt eftersom de är tvättade och saknar nollfraktion.',
        tag: 'Materialval',
      },
      {
        question: 'Vad betyder "kapillärbrytande" material och varför är det ett krav?',
        instantAnswer:
          'Kapillärkraft är jordens förmåga att suga upp fukt underifrån (som en sockerbit suger upp kaffe). Om materialet innehåller sand eller lera sugs markfukt upp till betongplattan och ger fuktskador. Tvättad makadam har så stora hålrum mellan stenarna att vatten inte kan klättra uppåt mot tyngdkraften.',
        tag: 'Byggnadsfysik',
      },
      {
        question: 'Varför måste man packa i skikt om max 20–30 cm?',
        instantAnswer:
          'En vibratorplatta (padda) på 100–200 kg har bara komprimeringsverkan ner till ca 25–30 cm djup. Fyller du på 60 cm makadam på en gång kommer de undre 30 centimetrarna att förbli opackade. När huset sedan byggs sätter sig marken och golvet spricker.',
        tag: 'Packningsteknik',
      },
      {
        question: 'Hur många överfarter krävs med paddan?',
        instantAnswer:
          'Enligt AMA och tillverkarnas anvisningar krävs minst 4–6 överfarter i kors över varje skikt. Kör långsamt och se till att plattan överlappar föregående spår med minst hälften.',
        tag: 'AMA Regler',
      },
    ],
  },
  '1.12': {
    momentId: '1.12',
    instructionExcerpt:
      'Sätt ut kantelementen (L-stöd) exakt i våg och linje enligt profilsnörena. Lägg balk och rikta in alla 90-gradershörn längs kryssmått och kontrollera mothåll.',
    questions: [
      {
        question: 'Vad är ett L-stöd/kantelement och vad gör det?',
        instantAnswer:
          'Ett kantelement är en prefabricerad formsättning av cellplast med ett ytskikt av fiberarmerad betong. Det bildar en isolerad gjutform för husets kantbalk och utgör den färdiga sockeln på husets fasad.',
        tag: 'Konstruktion',
      },
      {
        question: 'Vad innebär att "gjutsäkra" elementen med mothåll?',
        instantAnswer:
          'När betongbilen tömmer flytande betong väger betongen 2,4 ton per kubikmeter! Trycket utåt mot kantelementen är enormt. Om du inte lägger schaktmassor eller makadam mot utsidan av elementen (eller stöttar med trästrävor) kommer formen att kalva utåt under gjutningen.',
        tag: 'Gjutrisk & Säkerhet',
      },
      {
        question: 'Varför kontrollerar man diagonalerna/kryssmåttet igen när elementen står på plats?',
        instantAnswer:
          'Även om snörena satt rätt kan elementen ha förskjutits några centimeter när de sattes ner på makadamen. Om diagonalerna inte stämmer innan armering och gjutning är hela husgrunden sned permanent.',
        tag: 'Kvalitetskontroll',
      },
    ],
  },
  '1.13': {
    momentId: '1.13',
    instructionExcerpt:
      'Lägg ut cellplastskivor (EPS) i tre omlottliggande lager (totalt oftast 300 mm isolering) med brutna skarvar i alla riktningar.',
    questions: [
      {
        question: 'Vad är EPS och vilken tryckhållfasthet ska den ha?',
        instantAnswer:
          'EPS står för Expanderad PolyStyren (vit cellplast). Under en villa används vanligen EPS S100 eller S80 i plattans mitt, medan kantbalken där ytterväggar och tak vilar ofta kräver hårdare EPS S200 eller S300.',
        tag: 'Materialkunskap',
      },
      {
        question: 'Vad är en köldbrygga och varför måste skarvarna brytas omlott?',
        instantAnswer:
          'Om alla skarvar i de tre lagren skulle ligga rakt ovanför varandra bildas en rak springa från betongen ner till marken. Där läcker husets värme ut och markkyla tränger in (köldbrygga). Genom att förskjuta skivorna täcks varje skarv av en hel skiva.',
        tag: 'Energikrav & BBR',
      },
      {
        question: 'Vad gör plasthullingar (plastspik)?',
        instantAnswer:
          'Plasthullingar trycks ner mellan de olika lagren av cellplast för att låsa ihop skivorna så att de bildar ett stumt paket och inte glider isär eller blåser iväg innan betongen gjuts.',
        tag: 'Montering',
      },
    ],
  },
  '1.14': {
    momentId: '1.14',
    instructionExcerpt:
      'Lägg ut armeringsbyglar i kantbalken och rulla ut armeringsmattor över cellplasten. Lyft upp mattorna på plastdistanser (klossar, ca 3–5 cm höga) så armeringen hamnar mitt i betongen.',
    questions: [
      {
        question: 'Vad gör plastdistanser och varför får armeringen ALDRIG ligga platt mot cellplasten?',
        instantAnswer:
          'Betong har fantastisk tryckhållfasthet men usel draghållfasthet. Armeringsstålet tar upp alla dragkrafter och böjpåkänningar. För att stålet ska fungera och skyddas mot fukt måste det vara helt omslutet av minst 30 mm betong (täckande betongskikt). Ligger nätet platt mot cellplasten gör det noll nytta och plattan spricker.',
        tag: 'Hållfasthetslära',
      },
      {
        question: 'Vad betyder att "naja" armering?',
        instantAnswer:
          'Att naja innebär att binda ihop överlappande armeringsjärn och armeringsnät med mjuk glödgad ståltråd (najtråd) med hjälp av en najtång eller najsnurra så att nätet inte glider isär när man kliver på det.',
        tag: 'Armeringsteknik',
      },
      {
        question: 'Vad är en armeringsbygel i kantbalken?',
        instantAnswer:
          'Byglar är U-formade eller fyrkantiga bockade järn (ofta 8–10 mm) som placeras i kantbalken med jämna mellanrum för att hålla de längsgående armeringsstängerna på plats och ta upp skjuvkrafter från husets ytterväggar.',
        tag: 'Konstruktion',
      },
    ],
  },

  // ==========================================
  // PLATTSÄTTNING & MARKSTEN
  // ==========================================
  '2.1': {
    momentId: '2.1',
    instructionExcerpt:
      'Slå ner armeringsjärn och spänn upp ett spänt riktsnöre. Väg av höjden med laser så att stensättningen får rätt fall (lutning) bort från huset.',
    questions: [
      {
        question: 'Hur mycket fall krävs bort från husvägg och varför?',
        instantAnswer:
          'AMA föreskriver ett fall på minst 1–2 cm per meter (10–20 promille) på de första 2–3 metrarna ut från en husgrund. Om fallet lutar mot huset rinner allt regn- och smältvatten rakt in mot sockeln och orsakar fuktskador och källaröversvämning.',
        tag: 'Marklutning & AMA',
      },
      {
        question: 'Hur spänner man ett riktsnöre så det blir spikrakt utan att bågna?',
        instantAnswer:
          'Slå ner kraftiga armeringsjärn (10–12 mm) stadigt i backen, använd ett stumt murarsnöre i nylon och dra åt det så hårt att det sjunger när du knäpper på det. Vid långa sträckor (>10 m) kan ett stödjärn behövas på mitten för att inte snöret ska hänga ner av sin egen vikt.',
        tag: 'Mätteknik',
      },
    ],
  },
  '2.2': {
    momentId: '2.2',
    instructionExcerpt:
      'Kontrollera att riktsnörena ligger i exakt 90 graders vinkel ut från byggnadens vägg med Pythagoras sats (3-4-5-metoden). Kontrollera kryssmått.',
    questions: [
      {
        question: 'Hur fungerar 3-4-5-metoden (Pythagoras sats) i praktiken på bygget?',
        instantAnswer:
          'Mät upp 3 meter längs husväggen (katet a) och sätt ett märke. Mät sedan 4 meter ut vinkelrätt längs riktsnöret (katet b) och sätt ett märke. Mät nu diagonalen mellan dessa två punkter med måttband. Om vinkeln är exakt 90 grader är diagonalen EXAKT 5,00 meter (eftersom 3² + 4² = 9 + 16 = 25 = 5²).',
        tag: 'Praktisk Geometri',
      },
      {
        question: 'Vad händer om man inte gör denna vinkelkontroll?',
        instantAnswer:
          'Om vinkeln diffar med bara 1 grad ser det rakt ut i början, men efter 10 meter stenläggning har linjen glidit iväg med 17 centimeter! Då måste du kapa varenda sten snett mot huset eller kanten, vilket ser oprofessionellt ut och tar timmar extra.',
        tag: 'Byggfel & Slöseri',
      },
    ],
  },
  '2.3': {
    momentId: '2.3',
    instructionExcerpt:
      'Gräv ner parallella avdragningsrör (ca 30 mm ytterdiameter) i det packade stenfliset (fraktion 2–4 eller 2–5 mm). Mät in rörens ovansida med laser... Dra sedan en rätskiva.',
    questions: [
      {
        question: 'Vad är stenflis (fraktion 2–4 / 2–5 mm) och varför används inte sand?',
        instantAnswer:
          'Stenflis består av krossat berg med vassa kanter utan finmaterial/mjöl. Det har två enorma fördelar jämfört med sättsand: 1) Myror kan inte bygga gångar i flis, 2) Vattnet dräneras rakt igenom vilket minskar risken för tjälskjutning på vintern.',
        tag: 'Materialval',
      },
      {
        question: 'Hur drar man av med rör och rätskiva för bästa resultat?',
        instantAnswer:
          'Lägg två rör parallellt i flisen på lagom avstånd för din rätskiva (t.ex. 2 meter). Väg in rörens ovansida exakt med laser och fall. Häll flis mellan och över rören. Dra rätskivan med sågande rörelser mot dig ovanpå rören. Lyft sedan försiktigt bort rören och fyll i spåren med flis utan att trampa på ytan.',
        tag: 'Hantverksteknik',
      },
      {
        question: 'Varför får man absolut inte trampa på den avdragna flisytan?',
        instantAnswer:
          'Varje fotspår komprimerar flisen lokalt. Även om du krattar över fotspåret kommer stenen som läggs ovanpå det gamla fotsteget att sjunka ner några millimeter när ytan paddas i slutet, vilket skapar fula gropar och svackor där vatten blir stående.',
        tag: 'Yrkesregel',
      },
    ],
  },
  '2.4': {
    momentId: '2.4',
    instructionExcerpt:
      'Lägg ut markstenen i önskat förband. Kontrollera att den fasade kanten är uppåt. Använd plattornas inbyggda distanser för att hålla en jämn fog på ca 3 mm.',
    questions: [
      {
        question: 'Vad betyder att lägga plattor i "förband"?',
        instantAnswer:
          'Att lägga i förband (t.ex. halvstensförband eller blockförband) innebär att stenarnas skarvar förskjuts i förhållande till föregående rad. Detta låser stenarna i varandra så att de inte glider isär eller kantrar när en bil kör över dem.',
        tag: 'Mönster & Stabilitet',
      },
      {
        question: 'Vad gör plattornas inbyggda distansknastar?',
        instantAnswer:
          'Moderna markstenar har små upphöjda knoppar på sidorna (ca 2–3 mm). De ser till att stenarna aldrig ligger stumt kant-i-kant. Det ger utrymme för fogsand och förhindrar att stenarna spräcker varandras kanter när de belastas och rör sig.',
        tag: 'Stenens funktion',
      },
      {
        question: 'Vilken sida är den fasade kanten och varför ska den vara uppåt?',
        instantAnswer:
          'Fasen är den lilla sneda avfasningen längs stenens överkant. Den ska alltid peka uppåt mot himlen. Den gör att ytan blir behaglig att gå på, minskar risken för att snöskyffeln hakar fast och förhindrar att plattornas hörn bryts av vid frost.',
        tag: 'Montering',
      },
    ],
  },
  '2.5': {
    momentId: '2.5',
    instructionExcerpt:
      'Mät ut passbitarna i kanterna noga, rita en linje med märkpenna och kapa stenen med en motorkap eller ett kapbord med vattenkylning.',
    questions: [
      {
        question: 'Vad är kvartsdamm och varför är det livsviktigt med P3-andningsskydd?',
        instantAnswer:
          'Betong och sten innehåller kristallin kiseldioxid (kvarts). När du kapar stenen torrt bildas mikroskopiskt fint damm som tränger djupt ner i lungblåsorna och orsakar silikos (stendammslunga) och lungcancer. Använd alltid vattenkylt kapbord eller godkänd halvmask med P3-partikelfilter.',
        tag: 'Arbetsmiljö & Hälsa',
      },
      {
        question: 'Hur minimerar man mängden kapningar vid stensättning?',
        instantAnswer:
          'Genom noggrann modulplanering! Justera bredden på gången eller uteplatsen så att den stämmer med stenens jämna modulmått plus fogar (t.ex. 21 cm per rad). Använd även halva fabriksstenar vid kanterna istället för att såga till små passbitar.',
        tag: 'Planeringstips',
      },
    ],
  },
  '2.6': {
    momentId: '2.6',
    instructionExcerpt:
      'Häll ut fogsand (hårdgörande eller tvättad naturfogsand fraktion 0–2 eller 0–4 mm) över ytan. Sopa sanden diagonalt över plattorna så att alla fogar fylls helt till toppen.',
    questions: [
      {
        question: 'Varför måste man sopa fogsanden DIAGONALT över plattorna?',
        instantAnswer:
          'Om du sopar i samma riktning som fogarna (parallellt) fungerar kvasten som en skrapa som drar upp sanden ur fogen igen. Sopar du diagonalt i 45 graders vinkel packas sanden ner i fogarna utan att dras ur.',
        tag: 'Sopteknik',
      },
      {
        question: 'Varför måste markstenen vara helt torr när man fogar?',
        instantAnswer:
          'Om stenarna är fuktiga av regn eller morgondagg fastnar den finkorniga fogsanden som en kladdig hinna på plattornas ovansida istället för att rinna ner och fylla ut hålrummen i botten av fogen.',
        tag: 'Kvalitetskrav',
      },
      {
        question: 'Vad händer med en stensättning om fogarna inte är fyllda?',
        instantAnswer:
          'Fogen är stensättningens stötdämpare! När en bil kör eller svänger över plattorna överförs krafterna genom fogsanden till grannstenarna. Utan fyllda fogar vrider sig plattorna, kanterna fläks sönder och ogräs börjar växa omedelbart.',
        tag: 'Hållbarhet',
      },
    ],
  },

  // ==========================================
  // ENSKILT AVLOPP & INFILTRATION
  // ==========================================
  '3.1': {
    momentId: '3.1',
    instructionExcerpt:
      'Ta ett jordprov från schaktområdet i handen på det tänkta infiltrationsdjupet. Fukta jorden lite och försök rulla den till en smal korv eller ett fast klot i handen (perkolationsbedömning).',
    questions: [
      {
        question: 'Hur fungerar rulltestet i handen och vad visar det?',
        instantAnswer:
          'Ta en näve jord, tillsätt lite vatten och rulla den mellan handflatorna:\n• Faller korven isär vid >6 mm tjocklek: Grov sand/morän med hög vattengenomsläpplighet (perfekt för infiltration).\n• Går den att rulla till en smal korv (<3 mm) som håller ihop och känns klibbig/blank: Lera eller silt. Då är marken för tät för vanlig infiltration.',
        tag: 'Jordprovsteknik',
      },
      {
        question: 'Vad gör man om rulltestet visar att marken består av tät lera?',
        instantAnswer:
          'Då måste man byta avloppslösning! Vanlig infiltration kan inte suga upp vattnet. Lösningen är en markbädd med tät botten och dräneringsrör i botten som samlar upp det renade vattnet och leder det till ett öppet dike, eller ett minireningsverk.',
        tag: 'Miljöbalk & Regler',
      },
      {
        question: 'Vad innebär begreppet "perkolation"?',
        instantAnswer:
          'Perkolation är hastigheten med vilken vatten sjunker och filtreras nedåt genom markens porer. Vid godkänt perkolationsvärde hinner mikroorganismerna i marken bryta ner bakterier innan vattnet når grundvattnet.',
        tag: 'Geohydrologi',
      },
    ],
  },
  '3.2': {
    momentId: '3.2',
    instructionExcerpt:
      'Gräv gropen för slamavskiljaren (trekammarbrunnen) samt schaktet för infiltrationens spridningslager... orörd schaktbotten.',
    questions: [
      {
        question: 'Varför får grävmaskinen ALDRIG larva i botten av infiltrationsschaktet?',
        instantAnswer:
          'Detta är ett av de vanligaste misstagen på avloppsbyggen! Maskinens tunga larvband och skoptryck smetar ihop markens naturliga kapillärer och porer och gör botten stenhård och tät. Då kan inte avloppsvattnet tränga ner i marken och anläggningen dör efter bara några månader.',
        tag: 'Kritiskt Maskinförbud',
      },
      {
        question: 'Vad är en trekammarbrunn / slamavskiljare?',
        instantAnswer:
          'En trekammarbrunn separerar fasta ämnen från avloppsvattnet i tre steg. Tungt slam sjunker till botten i första kammaren, flytslam (fett, papper) samlas vid ytan, och det relativt partikelfria vattnet rinner vidare från sista kammaren till infiltrationen.',
        tag: 'Avloppskonstruktion',
      },
    ],
  },
  '3.3': {
    momentId: '3.3',
    instructionExcerpt:
      'Mät och kontrollera avståndet ner till grundvattenytan i schaktbotten. Det måste vara minst 1 meter fritt avstånd mellan spridningslagrets botten och högsta grundvattennivå eller berg.',
    questions: [
      {
        question: 'Varför är kravet på minst 1 meter till grundvattnet så stenhårt?',
        instantAnswer:
          'Avloppsvattnet måste passera minst en meter syresatt sandbädd för att bakterier, virus och fosfor ska renas biologiskt. Ligger spridningsrören i eller för nära grundvattnet rinner orenat fekalievatten rakt ut i grundvattnet och förorenar dricksvattnet i närliggande brunnar.',
        tag: 'Miljö & Smittskydd',
      },
      {
        question: 'Hur ser man var högsta grundvattenytan har varit även om gropen är torr just nu?',
        instantAnswer:
          'Titta på markens färg i schaktväggen! Om jorden har gråblå eller rostfläckiga stråk (rostutfällningar/glej) visar det att grundvattnet stått där under våren. Högsta grundvattennivån räknas från dessa rostfläckar, inte var vattnet står en torr sommardag.',
        tag: 'Jordmorfologi',
      },
      {
        question: 'Vad gör man om grundvattnet står för högt (<1 meter fri höjd)?',
        instantAnswer:
          'Man bygger en "upphöjd infiltration" (infiltrationskulle). Det innebär att anläggningen byggs ovanpå befintlig markyta med ren sand och makadam och att avloppsvattnet pumpas upp via en pumpbrunn från slamavskiljaren.',
        tag: 'Teknisk lösning',
      },
    ],
  },
  '3.4': {
    momentId: '3.4',
    instructionExcerpt:
      'Sätt ner slamavskiljaren (trekammarbrunnen) i gropen på en avdragen bädd av stenfritt grus/flis. Väg av brunnen i våg med vattenpass och fyll brunnen med vatten direkt under tiden du återfyller.',
    questions: [
      {
        question: 'Varför MÅSTE man fylla plastbrunnen med vatten under återfyllningen?',
        instantAnswer:
          'Två kritiska orsaker:\n1. Marktryck: Tyngden av grus och massor utanför trycker ihop en tom plasttank så att den krossas eller deformeras.\n2. Flytkraft: Om det börjar regna fungerar en tom plastbrunn som en båt och flyter upp ur gropen så att rörledningar bryts av.',
        tag: 'Fältregel & Skaderisk',
      },
      {
        question: 'Varför måste brunnen stå i absolut våg?',
        instantAnswer:
          'I en trekammarbrunn styrs vattenflödet av T-rör och överströmningskanter mellan kamrarna. Lutar brunnen rinner slammet rakt över till infiltrationen utan att sedimentera och täpper till spridarrören.',
        tag: 'Funktion',
      },
    ],
  },
  '3.5': {
    momentId: '3.5',
    instructionExcerpt:
      'Lägg ut spridningslagret med tvättat makadam (fraktion 16–32 eller 16–22 mm, ca 25–30 cm tjockt). Montera fördelningsbrunnen och lägg ut de slitsade 110 mm spridarrören med ett svagt, jämnt fall (ca 0,5–1 cm per meter).',
    questions: [
      {
        question: 'Vad är fördelningsbrunnens vattenutjämningsklockor till för?',
        instantAnswer:
          'Vattenutjämningsklockorna är justerbara plastkragar över utloppen i brunnen. Genom att vrida på klockorna justerar du så att exakt lika mycket avloppsvatten rinner ut i varje spridningsledning, vilket förhindrar att en sträng överbelastas och dränks.',
        tag: 'VA-detalj',
      },
      {
        question: 'Varför ska spridarrören ha just 0,5–1 cm fall per meter?',
        instantAnswer:
          'Spridarrören ska fördela vattnet jämnt över hela bäddens längd. Har röret för brant fall rinner allt vatten till änden av röret; har det bakfall blir vattnet stående i början. 0,5–1 cm/m ger en perfekt balanserad utströmning genom slitsarna.',
        tag: 'Tolerans & Fall',
      },
      {
        question: 'Vilken makadamfraktion ska användas i spridningslagret?',
        instantAnswer:
          'Tvättad makadam 16/32 mm eller 16/22 mm utan nollfraktion. Stenarna bildar stora porer där syre kan cirkulera och där den biologiska biohuden kan växa och rena vattnet.',
        tag: 'Materialval',
      },
    ],
  },
  '3.6': {
    momentId: '3.6',
    instructionExcerpt:
      'Montera upprättstående luftningsrör med ventilationshuvar i slutet av varje spridarledning (minst 50 cm över marknivå). Täck hela grusytan med geotextil (fiberduk klass N1/N2) innan återfyllnad.',
    questions: [
      {
        question: 'Varför behövs luftningsrör och varför måste de sticka upp minst 50 cm?',
        instantAnswer:
          'Reningen i en infiltration bygger på syrekrävande (aeroba) bakterier som äter upp föroreningarna. Utan luftningsrör kvävs bakterierna och anläggningen börjar lukta ruttet ägg och slutar fungera. Rören måste sticka upp minst 50 cm så de inte begravs under vintersnön.',
        tag: 'Biologisk rening',
      },
      {
        question: 'Varför täcker man makadamen med fiberduk innan jordmassor återfylls?',
        instantAnswer:
          'Fiberduken fungerar som ett filterlock. Den hindrar de överliggande jordmassorna från att regna ner mellan makadamstenarna och täppa till hålen i spridarrören.',
        tag: 'Byggnadsskydd',
      },
      {
        question: 'Vad vill kommunens miljöinspektör se på fotot för detta moment?',
        instantAnswer:
          'Inspektören vill se att hela fiberduken täcker makadambädden med överlapp, att luftningsrören med huvar sitter monterade och raka, samt att fördelningsbrunnen är på plats i våg. Detta foto är anläggningens juridiska utförandeintyg.',
        tag: 'Juridiskt Intyg',
      },
    ],
  },

  // ==========================================
  // ALTAN & TRÄDÄCK
  // ==========================================
  '4.1': {
    momentId: '4.1',
    instructionExcerpt:
      'Schakta bort all matjord, rötter och gräs under den planerade altanytan till ett djup av minst 15-20 cm eller till fast mineraljord.',
    questions: [
      {
        question: 'Varför måste all matjord schaktas bort under en altan?',
        instantAnswer:
          'Matjord och grässvål håller kvar stora mängder vatten som fryser till is på vintern. Denna is expanderar och trycker upp plintar och bärlinor (tjällyftning). Dessutom multnar organiskt material och kan orsaka mögellukt och svampangrepp under altanen.',
        tag: 'Tjäle & Skydd',
      },
      {
        question: 'Hur djupt ska man gräva?',
        instantAnswer:
          'Minst 15–20 cm eller tills du når fast mineraljord (sand, morän eller lera). Det viktiga är att all svart, lös matjord och alla rötter är helt borta.',
        tag: 'Schaktdjup',
      },
    ],
  },
  '4.2': {
    momentId: '4.2',
    instructionExcerpt:
      'Rulla ut en materialskiljande fiberduk (Klass N2) över hela terrassen. Fyll på med ett 15 cm tjockt kapillärbrytande lager av tvättad makadam. Exempel på tre godkända fraktioner: 1) 8/16 mm, 2) 16/22 mm, 3) 16/32 mm.',
    questions: [
      {
        question: 'Vilka makadamfraktioner kan användas och varför har skolan 8/16 mm?',
        instantAnswer:
          'Tre godkända exempel på kapillärbrytande makadam är:\n1. 8/16 mm – Mycket vanligt på skolor och i övningshallar. Den är smidig att skotta och kratta för hand och låser sig stadigt.\n2. 16/22 mm – Något grövre makadam med utmärkt dräneringsförmåga.\n3. 16/32 mm – Klassisk grov makadam för grova dräneringsbäddar.\nAlla tre fungerar utmärkt eftersom de är tvättade och saknar nollfraktion (sand/mjöl).',
        tag: 'Materialval',
      },
      {
        question: 'Varför är bergskross med nollfraktion (t.ex. 0/32 eller 0/16) FÖRBJUDEN här?',
        instantAnswer:
          'Bergskross som börjar på noll ("0") innehåller fint stenmjöl och damm. Detta finmaterial suger upp markfukt som en svamp (kapillärkraft). När vintern kommer fryser det uppsugna vattnet till en massiv iskaka som trycker upp hela altanen. Tvättad makadam låter vattnet rinna rakt igenom utan att suga upp fukt.',
        tag: 'Tjälskydd & Fysik',
      },
      {
        question: 'Vad gör fiberduk Klass N2 under makadamen?',
        instantAnswer:
          'Fiberduken fungerar som ett separationslager. Den hindrar makadamstenarna från att tryckas ner och försvinna i den underliggande leran eller jorden. Den släpper igenom vatten fritt men stoppar jord och slam från att vandra upp.',
        tag: 'Geotextil',
      },
      {
        question: 'Hur tjockt ska makadamlagret vara och hur mycket överlapp krävs?',
        instantAnswer:
          'Lagret ska vara minst 15 cm (150 mm) tjockt. Fiberduken ska skarvas med minst 30–50 cm överlapp i alla fogar så att inte duken dras isär vid utläggning.',
        tag: 'Mått & Tolerans',
      },
    ],
  },
  '4.3': {
    momentId: '4.3',
    instructionExcerpt:
      'Gräv eller borra ner betongplintar till frostfritt djup (minst 60-70 cm). Placera en bred bottenplatta eller en stor marksten under plinten innan återfyllning för att sprida ut lasten. Maxavstånd mellan plintar: 2,0 meter.',
    questions: [
      {
        question: 'Vad är "frostfritt djup" och varför räcker det inte med 20–30 cm?',
        instantAnswer:
          'Frostfritt djup är det markdjup dit tjälen aldrig når under normala vintrar (i södra Sverige ca 60–80 cm, längre norrut 1,2–1,8 m). Sätter du plinten bara 20–30 cm ner i marken fryser jorden under plintens botten, vilket lyfter hela altanen varje vinter så att dörrar fastnar och stommen knäcks.',
        tag: 'Tjälfrihet & Boverket',
      },
      {
        question: 'Varför lägger man en bottenplatta eller marksten under plinten?',
        instantAnswer:
          'Plintens bottenyta är relativt liten. En tung altan med människor och snölast kan få plinten att sjunka ner i marken som en nål. En 40x40 cm eller 50x50 cm marksten under plintens fot sprider ut lasten över en mycket större markyta så att plinten står orubbligt.',
        tag: 'Bärighet & Tryck',
      },
      {
        question: 'Vad är max tillåtet avstånd mellan plintar?',
        instantAnswer:
          'Enligt Svenskt Trä och gällande byggstandard är maxavståndet 2,0 meter mellan plintarna i bärlinans riktning (vid 45x170 eller 45x195 mm bärlina). Större avstånd gör att bärlinan bågnar och altangolvet sviktar kraftigt.',
        tag: 'Konstruktionsregler',
      },
    ],
  },
  '4.4': {
    momentId: '4.4',
    instructionExcerpt:
      'Återfyll håligheterna runt betongplintarna med enbart makadam eller singel. Packa materialet ordentligt i omgångar.',
    questions: [
      {
        question: 'Varför får man ALDRIG återfylla plinthålet med den uppgrävda jorden eller leran?',
        instantAnswer:
          'Detta är det vanligaste felet hobbysnickare gör! Lera och jord sväller när den blir fuktig och fryser fast stenhårt mot betongplintens skrovliga väggar på vintern (så kallad "sidofriktion"). När marken tjälar och lyfter sig tar den med sig hela plinten uppåt! Ren makadam fryser inte fast och låter tjälen glida förbi.',
        tag: 'Kritiskt Byggfel',
      },
      {
        question: 'Vilket material ska användas vid återfyllning runt plintarna?',
        instantAnswer:
          'Tvättad makadam, t.ex. 8/16 mm (som finns på skolan), 16/22 mm eller 16/32 mm. Fyll i omgångar om ca 15 cm och packa ordentligt med en träregel eller stötstång runt plinten.',
        tag: 'Material & Metod',
      },
    ],
  },
  '4.5': {
    momentId: '4.5',
    instructionExcerpt:
      'Jämna till makadambädden under altanen så att marken har ett tydligt fall bort från bostadshuset/skolbyggnadens vägg. Fallet ska vara minst 1-2 cm per meter (1:100).',
    questions: [
      {
        question: 'Varför är markfall under altanen viktigt när man ändå har trall ovanpå?',
        instantAnswer:
          'Trallbrädor är inte täta – regnvatten och smältvatten rinner rakt ner mellan brädorna. Om marken under altanen lutar mot husväggen rinner tusentals liter vatten in mot grundmuren och plintarna och orsakar röta, fuktskador och källarläckage.',
        tag: 'Fuktsäkerhet',
      },
      {
        question: 'Hur mycket fall krävs?',
        instantAnswer:
          'Minst 1–2 cm per meter (1:100 till 1:50) bort från husgrunden på de första 2–3 metrarna.',
        tag: 'Tolerans',
      },
    ],
  },
  '4.6': {
    momentId: '4.6',
    instructionExcerpt:
      'Kontrollera hörnpunkternas mått genom att mäta diagonalerna (kryssmätning) från hörn till hörn. Diagonalerna måste matcha exakt på millimetern (max 5 mm avvikelse).',
    questions: [
      {
        question: 'Hur utförs kryssmätning på en altanram?',
        instantAnswer:
          'Fäst måttbandet i hörn A och mät diagonalt tvärs över stommen till motstående hörn D. Mät sedan från hörn B till hörn C. Dessa två diagonalmått ska vara exakt identiska (tolerans max ±5 mm). Om de skiljer mer är stommen sned som en romb.',
        tag: 'Mätkontroll',
      },
      {
        question: 'Vad händer om man skruvar fast bärlinorna innan man har kryssmätt?',
        instantAnswer:
          'När du senare ska lägga trallbrädorna kommer du att märka att brädorna inte passar mot fasaden eller ändarna. Den sista trallbrädan kan vara 12 cm bred i ena änden och 4 cm i den andra – en synlig snedhet som inte går att rädda.',
        tag: 'Konsekvens',
      },
    ],
  },
  '4.7': {
    momentId: '4.7',
    instructionExcerpt:
      'Montera de bärande reglarna (Konstruktionsvirke, tryckimpregnerat, lägst dimension 45x170 mm eller 45x195 mm) i plintarnas stolpskor... lägg syllpapp.',
    questions: [
      {
        question: 'Vad betyder träskyddsklass NTR/A respektive NTR/AB?',
        instantAnswer:
          '• NTR/A: Högsta impregneringsklassen för virke som ska ha direkt kontakt med mark, betong eller konstant fukt (t.ex. stolpar, bärlinor i stolpskor).\n• NTR/AB: Avsett för trä ovan mark utan direkt markkontakt (t.ex. trallbrädor, staketspjälor).',
        tag: 'Svenskt Trä Standard',
      },
      {
        question: 'Varför måste man lägga syllpapp i stolpskon under bärlinan?',
        instantAnswer:
          'Betong och stål samlar kondens och fukt. Träets ändträ eller undersida suger upp vatten genom kapillärkraft. En remsa syllpapp (asfaltpapp) bryter kontakten och hindrar fukt från att sugas in i bärlinan så den inte ruttnar.',
        tag: 'Fuktskydd',
      },
      {
        question: 'Vilken typ av fästdon ska användas i stolpskor?',
        instantAnswer:
          'Genomgående varmförzinkad bult (M10 eller M12) med brickor och mutter, eller godkända varmförzinkade ankarskruvar (minst 5,0x40 mm). Använd ALDRIG vanlig gipsskruv eller obehandlad träskruv – de rostar av på några år.',
        tag: 'Fästdon & Hållfasthet',
      },
    ],
  },
  '4.8': {
    momentId: '4.8',
    instructionExcerpt:
      'Montera golvreglarna (45x145 eller 45x170 mm) vinkelrätt ovanpå eller inuti bärlinorna med balkskor. c/c-avståndet (centrum till centrum) mellan reglarna får vara MAX 600 mm för 28 mm trall.',
    questions: [
      {
        question: 'Vad betyder c/c-avstånd (centrum till centrum)?',
        instantAnswer:
          'c/c står för centrum till centrum. Det är måttet från mitten på en regel till mitten på nästa regel. Det mäts inte mellan reglarnas kanter utan från centrumlinje till centrumlinje.',
        tag: 'Byggtermer',
      },
      {
        question: 'Varför är max c/c-avstånd 600 mm för 28 mm trall?',
        instantAnswer:
          '28 mm tjock trall klarar en spännvidd på max 60 cm utan att böja sig. Har du c/c 700 eller 800 mm kommer trallbrädorna att svikta märkbart när man går på altanen och skruvarna kan lossna. Om tunnare trall används (t.ex. 22 mm) måste c/c-avståndet minskas till max 400 mm!',
        tag: 'Bärighet & Svikt',
      },
      {
        question: 'Vad är en balksko och hur spikas/skruvas den rätt?',
        instantAnswer:
          'En balksko är ett U-format beslag i varmförzinkat stål som håller golvregeln mot bärlinan. Den måste fästas med godkänd ankarspik (4,0 mm) eller ankarskruv (5,0 mm) i de runda hålen. Sätt fästdon i minst 4–6 hål per sida enligt konstruktionsritning.',
        tag: 'Beslag & Montage',
      },
    ],
  },
  '4.9': {
    momentId: '4.9',
    instructionExcerpt:
      'Skruva in kortlingar (korta stödreglar av samma dimension) i regelverket där trallbrädor ska skarvas eller där en fris (ram runt altanen) ska ligga.',
    questions: [
      {
        question: 'Vad är en kortling?',
        instantAnswer:
          'En kortling är en kort bit regelvirke (av samma dimension som golvreglarna) som monteras vinkelrätt mellan två golvreglar för att ge stöd och skruvunderlag där trallen ska skarvas eller där en tvärgående fris ska ligga.',
        tag: 'Snickeriterm',
      },
      {
        question: 'Varför ska det vara DUBBLA kortlingar eller reglar vid trallskarvar?',
        instantAnswer:
          'Om två tralländar skruvas i samma enkla 45 mm regel hamnar skruvarna bara 10 mm från brädornas ändträ. Då spricker ändarna garanterat och röta tränger in. Med dubbla kortlingar (totalt 90 mm bredd) kan varje brädände skruvas minst 30–40 mm in från kanten.',
        tag: 'Hantverksregel',
      },
      {
        question: 'Varför ska man alltid olja sågade ändträn med grundolja?',
        instantAnswer:
          'Träets ändträ fungerar som ett knippe sugrör som suger upp vatten 100 gånger snabbare än träets sidor. När du kapar en impregnerad regel bryter du skyddet i kärnan. Penetrerande grundolja eller träskydd mättar fibrerna och stoppar röta.',
        tag: 'Träskydd',
      },
    ],
  },
  '4.10': {
    momentId: '4.10',
    instructionExcerpt:
      'Skruva trallbrädorna (t.ex. 28x120 mm) i varje regel med rostfri trallskruv (Klass C4 eller A2). Lägg brädorna med ett fast brädavstånd (mellanrum på 3-5 mm) med hjälp av en trallman eller distansklossar.',
    questions: [
      {
        question: 'Vad är en trallman?',
        instantAnswer:
          'En trallman är ett specialverktyg i metall eller härdad plast som du sticker ner mellan trallbrädorna vid montering. Den har olika avståndskammar (t.ex. 3 mm, 4 mm, 5 mm) som automatiskt ger ett exakt och jämnt mellanrum längs hela brädan samtidigt som den fungerar som ett handtag för att bryta och rikta krokiga brädor raka innan du skruvar.',
        tag: 'Verktyg',
      },
      {
        question: 'Vad är distansklossar?',
        instantAnswer:
          'Distansklossar är små bitar av plast eller trä med en exakt tjocklek (t.ex. 3 mm, 4 mm eller 5 mm). Du klämmer in dem mellan brädorna medan du skruvar för att garantera att avståndet blir helt identiskt över hela altanen. När brädan är skruvad flyttar du klossarna till nästa bräda.',
        tag: 'Hjälpmedel',
      },
      {
        question: 'Varför just måtten 28x120 mm och 3–5 mm mellanrum?',
        instantAnswer:
          '• 28x120 mm är svensk branschstandard för trall på c/c 600 mm regelverk. Det ger ett stumt golv utan svikt.\n• Mellanrummet på 3–5 mm är ett absolut krav eftersom impregnerat trä sväller när det regnar på hösten och krymper i sommarsolen. Lägger man brädorna stumt mot varandra utan 3–5 mm spalt kommer de att tryckas ihop, resa sig som ett tält och knäckas när höstfukten kommer.',
        tag: 'Träets fysik',
      },
      {
        question: 'Vad skiljer rostfri trallskruv i klass C4 och A2?',
        instantAnswer:
          '• Klass C4: Kolstål med kraftig rostskyddande ytbehandling. Godkänd för utomhusmiljöer i inlandet med normal fuktighet.\n• Klass A2: Äkta rostfritt stål rakt igenom. Mycket segare stål som tål träets kraftiga rörelser utan att gå av vid tjäle eller torka.\n• Vid poolområden, havskust eller ädelträ används syrafast A4-skruv.',
        tag: 'Skruvkvalitet',
      },
      {
        question: 'Hur ser man vilken sida som är den "glada" årsringen (kärnsidan)?',
        instantAnswer:
          'Titta på brädans ände! Om årsringarna bildar en glad mun som böjer sig uppåt (∪) är kärnsidan uppåt. Den glada sidan ska alltid ligga vänd upp mot himlen. När träet torkar kupar sig brädan som ett paraply så att regnvattnet rinner av kanterna istället för att bilda en pöl mitt på brädan.',
        tag: 'Träteknik',
      },
      {
        question: 'Hur djupt ska skruvskallen dras ner?',
        instantAnswer:
          'Skruvskallen ska dras ner så att den ligger precis jäms med trallbrädans ovansida (eller max 0,5 mm under ytan). Drar du ner skallen för djupt krossar du träfibrerna och skapar en liten skål där vatten blir stående, vilket gör att träet ruttnar runt skruvarna.',
        tag: 'Montageteknik',
      },
    ],
  },
};

export function getMomentAiData(momentId: string): MomentAiData | null {
  return MOMENT_AI_QUESTIONS[momentId] || null;
}
