import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  X,
  Copy,
  CheckCircle2,
  Smartphone,
  Share,
  PlusSquare,
  Check,
  Download,
  Info,
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  getAppUrl,
  getSavedCustomAppUrl,
  saveCustomAppUrl,
  DEFAULT_APP_URL,
} from '../utils/appUrl';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Determine if logged-in user is Huvudadministratör (ADMIN)
  const resolvedUser: UserAccount | null = React.useMemo(() => {
    if (currentUser) return currentUser;
    try {
      const raw = localStorage.getItem('falthjalp_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [currentUser, isOpen]);

  const isMainAdmin = resolvedUser?.role === 'ADMIN';

  const [adminCustomUrl, setAdminCustomUrl] = useState<string>(() => getSavedCustomAppUrl());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Device detection
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const isInIframe = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  const isMobileDevice =
    isIOS ||
    isAndroid ||
    (typeof window !== 'undefined' && window.innerWidth < 768);

  // Default tab: if user is on phone, show "DENNA_MOBIL", otherwise "QR_KOD"
  const [activeTab, setActiveTab] = useState<'DENNA_MOBIL' | 'QR_KOD'>(() =>
    isMobileDevice ? 'DENNA_MOBIL' : 'QR_KOD'
  );

  const currentUrl = getAppUrl(adminCustomUrl);

  useEffect(() => {
    if (isOpen) {
      setAdminCustomUrl(getSavedCustomAppUrl());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUrlUpdated = () => {
      setAdminCustomUrl(getSavedCustomAppUrl());
    };
    window.addEventListener('falthjalp-qr-url-updated', handleUrlUpdated);
    return () => window.removeEventListener('falthjalp-qr-url-updated', handleUrlUpdated);
  }, []);

  // Check beforeinstallprompt
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).deferredPrompt) {
      setCanPromptInstall(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setCanPromptInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Generate QR code when open or URL changes
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(currentUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Kunde inte generera QR-kod:', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveUrl = async (nextUrl: string) => {
    if (!isMainAdmin) return;
    const saved = await saveCustomAppUrl(nextUrl);
    setAdminCustomUrl(saved);
    setSavedNotice(saved ? 'QR-kodens adress är sparad!' : 'Återställd till standardadress!');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleDirectInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallSuccess(true);
      }
      (window as any).deferredPrompt = null;
      setCanPromptInstall(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border-2 border-orange-500/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-auto font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold shrink-0">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                Installera på Mobilen
              </h3>
              <p className="text-xs text-slate-400">
                Fungerar direkt • Inga ZIP-filer eller nedladdningar krävs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Om användaren sitter inuti AI Studio / iframe där webbläsarens verktygsfält blockerar installation */}
        {isInIframe && typeof window !== 'undefined' && (
          <div className="p-4 bg-orange-500/15 border-2 border-orange-500 rounded-2xl space-y-2.5 text-left">
            <div className="text-xs font-black uppercase text-orange-400 tracking-wider">
              Varför går det inte att installera från verktygsfältet här?
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Just nu visas appen inuti ett förhandsgranskningsfönster (iframe). Webbläsare tillåter av säkerhetsskäl aldrig installation av en app inifrån en inbäddad ram. Öppna appen i en egen webbläsarflik först, så fungerar installationsknappen direkt!
            </p>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] px-4 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Öppna appen i egen flik för att installera</span>
            </a>
          </div>
        )}

        {/* OBS-ruta om WinRAR & ZIP */}
        <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl flex items-start gap-3 text-left">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-100 space-y-0.5">
            <strong className="text-amber-300 font-black block text-sm">
              Inga ZIP-filer eller WinRAR behövs!
            </strong>
            <p className="text-slate-300 leading-relaxed text-xs">
              Appen körs direkt i mobilens webbläsare utan att du behöver ladda ner några filer eller packa upp något.
            </p>
          </div>
        </div>

        {/* Flik-väljare (Denna mobil VS Skanna QR-kod) */}
        <div className="grid grid-cols-2 p-1 bg-[#1a1a1a] rounded-2xl border border-[#2d2d2d] gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('DENNA_MOBIL')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'DENNA_MOBIL'
                ? 'bg-orange-500 text-black font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>På denna mobil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('QR_KOD')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'QR_KOD'
                ? 'bg-orange-500 text-black font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Skanna QR-kod</span>
          </button>
        </div>

        {/* 1. OM ANVÄNDAREN ÄR PÅ EN TELEFON (eller har valt "På denna mobil") */}
        {activeTab === 'DENNA_MOBIL' && (
          <div className="space-y-4">
            {/* Direktinstallations-knapp för Android Chrome */}
            {canPromptInstall && (
              <div className="p-4 bg-emerald-950/70 border-2 border-emerald-500/80 rounded-2xl space-y-2 text-center">
                <span className="text-xs font-black uppercase text-emerald-400 block tracking-wider">
                  Snabbast möjliga installation
                </span>
                <p className="text-xs text-emerald-200">
                  Din telefon stöder direktinstallation med ett klick:
                </p>
                <button
                  type="button"
                  onClick={handleDirectInstallClick}
                  className="w-full min-h-[48px] px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>Installera appen på hemskärmen nu</span>
                </button>
              </div>
            )}

            {installSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
                <span>Appen har installerats på din hemskärm!</span>
              </div>
            )}

            {/* Steg för Android */}
            {(!isIOS || isAndroid) && (
              <div className="bg-[#181818] border border-[#2c2c2c] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                    Android (Chrome / Samsung Internet)
                  </span>
                </div>
                <ol className="list-decimal pl-4 space-y-2 text-xs sm:text-sm text-slate-200">
                  <li>
                    Tryck på <strong>menyn (tre prickar ⋮)</strong> högst upp till höger i webbläsaren.
                  </li>
                  <li>
                    Välj <strong>"Installera app"</strong> (eller <em>"Lägg till på startskärmen"</em>).
                  </li>
                  <li>
                    Tryck på <strong>"Installera"</strong>.
                  </li>
                </ol>
                <div className="p-2.5 bg-[#121212] rounded-xl border border-[#262626] text-[11px] text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Klart! App-ikonen hamnar direkt på telefonens hemskärm.</span>
                </div>
              </div>
            )}

            {/* Steg för iPhone / iPad (Safari) */}
            {isIOS && (
              <div className="bg-[#181818] border border-[#2c2c2c] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                    iPhone & iPad (Safari)
                  </span>
                </div>
                <ol className="list-decimal pl-4 space-y-2 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <span>1. Tryck på Dela-knappen</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#262626] text-white text-xs">
                      <Share className="w-3.5 h-3.5" />
                    </span>
                    <span>längst ner i Safari.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>2. Scrolla ner och tryck på</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#262626] text-white text-xs font-semibold">
                      <PlusSquare className="w-3.5 h-3.5 text-orange-400" /> Lägg till på hemskärmen
                    </span>
                  </li>
                  <li>
                    3. Tryck på <strong>"Lägg till"</strong> uppe till höger.
                  </li>
                </ol>
                <div className="p-2.5 bg-[#121212] rounded-xl border border-[#262626] text-[11px] text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Klart! Appen öppnas nu som en riktig app utan webbläsarens adressfält.</span>
                </div>
              </div>
            )}

            {/* Tydlig förklaring om ZIP och APK */}
            <div className="bg-[#1a150f] border border-orange-500/30 rounded-2xl p-3.5 space-y-1 text-xs text-slate-300">
              <span className="font-bold text-orange-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Slipp krångliga filer och uppackning
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Du behöver <strong>aldrig</strong> ladda ner eller packa upp några ZIP- eller APK-filer på mobilen. Webbläsaren skapar en äkta app direkt på din hemskärm som fungerar offline ute i schakten.
              </p>
            </div>
          </div>
        )}

        {/* 2. OM ANVÄNDAREN ÄR PÅ EN DATOR OCH VILL SKANNA MED MOBILEN */}
        {activeTab === 'QR_KOD' && (
          <div className="space-y-4 text-center">
            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl border-4 border-orange-500/30">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR-kod för mobilinstallation"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto block"
                />
              ) : (
                <div className="w-52 h-52 sm:w-60 sm:h-60 bg-slate-100 flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12 animate-pulse text-orange-500" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                Rikta mobilens vanliga kamera mot koden ovan
              </h4>
              <p className="text-xs text-slate-400">
                Klicka på länken som dyker upp på telefonen för att öppna och installera appen.
              </p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg font-mono text-[11px] text-orange-400 max-w-full truncate">
                  {currentUrl}
                </span>
              </div>
            </div>

            {/* Huvudadministratör: Redigera URL direkt här */}
            {isMainAdmin && (
              <div className="p-3.5 bg-[#181818] border-2 border-purple-500/50 rounded-2xl text-left space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">
                    Ändra QR-kodens webbadress (URL)
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700">
                    Huvudadmin
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={DEFAULT_APP_URL}
                    value={adminCustomUrl}
                    onChange={(e) => setAdminCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveUrl(adminCustomUrl);
                      }
                    }}
                    className="flex-1 bg-[#121212] border border-[#383838] focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveUrl(adminCustomUrl)}
                    className="px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer transition-colors shrink-0"
                  >
                    Spara URL
                  </button>
                </div>
                {savedNotice && (
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{savedNotice}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer-knappar */}
        <div className="space-y-2 pt-2 border-t border-[#262626]">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full min-h-[46px] px-4 bg-[#1e1e1e] hover:bg-[#282828] text-white border border-[#383838] font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Länk kopierad till urklipp!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-orange-400" />
                <span>Kopiera webblänk (för SMS eller Teams)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] bg-[#161616] hover:bg-[#222222] text-slate-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};

// Also export as QRCodeModal for backwards compatibility
export const QRCodeModal = MobileInstallModal;
