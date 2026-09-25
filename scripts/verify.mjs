import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const commands=[['node_modules/typescript/bin/tsc','--noEmit'],['tests/bundle-audit.mjs'],['tests/offline-package.mjs']];
if(process.argv.includes('--physics'))commands.push(['--import','tsx','tests/run.ts'],['--import','tsx','tests/battery-targets.ts'],['--import','tsx','tests/gyro-dance.ts']);
for(const args of commands){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
console.log('Requested checks passed. Live graphics and sound need a browser check.');
