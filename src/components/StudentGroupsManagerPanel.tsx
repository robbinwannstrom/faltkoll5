import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  STANDARD_STUDENT_GROUPS,
  saveCustomStudentGroupsToCloud,
} from '../services/userService';
import {
  Users,
  FolderPlus,
  Trash2,
  Check,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';

interface StudentGroupsManagerPanelProps {
  allUsers: UserAccount[];
  customGroups: string[];
  onUpdateCustomGroups: (groups: string[]) => void;
  selectedGroupFilter: string;
  onSelectGroupFilter: (group: string) => void;
  onBulkAssignGroup: (userIds: string[], targetGroup: string) => Promise<void>;
}

export const StudentGroupsManagerPanel: React.FC<StudentGroupsManagerPanelProps> = ({
  allUsers,
  customGroups,
  onUpdateCustomGroups,
  selectedGroupFilter,
  onSelectGroupFilter,
  onBulkAssignGroup,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkTargetGroup, setBulkTargetGroup] = useState(STANDARD_STUDENT_GROUPS[0]);
  const [isAssigningBulk, setIsAssigningBulk] = useState(false);

  const allAvailableGroups = Array.from(
    new Set([
      ...STANDARD_STUDENT_GROUPS,
      ...customGroups,
      ...allUsers.map((u) => u.studentGroup).filter((g): g is string => !!g),
    ])
  );

  const students = allUsers.filter((u) => u.role === 'STUDENT');

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newGroupName.trim();
    if (!clean) return;
    if (allAvailableGroups.some((g) => g.toLowerCase() === clean.toLowerCase())) {
      setNewGroupName('');
      return;
    }
    const next = [...customGroups, clean];
    onUpdateCustomGroups(next);
    await saveCustomStudentGroupsToCloud(next);
    setBulkTargetGroup(clean);
    setNewGroupName('');
  };

  const handleRemoveCustomGroup = async (groupToRemove: string) => {
    const next = customGroups.filter((g) => g !== groupToRemove);
    onUpdateCustomGroups(next);
    await saveCustomStudentGroupsToCloud(next);
    if (selectedGroupFilter === groupToRemove) {
      onSelectGroupFilter('ALL');
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    if (selectedUserIds.length === students.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(students.map((s) => s.id));
    }
  };

  const handleExecuteBulkAssign = async () => {
    if (selectedUserIds.length === 0 || !bulkTargetGroup) return;
    setIsAssigningBulk(true);
    try {
      await onBulkAssignGroup(selectedUserIds, bulkTargetGroup);
      setSelectedUserIds([]);
    } finally {
      setIsAssigningBulk(false);
    }
  };

  return (
    <div className="bg-[#181818] border border-[#2c2c2c] rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg sm:text-xl font-black text-white">
              Elevgrupper, Program & Mass-sortering
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Skapa egna grupper (t.ex. Byggprogrammet, Anläggare, Vuxen, Gymnasie) och sortera in elever i klump.
          </p>
        </div>

        {/* Create new group form */}
        <form onSubmit={handleAddGroup} className="flex items-center gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Ny grupp (t.ex. Anläggare Åk 2)..."
            className="min-h-[42px] px-3.5 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white outline-none w-56"
          />
          <button
            type="submit"
            className="min-h-[42px] px-4 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Skapa grupp</span>
          </button>
        </form>
      </div>

      {/* Group Overview Cards */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
          Tillgängliga Utbildningsgrupper (Klicka för att visa gruppens konton):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {allAvailableGroups.map((grp) => {
            const count = students.filter((s) => s.studentGroup === grp).length;
            const isCustom = customGroups.includes(grp);
            return (
              <div
                key={grp}
                className="p-3.5 rounded-2xl bg-[#121212] border border-[#2a2a2a] hover:border-orange-500/50 flex items-center justify-between gap-2 transition-all"
              >
                <button
                  type="button"
                  onClick={() => onSelectGroupFilter(grp)}
                  className="text-left flex-1 cursor-pointer"
                >
                  <span className="font-black text-white text-xs sm:text-sm block">{grp}</span>
                  <span className="text-[11px] text-orange-400 font-bold">
                    {count} {count === 1 ? 'elev' : 'elever'} i gruppen →
                  </span>
                </button>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomGroup(grp)}
                    className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 cursor-pointer"
                    title="Ta bort egen grupp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Sort Students into Group */}
      <div className="p-5 rounded-2xl bg-[#121212] border-2 border-orange-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Mass-sortera elever till grupp ({selectedUserIds.length} markerade)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Bocka i eleverna nedan och välj vilken grupp/inriktning de ska tillhöra.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkTargetGroup}
              onChange={(e) => setBulkTargetGroup(e.target.value)}
              className="min-h-[40px] px-3 bg-[#181818] border border-orange-500/50 rounded-xl text-xs font-bold text-white outline-none"
            >
              {allAvailableGroups.map((grp) => (
                <option key={grp} value={grp}>
                  Flytta till: {grp}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={selectedUserIds.length === 0 || isAssigningBulk}
              onClick={handleExecuteBulkAssign}
              className="min-h-[40px] px-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isAssigningBulk
                  ? 'Sorterar...'
                  : `Tilldela grupp (${selectedUserIds.length})`}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={selectAllStudents}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 cursor-pointer"
          >
            {selectedUserIds.length === students.length && students.length > 0 ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>
              {selectedUserIds.length === students.length
                ? 'Avmarkera alla elever'
                : `Markera alla elever (${students.length})`}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {students.map((st) => {
            const isSelected = selectedUserIds.includes(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => toggleSelectStudent(st.id)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500 text-white'
                    : 'bg-[#181818] border-[#292929] text-slate-300 hover:border-[#3d3d3d]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-orange-500 border-orange-400 text-black'
                        : 'bg-[#121212] border-[#444]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white block truncate">
                      {st.displayName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block truncate">
                      {st.email} {st.schoolClass ? `• ${st.schoolClass}` : ''}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#121212] text-orange-300 border border-orange-800/50 shrink-0">
                  {st.studentGroup || 'Ej grupperad'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
