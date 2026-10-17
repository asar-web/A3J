export function generateBarcodeBars(code: string): number[] {
  const hash = code.split('').reduce((acc, char, idx) => {
    return acc + char.charCodeAt(0) * (idx + 1);
  }, 0);
  const bars: number[] = [2, 1, 2, 1]; // start pattern
  for (let i = 0; i < code.length; i++) {
    const val = (code.charCodeAt(i) + hash + i * 7) % 16;
    const w1 = (val % 3) + 1;
    const w2 = ((val >> 1) % 3) + 1;
    const w3 = ((val >> 2) % 3) + 1;
    const w4 = ((val >> 3) % 2) + 1;
    bars.push(w1, w2, w3, w4);
  }
  bars.push(2, 1, 2, 2); // stop pattern
  return bars;
}

export function isValidBarcode(input: string): boolean {
  if (!input || input.trim().length < 4) return false;
  return /^[a-zA-Z0-9\-_]{4,32}$/.test(input.trim());
}
