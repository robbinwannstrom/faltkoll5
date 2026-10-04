import React, { useState } from 'react';
import { Project, QuickNote } from '../types';
import { getFormattedCurrentTime } from '../db/indexedDb';
import {
  FileText,
  X,
  Plus,
  Minus,
  Trash2,
  Phone,
  Ruler,
  Truck,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Cloud,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { safeFetchJson } from '../services/apiHelper';

interface QuickNotesModalProps {
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
  onClose: () => void;
}

export const QuickNotesModal: React.FC<QuickNotesModalProps> = ({
  project,
  onUpdateProject,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MÅTT_HÖJD' | 'TELEFON' | 'LEVERANS' | 'ALLMÄNT'>('ALL');
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState<QuickNote['category']>('ALLMÄNT');
  const [selectedQuickTags, setSelectedQuickTags] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const notes = project.quickNotes || [];

  const filteredNotes =
    activeCategory === 'ALL' ? notes : notes.filter((n) => n.category === activeCategory);

  const handleAddNote = () => {
    const combinedTags = selectedQuickTags.length > 0 ? selectedQuickTags.join(' • ') : '';
    const fullContent = [combinedTags, noteText.trim()].filter(Boolean).join('\n');
    if (!fullContent) return;

    const newNote: QuickNote = {
      id: 'note_' + Date.now(),
      text: fullContent,
      category: noteCategory,
      createdAt: getFormattedCurrentTime(),
    };

    const updatedNotes = [newNote, ...notes];
    onUpdateProject({
      ...project,
      quickNotes: updatedNotes,
    });

    setNoteText('');
    setSelectedQuickTags([]);
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    onUpdateProject({
      ...project,
      quickNotes: updatedNotes,
    });
  };

  const handleRemoveDraftTag = (index: number) => {
    setSelectedQuickTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuickChip = (chip: { label: string; cat: QuickNote['category']; insert: string }) => {
    setNoteCategory(chip.cat);
    if (!selectedQuickTags.includes(chip.insert)) {
      setSelectedQuickTags((prev) => [...prev, chip.insert]);
    }
  };

  const handleCopyNote = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSyncToCloud = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus(null);
      const res = await safeFetchJson<{ groupCode?: string; project?: Project }>('/api/sync/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });

      if (res.ok && res.data) {
        setSyncStatus(`Anteckningar & fältblock synkat till molnet! (Kod: ${res.data.groupCode || project.groupCode || 'Aktiv'})`);
        if (res.data.project) {
          onUpdateProject(res.data.project);
        }
      } else {
        setSyncStatus('Kunde inte nå servern just nu (sparad säkert lokalt).');
      }
    } catch {
      setSyncStatus('Offlineläge (data är sparad säkert lokalt på enheten).');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const quickChips = [
    { label: '📏 Laser sockelhöjd', cat: 'MÅTT_HÖJD' as const, insert: 'Laser sockelhöjd: +' },
    { label: '📏 Schaktbotten laser', cat: 'MÅTT_HÖJD' as const, insert: 'Schaktbotten avvägd: -' },
    { label: '📞 Samtal med beställare', cat: 'TELEFON' as const, insert: 'Samtal med beställare kl ' },
    { label: '🚛 Betongbil ankomst', cat: 'LEVERANS' as const, insert: 'Betongbil beställd till kl: ' },
    { label: '🚜 Lass bergkross 0-32', cat: 'LEVERANS' as const, insert: 'Antal lass bergkross mottaget: ' },
    { label: '⚠️ ÄTA överenskommelse', cat: 'ALLMÄNT' as const, insert: 'ÄTA-arbete överenskommet med kund: ' },
  ];

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
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Fältblocket & Snabbanteckningar
                </h3>
                <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full">
                  {notes.length} st
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Skriv upp lasermått, vad folk har sagt, lass och telefonnummer i fält
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="min-h-[34px] px-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Synka anteckningar till servern så andra i gruppen kan se dem"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Synka</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              title="Stäng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync feedback */}
        {syncStatus && (
          <div className="bg-sky-950/90 border-b border-sky-700/80 px-4 py-2 flex items-center gap-2 text-xs text-sky-200">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* New Note Form */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
          {/* Quick Click Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Snabbinlägg:</span>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddQuickChip(chip)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white shrink-0 cursor-pointer transition-colors"
              >
                + {chip.label}
              </button>
            ))}
          </div>

          {/* Active Added Quick Tags with Minus [-] in corner */}
          {selectedQuickTags.length > 0 && (
            <div className="p-2.5 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-amber-400 block">
                Tillagda snabbgrejer (klicka på minus i hörnet för att ta bort):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedQuickTags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs px-2.5 py-1 rounded-lg font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftTag(idx)}
                      className="w-4 h-4 rounded bg-amber-500/30 hover:bg-rose-500 text-amber-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors ml-1"
                      title="Ta bort denna snabbgrej (-)"
                    >
                      <Minus className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Skriv mått, samtal, lass eller egen notering här..."
              className="w-full p-3 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-white text-sm outline-none resize-none placeholder-slate-500"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Kategori:</span>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="MÅTT_HÖJD">📏 Lasermått & Höjd</option>
                  <option value="TELEFON">📞 Telefonsamtal / Avtal</option>
                  <option value="LEVERANS">🚛 Leverans / Lass</option>
                  <option value="ALLMÄNT">💡 Allmänt</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddNote}
                disabled={!noteText.trim() && selectedQuickTags.length === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Spara i fältblocket</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter categories */}
        <div className="px-4 py-2.5 bg-[#0f121a] border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Alla' },
            { id: 'MÅTT_HÖJD', label: '📏 Mått' },
            { id: 'TELEFON', label: '📞 Samtal' },
            { id: 'LEVERANS', label: '🚛 Lass' },
            { id: 'ALLMÄNT', label: '💡 Allmänt' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Notes List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[220px]">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1.5">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">Inga sparade anteckningar i denna kategori</p>
              <p className="text-xs text-slate-400">
                Skriv upp viktiga mått från lasern så du slipper leta efter dem i fickan senare.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 relative group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {note.category === 'MÅTT_HÖJD' && <Ruler className="w-3.5 h-3.5 text-amber-400" />}
                    {note.category === 'TELEFON' && <Phone className="w-3.5 h-3.5 text-sky-400" />}
                    {note.category === 'LEVERANS' && <Truck className="w-3.5 h-3.5 text-emerald-400" />}
                    {note.category === 'ALLMÄNT' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                    <span className="font-semibold text-slate-300 font-mono">
                      {note.category.replace('_', ' ')}
                    </span>
                    <span>• {note.createdAt}</span>
                  </div>

                  {/* Actions in top right corner: Minus/Ta bort button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyNote(note.text, note.id)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 cursor-pointer"
                      title="Kopiera text"
                    >
                      {copiedId === note.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Minus / Radera-knapp i hörnet på rutan som användaren önskade */}
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="w-6 h-6 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-700 flex items-center justify-center cursor-pointer transition-colors"
                      title="Ta bort denna anteckning (-)"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans font-medium">
                  {note.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{notes.length} anteckningar sparade i projektet</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-lg cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
