/** Splits into word+trailing-whitespace chunks so re-joining them reproduces the original text exactly — used to simulate token-by-token streaming of an already-complete string. */
export function tokenize(text: string): string[] {
  return text.match(/\S+\s*/g) ?? (text ? [text] : []);
}
