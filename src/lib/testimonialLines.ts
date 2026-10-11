/**
 * Short lines lifted word for word from a published account, for the "Voices in motion" rows.
 * Each sentence becomes one line; a long sentence keeps its strongest clause (or its ending) and
 * marks the cut with an ellipsis, so nothing is reworded and nothing is invented.
 */
const MAX_LINE = 80;
const TAIL = 64;
const LEAD = /^(and|but|so|because|which|who|that)\s+/i;

function clip(sentence: string): string {
  if (sentence.length <= MAX_LINE) return sentence;
  const clauses = sentence.split(/,\s+/);
  if (clauses.length > 1) {
    let best = '';
    clauses.forEach((clause, index) => {
      const text = index > 0 ? clause.replace(LEAD, '') : clause;
      if (text.length >= 24 && text.length <= MAX_LINE && text.length > best.replace(/…/g, '').length) {
        best = (index > 0 ? '…' : '') + text + (index < clauses.length - 1 ? '…' : '');
      }
    });
    if (best) return best;
  }
  // No usable clause: keep the sentence's ending, which carries its point.
  const words = sentence.split(' ');
  let tail = words.pop() ?? '';
  while (words.length && (words[words.length - 1] + ' ' + tail).length <= TAIL) tail = words.pop() + ' ' + tail;
  return '…' + tail.replace(LEAD, '');
}

export function pullLines(quote: string, max = 3): string[] {
  const text = tidy(quote);
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 16)
    .slice(0, max)
    .map((sentence) => `“${clip(sentence)}”`);
}

/** Tidies what the CMS sometimes carries ("Chicago , Illinois", doubled spaces, straight apostrophes). */
export function tidy(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/(\w)'(\w)/g, '$1’$2').trim();
}

/** Names, titles and places: a run of spaces between words stands for a missing comma. */
export function tidyLabel(value: string): string {
  return tidy(value.replace(/(\S)\s{2,}(?=\S)/g, '$1, '));
}

export type VoiceLine = { key: string; person: number; text: string };

/**
 * Splits everyone's lines across two rows, round by round (first lines in the top row, second
 * lines in the bottom row, and so on), so neighbouring lines come from different people.
 */
export function voiceRows(quotes: string[]): [VoiceLine[], VoiceLine[]] {
  const perPerson = quotes.map((quote) => pullLines(quote));
  const rows: [VoiceLine[], VoiceLine[]] = [[], []];
  const rounds = Math.max(0, ...perPerson.map((lines) => lines.length));
  for (let round = 0; round < rounds; round++) {
    perPerson.forEach((lines, person) => {
      if (lines[round]) rows[round % 2].push({ key: `${person}-${round}`, person, text: lines[round] });
    });
  }
  // A single short account still fills both rows.
  if (!rows[1].length) rows[1] = rows[0].slice().reverse();
  return rows;
}
