import {readFileSync,writeFileSync} from 'node:fs';
function edit(path,a,b){const s=readFileSync(path,'utf8');if(!s.includes(a))throw Error('Missing anchor: '+path);writeFileSync(path,s.replace(a,b));}
edit('src/visuals.ts',"export function detailPart(mesh:THREE.Mesh,p:Part,c:BotConfig){","export function detailPart(mesh:THREE.Mesh,p:Part,c:BotConfig){\n if(hydraDetail(mesh,p,c))return;");
edit('src/visuals.ts',"import {ARENA_HAZARDS}","import {hydraDetail} from './hydra-finish';\nimport {ARENA_HAZARDS}");
edit('src/render.ts',"import {disposeSawbladeExposure}","import {hydraTineGeometry} from './hydra-finish';\nimport {disposeSawbladeExposure}");
edit('src/render.ts',"  if(config.chassis.profile==='sawblaze'&&p.id.startsWith('saw_nose_')){","  if(config.chassis.profile==='hydra'&&p.id.startsWith('flipper_tine_')){\n   if(!p.id.endsWith('_0'))continue;const mesh=this.part(p,config);mesh.geometry.dispose();mesh.geometry=compactGeometry(hydraTineGeometry(config,Number(p.id.split('_')[2])));mesh.name='hydra-bronze-flipper-tine';out.push({p,mesh});continue;\n  }\n  if(config.chassis.profile==='sawblaze'&&p.id.startsWith('saw_nose_')){");
