// 明確的轉換步驟；來源資料與程式授權保留在 licenses/。
const LETTER = /^[A-Za-z]$/;
const own = (table, key) => Object.prototype.hasOwnProperty.call(table, key);
function lookup(step, char) {
  const mode = step.lookup ?? 'exact';
  if (mode === 'lower') return own(step.table, char.toLowerCase()) ? step.table[char.toLowerCase()] : char;
  if (own(step.table, char)) return step.table[char];
  return mode === 'exact_then_lower' && own(step.table, char.toLowerCase()) ? step.table[char.toLowerCase()] : char;
}
function caseTransform(text, mode) {
  const words = value => value.split(/[\s_-]+/).filter(Boolean);
  switch (mode) {
    case 'title': return text.split(/(\s+)/).map(word => /^\s+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
    case 'camel': return words(text.toLowerCase()).map((word, i) => i ? word.charAt(0).toUpperCase() + word.slice(1) : word).join('');
    case 'snake': return words(text.toLowerCase()).join('_');
    case 'kebab': return words(text.toLowerCase()).join('-');
    case 'constant': return words(text.toUpperCase()).join('_');
    case 'alternating': {
      let index = 0;
      return Array.from(text, char => LETTER.test(char) ? (index++ % 2 ? char.toUpperCase() : char.toLowerCase()) : char).join('');
    }
    case 'inverse': return Array.from(text, char => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join('');
    default: throw new RangeError(`未知大小寫模式：${mode}`);
  }
}
function romanDigits(run, lower) {
  let number = Number.parseInt(run, 10);
  if (!(number > 0 && number <= 3999)) return String(number);
  const values = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let result = '';
  for (const [value, glyph] of values) while (number >= value) { result += glyph; number -= value; }
  return lower ? result.toLowerCase() : result;
}
function applyStep(step, text) {
  switch (step.op) {
    case 'lower': return text.toLowerCase();
    case 'upper': return text.toUpperCase();
    case 'case': return caseTransform(text, step.mode);
    case 'reverse': return Array.from(text).reverse().join('');
    case 'wrap': return step.prefix + text + step.suffix;
    case 'join': return Array.from(text).join(step.separator);
    case 'append': return Array.from(text, char => step.only === 'all' || LETTER.test(char) ? char + step.marks : char).join('');
    case 'roman': return text.replace(/[0-9]+/g, run => romanDigits(run, step.case === 'lower'));
    case 'number_runs': return (text.match(/[0-9]+|[^0-9]+/g) ?? []).map(run => /^[0-9]+$/.test(run) && own(step.whole, run) ? step.whole[run] : Array.from(run, char => own(step.table, char) ? step.table[char] : char).join('')).join('');
    case 'map': {
      const chars = Array.from(text), pieces = [];
      for (let index = 0; index < chars.length; index++) {
        const digraph = chars[index].toLowerCase() + (chars[index + 1] ?? '').toLowerCase();
        if (step.digraphs && index + 1 < chars.length && own(step.digraphs, digraph)) {
          pieces.push(step.digraphs[digraph]); index++;
        } else pieces.push(lookup(step, chars[index]));
      }
      return pieces.join(step.join ?? '');
    }
    case 'zalgo': {
      let seed = 0x9e3779b9;
      return Array.from(text, char => {
        if (!LETTER.test(char)) return char;
        let result = char;
        for (const name of ['up','mid','down']) {
          const pool = step.pools[name];
          for (let index = 0; index < step[name]; index++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            result += pool[seed % pool.length];
          }
        }
        return result;
      }).join('');
    }
    default: throw new RangeError(`未知轉換步驟：${step.op}`);
  }
}
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-Hant', {granularity:'grapheme'}) : null;
export function splitGraphemes(text) {
  if (!segmenter) throw new Error('此瀏覽器不支援安全的字元分割，請使用新版 Chrome 或 Edge。');
  return Array.from(segmenter.segment(String(text ?? '')), part => part.segment);
}
const protectedEmoji = cluster => /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(cluster);
// 數字正規表示式會錯把 1️⃣ 的首碼位當成獨立數字；先按 cluster 辨認數字段。
function safeNumberRuns(text, convert, other = cluster => cluster) {
  const clusters = splitGraphemes(text), output = [];
  for (let index = 0; index < clusters.length; index++) {
    if (/^[0-9]$/.test(clusters[index])) {
      let run = clusters[index];
      while (index + 1 < clusters.length && /^[0-9]$/.test(clusters[index + 1])) run += clusters[++index];
      output.push(convert(run));
    } else output.push(protectedEmoji(clusters[index]) ? clusters[index] : other(clusters[index]));
  }
  return output.join('');
}
function safeStep(step, text) {
  switch (step.op) {
    case 'reverse': return splitGraphemes(text).reverse().join('');
    case 'join': return splitGraphemes(text).join(step.separator);
    case 'append': return splitGraphemes(text).map(cluster => {
      if (/^\s+$/u.test(cluster) || protectedEmoji(cluster)) return cluster;
      return step.only === 'all' || /^[A-Za-z]/.test(cluster) ? cluster + Array.from(step.marks).slice(0,12).join('') : cluster;
    }).join('');
    case 'map': {
      const chunks = splitGraphemes(text), pieces = [];
      for (let index = 0; index < chunks.length; index++) {
        const cluster = chunks[index];
        if (protectedEmoji(cluster)) { pieces.push(cluster); continue; }
        const next = chunks[index + 1] ?? '';
        const digraph = cluster.toLowerCase() + next.toLowerCase();
        if (step.digraphs && cluster.length === 1 && next.length === 1 && own(step.digraphs,digraph)) {
          pieces.push(step.digraphs[digraph]); index++;
        } else pieces.push(Array.from(cluster, char => lookup(step,char)).join(''));
      }
      return pieces.join(step.join ?? '');
    }
    case 'zalgo': {
      let seed = 0x9e3779b9;
      return splitGraphemes(text).map(cluster => {
        if (!/^[A-Za-z]/.test(cluster) || protectedEmoji(cluster)) return cluster;
        let output = cluster, inserted = 0;
        for (const name of ['up','mid','down']) {
          const pool = step.pools[name];
          for (let index = 0; index < step[name] && inserted < 12; index++, inserted++) {
            seed = (Math.imul(seed,1664525)+1013904223) >>> 0;
            output += pool[seed % pool.length];
          }
        }
        return output;
      }).join('');
    }
    case 'number_runs': {
      const mapped = value => Array.from(value, char => own(step.table,char) ? step.table[char] : char).join('');
      return safeNumberRuns(text, run => own(step.whole,run) ? step.whole[run] : mapped(run), mapped);
    }
    case 'roman': return safeNumberRuns(text, run => {
      const number = BigInt(run);
      return number < 1n || number > 3999n ? run : romanDigits(run,step.case === 'lower');
    });
    default: return applyStep(step,text);
  }
}
export function createEngine(styles) {
  if (!Array.isArray(styles)) throw new TypeError('字樣資料必須是陣列。');
  const registry = new Map();
  for (const style of styles) {
    if (!style.id || !Array.isArray(style.steps)) throw new TypeError('字樣定義缺少識別碼或轉換步驟。');
    if (registry.has(style.id)) throw new RangeError(`重複的字樣識別碼：${style.id}`);
    registry.set(style.id,style);
  }
  return {
    transform(id, text, {safe = true} = {}) {
      const style = registry.get(id);
      if (!style) throw new RangeError(`未知字樣：${id}`);
      let result = String(text ?? '');
      if (result.length > 4000) throw new RangeError('輸入過長：上限為 4000 個文字單位。');
      if (safe && result === '') return '';
      for (const step of style.steps) {
        result = safe ? safeStep(step,result) : applyStep(step,result);
        if (result.length > 100000) throw new RangeError('轉換結果過長，請縮短輸入。');
      }
      return result;
    },
  };
}
