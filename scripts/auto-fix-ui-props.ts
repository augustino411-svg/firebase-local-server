import fs from 'fs';
import path from 'path';

const uiDir = path.resolve('src/components/ui');
const backupDir = path.resolve('scripts/backup-ui');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const propsToCheck = ['variant', 'size', 'asChild', 'className'];

const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const fullPath = path.join(uiDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;

  let modified = content;
  let propsBlockFound = false;

  // 找出 interface 或 type Props 定義
  const propsMatch = content.match(/(export\s+(interface|type)\s+\w*Props\s+[^{}]*{[^}]*})/s);
  if (propsMatch) {
    propsBlockFound = true;
    let propsBlock = propsMatch[1];

    for (const prop of propsToCheck) {
      const propRegex = new RegExp(`\\b${prop}\\??:\\s*`, 'g');
      const jsxRegex = new RegExp(`<\\w+[^>]*\\b${prop}=`, 'g');

      const usesProp = jsxRegex.test(content);
      const definesProp = propRegex.test(propsBlock);

      if (usesProp && !definesProp) {
        propsBlock = propsBlock.replace(/}$/, `  ${prop}?: string;\n}`);
        console.log(`➕ ${file} 補上 props: ${prop}`);
      }
    }

    modified = modified.replace(propsMatch[1], propsBlock);
  }

  if (propsBlockFound && modified !== original) {
    fs.writeFileSync(path.join(backupDir, file), original, 'utf-8');
    fs.writeFileSync(fullPath, modified, 'utf-8');
    console.log(`✅ updated: ${file}`);
  } else {
    console.log(`✅ no change: ${file}`);
  }
}