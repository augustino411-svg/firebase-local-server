import fs from 'fs';
import path from 'path';

const uiDir = path.resolve('src/components/ui');
const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx'));

const propsToCheck = ['variant', 'size', 'asChild', 'className'];

for (const file of files) {
  const fullPath = path.join(uiDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');

  const missingProps: string[] = [];

  for (const prop of propsToCheck) {
    const jsxUsage = new RegExp(`<\\w+[^>]*\\b${prop}=`, 'g');
    const typeDef = new RegExp(`\\b${prop}\\??:\\s*`, 'g');

    const usesProp = jsxUsage.test(content);
    const definesProp = typeDef.test(content);

    if (usesProp && !definesProp) {
      missingProps.push(prop);
    }
  }

  if (missingProps.length > 0) {
    console.log(`❌ ${file} 缺少 props 定義: ${missingProps.join(', ')}`);
  } else {
    console.log(`✅ ${file} props 定義完整`);
  }
}
