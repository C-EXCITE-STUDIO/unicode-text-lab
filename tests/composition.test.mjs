import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../web/js/engine.js';
import {createComposer} from '../web/js/composition.js';
const styles=[
 {id:'font',kind:'font',slot:'base',steps:[{op:'map',table:{A:'𝐀',b:'𝐛',c:'𝐜','1':'𝟏'}}]},
 {id:'frame',kind:'frame',slot:'frame',component:{op:'wrap',prefix:'【',suffix:'】'},steps:[{op:'wrap',prefix:'【',suffix:'】'}]},
 {id:'symbol',kind:'symbol',slot:'base',steps:[{op:'map',table:{A:'✌',b:'☞'}}]},
 {id:'ornament',kind:'ornament',slot:'ornament',component:{op:'wrap',prefix:'🔥 ',suffix:' 🔥'},steps:[{op:'wrap',prefix:'🔥 ',suffix:' 🔥'}]},
 {id:'separator',kind:'separator',slot:'separator',component:{op:'join',separator:'🌸'},steps:[{op:'join',separator:'🌸'}]},
 {id:'mark',kind:'mark',slot:'mark',component:{op:'append',marks:'̲',only:'all'},steps:[{op:'append',marks:'̲',only:'all'}]},
];
const composer=createComposer(styles,createEngine(styles));
test('基底字體與括號是獨立選項，從原文合成',()=>{
 assert.equal(composer.compose({baseId:'font',frameId:'frame'},'Ab'),'【𝐀𝐛】');
});
test('純符號可獨立轉換，但任一裝飾層都由引擎拒絕',()=>{
 assert.equal(composer.compose({baseId:'symbol'},'Ab'),'✌☞');
 for(const [key,id] of [['frameId','frame'],['ornamentId','ornament'],['separatorId','separator'],['markId','mark']])
  assert.throws(()=>composer.compose({baseId:'symbol',[key]:id},'Ab'),/純符號/);
});
test('選入純符號會清空全部裝飾，且不能反向加入裝飾',()=>{
 const r=composer.recipeFromStyle('symbol',{baseId:'font',ornamentId:'ornament',frameId:'frame',separatorId:'separator',markId:'mark'});
 assert.deepEqual(r,{baseId:'symbol',ornamentId:null,frameId:null,separatorId:null,markId:null});
 assert.throws(()=>composer.recipeFromStyle('frame',r),/純符號/);
});
test('字體、標記、字間圖案、括號與外層表情可一起合成，空白與emoji保留',()=>{
 const recipe={baseId:'font',markId:'mark',separatorId:'separator',frameId:'frame',ornamentId:'ornament'};
 assert.equal(composer.compose(recipe,'Ab c 👨‍👩‍👧'),'🔥 【𝐀̲🌸𝐛̲ 𝐜̲ 👨‍👩‍👧】 🔥');
 assert.equal(composer.compose(recipe,''),'');
});
test('配方拒絕錯誤類型、未知欄位、錯誤slot與未知ID',()=>{
 for(const recipe of [null,[],{baseId:'frame'},{frameId:'font'},{markId:'frame'},{ornamentId:'separator'},{separatorId:'mark'},{unknownId:'font'},{baseId:4},{baseId:'unknown'}])
  assert.throws(()=>composer.validate(recipe));
});
test('故障標記可疊在Unicode粗體字母上，每個cluster最多新增12個並保護emoji',()=>{
 const c={op:'zalgo',up:20,mid:20,down:20,pools:{up:['́'],mid:['̶'],down:['̲']},only:'letters'};
 const all=[...styles,{id:'glitch',kind:'mark',slot:'mark',component:c,steps:[c]}];
 const comp=createComposer(all,createEngine(all));
 const input='A👍🏽🇹🇼1️⃣';
 const output=comp.compose({baseId:'font',markId:'glitch'},input);
 assert.equal((output.match(/\p{M}/gu)??[]).length,12+(input.match(/\p{M}/gu)??[]).length); // 原有emoji標記另外保留
 assert.ok(output.startsWith('𝐀'));assert.ok(output.endsWith('👍🏽🇹🇼1️⃣'));
});
test('錯誤元件操作與資料不能靜默當作成功',()=>{
 for(const component of [{op:'oops'},{op:'wrap',prefix:1,suffix:']'},{op:'char_wrap',prefix:'[',suffix:']',only:'bad'}]){
  const all=[...styles,{id:'bad',kind:'frame',slot:'frame',component,steps:[{op:'map',table:{}}]}];
  assert.throws(()=>createComposer(all,createEngine(all)).compose({frameId:'bad'},'A'));
 }
});
test('逐字框、字間裝飾不互相拆開，輸入與輸出上限明確報錯',()=>{
 const frame={id:'character',kind:'frame',slot:'frame',component:{op:'char_wrap',prefix:'[',suffix:']',only:'alnum'},steps:[{op:'map',table:{}}]};
 const all=[...styles,frame],comp=createComposer(all,createEngine(all));
 assert.equal(comp.compose({baseId:'font',frameId:'character',separatorId:'separator'},'Ab 👍🏽'),'[𝐀]🌸[𝐛] 👍🏽');
 assert.throws(()=>comp.compose({},'a'.repeat(4001)),/過長/);
 const huge={id:'huge',kind:'ornament',slot:'ornament',component:{op:'wrap',prefix:'x'.repeat(100001),suffix:''},steps:[{op:'map',table:{}}]};
 const bigger=[...all,huge];assert.throws(()=>createComposer(bigger,createEngine(bigger)).compose({ornamentId:'huge'},'A'),/過長/);
});
