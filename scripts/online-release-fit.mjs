import {readFileSync,writeFileSync} from 'node:fs';
function edit(path,fn){writeFileSync(path,fn(readFileSync(path,'utf8')));}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing release anchor: '+a.slice(0,100));return s.replace(a,b);}
edit('server/gateway.ts',s=>{
 s=replace(s,'currentMatch,leaveRoom,transferHost}','currentMatch,leaveRoom,transferHost,retryRoom}');
 s=replace(s,"if(value.type==='start'){const room=", "if(value.type==='start'){if(this.engines.size+this.claiming.size>=2)throw Error('This game server is full. Try again after a fight ends.');const room=");
 s=replace(s,"if(value.type==='repair'){", "if(value.type==='retry'){const room=await retryRoom(peer.room,peer.guest);this.send(peer,{type:'room',room,you:peer.guest});await this.claim(room);return;}if(value.type==='repair'){");
 s=replace(s,'if(this.engines.size>=1)return;','if(this.engines.size+this.claiming.size>=2)return;');return s;
});
edit('server/rooms.ts',s=>s+`\nexport async function retryRoom(id:string,guest:string){return(await mutate(id,room=>{if(room.host!==guest)throw Error('Only the room host can resume the saved fight.');if(room.phase!=='recovering')throw Error('This fight does not need a restart.');room.phase='countdown';delete room.error;})).room;}\n`);
edit('server/engine.ts',s=>{
 s=replace(s,'publishFrame,present}','publishFrame,present,mutate}');
 s=replace(s,'this.previous=performance.now();','if(this.started&&this.room.phase===\'countdown\')await this.markFight();this.previous=performance.now();');
 s=replace(s,'if(this.countdown===0)this.started=true;','if(this.countdown===0){this.started=true;void this.markFight().catch(()=>this.stop(false));}');
 s=replace(s,'  const wall=Date.now();','  if(this.sim.fault){void this.fail(this.sim.fault);return;}const wall=Date.now();');
 s=replace(s,'if(this.sim.fault)void this.fail(this.sim.fault);else if(this.sim.result)void this.finish();','if(this.sim.result)void this.finish();');
 s=replace(s,' private async observeConnections(){',` private async markFight(){const {room}=await mutate(this.room.id,room=>{if(currentMatch(room)?.id===this.match&&room.phase==='countdown')room.phase='fight';},{match:this.match,token:this.token});this.room=room;}
 private async observeConnections(){`);
 s=replace(s,'async save(){if(this.stopped)return;','async save(){if(this.stopped||this.sim?.fault)return;');
 s=replace(s,"private async fail(reason:string){if(this.finishing||this.stopped)return;this.finishing=true;try{await this.save();}finally{await this.stop(false);}}",`private async fail(reason:string){if(this.finishing||this.stopped)return;this.finishing=true;try{await mutate(this.room.id,room=>{if(currentMatch(room)?.id===this.match){room.phase='recovering';room.error=reason;}},{match:this.match,token:this.token});}catch{}finally{await this.stop(false);}}`);
 s=replace(s,'await release(this.match,this.token);','await release(this.match,this.token).catch(()=>{});');return s;
});
edit('src/online/ui.ts',s=>{
 s=replace(s,"this.connection.onState=()=>this.lobby();","this.connection.onState=state=>{if(state==='connected')this.error='';this.lobby();};");
 s=replace(s,"get playing(){return this.connection.state==='connected'", "get playing(){return this.room?.phase!=='recovering'&&this.connection.state==='connected'");
 s=replace(s,'this.room=room;this.config=',"this.room=room;if(room.error)this.error=room.error;else if(room.phase!=='recovering')this.error='';this.config=");
 s=replace(s,"this.currentMatch=match?.id??'';","const nextMatch=match?.id??'';if(nextMatch!==this.currentMatch||room.phase==='recovering'){this.input.clear();this.actions=[];}this.currentMatch=nextMatch;");
 s=replace(s,"<div class=\"online-bracket\">", "${room.phase==='recovering'&&host?'<p>No winner was recorded.</p><button id=\"online-retry\" class=\"primary\">Resume saved fight</button>':''}<div class=\"online-bracket\">");
 s=replace(s,"on('online-repair',", "on('online-retry',()=>this.connection.send({type:'retry'}));on('online-repair',");
 s=replace(s,"this.worker.onmessage=event=>{if(event.data.type==='prediction'", "this.worker.onmessage=event=>{if(event.data.type==='prediction-error'){this.worker?.terminate();this.worker=undefined;this.predicted=[];return;}if(event.data.type==='prediction'");return s;
});
