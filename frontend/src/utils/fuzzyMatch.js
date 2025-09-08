// Lightweight fuzzy matching helpers for IDs and short strings

const onlyDigits = (value = '') => (value || '').replace(/\D+/g, '');
const onlyAlphanumUpper = (value = '') => (value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');

// Levenshtein distance
const levenshtein = (a = '', b = '') => {
  const s = a;
  const t = b;
  const n = s.length;
  const m = t.length;
  if (n === 0) return m;
  if (m === 0) return n;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    const si = s.charAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const tj = t.charAt(j - 1);
      const cost = si === tj ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[n][m];
};

// Normalized similarity score: 1 - (distance / maxLen)
const similarity = (a = '', b = '') => {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
};

// Match 12-digit Aadhaar numbers with small tolerance (OCR mistakes)
export const matchAadhaar = (input = '', extracted = '', { minScore = 0.92 } = {}) => {
  const ai = onlyDigits(input);
  const ae = onlyDigits(extracted);
  if (!ai || !ae) return { isMatch: false, score: 0, normalizedInput: ai, normalizedExtracted: ae };
  const score = similarity(ai, ae);
  return { isMatch: score >= minScore, score, normalizedInput: ai, normalizedExtracted: ae };
};

// Match RC numbers (alphanumeric, uppercase)
export const matchRcNumber = (input = '', extracted = '', { minScore = 0.9 } = {}) => {
  const ni = onlyAlphanumUpper(input);
  const ne = onlyAlphanumUpper(extracted);
  if (!ni || !ne) return { isMatch: false, score: 0, normalizedInput: ni, normalizedExtracted: ne };
  const score = similarity(ni, ne);
  return { isMatch: score >= minScore, score, normalizedInput: ni, normalizedExtracted: ne };
};

// Match license numbers (alphanumeric, uppercase)
export const matchLicenseNumber = (input = '', extracted = '', { minScore = 0.9 } = {}) => {
  const ni = onlyAlphanumUpper(input);
  const ne = onlyAlphanumUpper(extracted);
  if (!ni || !ne) return { isMatch: false, score: 0, normalizedInput: ni, normalizedExtracted: ne };
  const score = similarity(ni, ne);
  return { isMatch: score >= minScore, score, normalizedInput: ni, normalizedExtracted: ne };
};

export const fuzzyMatchSummary = ({ label, input, extracted, matchResult }) => {
  if (!input || !extracted) return '';
  if (matchResult?.isMatch) return '';
  return `${label} mismatch. Entered: ${input} • Extracted: ${extracted}`;
};

export default {
  matchAadhaar,
  matchRcNumber,
  matchLicenseNumber,
  fuzzyMatchSummary,
};


