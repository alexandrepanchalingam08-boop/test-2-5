export const STOPWORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'que', 'qui', 'quoi', 'est', 'dans', 'pour',
  'avec', 'plus', 'moins', 'tres', 'peu', 'pas', 'ne', 'on', 'il', 'elle', 'ils', 'elles', 'ce', 'cette', 'ces',
  'cet', 'au', 'aux', 'a', 'en', 'se', 'sa', 'son', 'ses', 'leur', 'leurs', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'notre', 'nos', 'votre', 'vos', 'd', 'l', 'j', 'y', 'n', 's', 't', 'c', 'qu', 'ete', 'etais', 'etait', 'etre',
  'avoir', 'nous', 'vous', 'je', 'tu', 'mais', 'donc', 'or', 'ni', 'car', 'si', 'comme', 'sans', 'sous', 'sur',
  'entre', 'vers', 'chez', 'par', 'trop', 'bien', 'fait', 'faire', 'cela', 'ca', 'tout', 'toute', 'tous', 'toutes',
  'autre', 'autres', 'meme', 'aussi', 'encore', 'deja', 'ici', 'on', 'ont', 'avons', 'avez', 'ai', 'as',
]);

export function extractKeywords(descriptions) {
  const counts = {};
  for (const desc of descriptions) {
    if (!desc) continue;
    const norm = desc.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const words = norm.split(/[^a-z]+/).filter((w) => w.length >= 4 && !STOPWORDS.has(w));
    for (const w of words) counts[w] = (counts[w] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, c]) => c >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
}
