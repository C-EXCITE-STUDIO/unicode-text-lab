import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEngine } from '../web/js/engine.js';
const source=JSON.parse(fs.readFileSync(new URL('../sources/fontvibe-styles.json',import.meta.url),'utf8'));
const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/fontvibe-golden.json',import.meta.url),'utf8'));
const engine=createEngine(source.styles.map(s=>({...s,id:'fontvibe:'+s.key})));
for(const style of source.styles){
  test(`上游相容：${style.key}（${golden.corpus.length} 輸入）`,()=>{
    golden.corpus.forEach((input,i)=>assert.equal(engine.transform('fontvibe:'+style.key,input,{safe:false}),golden.outputs[style.key][i],`${style.key} / ${JSON.stringify(input)}`));
  });
}
