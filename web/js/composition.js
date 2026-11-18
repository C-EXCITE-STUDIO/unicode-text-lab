import {splitGraphemes} from './engine.js';
const emoji=cluster=>/[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(cluster);
const eligible=(cluster,only='all')=>!/^\s+$/u.test(cluster)&&!emoji(cluster)&&(only==='letters'?/\p{L}/u.test(cluster):only==='alnum'?/[\p{L}\p{N}]/u.test(cluster):true);
export const EMPTY_RECIPE=Object.freeze({baseId:null,ornamentId:null,frameId:null,separatorId:null,markId:null});
export function createComposer(styles,engine){
 const registry=new Map(styles.map(style=>[style.id,style]));
 function validate(recipe={}){
  if(!recipe||typeof recipe!=='object'||Array.isArray(recipe))throw new TypeError('組合資料格式不正確。');
  for(const key of Object.keys(recipe))if(!Object.hasOwn(EMPTY_RECIPE,key))throw new RangeError('未知的組合欄位：'+key);
  const result={...EMPTY_RECIPE,...recipe};
  for(const key of Object.keys(EMPTY_RECIPE)){
   const id=result[key];if(id===null)continue;
   if(typeof id!=='string'||!registry.has(id))throw new RangeError('未知的組合字樣：'+id);
   const style=registry.get(id),slot=key.slice(0,-2);
   if(style.slot!==slot||(slot==='base'?!['font','symbol','tool'].includes(style.kind):style.kind!==slot))throw new RangeError('組合slot與字樣類型不符：'+key);
   if(slot!=='base'){
    const c=style.component,ops={ornament:['wrap'],frame:['wrap','char_wrap'],separator:['join'],mark:['append','zalgo']};
    if(!c||!ops[slot]?.includes(c.op))throw new TypeError('無效的裝飾元件操作：'+id);
    if(['wrap','char_wrap'].includes(c.op)&&(typeof c.prefix!=='string'||typeof c.suffix!=='string'))throw new TypeError('框飾資料格式不正確。');
    if(c.op==='join'&&typeof c.separator!=='string')throw new TypeError('字間圖案資料格式不正確。');
    if(c.only!==undefined&&!['all','letters','alnum'].includes(c.only))throw new TypeError('未知的字元支援範圍。');
    if(c.op==='append'&&typeof c.marks!=='string')throw new TypeError('附加標記資料格式不正確。');
    if(c.op==='zalgo')for(const name of ['up','mid','down'])if(!Number.isInteger(c[name])||c[name]<0||!c.pools?.[name]?.length)throw new TypeError('故障標記資料格式不正確。');
   }
  }
  if(registry.get(result.baseId)?.kind==='symbol'&&['ornamentId','frameId','separatorId','markId'].some(key=>result[key]!==null))throw new RangeError('純符號必須獨立使用，不能疊加任何裝飾。');
  return result;
 }
 function compose(recipe,text){
  const r=validate(recipe),input=String(text??'');
  if(input.length>4000)throw new RangeError('輸入過長：上限為4000個文字單位。');
  if(input==='')return '';
  let tokens=splitGraphemes(r.baseId?engine.transform(r.baseId,input):input);
  if(r.markId){
   const c=registry.get(r.markId).component;let seed=0x9e3779b9;
   tokens=tokens.map(token=>{
    if(!eligible(token,c.only))return token;
    if(c.op==='append')return token+Array.from(c.marks).slice(0,12).join('');
    if(c.op!=='zalgo')throw new RangeError('未知的疊加操作：'+c.op);
    let result=token,inserted=0;
    for(const name of ['up','mid','down']){
     const pool=Array.from(c.pools[name]);
     for(let i=0;i<c[name]&&inserted<12;i++,inserted++){
      if(!pool.length)throw new TypeError('故障標記池不能為空。');
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;result+=pool[seed%pool.length];
     }
    }
    return result;
   });
  }
  const frame=r.frameId?registry.get(r.frameId).component:null;
  if(frame?.op==='char_wrap')tokens=tokens.map(token=>eligible(token,frame.only)?frame.prefix+token+frame.suffix:token);
  const separator=r.separatorId?registry.get(r.separatorId).component.separator:'';
  let result=tokens.map((token,i)=>i&&separator&&!/^\s+$/u.test(token)&&!/^\s+$/u.test(tokens[i-1])?separator+token:token).join('');
  if(frame?.op==='wrap')result=frame.prefix+result+frame.suffix;
  if(r.ornamentId){const c=registry.get(r.ornamentId).component;result=c.prefix+result+c.suffix;}
  if(result.length>100000)throw new RangeError('組合結果過長，請縮短輸入。');
  return result;
 }
 function recipeFromStyle(id,current={}){
  if(id===null)return validate({...current,baseId:null});
  const style=registry.get(id);if(!style)throw new RangeError('未知的組合字樣：'+id);
  if(style.slot==='base')return validate(style.kind==='symbol'?{...EMPTY_RECIPE,baseId:id}:{...current,baseId:id});
  if(style.kind==='preset')return validate(style.recipe);
  return validate({...current,[style.slot+'Id']:id});
 }
 return {validate,compose,recipeFromStyle};
}
