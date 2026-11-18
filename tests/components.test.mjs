import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../web/js/engine.js';
import {createComposer} from '../web/js/composition.js';
import {buildKeyMap} from '../web/js/keymap.js';
const data=JSON.parse(fs.readFileSync(new URL('../web/data/styles.json',import.meta.url),'utf8'));
const original=JSON.parse(fs.readFileSync(new URL('../sources/candidate-style-manifest.json',import.meta.url),'utf8'));
const kinds=['font','symbol','ornament','frame','separator','mark','tool','preset'];
const styles=data.styles;
test('全部166項皆有唯一語義分類，原始步驟與來源識別碼完全保留',()=>{
 assert.equal(styles.length,166);assert.equal(data.categories.reduce((n,g)=>n+g.count,0),166);
 assert.deepEqual(new Set(styles.map(s=>s.id)),new Set(original.styles.map(s=>s.id)));
 for(const s of styles){
  assert.ok(kinds.includes(s.kind),s.id);
  assert.equal(s.slot,s.kind==='preset'?null:['font','symbol','tool'].includes(s.kind)?'base':s.kind);
  const raw=original.styles.find(r=>r.id===s.id).definition;
  assert.deepEqual(s.steps,Array.isArray(raw)?raw:[{op:'map',table:raw}],s.id);
 }
});
test('每個基底與每個合法元件逐對驗證，純符號與每個裝飾逐對拒絕',t=>{
 const engine=createEngine(styles),composer=createComposer(styles,engine);
 const bases=[null,...styles.filter(s=>['font','tool'].includes(s.kind)).map(s=>s.id)];
 const layers=styles.filter(s=>['ornament','frame','separator','mark'].includes(s.kind));
 let accepted=0,rejected=0;
 const input='Ab 10 👨‍👩‍👧 👍🏽 🇹🇼 1️⃣ é 探激';
 for(const baseId of bases)for(const layer of layers){
  const output=composer.compose({baseId,[layer.slot+'Id']:layer.id},input);
  for(const emoji of ['👨‍👩‍👧','👍🏽','🇹🇼','1️⃣'])assert.ok(output.includes(emoji),baseId+' / '+layer.id+' / '+emoji);
  assert.equal(composer.compose({baseId,[layer.slot+'Id']:layer.id},''),'');accepted++;
 }
 for(const symbol of styles.filter(s=>s.kind==='symbol'))for(const layer of layers){
  assert.throws(()=>composer.compose({baseId:symbol.id,[layer.slot+'Id']:layer.id},input),/純符號/);rejected++;
 }
 t.diagnostic(JSON.stringify({accepted_pairs:accepted,rejected_symbol_pairs:rejected}));
});
test('全部組合預設可拆解並合成，不會載入空配方丟失效果',()=>{
 const engine=createEngine(styles),composer=createComposer(styles,engine);
 for(const preset of styles.filter(s=>s.kind==='preset')){
  const recipe=composer.recipeFromStyle(preset.id);
  assert.ok(Object.values(recipe).some(Boolean),preset.id);
  assert.equal(composer.compose(recipe,'Abc'),engine.transform(preset.id,'Abc'),preset.id);
 }
 assert.equal(composer.compose({baseId:'fontvibe:math_bold',frameId:'waterr:Box Lines'},'Ab'),'[̲̅𝐀][̲̅𝐛]');
});
test('所有純符號鍵位表的每一鍵都與實際引擎一致，來源鍵位不遺漏',t=>{
 const engine=createEngine(styles);let entries=0;
 for(const style of styles.filter(s=>s.kind==='symbol')){
  const result=buildKeyMap(style,engine),seen=new Set();
  for(const row of result.rows)for(const key of row.keys){assert.equal(engine.transform(style.id,key),row.glyph);seen.add(key);entries++;}
  for(const step of style.steps)for(const key of Object.keys(step.table??{}))assert.ok(seen.has(key),style.id+' / '+key);
 }
 t.diagnostic(JSON.stringify({verified_symbol_input_pairs:entries}));
});
