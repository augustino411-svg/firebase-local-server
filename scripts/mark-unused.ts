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

// 批次修改 import：加上 `_` 前綴
for (const [file, names] of fileMap.entries()) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf-8');
  for (const name of names) {
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    content = content.replace(regex, `_${name}`);
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`✅ updated: ${file}`);
}
