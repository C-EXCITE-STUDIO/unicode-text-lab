import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../web/css/studio.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
const root=css.match(/:root\{([^}]+)\}/)[1];
const token=name=>root.match(new RegExp('--'+name+':([^;]+)'))[1];
function luminance(hex){const c=[1,3,5].map(i=>Number.parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
test('主要淺色文字對比至少 4.5:1',()=>{for(const bg of ['paper','panel','surface']){const a=luminance(token('muted')),b=luminance(token(bg));assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'muted / '+bg);}});
test('不載入外部程式、樣式表或圖片',()=>assert.ok(!/<(?:script|link|img)\b[^>]*\b(?:src|href)=["']https?:/i.test(html)));
test('分層工作台與鍵位表有獨立語意控制',()=>{
 for(const id of ['composer-base','composer-ornament','composer-frame','composer-separator','composer-mark','composer-decorations','composed-text','copy-composition','reset-composition','show-keymap','keymap-dialog','keymap-search','keymap-body'])assert.ok(html.includes('id="'+id+'"'),id);
});
test('主要輸入與操作都有可定位語意控制',()=>{for(const id of ['source-text','style-search','copy-all','view-favorites','preview-size','export-backup','import-backup','about-dialog'])assert.ok(html.includes('id="'+id+'"'),id);});
