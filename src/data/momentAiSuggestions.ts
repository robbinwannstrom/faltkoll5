import { MOMENT_AI_QUESTIONS } from './momentAiQuestions';

export type QuestionTag = 'VERKTYG' | 'MATERIAL' | 'MÅTT & AVSTÅND' | 'REGLER & AMA' | 'METOD';

export interface MomentAiQuestionItem {
  id: string;
  question: string;
  tag: QuestionTag;
  instantAnswer: string;
}

export interface MomentAiSuggestionConfig {
  momentId: string;
  greetingText: string;
  questions: MomentAiQuestionItem[];
}

function normalizeTag(rawTag?: string): QuestionTag {
  if (!rawTag) return 'METOD';
  const upper = rawTag.toUpperCase();
  if (upper.includes('VERKTYG')) return 'VERKTYG';
  if (upper.includes('MATERIAL')) return 'MATERIAL';
  if (upper.includes('MÅTT') || upper.includes('AVSTÅND') || upper.includes('GEOMETRI') || upper.includes('TOLERANS') || upper.includes('HÖJD')) {
    return 'MÅTT & AVSTÅND';
  }
  if (upper.includes('AMA') || upper.includes('LAG') || upper.includes('SÄKERHET') || upper.includes('REGEL') || upper.includes('BBR') || upper.includes('KRAV')) {
    return 'REGLER & AMA';
  }
  return 'METOD';
}

/**
 * Smart getter that returns the curated questions for a moment.
 * Primary source is the verified MOMENT_AI_QUESTIONS database.
 * If not present, it parses keywords from the instruction and student tips.
 */
export function getSmartAiSuggestionsForMoment(
  momentId: string,
  momentTitle: string,
  instruction: string,
  studentTip?: string,
  proTip?: string
): MomentAiQuestionItem[] {
  // 1. Primary verified source from MOMENT_AI_QUESTIONS
  const curated = MOMENT_AI_QUESTIONS[momentId];
  if (curated && curated.questions && curated.questions.length > 0) {
    return curated.questions.map((q, idx) => ({
      id: `${momentId}_${idx + 1}`,
      question: q.question,
      tag: normalizeTag(q.tag),
      instantAnswer: q.instantAnswer,
    }));
  }

  // 2. Dynamic extraction based on text contents
  const questions: MomentAiQuestionItem[] = [];
  const fullText = `${instruction} ${studentTip || ''} ${proTip || ''}`.toLowerCase();

  if (fullText.includes('makadam') || fullText.includes('bärlager') || fullText.includes('singel')) {
    questions.push({
      id: 'dyn_makadam',
      question: 'Vilka makadamfraktioner (t.ex. 8/16, 11/16, 16/32) kan användas här?',
      tag: 'MATERIAL',
      instantAnswer:
        'Tvättad makadam i fraktionerna 8/16 mm, 11/16 mm eller 16/32 mm kan användas. 8/16 mm är särskilt vanlig på skolor och mindre projekt. Undvik alltid bergskross med nollfraktion (t.ex. 0/32) som suger upp vatten kapillärt.',
    });
  }

  if (fullText.includes('fiberduk') || fullText.includes('geotextil')) {
    questions.push({
      id: 'dyn_fiberduk',
      question: 'Vad innebär fiberduksklassen och hur mycket ska den överlappa?',
      tag: 'REGLER & AMA',
      instantAnswer:
        'Fiberduk (geotextil) klass N1, N2 eller N3 används för separation och filtrering enligt AMA Anläggning. Vid omlottläggning ska skarvarna överlappa minst 30–50 cm för att förhindra att massor tränger igenom vid belastning.',
    });
  }

  if (fullText.includes('laser') || fullText.includes('avvägning') || fullText.includes('plushöjd')) {
    questions.push({
      id: 'dyn_laser',
      question: 'Hur fungerar laseravvägning och vilken tolerans tillåts?',
      tag: 'METOD',
      instantAnswer:
        'Rotationslasern ställs upp i centrum av bygget och kalibreras mot fast fixpunkt. Mottagaren på laserstången piper när rätt plushöjd nås. Toleransen är normalt ±5 mm under bärande konstruktioner enligt AMA Anläggning.',
    });
  }

  if (fullText.includes('fall') || fullText.includes('promille') || fullText.includes('lutning')) {
    questions.push({
      id: 'dyn_fall',
      question: 'Hur mycket fall krävs och varför får det inte vara bakfall?',
      tag: 'MÅTT & AVSTÅND',
      instantAnswer:
        'Minsta fall är vanligen 1:50 till 1:100 (1–2 cm per meter). Bakfall innebär att vatten rinner bakåt eller stannar i pölar, vilket kan ge fuktskador, sättningar och frostsprängning på vintern.',
    });
  }

  if (fullText.includes('padda') || fullText.includes('packa') || fullText.includes('komprimering')) {
    questions.push({
      id: 'dyn_padda',
      question: 'Hur tjocka skikt ska packas och hur många överfarter krävs med paddan?',
      tag: 'METOD',
      instantAnswer:
        'Packa i skikt om max 20–30 cm. Kör minst 4–6 överfarter i kors över varje lager. Vid dålig packning kommer marken att sätta sig när byggnaden belastas.',
    });
  }

  // Generic fallback if empty
  if (questions.length === 0) {
    questions.push({
      id: 'dyn_gen_1',
      question: `Vad är de viktigaste kraven och fällorna för ${momentTitle}?`,
      tag: 'REGLER & AMA',
      instantAnswer:
        `För ${momentTitle} är det kritiskt att följa toleranser i AMA, kontrollera underlagets bärighet och fota utförd åtgärd med tidsstämpel och tumstock/laser före övertäckning.`,
    });
    questions.push({
      id: 'dyn_gen_2',
      question: 'Vilka verktyg och kontrollmått behöver jag ha redo här?',
      tag: 'VERKTYG',
      instantAnswer:
        'Ha laser/vattenpass, tumstock, rätt skruv/fästdon och personlig skyddsutrustning redo. Kontrollera alltid mått mot ritning innan montering eller gjutning.',
    });
  }

  return questions;
}
