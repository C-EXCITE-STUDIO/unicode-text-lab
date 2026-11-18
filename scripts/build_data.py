"""從已核對的研究資料建立離線字樣目錄；不連線、不執行來源程式。"""
from collections import Counter
from pathlib import Path
import hashlib
import json
import string
import unicodedata

ROOT=Path(__file__).resolve().parents[1]
NAMES={
'math_bold':'襯線粗體','math_italic':'襯線斜體','math_bold_italic':'襯線粗斜體','math_script':'粗草寫','math_script_plain':'細草寫','math_fraktur':'哥德體','math_bold_fraktur':'粗哥德體','math_double_struck':'雙線空心體','math_mono':'等寬打字機','math_sans':'無襯線體','math_sans_bold':'無襯線粗體','math_sans_italic':'無襯線斜體','math_sans_bold_italic':'無襯線粗斜體',
'circled':'圈圈字母','circled_neg':'黑底圈圈','double_circled':'雙圈數字','circled_sans':'細圈數字','circled_neg_sans':'黑底細圈數字','digit_fullstop':'數字點號','dice':'骰子數字','keycap':'按鍵數字','roman_upper':'大寫羅馬數字','roman_lower':'小寫羅馬數字','squared':'方框字母','squared_neg':'黑底方框','parenthesized':'括號字母','fullwidth':'全形字母','small_caps':'小型大寫','superscript':'上標小字','subscript':'下標小字','regional_indicator':'區域指示字母',
'double_underline':'雙底線','strikethrough':'刪除線','underline':'底線','slashed':'斜槓疊加','upside_down':'上下翻轉','backwards':'字序反轉','wide_spaced':'寬間隔','greek_style':'仿希臘字形','braille':'英文點字編碼','morse':'摩斯密碼','binary':'二進位編碼','wingdings':'圖案符號字形','runic':'仿盧恩字母',
'zalgo_mini':'輕度故障字','zalgo':'故障疊字','zalgo_max':'重度故障字','glitch_bars':'橫條故障','glitch_cross':'交錯故障','glitch_lines':'線條故障',
'title_case':'字首大寫','upper_case':'全部大寫','lower_case':'全部小寫','camel_case':'駝峰命名','snake_case':'底線命名','kebab_case':'連字號命名','constant_case':'常數命名','alternating_case':'交錯大小寫','inverse_case':'反轉大小寫',
'deco_star_frame':'星光框','deco_corner':'角括號','deco_cjk_bracket':'東方括號','deco_double_bracket':'雙層括號','deco_sparkle':'閃光包邊','deco_wave':'波浪包邊','deco_flourish':'花飾框','deco_flower':'花朵包邊','deco_heart_wrap':'愛心包邊','deco_arrow':'箭頭包邊','deco_crown':'皇冠包邊','deco_skull':'骷髏包邊','deco_snow':'雪花包邊','deco_cross':'十字包邊','deco_lightning':'閃電包邊','deco_cherry':'櫻花包邊','deco_bar_frame':'豎線框','deco_overline':'上劃線','deco_frozen':'冰凍標記','deco_clouds':'雲朵標記','deco_happy':'微笑標記','deco_sad':'低落標記',
'mimic_andalucia':'安達盧西亞仿形','mimic_cjk':'漢字外形混搭','mimic_syllabics':'音節文字仿形','mimic_yi':'彝文字形混搭','mimic_comic':'漫畫混搭','mimic_currency':'貨幣符號仿形','mimic_wingdings':'圖案符號混搭',
'Bubbles':'圈圈混合','BubbleBlack':'黑圈混合','Parenthesis':'括號混合','SuperScript':'上標混合','FullWidth':'全形數字變體','MathBold':'粗體數字變體','MathSans':'無襯線數字變體','MathSansBold':'無襯線粗體變體','Russian':'仿俄文字形','Japanese':'仿日文字形','Arabic':'仿阿拉伯字形','Fairy':'精靈混搭','Wizard':'巫師混搭','Monospace':'等寬數字變體','DoubleStruck':'雙線數字變體','Funky':'放克混搭','Acute':'銳音字形','RockDots':'搖滾點字','Stroked':'筆劃混搭','Inverted':'倒轉字形','1337 [extreme]':'Leet 符號替字','Heavy':'厚重混搭','Little Fancy':'微型花體','Fable':'寓言混搭','Swirls':'旋紋混搭','Accent':'重音混搭','Linear':'線性混搭','Scribbles':'塗鴉混搭','Japanese Script':'假名字形混搭','Solitude':'逐字方括號','Box Lines':'逐字線框','Symbolic':'符號混搭','Bent':'彎曲字形','SideSquiggles':'側邊波紋','DoubleUnderline':'雙底線變體','TopSquiggles':'上方波紋','ArrowUp':'向上箭頭疊加','Exes':'交叉疊加','Comic':'漫畫字形','Andalusia':'安達盧西亞字形','Manga':'漫畫混合','Rune':'盧恩混合','black_circle':'黑圈大寫限定','parenthesized':'括號字母','regional_indicator':'區域字母原字映射','square':'方框大寫限定',
}
BETWEEN={'sparkle':'閃光','flower':'花朵','wave':'波浪','arrow':'箭頭','fire':'火焰','diamond':'菱形','dot':'圓點','heart':'愛心','star':'星星','crown':'皇冠','skull':'骷髏','note':'音符','music':'樂符','snow':'雪花','cross':'十字','lightning':'閃電','cherry':'櫻花','petal':'花瓣'}
for word,name in BETWEEN.items(): NAMES['deco_'+word+'_between']=name+'間隔'
SOURCE_INFO={
'fontvibe':('FontVibe','https://github.com/Funovate-Technology/fontvibe-fancy-text','CC-BY-4.0'),
'waterr':('Fancy Fonts Generator','https://github.com/waterrmalann/fancy-fonts-generator','MIT'),
'utd':('Unicode Text Decorator','https://github.com/ryo-a/unicode-text-decorator','MIT'),
'weird':('Weird Fonts','https://github.com/beizhedenglong/weird-fonts','MIT'),
}
GROUPS=[('alphabet','字母樣式'),('combining','疊加效果'),('decoration','框飾與間隔'),('tool','轉換工具')]

def build():
    candidate=json.loads((ROOT/'sources/candidate-style-manifest.json').read_text(encoding='utf-8'))
    original=json.loads((ROOT/'sources/fontvibe-styles.json').read_text(encoding='utf-8'))
    components_path=ROOT/'config/style-components.json'
    components=json.loads(components_path.read_text(encoding='utf-8'))
    if set(components['styles'])!={s['id'] for s in candidate['styles']}: raise ValueError('語義分類與原始ID集合不一致')
    fv={s['key']:s for s in original['styles']}
    entries=[]
    for row in candidate['styles']:
        source,key=row['id'].split(':',1)
        steps=row['definition'] if isinstance(row['definition'],list) else [{'op':'map','table':row['definition']}]
        ops={s['op'] for s in steps}
        metadata=fv.get(key,{}) if source=='fontvibe' else {}
        cat=metadata.get('category','')
        if 'zalgo' in ops or 'append' in ops: group='combining'
        elif ops & {'wrap','join'}: group='decoration'
        elif ops & {'case','roman','reverse'} or cat in {'Case','Translator','Numbers'} or key in {'wingdings','braille','morse','binary','dice','keycap'}: group='tool'
        else: group='alphabet'
        tables=[s['table'] for s in steps if s['op']=='map']
        if source!='fontvibe' and tables:
            outputs=list(tables[0].values())
            if any(any(unicodedata.category(c).startswith('M') for c in value) for value in outputs): group='combining'
            elif any(len(value)>1 for value in outputs): group='decoration'
        label_zh='・'.join(NAMES.get(part,part) for part in key.split('+'))
        if label_zh==key: raise ValueError('缺少繁中名稱：'+key)
        coverage={}
        for kind,chars in [('upper',string.ascii_uppercase),('lower',string.ascii_lowercase),('digits',string.digits)]:
            if 'coverage' in metadata: coverage[kind]=metadata['coverage'].get(kind,0)
            elif tables: coverage[kind]=sum(tables[0].get(c,c)!=c for c in chars)
            else: coverage[kind]=0
        name,url,license_name=SOURCE_INFO[source]
        risk=[]
        if group=='combining': risk.append('組合標記的顯示依裝置而異；emoji 不疊加標記。')
        if 'regional' in key or key=='keycap': risk.append('可能顯示為 emoji 或旗幟，並非一般字母字型。')
        if key.startswith('mimic_') or cat in {'Mimic','Runic'} or key in {'Russian','Japanese','Arabic','Japanese Script','Rune'}: risk.append('依外形混搭不同文字，不是翻譯。')
        if group=='tool': risk.append('這是文字轉換／編碼工具，不算獨立字體。')
        search_aliases={'Cursive':['手寫','書法','草寫'],'Gothic':['中世紀','古英','blackletter'],'Outline':['空心','雙線'],'Monospace':['打字機','等寬']}.get(cat,[])
        entries.append({'id':row['id'],'label':row['label'],'labelZh':label_zh,'group':group,'source':source,'sourceName':name,'sourceUrl':url,'license':license_name,'steps':steps,'coverage':coverage,'risk':risk,'aliases':row.get('aliases',[]),'searchTerms':[row['label'],label_zh,key,source,cat,*search_aliases]})
    for entry in entries:
        semantic=components['styles'][entry['id']]
        entry.update({k:v for k,v in semantic.items() if k!='note'})
        if semantic.get('note'): entry['componentNote']=semantic['note']
    priority=['fontvibe:'+key for key in ['math_bold','math_script','math_double_struck','math_fraktur','math_sans_bold','math_mono','math_italic','circled','fullwidth','small_caps','math_script_plain','math_bold_fraktur']]
    order={key:i for i,key in enumerate(priority)}
    entries.sort(key=lambda row:order.get(row['id'],len(order)))
    counts=Counter(row['group'] for row in entries)
    hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'sources').glob('*.json'))}
    kind_counts=Counter(row['kind'] for row in entries)
    categories=[('font','特殊字體',['font']),('art','表情／圖案',['ornament','separator']),('frame','括號／邊框',['frame']),('mark','疊加標記',['mark']),('symbol','純符號',['symbol']),('tool','文字工具',['tool']),('preset','組合預設',['preset'])]
    category_rows=[{'id':key,'label':label,'kinds':members,'count':sum(kind_counts[kind] for kind in members)} for key,label,members in categories]
    result={'schemaVersion':1,'version':'0.2.0','total':len(entries),'groups':[{'id':key,'label':label,'count':counts[key]} for key,label in GROUPS],'sourceHashes':hashes,'componentHash':hashlib.sha256(components_path.read_bytes()).hexdigest(),'kindCounts':dict(kind_counts),'categories':category_rows,'styles':entries}
    out=ROOT/'web/data/styles.json'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(json.dumps({'styles':len(entries),'groups':dict(counts),'bytes':out.stat().st_size},ensure_ascii=False))
    return result

if __name__=='__main__': build()
