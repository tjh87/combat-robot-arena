import {build} from 'vite';import {readFile,writeFile,unlink} from 'node:fs/promises';
const source=await readFile('src/main.ts','utf8'),html=await readFile('dist/index.html','utf8'),styles=html.match(/<link[^>]*rel="stylesheet"[^>]*>/g)??[];
const path='tests/skip-main.generated.ts';
const adapted=source.replaceAll("from './","from '../src/").replaceAll("import './","import '../src/").replaceAll("new URL('./","new URL('../src/");
await writeFile(path,adapted+`
export function fixtureStatus(){return{state,round:tournament?.round,champion:tournament?.champion?.name,eliminated:tournament?.eliminated,pending:tournament?.matches[tournament.round].filter(m=>!m.winner).length,condition:tournament?.condition,startHP:sim?.bots[0].startHP.chassis,reasons:tournament?.matches.map(r=>r.map(m=>m.reason))};}
export function fixtureWin(winner:0|1=0){if(!tournament||state!=='fighting')throw Error('No active tournament fight');sim.bots[0].modules.chassis.hp-=100;sim.finish('Judges’ decision',winner);showResult();}
`);
try{await build({configFile:false,publicDir:false,build:{outDir:'dist',emptyOutDir:false,target:'es2022',lib:{entry:path,formats:['es'],fileName:'skip-fixture'}}});await writeFile('dist/tournament-skip-fixture.html','<!doctype html><html><head>'+styles.join('')+'</head><body><div id="app"></div><script type="module">import * as fixture from "/skip-fixture.js";window.fixture=fixture;window.fixtureReady=true;</script></body></html>');}finally{await unlink(path);}
