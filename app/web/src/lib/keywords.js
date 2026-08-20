// Whitelist of burger/food vocabulary — only words in this list are ever
// surfaced as "frequent keywords", instead of any word that happens to
// repeat. Stored accent-stripped/lowercase to match the normalized text
// they're matched against.
export const FOOD_LEXICON = new Set([
  // pain / bread
  'pain', 'bun', 'buns', 'brioche', 'sesame', 'mie', 'croute', 'croustille', 'panure',
  // viande / protein
  'viande', 'steak', 'boeuf', 'poulet', 'chicken', 'bacon', 'jambon', 'poisson', 'saumon',
  'dinde', 'porc', 'veau', 'agneau', 'galette', 'burger', 'burgers', 'hamburger', 'cheeseburger',
  'oeuf', 'oeufs',
  // fromage
  'fromage', 'cheddar', 'mozzarella', 'emmental', 'chevre', 'comte', 'gruyere', 'raclette', 'creme', 'cremeux', 'cremeuse',
  // sauces / condiments
  'sauce', 'sauces', 'ketchup', 'mayonnaise', 'mayo', 'moutarde', 'barbecue', 'algerienne',
  'samourai', 'andalouse', 'vinaigrette', 'harissa', 'piquante', 'epicee',
  // legumes / crudites
  'salade', 'tomate', 'tomates', 'oignon', 'oignons', 'cornichon', 'cornichons', 'crudites',
  'laitue', 'roquette', 'avocat', 'poivron', 'champignon', 'champignons', 'concombre', 'carotte',
  // texture / gout
  'croustillant', 'croustillante', 'croquant', 'croquante', 'fondant', 'fondante', 'juteux', 'juteuse',
  'tendre', 'seche', 'sec', 'moelleux', 'moelleuse', 'epice', 'epices', 'sucre', 'sucree', 'sale', 'salee',
  'acide', 'amer', 'amere', 'fume', 'fumee', 'grille', 'grillee', 'gras', 'grasse', 'fade', 'relevee',
  'releve', 'onctueux', 'onctueuse', 'filandreux', 'caoutchouteux', 'gout', 'saveur', 'texture', 'odeur',
  // accompagnement
  'frites', 'patate', 'patates',
]);

export function extractKeywords(entries) {
  const counts = {};
  const commentsByWord = {};
  for (const { name, description } of entries) {
    if (!description) continue;
    const norm = description.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const words = new Set(norm.split(/[^a-z]+/).filter((w) => FOOD_LEXICON.has(w)));
    for (const w of words) {
      counts[w] = (counts[w] || 0) + 1;
      (commentsByWord[w] ??= []).push({ name, description });
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count, comments: commentsByWord[word] }));
}
