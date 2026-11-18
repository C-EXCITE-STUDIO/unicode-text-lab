import {splitGraphemes} from './engine.js';
export const STORAGE_KEY = 'glyph-studio:v1';
export const DEFAULT_STATE = Object.freeze({favorites:Object.freeze([]),theme:'light',fontSize:30,group:'all',dedupe:true});
const GROUPS = new Set(['all','font','art','frame','mark','symbol','tool','preset']);
const LEGACY_GROUPS = new Map([['alphabet','font'],['combining','mark'],['decoration','art']]);
const normalized = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('en');

export function filterStyles(styles, {query='',group='all',onlyFavorites=false,favorites=[]} = {}) {
  const terms = normalized(query).trim().split(/\s+/).filter(Boolean);
  const saved = new Set(favorites);
  return styles.filter(style => {
    if(group!=='all'){const roles=group==='art'?['ornament','separator']:['font','frame','mark','symbol','preset','tool'].includes(group)?[group]:null;if(roles?!roles.includes(style.kind):style.group!==group)return false;}
    if (onlyFavorites && !saved.has(style.id)) return false;
    const searchable = normalized([style.id,style.label,style.labelZh,style.sourceName,...(style.searchTerms ?? []),...(style.aliases ?? []).map(alias=>alias.id)].join(' '));
    return terms.every(term=>searchable.includes(term));
  });
}
export function buildResults(styles,engine,text,{dedupe=false} = {}) {
  if (text === '') return [];
  const rows = [], seen = new Map();
  for (const style of styles) {
    const output = engine.transform(style.id,text);
    const fingerprint=(style.kind??'legacy')+'\u0000'+output;
    if (dedupe && seen.has(fingerprint)) { seen.get(fingerprint).mergedIds.push(style.id); continue; }
    const row = {style,text:output,mergedIds:[style.id]};
    rows.push(row); seen.set(fingerprint,row);
  }
  return rows;
}
export function toggleFavorite(favorites,id,knownIds) {
  if (!new Set(knownIds).has(id)) throw new RangeError('未知的收藏字樣。');
  const result = new Set(favorites);
  if (result.has(id)) result.delete(id); else result.add(id);
  return Array.from(result);
}
function cleanState(state,knownIds) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new TypeError('備份偏好資料格式不正確。');
  if (state.favorites !== undefined && (!Array.isArray(state.favorites) || state.favorites.length > 10000 || state.favorites.some(id=>typeof id !== 'string'))) throw new TypeError('收藏必須是字樣識別碼陣列。');
  const known = new Set(knownIds);
  return {
    favorites:[...new Set(state.favorites ?? [])].filter(id=>known.has(id)),
    theme:state.theme === 'dark' ? 'dark' : 'light',
    fontSize:Number.isFinite(state.fontSize) ? Math.max(20,Math.min(44,Math.round(state.fontSize))) : DEFAULT_STATE.fontSize,
    group:GROUPS.has(LEGACY_GROUPS.get(state.group)??state.group) ? (LEGACY_GROUPS.get(state.group)??state.group) : 'all',
    dedupe:typeof state.dedupe === 'boolean' ? state.dedupe : true,
  };
}
export function encodeBackup(state,knownIds) {
  return JSON.stringify({app:'unicode-text-lab',version:1,preferences:cleanState(state,knownIds)},null,2);
}
export function decodeBackup(text,knownIds) {
  if (typeof text !== 'string' || text.length > 262144) throw new RangeError('備份檔過大或格式不正確。');
  let data;
  try { data = JSON.parse(text); } catch { throw new TypeError('無法讀取 JSON，請選擇字樣工坊匯出的備份。'); }
  if (!data || Array.isArray(data) || data.app !== 'unicode-text-lab' || data.version !== 1) throw new TypeError('這不是相容的字樣工坊 v1 備份。');
  return cleanState(data.preferences,knownIds);
}
export function loadState(storage,knownIds) {
  try {
    const text = storage.getItem(STORAGE_KEY);
    return {state:text ? decodeBackup(text,knownIds) : cleanState(DEFAULT_STATE,knownIds),warning:null};
  } catch {
    return {state:cleanState(DEFAULT_STATE,knownIds),warning:'收藏或偏好無法讀取，已使用預設值；原始儲存資料未被刪除。'};
  }
}
export function saveState(storage,state,knownIds) {
  try { storage.setItem(STORAGE_KEY,encodeBackup(state,knownIds)); return {warning:null}; }
  catch { return {warning:'無法保存收藏與偏好；請使用匯出備份，或檢查瀏覽器儲存空間。'}; }
}
export function measureText(text) {
  return {graphemes:splitGraphemes(text).length,codePoints:Array.from(text).length,bytes:new TextEncoder().encode(text).length};
}
