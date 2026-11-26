import type { FishSpecies } from '../domain/types';

export const HERO_FARM_IMAGE = '/src/assets/images/ikanara_farm_hero_1795156901735.jpg';

export const FISH_IMAGES: Record<FishSpecies, string> = {
  Lele: '/src/assets/images/fish_lele_1795156903105.jpg',
  Nila: '/src/assets/images/fish_nila_1795156903069.jpg',
  'Ikan emas': '/src/assets/images/fish_emas_1795156903825.jpg',
  Patin: '/src/assets/images/fish_patin_1795156903056.jpg',
};

export const FISH_SPECIES_NOTES: Record<FishSpecies, string> = {
  Lele: 'Clarias sp. · Pakan 3× sehari (07.00, 12.00, 16.00)',
  Nila: 'Oreochromis niloticus · Sirkulasi aerasi stabil',
  'Ikan emas': 'Cyprinus carpio · Kualitas air jernih mengalir',
  Patin: 'Pangasianodon · Pakan tenggelam protein seimbang',
};

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>): void {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
