import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../web/js/engine.js';
import {buildKeyMap,filterKeyMap} from '../web/js/keymap.js';
const style={id:'symbols',kind:'symbol',steps:[{op:'map',table:{A:'✌',a:'★',B:'☃',b:'☃','1':'🔥','!':'⚡'}}]};
const engine=createEngine([style]);
test('鍵位表由實際轉換生成，分大小寫、合併同圖多鍵並包含數字標點',()=>{
 const result=buildKeyMap(style,engine);
 assert.deepEqual(result.rows.find(r=>r.glyph==='✌').keys,['A']);
 assert.deepEqual(result.rows.find(r=>r.glyph==='★').keys,['a']);
 assert.deepEqual(result.rows.find(r=>r.glyph==='☃').keys,['B','b']);
 assert.ok(result.rows.find(r=>r.keys.includes('1')).glyph==='🔥');
 assert.ok(result.rows.find(r=>r.keys.includes('!')).glyph==='⚡');
 assert.equal(result.mappedInputs,6);assert.equal(result.rows.length,5);
 assert.ok(!result.rows.some(r=>r.keys.includes('Q')));
});
test('宣告的多字鍵與原樣映射也要列出，不遺漏來源表格',()=>{
 const s={id:'more',steps:[{op:'map',table:{Q:'Q'},digraphs:{th:'ᚦ'}}]};
 const r=buildKeyMap(s,createEngine([s]));
 assert.ok(r.rows.find(row=>row.glyph==='ᚦ').keys.includes('th'));
 assert.ok(r.rows.find(row=>row.glyph==='Q').keys.includes('Q'));
 const n={id:'numbers',steps:[{op:'number_runs',table:{'1':'①','0':'⓪'},whole:{'10':'⑩'}}]};
 assert.ok(buildKeyMap(n,createEngine([n])).rows.find(row=>row.glyph==='⑩').keys.includes('10'));
});
test('搜尋鍵位區分大小寫，圖案及Unicode碼位也可精確找',()=>{
 const rows=buildKeyMap(style,engine).rows;
 assert.deepEqual(filterKeyMap(rows,'A').map(r=>r.glyph),['✌']);
 assert.deepEqual(filterKeyMap(rows,'a').map(r=>r.glyph),['★']);
 assert.deepEqual(filterKeyMap(rows,'🔥').map(r=>r.keys),[['1']]);
 assert.deepEqual(filterKeyMap(rows,'u+270c').map(r=>r.glyph),['✌']);
 assert.deepEqual(filterKeyMap(rows,'不存在'),[]);
 assert.equal(filterKeyMap(rows,'').length,rows.length);
 assert.throws(()=>buildKeyMap({id:'unknown'},engine),/未知/);
});
