import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('自有程式碼明列 MIT 並提供完整授權文字',()=>{
 const license=read('LICENSE');
 assert.equal(JSON.parse(read('package.json')).license,'MIT');
 assert.match(license,/MIT License/);
 assert.match(license,/Permission is hereby granted, free of charge/);
 assert.match(license,/THE SOFTWARE IS PROVIDED "AS IS"/);
});
test('公開說明保留第三方資料原授權與 FontVibe 署名',()=>{
 assert.match(read('README.md'),/自有程式碼[\s\S]*MIT/);
 assert.match(read('README.md'),/CC BY 4\.0/);
 assert.match(read('THIRD_PARTY_NOTICES.md'),/Text styles from FontVibe/);
 assert.match(read('THIRD_PARTY_NOTICES.md'),/CC BY 4\.0/);
});
