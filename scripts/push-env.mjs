import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const envContent = readFileSync('.env.local', 'utf-8').replace(/^﻿/, ''); // strip BOM
const lines = envContent.split(/\r?\n/); // handle CRLF and LF

const pairs = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx < 0) continue;
  const key = trimmed.substring(0, idx).trim();
  let value = trimmed.substring(idx + 1).trim();
  // 인라인 주석 제거
  const commentMatch = value.match(/^([^#]*?)\s+#/);
  if (commentMatch) value = commentMatch[1].trim();
  if (!key) continue;
  pairs.push({ key, value });
}

console.log(`총 ${pairs.length}개 env var 처리 중...\n`);

for (const { key, value } of pairs) {
  // 기존 삭제
  try {
    execSync(`vercel env rm ${key} production --yes`, { stdio: 'pipe' });
  } catch {}

  // 재등록 (value를 stdin으로 직접 전달)
  try {
    execSync(`vercel env add ${key} production`, {
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`  ✓ ${key}`);
  } catch (e) {
    console.log(`  ✗ ${key}: ${e.stderr || e.message}`);
  }
}

console.log('\n완료!');
