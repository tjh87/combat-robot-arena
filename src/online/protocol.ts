import {compile,SLOTS,copy} from '../model';
import {hydraSleekWheels} from '../hydra-wheels';
import type {BotConfig,Module,Slot,Vec,Quat} from '../model';
import type {Result,VisualFrame,Command} from '../sim';
export const ONLINE_PROTOCOL=1;
export const ROOM_LIMITS={duel:2,tournament:8,ttlSeconds:3600,reconnectMs:60000,inputExpiryMs:250,repairMs:45000,connectionRenewMs:240000} as const;
export type RoomMode='duel'|'tournament';
export type RoomPhase='lobby'|'countdown'|'fight'|'repair'|'finished'|'recovering';
export type RoomPlayer={id:string,name:string,config:BotConfig,ready:boolean,ai:boolean,condition?:Record<Slot,number>,modules?:Record<Slot,Module>,repairDone?:boolean};
export type RoomMatch={id:string,a:string,b:string,status:'pending'|'active'|'finished',seed:number,winner?:string,result?:Result};
export type OnlineRoom={id:string,code:string,host:string,mode:RoomMode,phase:RoomPhase,players:RoomPlayer[],entrants:RoomPlayer[],rounds:RoomMatch[][],round:number,current:number,version:number,seed:number,hazards:boolean,difficulty:'easy'|'medium'|'hard',created:number,updated:number,repairUntil?:number,champion?:string,error?:string};
export type ActionKind='weapon'|'selfRight'|'recover';
export type InputAction={id:number,kind:ActionKind};
export type OnlineInput={type:'input',match:string,seq:number,left:number,right:number,actions:InputAction[]};
export type BodyPose={id:string,p:Vec,q:Quat,v:Vec,w:Vec};
export type BotPublicState={crushForce?:number,crushAngle?:number,crushPhase?:string,energy:number,charges:number,rpm:number,weaponOn:boolean,weaponWatts:number,actuatorTorque:number,grounded:boolean,flipStart:number,flipAngle:number,flipWork:number,lastFire:number,rollStart:number,count:number,modules:Record<Slot,Module>,partIds:string[],driveSign:number,spinDirection:number,trackPhase?:number[],batteryFire?:unknown};
export type OnlineFrame={match:string,epoch:number,serial:number,tick:number,serverTime:number,phase:'countdown'|'fight'|'finished'|'recovering',countdown:number,configs:[BotConfig,BotConfig],bodies:BodyPose[],bots:BotPublicState[],hazards:{id:number,phase:string,cycle:number}[],debris:{id:string,part:unknown,body:BodyPose}[],visual:VisualFrame,result?:Result,ack:number[],actionAck:number[],flipHints:unknown[],physicsMs:number};
export type Welcome={type:'welcome',protocol:number,guest:string};
export type RoomMessage={type:'room',room:OnlineRoom,you:string};
const models=new Map<string,{modules:any,ids:string[]}[]>();
function staticModels(match:string,configs:[BotConfig,BotConfig]){let cached=models.get(match);if(!cached){cached=configs.map(config=>{const built=compile(config,true),ids=built.parts.map(p=>p.id);if(config.chassis.profile==='huge'&&config.drive.traction!=='tracks'||hydraSleekWheels(config))for(const body of new Set(built.parts.filter(p=>p.body.startsWith('wheel_')).map(p=>p.body)))ids.push(body+'_contact');return{modules:built.modules,ids};});models.set(match,cached);if(models.size>32)models.delete(models.keys().next().value!);}return cached;}
function compactBots(frame:OnlineFrame){const staticData=staticModels(frame.match,frame.configs);return frame.bots.map((bot,side)=>{const {modules,partIds,...rest}=bot,set=new Set(partIds),bits=new Uint8Array(Math.ceil(staticData[side].ids.length/8));staticData[side].ids.forEach((id,i)=>{if(set.has(id))bits[i>>3]|=1<<(i&7);});return{...rest,hp:SLOTS.map(s=>modules[s].hp),functional:SLOTS.reduce((mask,s,i)=>mask|(modules[s].functional?1<<i:0),0),parts:btoa(Array.from(bits,n=>String.fromCharCode(n)).join(''))};});}
function expandBots(frame:any){const staticData=staticModels(frame.match,frame.configs);frame.bots=frame.bots.map((bot:any,side:number)=>{const modules=copy(staticData[side].modules);SLOTS.forEach((s,i)=>{modules[s].hp=bot.hp[i];modules[s].functional=Boolean(bot.functional&(1<<i));});const raw=atob(bot.parts),partIds=staticData[side].ids.filter((id,i)=>(raw.charCodeAt(i>>3)&(1<<(i&7)))!==0),{hp,functional,parts,...rest}=bot;return{...rest,modules,partIds};});return frame;}

export const FRAME_MAGIC=0x43524131;
// JSON metadata is infrequent. Body transforms use fixed-size float records.
export function encodeFrame(frame:OnlineFrame):Uint8Array{
 const {bodies,...rest}=frame,metadata=new TextEncoder().encode(JSON.stringify({...rest,bots:compactBots(frame),visual:{...rest.visual,transforms:[]},bodyIds:bodies.map(b=>b.id)})),size=12+metadata.length+bodies.length*52,buffer=new ArrayBuffer(size),view=new DataView(buffer);view.setUint32(0,FRAME_MAGIC);view.setUint32(4,metadata.length);view.setUint16(8,bodies.length);view.setUint16(10,ONLINE_PROTOCOL);new Uint8Array(buffer,12,metadata.length).set(metadata);let at=12+metadata.length;for(const b of bodies)for(const n of[b.p.x,b.p.y,b.p.z,b.q.x,b.q.y,b.q.z,b.q.w,b.v.x,b.v.y,b.v.z,b.w.x,b.w.y,b.w.z]){view.setFloat32(at,n);at+=4;}return new Uint8Array(buffer);
}
export function decodeFrame(bytes:Uint8Array):OnlineFrame{
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(bytes.byteLength<12||view.getUint32(0)!==FRAME_MAGIC||view.getUint16(10)!==ONLINE_PROTOCOL)throw Error('Unsupported online frame.');const length=view.getUint32(4),count=view.getUint16(8);if(length>1024*1024||12+length+count*52!==bytes.byteLength)throw Error('Invalid online frame length.');const metadata=JSON.parse(new TextDecoder().decode(bytes.subarray(12,12+length))),ids=metadata.bodyIds;delete metadata.bodyIds;if(!Array.isArray(ids)||ids.length!==count)throw Error('Invalid online body list.');let at=12+length;metadata.bodies=ids.map((id:string)=>{const f=()=>{const n=view.getFloat32(at);at+=4;if(!Number.isFinite(n))throw Error('Invalid body transform.');return n;};return{id,p:{x:f(),y:f(),z:f()},q:{x:f(),y:f(),z:f(),w:f()},v:{x:f(),y:f(),z:f()},w:{x:f(),y:f(),z:f()}};});metadata.visual.transforms=metadata.bodies.map(({id,p,q}:BodyPose)=>({id,p,q}));return expandBots(metadata);
}
export function validRoomCode(code:unknown):code is string{return typeof code==='string'&&/^[1-9]\d{3}$/.test(code);}
export function validateInput(value:any):OnlineInput{
 if(!value||value.type!=='input'||typeof value.match!=='string'||value.match.length>64||!Number.isSafeInteger(value.seq)||value.seq<0||value.seq>0xffffffff||!Number.isFinite(value.left)||!Number.isFinite(value.right)||Math.abs(value.left)>1||Math.abs(value.right)>1||!Array.isArray(value.actions)||value.actions.length>64)throw Error('Invalid online controls.');let last=0;for(const a of value.actions){if(!a||!Number.isSafeInteger(a.id)||a.id<=last||a.id>0xffffffff||!['weapon','selfRight','recover'].includes(a.kind))throw Error('Invalid online action.');last=a.id;}return{type:'input',match:value.match,seq:value.seq,left:value.left,right:value.right,actions:value.actions.map((a:InputAction)=>({id:a.id,kind:a.kind}))};
}
