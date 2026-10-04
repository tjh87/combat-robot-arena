import {ONLINE_PROTOCOL,ROOM_LIMITS,decodeFrame,type OnlineRoom,type OnlineFrame} from './protocol';
import type {BotConfig} from '../model';
export type ConnectionState='connecting'|'connected'|'reconnecting'|'closed';
export class RoomConnection{
 socket?:WebSocket;guest='';room?:OnlineRoom;state:ConnectionState='closed';ping=0;offset=0;
 private samples:number[]=[];private reconnectTimer?:ReturnType<typeof setTimeout>;private heartbeat?:ReturnType<typeof setInterval>;private handshake?:ReturnType<typeof setTimeout>;private attempts=0;private stopped=false;private connecting=false;private candidate?:WebSocket;private abort?:AbortController;private opened=0;private lastMessage=0;private pending:unknown[]=[];
 onRoom:(room:OnlineRoom)=>void=()=>{};onFrame:(frame:OnlineFrame)=>void=()=>{};onState:(state:ConnectionState)=>void=()=>{};onError:(message:string)=>void=()=>{};
 constructor(readonly config:()=>BotConfig,readonly name:()=>string,readonly endpoint='/api/online'){}
 private change(state:ConnectionState){if(this.state!==state){this.state=state;this.onState(state);}}
 async connect(){
  if(this.stopped||this.connecting)return;
  clearTimeout(this.reconnectTimer);this.connecting=true;
  if(this.socket?.readyState!==WebSocket.OPEN)this.change(this.attempts||this.room?'reconnecting':'connecting');
  const abort=new AbortController();this.abort=abort;const deadline=setTimeout(()=>abort.abort(),10000);
  try{
   const response=await fetch(this.endpoint+'?session=1',{credentials:'same-origin',cache:'no-store',signal:abort.signal});
   if(!response.ok)throw Error('The online service is unavailable.');
   const session=await response.json();if(session.protocol!==ONLINE_PROTOCOL)throw Error('Refresh the game to update online support.');
   if(this.stopped)return;
   const url=new URL(this.endpoint,location.href);url.protocol=url.protocol==='https:'?'wss:':'ws:';
   const socket=new WebSocket(url,['arena.v1','ticket.'+session.ticket]);socket.binaryType='arraybuffer';this.candidate=socket;
   this.handshake=setTimeout(()=>this.lost(socket),15000);
   socket.onmessage=event=>{
    if(this.stopped||socket!==this.socket&&socket!==this.candidate)return;
    if(socket===this.socket)this.lastMessage=Date.now();
    try{
     if(typeof event.data!=='string'){if(socket===this.socket)this.onFrame(decodeFrame(new Uint8Array(event.data)));return;}
     const message=JSON.parse(event.data);
     if(message.type==='welcome'){
      if(message.protocol!==ONLINE_PROTOCOL)throw Error('Refresh the game to update online support.');
      const saved=this.room??this.saved();
      if(saved)socket.send(JSON.stringify({type:'join',code:saved.code,expectedId:saved.id,name:this.name(),config:this.config()}));
      else this.promote(socket,message.guest);
     }else if(message.type==='room'){
      if(socket===this.candidate)this.promote(socket,session.guest);
      this.room=message.room;localStorage.setItem('cra.online.room',JSON.stringify({id:this.room!.id,code:this.room!.code}));this.onRoom(this.room!);
     }else if(message.type==='pong'){
      const rtt=Date.now()-message.at;if(rtt>=0&&rtt<5000){this.ping=rtt;this.samples.push(message.serverTime-message.at-rtt/2);this.samples=this.samples.slice(-9);this.offset=[...this.samples].sort((a,b)=>a-b)[Math.floor(this.samples.length/2)];}
     }else if(message.type==='renew'){if(socket===this.socket)void this.connect();}
     else if(message.type==='error'){
      if(/expired|number changed/.test(message.message)){localStorage.removeItem('cra.online.room');this.room=undefined;if(socket===this.candidate)this.promote(socket,session.guest);}
      else if(socket===this.candidate)this.lost(socket);
      this.onError(message.message);
     }
    }catch(e){this.onError(e instanceof Error?e.message:'Invalid online state.');if(socket===this.candidate)this.lost(socket);}
   };
   socket.onclose=event=>{
    if(socket!==this.socket&&socket!==this.candidate)return;
    if(event.code===4002&&socket===this.socket){this.stop();this.onError('This player resumed in another window.');return;}
    this.lost(socket);
   };
   socket.onerror=()=>{};
  }catch(e){
   if(!this.stopped){this.connecting=false;this.onError(e instanceof Error?e.message:'Connection failed.');this.retry();}
  }finally{clearTimeout(deadline);if(this.abort===abort)this.abort=undefined;}
 }
 private promote(socket:WebSocket,guest:string){
  const old=this.socket;this.socket=socket;this.candidate=undefined;this.guest=guest;this.connecting=false;this.attempts=0;this.opened=this.lastMessage=Date.now();clearTimeout(this.handshake);clearTimeout(this.reconnectTimer);this.change('connected');
  if(this.heartbeat)clearInterval(this.heartbeat);
  this.heartbeat=setInterval(()=>{
   if(this.socket?.readyState!==WebSocket.OPEN)return;
   if(Date.now()-this.lastMessage>12000){this.lost(this.socket);return;}
   this.send({type:'ping',at:Date.now()});
   if(Date.now()-this.opened>ROOM_LIMITS.connectionRenewMs-10000)void this.connect();
  },2000);
  for(const value of this.pending.splice(0))this.send(value);
  if(old&&old!==socket)old.close(1000,'Connection renewed.');
 }
 private lost(socket:WebSocket){
  if(this.stopped||socket!==this.socket&&socket!==this.candidate)return;
  if(socket===this.candidate){this.candidate=undefined;this.connecting=false;clearTimeout(this.handshake);}
  if(socket===this.socket){this.socket=undefined;if(this.heartbeat)clearInterval(this.heartbeat);}
  socket.close(4001,'Connection retry.');this.retry();
 }
 private retry(){
  if(this.stopped)return;
  if(this.socket?.readyState!==WebSocket.OPEN)this.change('reconnecting');
  clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>void this.connect(),Math.min(5000,250*2**Math.min(this.attempts++,5))+Math.random()*150);
 }
 send(value:unknown){if(this.socket?.readyState===WebSocket.OPEN&&this.socket.bufferedAmount<64*1024)this.socket.send(JSON.stringify(value));}
 request(value:unknown){if(this.state==='connected')this.send(value);else if(this.pending.length<32)this.pending.push(value);}
 create(mode:'duel'|'tournament',hazards:boolean){this.request({type:'create',mode,name:this.name(),config:this.config(),hazards});}
 join(code:string){this.request({type:'join',code,name:this.name(),config:this.config()});}
 leave(){this.send({type:'leave'});this.room=undefined;localStorage.removeItem('cra.online.room');}
 stop(){this.stopped=true;this.abort?.abort();clearTimeout(this.reconnectTimer);clearTimeout(this.handshake);if(this.heartbeat)clearInterval(this.heartbeat);this.candidate?.close(1000,'Online view closed.');this.socket?.close(1000,'Online view closed.');this.candidate=undefined;this.socket=undefined;this.change('closed');}
 private saved(){try{const value=JSON.parse(localStorage.getItem('cra.online.room')??'null');return value&&typeof value.id==='string'&&/^[1-9]\d{3}$/.test(value.code)?value:undefined;}catch{return undefined;}}
}
