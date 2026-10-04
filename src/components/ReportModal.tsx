import React, { useState } from 'react';
import { Project, WeatherType, MomentPhoto, ReportLayoutStyle } from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Table,
  AlertTriangle,
  Mail,
  Send,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  signInWithGoogle,
  sendReportViaGmail,
  getGoogleAccessToken,
} from '../services/googleWorkspace';

interface ReportModalProps {
  project: Project;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ project, onClose }) => {
  const [layoutStyle, setLayoutStyle] = useState<ReportLayoutStyle>('AMA_STANDARD');
  const relevantMoments = ALL_MOMENTS.filter((m) => m.projectType === project.projectType);
  const greenMoments = relevantMoments.filter((m) => project.moments[m.id]?.status === 'GREEN');
  const typeInfo = PROJECT_TYPE_LABELS[project.projectType];

  // Gmail sending modal state
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Egenkontrollrapport: ${project.name}`);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isConfirmingSend, setIsConfirmingSend] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Egenkontroll_${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getWeatherDisplay = (w?: WeatherType) => {
    switch (w) {
      case 'SOL':
        return 'Sol / Klart';
      case 'MOLN':
        return 'Molnigt';
      case 'REGN':
        return 'Regn';
      case 'FROST_SNO':
        return 'Frost / Snö';
      default:
        return 'Klart';
    }
  };

  const handleOpenGmailModal = async () => {
    setEmailStatusMsg(null);
    setIsConfirmingSend(false);
    const token = await getGoogleAccessToken();
    if (!token) {
      try {
        await signInWithGoogle();
      } catch (err: any) {
        setEmailStatusMsg({
          text: 'Google-inloggning krävs för att skicka via Gmail: ' + (err.message || 'Avbröts'),
          type: 'error',
        });
        setIsGmailModalOpen(true);
        return;
      }
    }
    setIsGmailModalOpen(true);
  };

  const handleSendGmailReport = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      setEmailStatusMsg({ text: 'Vänligen ange en giltig mottagaradress.', type: 'error' });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusMsg(null);

    try {
      const summaryText = [
        `EGENKONTROLLRAPPORT: ${project.name}`,
        `========================================`,
        `Typ av anläggning: ${typeInfo?.title || project.projectType}`,
        `Fastighet / Plats: ${project.propertyDesignation || 'Ej angiven'}`,
        `Datum: ${project.updatedAt || project.createdAt || new Date().toISOString().substring(0, 10)}`,
        `Utförare / Entreprenör: ${project.contractorName || 'Ej angiven'}`,
        `Certifierade moment: ${greenMoments.length} av ${relevantMoments.length}`,
        `\nKONTROLLERADE MOMENT (AMA BYGGSTANDARD):`,
        relevantMoments
          .map((m) => {
            const st = project.moments[m.id];
            const isDone = st?.status === 'GREEN';
            return `- [${isDone ? 'GODKÄND' : 'EJ KLAR'}] ${m.amaCode || ''} ${m.title} ${st?.signature ? `(Signerad: ${st.signature})` : ''}`;
          })
          .join('\n'),
        `\nMeddelande skickat via FältKoll - Digital egenkontroll & byggstöd.`,
      ].join('\n');

      await sendReportViaGmail(recipientEmail.trim(), emailSubject.trim(), summaryText);
      setEmailStatusMsg({
        text: `Rapporten skickades framgångsrikt till ${recipientEmail.trim()}!`,
        type: 'success',
      });
      setIsConfirmingSend(false);
    } catch (err: any) {
      setEmailStatusMsg({
        text: 'Kunde inte skicka e-post: ' + err.message,
        type: 'error',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-2 sm:p-6 backdrop-blur-md flex flex-col items-center"
    >
      {/* Top Action Bar (Hidden when printed) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#11141e] border border-slate-700/80 rounded-2xl p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xl print:hidden"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              Egenkontrollrapport
            </h3>
            <p className="text-xs text-slate-400">
              {greenMoments.length} av {relevantMoments.length} moment certifierade
            </p>
          </div>
        </div>

        {/* Layout Switcher (Båda sätten att välja på!) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setLayoutStyle('AMA_STANDARD')}
            className={`min-h-[36px] px-3 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutStyle === 'AMA_STANDARD'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="AMA-standard med tabeller och foton"
          >
            <Table className="w-3.5 h-3.5" />
            <span>AMA Byggstandard</span>
          </button>

          <button
            type="button"
            onClick={() => setLayoutStyle('PHOTO_SUMMARY')}
            className={`min-h-[36px] px-3 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutStyle === 'PHOTO_SUMMARY'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Kompaktare sammanfattande fotoprotokoll"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Fotoprotokoll</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenGmailModal}
            className="min-h-[42px] px-3.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
            title="Skicka rapporten via Gmail"
          >
            <Mail className="w-4 h-4 stroke-[2.5]" />
            <span>Skicka med Gmail</span>
          </button>

          <button
            onClick={handlePrint}
            className="min-h-[42px] px-4 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Skriv ut / PDF</span>
          </button>

          <button
            onClick={handleExportJson}
            className="min-h-[42px] px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            title="Ladda ner JSON-fil"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={onClose}
            className="min-h-[42px] w-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center border border-slate-700 cursor-pointer"
            title="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. AMA BYGGSTANDARD (EXAKT KONTROLLTABELL ENLIGT AMA)         */}
      {/* ============================================================== */}
      {layoutStyle === 'AMA_STANDARD' && (
        <div
          id="printable-report"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl bg-white text-slate-950 rounded-xl shadow-2xl p-6 sm:p-10 font-sans border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full space-y-8"
        >
          {/* Logo & Document Title */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-sky-600" />
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase block">
                  {project.contractorName || 'Egenkontroll Entreprenad'}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase block">
                  Officiellt kontrollprotokoll
                </span>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                Egenkontroll Mark & Bygg
              </h2>
              <span className="text-xs text-slate-600 font-medium">
                AMA Anläggning • SS-EN Standard
              </span>
            </div>
          </div>

          {/* Project Details Grid Box */}
          <table className="w-full border-collapse border-2 border-slate-800 text-xs sm:text-sm">
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="w-1/2 p-2.5 border-r border-slate-800 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Projekt:</span>
                  <strong className="text-slate-900 text-sm sm:text-base font-bold">
                    {project.name}
                  </strong>
                  <span className="block text-xs text-slate-600 mt-0.5">Fastighet: {project.propertyDesignation}</span>
                </td>
                <td className="w-1/2 p-2.5 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Byggherre:</span>
                  <strong className="text-slate-900 text-sm sm:text-base font-bold">
                    {project.clientName || 'Beställare'}
                  </strong>
                </td>
              </tr>
              <tr>
                <td className="w-1/2 p-2.5 border-r border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Projektnummer:</span>
                  <strong className="font-mono text-slate-900">
                    {project.projectNumber || '3313200-5001'}
                  </strong>
                </td>
                <td className="w-1/2 p-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Totalentreprenör:</span>
                  <strong className="text-slate-900 font-bold">
                    {project.contractorName || 'Totalentreprenör'}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Fältmått & Kryssmått i rapporten */}
          {project.fieldMeasurements?.diagonal && (
            <div className="border-2 border-slate-800 p-3.5 bg-amber-50/70 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-black text-amber-950 uppercase tracking-wider block text-[11px]">
                  📐 Registrerade Fältmått & Kryssmått (Kontrollerad Vinkelräthet):
                </span>
                <span className="text-slate-800 font-medium text-xs mt-0.5 block">
                  Längd (A): <strong>{project.fieldMeasurements.sideA || '-'} m</strong> • Bredd (B):{' '}
                  <strong>{project.fieldMeasurements.sideB || '-'} m</strong> • Beräknat Kryssmått (diagonal):{' '}
                  <strong className="font-mono text-amber-950 text-sm">
                    {project.fieldMeasurements.diagonal.toFixed(2)} m
                  </strong>
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-950 bg-amber-200/90 px-2.5 py-1 rounded-lg border border-amber-400 self-start sm:self-auto">
                90° Vinkel Verifierad
              </span>
            </div>
          )}

          {/* Försyn & Skadeguide Status i rapporten */}
          {project.preInspectionCompleted ? (
            <div className="border-2 border-emerald-800/80 bg-emerald-50/80 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-black text-emerald-950 block text-xs">
                  ✓ Försyn & Omgivningsbesiktning Genomförd före Schakt
                </span>
                <span className="text-emerald-900 text-[11px] mt-0.5 block">
                  Dokumenterat med {project.preInspectionPhotos?.length || 0} tidsstämplade fotobevis mot närliggande fastighet, staket och väg enligt branschstandard.
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-950 bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-400 self-start sm:self-auto">
                Skydd mot skadeanspråk
              </span>
            </div>
          ) : project.preInspectionExempted ? (
            <div className="border border-slate-400 bg-slate-50 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-black text-slate-800 block text-xs">
                  ℹ Försyn Avböjd / Skolundantag Registrerat
                </span>
                <span className="text-slate-600 text-[11px] mt-0.5 block">
                  Godkänt skäl: {project.preInspectionExemptReason || 'Praktisk skolövning i övningshall'}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                Undantag övning
              </span>
            </div>
          ) : (
            <div className="border-2 border-orange-400 bg-orange-50 p-3.5 rounded-xl text-xs space-y-1 shadow-sm">
              <span className="font-black text-orange-950 block text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                OBS: Försyn & Skadeguide är ej genomförd eller avböjd för denna övning
              </span>
              <p className="text-[11px] text-orange-900 leading-relaxed">
                Enligt god anläggningssed (AB04/AMA) ska försyn utföras innan tunga maskiner etableras. För att certifiera egenkontrollen fullständigt kan du antingen gå tillbaka och fota försynen eller godkänna skolundantag i checklistan.
              </p>
            </div>
          )}

          {/* List of certified moments in AMA table standard */}
          {greenMoments.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl text-slate-500">
              Inga moment har certifierats som gröna ännu. Genomför momenten i checklistan och lås med signatur.
            </div>
          ) : (
            <div className="space-y-10">
              {greenMoments.map((moment, idx) => {
                const record = project.moments[moment.id];
                const photos: MomentPhoto[] =
                  record?.photos && record.photos.length > 0
                    ? record.photos
                    : record?.photoBase64
                    ? [{ id: '1', dataUrl: record.photoBase64, capturedAt: record.completedAt || '', category: 'Grund' }]
                    : [];

                return (
                  <div
                    key={moment.id}
                    className="space-y-3.5 border-t-2 border-slate-400 pt-6 page-break-inside-avoid"
                  >
                    {/* Moment & Gällande handlingar Boxar */}
                    <div className="border border-slate-800 divide-y divide-slate-800 text-xs sm:text-sm">
                      <div className="p-2.5 bg-slate-100 font-bold text-slate-900 flex items-center justify-between">
                        <span>
                          Arbetsmoment: {moment.title} (Moment {moment.id})
                        </span>
                        <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded border border-slate-400">
                          AMA: {moment.amaCode}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white text-slate-700 text-xs">
                        <strong className="font-bold text-slate-900">Gällande handlingar: </strong>
                        <span>
                          {project.applicableDocs || 'Bygghandling M30-1-01, M-10.1-01, VA-50.1-01, AMA Anläggning 20'}
                        </span>
                      </div>
                    </div>

                    {/* Kontroll-Tabell (Kontroll av / Metod / Signatur) */}
                    <table className="w-full border-collapse border border-slate-800 text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-200 border-b border-slate-800 font-black text-slate-900 text-left">
                          <th className="p-2 border-r border-slate-800 w-1/3">Kontroll av:</th>
                          <th className="p-2 border-r border-slate-800 w-1/3">Metod:</th>
                          <th className="p-2 w-1/3">Signatur / Tidsstämpel:</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <td className="p-2 border-r border-slate-800 font-semibold text-slate-900">
                            Höjd & Geometri
                          </td>
                          <td className="p-2 border-r border-slate-800 text-slate-700">
                            Laserinstrument / Avvägning
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-900">
                            {record?.signature || 'Signerat'} ({record?.completedAt})
                          </td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="p-2 border-r border-slate-800 font-semibold text-slate-900">
                            Utförande & Bärighet
                          </td>
                          <td className="p-2 border-r border-slate-800 text-slate-700">
                            Visuell kontroll & packningsprov
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-900">
                            {record?.signature || 'Signerat'}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r border-slate-800 font-semibold text-slate-900">
                            Avvikelse / Kommentar
                          </td>
                          <td className="p-2 border-r border-slate-800 italic text-slate-700" colSpan={2}>
                            "{record?.comment || 'Kontrollerat utan anmärkning enligt ritning.'}"
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Photographic Proof (Stora tydliga bilder som i användarens PDF) */}
                    {photos.length > 0 && (
                      <div className="pt-2 space-y-3">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                          Fotobevis ({photos.length} st inbäddade):
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {photos.map((p, pIdx) => (
                            <div
                              key={p.id || pIdx}
                              className="border border-slate-400 rounded-lg overflow-hidden bg-black flex flex-col"
                            >
                              <img
                                src={p.dataUrl}
                                alt={`Fotobevis för ${moment.title}`}
                                className="w-full max-h-[500px] object-contain mx-auto"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legal Sign-off Footer */}
          <div className="border-t-2 border-slate-900 pt-6 space-y-4 page-break-inside-avoid">
            <div className="grid grid-cols-2 gap-8 text-xs pt-4">
              <div className="border-t border-slate-500 pt-2">
                <span className="block font-bold text-slate-900 uppercase">Ansvarig Arbetsledare / Yrkesman:</span>
                <span className="block text-slate-700 font-mono mt-1">
                  ✍️ {project.moments[greenMoments[0]?.id]?.signature || 'Signerat'}
                </span>
              </div>
              <div className="border-t border-slate-500 pt-2">
                <span className="block font-bold text-slate-900 uppercase">Beställarens Kontrollant:</span>
                <span className="block text-slate-500 mt-1">Datum & Namnteckning</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SAMMANFATTANDE FOTOPROTOKOLL (Kompakt översikt)              */}
      {/* ============================================================== */}
      {layoutStyle === 'PHOTO_SUMMARY' && (
        <div
          id="printable-report"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl bg-white text-slate-950 rounded-xl shadow-2xl p-6 sm:p-10 font-sans border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full space-y-8"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                Fotoprotokoll • Egenkontroll
              </span>
              <h1 className="text-2xl font-black text-slate-900">{project.name}</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Fastighet: {project.propertyDesignation} • Byggherre: {project.clientName}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded">
                {greenMoments.length} av {relevantMoments.length} Klara
              </span>
            </div>
          </div>

          {/* Grid of cards with photos */}
          <div className="space-y-6">
            {greenMoments.map((moment, idx) => {
              const record = project.moments[moment.id];
              const photos: MomentPhoto[] =
                record?.photos && record.photos.length > 0
                  ? record.photos
                  : record?.photoBase64
                  ? [{ id: '1', dataUrl: record.photoBase64, capturedAt: record.completedAt || '', category: 'Grund' }]
                  : [];

              return (
                <div key={moment.id} className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                    <strong className="text-sm font-bold text-slate-900">
                      {idx + 1}. {moment.title} (Moment {moment.id})
                    </strong>
                    <span className="font-mono text-slate-600">{record?.completedAt}</span>
                  </div>

                  <p className="text-xs text-slate-700 italic">
                    "{record?.comment}" • Signerat: <strong>{record?.signature}</strong>
                  </p>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {photos.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="rounded-lg overflow-hidden border border-slate-300 bg-black">
                          <img src={p.dataUrl} alt="Foto" className="w-full h-48 object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gmail Sending Modal with Explicit Confirmation Dialog (Mandatory per Skill guidelines) */}
      {isGmailModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsGmailModalOpen(false);
          }}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#12141c] border border-orange-500/50 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Skicka rapport via Gmail</h4>
                  <p className="text-xs text-slate-400">Direkt från ditt personliga Google-konto</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGmailModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {emailStatusMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  emailStatusMsg.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-500 text-rose-200'
                }`}
              >
                {emailStatusMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{emailStatusMsg.text}</span>
              </div>
            )}

            {!isConfirmingSend ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Mottagarens e-postadress (t.ex. Lärare / Handledare):
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="T.ex. larare@skola.se"
                    className="w-full min-h-[44px] px-3 bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl text-white text-xs outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Ämne:
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full min-h-[44px] px-3 bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl text-white text-xs outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">Innehåll som bifogas i mailet:</span>
                  <p>• Projekt: {project.name}</p>
                  <p>• {greenMoments.length} av {relevantMoments.length} certifierade kontrollpunkter</p>
                  <p>• Signaturer, datum, väderdata och fullständiga kontrollprotokoll</p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGmailModalOpen(false)}
                    className="min-h-[42px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
                        setEmailStatusMsg({ text: 'Ange en giltig mottagare.', type: 'error' });
                        return;
                      }
                      setIsConfirmingSend(true);
                    }}
                    className="min-h-[42px] px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Fortsätt till granskning</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Explicit Confirmation Screen before sending */
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-orange-950/40 border border-orange-500/60 rounded-2xl space-y-2">
                  <h5 className="font-black text-orange-300 text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span>Bekräfta att du vill skicka mailet</span>
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Är du säker på att du vill skicka rapporten för <strong>"{project.name}"</strong> till <strong>{recipientEmail}</strong> via ditt Gmail-konto?
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingSend(false)}
                    className="min-h-[42px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Tillbaka
                  </button>
                  <button
                    type="button"
                    onClick={handleSendGmailReport}
                    disabled={isSendingEmail}
                    className="min-h-[42px] px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Ja, skicka mailet nu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
