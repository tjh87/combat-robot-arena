import {readFileSync,writeFileSync} from 'node:fs';
function edit(path,fn){writeFileSync(path,fn(readFileSync(path,'utf8')));}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing online lifecycle anchor: '+a.slice(0,100));return s.replace(a,b);}
edit('server/gateway.ts',s=>{s=replace(s,"socket.on('close',()=>void this.detach(peer));","socket.on('close',()=>void this.detach(peer).catch(()=>{}));");s=replace(s,'private async exit(peer:Peer){if(!peer.room)return;','private async exit(peer:Peer){if(!peer.room)return;if(this.closing){peer.room=undefined;peer.epoch=undefined;return;}');s=replace(s,'void this.claim(next);','void this.claim(next).catch(()=>{});');return s;});
edit('src/online/client.ts',s=>{s=replace(s,'private pending:unknown[]=[];','private pending:unknown[]=[];private previousSocket?:WebSocket;');s=replace(s,"this.change('connected');old?.close(1000,'Connection renewed.');","this.previousSocket=old;this.change(this.room?'reconnecting':'connected');");s=replace(s,"this.room=message.room;localStorage.setItem","this.room=message.room;this.previousSocket?.close(1000,'Connection renewed.');this.previousSocket=undefined;this.change('connected');localStorage.setItem");return s;});
edit('src/online/ui.ts',s=>{
 s=replace(s,'this.hooks.renderer.update(this.sim,Math.min(dt,.1));','this.hooks.renderer.observeFrame(Math.min(dt,.1));this.hooks.renderer.update(this.sim,Math.min(dt,.1));');
 s=replace(s,"'+(this.side>=0?'Your robot POV':'Follow robot POV')+'","${this.side>=0?'Your robot POV':'Follow robot POV'}");
 s=replace(s,'tick:this.latest?.tick??0,ping:this.connection.ping','tick:this.latest?.tick??0,ping:this.connection.ping,framePhase:this.latest?.phase,result:this.latest?.result,ack:this.latest?.ack,viewer:this.hooks.renderer.viewerBotId,positions:this.latest?.bodies.filter(p=>p.id.endsWith(\':chassis\')).map(p=>p.p)');
 s=replace(s,'private options=false;','private options=false;private networkTimer?:ReturnType<typeof setInterval>;private readonly keyChanged=()=>{this.sentAt=-Infinity;this.sendControls(performance.now());};');
 s=replace(s,"()=>this.changeCamera());this.hooks.renderer.mode='menu';","()=>this.changeCamera(),()=>{if(this.playing){this.actions.push({id:++this.actionId,kind:'recover'});this.keyChanged();}});window.addEventListener('keydown',this.keyChanged);window.addEventListener('keyup',this.keyChanged);this.networkTimer=setInterval(()=>this.sendControls(performance.now()),1000/60);this.hooks.renderer.mode='menu';");
 const begin=s.indexOf(' tick(now:number,dt:number){'),body=s.indexOf('const command=',begin),end=s.indexOf('\n  if(this.sim&&this.latest)',body);
 if(begin<0||body<0||end<0)throw Error('The online control loop is absent.');
 const controls=s.slice(body,end);
 s=s.slice(0,begin)+' private sendControls(now:number){if(this.stopped)return;'+controls+'}\n tick(now:number,dt:number){if(this.stopped)return;'+s.slice(end);
 s=replace(s,'this.stopped=true;this.worker?.terminate();','this.stopped=true;if(this.networkTimer)clearInterval(this.networkTimer);window.removeEventListener(\'keydown\',this.keyChanged);window.removeEventListener(\'keyup\',this.keyChanged);this.worker?.terminate();');
 return s;
});
edit('tests/bundle-audit.mjs',s=>replace(s,'(index|physics|graphics)','(index|physics|graphics|predictor)'));
edit('tests/bundle-audit.mjs',s=>replace(s,"assert.equal(scripts.length,3,'Game, graphics and physics use separate local chunks');","assert.equal(scripts.length,4,'Game, graphics, physics, and prediction use local chunks');assert.equal(scripts.filter(file=>/^assets\\/predictor-[\\w-]+\\.js$/.test(file)).length,1,'One local prediction worker is required');"));
