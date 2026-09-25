import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const check=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'],{cwd:root,stdio:'inherit'});
if(check.status!==0)process.exit(check.status??1);
await build({root});
