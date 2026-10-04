import { MomentDefinition, ProjectType } from '../types';

export const ALL_MOMENTS: MomentDefinition[] = [
  // ==========================================
  // PROJEKT 1: HUSGRUND (PLATTA PÅ MARK) - SKOLANPASSAD
  // ==========================================
  {
    id: '1.1',
    projectType: 'HUSGRUND',
    order: 1,
    phaseNumber: 1,
    phaseName: 'FAS 1: Inmätning & Profiler',
    title: 'Inmätning & profiler',
    amaCode: 'BBC.31',
    instruction: 'Kontrollera ledningsanvisning via Ledningskollen.se innan markarbeten påbörjas. Märk ut befintliga kablar, el, optofiber, vatten och avlopp med sprayfärg. Montera profilställningar och spänn upp profilsnören enligt ritningen. Kontrollera 90°-vinklar och kryssmått: mät diagonalt och kontrollera att differensen mellan diagonalerna är maximalt ±3–5 mm.',
    studentTip: 'Att gräva av en högspänningsledning innebär direkt livsfara, och att klippa en fiberkabel kan leda till hundratusentals kronor i skadestånd. Alltid 100% säkrat först!',
    proTip: 'Lita aldrig blint på gamla kommunala ledningskartor – de kan diffa med flera meter! Handgräv alltid försiktigt runt markerade ledningsstråk. Slå ner profilerna långt utanför schaktkanten så att inte grävaren river dem med larven.',
    criticalValidationHint: 'Fota markeringar för ledningskoll och spända profilsnören.'
  },
  {
    id: '1.2',
    projectType: 'HUSGRUND',
    order: 2,
    phaseNumber: 1,
    phaseName: 'FAS 1: Inmätning & Profiler',
    title: 'Avtäckning & Matjordsschakt',
    amaCode: 'CBB.1',
    instruction: 'Schakta bort all matjord och organiska jordlager inom hela byggnadsytan plus minst 1,5–2 meter utanför husets blivande kantelement. Lägg matjorden i separata avskilda upplag.',
    studentTip: 'Matjord multnar med tiden och kan aldrig packas bärigt. Lämnas matjord kvar under plattan kommer huset att sätta sig ojämnt och grunden knäckas.',
    proTip: 'Lägg matjordshögen på en plats där du slipper flytta den tre gånger! Se till att schaktbotten lutar bort från schaktet så att regnvatten inte gör hela gropen till en simbassäng om det kommer ett skyfall.',
    criticalValidationHint: 'Fota schaktbotten ren från matjord, rötter och stubbar.'
  },
  {
    id: '1.3',
    projectType: 'HUSGRUND',
    order: 3,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Geotextil',
    title: 'Schaktbotten',
    amaCode: 'CBE.1',
    instruction: 'Rensa schaktbotten till fast, orörd mineraljord eller berg. Kontrollera schaktbotten mot fastställda plushöjder med laser.',
    studentTip: 'Schaktbotten är grunden som hela husets tyngd vilar på. Mjuk lera eller fyllnadsmassor kräver förstärkningsåtgärder.',
    proTip: 'Får du regn på en lerbotten blir det en såpa. Låt inte maskinen köra sönder den orörda bottenytan – lägg på bärlagret direkt när schakten är ren!',
    criticalValidationHint: 'Fota laseravvägning mot orörd och ren schaktbotten.'
  },
  {
    id: '1.4',
    projectType: 'HUSGRUND',
    order: 4,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Geotextil',
    title: 'Fiberduk',
    amaCode: 'YJJ.1',
    instruction: 'Rulla ut geotextil (lägst klass N2, vid sämre bärighet klass N3) över hela schaktbotten. Skarva duken med minst 50 cm överlapp i alla fogar.',
    studentTip: 'Fiberdukens primära uppgift är att separera undergrunden (leran/moränen) från det dränerande makadamlagret så att inte makadamen trycks ner i leran.',
    proTip: 'Snåla inte på omlottläggningen! När dumpern backar in med makadam vill du absolut inte att duken dras isär och leran väller upp i fyllningen. Lås skarvarna med lite grus direkt.',
    criticalValidationHint: 'Fota täckande fiberduk med minst 50 cm överlapp.'
  },
  {
    id: '1.5',
    projectType: 'HUSGRUND',
    order: 5,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Dränering',
    amaCode: 'PBB.51',
    instruction: 'Lägg dräneringsrör (slitsade plaströr) runt grundens ytterperimeter. Rörens högsta punkt måste ligga under underkant på kantelementens isolering. Säkerställ kontinuerligt fall (minst 5 mm/m) mot dräneringsbrunn.',
    studentTip: 'Dräneringsrören måste omslutas helt av tvättad makadam (8–16 mm) och svepas in med geotextil så att inte slam sätter igen rörets slitsar.',
    proTip: 'Kontrollera att det inte finns några svackor på dränröret där vatten kan bli stående och frysa till isproppar på vintern. Fota fallet med vattenpasset direkt på röret!',
    criticalValidationHint: 'Fota dränrörets läge och fall under kantbalkens nivå.'
  },
  {
    id: '1.6',
    projectType: 'HUSGRUND',
    order: 6,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Dagvatten & Spolbrunnar',
    amaCode: 'PBB.2',
    instruction: 'Montera täta markrör (orange 110 mm) för takavvattning (stuprör) separerat från dräneringsledningarna. Montera spol- och rensbrunnar vid strategiska hörn.',
    studentTip: 'Blanda ALDRIG ihop takvatten och dränering! Takvattnet leder enorma vattenvolymer och får aldrig tryckas in i dräneringsrören under grunden.',
    proTip: 'Märk locken tydligt: DV (dagvatten) respektive DR (dränering). Det sparar timmar för rörmokaren och anläggaren vid framtida besiktning eller spolning.',
    criticalValidationHint: 'Fota anslutning av dagvatten och spolbrunn.'
  },
  {
    id: '1.7',
    projectType: 'HUSGRUND',
    order: 7,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Bottenavlopp & Spillvatten',
    amaCode: 'PBB.1',
    instruction: 'Förlägg avloppsledningar (110/75/50 mm PP/PVC) för wc, kök, bad och tvättstuga. Säkerställ korrekt fall (1–2 cm/meter / 1:50–1:100). Fäst och fixera rören i makadamet.',
    studentTip: 'För lite fall ger bakfall och stopp; för kraftigt fall gör att vattnet rinner undan snabbare än fasta partiklar vilket också leder till proppar.',
    proTip: 'Sätt på riktiga rörproppar direkt! Ramlar en makadamsten ner i avloppet under gjutningen måste man bila upp hela golvet. Provspola alltid med vatten innan isoleringen rullas på.',
    criticalValidationHint: 'Fota rördragning med fixering, pluggar och fallkontroll med vattenpass.'
  },
  {
    id: '1.8',
    projectType: 'HUSGRUND',
    order: 8,
    phaseNumber: 3,
    phaseName: 'FAS 3: VA & Dränering',
    title: 'Inkommande vatten & el',
    amaCode: 'PBB.4',
    instruction: 'Lägg in skyddsrör för inkommande servisvatten (PEM 32/40 mm), elservis, optofiber och eventuell jordvärme/bergvärme under grunden upp till blivande teknikrum.',
    studentTip: 'Böjarna på tomrören måste ha mjuka radier (minst 1 meters radie) för att kablar och PEM-slangar ska gå att trycka igenom utan att fastna.',
    proTip: 'Surra dragtråden i båda ändarna med ståltråd så den inte sugs in eller försvinner när du återfyller. Tappar du tråden mitt under plattan är det en mardröm.',
    criticalValidationHint: 'Fota tomrörsböjar och dragtråd i teknikrumszon.'
  },
  {
    id: '1.9',
    projectType: 'HUSGRUND',
    order: 9,
    phaseNumber: 4,
    phaseName: 'FAS 4: Grundfyllning & Packning',
    title: 'Radonsäkring',
    amaCode: 'DFD',
    instruction: 'Lägg ut perforerad radonslang i slingor i det kapillärbrytande makadamlagret alternativt montera godkänd radonduk enligt geoteknisk radonriskklass. Täta rörgenomföringar med godkända manschetter.',
    studentTip: 'Radongas tränger upp från marken. Med radonslang förbereder man för en framtida radonfläkt som skapar undertryck och ventilerar bort gasen.',
    proTip: 'Täta varje genomföring som om det vore en ubåt! Använd godkänd radonprimer och butylband. Minsta glipa kan leda till underkänt vid OVK-mätning.',
    criticalValidationHint: 'Fota tätning runt rörgenomföringar och radonslangens slingor.'
  },
  {
    id: '1.10',
    projectType: 'HUSGRUND',
    order: 10,
    phaseNumber: 4,
    phaseName: 'FAS 4: Grundfyllning & Packning',
    title: 'Laserinvägning & Avdragningsbädd',
    amaCode: 'DCB.11',
    instruction: 'Väg av och finjustera det kapillärbrytande makadamlagret med rotationslaser. Höjdavvikelsen under kantelementen får maximalt vara ±5 mm från projekterad plushöjd.',
    studentTip: 'Toleranserna på en modern husgrund mäts i millimeter. Svajar bädden under kantelementen kommer sockeln att bli vågig och stommen att luta.',
    proTip: 'Kontrollera alltid laserns nollpunkt mot en fast fixpunkt (t.ex. berg eller sockel) både morgon och kväll. Lasrar kan ta stryk om stativet rubbas av en dumpervibration.',
    criticalValidationHint: 'Fota lasermottagare och mätdorn mot bädden.'
  },
  {
    id: '1.11',
    projectType: 'HUSGRUND',
    order: 11,
    phaseNumber: 4,
    phaseName: 'FAS 4: Grundfyllning & Packning',
    title: 'Uppfyllnad & Packning',
    amaCode: 'CEB.21',
    instruction: 'Fyll upp med tvättad makadam/singel utan nollfraktion (t.ex. 8–16 mm, 11–16 mm eller 16–32 mm – 8–16 mm är särskilt vanligt på skolor och vid rörgravar). Packa i skikt om max 20–30 cm med vibratorplatta (padda).',
    studentTip: 'Materialet under en husgrund måste vara kapillärbrytande (utan nollfraktion/sand) så att inte markfukt kan sugas upp från marken till betongplattan. Tre godkända fraktioner: 1) 8–16 mm, 2) 11–16 mm, eller 3) 16–32 mm.',
    proTip: 'Snåla inte med överfarterna med paddan! Kör minst 4–5 gånger i kors över varje lager. Om du fuskar med packningen kommer gruset att sätta sig efter att huset är byggt – då hänger väggarna i luften och golvet spricker.',
    criticalValidationHint: 'Fota paddning i skikt och fraktionsintyg/makadambädd.'
  },
  {
    id: '1.12',
    projectType: 'HUSGRUND',
    order: 12,
    phaseNumber: 5,
    phaseName: 'FAS 5: Form & Isolering',
    title: 'Form & Kantelement',
    amaCode: 'GSC.1',
    instruction: 'Sätt ut kantelementen (L-stöd) exakt i våg och linje enligt profilsnörena. Rikta in alla 90-gradershörn och mät kryssmått så att diagonalerna stämmer inom ±3–5 mm. Säkra yttre mothåll med makadam/strävor mot formtryck.',
    studentTip: 'Kantbalkarna bär upp husets ytterväggar och takstolar, därför är det extremt viktigt att de står på ett perfekt plant och packat underlag.',
    proTip: 'När betongbilen pumpar ut betong blir trycket enormt utåt. Om du inte "gjut-säkrar" elementen genom att lägga schaktmassor eller makadam som ett tungt mothåll på utsidan kommer elementen att kalva under gjutningen!',
    criticalValidationHint: 'Fota kantelement i snörlinje samt yttre mothåll/gjutsäkring.'
  },
  {
    id: '1.13',
    projectType: 'HUSGRUND',
    order: 13,
    phaseNumber: 5,
    phaseName: 'FAS 5: Form & Isolering',
    title: 'Cellplastisolering',
    amaCode: 'DBG.1',
    instruction: 'Lägg ut cellplastskivor (EPS) i tre omlottliggande lager (totalt oftast 300 mm isolering) med brutna skarvar i alla riktningar.',
    studentTip: 'Skivorna läggs omlott för att förhindra köldbryggor där värme inifrån huset kan läcka ut i marken under.',
    proTip: 'Gå försiktigt på skivorna så du inte trampar sönder hörnen. Lås skivorna med speciella plasthullingar (plastspik) mellan lagren under arbetets gång så att inte vinden tar dem innan armeringen är på plats.',
    criticalValidationHint: 'Fota omlottlagda isoleringslager och plastspik.'
  },
  {
    id: '1.14',
    projectType: 'HUSGRUND',
    order: 14,
    phaseNumber: 6,
    phaseName: 'FAS 6: Armering & Gjutklar',
    title: 'Armering & Distanser',
    amaCode: 'EBB.1',
    instruction: 'Lägg ut armeringsbyglar i kantbalken och rulla ut armeringsmattor över cellplasten. Lyft upp mattorna på plastdistanser (klossar, ca 3–5 cm höga) så armeringen hamnar mitt i betongen. Najja (bind ihop) skarvarna. FOTA ALL ARMERING INNAN BETONGBILEN KOMMER!',
    studentTip: 'Armeringen tar upp dragkrafterna i betongen. Ligger mattan platt mot cellplasten gör den absolut ingen nytta alls – den måste omslutas helt av betong.',
    proTip: 'Surra alla golvvärmeslangar, tomrör och elrör stenhårt i armeringsmattan så de inte flyter upp till ytan när betongbilen trycker ut betongen! Det här är ditt sista och viktigaste foto för färdig grund.',
    criticalValidationHint: 'FOTA HELA ARMERINGSBÄDDEN PÅ DISTANSER INNAN BETONGEN ANLÄNDER!'
  },

  // ==========================================
  // PROJEKT 2: PLATTSÄTTNING & MARKSTEN - SKOLANPASSAD
  // (Faser för syn av grannfastigheter/staket borttagna)
  // ==========================================
  {
    id: '2.1',
    projectType: 'PLATTSATTNING',
    order: 1,
    phaseNumber: 1,
    phaseName: 'FAS 1: Höjdsättning & Vinkel',
    title: 'Riktsnöre & Laserhöjd',
    amaCode: 'BJB.3',
    instruction: 'Slå ner armeringsjärn och spänn upp ett spänt riktsnöre. Väg av höjden med laser så att stensättningen får rätt fall (lutning) bort från huset.',
    studentTip: 'Snöret styr både plattlinjen (så att fogarna blir spikraka) och höjden för hela stenläggningen.',
    proTip: 'Ett fall på minst 1–2 cm per meter UT från husväggen är ett absolut krav! Slarvar du med fallet kommer regnvattnet att rinna mot husgrunden istället för bort, vilket skapar fuktskador och källaröversvämning.',
    criticalValidationHint: 'Fota riktsnöre och fallmätning bort från husvägg.'
  },
  {
    id: '2.2',
    projectType: 'PLATTSATTNING',
    order: 2,
    phaseNumber: 1,
    phaseName: 'FAS 1: Höjdsättning & Vinkel',
    title: 'Kryssmätning & Vinkel',
    amaCode: 'BJB.3',
    instruction: 'Kontrollera att riktsnörena ligger i exakt 90 graders vinkel ut från byggnadens vägg med Pythagoras sats (3-4-5-metoden). Kontrollera kryssmått: mät diagonalerna mellan motstående hörn och säkerställ att måtten är identiska innan sättning påbörjas (differens max ±3–5 mm).',
    studentTip: 'Om du mäter 4 meter ut från huset (katet a) och 3 meter längs med huset (katet b), måste diagonalen (hypotenusan c) vara exakt 5 meter.',
    proTip: 'Om du sätter igång att lägga sten utan att ha gjort denna mätning kommer du att märka efter några meter att du måste kapa varenda sten snett i kanten mot huset. Det ser för jävligt ut och kostar massor av tid.',
    criticalValidationHint: 'Fota måttbandets kryssmätning och 90-gradersvinkeln.'
  },
  {
    id: '2.3',
    projectType: 'PLATTSATTNING',
    order: 3,
    phaseNumber: 2,
    phaseName: 'FAS 2: Bärlager & Avdragning',
    title: 'Rör & Avdragning',
    amaCode: 'DCB.32',
    instruction: 'Gräv ner parallella avdragningsrör (ca 30 mm ytterdiameter) i det packade stenfliset (fraktion 2–4 eller 2–5 mm). Mät in rörens ovansida med laser till exakt samma höjd som plattornas underkant. Dra sedan en rätskiva ovanpå rören för att få en helt slät yta.',
    studentTip: 'Att bara kratta eller raka ut gruset ger inte tillräcklig jämnhet. Plattorna kommer att "vingla" om underlaget inte dras av med rör och rätskiva.',
    proTip: 'Ta försiktigt bort rören när du är klar och fyll i spåren efter rören med lite extra flis med en slev eller spade. Trampa ALDRIG på den färdigdragna ytan!',
    criticalValidationHint: 'Fota den avdragna flisytan och ifyllda rörspår.'
  },
  {
    id: '2.4',
    projectType: 'PLATTSATTNING',
    order: 4,
    phaseNumber: 3,
    phaseName: 'FAS 3: Läggning & Passning',
    title: 'Utläggning av Plattor',
    amaCode: 'DEC.1',
    instruction: 'Lägg ut markstenen i önskat förband. Kontrollera att den fasade kanten är uppåt. Använd plattornas inbyggda distanser för att hålla en jämn fog på ca 3 mm.',
    studentTip: 'Använd en plattlyft om stenen är tung. Det skonar ryggen och ger ett betydligt snyggare och mer exakt resultat.',
    proTip: 'Stå alltid på de redan lagda plattorna när du arbetar dig framåt. Gå ALDRIG på den färdigdragna flisytan framför dig, då förstör du underlaget direkt och får börja om.',
    criticalValidationHint: 'Fota raka foglinjer och fogdistanser.'
  },
  {
    id: '2.5',
    projectType: 'PLATTSATTNING',
    order: 5,
    phaseNumber: 3,
    phaseName: 'FAS 3: Läggning & Passning',
    title: 'Kapning av Sten',
    amaCode: 'DEC.1',
    instruction: 'Mät ut passbitarna i kanterna noga, rita en linje med märkpenna och kapa stenen med en motorkap eller ett kapbord med vattenkylning.',
    studentTip: 'Det är livsviktigt att använda skyddsglasögon, hörselskydd och ett andningsskydd med P3-filter. Stendammet (kvartsdamm) orsakar silikos (stendammslunga) och är extremt farligt!',
    proTip: 'Planerar du läggningen smart och använder halvplattor i ändarna kan du slippa upp till 80% av all kapning. Det sparar tid, lungor och dyra diamantkapskivor.',
    criticalValidationHint: 'Fota rena kapade anslutningar och skyddsutrustning.'
  },
  {
    id: '2.6',
    projectType: 'PLATTSATTNING',
    order: 6,
    phaseNumber: 4,
    phaseName: 'FAS 4: Fogning & Slutförande',
    title: 'Fogning med Fogsand',
    amaCode: 'DEC.1',
    instruction: 'Häll ut fogsand (hårdgörande eller tvättad naturfogsand fraktion 0–2 eller 0–4 mm) över ytan. Sopa sanden diagonalt över plattorna så att alla fogar fylls helt till toppen.',
    studentTip: 'Fogning bör ske under torr väderlek, annars fastnar sanden på plattornas yta istället för att rinna ner i fogarna.',
    proTip: 'Sanden kommer att sätta sig efter första rejäla regnet. Lämna alltid kvar en halv säck fogsand så att man kan eftersopa. En stensättning utan fyllda fogar rör på sig och kantstöts direkt vid bilkörning!',
    criticalValidationHint: 'Fota fyllda fogar efter diagonalsopning.'
  },

  // ==========================================
  // PROJEKT 3: ENSKILT AVLOPP & INFILTRATION - SKOLANPASSAD
  // (Faser för syn av grannfastigheter/staket borttagna)
  // ==========================================
  {
    id: '3.1',
    projectType: 'ENSKILT_AVLOPP',
    order: 1,
    phaseNumber: 1,
    phaseName: 'FAS 1: Markförhållanden & Jordprov',
    title: 'Markbäddstest (Rulltest)',
    amaCode: 'BBC.13',
    instruction: 'Ta ett jordprov från schaktområdet i handen på det tänkta infiltrationsdjupet. Fukta jorden lite och försök rulla den till en smal korv eller ett fast klot i handen (perkolationsbedömning).',
    studentTip: 'Om jordprovet faller isär är marken sandig/grovkornig och perfekt för en infiltration. Om provet blir ett segt, blankt klot som håller ihop är det lera.',
    proTip: 'Om rulltestet visar lera fungerar det INTE med en vanlig infiltration! Vattnet kan inte sugas upp i marken. Då måste man ändra till en "Markbädd med tät botten och dränrör". Bygger man ändå blir det översvämning!',
    criticalValidationHint: 'Fota rulltestet i handflatan som bevis på jordart.'
  },
  {
    id: '3.2',
    projectType: 'ENSKILT_AVLOPP',
    order: 2,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Nivåkontroll',
    title: 'Schakt för Brunn & Infiltration',
    amaCode: 'CBB.311',
    instruction: 'Gräv gropen för slamavskiljaren (trekammarbrunnen) samt schaktet för infiltrationens spridningslager enligt det beviljade miljötillståndet (vanligtvis 40–50 cm djupt schaktbotten).',
    studentTip: 'Läggs infiltrationen för djupt ner minskar syretillförseln i marken drastiskt, vilket slår ut den biologiska reningen i den syrekrävande biohuden.',
    proTip: 'Kör ALDRIG med grävmaskinen i bottnen av schaktet där infiltrationen ska ligga! Tyngden från skopan och larverna pressar ihop jorden och stänger till markens naturliga porer permanent.',
    criticalValidationHint: 'Fota orörd schaktbotten och djupmätning.'
  },
  {
    id: '3.3',
    projectType: 'ENSKILT_AVLOPP',
    order: 3,
    phaseNumber: 2,
    phaseName: 'FAS 2: Schakt & Nivåkontroll',
    title: 'Grundvattenavstånd (Minst 1m)',
    amaCode: 'BBC.14',
    instruction: 'Mät och kontrollera avståndet ner till grundvattenytan i schaktbotten. Det måste vara minst 1 meter fritt avstånd mellan spridningslagrets botten och högsta grundvattennivå eller berg. FOTA MÄTSTOCKEN!',
    studentTip: 'Detta är kommunens och miljöbalkens absolut viktigaste krav för att godkänna avloppet, annars förorenas grannars och din egen dricksvattenbrunn med bakterier.',
    proTip: 'Om det sipprar in vatten i botten eller om marken är gråblå med rostfläckar (visar högsta grundvattenyta): avbryt omedelbart! Du måste bygga en "upphöjd infiltration" med pumpstation.',
    criticalValidationHint: 'FOTA MÄTSTÄNGEL SOM VISAR MINST 1 METER TILL GRUNDVATTEN!'
  },
  {
    id: '3.4',
    projectType: 'ENSKILT_AVLOPP',
    order: 4,
    phaseNumber: 3,
    phaseName: 'FAS 3: Montage & Rörläggning',
    title: 'Etablering av Trekammarbrunn',
    amaCode: 'PDD.1',
    instruction: 'Sätt ner slamavskiljaren (trekammarbrunnen) i gropen på en avdragen bädd av stenfritt grus/flis. Väg av brunnen i våg med vattenpass och fyll brunnen med vatten direkt under tiden du återfyller runt omkring med sand/flis.',
    studentTip: 'Brunnen måste fyllas med vatten under återfyllningen för att jämna ut marktrycket på utsidan så att inte plasttanken trycks ihop och spricker.',
    proTip: 'Om du återfyller runt en tom plasttank i blöt mark eller lera kommer tanken att fungera som en båt och flyta upp ur gropen vid nästa höstregn! Vatten i tanken direkt, alltid!',
    criticalValidationHint: 'Fota vattenfylld slamavskiljare i våg under återfyllnad.'
  },
  {
    id: '3.5',
    projectType: 'ENSKILT_AVLOPP',
    order: 5,
    phaseNumber: 3,
    phaseName: 'FAS 3: Montage & Rörläggning',
    title: 'Spridningsledningar & Makadam',
    amaCode: 'PBB.531',
    instruction: 'Lägg ut spridningslagret med tvättad makadam utan nollfraktion (fraktion 16–32 mm, 11–16 mm eller 8–16 mm, ca 25–30 cm tjockt). Montera fördelningsbrunnen och lägg ut de slitsade 110 mm spridarrören med ett svagt, jämnt fall (ca 0,5–1 cm per meter).',
    studentTip: 'Rören får absolut inte ligga i bakfall, för då samlas avloppsvattnet i början och fördelas inte jämnt över hela infiltrationsytan.',
    proTip: 'Använd ett långt vattenpass eller laser. Gå försiktigt runt rören så du inte råkar trampa ner dem i gruset så att de tappar sitt exakta fall. Fota fördelningsbrunnens vattenutjämningsklockor!',
    criticalValidationHint: 'Fota fördelningsbrunn, spridarrör och makadambädd.'
  },
  {
    id: '3.6',
    projectType: 'ENSKILT_AVLOPP',
    order: 6,
    phaseNumber: 4,
    phaseName: 'FAS 4: Slutförande & Intyg',
    title: 'Luftningsrör & Geotextil',
    amaCode: 'YJJ.1',
    instruction: 'Montera upprättstående luftningsrör med ventilationshuvar i slutet av varje spridarledning (minst 50 cm över marknivå). Täck hela grusytan med geotextil (fiberduk klass N1/N2) innan återfyllnad med jordmassor. FOTA HELA SYSTEMET!',
    studentTip: 'Fiberduken förhindrar att de övre jordmassorna rinner ner och täpper till hålen i spridarrören och porerna mellan makadamstenarna.',
    proTip: 'Det här fotot är ditt officiella utförandeintyg till kommunens miljöinspektör! Syns fördelningsbrunn, spridarrör, luftningshuvar och fiberduk tydligt på bilden blir anläggningen godkänd direkt utan anmärkning.',
    criticalValidationHint: 'FOTA HELA ANLÄGGNINGEN MED FIBERDUK OCH VENTILATIONSHUVAR!'
  },

  // ==========================================
  // PROJEKT 4: ALTAN & TRÄDÄCK (TJÄLSKYDD & STABILITET)
  // Referens: AMA Anläggning 23 & Svenskt Trä
  // ==========================================
  {
    id: '4.1',
    projectType: 'ALTAN_TRADACK',
    order: 1,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Urgrävning & Avbaning',
    amaCode: 'CBB.11',
    instruction: 'Schakta bort all matjord, rötter och gräs under den planerade altanytan till ett djup av minst 15-20 cm eller till fast mineraljord.',
    studentTip: 'Matjord håller kvar vatten som fryser till is på vintern. Denna is-kaka expanderar och trycker upp hela altanen. Spara massorna för släntning.',
    proTip: 'Schakta tills ren mineraljord eller lera blottas. Skrapa inte för djupt i onödan och säkerställ att schaktbotten inte lutar mot husgrunden.',
    criticalValidationHint: 'Fota schaktbotten fri från matjord och rötter.'
  },
  {
    id: '4.2',
    projectType: 'ALTAN_TRADACK',
    order: 2,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Dränerande bärlager & Fiberduk',
    amaCode: 'DBB.11 / DCB.11',
    instruction: 'Rulla ut en materialskiljande fiberduk (Klass N2) över hela terrassen. Fyll på med ett 15 cm tjockt kapillärbrytande lager av tvättad makadam utan nollfraktion (t.ex. 8/16 mm, 11/16 mm eller 16/32 mm – i skolan och på mindre byggen används ofta 8/16 eller 11/16 med utmärkt resultat).',
    studentTip: 'Använd ALDRIG material med nollfraktion (t.ex. 0/32 eller 0/16 bergkross) under grunden/trallen! Det fina dammet suger upp fukt kapillärt. Välj istället tvättad makadam med öppna porer så vattnet rinner rakt igenom – 3 godkända exempel: 1) 8/16 mm (mycket vanligt i skolan och lätt att skotta/raka), 2) 11/16 mm, eller 3) 16/32 mm. Alla tre stoppar tjällyft och kapillärsugning helt.',
    proTip: 'Ta bild med tumstock som visar minst 150 mm makadam (t.ex. 8/16, 11/16 eller 16/32) och minst 30 cm överlapp på fiberduken.',
    criticalValidationHint: 'Kritiskt dold-moment: Fotokrav! Mät makadamtjocklek och fiberduksöverlapp.'
  },
  {
    id: '4.3',
    projectType: 'ALTAN_TRADACK',
    order: 3,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Plintgrund till tjälfritt djup',
    amaCode: 'CBF.1',
    instruction: 'Gräv eller borra ner betongplintar till frostfritt djup (minst 60-70 cm). Placera en bred bottenplatta eller en stor marksten under plinten innan återfyllning för att sprida ut lasten. Maxavstånd mellan plintar: 2,0 meter.',
    studentTip: 'Om plinten sätts för grunt (20-30 cm) hamnar botten av plinten i frys-zonen och tjälen kommer lyfta hela altanen. Fota djupet med tumstock i gropen!',
    proTip: 'Väg av plintarna noggrant i höjd med laser. En plint som sjunker eller skjuts av tjäle ger direkt svackor i trallen.',
    criticalValidationHint: 'Kritiskt dold-moment: Fota plintdjupet med tumstock i gropen före återfyllning.'
  },
  {
    id: '4.4',
    projectType: 'ALTAN_TRADACK',
    order: 4,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Dränerande återfyllning',
    amaCode: 'CEB.51',
    instruction: 'Återfyll håligheterna runt betongplintarna med ren, tvättad makadam eller singel (t.ex. 8/16 mm, 11/16 mm eller 16/32 mm). Packa materialet ordentligt i omgångar.',
    studentTip: 'Vanligaste felet hobbysnickare gör! Skottar man tillbaka leran eller jorden man nyss grävde upp runt plinten, fryser leran fast i betongväggen på vintern (sidofriktion) och drar med sig plinten uppåt. Ren makadam (t.ex. 8/16 mm som finns på skolan, 11/16 eller 16/32 mm) fryser inte fast och dränerar bort ytvattnet.',
    proTip: 'Packa i skikt om 15 cm. Fyll med tvättad makadam hela vägen upp.',
    criticalValidationHint: 'Verifiera och fota att endast ren makadam används vid återfyllning runt plintar.'
  },
  {
    id: '4.5',
    projectType: 'ALTAN_TRADACK',
    order: 5,
    phaseNumber: 1,
    phaseName: 'DEL 1: MARKARBETE (AMA Anläggning)',
    title: 'Justering av markfall',
    amaCode: 'CBB.31',
    instruction: 'Jämna till makadambädden under altanen så att marken har ett tydligt fall bort från bostadshuset/skolbyggnadens vägg. Fallet ska vara minst 1-2 cm per meter (1:100).',
    studentTip: 'Vatten som rinner ner mellan trallbrädorna får aldrig bli stående i pölar runt husgrunden eller plintarna. Lägg gärna ut markplast närmast väggen.',
    proTip: 'Kontrollera lutningen med vattenpass eller laser. Säkerställ att vatten leds ut i omgivande terräng.',
    criticalValidationHint: 'Fota avvägning av markfall från husgrunden.'
  },
  {
    id: '4.6',
    projectType: 'ALTAN_TRADACK',
    order: 6,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Kryssmätning & Diagonaler',
    amaCode: 'BEB.11',
    instruction: 'Kontrollera hörnpunkternas mått genom att mäta diagonalerna (kryssmätning) från hörn till hörn. Diagonalerna måste matcha exakt (max 5 mm avvikelse).',
    studentTip: 'Använd Pythagoras sats (3-4-5-metoden) för att kontrollera 90-gradersvinklar mot husväggen. Är stommen sned kommer trallbrädorna löpa snett i slutet.',
    proTip: 'Spänn kryssnören och mät diagonaler två gånger innan du skruvar fast första bärlinan i fasaden eller stolpskorna.',
    criticalValidationHint: 'Dokumentera kryssmått och räta vinklar mot byggnad.'
  },
  {
    id: '4.7',
    projectType: 'ALTAN_TRADACK',
    order: 7,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Montering av Bärlinor (NTR/A)',
    amaCode: 'GBC.11',
    instruction: 'Montera de bärande reglarna (Konstruktionsvirke, tryckimpregnerat, lägst dimension 45x170 mm eller 45x195 mm) i plintarnas stolpskor. Väg av stenhårt med långpass eller rotationslaser i våg.',
    studentTip: 'Lägg en bit syllpapp i botten av stolpskon mellan betongen/stålet och bärlinan så att fukt inte sugs in i träets ändträ. Allt bärande virke ska hålla skyddsklass NTR/A för markkontakt.',
    proTip: 'Använd genomgående varmförzinkad bult (M10/M12) med brickor eller godkända ankarskruvar i stolpskorna. Bärlinorna är konstruktionens ryggrad.',
    criticalValidationHint: 'Fota syllpapp i stolpsko och bärlinor i våg.'
  },
  {
    id: '4.8',
    projectType: 'ALTAN_TRADACK',
    order: 8,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Golvreglar & c/c-avstånd',
    amaCode: 'GBC.21',
    instruction: 'Montera golvreglarna (45x145 eller 45x170 mm) vinkelrätt ovanpå eller inuti bärlinorna med balkskor. c/c-avståndet (centrum till centrum) mellan reglarna får vara MAX 600 mm för 28 mm trall.',
    studentTip: 'Om tunnare trall används (t.ex. 22 mm) måste regelavståndet minskas till c/c 400 mm. Slarvas det med c/c-avståndet kommer altanen att svikta kraftigt när man går på den.',
    proTip: 'Fäst golvreglarna med vinkelbeslag eller skråskruvning med godkänd träbyggnadsskruv. Kontrollera att ovansidan är absolut plan.',
    criticalValidationHint: 'Fota tumstock som visar godkänt c/c-mått mellan golvreglar.'
  },
  {
    id: '4.9',
    projectType: 'ALTAN_TRADACK',
    order: 9,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Montering av Kortlingar',
    amaCode: 'GBC.22',
    instruction: 'Skruva in kortlingar (korta stödreglar av samma dimension) i regelverket där trallbrädor ska skarvas eller där en fris (ram runt altanen) ska ligga.',
    studentTip: 'Sätt dubbla kortlingar vid skarvar. Två tralländar får aldrig skruvas i samma enskilda 45 mm regel, eftersom ändträet då spricker, drar åt sig fukt och skruvarna släpper över tid.',
    proTip: 'Behandla alla sågade ändträn med penetrerande grundolja eller träskyddsmedel innan montering för maximal livslängd.',
    criticalValidationHint: 'Fota dubbla kortlingar vid skarvpunkter och frisram.'
  },
  {
    id: '4.10',
    projectType: 'ALTAN_TRADACK',
    order: 10,
    phaseNumber: 2,
    phaseName: 'DEL 2: SNICKERI & RAMVERK (Svenskt Trä)',
    title: 'Trallläggning & Skruvavstånd',
    amaCode: 'HSD.1',
    instruction: 'Skruva trallbrädorna (t.ex. 28x120 mm) i varje regel med rostfri trallskruv (Klass C4 eller A2). Lägg brädorna med ett fast brädavstånd (mellanrum på 3-5 mm) med hjälp av en trallman eller distansklossar.',
    studentTip: 'Kolla årsringarna! Lägg brädorna med den "glada" sidan uppåt (kärnsidan upp). När träet torkar kupar det sig som ett paraply och regnvattnet rinner av. Lägger man trall utan springor på våren kommer altanen resa sig och slå sig under höstregnen då träet sväller.',
    proTip: 'Förborra alltid i brädornas ändar för att undvika sprickbildning. Skruva med jämnt djup utan att dra ner skruvskallen så djupt att det bildas vattensamlingar.',
    criticalValidationHint: 'Fota jämn tralläggning med distanser och årsringar vända uppåt.'
  }
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, { title: string; subtitle: string; icon: string; count: number }> = {
  HUSGRUND: {
    title: 'Husgrund (Platta på mark)',
    subtitle: '14 moment • Från utsättning & profiler till armering & gjutklar',
    icon: '🏗️',
    count: 14
  },
  ALTAN_TRADACK: {
    title: 'Altan & Trädäck',
    subtitle: '10 moment • Markarbete (AMA) & Snickeri (Svenskt Trä) mot tjäle',
    icon: '🪵',
    count: 10
  },
  PLATTSATTNING: {
    title: 'Plattsättning & Marksten',
    subtitle: '6 moment • Riktsnöre, Pythagoras, avdragning, plattor & fogsand',
    icon: '🧱',
    count: 6
  },
  ENSKILT_AVLOPP: {
    title: 'Enskilt Avlopp & Infiltration',
    subtitle: '6 moment • Rulltest, schakt, grundvattenavstånd, brunn & luftning',
    icon: '💧',
    count: 6
  }
};
