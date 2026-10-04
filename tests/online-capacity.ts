import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import WebSocket from 'ws';
import {createOnlineServer} from '../server/gateway';
import {preset} from '../src/model';
import {decodeFrame,type OnlineFrame,type OnlineRoom} from '../src/online/protocol';
import {closeStore,loadRoom} from '../server/store';
const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const site=createOnlineServer();await new Promise<void>(r=>site.server.listen(0,'127.0.0.1',r));
const port=(site.server.address() as any).port,origin='http://127.0.0.1:'+port;
type Client={socket:WebSocket,guest:string,room?:OnlineRoom,frame?:OnlineFrame,errors:string[]};
const clients:Client[]=[];
async function connect(){const response=await fetch(origin+'/api/online?session=1',{headers:{Origin:origin}});assert(response.ok);const session=await response.json();const socket=new WebSocket('ws://127.0.0.1:'+port+'/api/online',['arena.v1','ticket.'+session.ticket],{headers:{Origin:origin}});const c:Client={socket,guest:session.guest,errors:[]};clients.push(c);socket.on('message',(bytes,binary)=>{if(binary)c.frame=decodeFrame(new Uint8Array(bytes as Buffer));else{const value=JSON.parse(bytes.toString());if(value.type==='room')c.room=value.room;if(value.type==='error')c.errors.push(value.message);}});await new Promise<void>((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});return c;}
function send(c:Client,value:unknown){c.socket.send(JSON.stringify(value));}
async function wait(fn:()=>boolean,label:string,timeout=20000){const until=Date.now()+timeout;while(Date.now()<until){if(fn())return;await delay(25);}throw Error('Capacity test timeout: '+label);}
async function room(index:number){const a=await connect(),b=await connect();send(a,{type:'create',mode:'duel',name:'Host '+index,config:preset([2,10,4,7,0][index]),hazards:false});await wait(()=>Boolean(a.room),'room creation');send(b,{type:'join',code:a.room!.code,name:'Guest '+index,config:preset([0,1,6,8,3][index])});await wait(()=>a.room?.players.length===2&&b.room?.players.length===2,'room membership');send(a,{type:'ready',ready:true});send(b,{type:'ready',ready:true});await wait(()=>a.room!.players.every(p=>p.ready),'ready state');return{a,b,id:a.room!.id};}
try{
 const games=[];for(let i=0;i<4;i++){const game=await room(i);games.push(game);send(game.a,{type:'start'});await wait(()=>game.a.frame?.phase==='fight','fight '+i);}
 assert.equal(site.gateway.engines.size,4);assert.equal(new Set(games.map(g=>g.a.frame!.match)).size,4);
 const ticks=games.map(g=>g.a.frame!.tick),started=Date.now();await delay(2000);const seconds=(Date.now()-started)/1000,rates=games.map((g,i)=>(g.a.frame!.tick-ticks[i])/seconds);assert(rates.every(rate=>rate>180),JSON.stringify(rates));
 for(const [i,g]of games.entries()){send(g.a,{type:'input',match:g.a.frame!.match,seq:1,left:.4,right:.4,actions:[]});await wait(()=>g.a.frame!.ack[0]===1,'owned input '+i);assert.equal(g.b.frame!.match,g.a.frame!.match);}
 const queued=await room(4);send(queued.a,{type:'start'});await wait(()=>queued.a.errors.some(e=>e.includes('full')),'capacity response');assert.equal(queued.a.room!.phase,'lobby');
 const first=site.gateway.engines.get(games[0].id)!;first.sim.finish('Capacity fixture result',0);await wait(()=>site.gateway.engines.size===3,'slot release');send(queued.a,{type:'start'});await wait(()=>queued.a.frame?.phase==='fight','next room start');assert.equal(site.gateway.engines.size,4);
 const recovery=site.gateway.engines.get(games[1].id)!;await recovery.save();const match=recovery.match,epoch=recovery.epoch;await (recovery as any).fail('Injected checkpoint recovery fixture');await wait(()=>games[1].a.room?.phase==='recovering','visible paused fight');const paused=await loadRoom(games[1].id);assert.equal(paused!.champion,undefined);assert.equal(paused!.rounds[0][0].winner,undefined);
 send(games[1].b,{type:'retry'});await wait(()=>games[1].b.errors.some(e=>e.includes('host')),'host-only recovery');send(games[1].a,{type:'retry'});await wait(()=>games[1].a.frame?.epoch!>epoch&&games[1].a.frame?.phase==='fight','checkpoint recovery');assert.equal(games[1].a.frame!.match,match);
 mkdirSync('browser-evidence',{recursive:true});writeFileSync('browser-evidence/online-capacity.json',JSON.stringify({source:process.env.GITHUB_SHA,concurrentRooms:4,physicsTicksPerSecond:rates,separateMatches:true,ownedInputRouting:true,fullRoomRemainsLobby:true,capacityRelease:true,pausedFaultHasNoWinner:true,hostOnlyRecovery:true,checkpointMatchPreserved:true,fixture:'One injected result releases capacity. One injected fault tests checkpoint recovery.'},null,2));console.log('PASS four concurrent rooms, input routing, capacity release, and host-only checkpoint recovery');
}finally{for(const c of clients)c.socket.terminate();await delay(100);await site.gateway.stop();await new Promise<void>(r=>site.server.close(()=>r()));await closeStore();}
