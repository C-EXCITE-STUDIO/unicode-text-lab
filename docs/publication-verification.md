# v0.2.0 公開版本與授權驗證

公開來源：<https://github.com/C-EXCITE-STUDIO/unicode-text-lab>。

## 授權

- 自有程式碼提供完整根目錄 `LICENSE`，採 MIT，著作權標示 C-EXCITE-STUDIO。
- `package.json` 的 `license` 為 MIT；`private: true` 僅避免誤發 npm，不代表 GitHub 倉庫是私有。
- README 與第三方告示明列：FontVibe 資料仍採 CC BY 4.0，其他來源沿用其 MIT 告示。原始授權副本與衍生變更說明保留。

## 實際驗證

公開前新增兩項授權回歸測試，先確認缺少 LICENSE／授權說明時失敗，再加入授權檔與說明後通過。

- `npm test`／直接 Node 測試：168 項，0 失敗。
- `npm run check`：五個 JavaScript 模組語法檢查通過。
- `python3 -m unittest discover -s tests -p "test_*.py" -v`：8 項通過。
- 原有 4,560 筆上游相容比對、Unicode 安全、分層組合及純符號獨立規則仍通過。
- 字樣資料仍為 166 個定義；新增的是授權測試，不是新增兩套字體。

本檔補充先前的 [分層版本驗證](verification-v0.2.0.md)。舊記錄的 166 項 JavaScript 測試是加入兩項授權測試以前的真實結果，並未改寫成新數字。

## 公開邊界

公開版使用乾淨的起始 Git 歷史。內部完整歷史、vault、使用者本機路徑、測試下載與瀏覽器資料不公開。僅公開程式、可追溯來源資料、授權、測試與必要文件。

已對原始歷史做已知憑證格式掃描，未見匹配；發現的本機路徑只在內部進度文件，公開副本已清理。這是範圍明確的檢查，不等同完整安全認證。

公開快照提交後仍須從交付 ZIP 解壓重測、核對 CRC／雜湊／版本與實際 loopback 啟動；發佈端另核對 GitHub 公開狀態、MIT 識別、遠端 SHA 與 Release 下載檔案。完整原始工具輸出保留本機，不隨下載包發佈。
