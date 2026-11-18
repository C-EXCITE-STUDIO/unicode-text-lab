import {createEngine,splitGraphemes} from './engine.js';
import {filterStyles,buildResults,toggleFavorite,encodeBackup,decodeBackup,loadState,saveState,measureText} from './model.js';
import {createComposer,EMPTY_RECIPE} from './composition.js';
import {buildKeyMap,filterKeyMap} from './keymap.js';
const $=id=>document.getElementById(id);
const kindLabels={font:'特殊字體',symbol:'純符號・獨立',ornament:'句首尾表情／圖案',frame:'括號／邊框',separator:'字間圖案／間隔',mark:'疊加標記',tool:'文字工具',preset:'組合預設'};
const slotControls={ornamentId:'composer-ornament',frameId:'composer-frame',separatorId:'composer-separator',markId:'composer-mark'};
let catalog,engine,composer,byId,state,knownIds,rows=[],visibleLimit=24,onlyFavorites=false,storage,toastTimer,inputTimer,composing=false;
let recipe={...EMPTY_RECIPE},composedOutput='',currentKeymap=null;
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function toast(message,error=false){clearTimeout(toastTimer);const node=$('toast');node.textContent=message;node.dataset.error=String(error);node.hidden=false;toastTimer=setTimeout(()=>node.hidden=true,error?6500:2800);}
function persist(){const result=saveState(storage,state,knownIds);if(result.warning)toast(result.warning,true);return !result.warning;}
function applyPreferences(){document.documentElement.dataset.theme=state.theme;document.documentElement.style.setProperty('--preview-size',state.fontSize+'px');$('preview-size').value=state.fontSize;$('preview-size-value').textContent=state.fontSize+' px';$('dedupe-results').checked=state.dedupe;$('theme-icon').textContent=state.theme==='dark'?'☀':'☾';$('theme-toggle').setAttribute('aria-pressed',String(state.theme==='dark'));$('theme-toggle').setAttribute('aria-label',state.theme==='dark'?'切換淺色模式':'切換深色模式');$('theme-toggle').title=$('theme-toggle').getAttribute('aria-label');}
function updateNavigation(){$('view-all').setAttribute('aria-pressed',String(!onlyFavorites));$('view-favorites').setAttribute('aria-pressed',String(onlyFavorites));$('favorite-count').textContent=state.favorites.length;for(const button of $('group-filters').children)button.setAttribute('aria-pressed',String(button.dataset.group===state.group));}
function createFilters(){
 const groups=[{id:'all',label:'全部',count:catalog.styles.length},...catalog.categories];
 $('group-filters').replaceChildren(...groups.map(group=>{const button=element('button','filter-chip',group.label);button.type='button';button.dataset.group=group.id;button.setAttribute('aria-pressed',String(state.group===group.id));button.append(element('span','',group.count));button.addEventListener('click',()=>{state.group=group.id;persist();render();});return button;}));
}
function option(value,label){const node=element('option','',label);node.value=value;return node;}
function createComposerControls(){
 const select=$('composer-base');select.replaceChildren(option('','普通文字（不換字形）'));
 for(const kind of ['font','symbol','tool']){const group=element('optgroup');group.label=kindLabels[kind];for(const style of catalog.styles.filter(s=>s.kind===kind))group.append(option(style.id,style.labelZh));select.append(group);}
 for(const [key,id] of Object.entries(slotControls)){const slot=key.slice(0,-2);$(id).replaceChildren(option('','不添加'),...catalog.styles.filter(s=>s.slot===slot).map(s=>option(s.id,s.labelZh)));}
}
function renderComposition(){
 const symbol=byId.get(recipe.baseId)?.kind==='symbol';
 $('composer-base').value=recipe.baseId??'';
 $('composer-decorations').disabled=symbol;$('composer-decorations').setAttribute('aria-disabled',String(symbol));
 for(const [key,id] of Object.entries(slotControls)){$(id).value=recipe[key]??'';$(id).disabled=symbol;}
 $('composer-lock').hidden=!symbol;$('composer-mode').textContent=symbol?'純符號・獨立模式':'可疊加模式';$('composer-mode').dataset.symbol=String(symbol);
 $('show-keymap').disabled=!symbol;$('show-keymap').title=symbol?'查看這套純符號的完整鍵位對照':'選擇純符號後可查詢鍵位';
 composedOutput=composer.compose(recipe,$('source-text').value);$('composed-text').value=composedOutput;$('copy-composition').disabled=composedOutput==='';
 const labels=Object.values(recipe).filter(Boolean).map(id=>byId.get(id).labelZh);$('recipe-summary').textContent=labels.length?labels.join(' ＋ '):'普通文字 · 尚未添加任何效果';
}
function focusCard(id,action){const card=Array.from(document.querySelectorAll('.style-card')).find(node=>node.dataset.style===id);(card?.querySelector('[data-action="'+action+'"]')??$('composer-base')).focus({preventScroll:true});}
function selectStyle(id){
 try{recipe=composer.recipeFromStyle(id,recipe);render(false);focusCard(id,'use');toast(byId.get(id).kind==='symbol'?'已切換純符號：全部裝飾已清空並鎖定。':'已選用：'+byId.get(id).labelZh);}
 catch(error){toast(error.message,true);}
}
function renderKeymap(){
 if(!currentKeymap)return;
 const filtered=filterKeyMap(currentKeymap.rows,$('keymap-search').value);
 $('keymap-count').textContent=`${currentKeymap.rows.length} 種圖案 · ${currentKeymap.mappedInputs} 個輸入鍵位 · 目前顯示 ${filtered.length} 種`;
 $('keymap-body').replaceChildren(...filtered.map(row=>{
  const tr=element('tr'),glyph=element('td'),bdi=element('bdi','keymap-glyph',row.glyph);bdi.dir='auto';glyph.append(bdi);
  const keys=element('td','keymap-keys');for(const key of row.keys)keys.append(element('kbd','',key===' '?'空白':key));
  const codes=element('td','keymap-codes',row.codePoints.join(' ')),action=element('td');
  const button=element('button','secondary-button','複製圖案');button.type='button';button.addEventListener('click',async()=>{if(await copyText(row.glyph))toast('已複製圖案。');});action.append(button);tr.append(glyph,keys,codes,action);return tr;
 }));
}
function openKeymap(id){
 try{const style=byId.get(id);if(style?.kind!=='symbol')throw new RangeError('請先選擇一套純符號。');currentKeymap=buildKeyMap(style,engine);$('keymap-title').textContent='鍵位對照 · '+style.labelZh;$('keymap-search').value='';renderKeymap();$('keymap-dialog').showModal();$('keymap-search').focus();}
 catch(error){toast(error.message,true);}
}
async function copyText(text){
 try{if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(text);return true;}
 catch{
  const active=document.activeElement,buffer=element('textarea','clipboard-buffer');buffer.value=text;buffer.setAttribute('aria-hidden','true');document.body.append(buffer);buffer.select();
  let copied=false;try{copied=document.execCommand('copy');}catch{copied=false;}buffer.remove();if(active instanceof HTMLElement)active.focus({preventScroll:true});
  if(copied)return true;
  $('manual-text').value=text;$('manual-dialog').showModal();$('manual-text').focus();$('manual-text').select();toast('自動複製未成功，請在視窗內按 Ctrl+C 手動複製。',true);return false;
 }
}
function supportDescription(style){
 const c=style.coverage;
 if(style.kind==='symbol')return '圖案替字 · 純符號獨立模式 · 可查詢大小寫、數字與標點鍵位';
 if(style.kind==='font')return `大寫 ${c.upper}/26 · 小寫 ${c.lower}/26 · 數字 ${c.digits}/10`;
 if(style.kind==='mark')return '疊加標記 · 組合模式支援Unicode字形，emoji保留原樣';
 if(style.kind==='frame')return style.component.op==='char_wrap'?'逐字框 · 適用文字字形，emoji不逐字包框':'整段括號／邊框 · 不改變基底字形';
 if(style.kind==='ornament')return '句首句尾圖案 · 可獨立搭配字體、括號與字間裝飾';
 if(style.kind==='separator')return '字間圖案／間隔 · 組合模式不在空白兩側重複添加';
 if(style.kind==='preset')return '既有組合預設 · 載入後可分別調整每一層，不算額外的純字體';
 return '文字轉換／編碼工具，不算獨立字體';
}
function createCard(row){
 const style=row.style,card=element('article','style-card');card.dataset.style=style.id;card.dataset.kind=style.kind;
 const selected=Object.values(recipe).some(id=>id&&row.mergedIds.includes(id));card.classList.toggle('is-selected',selected);
 const top=element('div','card-top');top.append(element('span','kind-label',kindLabels[style.kind]));if(selected)top.append(element('span','selected-label','組合中'));
 const favorite=element('button','favorite-button',state.favorites.includes(style.id)?'★':'☆');favorite.type='button';favorite.dataset.action='favorite';favorite.setAttribute('aria-pressed',String(state.favorites.includes(style.id)));favorite.setAttribute('aria-label',(state.favorites.includes(style.id)?'取消收藏：':'收藏：')+style.labelZh);favorite.title=favorite.getAttribute('aria-label');
 favorite.addEventListener('click',()=>{state.favorites=toggleFavorite(state.favorites,style.id,knownIds);const saved=persist();render(false);focusCard(style.id,'favorite');if(saved)toast(state.favorites.includes(style.id)?'已加入收藏：'+style.labelZh:'已取消收藏：'+style.labelZh);});top.append(favorite);
 card.append(top,element('h3','card-title',style.labelZh),element('p','english-name',style.label));
 const preview=element('div','style-preview',splitGraphemes(row.text).slice(0,180).join(''));preview.dir='auto';preview.setAttribute('aria-label',style.labelZh+' 原樣預覽');card.append(preview);
 const details=element('details','card-details'),summary=element('summary','',row.text===$('source-text').value?'這次輸入保留原字':'類型、支援範圍與來源');details.append(summary,element('p','',supportDescription(style)));
 if(style.componentNote)details.append(element('p','',style.componentNote));
 for(const risk of style.risk??[])details.append(element('p','',risk));
 const source=element('a','',style.sourceName+' · '+style.license+' ↗');source.href=style.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';details.append(source);if(row.mergedIds.length>1)details.append(element('p','',`已合併同類型 ${row.mergedIds.length} 個相同輸出；取消「合併相同結果」可查看各項。`));card.append(details);
 const footer=element('div','card-footer');footer.append(element('span','source-mini',style.sourceName));
 const useLabels={font:'選用字體',symbol:'選用純符號',tool:'設為基底',ornament:'加入句首尾',frame:'加入邊框',separator:'加入字間',mark:'疊加標記',preset:'載入組合'};
 const use=element('button','secondary-button use-button',useLabels[style.kind]);use.type='button';use.dataset.action='use';use.setAttribute('aria-label',useLabels[style.kind]+'：'+style.labelZh);
 const locked=byId.get(recipe.baseId)?.kind==='symbol'&&style.slot!=='base'&&style.kind!=='preset';use.disabled=locked;if(locked)use.title='純符號模式不能疊加；請先更換基底字體。';use.addEventListener('click',()=>selectStyle(style.id));footer.append(use);
 if(style.kind==='symbol'){const key=element('button','secondary-button keymap-button','鍵位表');key.type='button';key.dataset.action='keymap';key.setAttribute('aria-label','查看鍵位：'+style.labelZh);key.addEventListener('click',()=>openKeymap(style.id));footer.append(key);}
 const copy=element('button','copy-button','原樣複製');copy.type='button';copy.dataset.action='copy';copy.setAttribute('aria-label','原樣複製：'+style.labelZh);copy.append(element('span','','↗'));copy.addEventListener('click',async()=>{if(await copyText(row.text)){copy.classList.add('copied');copy.replaceChildren(document.createTextNode('已複製 ✓'));toast('已複製原樣：'+style.labelZh);setTimeout(()=>{copy.classList.remove('copied');copy.replaceChildren(document.createTextNode('原樣複製'),element('span','','↗'));},1600);}});footer.append(copy);card.append(footer);return card;
}
function renderCards(){const shown=rows.slice(0,visibleLimit);$('style-grid').replaceChildren(...shown.map(createCard));$('rendered-count').textContent=rows.length?`${shown.length} / ${rows.length}`:'';$('load-more').hidden=shown.length>=rows.length;$('load-more').textContent=`載入更多字樣 · 還有 ${Math.max(0,rows.length-shown.length)} 種`;}
function render(resetLimit=true){
 if(!catalog)return;if(resetLimit)visibleLimit=24;updateNavigation();
 const input=$('source-text').value,metrics=measureText(input);$('source-metrics').textContent=`${metrics.graphemes} 字 · ${metrics.codePoints} 碼位 · ${metrics.bytes} UTF-8 bytes`;$('cjk-note').hidden=!/\p{Script=Han}/u.test(input);
 const filtered=filterStyles(catalog.styles,{query:$('style-search').value,group:state.group,onlyFavorites,favorites:state.favorites});
 try{rows=buildResults(filtered,engine,input,{dedupe:state.dedupe});renderComposition();$('app-error').hidden=true;}
 catch(error){rows=[];composedOutput='';$('composed-text').value='';$('copy-composition').disabled=true;$('error-message').textContent=error.message;$('app-error').hidden=false;}
 $('result-count').textContent=`${rows.length} 種單項結果 · ${filtered.length} 個符合項目${state.dedupe?' · 僅合併同類型相同輸出':''}`;$('copy-all').disabled=rows.length===0;$('empty-state').hidden=rows.length!==0;
 if(!rows.length){$('empty-title').textContent=!input?'先輸入一點文字。':onlyFavorites&&!state.favorites.length?'收藏，從一顆星開始。':'還沒找到這種字樣。';$('empty-description').textContent=!input?'左邊的文字工作台，等著你的第一句話。':onlyFavorites&&!state.favorites.length?'在字樣卡片右上角點一顆星，喜歡的樣式就會留在這裡。':'換個關鍵字，或清除分類再看看。';$('reset-filters').hidden=!input;}
 renderCards();
}
function downloadBackup(){const blob=new Blob([encodeBackup(state,knownIds)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download='字樣工坊-收藏備份.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('已產生收藏與偏好備份；不含輸入原文與本次組合。');}
function bindEvents(){
 $('source-text').addEventListener('compositionstart',()=>composing=true);$('source-text').addEventListener('compositionend',()=>{composing=false;render();});$('source-text').addEventListener('input',()=>{if(composing)return;clearTimeout(inputTimer);inputTimer=setTimeout(render,100);});
 $('style-search').addEventListener('input',()=>{clearTimeout(inputTimer);inputTimer=setTimeout(render,80);});
 $('clear-input').addEventListener('click',()=>{$('source-text').value='';render();$('source-text').focus();});
 for(const button of document.querySelectorAll('[data-sample]'))button.addEventListener('click',()=>{$('source-text').value=button.dataset.sample;render();});
 $('composer-base').addEventListener('change',()=>{try{recipe=composer.recipeFromStyle($('composer-base').value||null,recipe);render(false);}catch(error){toast(error.message,true);renderComposition();}});
 for(const [key,id] of Object.entries(slotControls))$(id).addEventListener('change',()=>{try{recipe=composer.validate({...recipe,[key]:$(id).value||null});render(false);}catch(error){toast(error.message,true);renderComposition();}});
 $('reset-composition').addEventListener('click',()=>{recipe={...EMPTY_RECIPE};render(false);toast('已重設組合，輸入文字不變。');});
 $('copy-composition').addEventListener('click',async()=>{if(composedOutput&&await copyText(composedOutput))toast('已複製完整組合。');});
 $('show-keymap').addEventListener('click',()=>openKeymap(recipe.baseId));$('keymap-search').addEventListener('input',renderKeymap);
 $('preview-size').addEventListener('input',()=>{state.fontSize=Number($('preview-size').value);applyPreferences();persist();});
 $('dedupe-results').addEventListener('change',()=>{state.dedupe=$('dedupe-results').checked;persist();render();});
 $('theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';applyPreferences();persist();});
 $('view-all').addEventListener('click',()=>{onlyFavorites=false;render();});$('view-favorites').addEventListener('click',()=>{onlyFavorites=true;render();});
 $('reset-filters').addEventListener('click',()=>{state.group='all';onlyFavorites=false;$('style-search').value='';persist();render();});
 $('load-more').addEventListener('click',()=>{visibleLimit+=24;renderCards();});
 $('copy-all').addEventListener('click',async()=>{if(await copyText(rows.map(row=>row.style.labelZh+'：'+row.text).join('\n\n')))toast(`已複製 ${rows.length} 種原始單項結果，不含組合器的裝飾。`);});
 $('export-backup').addEventListener('click',downloadBackup);$('import-backup').addEventListener('click',()=>$('backup-file').click());
 $('backup-file').addEventListener('change',async()=>{const file=$('backup-file').files[0];if(!file)return;try{if(file.size>262144)throw new Error('備份檔過大，上限為256 KB。');const imported=decodeBackup(await file.text(),knownIds);state={...imported,favorites:[...new Set([...state.favorites,...imported.favorites])]};applyPreferences();render();if(persist())toast(`已匯入偏好並合併收藏，目前 ${state.favorites.length} 種。`);}catch(error){toast('匯入失敗：'+error.message,true);}finally{$('backup-file').value='';}});
 $('about-button').addEventListener('click',()=>$('about-dialog').showModal());
 for(const button of document.querySelectorAll('[data-close-dialog]'))button.addEventListener('click',()=>button.closest('dialog').close());
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
}
async function boot(){
 $('retry-load').addEventListener('click',()=>location.reload());
 try{
  const response=await fetch('./data/styles.json');if(!response.ok)throw new Error('本地字樣資料讀取失敗。');catalog=await response.json();
  if(catalog.schemaVersion!==1||catalog.total!==catalog.styles.length||!catalog.categories||catalog.styles.some(style=>!style.kind))throw new Error('字樣資料版本或分類不一致。');
  engine=createEngine(catalog.styles);composer=createComposer(catalog.styles,engine);byId=new Map(catalog.styles.map(style=>[style.id,style]));knownIds=catalog.styles.map(style=>style.id);
  recipe={...EMPTY_RECIPE,baseId:byId.has('fontvibe:math_bold')?'fontvibe:math_bold':null};
  try{storage=window.localStorage;}catch{storage={getItem(){throw new Error('unavailable');},setItem(){throw new Error('unavailable');}};}
  const loaded=loadState(storage,knownIds);state=loaded.state;$('catalog-total').textContent=catalog.styles.length;
  applyPreferences();createFilters();createComposerControls();bindEvents();$('loading-state').hidden=true;render();document.body.dataset.ready='true';document.body.dataset.version=catalog.version;if(loaded.warning)toast(loaded.warning,true);
 }catch(error){$('loading-state').hidden=true;$('error-message').textContent=error.message+' 請使用「啟動字樣工坊.cmd」，不要直接開啟HTML。';$('app-error').hidden=false;$('result-count').textContent='未能載入字樣';}
}
boot();
