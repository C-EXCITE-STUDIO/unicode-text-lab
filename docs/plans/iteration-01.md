# 字樣工坊第一輪實作計畫

**目標**：交付能在 Windows 本地開啟、離線轉換與複製的字樣工坊。
**執行**：Hermes 直接按垂直測試切片實作，不額外派發審核代理。
**架構**：原始研究資料 → 可重建的本地 registry → 純 JavaScript 引擎 → 繁中網頁。Python 標準庫提供 loopback 靜態伺服器與雙擊啟動器。
**技術棧**：HTML、CSS、ES modules、Node 內建 test、Python 標準庫；不安裝套件。

## Out of Scope
- 本輪不匯入符號／顏文字，不做真正 TTF/OTF 字型管理。
- 不做逐字混搭、自訂字母表或圖片輸出；這些屬後續迭代。
- 不對外部署、不加登入、同步、追蹤或第三方服務。
- 不承諾所有社群平台貼上相容；本輪驗證本機瀏覽器。

## 驗收條件
- 研究用 166 種候選定義均有來源、類別、授權與大小寫／數字覆蓋資訊。
- 純 JavaScript 轉換器通過上游 4560 筆基準輸出相容測試。
- 實際產品模式保護旗幟、膚色、ZWJ 家庭、重音 cluster，限制 Zalgo 堆疊；與上游相異之處要文件化。
- 即時預覽、繁中／英文搜尋、分類、一鍵複製、收藏、主題及字級可用。
- 收藏與偏好可匯出／匯入；預設不保存輸入的原文。
- 正確呈現空狀態、錯誤與剪貼簿失敗，不把選取文字冒充複製成功。
- 真正讀寫剪貼簿、重新載入後收藏持續、手機寬度不溢出，且無外部網路請求。
- 安全 HTTP headers、loopback 綁定、Host 驗證、僅服務 web/；啟動器可重啟。

## 任務與測試切片
1. `tests/engine.test.mjs` 先測混合文字映射，確認 RED；實作 `web/js/engine.js` 的最小 registry，確認 GREEN。
2. 增加 `tests/golden.test.mjs`，逐一比較原始 38 輸入 × 120 效果；實作明確 op dispatch，未知 op 必須報錯。
3. 增加 safe mode 的 grapheme／emoji／輸出限制測試，再實作安全轉換；相容模式僅供回歸測試。
4. `scripts/build_data.py` 從 `sources/` 重建 `web/data/styles.json`；保留 identifier、來源與授權，分類不把編碼當字型。
5. `tests/model.test.mjs` 先測搜尋、收藏、備份、畸形匯入；實作純狀態函式 `web/js/model.js`。
6. 建立 `web/index.html`、`web/css/studio.css`、`web/js/app.js`；輸入永遠以 textContent 寫入，不做 HTML 插入。
7. `tests/test_server.py` 先驗證綁定與 headers，再實作 `start.py`、`啟動字樣工坊.cmd`。
8. 跑 `npm test`、`npm run check`、Python unittest；啟動本地伺服器，瀏覽器驗證實際互動與視覺。
9. 更新 README、授權頁、進度與功能清單；打包便攜版與建立本地 commit，不 push。

## UI 方向
暖白紙色、深綠墨色、萊姆點綴；左側固定文字工作台，右側雙欄樣式目錄。小螢幕改為上下堆疊。無遠端字型，使用系統字型與 Unicode fallback。

## 驗證命令
```bash
npm test
npm run check
python3 -m unittest discover -s tests -p "test_*.py" -v
python3 start.py --no-browser --port 8787
```

## 後續迭代（未執行）
第二輪：符號與顏文字庫。第三輪：混搭與個人樣式製作。每輪等待使用者批准再開始。
