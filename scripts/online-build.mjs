import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.online',{recursive:true});
await build({entryPoints:['server/vercel-entry.ts'],outfile:'.online/online.mjs',platform:'node',target:'node24',format:'esm',bundle:true,sourcemap:false,packages:'bundle',external:['bufferutil','utf-8-validate'],banner:{js:"import {createRequire as __createRequire} from 'node:module';const require=__createRequire(import.meta.url);"}});
