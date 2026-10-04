import React, { useState } from 'react';
import { MomentDefinition } from '../types';
import { getSmartAiSuggestionsForMoment, MomentAiQuestionItem } from '../data/momentAiSuggestions';
import { safeFetchJson } from '../services/apiHelper';
import {
  Bot,
  X,
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Wrench,
  Ruler,
  Layers,
  FileCheck,
  RotateCcw
} from 'lucide-react';

interface MomentAiHelperModalProps {
  moment: MomentDefinition;
  onClose: () => void;
  onInsertToNotes?: (text: string) => void;
}

export const MomentAiHelperModal: React.FC<MomentAiHelperModalProps> = ({
  moment,
  onClose,
  onInsertToNotes
}) => {
  const suggestions = getSmartAiSuggestionsForMoment(
    moment.id,
    moment.title,
    moment.instruction,
    moment.studentTip,
    moment.proTip
  );

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [freeTextQuestion, setFreeTextQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle clicking a predefined suggestion
  const handleSelectSuggestion = async (item: MomentAiQuestionItem) => {
    setSelectedQuestion(item.question);
    setActiveAnswer(item.instantAnswer);
    setIsAiGenerated(false);

    // Call server Gemini to enrich if online
    try {
      setIsLoading(true);
      const res = await safeFetchJson<{ answer?: string }>('/api/gemini-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: item.question,
          momentId: moment.id,
          momentTitle: moment.title,
          amaCode: moment.amaCode,
          projectType: moment.projectType,
          instruction: moment.instruction,
          studentTip: moment.studentTip,
          proTip: moment.proTip
        })
      });

      if (res.ok && res.data?.answer) {
        setActiveAnswer(res.data.answer);
        setIsAiGenerated(true);
      }
    } catch {
      // Keep instantAnswer if offline
    } finally {
      setIsLoading(false);
    }
  };

  // Handle asking custom free-text question
  const handleAskFreeText = async () => {
    const q = freeTextQuestion.trim();
    if (!q || isLoading) return;

    setSelectedQuestion(q);
    setIsLoading(true);

    // Check if free text question matches any known item
    const lower = q.toLowerCase();
    const matched = suggestions.find((s) => lower.includes(s.question.toLowerCase().replace('vad är ', '').replace('?', '')));
    if (matched) {
      setActiveAnswer(matched.instantAnswer);
    } else {
      setActiveAnswer(null);
    }

    try {
      const res = await safeFetchJson<{ answer?: string }>('/api/gemini-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          momentId: moment.id,
          momentTitle: moment.title,
          amaCode: moment.amaCode,
          projectType: moment.projectType,
          instruction: moment.instruction,
          studentTip: moment.studentTip,
          proTip: moment.proTip
        })
      });

      if (res.ok && res.data?.answer) {
        setActiveAnswer(res.data.answer);
        setIsAiGenerated(true);
      } else {
        if (!activeAnswer) {
          setActiveAnswer(
            `[PRAKTISKT BRANSCHRÅD FÖR MOMENT ${moment.id}]\n\nFör frågan "${q}":\nFölj arbetsinstruktionen: "${moment.instruction}". Kontrollera mått med laser/tumstock och rådfråga handledare eller lärare vid minsta osäkerhet.`
          );
        }
      }
    } catch {
      if (!activeAnswer) {
        setActiveAnswer(
          `[OFFLINE-SVAR FÖR MOMENT ${moment.id}]\n\nFör frågan "${q}":\nSe arbetsinstruktionen och yrkeslärarens råd: "${moment.proTip || moment.instruction}". Säkerställ att du följer AMA ${moment.amaCode}.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (onInsertToNotes) {
      onInsertToNotes(`AI-svar (${selectedQuestion}):\n${text}`);
    }
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetToQuestions = () => {
    setSelectedQuestion(null);
    setActiveAnswer(null);
    setFreeTextQuestion('');
  };

  const getTagColor = (tag: MomentAiQuestionItem['tag']) => {
    switch (tag) {
      case 'VERKTYG':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'MATERIAL':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'MÅTT & AVSTÅND':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'METOD':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'REGLER & AMA':
      default:
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f141d] border-2 border-sky-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#121c2c] to-[#0c1420] border-b border-sky-900/60 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border-2 border-sky-400/40 text-sky-400 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10">
              <Bot className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold bg-sky-950 text-sky-300 px-2 py-0.5 rounded-lg border border-sky-800">
                  Moment {moment.id} • AMA {moment.amaCode}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  AI-Hjälpare
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white truncate leading-tight mt-0.5">
                {moment.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Moment Context Box */}
          <div className="bg-[#141a26] border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Texten för detta moment:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">AMA {moment.amaCode}</span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed bg-[#0b0f17] p-3.5 rounded-xl border border-slate-800">
              "{moment.instruction}"
            </p>
          </div>

          {/* AI Question & Suggestions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Vilken del av instruktionen förstår du inte?</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klicka på ett begrepp, verktyg eller mått från texten för direkt pedagogisk förklaring:
                </p>
              </div>

              {selectedQuestion && (
                <button
                  type="button"
                  onClick={handleResetToQuestions}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Visa alla frågor</span>
                </button>
              )}
            </div>

            {/* Clickable Quick Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suggestions.map((item) => {
                const isSelected = selectedQuestion === item.question;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 text-xs sm:text-sm active:scale-98 ${
                      isSelected
                        ? 'bg-sky-950/90 border-sky-400 text-white shadow-lg shadow-sky-500/20 ring-1 ring-sky-400'
                        : 'bg-[#121927] hover:bg-[#162032] border-slate-800 hover:border-sky-500/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-black leading-snug">"{item.question}"</span>
                      <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-sky-400 translate-x-1' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTagColor(item.tag)}`}>
                        {item.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Answer Box (if selected or asked) */}
          {(selectedQuestion || activeAnswer || isLoading) && (
            <div className="bg-gradient-to-b from-[#111928] to-[#0d131f] border-2 border-sky-500/50 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> AI-Hjälparen förklarar:
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                    {selectedQuestion}
                  </h4>
                </div>

                {activeAnswer && (
                  <button
                    type="button"
                    onClick={() => handleCopy(activeAnswer)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopierat!' : 'Kopiera svar'}</span>
                  </button>
                )}
              </div>

              {isLoading && !activeAnswer ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                  <span>AI analyserar momentet och sammanställer pedagogiskt svar...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap font-sans bg-[#0a0e16] p-4 rounded-xl border border-slate-800">
                    {activeAnswer}
                  </div>

                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-sky-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Förfinar svaret med fältexpertis...</span>
                    </div>
                  )}

                  {onInsertToNotes && activeAnswer && (
                    <button
                      type="button"
                      onClick={() => handleCopy(activeAnswer)}
                      className="w-full min-h-[44px] bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-500/20"
                    >
                      {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <FileCheck className="w-4 h-4" />}
                      <span>{copied ? 'Inlagt i anteckningar!' : 'Klistra in detta råd i momentets anteckningar'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free Text Custom Question Section */}
          <div className="bg-[#121824] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>Eller skriv din fråga helt fritt till AI-hjälparen:</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Ställ vilken fråga som helst om verktyg, mått, skruv, fall, toleranser eller hur man gör i praktiken.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={2}
                value={freeTextQuestion}
                onChange={(e) => setFreeTextQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskFreeText();
                  }
                }}
                placeholder="t.ex. Vad gör jag om trallbrädorna är krokiga? eller Hur hårt ska trallskruven dras?"
                className="w-full p-3 bg-[#0a0e16] border border-slate-700 focus:border-sky-400 rounded-xl text-white text-xs sm:text-sm outline-none resize-none placeholder-slate-500 transition-colors"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Tryck Enter eller klicka på knappen för svar
                </span>

                <button
                  type="button"
                  onClick={handleAskFreeText}
                  disabled={!freeTextQuestion.trim() || isLoading}
                  className="min-h-[40px] px-5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-sky-500/20 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isLoading ? 'Frågar...' : 'Fråga AI'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#0b1018] border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Bot className="w-3.5 h-3.5 text-sky-400" /> Tränad på AMA Anläggning, AMA Hus & Svenskt Trä
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Stäng
          </button>
        </div>

      </div>
    </div>
  );
};
