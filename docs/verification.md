# 第一輪驗證記錄

範圍：Windows 本機版本 v0.1.0。以下是實際工具執行結果，不是只做語法檢查或代理自報。

## 自動測試

| 命令／項目 | 實際結果 |
|---|---|
| `npm test` | JavaScript 147 項，147 通過、0 失敗、0 跳過 |
| `npm run check` | 三個 JavaScript 模組語法檢查通過，退出碼 0 |
| `python3 -m unittest discover -s tests -p "test_*.py" -v` | Python 8 項全通過 |
| 不經 npm 的 `node --test tests/*.test.mjs` 與三個 `node --check` | 全通過 |
| `python3 scripts/build_data.py` | 166 個定義，分類 73／22／51／20；產物 137,229 bytes |
| 重建前後 SHA-256 比較 | 完全一致：`ea8aad5031cdddbf3b4952a0007ce88e797ad376a4f134e054e56f58f5dd25ad` |

147 項 JavaScript 測試內包含上游 120 個效果 × 38 組輸入的 4,560 筆基準輸出比對。這些比對使用相容模式；產品安全模式另有 grapheme、emoji、數字段、空輸入、Zalgo 上限與未知樣式測試。

Python 測試包含 loopback 綁定、Host 驗證、安全標頭、目錄清單禁用、專案檔案不外露、HTTP 寫入方法拒絕，以及移除 Explorer PATH 中 Python 後仍能使用 Hermes 附帶 Python 的 Windows 啟動器測試。

環境備註：此機的 npm v12.0.2 對 Node v24.13.0 會發出版本相容警告；兩個 npm 命令仍退出 0。另用 Node 直接執行測試與語法檢查也全通過。沒有為此修改電腦的 Node／npm；日常啟動不使用兩者。

## 真實瀏覽器驗證

- 全量載入 166 張卡片，166 個唯一識別碼，畫面與引擎輸出不一致數為 0。
- 繁中「哥德」、手寫搜尋、分類、無結果狀態、深色模式與空輸入停用複製正常。
- 實際按複製並讀回系統剪貼簿，結果與預覽完全相同：`探激 𝐒𝐭𝐮𝐝𝐢𝐨 👨‍👩‍👧 👍🏽 🇹🇼 𝐞́`。
- 收藏跨重新載入保留；實際下載備份，再實際選取檔案匯入兩個收藏與偏好。無效匯入未破壞既有狀態，備份未含輸入原文。
- 明確注入 clipboard 拒絕與舊式 copy 失敗，以測試錯誤分支：手動複製視窗正常開啟，未冒充複製成功。這是故障注入，不是真實瀏覽器權限故障。
- 含 `<img ... onerror=...>` 的輸入顯示為純文字，未建立圖片節點或執行 handler。
- Enter 開啟關於視窗、Escape 關閉，焦點回到原按鈕。
- 頁面載入後切為離線，仍可即時轉換；正常頁面資源載入無外部請求。
- 390 與 320 CSS 像素的手機寬度模擬無水平溢出，可見按鈕觸控尺寸均至少 44×44 CSS px。
- 所有已記錄瀏覽器檢查的 runtime error／unhandled rejection 陣列均為空。

這不是完整 WCAG 認證、實機手機測試或各社群平台貼上相容性保證。對比測試只涵蓋所檢查的淺色主要文字 tokens。

## 證據檔

原始專案的 `artifacts/`（不加入 Git，也不收進預設 Git archive）保存：

- `final-automated-verification-v2.json`：最新完整命令、輸出與退出碼；原 v1 記錄保留作歷史。
- `raw-snapshot-regression-red.json`／`raw-snapshot-regression-green.json`：Git 換行轉換造成的來源雜湊漂移，已先重現測試失敗，再以 `.gitattributes` 固定原始快照位元組並驗證修復。
- `browser-catalog-checks.json`、`browser-all-styles.json`：全量卡片比對。
- `browser-backup-checks.json`：實際下載／匯入結果。
- `browser-mobile-offline-checks.json`：鍵盤、離線與小螢幕尺寸。
- `browser-final-checks.json`：真實剪貼簿、安全回退、HTML 輸入與網路檢查。
- `desktop.png`、`desktop-dark.png`、`mobile.png`：實際畫面。
- 交付包的解壓縮與重新執行結果另外保存於 `artifacts/release-verification.json`。

## 重新驗證

從專案或完整解壓縮的交付包目錄執行 README 所列測試即可。ZIP 不含 Python／Node 執行環境，也不含使用者的瀏覽器收藏資料。
