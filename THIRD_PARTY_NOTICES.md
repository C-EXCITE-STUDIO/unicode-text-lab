# 第三方來源與授權

本工具是本地衍生整理，不是 InstaFonts 的複製品，也不宣稱獲得任何上游背書。字樣資料、參考程式與本專案自寫程式的權利範圍應分開判斷；不可把 MIT 程式授權套用到所有資料。

## FontVibe

- 作者／權利標示：Funovate Technology（FontVibe，https://fontvibe.ai）。
- 專案：https://github.com/Funovate-Technology/fontvibe-fancy-text
- 資料標示：**Text styles from FontVibe**，https://fontvibe.ai/tools/fancy-font-generator ，依 **CC BY 4.0** 使用。
- CC BY 4.0：https://creativecommons.org/licenses/by/4.0/
- 資料授權全文：`web/licenses/Funovate-Technology__fontvibe-fancy-text__LICENSE.txt`。
- 參考程式的 MIT 告示：`web/licenses/Funovate-Technology__fontvibe-fancy-text__LICENSE-CODE.txt`。
- 保存快照：`sources/fontvibe-styles.json`；衍生目錄：`web/data/styles.json`。
- 衍生變更：候選資料去重、繁中命名、效果分類、搜尋詞與來源／覆蓋資訊整理；JavaScript 引擎另加 grapheme／emoji 保護、空白處理、堆疊及輸出限制。v0.2.0 新增語義分類、分層元件與可拆配方，部分裝飾在組合模式統一位置或擴展字母資格；原始 steps 與 identifiers 保留，等價來源另記 aliases。詳細差異見 `docs/verification-v0.2.0.md`。

## 其他候選來源

| 專案 | 上游權利標示 | 授權 | 本地告示 |
|---|---|---|---|
| https://github.com/waterrmalann/fancy-fonts-generator | Copyright (c) 2021 Alan | MIT | `web/licenses/waterrmalann__fancy-fonts-generator__LICENSE.txt` |
| https://github.com/ryo-a/unicode-text-decorator | Copyright (c) 2022 ryo-a | MIT | `web/licenses/ryo-a__unicode-text-decorator__LICENSE.txt` |
| https://github.com/beizhedenglong/weird-fonts | Copyright (c) 2019 Victor | MIT | `web/licenses/beizhedenglong__weird-fonts__LICENSE.txt` |

候選整合資料保存在 `sources/candidate-style-manifest.json`。不是四套項目數相加：行為相同的候選已合併，部分來源只出現在 aliases，不另外計數。

`web/licenses/` 另保存研究階段核對的 Unicode 與兩套顏文字授權副本；這不表示已匯入額外符號／顏文字大全。全部原始授權告示均保留，不改寫其英文條款。

## 對外發佈

使用者已批准公開：本專案自有程式碼採根目錄 `LICENSE` 的 MIT 授權，著作權標示為 C-EXCITE-STUDIO。公開倉庫及下載包仍延續第三方資料與程式的原署名／授權；FontVibe 資料維持 CC BY 4.0，不被自有程式的 MIT 授權覆蓋。本文件不代替法律意見，也不把第三方資料改授權為本專案專有資料。
