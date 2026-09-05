export type Clue = { id: string; question: string; answer: string; aliases: string[] };
export type Category = { id: string; name: string; clues: Clue[] };
export type Trivia = { title: string; categories: Category[] };
export function validateTrivia(input: unknown): Trivia {
  const object = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Expected a trivia object.');
    return v as Record<string, unknown>;
  };
  const str = (v: unknown, label: string, max: number) => {
    if (typeof v !== 'string' || !v.trim() || v.length > max) throw new Error(`${label} must contain 1–${max} characters.`);
    return v.trim();
  };
  const data = object(input);
  if (!Array.isArray(data.categories) || data.categories.length !== 6) throw new Error('A board needs exactly 6 categories.');
  const ids = new Set<string>();
  const id = (v: unknown) => { const s = str(v, 'ID', 80); if (ids.has(s)) throw new Error('Every category and clue needs a unique ID.'); ids.add(s); return s; };
  return { title: str(data.title, 'Board title', 80), categories: data.categories.map(raw => {
    const cat = object(raw);
    if (!Array.isArray(cat.clues) || cat.clues.length !== 5) throw new Error('Each category needs exactly 5 clues, ordered from $200 to $1,000.');
    return { id: id(cat.id), name: str(cat.name, 'Category name', 45), clues: cat.clues.map(rawClue => {
      const clue = object(rawClue);
      if (!Array.isArray(clue.aliases) || clue.aliases.length > 15) throw new Error('Accepted alternatives must be a list of up to 15 answers.');
      return { id: id(clue.id), question: str(clue.question, 'Clue', 600), answer: str(clue.answer, 'Answer', 120), aliases: clue.aliases.map(a=>str(a, 'Alternative answer', 120)) };
    }) };
  }) };
}
export function normalizeAnswer(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/^(?:what|who|where)\s+(?:is|are|was|were)\s+/, '')
    .replace(/^(?:a|an|the)\s+/, '').replace(/[^a-z0-9]/g, '');
}
export function isCorrect(value: string, clue: Clue) {
  const answer = normalizeAnswer(value);
  return !!answer && [clue.answer, ...clue.aliases].some(a=>normalizeAnswer(a) === answer);
}
