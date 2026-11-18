export function buildKeyMap(style,engine){
 if(!style?.id)throw new TypeError('缺少鍵位表的字樣識別碼。');
 const declared=new Set();
 for(const step of style.steps??[])for(const table of [step.table,step.whole,step.digraphs])for(const key of Object.keys(table??{}))
  if(key.length<=16&&!/[\p{Cc}\p{Cs}\p{Zl}\p{Zp}]/u.test(key))declared.add(key);
 const keys=[...new Set([...Array.from({length:95},(_,index)=>String.fromCodePoint(index+32)),...declared])];
 const grouped=new Map();let mappedInputs=0;
 for(const key of keys){
  const glyph=engine.transform(style.id,key);
  if(glyph===key&&!declared.has(key))continue;
  mappedInputs++;
  if(!grouped.has(glyph))grouped.set(glyph,{glyph,keys:[],codePoints:Array.from(glyph,c=>'U+'+c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0'))});
  grouped.get(glyph).keys.push(key);
 }
 return {styleId:style.id,rows:Array.from(grouped.values()),mappedInputs};
}
export function filterKeyMap(rows,query=''){
 const q=String(query??'').trim();if(!q)return rows;
 const codeQuery=/^u\+/i.test(q)||/^[0-9a-f]{4,6}$/i.test(q);
 return rows.filter(row=>row.glyph.includes(q)||row.keys.some(key=>key.includes(q))||(q==='空白'&&row.keys.includes(' '))||(codeQuery&&row.codePoints.some(code=>code.toLowerCase().includes(q.toLowerCase()))));
}
