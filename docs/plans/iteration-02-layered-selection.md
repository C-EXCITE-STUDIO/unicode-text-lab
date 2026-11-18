# 字樣分層選擇與符號鍵位表實作計畫

**目標**：把基底字形、表情／圖案、括號／邊框與疊加標記拆開選擇；純符號完全獨立，提供實際轉換推導的鍵位對照。
**已確認**：使用者明確選擇「純符號要完全獨立、不加任何裝飾」。這是本輪新增範圍，不自動執行原訂顏文字匯入或完整自訂字母表。
**架構**：保留全部166項原始定義與來源雜湊，另加kind／slot／component／recipe元資料。既有引擎繼續負責單項轉換；新組合器驗證基底與各層，從原文重新產生結果，不在已轉換字串上反覆套字體。
**技術棧**：零npm依賴的HTML／CSS／ES modules；Node內建測試與Python標準庫。Hermes直接做TDD垂直切片；資料語義分析並行，產物須由主代理驗證，不另派審核模型。

## 用語與關係
- 基底：普通文字，或單選一項font／symbol／tool。
- font：字母或數字的外形替換；Unicode圈字等本身含框的字元仍是基底，不誤判成框飾。
- symbol：按鍵／輸入字元替換為圖案的獨立映射；任一裝飾層非空即拒絕。
- ornament：句首句尾的表情／圖案；separator：字間裝飾／間隔。
- frame：整段括號／成對邊框，或逐字框。
- mark：底線、刪除線、故障等附加標記。
- preset：可拆解的既有組合，不計為另一套純字體。
- 鍵位表：以實際輸入字元區分大小寫；不是宣稱所有鍵盤佈局有相同實體座標。

## Out of Scope
- 不新增TTF／OTF、圖片輸出、遠端服務、登入或同步。
- 不匯入顏文字或額外Unicode大全；不增加虛假的字體總數。
- 不做任意順序拖曳、無限層、逐字指定不同字體或組合收藏編輯器。
- 本輪組合選項只保留於目前頁面；既有收藏／備份持續管理單項字樣，不擅自改動備份格式。
- 不保證社群平台接收所有字元；不把小螢幕模擬稱作實機手機驗證。

## 組合契約
`createComposer(styles,engine)` 提供 `compose(recipe,text)`、`validate(recipe)`、`recipeFromStyle(id,currentRecipe)`。
recipe固定欄位：`baseId`、`ornamentId`、`frameId`、`separatorId`、`markId`，未選擇為null；基底null代表普通文字。各slot最多一項，符號基底拒絕任何非空裝飾欄位。

固定流程：基底轉換 → 疊加標記 → 逐字框（若選）→ 字間裝飾 → 整段括號（若選）→ 外層表情／圖案。不得拆散emoji、旗幟、ZWJ或組合重音。字間裝飾不重複加在空白兩側；空輸入不產生空框。

組合模式的字母資格擴展至已轉換的Unicode字母，否則粗體後的底線／故障會失效；原始單項轉換維持相容。map型標記若需統一字後位置，保留原steps並明確標示衍生整理。

## Task 1：第一個垂直切片
- Create `tests/composition.test.mjs`，先測 `compose({baseId:'font',frameId:'frame'},'Ab')` 得到 `【𝐀𝐛】`。
- Run `node --test tests/composition.test.mjs`，確認缺少模組／實作的RED。
- Create `web/js/composition.js`，最小實作驗證與基底＋框，確認GREEN。

## Task 2：純符號規則與完整安全層
- 在同一測試檔逐項新增：符號加任一層拋錯、換入符號清空各層、錯誤slot／未知ID拒絕、完整五欄組合、Unicode字母上的mark、Zalgo上限、空白／空輸入、emoji／重音保護、輸入輸出上限。
- 每項先跑RED，再最小實作；必要時只匯出既有引擎的emoji判斷，不改單項語義。

## Task 3：鍵位表
- Create `tests/keymap.test.mjs`、`web/js/keymap.js`。
- 使用現有engine逐一轉換ASCII可印字元及已宣告的多字輸入鍵，依相同圖案合併來源鍵，不從輸出猜字母。
- 測大小寫不同、同圖多鍵、數字／標點、未映射輸入不冒充支援、複合碼位、搜尋與未知ID。

## Task 4：全部166項語義資料
- 並行提案：`artifacts/layer-catalog-proposal.json`，僅為分析，不可直接信任自報。
- 主代理核對總數、完整ID集合、每個slot、預設引用、原steps與元件一致；驗證特殊map型框／標記的全部映射。
- Create `config/style-components.json`；Modify `scripts/build_data.py`，另加categories與每項元資料，原steps／aliases／來源不變。
- Add `tests/components.test.mjs`；所有原始定義仍可單項複製，組合預設可載入可調整recipe。

## Task 5：介面
- Modify `web/index.html`、`web/css/studio.css`、`web/js/app.js`、`web/js/model.js`與`package.json`。
- 新分類：特殊字體、表情／圖案、括號／邊框、疊加標記、純符號、文字工具、組合預設。目錄將句首尾與字間圖案合為表情／圖案，工作台保留兩個獨立欄位。收藏ID不變；舊分類偏好以相容方式處理。
- 工作台顯示基底與四層選擇、即時合成結果、複製與重設；卡片能選用對應層，仍可直接複製原始單項。
- 符號模式清空並停用全部裝飾控制與加入按鈕，有明確原因；提供可搜尋的鍵位對照表及圖案複製。
- 不儲存輸入原文，不清空使用者既有收藏。

## Task 6：驗證與交付
- Run `npm test`、`npm run check`、`python3 -m unittest discover -s tests -p "test_*.py" -v`；保留上游4560筆相容性比對。
- 實際瀏覽器：選字體＋表情＋括號＋底線、讀回剪貼簿；選純符號後確認所有裝飾欄清空／停用，鍵位表與實際轉換一致。
- 全166項分類全量核對；各合法元件與基底的矩陣測試、所有純符號拒絕疊加矩陣測試，不以抽樣冒充全量。
- 重做390／320 CSS px響應式、鍵盤dialog、收藏與舊備份相容、離線與無外部請求。
- Bump 0.2.0，更新README／verification／memory/progress與feature_list，提交本地commit，不push。
- ZIP從commit建立，解壓至含空格的新目錄重跑測試與loopback啟動；驗證來源位元組／CRC／版本一致，最後在Hermes預覽打開新版。
