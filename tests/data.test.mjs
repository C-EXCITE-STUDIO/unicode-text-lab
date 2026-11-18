import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const originalRegistry=fs.readFileSync('web/data/styles.json');
const result=spawnSync('python3',['scripts/build_data.py'],{encoding:'utf8'});
test('封裝或 checkout 後重建資料仍逐位元相同，原始快照不可被換行轉換',()=>{
  assert.equal(result.status,0,result.stderr);
  assert.ok(fs.readFileSync('web/data/styles.json').equals(originalRegistry),'資料重建改變了輸出位元組，請檢查原始快照換行與 sourceHashes');
});
test('資料可由研究來源完整重建且包含明確分類與授權',()=>{
  assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(fs.readFileSync('web/data/styles.json','utf8'));
  assert.equal(data.styles.length,166);
  assert.equal(new Set(data.styles.map(s=>s.id)).size,166);
  for(const style of data.styles){
    assert.ok(style.labelZh && style.label && style.sourceUrl && style.license);
    assert.ok(['alphabet','combining','decoration','tool'].includes(style.group));
    assert.ok(style.steps.length>0);
    assert.equal(typeof style.coverage.upper,'number');
  }
  assert.equal(data.groups.reduce((n,g)=>n+g.count,0),166);
});
