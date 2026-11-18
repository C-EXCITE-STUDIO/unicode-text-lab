# v0.2.0 分層組合與純符號驗證

範圍：Windows 本機版本 v0.2.0。使用者契約：**純符號完全獨立，不加任何裝飾**。下列自動測試及瀏覽器結果均由主代理實際執行，不以資料分析子代理的自報代替。

## 自動測試

| 命令／項目 | 實際結果 |
|---|---|
| `npm test` | 166 項，166 通過，0 失敗、0 跳過 |
| `npm run check` | 五個 JavaScript 模組語法檢查，退出碼 0 |
| `node --test tests/*.test.mjs` | 不經 npm，166 項全通過 |
| `python3 -m unittest discover -s tests -p "test_*.py" -v` | 8 項全通過 |
| 上游相容模式基準 | 4,560 筆既有輸出比對仍通過 |
| 資料重建 | 166 定義，152,757 bytes，重建前後位元組相同 |
| 原始快照 | `git diff --exit-code -- sources web/licenses tests/fixtures` 退出碼 0 |

資料 SHA-256：`2cfce4e253c2e1e2900e99559721dd932801de8212d3e05725a00b049c96d946`。
語義配置 SHA-256：`71e78b810d048898c146d0a4b8ca8fdf6525dad99e618ba8a22026b284f366b9`。

完整命令、輸出、退出碼與 UTC 時間保存在 `artifacts/v0.2.0/automated-verification.json`。本機 npm／Node 的版本警告未透過修改全域環境處理；另直接執行 Node 全套測試也通過，日常啟動不依賴 Node／npm。

### 本版新增覆蓋

- 配方型別、未知欄位／ID、錯誤 slot 拒絕；每次由原文重新計算。
- 全部基底與每一單獨裝飾元件的合法配對；不是宣稱窮舉全部多層排列或所有可能輸入字串。
- 全部五套純符號與每一裝飾元件的拒絕配對；換入符號清空裝飾，反向加入也拒絕。
- 四層流程、空輸入、空白、emoji／組合重音、故障標記上限與輸入輸出限制。
- 全部 166 原始 ID／步驟保留、組合預設可拆、元件與來源註記有效。
- 鍵位表以真實引擎產生，保留大小寫、同圖多鍵、複合碼位、明確宣告的原樣映射及多字輸入鍵。
- 相同輸出只在同一語義類型內合併；舊分類偏好遷移、收藏／備份相容。
- 三處版本一致；僅 loopback、Host 檢查、安全標頭、專案檔案不外露、目錄清單與 HTTP 寫入拒絕、Explorer 最小 PATH 啟動器等既有測試仍通過。

## 真實瀏覽器

- 全量載入 166 張卡片與 166 個唯一 ID，DOM 與單項引擎輸出不一致數為 0；所有新分類數量吻合。
- 實際用鍵盤選取基底，再疊四層，得到 `🌸 【𝓐̲🔥𝓫̲】 🌸`，實際按複製後讀回系統剪貼簿完全一致。
- 選純符號後四欄值全空、全停用，fieldset 停用且有獨立模式說明；直接派送停用欄位 change 事件也無法加入邊框。
- 五套純符號鍵位表全部核對，共 284 筆輸入字元對應。圖案符號字形的 `A → ✌` 與 `a → ♋` 可區分搜尋；同套表有 94 列。
- 實際複製鍵位表圖案並讀回剪貼簿；Escape 關閉對照表，Tab 跳過符號模式全部停用裝飾。
- 實際下載收藏備份、實際選檔匯入舊格式、收藏合併後重新載入；無效匯入不破壞狀態，備份與儲存未含原文或當前配方。
- QA 瀏覽器原始 `glyph-studio:v1` 為不存在，結束後再讀回仍不存在，測試收藏／偏好沒有遺留。
- HTML 形狀輸入只顯示文字，無新建注入節點或事件執行；故障注入複製失敗時有手動回退，不宣稱是真實權限故障。
- 頁面載入後模擬離線仍可組合；家庭、膚色、國旗、按鍵 emoji 保持完整。
- 390／320 CSS px 模擬無頁面橫向溢出，可見按鈕至少 44×44 px，鍵位表不使頁面溢出。
- 最終記錄外部資源請求為空、local resources 7、runtime errors 與 unhandled rejection 為空。
- 另在 Hermes 桌面預覽開啟 `http://127.0.0.1:8787/?v=0.2.0#composer-panel`，讀回相同網址及新版工作台／分類內容。

以上不是完整 WCAG 認證、實機手機測試、螢幕閱讀器實測或任何社群平台貼上相容性保證。

## 整理與相容差異

語義資料位於 `config/style-components.json`，原始 `steps`、來源與 aliases 不變。圈字等 Unicode 字元是基底，不因外觀看似有框就當裝飾；複合舊項目歸組合預設。

`waterr:Solitude` 拆為逐字框。`waterr:Box Lines` 的原始數字 0 標記位置與其他鍵不同，組合元件統一 `[̲̅字元]`，原始單項保留。`waterr:SideSquiggles` 的原始前後位置不一，組合元件標準化字尾附加；差異另有 note，不默改快照。

## 證據與重新驗證

原專案的 `artifacts/v0.2.0/`（不加入 Git、也不收進 Git archive）包含：

- `automated-verification.json`：完整測試命令、原始輸出、退出碼與資料雜湊。
- `browser-composition-symbol.json`：多層、剪貼簿、純符號鎖定與大小寫搜尋。
- `browser-catalog-keymaps.json`、`all-style-cards.json`、`all-symbol-keymaps.jsonl`：全量卡片、分類與鍵位。
- `browser-backup-compatibility.json`、`browser-downloads/`：真下載與匯入。
- `browser-mobile-offline-safety.json`、`browser-final-checks.json`：離線、安全、尺寸、鍵盤與最終錯誤狀態。
- `desktop.png`、`composition.png`、`keymap.png`、`mobile.png`：實際畫面。
- `release-verification.json`：最終交付包的 CRC、commit、檔案雜湊、解壓後重跑測試與實際啟動結果，由封裝步驟產生。

最終 ZIP 從已提交版本建立；解壓至新的含空格路徑後，重跑 Node／Python／語法檢查，核對來源與語義配置雜湊、資料重建位元組、版本、啟動健康檢查及每個公開資源。測試用解壓服務最後關閉，不停止使用者正在看的原專案服務。

從完整解壓的交付目錄執行 README 命令即可重測。ZIP 不含 Python／Node、瀏覽器收藏或輸入資料；v0.1.0 的記錄仍保存在 `docs/verification.md`，不混用舊測試數。
