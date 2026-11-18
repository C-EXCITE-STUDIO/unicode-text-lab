import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEngine } from '../web/js/engine.js';
const data=JSON.parse(fs.readFileSync(new URL('../sources/fontvibe-styles.json',import.meta.url),'utf8'));
const styles=data.styles.map(s=>({...s,id:'fontvibe:'+s.key}));
const engine=createEngine(styles);
const clusters=['👨‍👩‍👧','👍🏽','🇹🇼','1️⃣'];
test('預設反轉以 grapheme 為單位，不拆散 emoji 與重音',()=>{
  assert.equal(engine.transform('fontvibe:backwards','A👨‍👩‍👧👍🏽🇹🇼é'),'é🇹🇼👍🏽👨‍👩‍👧A');
});
test('所有效果都保留原本的複合 emoji',()=>{
  for(const style of styles){
    const output=engine.transform(style.id,'Ab '+clusters.join(' ')+' é 探激');
    for(const cluster of clusters) assert.ok(output.includes(cluster),`${style.id} 拆散 ${cluster}`);
  }
});
test('間隔符號不拆散組合重音',()=>{
  assert.equal(engine.transform('fontvibe:deco_heart_between','éx'),'é♡x');
});
test('刪除線不加在空白或 emoji 上',()=>{
  assert.equal(engine.transform('fontvibe:strikethrough','A 👍🏽'),'A̶ 👍🏽');
});
test('空輸入不產生裝飾框',()=>assert.equal(engine.transform('fontvibe:deco_star_frame',''),''));
test('Zalgo 每個字最多添加十二個標記',()=>{
  assert.ok(Array.from(engine.transform('fontvibe:zalgo_max','A')).length<=13);
});
test('羅馬數字不破壞範圍外的數字與前導零',()=>{
  const outside='0 000 4000 '+'9'.repeat(80);
  assert.equal(engine.transform('fontvibe:roman_upper',outside),outside);
});
test('未知樣式不能靜默回退',()=>assert.throws(()=>engine.transform('missing','Hi'),RangeError));
test('拒絕重複的樣式識別碼',()=>assert.throws(()=>createEngine([styles[0],styles[0]]),/重複/));
test('過長輸入明確報錯',()=>assert.throws(()=>engine.transform(styles[0].id,'A'.repeat(4001)),/過長/));
