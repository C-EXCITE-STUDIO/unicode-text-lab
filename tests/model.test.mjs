import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../web/js/engine.js';
import {filterStyles,buildResults,toggleFavorite,encodeBackup,decodeBackup,loadState,saveState,measureText,DEFAULT_STATE} from '../web/js/model.js';
const data=JSON.parse(fs.readFileSync(new URL('../web/data/styles.json',import.meta.url),'utf8'));
const styles=data.styles, ids=styles.map(s=>s.id), engine=createEngine(styles);
test('語義分類能區分字體、圖案、括號、純符號及組合，不沿用外觀混合分類',()=>{
 for(const kind of ['font','frame','symbol','mark','preset']){
  const actual=filterStyles(styles,{group:kind});
  assert.equal(actual.length,styles.filter(s=>s.kind===kind).length);
  assert.ok(actual.every(s=>s.kind===kind));
 }
 assert.deepEqual(new Set(filterStyles(styles,{group:'art'}).map(s=>s.kind)),new Set(['ornament','separator']));
});


test('新版分類偏好能保存，舊備份分類遷移時仍保留收藏',()=>{
 for(const group of ['font','art','frame','mark','symbol','tool','preset'])
  assert.equal(decodeBackup(encodeBackup({...DEFAULT_STATE,group},ids),ids).group,group);
 for(const [oldGroup,newGroup] of [['alphabet','font'],['combining','mark'],['decoration','art']]){
  const restored=decodeBackup(JSON.stringify({app:'unicode-text-lab',version:1,preferences:{favorites:[ids[0]],group:oldGroup}}),ids);
  assert.equal(restored.group,newGroup);assert.deepEqual(restored.favorites,[ids[0]]);
 }
});
test('搜尋支援繁中、英文與全形英文字',()=>{
 assert.ok(filterStyles(styles,{query:'哥德'}).length>0);
 assert.ok(filterStyles(styles,{query:'ＧＯＴＨＩＣ'}).length>0);
 assert.ok(filterStyles(styles,{query:'手寫'}).length>0);
 assert.equal(filterStyles(styles,{query:'並不存在的字樣名稱'}).length,0);
});
test('分類與收藏條件可交集',()=>{
 const id=styles.find(s=>s.group==='alphabet').id;
 assert.deepEqual(filterStyles(styles,{group:'alphabet',onlyFavorites:true,favorites:[id]}).map(s=>s.id),[id]);
 assert.equal(filterStyles(styles,{group:'tool',onlyFavorites:true,favorites:[id]}).length,0);
});
test('相同輸出不能跨語義類型合併，避免字體與純符號混在同一卡片',()=>{
 const same=[{id:'font',kind:'font',steps:[{op:'map',table:{}}]},{id:'symbol',kind:'symbol',steps:[{op:'map',table:{}}]}];
 assert.equal(buildResults(same,createEngine(same),'探激',{dedupe:true}).length,2);
});
test('相同輸出可合併並保留原始識別碼',()=>{
 const equal=[{id:'a',steps:[{op:'map',table:{}}]},{id:'b',steps:[{op:'map',table:{}}]}];
 const rows=buildResults(equal,createEngine(equal),'Hi',{dedupe:true});
 assert.equal(rows.length,1); assert.deepEqual(rows[0].mergedIds,['a','b']);
 assert.equal(buildResults(equal,createEngine(equal),'Hi',{dedupe:false}).length,2);
});
test('空輸入不輸出任何可複製列',()=>assert.deepEqual(buildResults(styles,engine,''),[]));
test('收藏切換不重複且拒絕未知識別碼',()=>{
 const saved=toggleFavorite([],ids[0],ids);
 assert.deepEqual(saved,[ids[0]]); assert.deepEqual(toggleFavorite(saved,ids[0],ids),[]);
 assert.throws(()=>toggleFavorite([],'unknown',ids),/未知/);
});
test('備份往返只保留收藏與偏好，不儲存原文',()=>{
 const state={...DEFAULT_STATE,favorites:[ids[0]],theme:'dark',fontSize:36,text:'私人原文'};
 const text=encodeBackup(state,ids);
 assert.ok(!text.includes('私人原文'));
 const restored=decodeBackup(text,ids);
 assert.equal(restored.theme,'dark'); assert.deepEqual(restored.favorites,[ids[0]]);
});
test('備份拒絕畸形 JSON、錯誤版本與不合法資料',()=>{
 for(const input of ['not json','[]','{}',JSON.stringify({app:'unicode-text-lab',version:2,preferences:{}}),JSON.stringify({app:'unicode-text-lab',version:1,preferences:{favorites:'bad'}})])
   assert.throws(()=>decodeBackup(input,ids));
});
test('匯入會過濾不存在字樣，且不汙染 prototype',()=>{
 const text=JSON.stringify({app:'unicode-text-lab',version:1,preferences:{favorites:[ids[0],'unknown'],theme:'dark',__proto__:{polluted:true}}});
 const restored=decodeBackup(text,ids);
 assert.deepEqual(restored.favorites,[ids[0]]); assert.equal({}.polluted,undefined);
});
test('儲存失敗不冒充成功；損壞狀態可回復預設',()=>{
 const storage={getItem:()=>'{bad',setItem:()=>{throw new Error('quota')}};
 assert.ok(loadState(storage,ids).warning);
 assert.ok(saveState(storage,DEFAULT_STATE,ids).warning);
});
test('所有實際收錄樣式皆保留 emoji cluster',()=>{
 for(const s of styles){const output=engine.transform(s.id,'A 👨‍👩‍👧 👍🏽 🇹🇼 1️⃣ é 探激');
  for(const emoji of ['👨‍👩‍👧','👍🏽','🇹🇼','1️⃣']) assert.ok(output.includes(emoji),s.id+' / '+emoji);
 }
});
test('字數區分使用者感知字元、碼位與 UTF-8 位元組',()=>{
 const result=measureText('👍🏽'); assert.equal(result.graphemes,1); assert.equal(result.codePoints,2); assert.equal(result.bytes,8);
});
