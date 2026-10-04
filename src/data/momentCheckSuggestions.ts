// Realistic Swedish construction egenkontroller according to AMA Anläggning & AMA Hus
export interface CheckSuggestion {
  id: string;
  label: string;
  category: 'LASER_MÅTT' | 'MATERIAL' | 'KVALITET' | 'SÄKERHET';
}

export const MOMENT_CHECK_SUGGESTIONS: Record<string, CheckSuggestion[]> = {
  // ==========================================
  // PROJEKT 1: HUSGRUND (PLATTA PÅ MARK)
  // ==========================================
  // 1.1 Inmätning & profiler (BBC.31)
  '1.1': [
    { id: '1.1_1', label: 'Ledningskollen genomförd och svar/ledningskarta på plats', category: 'SÄKERHET' },
    { id: '1.1_2', label: 'Elkabel, fiber & VA utmärkta med sprayfärg i marken', category: 'SÄKERHET' },
    { id: '1.1_3', label: 'Profilställningar monterade stadigt utanför schaktområdet', category: 'KVALITET' },
    { id: '1.1_4', label: 'Kryssmått och 90°-vinklar kontrollerade (diff < 5 mm)', category: 'LASER_MÅTT' },
    { id: '1.1_5', label: 'Fast fixpunkt (referensplushöjd RH2000) etablerad', category: 'LASER_MÅTT' },
  ],
  // 1.2 Avtäckning & Matjordsschakt (CBB.1)
  '1.2': [
    { id: '1.2_1', label: 'All matjord avtäckt minst 1,5–2 m utanför blivande sockel', category: 'KVALITET' },
    { id: '1.2_2', label: 'Matjord lagd i separat upplag utan föroreningar', category: 'MATERIAL' },
    { id: '1.2_3', label: 'Inga stubbar, rötter eller humusrester kvar i schaktbotten', category: 'KVALITET' },
    { id: '1.2_4', label: 'Schaktbotten lutar bortåt så att regnvatten inte samlas', category: 'LASER_MÅTT' },
  ],
  // 1.3 Schaktbotten (CBE.1)
  '1.3': [
    { id: '1.3_1', label: 'Schaktbotten avvägd mot laser med millimeterprecision', category: 'LASER_MÅTT' },
    { id: '1.3_2', label: 'Fast orörd mineraljord eller berg framschaktat', category: 'KVALITET' },
    { id: '1.3_3', label: 'Bärighet okulärbesiktigad (inget gung eller leruppluckring)', category: 'KVALITET' },
    { id: '1.3_4', label: 'Eventuell störd lera utskiftad mot bärande bergkross', category: 'MATERIAL' },
  ],
  // 1.4 Fiberduk (YJJ.1)
  '1.4': [
    { id: '1.4_1', label: 'Geotextil klass N2 (eller N3 vid lera) utrullad heltäckande', category: 'MATERIAL' },
    { id: '1.4_2', label: 'Minst 50 cm överlapp i alla längs- och tvärgående fogar', category: 'KVALITET' },
    { id: '1.4_3', label: 'Duken uppdragen minst 30 cm längs schaktkanterna', category: 'KVALITET' },
    { id: '1.4_4', label: 'Skarvar säkrade med ballast så duken inte förskjuts', category: 'SÄKERHET' },
  ],
  // 1.5 Dränering (PBB.51)
  '1.5': [
    { id: '1.5_1', label: 'Dränrör lagt med hjässa under kantbalkens underkant', category: 'LASER_MÅTT' },
    { id: '1.5_2', label: 'Kontinuerligt fall mot brunn/recipient (minst 5 mm/m)', category: 'LASER_MÅTT' },
    { id: '1.5_3', label: 'Rören helt omslutna av tvättad makadam (8–16 / 11–16 mm)', category: 'MATERIAL' },
    { id: '1.5_4', label: 'Dräneringslager omsvept med fiberduk mot igenslamning', category: 'KVALITET' },
  ],
  // 1.6 Dagvatten & Spolbrunnar (PBB.2)
  '1.6': [
    { id: '1.6_1', label: 'Täta orange markrör 110 mm monterade för stuprör', category: 'MATERIAL' },
    { id: '1.6_2', label: 'Dagvatten helt separerat från dräneringsledningarna', category: 'SÄKERHET' },
    { id: '1.6_3', label: 'Rens- och spolbrunnar monterade vid strategiska hörn', category: 'KVALITET' },
    { id: '1.6_4', label: 'Fall mot dagvattenbrunn kontrollerat (minst 10‰ / 1 cm/m)', category: 'LASER_MÅTT' },
  ],
  // 1.7 Bottenavlopp & Spillvatten (PBB.1)
  '1.7': [
    { id: '1.7_1', label: 'Avloppsrör lagda med kontrollerat fall 1:50–1:100 (1–2 cm/m)', category: 'LASER_MÅTT' },
    { id: '1.7_2', label: 'Rören kilar och fixeras stadigt i makadam mot rörelse', category: 'KVALITET' },
    { id: '1.7_3', label: 'Provspolat och täthetskontrollerat utan bakfall', category: 'KVALITET' },
    { id: '1.7_4', label: 'Fabriksmonterade rörproppar ditsatta i alla avstick', category: 'SÄKERHET' },
  ],
  // 1.8 Inkommande vatten & el (PBB.4)
  '1.8': [
    { id: '1.8_1', label: 'Skyddsrör för PEM-vatten (32/40 mm) och elservis förlagda', category: 'MATERIAL' },
    { id: '1.8_2', label: 'Mjuk böjradie på tomrören (minst 1,0 meter) under grunden', category: 'KVALITET' },
    { id: '1.8_3', label: 'Dragtråd säkrad och surrad i båda ändar mot insugning', category: 'SÄKERHET' },
    { id: '1.8_4', label: 'Röruppstick centrerade i blivande teknikrum/schakt', category: 'LASER_MÅTT' },
  ],
  // 1.9 Radonsäkring (DFD)
  '1.9': [
    { id: '1.9_1', label: 'Perforerad radonslang lagd i serpentinslingor i makadamen', category: 'MATERIAL' },
    { id: '1.9_2', label: 'Tätningsmanschetter och butyltejp monterade runt alla rör', category: 'KVALITET' },
    { id: '1.9_3', label: 'Uppstick förberett för framtida fläktanslutning', category: 'KVALITET' },
    { id: '1.9_4', label: 'Inga skador eller revor på radonduk / tätningslager', category: 'SÄKERHET' },
  ],
  // 1.10 Laserinvägning & Avdragningsbädd (DCB.11)
  '1.10': [
    { id: '1.10_1', label: 'Avdragningsbädd avjämnad med laser under sockelelement', category: 'LASER_MÅTT' },
    { id: '1.10_2', label: 'Höjdavvikelse kontrollerad mot plushöjd (max ±5 mm)', category: 'LASER_MÅTT' },
    { id: '1.10_3', label: 'Fast fixpunkt avläst morgon och kväll för kontroll', category: 'LASER_MÅTT' },
    { id: '1.10_4', label: 'Större stenar rensade under kantelementens blivande fot', category: 'KVALITET' },
  ],
  // 1.11 Uppfyllnad & Packning (CEB.21)
  '1.11': [
    { id: '1.11_1', label: 'Tvättad kapillärbrytande makadam utan nollfraktion (8–16 el 11–16)', category: 'MATERIAL' },
    { id: '1.11_2', label: 'Packning utförd i skikt om max 20–30 cm med markvibrator', category: 'KVALITET' },
    { id: '1.11_3', label: 'Minst 4–6 överfarter i kors per skikt genomförda', category: 'KVALITET' },
    { id: '1.11_4', label: 'Bäddtjocklek kontrollerad mot ritning (minst 150–200 mm)', category: 'LASER_MÅTT' },
  ],
  // 1.12 Form & Kantelement (GSC.1)
  '1.12': [
    { id: '1.12_1', label: 'Kantelement uppställda i rak linje mot profilsnöre i våg', category: 'LASER_MÅTT' },
    { id: '1.12_2', label: 'Kryssmått kontrollerat mellan diagonala hörn (diff < 5 mm)', category: 'LASER_MÅTT' },
    { id: '1.12_3', label: 'Elementens hörn låsta med skarvplåtar och fästkilar', category: 'KVALITET' },
    { id: '1.12_4', label: 'Yttre mothåll (makadam/schaktmassor/stöttor) mot betongtryck', category: 'SÄKERHET' },
  ],
  // 1.13 Cellplastisolering (DBG.1)
  '1.13': [
    { id: '1.13_1', label: 'Cellplastskivor (EPS) utlagda i förband med brutna skarvar', category: 'KVALITET' },
    { id: '1.13_2', label: 'Total isoleringstjocklek enligt konstruktionsritning (t.ex. 300 mm)', category: 'MATERIAL' },
    { id: '1.13_3', label: 'Plasthullingar (plastspik) monterade mellan isoleringsskikten', category: 'KVALITET' },
    { id: '1.13_4', label: 'Inga genomgående glipor eller brutna hörn där betong kan tränga ner', category: 'KVALITET' },
  ],
  // 1.14 Armering & Distanser (EBB.1)
  '1.14': [
    { id: '1.14_1', label: 'Armeringsstolar (distanser) utplacerade för min 30 mm täckskikt', category: 'LASER_MÅTT' },
    { id: '1.14_2', label: 'Armeringsjärn och byglar i kantbalk najade enligt ritning', category: 'KVALITET' },
    { id: '1.14_3', label: 'Armeringsnät najat med minst 1–2 rutors skarvöverlapp', category: 'MATERIAL' },
    { id: '1.14_4', label: 'Extra hörnjärn och kantskor monterade i alla ytterhörn', category: 'KVALITET' },
    { id: '1.14_5', label: 'Fotodokumentation utförd före betongbilens ankomst', category: 'SÄKERHET' },
  ],

  // ==========================================
  // PROJEKT 2: PLATTSÄTTNING & MARKSTEN
  // ==========================================
  // 2.1 Riktsnöre & Laserhöjd (BJB.3)
  '2.1': [
    { id: '2.1_1', label: 'Riktsnöre spänt mellan armeringsjärn och kontrollerat stumt', category: 'KVALITET' },
    { id: '2.1_2', label: 'Höjd avvägd med laser med korrekt fall från huset (1–2 cm/m)', category: 'LASER_MÅTT' },
    { id: '2.1_3', label: 'Säkerställt att inga svackor bildas längs fasadlinjen', category: 'LASER_MÅTT' },
  ],
  // 2.2 Kryssmätning & Vinkel (BJB.3)
  '2.2': [
    { id: '2.2_1', label: '90°-vinkel kontrollerad med 3-4-5-metoden (Pythagoras)', category: 'LASER_MÅTT' },
    { id: '2.2_2', label: 'Kryssmått mätt diagonalt mellan motstående hörn', category: 'LASER_MÅTT' },
    { id: '2.2_3', label: 'Baslinje låst orubbligt mot fasaden', category: 'KVALITET' },
  ],
  // 2.3 Rör & Avdragning (DCB.32)
  '2.3': [
    { id: '2.3_1', label: 'Stenflis fraktion 2–4 eller 2–5 mm utlagt', category: 'MATERIAL' },
    { id: '2.3_2', label: 'Avdragningsrör invägda med laser på exakt sättdjup', category: 'LASER_MÅTT' },
    { id: '2.3_3', label: 'Yta dragen med rätskiva och rörspår ifyllda försiktigt', category: 'KVALITET' },
    { id: '2.3_4', label: 'Inga fotspår eller ojämnheter på avdragen bädd', category: 'KVALITET' },
  ],
  // 2.4 Utläggning av Plattor (DEC.1)
  '2.4': [
    { id: '2.4_1', label: 'Marksten lagd i föreskrivet förband med fasad kant uppåt', category: 'KVALITET' },
    { id: '2.4_2', label: 'Fogbredd på ca 2–3 mm upprätthållen med knastar/distanser', category: 'LASER_MÅTT' },
    { id: '2.4_3', label: 'Arbete utfört stående på lagda plattor (ej på lös flis)', category: 'KVALITET' },
  ],
  // 2.5 Kapning av Sten (DEC.1 / AFS)
  '2.5': [
    { id: '2.5_1', label: 'P3-andningsskydd, hörselskydd och skyddsglasögon burna', category: 'SÄKERHET' },
    { id: '2.5_2', label: 'Vattenkylt kapbord eller motorkap med vattenbegjutning använd', category: 'SÄKERHET' },
    { id: '2.5_3', label: 'Passbitar inmätta med märkpenna och kapade med raka snitt', category: 'KVALITET' },
  ],
  // 2.6 Fogning med Fogsand (DEC.1)
  '2.6': [
    { id: '2.6_1', label: 'Ytan helt torr före fogsandning påbörjades', category: 'KVALITET' },
    { id: '2.6_2', label: 'Fogsand (0–2 mm) sopad diagonalt över alla fogar', category: 'KVALITET' },
    { id: '2.6_3', label: 'Alla fogar helt fyllda till plattornas fasningskant', category: 'KVALITET' },
  ],

  // ==========================================
  // PROJEKT 3: ENSKILT AVLOPP & INFILTRATION
  // ==========================================
  // 3.1 Markbäddstest (BBC.1)
  '3.1': [
    { id: '3.1_1', label: 'Jordprov taget på dimensionerande infiltrationsnivå', category: 'KVALITET' },
    { id: '3.1_2', label: 'Rulltest utfört (bedömning av sand/grus vs lera)', category: 'MATERIAL' },
    { id: '3.1_3', label: 'Resultat dokumenterat och fotograferat mot miljöbeslut', category: 'KVALITET' },
  ],
  // 3.2 Schakt för Brunn & Infiltration (CBB.31)
  '3.2': [
    { id: '3.2_1', label: 'Schaktgrop för slamavskiljare och spridningsbädd utförd enligt tillstånd', category: 'LASER_MÅTT' },
    { id: '3.2_2', label: 'Grävmaskin har ej kört i botten av spridningsytan (orörda porer)', category: 'SÄKERHET' },
    { id: '3.2_3', label: 'Schaktbotten avjämnad till föreskriven nivå med laser', category: 'LASER_MÅTT' },
  ],
  // 3.3 Grundvattenavstånd (BBC.14)
  '3.3': [
    { id: '3.3_1', label: 'Minst 1,0 m fritt avstånd mellan spridarbotten och högsta grundvatten/berg', category: 'LASER_MÅTT' },
    { id: '3.3_2', label: 'Grundvattennivå/rosthorisont kontrollerad i provgrop', category: 'KVALITET' },
    { id: '3.3_3', label: 'Fotodokumentation med tumstock mot grundvatten utförd', category: 'SÄKERHET' },
  ],
  // 3.4 Etablering av Trekammarbrunn (PDD.1)
  '3.4': [
    { id: '3.4_1', label: 'Avdragen sand/flisbädd anlagd under slamavskiljaren', category: 'MATERIAL' },
    { id: '3.4_2', label: 'Brunnen kontrollerad i våg med vattenpass i båda riktningar', category: 'LASER_MÅTT' },
    { id: '3.4_3', label: 'Tanken fylld med vatten under pågående återfyllnad mot uppflytning', category: 'SÄKERHET' },
  ],
  // 3.5 Spridningsledningar & Makadam (PBB.53)
  '3.5': [
    { id: '3.5_1', label: 'Tvättad makadam (16–32 / 11–16 mm) utlagd till 25–30 cm tjocklek', category: 'MATERIAL' },
    { id: '3.5_2', label: 'Fördelningsbrunn med ställbara klockor monterad i våg', category: 'KVALITET' },
    { id: '3.5_3', label: 'Slitsade 110 mm spridarrör lagda med svagt jämnt fall (5–10 mm/m)', category: 'LASER_MÅTT' },
  ],
  // 3.6 Luftningsrör & Geotextil (YJJ.1 / PBB.53)
  '3.6': [
    { id: '3.6_1', label: 'Luftningsrör med huvar monterade minst 50 cm över markyta', category: 'LASER_MÅTT' },
    { id: '3.6_2', label: 'Geotextil (klass N1/N2) täcker hela makadambädden med överlapp', category: 'MATERIAL' },
    { id: '3.6_3', label: 'Helhetsfoto av anläggningen taget innan övertäckning med jord', category: 'SÄKERHET' },
  ],

  // ==========================================
  // PROJEKT 4: ALTAN & TRÄDÄCK
  // ==========================================
  // 4.1 Urgrävning & Avbaning (CBB.11)
  '4.1': [
    { id: '4.1_1', label: 'All matjord och växtlighet schaktad till ren mineraljord (min 15–20 cm)', category: 'KVALITET' },
    { id: '4.1_2', label: 'Schaktbotten lutar bort från husfasaden', category: 'LASER_MÅTT' },
    { id: '4.1_3', label: 'Schaktbotten fri från rötter och organiskt material', category: 'KVALITET' },
  ],
  // 4.2 Dränerande bärlager & Fiberduk (DCB.11 / YJJ.1)
  '4.2': [
    { id: '4.2_1', label: 'Fiberduk klass N2 utrullad med minst 30–50 cm överlapp', category: 'MATERIAL' },
    { id: '4.2_2', label: 'Tvättad makadam utan nollfraktion (8–16, 11–16 el 16–32 mm) påfylld min 15 cm', category: 'MATERIAL' },
    { id: '4.2_3', label: 'Bädd avjämnad och tjälbrytande skikt fotodokumenterat', category: 'LASER_MÅTT' },
  ],
  // 4.3 Plintgrund till frostfritt djup (CBF.1)
  '4.3': [
    { id: '4.3_1', label: 'Plintgropar grävda till frostfritt djup (minst 60–80 cm)', category: 'LASER_MÅTT' },
    { id: '4.3_2', label: 'Bottenplatta/lastspridande sten placerad under plintfot', category: 'KVALITET' },
    { id: '4.3_3', label: 'Plintavstånd kontrollerat mot bärighetsdimensionering (max 2,0 m c/c)', category: 'LASER_MÅTT' },
  ],
  // 4.4 Dränerande återfyllning (CEB.51)
  '4.4': [
    { id: '4.4_1', label: 'Återfyllning kring plintar utförd med ren makadam (ej lera)', category: 'MATERIAL' },
    { id: '4.4_2', label: 'Makadamen packad i skikt runt plintarna mot tjällyft', category: 'KVALITET' },
  ],
  // 4.5 Justering av markfall (CBB.31)
  '4.5': [
    { id: '4.5_1', label: 'Markfall kontrollerat bort från husgrund (minst 1–2 cm/m / 1:100)', category: 'LASER_MÅTT' },
    { id: '4.5_2', label: 'Inga svackor där vatten kan samlas under trallen', category: 'KVALITET' },
  ],
  // 4.6 Kryssmätning & Diagonaler (BEB.11)
  '4.6': [
    { id: '4.6_1', label: 'Kryssmått mätt diagonalt mellan motstående hörn (max 5 mm diff)', category: 'LASER_MÅTT' },
    { id: '4.6_2', label: '90°-vinklar mot husfasad kontrollerade med Pythagoras 3-4-5', category: 'LASER_MÅTT' },
  ],
  // 4.7 Montering av Bärlinor (GBC.11)
  '4.7': [
    { id: '4.7_1', label: 'Bärlinor i konstruktionsvirke klass NTR/A (minst 45x170 mm)', category: 'MATERIAL' },
    { id: '4.7_2', label: 'Syllpapp monterad mellan stolpsko/betong och trä', category: 'KVALITET' },
    { id: '4.7_3', label: 'Bärlinor avvägda stenhårt i våg med långpass eller laser', category: 'LASER_MÅTT' },
    { id: '4.7_4', label: 'Genomgående varmförzinkad bult eller ankarskruv monterad', category: 'SÄKERHET' },
  ],
  // 4.8 Golvreglar & c/c-avstånd (GBC.21)
  '4.8': [
    { id: '4.8_1', label: 'Golvreglar monterade med max c/c 600 mm för 28 mm trall (c/c 400 vid 22 mm)', category: 'LASER_MÅTT' },
    { id: '4.8_2', label: 'Reglar fästa med godkända balkskor eller vinkelbeslag', category: 'KVALITET' },
    { id: '4.8_3', label: 'Regelverkets ovansida kontrollerad absolut plan med rätskiva', category: 'LASER_MÅTT' },
  ],
  // 4.9 Montering av Kortlingar (GBC.22)
  '4.9': [
    { id: '4.9_1', label: 'Dubbla kortlingar monterade vid alla trallskarvpunkter', category: 'KVALITET' },
    { id: '4.9_2', label: 'Kortlingar monterade under blivande frisram runt trallen', category: 'KVALITET' },
    { id: '4.9_3', label: 'Alla kapade ändträn inoljade med grundolja före montering', category: 'MATERIAL' },
  ],
  // 4.10 Trallläggning & Skruvavstånd (HSD.1)
  '4.10': [
    { id: '4.10_1', label: 'Trallbrädor lagda med kärnsidan ("glada sidan") vänd uppåt', category: 'KVALITET' },
    { id: '4.10_2', label: 'Fast brädavstånd (3–5 mm) upprätthållet med distanskloss/trallman', category: 'LASER_MÅTT' },
    { id: '4.10_3', label: 'Rostfri trallskruv (klass C4 eller A2) dragen till jämn nivå', category: 'MATERIAL' },
    { id: '4.10_4', label: 'Förborrning utförd i brädornas ändar mot sprickbildning', category: 'KVALITET' },
  ],
};

// Default generic check suggestions for any unmapped moment
export const GENERIC_CHECK_SUGGESTIONS: CheckSuggestion[] = [
  { id: 'gen_1', label: 'Laserhöjd kontrollerad mot ritning (± 5 mm)', category: 'LASER_MÅTT' },
  { id: 'gen_2', label: 'Fall och lutning kontrollerad med laser / vattenpass', category: 'LASER_MÅTT' },
  { id: 'gen_3', label: 'Material godkänt enligt AMA & följesedel', category: 'MATERIAL' },
  { id: 'gen_4', label: 'Okulärbesiktning utförd utan anmärkning', category: 'KVALITET' },
  { id: 'gen_5', label: 'Säkerhetsavstånd och personlig skyddsutrustning säkrade', category: 'SÄKERHET' },
  { id: 'gen_6', label: 'Fotodokumentation med referensmåttstock utförd', category: 'KVALITET' },
];

export function getSuggestionsForMoment(momentId: string): CheckSuggestion[] {
  return MOMENT_CHECK_SUGGESTIONS[momentId] || GENERIC_CHECK_SUGGESTIONS;
}
