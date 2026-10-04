import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  ArrowLeft,
  Sparkles,
  Layers,
  HelpCircle,
  FileCode,
  X,
  Maximize2,
  Info,
} from 'lucide-react';

import { getAppUrl } from '../utils/appUrl';

interface APKExportViewProps {
  onBack: () => void;
}

export const APKExportView: React.FC<APKExportViewProps> = ({ onBack }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [currentUrl, setCurrentUrl] = useState<string>(() => getAppUrl());

  useEffect(() => {
    const handleUrlUpdated = () => setCurrentUrl(getAppUrl());
    window.addEventListener('falthjalp-qr-url-updated', handleUrlUpdated);
    return () => window.removeEventListener('falthjalp-qr-url-updated', handleUrlUpdated);
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Generate crisp, scannable QR-kod for phone camera
    QRCode.toDataURL(currentUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Kunde inte generera QR-kod:', err));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [currentUrl]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handleInstallDirect = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert(
        'På Android: Öppna webbläsarens meny (de tre prickarna ⋮ uppe till höger i Chrome) och tryck på "Installera app" eller "Lägg till på startskärmen". Då skapas en äkta Android APK-app direkt på hemskärmen!'
      );
    }
  };

  // Generate complete Android Studio APK project ZIP
  const handleDownloadAndroidProjectZip = async () => {
    try {
      setIsGeneratingZip(true);
      const zip = new JSZip();

      // README in Swedish
      const readmeContent = `# FältKoll - Komplett Android APK Projekt

Detta paket innehåller allt du behöver för att bygga en äkta Android .APK-fil för FältKoll.

## METOD 1: Direktinstallation i mobilen (Snabbast - 1 minut)
1. Öppna webbadressen på din Android-telefon i Google Chrome:
   ${currentUrl}
2. Tryck på Chrome-menyn (tre prickarna ⋮ uppe i högra hörnet).
3. Välj "Installera app" eller "Lägg till på startskärmen".
4. Android genererar och installerar automatiskt en äkta Android WebAPK med full offline-lagring och kamerasäkerhet!

## METOD 2: Skanna QR-kod direkt med kameran
1. Rikta kameran mot QR-koden i appen.
2. Tryck på länken som dyker upp på skärmen.
3. Klicka "Installera app".

## METOD 3: Bygg .APK med Android Studio
1. Packa upp denna ZIP-fil i en mapp.
2. Öppna mappen i Android Studio (File -> Open).
3. Klicka på Build -> Build Bundle(s) / APK(s) -> Build APK(s).
4. Din färdiga "app-debug.apk" finns nu i:
   app/build/outputs/apk/debug/app-debug.apk
5. För över APK-filen till mobilen via USB, Gmail eller Google Drive och klicka "Installera"!

## METOD 4: Installera med QR-kod direkt via mobilkameran
1. Rikta mobilens kamera mot QR-koden på skärmen.
2. Öppna länken och tryck "Installera app" i Chrome/Safari. Klart!
`;

      zip.file('README_INSTALLERA_APK.txt', readmeContent);

      // AndroidManifest.xml
      const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="se.falthjalp.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="FältKoll"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.FaltKoll"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

      // build.gradle (app level)
      const appBuildGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace 'se.falthjalp.app'
    compileSdk 34

    defaultConfig {
        applicationId "se.falthjalp.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.webkit:webkit:1.10.0'
}`;

      // MainActivity.java
      const mainActivityJava = `package se.falthjalp.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;
    private static final String APP_URL = "${currentUrl}";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                            FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl(APP_URL);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

      // Layout activity_main.xml
      const activityMainXml = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#121212">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</FrameLayout>`;

      // Add files into ZIP structure
      const appFolder = zip.folder('app');
      appFolder?.file('build.gradle', appBuildGradle);

      const mainFolder = appFolder?.folder('src')?.folder('main');
      mainFolder?.file('AndroidManifest.xml', manifestXml);

      const javaFolder = mainFolder?.folder('java')?.folder('se')?.folder('falthjalp')?.folder('app');
      javaFolder?.file('MainActivity.java', mainActivityJava);

      const resLayoutFolder = mainFolder?.folder('res')?.folder('layout');
      resLayoutFolder?.file('activity_main.xml', activityMainXml);

      const resValuesFolder = mainFolder?.folder('res')?.folder('values');
      resValuesFolder?.file(
        'strings.xml',
        `<resources>\n    <string name="app_name">FältKoll</string>\n</resources>`
      );
      resValuesFolder?.file(
        'colors.xml',
        `<resources>\n    <color name="primary">#FF6B00</color>\n    <color name="background">#121212</color>\n</resources>`
      );
      resValuesFolder?.file(
        'styles.xml',
        `<resources>\n    <style name="Theme.FaltKoll" parent="Theme.MaterialComponents.DayNight.NoActionBar">\n        <item name="android:statusBarColor">#121212</item>\n    </style>\n</resources>`
      );

      // Root build.gradle & settings.gradle
      zip.file(
        'build.gradle',
        `buildscript {\n    repositories {\n        google()\n        mavenCentral()\n    }\n    dependencies {\n        classpath 'com.android.tools.build:gradle:8.2.2'\n    }\n}`
      );
      zip.file('settings.gradle', `include ':app'\nrootProject.name = "FaltHjalp"`);

      // Trigger download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FaltHjalp_Android_APK_Projekt_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err: any) {
      alert('Kunde inte generera ZIP-filen: ' + err.message);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2c2c2c] pb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] text-white flex items-center justify-center border border-[#333333] cursor-pointer transition-colors shrink-0"
            title="Tillbaka till översikten"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400 bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-800/80">
                Android APK & QR-Delning
              </span>
              {isInstalled && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Installerad
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Dela & Installera på Mobilen (APK)
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallDirect}
          className="min-h-[52px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
        >
          <Smartphone className="w-5 h-5 stroke-[2.5]" />
          <span>Installera på mobilen</span>
        </button>
      </div>

      {/* METOD 1: Direktinstallation & Skanna QR-kod */}
      <div className="bg-[#1a1a1a] border-2 border-orange-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-orange-400">
              Metod 1 • Snabbast & Enklast (Skanna eller Klicka)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Skanna QR-kod eller installera direkt i mobilen
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Öppna kameran på din mobil och rikta den mot QR-koden nedan för att öppna och installera appen direkt på hemskärmen med full offline-funktion.
            </p>
          </div>

          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 items-center justify-center text-orange-400 shrink-0">
            <QrCode className="w-8 h-8 stroke-[2.2]" />
          </div>
        </div>

        {/* QR-KOD & DELNINGSKORT */}
        <div className="bg-[#141414] border-2 border-orange-500/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
          {qrCodeDataUrl ? (
            <div
              onClick={() => setIsQrModalOpen(true)}
              className="bg-white p-3 rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-transform shrink-0 text-center"
              title="Klicka för att förstora QR-koden"
            >
              <img src={qrCodeDataUrl} alt="Skanna för att öppna appen" className="w-36 h-36 mx-auto" />
              <span className="text-[10px] text-slate-800 font-bold block mt-1 flex items-center justify-center gap-1">
                <Maximize2 className="w-3 h-3 text-orange-600" /> Klicka för helskärm
              </span>
            </div>
          ) : (
            <div className="w-36 h-36 bg-[#222] rounded-2xl flex items-center justify-center animate-pulse">
              <QrCode className="w-10 h-10 text-orange-400" />
            </div>
          )}

          <div className="space-y-2.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <QrCode className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-black text-white">Skanna med mobilkameran</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Rikta din mobilkamera mot QR-koden för att öppna länken direkt. Visa upp den på skärmen i klassrummet eller byggboden så att alla elever får appen på 5 sekunder!
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2.5 bg-[#222] hover:bg-[#2c2c2c] text-orange-400 border border-orange-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Visa stor QR-kod</span>
              </button>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-4 py-2.5 bg-[#222] hover:bg-[#2c2c2c] text-white border border-[#444] rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Länk kopierad!' : 'Kopiera länk'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Enkla Steg för Eleven / Läraren */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#141414] border border-[#2c2c2c] rounded-2xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-black font-black flex items-center justify-center text-base">
              1
            </div>
            <h3 className="font-bold text-white text-base">Öppna i mobilen</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Skanna QR-koden ovan eller klistra in webbadressen i Google Chrome.
            </p>
          </div>

          <div className="bg-[#141414] border border-[#2c2c2c] rounded-2xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-black font-black flex items-center justify-center text-base">
              2
            </div>
            <h3 className="font-bold text-white text-base">Tryck på Menyn (⋮)</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Tryck på de tre prickarna <strong>⋮</strong> högst upp till höger i Chrome.
            </p>
          </div>

          <div className="bg-[#141414] border border-[#2c2c2c] rounded-2xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-black font-black flex items-center justify-center text-base">
              3
            </div>
            <h3 className="font-bold text-white text-base">"Installera app"</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Tryck <strong>"Installera app"</strong> eller <strong>"Lägg till på startskärmen"</strong>. Klart!
            </p>
          </div>
        </div>

        {/* Länk och Kopiera knapp */}
        <div className="bg-[#121212] border border-[#333333] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-400 block font-medium">Appens webblänk för mobilen:</span>
            <span className="font-mono text-xs sm:text-sm text-orange-400 font-bold truncate block">
              {currentUrl}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="w-full sm:w-auto min-h-[48px] px-5 bg-[#222222] hover:bg-[#2c2c2c] text-white border border-[#444444] rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
          >
            {copiedUrl ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Kopierad!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-orange-400" />
                <span>Kopiera länk</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* METOD 2: Endast för IT / Utvecklare (Hopvikt så vanliga användare inte laddar ner ZIP av misstag) */}
      <details className="bg-[#161616] border border-[#2a2a2a] rounded-3xl p-5 space-y-4 group">
        <summary className="font-bold text-slate-400 hover:text-white cursor-pointer list-none flex items-center justify-between select-none">
          <span className="text-xs uppercase tracking-wider flex items-center gap-2">
            <span>⚙️ För IT-avdelning / Utvecklare: Android Studio källkodsprojekt (.ZIP)</span>
          </span>
          <span className="text-xs text-orange-400 font-mono transition-transform group-open:rotate-180">
            [Visa avancerat]
          </span>
        </summary>

        <div className="pt-4 space-y-4 border-t border-[#262626]">
          <div className="p-3 bg-[#1e150f] border border-amber-500/40 rounded-xl text-xs text-slate-300">
            <strong className="text-amber-300 block mb-1">
              OBS: Vanliga användare ska INTE ladda ner denna ZIP-fil!
            </strong>
            En ZIP-fil kan inte köras på mobilen och kräver Android Studio på en dator. Använd istället <strong>Metod 1</strong> ovan för att installera appen direkt på hemskärmen.
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Innehåller AndroidManifest.xml, Gradle build-skript och Java-kod för att bygga en APK i Android Studio.
          </p>

          <button
            type="button"
            onClick={handleDownloadAndroidProjectZip}
            disabled={isGeneratingZip}
            className="w-full sm:w-auto min-h-[46px] px-6 bg-[#222] hover:bg-[#2c2c2c] text-white border border-[#444] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            <span>
              {isGeneratingZip ? 'Genererar källkod...' : 'Ladda ner källkodsprojekt (.ZIP för Android Studio)'}
            </span>
          </button>
        </div>
      </details>

      {/* Vanliga Frågor (FAQ) om APK för Skolan */}
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-orange-400" />
          <span>Vanliga frågor om mobilappen i undervisningen</span>
        </h3>

        <div className="space-y-3 text-sm text-slate-300">
          <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d] space-y-1">
            <h4 className="font-bold text-white text-base">Fungerar appen utan internet i schakten?</h4>
            <p className="text-slate-400 text-xs sm:text-sm">
              Ja! All data, ritade signaturer och foton sparas direkt i telefonens lokala lagring (IndexedDB). Du kan arbeta helt offline i gropen och synka när du får WiFi eller täckning igen.
            </p>
          </div>

          <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d] space-y-1">
            <h4 className="font-bold text-white text-base">Var hamnar fotona jag tar med mobilen?</h4>
            <p className="text-slate-400 text-xs sm:text-sm">
              Fotona sparas i appens fotopärm med automatisk tidsstämpel och AMA-märkning. Om du har aktiverat "Spara kopia i mobilens galleri" i inställningarna sparas bilderna även direkt i telefonens vanliga fotoalbum.
            </p>
          </div>
        </div>
      </div>

      {/* FULLSCREEN QR CODE MODAL FÖR HELA KLASSRUMMET */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#181818] border-2 border-orange-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-400" />
                <span>Skanna för att öppna appen</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#222] hover:bg-[#333] text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
              <img src={qrCodeDataUrl} alt="QR-kod" className="w-64 h-64 sm:w-72 sm:h-72 mx-auto" />
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Rikta mobilens vanliga kamera mot koden på skärmen för att ladda ner och installera.
            </p>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full min-h-[48px] bg-orange-500 hover:bg-orange-400 text-black font-black text-sm rounded-xl cursor-pointer"
            >
              Stäng QR-fönster
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
