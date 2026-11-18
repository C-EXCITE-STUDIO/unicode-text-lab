# 字樣工坊工程規則

- 繁體中文介面與文件；程式識別碼保持原始資料不變。
- 本專案零 npm 依賴；禁止加入遠端 CDN、追蹤、外部轉換 API。
- 每次行為變更先加測試；驗證 `npm test`、`npm run check`、`python3 -m unittest discover -s tests -p "test_*.py"`。
- 本地伺服器只能綁定 127.0.0.1，只服務 web/，不可暴露專案根目錄或 .git。
- 字體、符號字形、裝飾、工具與組合預設分開計數；單個符號／顏文字條目不得灌入字體數。166 是既有定義總數，不是 166 套字體。
- 第三方資料保留來源、授權與雜湊。
- 本輪範圍為 `docs/plans/iteration-02-layered-selection.md`：分類、分層組合與符號鍵位表；純符號完全獨立，不加任何裝飾。後續擴充仍須使用者批准。
- 完成後更新 memory/progress.md、feature_list.json 並提交本地 commit；不 push。
