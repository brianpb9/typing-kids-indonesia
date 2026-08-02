/**
 * A–Z letter warm-up bank (synthetic single-letter "words")
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/**
 * @param {'id'|'en'} [lang]
 * @returns {Array<{id:string,word:string,display:string,category:string,image:string,audio:null,letters:number,isLetter:true}>}
 */
export function buildLetterBank(lang = 'id') {
  return ALPHABET.map((ch) => ({
    id: `letter-${ch}`,
    word: ch,
    display: ch.toUpperCase(),
    category: 'huruf',
    image: '', // UI shows big letter tile only
    audio: null,
    letters: 1,
    isLetter: true,
  }));
}

/**
 * Spoken letter name for kids TTS
 * @param {string} ch
 * @param {'id'|'en'} lang
 */
export function letterSpeakName(ch, lang = 'id') {
  const c = String(ch || '').toLowerCase();
  if (lang === 'en') {
    // English letter names
    const en = {
      a: 'A',
      b: 'B',
      c: 'C',
      d: 'D',
      e: 'E',
      f: 'F',
      g: 'G',
      h: 'H',
      i: 'I',
      j: 'J',
      k: 'K',
      l: 'L',
      m: 'M',
      n: 'N',
      o: 'O',
      p: 'P',
      q: 'Q',
      r: 'R',
      s: 'S',
      t: 'T',
      u: 'U',
      v: 'V',
      w: 'W',
      x: 'X',
      y: 'Y',
      z: 'Z',
    };
    return en[c] || c.toUpperCase();
  }
  // Indonesian-style letter names (kid-friendly)
  const id = {
    a: 'a',
    b: 'be',
    c: 'ce',
    d: 'de',
    e: 'e',
    f: 'ef',
    g: 'ge',
    h: 'ha',
    i: 'i',
    j: 'je',
    k: 'ka',
    l: 'el',
    m: 'em',
    n: 'en',
    o: 'o',
    p: 'pe',
    q: 'ki',
    r: 'er',
    s: 'es',
    t: 'te',
    u: 'u',
    v: 've',
    w: 'we',
    x: 'eks',
    y: 'ye',
    z: 'zet',
  };
  return id[c] || c;
}

/**
 * Words containing "harder" letters for kids (f,v,q,w,x,z,y) or long words
 * @param {Array<{word:string,letters:number}>} words
 */
export function filterHardLetterWords(words) {
  return words.filter(
    (w) => /[fqvwxyz]/i.test(w.word) || (w.letters || w.word.length) >= 7
  );
}

export default { buildLetterBank, letterSpeakName, filterHardLetterWords, ALPHABET };
