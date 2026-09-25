import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'handover/FILE_MANIFEST.json'), 'utf8'));
if (manifest.format !== 1 || manifest.algorithm !== 'sha256' || !Array.isArray(manifest.files)) throw Error('Unsupported manifest.');
let checked = 0;
for (const entry of manifest.files) {
  const path = resolve(root, entry.path);
  if (!path.startsWith(resolve(root) + sep)) throw Error('Invalid manifest path.');
  if ((await stat(path)).size !== entry.bytes) throw Error(`Size mismatch: ${entry.path}`);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  if (hash.digest('hex') !== entry.sha256) throw Error(`Checksum mismatch: ${entry.path}`);
  checked++;
}
console.log(`Verified ${checked} file checksums. The manifest excludes itself.`);
