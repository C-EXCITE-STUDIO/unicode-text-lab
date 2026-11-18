# 字樣工坊進度

## 當前範圍
使用者已選 B：離線字樣工坊。目前版本 v0.2.0，已完成使用者新增的分類、分層組合與鍵位表需求。純符號完全獨立，不加任何裝飾。後續額外資料庫／逐字混搭仍未批准，不自動推進。

## 來源
研究原件與完整工具輸出保留於開發者本機，不隨公開快照發佈。第三方來源、授權與原始資料快照仍包含於本專案。

## 公開版本
- GitHub：<https://github.com/C-EXCITE-STUDIO/unicode-text-lab>；本公開副本從 v0.2.0 建立乾淨的 main 歷史，不含內部 Git 歷史、vault 或測試產物。
- 自有程式碼採 MIT；第三方資料保留原授權，FontVibe 資料仍為 CC BY 4.0。
- 授權新增兩項回歸測試後，完整 JavaScript 測試為 168 項；Python 仍為 8 項。詳細見 `docs/publication-verification.md`，下方 166 項為加授權測試前的功能驗證記錄。

## v0.2.0 分層組合與純符號 — 已驗證
- 規格：`docs/plans/iteration-02-layered-selection.md`；`feature_list.json` 的 `layered-selection-and-symbol-keymap` 為通過。
- 全部 166 個原始 ID、steps、aliases 與來源快照保留；語義資料在 `config/style-components.json`，可離線重建。
- 分類：特殊字體 74、表情／圖案 30、括號／邊框 8、疊加標記 20、純符號 5、文字工具 15、組合預設 14；不是 166 套字體。
- 工作台：基底單選與四個裝飾層，固定從原文合成；純符號換入會清空並鎖住裝飾，核心也拒絕任何疊加。
- 五套純符號均有可搜尋鍵位表、Unicode 碼位與圖案複製，實測共 284 筆輸入字元對應；大小寫不同時分列。
- `npm test` 與直接 `node --test tests/*.test.mjs` 各 166／166 通過（含原有 4,560 筆基準）；`npm run check` 五個模組退出碼 0；Python 8／8 通過。
- 真實瀏覽器：166 張卡片零差異；四層與系統剪貼簿相同；符號欄位全清空／停用且惡意 change 也不能加框；五套鍵位表全量核對、鍵盤與圖案複製通過。
- 重新驗證收藏、真下載／匯入與舊備份、HTML 純文字、安全回退、載入後離線、emoji、390／320 px；外部請求與 runtime errors 為空。
- 原 QA 瀏覽器儲存為不存在，測後讀回仍不存在；沒有留下測試收藏或配方。輸入與配方均不持久保存，舊五欄偏好格式保留。
- 資料產物 152,757 bytes；SHA-256：`2cfce4e253c2e1e2900e99559721dd932801de8212d3e05725a00b049c96d946`。
- 詳細驗證：`docs/verification-v0.2.0.md`；原始輸出與畫面：`artifacts/v0.2.0/`。
- 最終 ZIP 從本地 commit 產生；解壓後測試、來源／配置雜湊、CRC、版本及 loopback 健康證據由封裝步驟寫入 `artifacts/v0.2.0/release-verification.json`。舊 v0.1.0 ZIP 不覆蓋。
- 已在 Hermes 預覽打開並讀回 `http://127.0.0.1:8787/?v=0.2.0#composer-panel` 的新版工作台與分類。

## v0.1.0 核心 — 歷史記錄
- 工程規格：`docs/plans/iteration-01.md`；功能狀態：`feature_list.json` 的 `iteration-01-core` 為通過。
- 已實作：166 項資料定義、grapheme 安全引擎、繁中介面、搜尋／分類／相同輸出合併、收藏、淺深色、字級、匯出／匯入備份、單項與篩選結果複製。
- 分類：字母樣式 73、疊加效果 22、框飾與間隔 51、轉換工具 20；不是 166 套獨立字型。
- 本機啟動：雙擊 `啟動字樣工坊.cmd`，或 `python3 start.py`；僅綁定 127.0.0.1。Windows 啟動器可找到 Hermes 附帶 Python，不依賴 Explorer PATH。
- 來源授權：`THIRD_PARTY_NOTICES.md` 與 `web/licenses/`；資料由 `sources/` 可離線重建，已核對重建 SHA-256 完全相同。

## v0.1.0 驗證證據 — 歷史記錄
- `npm test`：147／147 JavaScript 測試通過，內含 4,560 筆上游相容輸出比對；`npm run check` 退出碼 0。
- `python3 -m unittest discover -s tests -p "test_*.py" -v`：8／8 通過。
- 本機 Node／npm 版本有警告，未改動全域環境；另用 `node --test tests/*.test.mjs` 與三個 `node --check` 直接執行也通過。日常使用不需 Node／npm。
- 真實瀏覽器：全量 166 張卡片與引擎零差異；真實剪貼簿讀回、收藏跨載入、備份下載與匯入、故障注入的手動複製回退、HTML 純文字渲染均通過。
- 鍵盤 dialog 焦點、載入後離線轉換、390／320 CSS px 版面與 44 px 可見按鈕通過；外部資源請求與 runtime errors 均為零。
- 完整說明：`docs/verification.md`；實際工具輸出及畫面：`artifacts/`；封裝解壓縮驗證記錄：`artifacts/release-verification.json`。

## 重啟與後續
- 使用說明與測試命令：`README.md`；日常執行需現有 Python 3.10+，ZIP 不捆綁 Python。
- 不儲存輸入原文，僅保存收藏與介面偏好；搬移瀏覽器／連接埠請先匯出備份。
- 額外 Unicode 符號／顏文字大全、逐字混搭、自訂字母表、組合收藏、TTF／OTF 或圖片輸出仍未做；不等同本版已完成的分層組合與純符號鍵位表。
- 原始內部歷史保留開發者本機，不隨本公開起始快照發佈。後續擴充與遠端發佈須明確批准。
