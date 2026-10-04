import JSZip from 'jszip';
import { Project, MomentPhoto } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';

export const PHOTO_CATEGORIES = [
  { id: 'Schakt', label: 'Schakt & Terrass', path: 'appen/jobb/Schakt', icon: '🚜' },
  { id: 'VA', label: 'VA & Avlopp', path: 'appen/jobb/VA', icon: '💧' },
  { id: 'Grund', label: 'Grund & Betong', path: 'appen/jobb/Grund', icon: '🏗️' },
  { id: 'Kontrollbevis', label: 'Kontrollbevis & Mätning', path: 'appen/jobb/Kontrollbevis', icon: '📐' },
  { id: 'Avvikelser', label: 'Avvikelser & Hinder', path: 'appen/jobb/Avvikelser', icon: '⚠️' },
];

export function getDefaultCategoryForMoment(momentId: string, phaseName?: string): string {
  const m = ALL_MOMENTS.find((x) => x.id === momentId);
  const text = `${m?.title || ''} ${phaseName || ''} ${m?.amaCode || ''}`.toLowerCase();

  if (text.includes('avlopp') || text.includes('rör') || text.includes('dränering') || text.includes('dagvatten') || text.includes('va')) {
    return 'VA';
  }
  if (text.includes('schakt') || text.includes('terrass') || text.includes('avtäck') || text.includes('geotextil') || text.includes('fiberduk')) {
    return 'Schakt';
  }
  if (text.includes('laser') || text.includes('rulltest') || text.includes('kontroll') || text.includes('fall') || text.includes('provtryck')) {
    return 'Kontrollbevis';
  }
  if (text.includes('avvikelse') || text.includes('hinder') || text.includes('berg')) {
    return 'Avvikelser';
  }
  return 'Grund';
}

export function downloadPhotoDirect(dataUrl: string, filename: string) {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('Kunde inte ladda ner bild direkt:', e);
  }
}

export async function exportProjectPhotosZip(project: Project): Promise<void> {
  const zip = new JSZip();
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
  const projFolder = zip.folder(sanitize(project.name || 'Projekt'));

  // Group all photos from all moments
  let totalPhotos = 0;
  const indexLines: string[] = [
    `FOTOFÖRTECKNING & EGENKONTROLL`,
    `Projekt: ${project.name}`,
    `Fastighet: ${project.propertyDesignation}`,
    `Byggherre: ${project.clientName}`,
    `Entreprenör: ${project.contractorName}`,
    `Skapad: ${project.createdAt}`,
    `=========================================\n`,
  ];

  for (const [momentId, record] of Object.entries(project.moments)) {
    const momentDef = ALL_MOMENTS.find((m) => m.id === momentId);
    const photos: MomentPhoto[] = [];

    if (record.photos && record.photos.length > 0) {
      photos.push(...record.photos);
    } else if (record.photoBase64) {
      photos.push({
        id: 'legacy_1',
        dataUrl: record.photoBase64,
        capturedAt: record.completedAt || '',
        category: getDefaultCategoryForMoment(momentId, momentDef?.phaseName),
        caption: record.comment,
      });
    }

    if (photos.length > 0) {
      indexLines.push(`Moment ${momentId}: ${momentDef?.title || ''}`);
      indexLines.push(`Status: ${record.status} | Signatur: ${record.signature || 'Ej signerat'}`);
      indexLines.push(`Notering: "${record.comment || 'Ingen'}"`);

      photos.forEach((photo, idx) => {
        totalPhotos++;
        const category = photo.category || getDefaultCategoryForMoment(momentId, momentDef?.phaseName);
        const folder = projFolder?.folder(category) || zip;

        const base64Data = photo.dataUrl.split(',')[1] || photo.dataUrl;
        const timeClean = (photo.capturedAt || 'okand_tid').replace(/[^0-9]/g, '_');
        const fileName = `Moment_${momentId}_Foto_${idx + 1}_${timeClean}.jpg`;

        folder.file(fileName, base64Data, { base64: true });
        indexLines.push(`  -> [${category}] ${fileName}${photo.caption ? ` ("${photo.caption}")` : ''}`);
      });
      indexLines.push('');
    }
  }

  if (totalPhotos === 0) {
    alert('Det finns inga foton sparade i detta projekt att exportera än.');
    return;
  }

  projFolder?.file('Fotoförteckning.txt', indexLines.join('\n'));

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${sanitize(project.name)}_Foton_Underkategorier.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
