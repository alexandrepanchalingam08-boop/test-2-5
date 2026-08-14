import { buildAdminRow } from './adminRows.js';
import { truthGroup2 } from './scoring.js';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(cells) {
  return cells.map(csvEscape).join(',');
}

function safeFilenamePart(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function exportSessionToCsv(session) {
  const rows = [];

  rows.push(csvRow(['Produit', session.productName]));
  rows.push(csvRow(['Date', session.day || new Date(session.createdAt).toLocaleDateString('fr-FR')]));
  rows.push(csvRow(['Lieu', session.place || session.storeName || '']));
  if (session.labelA) rows.push(csvRow(['Groupe A', session.labelA]));
  if (session.labelB) rows.push(csvRow(['Groupe B', session.labelB]));
  rows.push('');

  rows.push(csvRow([
    'Nom', 'Créneau', 'Codes (ordre attribué)',
    'Groupe de 2 (vérité)', 'Groupe de 3 (vérité)',
    'A répondu', 'Réponse — Bloc de 2', 'Réponse — Bloc de 3',
    'Résultat', 'Intensité (/100)', 'Description',
  ]));

  for (const participant of session.participants) {
    const row = buildAdminRow(participant);
    const truth2 = truthGroup2(participant);
    const truth3 = participant.codes.filter((c) => !truth2.includes(c));
    const codesWithLetters = participant.codes
      .map((c, i) => `${c}(${participant.truthOrder[i]})`)
      .join(' ');

    rows.push(csvRow([
      row.name,
      row.creneau,
      codesWithLetters,
      truth2.join(' + '),
      truth3.join(' + '),
      row.hasSubmission ? 'Oui' : 'Non',
      row.hasSubmission ? row.answerStr : '',
      row.hasSubmission ? row.bloc3Str : '',
      row.resultLabel,
      row.hasSubmission ? row.intensityStr.replace('/100', '') : '',
      row.hasSubmission ? row.description : '',
    ]));
  }

  const csvContent = '﻿' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${safeFilenamePart(session.productName) || 'session'}-${dateStr}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
