import React, { useState } from 'react';
import { FIELD_PROBLEMS_DB, FieldProblemItem } from '../data/fieldProblemsData';
import { safeFetchJson } from '../services/apiHelper';
import {
  HelpCircle,
  Search,
  Sparkles,
  X,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Bot,
  AlertTriangle,
  Send,
  Loader2,
  FileCheck,
} from 'lucide-react';

interface FieldHelperModalProps {
  onClose: () => void;
  onInsertToNotes?: (text: string) => void;
  currentMomentTitle?: string;
  currentAmaCode?: string;
}

export const FieldHelperModal: React.FC<FieldHelperModalProps> = ({
  onClose,
  onInsertToNotes,
  currentMomentTitle,
  currentAmaCode,
}) => {
  const [activeTab, setActiveTab] = useState<'DATABASE' | 'AI'>('DATABASE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProblem, setSelectedProblem] = useState<FieldProblemItem | null>(null);

  // AI state
  const [aiQuestion, setAiQuestion] = useState(
    currentMomentTitle ? `Vad är de viktigaste kraven och fallgroparna för ${currentMomentTitle}?` : ''
  );
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  // Search & autocomplete filter
  const q = searchQuery.toLowerCase().trim();
  const searchResults = q
    ? FIELD_PROBLEMS_DB.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q)) ||
          p.solution.toLowerCase().includes(q)
      )
    : FIELD_PROBLEMS_DB;

  const handleSelectProblem = (prob: FieldProblemItem) => {
    setSelectedProblem(prob);
  };

  const handleCopySolution = (text: string) => {
    if (onInsertToNotes) {
      onInsertToNotes(text);
    }
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim() || isLoadingAi) return;

    try {
      setIsLoadingAi(true);
      setAiAnswer(null);

      const res = await safeFetchJson<{ answer?: string }>('/api/gemini-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: aiQuestion.trim(),
          momentTitle: currentMomentTitle,
          amaCode: currentAmaCode,
        }),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Server svarade inte med data');
      }

      setAiAnswer(res.data.answer || 'Inget svar erhölls.');
    } catch (err: any) {
      // Local fallback if server/offline
      const matched = FIELD_PROBLEMS_DB.find((p) =>
        aiQuestion.toLowerCase().includes(p.keywords[0]?.toLowerCase() || '')
      );
      if (matched) {
        setAiAnswer(
          `[SVAR FRÅN FÄLTKUNSKAPSBAS]\n\nProblem: ${matched.title}\n\nLösning (${matched.amaReference}):\n${matched.solution}\n\nFälttips:\n${matched.proTip}`
        );
      } else {
        setAiAnswer(
          `[PRAKTISKT BRANSCHRÅD]\n\nFör "${aiQuestion}":\n1. Kontrollera schaktbotten, plushöjd och bärighet med laser enligt AMA.\n2. Vid osäker lera: lägg fiberduk klass N2/N3 med minst 50 cm överlapp.\n3. Packa kapillärbrytande makadam i skikt om max 20-30 cm med padda.\n4. Säkerställ fall bort från huset minst 1-2 cm per meter.\n5. Fota utförd åtgärd med tidsstämpel och vattenpass.`
        );
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10131c] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-[#141824] border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Hjälp & Problemlösare (AMA & Fält)
              </h3>
              <p className="text-xs text-slate-400">
                Lös vanliga problem på bygget eller fråga AI Fältexperten
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
            title="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('DATABASE')}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'DATABASE'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Databas med vanliga problem ({FIELD_PROBLEMS_DB.length} st)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AI')}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'AI'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Fråga AI Byggexperten</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'DATABASE' ? (
            <div className="space-y-4">
              {/* Search Bar with live autocomplete */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedProblem(null);
                  }}
                  placeholder="Sök problem (t.ex. lera, kryssmått, bakfall, fiberduk, berg...)"
                  className="w-full min-h-[46px] pl-10 pr-4 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white text-sm outline-none placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedProblem(null);
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs p-1"
                  >
                    Rensa
                  </button>
                )}
              </div>

              {/* Selected Problem Detailed View */}
              {selectedProblem ? (
                <div className="bg-slate-950 border border-amber-500/50 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                        Kategori: {selectedProblem.category}
                      </span>
                      <h4 className="text-base font-bold text-white leading-tight">
                        {selectedProblem.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProblem(null)}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Tillbaka till listan
                    </button>
                  </div>

                  {/* Orsak */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-rose-400 uppercase tracking-wider block">
                      Varför uppstår detta problem?
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      {selectedProblem.cause}
                    </p>
                  </div>

                  {/* Lösning */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                        Lösning & Åtgärd:
                      </span>
                      <span className="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {selectedProblem.amaReference}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed bg-[#0f1712] p-3 rounded-lg border border-emerald-900/60 font-medium">
                      {selectedProblem.solution}
                    </p>
                  </div>

                  {/* Pro Tip */}
                  <div className="bg-[#141926] border border-sky-500/30 p-3 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Fälttips från erfarna anläggare:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedProblem.proTip}
                    </p>
                  </div>

                  {/* Copy Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopySolution(
                          `Åtgärd för "${selectedProblem.title}": ${selectedProblem.solution} (${selectedProblem.amaReference})`
                        )
                      }
                      className="w-full min-h-[44px] bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Kopierat till anteckningar!' : 'Klistra in åtgärd i momentets anteckningar'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Problems List / Autocomplete Results */
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block px-1">
                    {searchQuery ? `Förslag som matchar "${searchQuery}":` : 'Vanliga problem på bygget (klicka för lösning):'}
                  </span>

                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                      <p>Hittade inget färdigt svar för "{searchQuery}".</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('AI');
                          setAiQuestion(searchQuery);
                        }}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold cursor-pointer inline-flex items-center gap-1.5 text-xs"
                      >
                        <Bot className="w-4 h-4" />
                        <span>Fråga AI Byggexperten istället</span>
                      </button>
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectProblem(item)}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/80 text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-amber-300 px-1.5 py-0.2 rounded">
                              {item.category}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {item.amaReference}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors leading-tight">
                            {item.title}
                          </h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* AI ASSISTANT TAB */
            <div className="space-y-4">
              <div className="bg-[#121724] border border-sky-500/30 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <Bot className="w-4 h-4" />
                  <span>AI Fältassistent (Tränad på AMA Anläggning & BBR)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Beskriv din situation eller ditt problem i fält. AI-experten ger direkta mått, toleranser, fall och materialkrav.
                </p>
              </div>

              {/* Question Input */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="t.ex. Hur djupt ska dräneringsröret ligga i förhållande till schaktbotten? Hur mycket fall krävs?"
                  className="w-full p-3 bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl text-white text-sm outline-none resize-none placeholder-slate-500"
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
                    <span className="shrink-0">Snabbfrågor:</span>
                    <button
                      type="button"
                      onClick={() => setAiQuestion('Hur mycket fall ska ett 110 mm avloppsrör i mark ha?')}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 shrink-0 cursor-pointer"
                    >
                      Fall avlopp
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiQuestion('Vad är kraven på omlottläggning av fiberduk vid dålig lera?')}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 shrink-0 cursor-pointer"
                    >
                      Fiberduk lera
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiQuestion('Vilken tolerans i millimeter gäller för kantelement på husgrund?')}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 shrink-0 cursor-pointer"
                    >
                      Tolerans kantelement
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAskAi}
                    disabled={!aiQuestion.trim() || isLoadingAi}
                    className="min-h-[40px] px-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95 shadow-sm"
                  >
                    {isLoadingAi ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isLoadingAi ? 'Analyserar...' : 'Fråga'}</span>
                  </button>
                </div>
              </div>

              {/* AI Answer Box */}
              {aiAnswer && (
                <div className="bg-slate-950 border border-sky-500/50 rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-sky-400 font-bold border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-4 h-4" /> Rekommenderad lösning enligt standard
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySolution(aiAnswer)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Kopierad!' : 'Kopiera till anteckningar'}</span>
                    </button>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {aiAnswer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#141824] border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-400">
          <span>Stämmer överens med AMA Anläggning & Boverkets byggregler.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
