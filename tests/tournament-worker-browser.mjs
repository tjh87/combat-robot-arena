import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.RUNNER_TEMP+'/browser/node_modules/playwright/index.mjs').href);
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
try {
 const p=await browser.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:4173/mode-fixture.html');
 await p.waitForFunction(()=>window.fixtureReady,undefined,{timeout:90000});
 await p.evaluate(async()=>{
  const m=window.fixture;await m.initializePhysics();
  const config=m.preset(10);config.identity.name='Worker Custom';config.components={weapon:'quantum',drive:'quantum'};
  const tournament=new m.Tournament(config,false,7189);
  // Run every seeded entrant through real worker physics. No result is injected.
  tournament.entries[0].player=false;
  const evidence={rounds:[],progress:0,responsive:0,done:false};window.workerCup=evidence;
  const heartbeat=setInterval(()=>evidence.responsive++,20);
  const runner=new m.TournamentRunner(tournament,()=>{
   evidence.progress++;
   if(tournament.fault){evidence.error=tournament.fault;runner.dispose();clearInterval(heartbeat);evidence.done=true;return;}
   const round=tournament.matches[tournament.round];
   if(!round.every(match=>match.winner))return;
   evidence.rounds.push(round.map(match=>({a:match.a.name,b:match.b.name,winner:match.winner.name,reason:match.reason})));
   tournament.advance();
   if(tournament.champion){evidence.champion=tournament.champion.name;runner.dispose();clearInterval(heartbeat);evidence.done=true;}
  });
  const canceled=runner.worker;runner.retry();if(runner.worker===canceled)throw Error('Retry did not replace the worker');
 });
 await p.waitForFunction(()=>window.workerCup.done,undefined,{timeout:600000,polling:250});
 const report=await p.evaluate(()=>window.workerCup);
 await writeFile('browser-evidence/tournament-worker.json',JSON.stringify({source:process.env.GITHUB_SHA,report,errors},null,2));
 assert(!report.error,report.error);assert.deepEqual(report.rounds.map(r=>r.length),[4,2,1]);assert(report.champion);assert(report.responsive>100);assert.deepEqual(errors,[]);
 console.log('PASS seven real worker fights, three tournament rounds, champion, and responsive browser');
} finally {await browser.close();}
