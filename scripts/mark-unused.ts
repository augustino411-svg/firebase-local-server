import fs from 'fs';
import path from 'path';

// 讀取 ts-prune 的結果
const pruneOutput = fs.readFileSync('unused.txt', 'utf-8');
const lines = pruneOutput.split('\n');

// 只處理 src/ 開頭的檔案
const targets = lines
  .map(line => {
    const match = line.match(/(src\/.+?):\d+ - (\w+)/);
    return match ? { file: match[1], name: match[2] } : null;
  })
  .filter(Boolean) as { file: string; name: string }[];

// 建立檔案對應表
const fileMap = new Map<string, Set<string>>();
for (const { file, name } of targets) {
  if (!fileMap.has(file)) fileMap.set(file, new Set());
  fileMap.get(file)!.add(name);
}

// 建立備份資料夾
const backupDir = path.resolve('scripts/backup');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// 批次修改 import 與參數：加上 `_` 前綴
let totalChanges = 0;

for (const [file, names] of fileMap.entries()) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;

  for (const name of names) {
    // 只改 import 或參數定義，不改函式內部邏輯
    const importRegex = new RegExp(`(import\\s+\\{[^}]*?)\\b${name}\\b`, 'g');
    const paramRegex = new RegExp(`(function\\s+\\w+\\([^)]*?)\\b${name}\\b`, 'g');
    const typeRegex = new RegExp(`(\\b${name}\\s*:\\s*)any\\b`, 'g');

    content = content.replace(importRegex, `$1_${name}`);
    content = content.replace(paramRegex, `$1_${name}`);
    content = content.replace(typeRegex, `$1unknown /* was any */`);
  }

  if (content !== original) {
    // 備份原始檔案
    const backupPath = path.join(backupDir, path.basename(file));
    fs.writeFileSync(backupPath, original, 'utf-8');

    // 寫入修改後內容
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ updated: ${file}`);
    totalChanges++;
  }
}

console.log(`🎉 Done. ${totalChanges} files updated.`);
