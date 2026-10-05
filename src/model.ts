import {hydraSleekWheels} from './hydra-wheels';
import {hydraChassisParts,hydraFlipperParts,hydraPoint} from './hydra-geometry';
import {sawblazeSweepClearance} from './sawblaze-geometry';
import {batteryZones} from './battery-layout';
import {templateParts,sawblazeFrontParts,extendedRotor,largeWheelParts,racerWheelParts,hydraWheelParts,crusherParts} from './mechanisms';
import {WEAPON_REFERENCES,LB_TO_KG,referenceRPM} from './weapon-specs';
// Shared authored geometry and game catalogue. All physics quantities are SI.
// Keep one CCD pass so every solved contact remains available to the hit ledger.
// Swept assembly bounds provide the additional wall containment guard.
export const RULES = { id:'arena-v1', hz:240, dt:1/240, maxSteps:16, lateFrame:.25, matchTicks:43200, floor:14.63, wallHeight:7.30, maxFlightHeight:7.95, wallThickness:.60, weight:113.398, tip:111.76, repair:900, debris:30, solverIterations:12, ccdSubsteps:1, flipJoules:4200 } as const;
export const SLOTS = ['chassis','weapon','weapon_actuator','drive_left','drive_right','battery','self_right','armour_front','armour_left','armour_right','armour_rear','armour_top'] as const;
export type Slot = typeof SLOTS[number];
export const MOUNTS = ['front','left','right','rear','top'] as const;
export type Mount = typeof MOUNTS[number];
export const MATERIALS = {
  aluminium7075:{name:'7075 aluminium',density:2810,roughness:.25,metalness:.9,resistance:70,color:'#a5adb4'},
  hardox:{name:'Steel',density:7850,roughness:.45,metalness:.9,resistance:125,color:'#6b7680'},
  titanium:{name:'Titanium',density:4430,roughness:.35,metalness:.85,resistance:110,color:'#91999c'},
  uhmw:{name:'UHMW',density:940,roughness:.6,metalness:0,resistance:80,color:'#d0d5d1'},
  polycarbonate:{name:'Polycarbonate',density:1200,roughness:.1,metalness:0,resistance:50,color:'#b0c8cd'},
} as const;
export type Material = keyof typeof MATERIALS;
export const MOTORS = {
  drive48:{name:'D48 traction',kv:180,resistance:.095,noLoadCurrent:1.3,currentLimit:75,mass:1.4,efficiency:.87},
  drive48sport:{name:'D48 Sport traction',kv:210,resistance:.060,noLoadCurrent:1.8,currentLimit:120,mass:1.9,efficiency:.89},
  spin48:{name:'S48 rotor',kv:220,resistance:.035,noLoadCurrent:2.4,currentLimit:300,mass:3.2,efficiency:.91},
  spin48dual:{name:'Dual S48 fast spin-up',kv:220,resistance:.0175,noLoadCurrent:4.8,currentLimit:600,mass:6.4,efficiency:.91},
  spin48eco:{name:'S48 endurance',kv:180,resistance:.055,noLoadCurrent:1.5,currentLimit:165,mass:2.6,efficiency:.90},
} as const;
export type MotorId = keyof typeof MOTORS;
export type Vec = {x:number,y:number,z:number};
export type Quat = {x:number,y:number,z:number,w:number};
export const v=(x=0,y=0,z=0):Vec=>({x,y,z});
export const add=(a:Vec,b:Vec):Vec=>v(a.x+b.x,a.y+b.y,a.z+b.z);
export const sub=(a:Vec,b:Vec):Vec=>v(a.x-b.x,a.y-b.y,a.z-b.z);
export const mul=(a:Vec,n:number):Vec=>v(a.x*n,a.y*n,a.z*n);
export const dot=(a:Vec,b:Vec)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const cross=(a:Vec,b:Vec):Vec=>v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
export const length=(a:Vec)=>Math.hypot(a.x,a.y,a.z);
export const horizontal=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.z-b.z);
export const rotate=(p:Vec,q:Quat):Vec=>{const t=mul(cross(q,p),2);return add(p,add(mul(t,q.w),cross(q,t)));};
export const axisQ=(axis:Vec,angle:number):Quat=>({...mul(axis,Math.sin(angle/2)),w:Math.cos(angle/2)});
export const quatMul=(a:Quat,b:Quat):Quat=>({x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z});
export const identity:Quat={x:0,y:0,z:0,w:1};
export const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
export function rng(seed:number){let n=seed>>>0;const next=()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};return Object.assign(next,{getState:()=>n>>>0,setState:(state:number)=>{n=state>>>0;}});}
export const SPINNER_TYPES=['horizontal_bar','drum','vertical_disc','vertical_bar','shell_spinner','horizontal_cage','hammer_saw'] as const;
export const PROFILES=['standard','tombstone','minotaur','hydra','icewave','hypershock','gigabyte','whyachi','huge','sawblaze','deep_six','quantum'] as const;
export type Profile=typeof PROFILES[number];
export type Spinner={type:typeof SPINNER_TYPES[number],massKg?:number,armLength?:number,armTravel?:number,radius:number,innerRadius:number,width:number,thickness:number,teeth:number,toothDepth:number,toothWidth:number,toothHeight:number,material:Material,mount:Vec,motor:MotorId,ratio:number,rpm:number,direction:1|-1};
export type Flipper={type:'flipper',length:number,width:number,thickness:number,material:Material,mount:Vec,travel:number,actuator:'F3000',stroke:number,charges:number};
export type Crusher={type:'crusher',length:number,width:number,thickness:number,material:Material,mount:Vec,travel:number,torque:number};
export type Weapon=Spinner|Flipper|Crusher|{type:'none'};
export type ComponentKind='weapon'|'drive'|'selfRight'|'battery'|'armour';
export type StructuralAttachment={id:string,template:number,part:string,mount:Vec,rotation:Quat};
export function componentProfile(c:BotConfig,kind:ComponentKind):Profile{return c.components?.[kind]??c.chassis.profile??'standard';}
export function componentConfig(c:BotConfig,kind:ComponentKind):BotConfig{const profile=componentProfile(c,kind);return profile===(c.chassis.profile??'standard')?c:{...c,chassis:{...c.chassis,profile}};}
export interface BotConfig{
 schemaVersion:2;
 components?:Partial<Record<ComponentKind,Profile>>;
 attachments?:StructuralAttachment[];
 identity:{name:string,primary:string,secondary:string};
 chassis:{profile?:Profile,equipmentMassKg?:number,form:'box'|'wedge',length:number,width:number,height:number,material:Material,thickness:number,wedgeAngle:number,clearance:number};
 weapon:Weapon;
 drive:{hydraTuning?:1|2|3,traction?:'wheels'|'tracks',layout:2|4|6,radius:number,width:number,material:'rubber',motor:'drive48'|'drive48sport',ratio:number,magnet:number};
 armour:{mount:Mount,material:Material,thickness:number}[];
 battery:{pack:'P48',capacityWh:number};
 selfRight:{type:'none'}|{type:'roll_arm',mount:Vec,length:number,actuator:'R600'};
}
export type Shape={kind:'box',size:Vec}|{kind:'cylinder',radius:number,width:number}|{kind:'hull',vertices:number[],volume:number};
export function chiselShape(size:Vec):Shape{
 const y=size.y/2,z=size.z/2,section=[[-y,-z],[y*.55,-z],[y,z*.40],[-y,z]],vertices:number[]=[];
 for(const x of[-size.x/2,size.x/2])for(const [py,pz]of section)vertices.push(x,py,pz);
 const area=Math.abs(section.reduce((sum,p,i)=>{const n=section[(i+1)%section.length];return sum+p[0]*n[1]-p[1]*n[0];},0))/2;
 return{kind:'hull',vertices,volume:area*size.x};
}
export interface Part {id:string;module:Slot;body:string;shape:Shape;position:Vec;rotation:Quat;material:Material|'rubber';mass:number;collides:boolean;tooth?:number;analyticPrism?:boolean;}
export interface Module {id:Slot;present:boolean;max:number;hp:number;material:Material;functional:boolean;}
export interface Compiled {config:BotConfig;parts:Part[];mass:number;com:Vec;inertia:Vec;rotorInertia:number;modules:Record<Slot,Module>;errors:{field:string,message:string}[];tip:number;availableRPM:number;spinup:number;endurance:number;envelope:Vec;}
export const copy=<T>(x:T):T=>structuredClone(x);
const matIds=Object.keys(MATERIALS);
const motorIds=Object.keys(MOTORS);

export const ROSTER=[
 {name:'Tombstone',reference:'Tombstone',family:'Horizontal bar spinner',glyph:'━',profile:'tombstone'},
 {name:'Minotaur',reference:'Minotaur',family:'Drum spinner',glyph:'▥',profile:'minotaur'},
 {name:'Hydra',reference:'Hydra',family:'Hydraulic flipper',glyph:'⌁',profile:'hydra'},
 {name:'ICEwave',reference:'ICEwave',family:'Overhead horizontal',glyph:'✚',profile:'icewave'},
 {name:'HyperShock',reference:'HyperShock',family:'Vertical disc',glyph:'◉',profile:'hypershock'},
 {name:'Gigabyte',reference:'Gigabyte',family:'Full-body shell spinner',glyph:'◒',profile:'gigabyte'},
 {name:'Son of Whyachi',reference:'Son of Whyachi',family:'Horizontal cage',glyph:'△',profile:'whyachi'},
 {name:'HUGE',reference:'HUGE',family:'Large-wheel vertical spinner',glyph:'◎',profile:'huge'},
 {name:'SawBlaze',reference:'SawBlaze',family:'Articulated hammer-saw',glyph:'⚒',profile:'sawblaze'},
 {name:'Deep Six',reference:'Deep Six',family:'Large vertical bar',glyph:'↕',profile:'deep_six'},
 {name:'Quantum',reference:'Quantum',family:'Hydraulic crusher',glyph:'⋀',profile:'quantum'},
] as const;
export const isSpinner=(w:Weapon):w is Spinner=>SPINNER_TYPES.includes(w.type as Spinner['type']);
export const isHorizontal=(w:Weapon)=>w.type==='horizontal_bar'||w.type==='horizontal_cage'||w.type==='shell_spinner';
export const weaponAxis=(w:Weapon)=>isHorizontal(w)?v(0,1,0):v(1,0,0);
export const armOffset=(w:Spinner)=>v(0,(w.armLength??.55)*Math.sin(1.2),-(w.armLength??.55)*Math.cos(1.2));
export const WEDGE_TIP={clearance:.002,thickness:.003};
export const HYDRA_TIP={clearance:.0006,thickness:.0012};
export function groundForkMount(c:BotConfig,side:number,index:number){return c.weapon.type==='hammer_saw'?v(side*.21,-c.chassis.height/2-c.chassis.clearance+.105,-c.chassis.length/2+.08):v(side*(c.chassis.width*.30+index*.043),-c.chassis.height/2-c.chassis.clearance+.0755,-c.chassis.length/2+.035);}
export function unlimitedFlips(c:BotConfig){return componentProfile(c,'weapon')==='hydra'&&c.weapon.type==='flipper';}
export function strikeMultiplier(c:BotConfig){return componentProfile(c,'weapon')==='deep_six'?4:componentProfile(c,'weapon')==='huge'?3:unlimitedFlips(c)||isHorizontal(c.weapon)?1.5:1;}
export function flipEnergy(c:BotConfig){return RULES.flipJoules*(unlimitedFlips(c)?4.5:1);}
export function verticalSelfRight(c:BotConfig){return c.selfRight.type==='roll_arm'&&['quantum','hypershock'].includes(componentProfile(c,'selfRight'));}
export function selfRightKind(c:BotConfig):'arm'|'flipper'|'saw'|'gyro'|null{
 if(c.selfRight.type==='roll_arm')return 'arm';
 if(c.weapon.type==='flipper')return 'flipper';
 if(c.weapon.type==='hammer_saw')return 'saw';
 if(componentProfile(c,'weapon')==='minotaur'&&c.weapon.type==='drum')return 'gyro';
 return null;
}
export function isRampPart(p:Pick<Part,'id'>){return p.id==='wedge'||p.id==='flipper'||p.id.startsWith('flipper_tine_')||/^(flipper_fang|engine_plow|disc_scoop|cage_skirt|cage_plow|saw_fork|vertical_outrigger|crusher_scoop)_?/.test(p.id);}
export function batteryPosition(c:BotConfig){return batteryZones(c)[0].position;}
export function wheelBase(c:BotConfig){return componentProfile(c,'drive')==='hydra'?(c.chassis.length/.64)*.425:componentProfile(c,'drive')==='hypershock'?Math.max(c.chassis.length*.72,2*c.drive.radius+.025):c.chassis.length-2*c.drive.radius-.015;}
export function wheelCentreZ(c:BotConfig){return componentProfile(c,'drive')==='hypershock'?-.065:0;}
export function wheelPositionZ(c:BotConfig,i:number){return c.drive.layout===2?0:wheelCentreZ(c)+(i/(c.drive.layout/2-1)-.5)*wheelBase(c);}
export function bodyOrigin(c:BotConfig,body:string):Vec{
 const w=c.weapon;
 if(body==='rotor'&&w.type!=='none')return w.type==='hammer_saw'?add(w.mount,armOffset(w)):w.mount;
 if(body==='weapon_arm'&&w.type==='hammer_saw')return w.mount;
 if(body==='self_right'&&c.selfRight.type==='roll_arm')return c.selfRight.mount;
 if(body.startsWith('ground_fork_')){const a=body.split('_');return groundForkMount(c,Number(a[2]),Number(a[3]));}
 if(body.startsWith('wheel_')){const [,sideText,iText]=body.split('_'),side=Number(sideText),i=Number(iText),a=c.armour.find(a=>a.mount===(side<0?'left':'right'))!.thickness;
 return v(side*(c.chassis.width/2+a+(hydraSleekWheels(c)?Math.max(.075,c.drive.width):c.drive.width)/2+.008),c.drive.radius-(c.chassis.clearance+c.chassis.height/2),wheelPositionZ(c,i));}
 return v();
}
export const povDirection=()=>v(0,-.14,-1);
export function povMount(c:BotConfig):Vec{
 const top=c.chassis.height/2+(c.armour.find(a=>a.mount==='top')?.thickness??0),w=c.weapon,p=c.chassis.profile;
 if(w.type==='shell_spinner')return v(-.08,w.mount.y+w.width+.24,c.chassis.length*.50);
 if(p==='icewave')return v(-.08,Math.max(top+.60,w.type!=='none'?w.mount.y+.55:0),c.chassis.length*.60);
 if(w.type==='horizontal_cage')return v(-.08,Math.max(top+.28,w.mount.y+.22),c.chassis.length*.60);
 if(p==='huge')return v(-c.chassis.width*.28,top+.30,.34);
 if(w.type==='crusher')return v(-.22,top+.53,.43);
 if(p==='deep_six')return v(-c.chassis.width*.30,top+.59,.40);
 return v(w.type==='hammer_saw'?-.19:0,top+(w.type==='hammer_saw'?.35:.27),c.chassis.length*.55);
}
export function matchColors(configs:[BotConfig,BotConfig]):[BotConfig,BotConfig]{
 const out:[BotConfig,BotConfig]=[copy(configs[0]),copy(configs[1])];
 if((out[0].chassis.profile??'standard')===(out[1].chassis.profile??'standard')||out[0].identity.primary===out[1].identity.primary){
  const primary=out[0].identity.primary.toLowerCase();
  out[1].identity.primary=primary==='#f07832'?'#3685ec':'#f07832';out[1].identity.secondary=primary==='#f07832'?'#b8dcff':'#fff1c5';
 }
 return out;
}
const presetEquipmentMass=new Map<number,number>();
export function preset(index=0):BotConfig{
 if(!Number.isInteger(index)||index<0||index>=ROSTER.length)throw Error('Unknown robot preset');
 const row=ROSTER[index],c:BotConfig={schemaVersion:2,identity:{name:row.name,primary:['#262b32','#202226','#5c318c','#273e68','#e4f52c','#d6a733','#777d82','#eceee4','#212923','#23262a','#08649b'][index],secondary:['#b42529','#c2a65b','#d8ad4d','#edb82d','#f55398','#b42e35','#b82c30','#245ab1','#59c832','#a16a45','#d7e3eb'][index]},chassis:{profile:row.profile,form:index===2?'wedge':'box',length:.64,width:.58,height:.16,material:'aluminium7075',thickness:.009,wedgeAngle:25,clearance:.018},weapon:{type:'none'},drive:{layout:4,radius:.10,width:.075,material:'rubber',motor:'drive48',ratio:14,magnet:80},armour:MOUNTS.map(m=>({mount:m,material:'hardox',thickness:m==='top'?.004:.007})),battery:{pack:'P48',capacityWh:250},selfRight:{type:'none'}};
 const spin=(type:Spinner['type'],props:Partial<Spinner>):Spinner=>({type,radius:.22,innerRadius:0,width:.06,thickness:.025,teeth:2,toothDepth:.035,toothWidth:.035,toothHeight:.045,material:'hardox',mount:v(),motor:'spin48',ratio:2.4,rpm:2800,direction:1,...props});
 if(index===0){Object.assign(c.chassis,{length:.60,width:.50,height:.15,clearance:.055});Object.assign(c.drive,{layout:2,radius:.13,width:.09});c.weapon=spin('horizontal_bar',{radius:.42,width:.16,thickness:.025,teeth:2,toothDepth:.055,toothWidth:.10,toothHeight:.028,mount:v(0,-.103,-.43),rpm:2500});}
 if(index===1){c.drive.motor='drive48sport';c.drive.ratio=24;Object.assign(c.chassis,{length:.60,clearance:.082});Object.assign(c.drive,{layout:2,radius:.162,width:.070,magnet:0});c.armour.forEach(a=>{if(a.mount!=='top')a.thickness=.006;});c.weapon=spin('drum',{radius:.155,innerRadius:.113,width:.38,thickness:.035,teeth:4,toothDepth:.035,toothWidth:.34,toothHeight:.035,mount:v(0,0,-.378),ratio:1.55,rpm:6000});}
 if(index===2){c.chassis.height=.08;c.chassis.form='box';c.identity.primary='#21132f';c.identity.secondary='#6712ba';Object.assign(c.drive,{radius:.060,width:.040,ratio:8.3,hydraTuning:3});c.weapon={type:'flipper',length:.663,width:.22,thickness:.028,material:'hardox',mount:hydraPoint(c,0,.099,.143),travel:1.48,actuator:'F3000',stroke:.20,charges:8};c.drive.magnet=0;}
 if(index>=3){c.chassis.thickness=.006;c.armour.forEach(a=>a.thickness=a.mount==='top'?.003:.004);c.drive.magnet=0;}
 if(index===3){Object.assign(c.chassis,{length:.60,width:.48,height:.13});Object.assign(c.drive,{layout:4,radius:.09,width:.06});c.weapon=spin('horizontal_bar',{radius:.56,width:.125,thickness:.024,toothWidth:.085,toothHeight:.025,mount:v(0,.15,0),rpm:1850});}
 if(index===4){Object.assign(c.chassis,{length:.565,width:.36,height:.12});Object.assign(c.drive,{radius:.17,width:.095,ratio:14,motor:'drive48sport',magnet:240});c.weapon=spin('vertical_disc',{radius:.155,innerRadius:.063,width:.14,thickness:.022,toothDepth:.026,toothWidth:.022,toothHeight:.062,mount:v(0,.092,-.45),rpm:6800,ratio:1.4});c.selfRight={type:'roll_arm',mount:v(0,.11,-.25),length:.57,actuator:'R600'};}
 if(index===5){c.drive.motor='drive48sport';Object.assign(c.chassis,{length:.46,width:.42,height:.11,clearance:.022});Object.assign(c.drive,{radius:.075,width:.045,ratio:16,magnet:180});c.weapon=spin('shell_spinner',{radius:.48,innerRadius:0,width:.235,thickness:.007,teeth:3,toothWidth:.095,toothHeight:.027,mount:v(0,-.053,0),rpm:1950,ratio:3});c.selfRight={type:'roll_arm',mount:v(-.27,.215,0),length:.55,actuator:'R600'};}
 if(index===6){Object.assign(c.chassis,{length:.57,width:.49,height:.14});Object.assign(c.drive,{radius:.085,width:.055});c.weapon=spin('horizontal_cage',{radius:.56,width:.11,thickness:.026,teeth:3,toothWidth:.07,toothHeight:.05,mount:v(0,.119,0),rpm:1880,ratio:3});}
 if(index===7){Object.assign(c.chassis,{length:.23,width:.82,height:.14,clearance:.41});Object.assign(c.drive,{layout:2,radius:.48,width:.05,ratio:35});c.armour.forEach(a=>{a.material='uhmw';a.thickness=.004;});c.weapon=spin('vertical_bar',{radius:.460,width:.095,thickness:.026,toothWidth:.026,toothHeight:.095,mount:v(0,0,0),rpm:2300,ratio:3});}
 if(index===8){Object.assign(c.chassis,{length:.52,width:.47,height:.14});Object.assign(c.drive,{layout:2,radius:.105,width:.075});c.weapon=spin('hammer_saw',{radius:.20,innerRadius:.072,width:.025,thickness:.025,teeth:4,toothWidth:.025,toothHeight:.075,mount:v(0,.088,-.045),armLength:.50,armTravel:1.12,rpm:5200,ratio:1.8});}
 if(index===9){Object.assign(c.chassis,{length:.32,width:.82,height:.10,clearance:.018});Object.assign(c.drive,{layout:2,radius:.082,width:.07,ratio:18});c.weapon=spin('vertical_bar',{radius:.57,width:.145,thickness:.08,toothDepth:.065,toothWidth:.030,toothHeight:.13,mount:v(0,.555,-.04),rpm:1860,ratio:3.4});}
 if(index===10){Object.assign(c.chassis,{length:.62,width:.52,height:.12,clearance:.022,thickness:.005});Object.assign(c.drive,{layout:4,radius:.105,width:.065,ratio:14,motor:'drive48sport',magnet:80});c.armour.forEach(a=>{a.material='hardox';a.thickness=a.mount==='front'?.009:a.mount==='top'?.004:.006;});c.weapon={type:'crusher',length:.66,width:.36,thickness:.014,material:'hardox',mount:v(0,.13,.11),travel:.48,torque:4500};c.selfRight={type:'roll_arm',mount:v(0,.12,.245),length:.54,actuator:'R600'};c.battery.capacityWh=350;}
 if(index===1)c.battery.capacityWh=500;if(index===4)c.battery.capacityWh=400;if(index===8)c.battery.capacityWh=450;
 if(isSpinner(c.weapon)){
  if([0,1,3,5,6,8,9].includes(index))c.weapon.motor='spin48dual';
  if([0,3].includes(index))c.weapon.thickness*=1.6;
  if(index===6)c.weapon.thickness*=1.3;
  if(index===5)c.weapon.thickness=.008;
  if(index===7)c.weapon.thickness=.041;
  if(index===9){c.weapon.thickness=.076;c.chassis.thickness=.005;c.armour.forEach(a=>a.material='uhmw');}
  if(index===8)c.weapon.radius=.18;
  const ref=WEAPON_REFERENCES[c.chassis.profile!];
  if(ref.massLb!==undefined)c.weapon.massKg=ref.massLb*LB_TO_KG;
  c.weapon.rpm=referenceRPM(ref,c.weapon.radius,RULES.tip);
  c.weapon.ratio=Math.min(c.weapon.ratio,48*MOTORS[c.weapon.motor].kv/(c.weapon.rpm*1.12));
 }
 // Unmodeled frame hardware, gearboxes and electronics keep stock robots
 // in the 250 lb class after assigning real weapon masses. This is a fixed
 // editable estimate, not an automatic mass correction for custom edits.
 if(!presetEquipmentMass.has(index))presetEquipmentMass.set(index,Math.max(0,113.2-compile(c,true).mass));
 c.chassis.equipmentMassKg=presetEquipmentMass.get(index)!;
 return c;
}

export function fitTraction(config:BotConfig,traction:'wheels'|'tracks'){
 const c=copy(config),before=compile(c,true).mass;c.drive.traction=traction;
 if(traction==='tracks'){c.drive.layout=4;c.drive.radius=Math.min(c.drive.radius,(c.chassis.length-.025)/4);}
 const change=compile(c,true).mass-before;c.chassis.equipmentMassKg=Math.max(0,(c.chassis.equipmentMassKg??0)-change);
 return c;
}

// No spreading or deep-merging imported objects. Parse every allowed value into new objects.
export function parseConfig(input:unknown):BotConfig{
 const fail=(s:string):never=>{throw Error(s);};
 function obj(x:any,path:string):any{if(!x||typeof x!=='object'||Array.isArray(x)||Object.getPrototypeOf(x)!==Object.prototype)return fail(path+': expected an object');for(const k of Object.keys(x))if(['__proto__','prototype','constructor'].includes(k))fail(path+': unsafe key');return x;}
 function bounded(x:any,path:string,lo:number,hi:number){if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)fail(`${path}: use ${lo} to ${hi}`);return x as number;}
 function en<T>(x:any,items:readonly T[],path:string):T{if(!items.includes(x))fail(path+': unsupported value');return x;}
 function vec(x:any,path:string):Vec{obj(x,path);return v(bounded(x.x,path+'.x',-1,1),bounded(x.y,path+'.y',-.3,1.2),bounded(x.z,path+'.z',-1,1));}
 function material(x:any,path:string):Material{return en(x,matIds,path) as Material;}
 function depth(x:any,n=0){if(n>8)fail('Build is too deeply nested');if(x&&typeof x==='object'){if(Object.keys(x).length>32)fail('Build contains too many fields');for(const y of Object.values(x))depth(y,n+1);}}
 depth(input);const a=obj(input,'build');if(a.schemaVersion!==2)fail('Unsupported schema. Use version 2.');
 const i=obj(a.identity,'identity'),c=obj(a.chassis,'chassis'),w=obj(a.weapon,'weapon'),d=obj(a.drive,'drive'),b=obj(a.battery,'battery'),s=obj(a.selfRight,'selfRight');
 if(typeof i.name!=='string'||!i.name.trim()||[...i.name].length<1||[...i.name].length>24||/[\u0000-\u001f\u007f]/u.test(i.name))fail('Name must contain 1–24 visible characters');
 for(const col of [i.primary,i.secondary])if(typeof col!=='string'||!/^#[0-9a-f]{6}$/i.test(col))fail('Colours must use #RRGGBB');
 let weapon:Weapon;en(w.type,['none',...SPINNER_TYPES,'flipper','crusher'],'weapon.type');
 if(w.type==='none')weapon={type:'none'};
 else if(w.type==='crusher')weapon={type:'crusher',length:bounded(w.length,'weapon.length',.4,.8),width:bounded(w.width,'weapon.width',.16,.4),thickness:bounded(w.thickness,'weapon.thickness',.008,.025),material:material(w.material,'weapon.material'),mount:vec(w.mount,'weapon.mount'),travel:bounded(w.travel,'weapon.travel',.2,.65),torque:bounded(w.torque,'weapon.torque',1000,6000)};
 else if(w.type==='flipper')weapon={type:'flipper',length:bounded(w.length,'weapon.length',.2,c.profile==='hydra'?.8:.65),width:bounded(w.width,'weapon.width',.15,.7),thickness:bounded(w.thickness,'weapon.thickness',.006,.04),material:material(w.material,'weapon.material'),mount:vec(w.mount,'weapon.mount'),travel:bounded(w.travel,'weapon.travel',.3,2.1),actuator:en(w.actuator,['F3000'],'weapon.actuator'),stroke:bounded(w.stroke,'weapon.stroke',.2,.5),charges:bounded(w.charges,'weapon.charges',1,12)};
 else weapon={type:w.type,...(w.type==='hammer_saw'?{armLength:bounded(w.armLength??.59,'weapon.armLength',.3,.8),armTravel:bounded(w.armTravel??1.12,'weapon.armTravel',.6,1.5)}:{}),radius:bounded(w.radius,'weapon.radius',.1,.85),innerRadius:bounded(w.innerRadius,'weapon.innerRadius',0,.849),width:bounded(w.width,'weapon.width',.02,.7),thickness:bounded(w.thickness,'weapon.thickness',.006,.08),teeth:bounded(w.teeth,'weapon.teeth',1,12),toothDepth:bounded(w.toothDepth,'weapon.toothDepth',.01,.1),toothWidth:bounded(w.toothWidth,'weapon.toothWidth',.015,.5),toothHeight:bounded(w.toothHeight,'weapon.toothHeight',.01,.18),material:material(w.material,'weapon.material'),mount:vec(w.mount,'weapon.mount'),motor:en(w.motor,motorIds,'weapon.motor') as MotorId,ratio:bounded(w.ratio,'weapon.ratio',.5,12),rpm:bounded(w.rpm,'weapon.rpm',100,12000),direction:en(w.direction,[1,-1],'weapon.direction')};
 if(isSpinner(weapon)&&w.massKg!==undefined)weapon.massKg=bounded(w.massKg,'weapon.massKg',.1,80);
 if(weapon.type==='flipper'&&!Number.isInteger(weapon.charges))fail('Charges must be an integer');
 if(isSpinner(weapon)){if(!Number.isInteger(weapon.teeth))fail('Teeth must be an integer');if(weapon.innerRadius>=weapon.radius-weapon.toothDepth)fail('Inner radius must clear the rotor shell');if(['horizontal_bar','vertical_bar','horizontal_cage','shell_spinner'].includes(weapon.type)&&weapon.innerRadius!==0)fail('A solid bar has no inner radius');}
 if(!Array.isArray(a.armour)||a.armour.length!==5)fail('Armour must define five unique mounts');
 const seen=new Set();const armour=a.armour.map((p:any)=>{obj(p,'armour');const mount=en(p.mount,MOUNTS,'armour.mount');if(seen.has(mount))fail('Duplicate armour mount');seen.add(mount);return{mount,material:material(p.material,'armour.material'),thickness:bounded(p.thickness,'armour.thickness',0,.025)};});
 const parsed:BotConfig={schemaVersion:2,identity:{name:i.name,primary:i.primary.toLowerCase(),secondary:i.secondary.toLowerCase()},chassis:{profile:en(c.profile??'standard',PROFILES,'chassis.profile'),form:en(c.form,['box','wedge'],'chassis.form'),length:bounded(c.length,'chassis.length',.2,1.2),width:bounded(c.width,'chassis.width',.22,1.3),height:bounded(c.height,'chassis.height',.08,.45),material:material(c.material,'chassis.material'),thickness:bounded(c.thickness,'chassis.thickness',.004,.02),wedgeAngle:bounded(c.wedgeAngle,'chassis.wedgeAngle',10,55),clearance:bounded(c.clearance,'chassis.clearance',.003,.65)},weapon,drive:{traction:en(d.traction??'wheels',['wheels','tracks'],'drive.traction'),layout:en(d.layout,[2,4,6],'drive.layout'),radius:bounded(d.radius,'drive.radius',c.profile==='hydra'?.035:.05,.6),width:bounded(d.width,'drive.width',.025,.18),material:en(d.material,['rubber'],'drive.material'),motor:en(d.motor,['drive48','drive48sport'],'drive.motor'),ratio:bounded(d.ratio,'drive.ratio',5,45),magnet:bounded(d.magnet,'drive.magnet',0,400)},armour,battery:{pack:en(b.pack,['P48'],'battery.pack'),capacityWh:bounded(b.capacityWh,'battery.capacityWh',100,1000)},selfRight:s.type==='none'?{type:'none'}:{type:en(s.type,['roll_arm'],'selfRight.type'),mount:vec(s.mount,'selfRight.mount'),length:bounded(s.length,'selfRight.length',.25,.6),actuator:en(s.actuator,['R600'],'selfRight.actuator')}};
 if(a.components!==undefined){const source=obj(a.components,'components');const components:NonNullable<BotConfig['components']>={};for(const kind of ['weapon','drive','selfRight','battery','armour'] as ComponentKind[])if(source[kind]!==undefined)components[kind]=en(source[kind],PROFILES,'components.'+kind);parsed.components=components;}
 if(a.attachments!==undefined){if(!Array.isArray(a.attachments)||a.attachments.length>32)fail('Use at most 32 structural attachments.');parsed.attachments=a.attachments.map((raw:any)=>{const p=obj(raw,'attachment');if(typeof p.id!=='string'||!/^[-a-zA-Z0-9_]{1,48}$/.test(p.id)||typeof p.part!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(p.part))fail('Attachment identifiers are invalid.');const r=obj(p.rotation,'attachment.rotation'),q={x:bounded(r.x,'attachment.rotation.x',-1,1),y:bounded(r.y,'attachment.rotation.y',-1,1),z:bounded(r.z,'attachment.rotation.z',-1,1),w:bounded(r.w,'attachment.rotation.w',-1,1)};if(Math.abs(Math.hypot(q.x,q.y,q.z,q.w)-1)>.001)fail('Attachment rotation must be a unit quaternion.');return{id:p.id,template:en(p.template,ROSTER.map((_,i)=>i),'attachment.template'),part:p.part,mount:vec(p.mount,'attachment.mount'),rotation:q};});if(new Set(parsed.attachments.map(p=>p.id)).size!==parsed.attachments.length)fail('Attachment identifiers must be unique.');}
 if(d.hydraTuning!==undefined)parsed.drive.hydraTuning=en(d.hydraTuning,[1,2,3] as const,'drive.hydraTuning');
 if(c.equipmentMassKg!==undefined)parsed.chassis.equipmentMassKg=bounded(c.equipmentMassKg,'chassis.equipmentMassKg',0,80);
 if(parsed.chassis.profile==='hypershock'&&parsed.weapon.type==='vertical_disc'&&Math.abs(parsed.weapon.radius-.22)<1e-6&&Math.abs(parsed.weapon.width-.035)<1e-6&&Math.abs(parsed.weapon.mount.y-.158)<1e-6&&Math.abs(parsed.weapon.mount.z+.51)<1e-6&&Math.abs(parsed.drive.radius-.135)<1e-6){
  const stock=preset(4);parsed.weapon={...parsed.weapon,...Object.fromEntries(['radius','innerRadius','width','thickness','toothDepth','toothWidth','toothHeight','mount'].map(k=>[k,(stock.weapon as Spinner)[k as keyof Spinner]]))};
  if(parsed.weapon.rpm===4800)parsed.weapon.rpm=6800;if(parsed.weapon.ratio===1.9)parsed.weapon.ratio=1.4;parsed.drive.radius=.17;if(parsed.drive.ratio===12)parsed.drive.ratio=14;
 }
 if(parsed.chassis.profile==='sawblaze'&&parsed.weapon.type==='hammer_saw'&&Math.abs(parsed.chassis.length-.52)<1e-6&&Math.abs(parsed.chassis.width-.47)<1e-6&&Math.abs(parsed.weapon.radius-.2032)<1e-6&&Math.abs(parsed.weapon.armLength!-.50)<1e-6&&Math.abs(parsed.weapon.mount.y-.115)<1e-6&&Math.abs(parsed.weapon.mount.z-.115)<1e-6){
  parsed.weapon.mount=v(parsed.weapon.mount.x,.088,-.045);parsed.weapon.radius=.18;
  if(Math.abs(parsed.weapon.rpm-5252)<1e-6&&Math.abs(parsed.weapon.ratio-1.7952344685017951)<1e-6){parsed.weapon.rpm=referenceRPM(WEAPON_REFERENCES.sawblaze,.18,RULES.tip);parsed.weapon.ratio=Math.min(parsed.weapon.ratio,48*MOTORS[parsed.weapon.motor].kv/(parsed.weapon.rpm*1.12));}
  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-36.915694118748334)<1e-6)parsed.chassis.equipmentMassKg=30.859559305045067;
 }
 // Migrate only the exact legacy stock geometry. Preserve edited builds.
 if(parsed.chassis.profile==='hydra'&&(!parsed.components?.drive||parsed.components.drive==='hydra')&&parsed.weapon.type==='flipper'&&parsed.chassis.length===.64&&parsed.chassis.width===.58&&parsed.chassis.height===.16&&parsed.weapon.length===.30&&parsed.weapon.width===.22&&parsed.weapon.thickness===.012&&Math.abs(parsed.weapon.mount.y-.101)<1e-6&&Math.abs(parsed.weapon.mount.z+.335)<1e-6&&parsed.drive.radius===.10&&parsed.drive.width===.075){
  const stock=preset(2);parsed.chassis.height=.08;parsed.chassis.form='box';if(parsed.identity.primary==='#5c318c')parsed.identity.primary=stock.identity.primary;if(parsed.identity.secondary==='#d8ad4d')parsed.identity.secondary=stock.identity.secondary;parsed.weapon={...parsed.weapon,length:.663,thickness:.028,mount:copy(stock.weapon.type==='flipper'?stock.weapon.mount:v())};parsed.drive.radius=.10;parsed.drive.width=.075;
  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-18.629719642711223)<1e-6)parsed.chassis.equipmentMassKg=stock.chassis.equipmentMassKg;
 }
 // Update the prior stock Hydra drive without replacing custom builds.
 if(parsed.chassis.profile==='hydra'&&(!parsed.components?.drive||parsed.components.drive==='hydra')&&parsed.chassis.length===.64&&parsed.chassis.width===.58&&parsed.chassis.height===.08&&parsed.weapon.type==='flipper'&&parsed.weapon.length===.663&&parsed.drive.layout===4&&parsed.drive.radius===.046&&parsed.drive.width===.038&&parsed.drive.motor==='drive48'&&(parsed.drive.hydraTuning===undefined||parsed.drive.hydraTuning===1)&&(parsed.drive.ratio===6.5||parsed.drive.ratio===14)){
  parsed.drive.radius=.10;parsed.drive.width=.075;parsed.drive.ratio=14;
  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-50.608441509370486)<1e-6)parsed.chassis.equipmentMassKg=preset(2).chassis.equipmentMassKg;
 }
 if(parsed.chassis.profile==='hydra'&&(!parsed.components?.drive||parsed.components.drive==='hydra')&&parsed.chassis.length===.64&&parsed.chassis.width===.58&&parsed.chassis.height===.08&&parsed.weapon.type==='flipper'&&parsed.weapon.length===.663&&parsed.drive.traction!=='tracks'&&parsed.drive.layout===4&&parsed.drive.radius===.10&&parsed.drive.width===.075&&parsed.drive.motor==='drive48'&&parsed.drive.ratio===14&&parsed.drive.hydraTuning!==3){
  parsed.drive.radius=.060;parsed.drive.width=.040;parsed.drive.ratio=8.3;
  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-41.35266615371938)<1e-6)parsed.chassis.equipmentMassKg=preset(2).chassis.equipmentMassKg;
 }
 if(parsed.chassis.profile==='hydra'&&(!parsed.components?.drive||parsed.components.drive==='hydra'))parsed.drive.hydraTuning=3;
 // Keep saved stock builds compatible with the vertical recovery mechanisms.
 if(parsed.selfRight.type==='roll_arm'){
  const arm=parsed.selfRight,close=(a:number,b:number)=>Math.abs(a-b)<1e-6;
  const legacyHyper=parsed.chassis.profile==='hypershock'&&close(arm.mount.x,-.15)&&close(arm.mount.y,.097)&&close(arm.mount.z,0)&&close(arm.length,.31);
  const legacyQuantum=parsed.chassis.profile==='quantum'&&close(arm.mount.x,-.225)&&close(arm.mount.y,.12)&&close(arm.mount.z,.205)&&close(arm.length,.45);
  if(legacyHyper||legacyQuantum)parsed.selfRight=copy(preset(legacyHyper?4:10).selfRight);
 }
 return parsed;
}

export function motorModel(id:MotorId,ratio:number,omega:number,throttle:number){
 const m=MOTORS[id],kt=60/(2*Math.PI*m.kv),motorSpeed=omega*ratio,voltage=48*clamp(throttle,-1,1);
 const current=clamp((voltage-motorSpeed*kt)/m.resistance,-m.currentLimit,m.currentLimit);
 const torque=(current-((Math.abs(throttle)>.001)?Math.sign(motorSpeed||throttle)*m.noLoadCurrent:0))*kt*ratio*m.efficiency;
 const loss=current*current*m.resistance+(Math.abs(throttle)>.001?48*m.noLoadCurrent:0)+4;
 const watts=Math.max(0,torque*omega)/m.efficiency+loss;
 return {torque,watts,current,kt};
}
export function spinnerMotor(w:Spinner,omega:number,direction=w.direction,speedScale=1){const target=w.rpm*Math.PI/30*direction*speedScale,free=48*MOTORS[w.motor].kv/w.ratio*Math.PI/30,voltage=clamp(target/free+(target-omega)*.015,-1,1);return motorModel(w.motor,w.ratio,omega,voltage);}
// Implicit integration of back EMF prevents light wheels from reversing their
// speed every physics tick under a constant drive command.
export function driveMotorStep(ratio:number,omega:number,throttle:number,inertia:number,id:BotConfig['drive']['motor']='drive48',bearingDrag=.012){
 const m=MOTORS[id],kt=60/(2*Math.PI*m.kv),k=kt*ratio,dt=RULES.dt,I=Math.max(.00001,inertia),voltage=48*clamp(throttle,-1,1),idle=Math.abs(throttle)>.001?Math.sign(omega||throttle)*m.noLoadCurrent:0;
 let next=(I*omega+dt*(voltage/m.resistance-idle)*k*m.efficiency)/(I+dt*(k*k*m.efficiency/m.resistance+bearingDrag));
 const current=clamp((voltage-next*k)/m.resistance,-m.currentLimit,m.currentLimit);
 if(Math.abs((voltage-next*k)/m.resistance)>m.currentLimit)next=(I*omega+dt*(current-idle)*k*m.efficiency)/(I+dt*bearingDrag);
 const torque=(next-omega)*I/dt,mechanical=Math.max(0,torque*(omega+next)/2),watts=mechanical/m.efficiency+current*current*m.resistance+(Math.abs(throttle)>.001?48*m.noLoadCurrent:0)+4;
 return{torque,watts};
}
// Exact second moments for boxes, cylinders, and convex prisms along X or Y.
export function partProperties(p:Part):{centre:Vec,about:(axis:Vec,origin?:Vec)=>number}{
 const m=p.mass,s=p.shape;let centre=v(),I=v(),yz=0;
 // A triangular prism can be extruded along an oblique direction (side
 // scoops), so projecting it into an axis-aligned rectangle is incorrect.
 if(s.kind==='hull'&&s.vertices.length===18){
  const points=Array.from({length:6},(_,i)=>v(...s.vertices.slice(i*3,i*3+3) as [number,number,number])),base=mul(add(add(points[0],points[1]),points[2]),1/3),extrusion=sub(points[3],points[0]);
  const centre=add(p.position,rotate(add(base,mul(extrusion,.5)),p.rotation)),vectors=[...points.slice(0,3).map(point=>sub(point,base)),extrusion];
  return{centre,about:(axis:Vec,origin=v())=>{const local=rotate(axis,{x:-p.rotation.x,y:-p.rotation.y,z:-p.rotation.z,w:p.rotation.w}),r=sub(centre,origin);return m*(vectors.reduce((sum,x)=>sum+(dot(x,x)-dot(x,local)**2)/12,0)+dot(r,r)-dot(r,axis)**2);}};
 }
 if(s.kind==='box'){I=v(m*(s.size.y*s.size.y+s.size.z*s.size.z)/12,m*(s.size.x*s.size.x+s.size.z*s.size.z)/12,m*(s.size.x*s.size.x+s.size.y*s.size.y)/12);}
 else if(s.kind==='cylinder'){I=v(m*(3*s.radius*s.radius+s.width*s.width)/12,m*s.radius*s.radius/2,m*(3*s.radius*s.radius+s.width*s.width)/12);}
 else{
 const xsUnique=new Set(Array.from({length:s.vertices.length/3},(_,i)=>s.vertices[i*3]));
 if(xsUnique.size>2){
  const vertices:number[]=[];for(let i=0;i<s.vertices.length;i+=3)vertices.push(s.vertices[i+1],s.vertices[i],s.vertices[i+2]);
  const properties=partProperties({...p,shape:{...s,vertices},position:v(),rotation:identity});
  const centre=add(p.position,rotate(v(properties.centre.y,properties.centre.x,properties.centre.z),p.rotation));
  return{centre,about:(axis:Vec,origin=v())=>{const local=rotate(axis,{x:-p.rotation.x,y:-p.rotation.y,z:-p.rotation.z,w:p.rotation.w}),r=sub(centre,origin);return properties.about(v(local.y,local.x,local.z),properties.centre)+m*(dot(r,r)-dot(r,axis)**2);}};
 }
 const pts:{y:number,z:number}[]=[];const xs:number[]=[];for(let i=0;i<s.vertices.length;i+=3){xs.push(s.vertices[i]);const y=s.vertices[i+1],z=s.vertices[i+2];if(!pts.some(p=>p.y===y&&p.z===z))pts.push({y,z});}pts.sort((a,b)=>a.y-b.y||a.z-b.z);
 const turn=(o:typeof pts[0],a:typeof pts[0],b:typeof pts[0])=>(a.y-o.y)*(b.z-o.z)-(a.z-o.z)*(b.y-o.y),lo:typeof pts=[],hi:typeof pts=[];
 for(const point of pts){while(lo.length>=2&&turn(lo[lo.length-2],lo.at(-1)!,point)<=0)lo.pop();lo.push(point);}for(const point of [...pts].reverse()){while(hi.length>=2&&turn(hi[hi.length-2],hi.at(-1)!,point)<=0)hi.pop();hi.push(point);}const polygon=lo.slice(0,-1).concat(hi.slice(0,-1));let area=0,cy=0,cz=0,sy=0,sz=0,syz=0;
 for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],d=a.y*b.z-b.y*a.z;area+=d;cy+=(a.y+b.y)*d;cz+=(a.z+b.z)*d;sy+=(a.y*a.y+a.y*b.y+b.y*b.y)*d;sz+=(a.z*a.z+a.z*b.z+b.z*b.z)*d;syz+=(2*a.y*a.z+a.y*b.z+b.y*a.z+2*b.y*b.z)*d;}
 area/=2;cy/=6*area;cz/=6*area;const vy=sy/(12*area)-cy*cy,vz=sz/(12*area)-cz*cz,cov=syz/(24*area)-cy*cz,width=Math.max(...xs)-Math.min(...xs);centre=v((Math.max(...xs)+Math.min(...xs))/2,cy,cz);I=v(m*(vy+vz),m*(width*width/12+vz),m*(width*width/12+vy));yz=-m*cov;
 }
 const localCentre=add(p.position,rotate(centre,p.rotation));
 const about=(axis:Vec,origin=v())=>{const qi={x:-p.rotation.x,y:-p.rotation.y,z:-p.rotation.z,w:p.rotation.w},a=rotate(axis,qi),r=sub(localCentre,origin);return I.x*a.x*a.x+I.y*a.y*a.y+I.z*a.z*a.z+2*yz*a.y*a.z+m*(dot(r,r)-dot(r,axis)**2);};
 return{centre:localCentre,about};
}
export function compile(raw:BotConfig,practice=false):Compiled{
 const c=parseConfig(raw),parts:Part[]=[],errors:Compiled['errors']=[],ch=c.chassis,w=c.weapon;
 const err=(field:string,message:string)=>errors.push({field,message});
 const modules={} as Record<Slot,Module>;
 SLOTS.forEach(id=>modules[id]={id,present:false,max:0,hp:0,material:ch.material,functional:false});
 function module(id:Slot,hp:number,material:Material){modules[id]={id,present:hp>0,max:hp,hp,material,functional:hp>0};}
 function part(id:string,slot:Slot,body:string,shape:Shape,pos:Vec,material:Material|'rubber',mass?:number,rotation=identity,collides=true,tooth?:number){
 const volume=shape.kind==='box'?shape.size.x*shape.size.y*shape.size.z:shape.kind==='cylinder'?Math.PI*shape.radius**2*shape.width:shape.volume;
 parts.push({id,module:slot,body,shape,position:pos,rotation,material,mass:mass??volume*(material==='rubber'?1100:MATERIALS[material].density),collides,tooth});}
 const box=(id:string,slot:Slot,body:string,size:Vec,pos:Vec,mat:Material|'rubber',mass?:number,collides=true,rot=identity)=>part(id,slot,body,{kind:'box',size},pos,mat,mass,rot,collides);
 const L=ch.length,W=ch.width,H=ch.height,T=ch.thickness,wc=componentConfig(c,'weapon'),dc=componentConfig(c,'drive'),rc=componentConfig(c,'selfRight');
 module('chassis',1200,ch.material);
 if(ch.equipmentMassKg)for(const side of[-1,1])box('internal_equipment_'+side,'chassis','chassis',v(W*.25,H*.5,L*.65),v(side*W*.28,-H*.10,0),'aluminium7075',ch.equipmentMassKg/2,false);
 // Clipped steel shells use the same authored hulls for rendering and physics.
 const bevel=Math.min(W*.16,L*.12),outline=[[-W/2+bevel,-L/2],[W/2-bevel,-L/2],[W/2,-L/2+bevel],[W/2,L/2-bevel],[W/2-bevel,L/2],[-W/2+bevel,L/2],[-W/2,L/2-bevel],[-W/2,-L/2+bevel]];
 const split=ch.profile==='huge'||ch.profile==='deep_six',recessedDrum=ch.profile==='minotaur'&&w.type==='drum'&&w.mount.z< -L/2&&w.mount.z+w.radius<=-L*.25&&w.width+.038<W-.02&&Math.abs(w.mount.x)<.002;
 const notchRear=recessedDrum&&w.type==='drum'?w.mount.z+w.radius+.012:-L/2,notchWidth=recessedDrum&&w.type==='drum'?w.width+.038:0,wing=(W-notchWidth)/2;
 const plate=(id:string,slot:Slot,t:number,y:number,mat:Material)=>{if(recessedDrum){box(id+'_rear',slot,'chassis',v(W,t,L/2-notchRear),v(0,y,(L/2+notchRear)/2),mat);for(const side of[-1,1])box(id+'_wing_'+side,slot,'chassis',v(wing,t,notchRear+L/2),v(side*(notchWidth+wing)/2,y,(notchRear-L/2)/2),mat);}else if(split){for(const side of[-1,1])box(id+'_'+side,slot,'chassis',v(W/2-.055,t,L),v(side*(W/4+.0275),y,0),mat);}else{const perimeter=ch.profile==='sawblaze'&&y>0?outline.map(([x,z])=>[x,Math.max(z,-L*.26)]):outline,area=perimeter===outline?W*L-2*bevel*bevel:Math.abs(perimeter.reduce((sum,p,i)=>{const q=perimeter[(i+1)%perimeter.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;const vertices:number[]=[];for(const dy of[-t/2,t/2])for(const [x,z]of perimeter)vertices.push(x,dy,z);part(id,slot,'chassis',{kind:'hull',vertices,volume:area*t},v(0,y,0),mat);}};
 plate('floor','chassis',T,-H/2+T/2,ch.material);plate('lid','chassis',T,H/2-T/2,ch.material);
 for(const side of[-1,1]){
  box('side'+side,'chassis','chassis',v(T,H-2*T,L-2*bevel),v(side*(W-T)/2,0,0),ch.material);
  if(split){for(const half of[-1,1])box('end'+side+'_'+half,'chassis','chassis',v(W/2-.055,H-2*T,T),v(half*(W/4+.0275),0,side*(L-T)/2),ch.material);box('inner'+side,'chassis','chassis',v(T,H-2*T,L),v(side*(.055+T/2),0,0),ch.material);}else if(recessedDrum&&side===-1){for(const half of[-1,1])box('end'+side+'_'+half,'chassis','chassis',v(wing,H-2*T,T),v(half*(notchWidth+wing)/2,0,side*(L-T)/2),ch.material);}else if(ch.profile!=='sawblaze'||side!==-1)box('end'+side,'chassis','chassis',v(W-2*bevel,H-2*T,T),v(0,0,side*(L-T)/2),ch.material);
  for(const front of[-1,1])box('corner_'+side+'_'+front,'chassis','chassis',v(T,H-2*T,Math.SQRT2*bevel-T),v(side*(W/2-bevel/2-T/3),0,front*(L/2-bevel/2-T/3)),ch.material,undefined,true,axisQ(v(0,1,0),-side*front*Math.PI/4));
 }
 if(w.type==='horizontal_bar'&&c.drive.layout===2&&w.mount.z< -L/2){
  for(const side of[-1,1]){
   const x=side*(W/2+c.drive.width+.036);box('frame_rail_'+side,'chassis','chassis',v(.015,.018,L*.96),v(x,H/2-.032,0),'hardox');
   for(const end of[-1,1]){const dx=Math.abs(x)-W/2+.03,dz=L*.18,len=Math.hypot(dx,dz);box('frame_brace_'+side+'_'+end,'chassis','chassis',v(.014,.018,len),v(side*(Math.abs(x)+W/2-.03)/2,H/2-.032,end*L*.34),'hardox',undefined,true,axisQ(v(0,1,0),side*end*Math.atan2(dx,dz)));}
   // Two-wheel machines need a real forward support point. Keep the skid
   // outside the swept disc, so the low blade cannot become the third foot.
   const sx=side*(W/2+c.drive.width+.065),sz=-L*.38,low=-H/2-ch.clearance+.005,high=H/2-.032;
   part('frame_skid_leg_'+side,'chassis','chassis',{kind:'cylinder',radius:.008,width:high-low},v(sx,(high+low)/2,sz),'hardox');
   part('frame_skid_pad_'+side,'chassis','chassis',{kind:'cylinder',radius:.018,width:.008},v(sx,low,sz),'hardox');
   box('frame_skid_link_'+side,'chassis','chassis',v(.044,.015,.025),v(side*(Math.abs(x)+Math.abs(sx))/2,high,sz),'hardox');
  }
 }
 if(ch.form==='wedge'){
  const lip=unlimitedFlips(c)?HYDRA_TIP:WEDGE_TIP,run=Math.min(.14,H/Math.tan(ch.wedgeAngle*Math.PI/180)),low=-H/2-ch.clearance+lip.clearance,tip=low+lip.thickness,rise=run*Math.tan(ch.wedgeAngle*Math.PI/180),vertices:number[]=[];
  for(const x of[-W/2,W/2])for(const [y,z]of[[low,-L/2-run],[low,-L/2],[tip+rise,-L/2],[tip,-L/2-run]])vertices.push(x,y,z);
  part('wedge','chassis','chassis',{kind:'hull',vertices,volume:W*run*(lip.thickness+rise/2)},v(),ch.material);
 }
 for(const a of c.armour){const t=a.thickness;const side=a.mount==='left'?-1:1;let size:Vec,pos:Vec,area:number;
 if(a.mount==='front'||a.mount==='rear'){size=v(W-2*bevel,H,t);pos=v(0,0,(a.mount==='front'?-1:1)*(L+t)/2);area=(W-2*bevel)*H;}
 else if(a.mount==='top'){size=v(W,t,L);pos=v(0,(H+t)/2,0);area=W*L-2*bevel*bevel;}
 else{size=v(t,H,L-2*bevel);pos=v(side*(W+t)/2,0,0);area=H*(L-2*bevel);}
 module(('armour_'+a.mount) as Slot,t?400*(area/.25)*(t/.008):0,a.material);
 if(t){if(a.mount==='top')plate('armour_top','armour_top',t,pos.y,a.material);else if(recessedDrum&&a.mount==='front'){for(const side of[-1,1])box('armour_front_'+side,'armour_front','chassis',v(wing,H,t),v(side*(notchWidth+wing)/2,0,pos.z),a.material);}else if(split&&(a.mount==='front'||a.mount==='rear')){for(const side of[-1,1])box('armour_'+a.mount+'_'+side,('armour_'+a.mount) as Slot,'chassis',v(W/2-.055,H,t),v(side*(W/4+.0275),pos.y,pos.z),a.material);}else if(ch.profile==='sawblaze'&&a.mount==='front')sawblazeFrontParts(c,parts,'armour_front',t,a.material);else box('armour_'+a.mount,('armour_'+a.mount) as Slot,'chassis',size,pos,a.material);}
 }
 const wheelY=c.drive.radius-(ch.clearance+H/2),armourAt=(side:number)=>c.armour.find(a=>a.mount===(side<0?'left':'right'))!.thickness,sideArm=Math.max(armourAt(-1),armourAt(1));
 for(const side of [-1,1]){const slot:Slot=side===-1?'drive_left':'drive_right',sideArm=armourAt(side);module(slot,dc.chassis.profile==='quantum'?550:400,'aluminium7075');
 for(let i=0;i<c.drive.layout/2;i++){const z=wheelPositionZ(c,i),x=bodyOrigin(c,`wheel_${side}_${i}`).x;const id=`wheel_${side}_${i}`;
 if(dc.chassis.profile==='huge'&&c.drive.traction!=='tracks')largeWheelParts(dc,id,slot,v(x,wheelY,z),parts);else if(dc.chassis.profile==='hypershock'&&c.drive.traction!=='tracks')racerWheelParts(dc,id,slot,v(x,wheelY,z),parts);else if(hydraSleekWheels(c))hydraWheelParts(dc,id,slot,v(x,wheelY,z),parts);else part(id,slot,id,{kind:'cylinder',radius:c.drive.radius,width:c.drive.width},v(x,wheelY,z),'rubber',c.drive.traction==='tracks'?.9:undefined,axisQ(v(0,0,1),Math.PI/2));
 if(dc.chassis.profile==='minotaur')part('gyro_hub_'+side+'_'+i,slot,id,{kind:'cylinder',radius:.023,width:.045},v(x+side*(c.drive.width/2+.018),wheelY,z),'aluminium7075',undefined,axisQ(v(0,0,1),Math.PI/2));
 box('motor_'+id,slot,'chassis',v(.07,.065,.10),v(side*(W/2-.075),wheelY,z),'aluminium7075',MOTORS[c.drive.motor].mass,false);
 box('axle_'+id,slot,'chassis',v(.045,.04,.04),v(side*(W/2+.012),wheelY,z),'hardox');}}
 if(c.drive.traction==='tracks')for(const side of[-1,1]){
  const slot:Slot=side<0?'drive_left':'drive_right',x=side*(W/2+armourAt(side)+c.drive.width/2+.008);
  box('track_belt_'+side,slot,'chassis',v(c.drive.width,.018,Math.max(.02,wheelBase(c))),v(x,wheelY+c.drive.radius-.01,wheelCentreZ(c)),'rubber',3.2,false);
 }
 module('battery',350,'aluminium7075');for(const zone of batteryZones(c))box(zone.id,'battery','chassis',zone.size,zone.position,'aluminium7075',(.8+c.battery.capacityWh/180)*zone.fraction,false);
 box('electronics','chassis','chassis',v(.13,.025,.08),v(split?.22:0,.035,split?0:.15),'aluminium7075',1.15,false);
 if(c.drive.magnet)box('magnets','chassis','chassis',v(.15,.009,.14),v(0,-H/2+.016,.02),'hardox',c.drive.magnet/80,false);
 if(ch.profile==='hydra'){for(let i=parts.length-1;i>=0;i--)if(/^(floor|lid|side-?1|end-?1|corner_|wedge|armour_)/.test(parts[i].id))parts.splice(i,1);hydraChassisParts(c,parts);}
 if(wc===c)templateParts(c,parts);else{const base:Part[]=[],kit:Part[]=[];templateParts(c,base);templateParts(wc,kit);const mechanical=(p:Part)=>p.module==='weapon'||p.module==='weapon_actuator'||p.body==='weapon_arm'||p.body==='rotor'||/^(saw_|disc_|engine_|crusher_)/.test(p.id);parts.push(...base.filter(p=>!mechanical(p)),...kit.filter(mechanical));}
 let rotorInertia=0,tip=0,availableRPM=0,spinup=0;
 if(w.type!=='none'){
 module('weapon',w.type==='crusher'?650:500,w.material);module('weapon_actuator',350,'aluminium7075');if(wc.chassis.profile==='gigabyte')box('shell_brake','weapon_actuator','chassis',v(.10,.035,.08),v(0,.13,.11),'hardox',1.2,false);
 box('weapon_motor','weapon_actuator','chassis',v(.105,.07,.11),v(split?.22:0,.015,split?0:-.13),'aluminium7075',w.type==='flipper'||w.type==='crusher'?4.2:MOTORS[w.motor].mass,false);
 if(w.type==='horizontal_bar'&&w.mount.z< -L/2){const under=w.mount.y+Math.max(w.thickness,w.toothHeight)/2< -H/2-.004,supportLength=Math.abs(w.mount.z)+.05-L/2;box('weapon_support','weapon_actuator','chassis',v(under?.11:.07,.018,supportLength),v(w.mount.x,under?-H/2+.012:w.mount.y-Math.max(w.thickness,w.toothHeight)/2-.022,(w.mount.z-L/2+.05)/2),'aluminium7075');part('weapon_spindle','weapon_actuator','chassis',{kind:'cylinder',radius:.022,width:.015},v(w.mount.x,under?w.mount.y+.022:w.mount.y-.035,w.mount.z),'hardox');}
 else if(w.type==='drum'){
  // Bearing cheeks also support the nose. The drum clears the floor even
  // while its forward mass loads a two-wheel chassis.
  const rear=-L/2+.02,front=w.mount.z-.035,bottom=-H/2-ch.clearance+.002,top=wc.chassis.profile==='minotaur'?Math.max(w.mount.y+.034,-bottom):w.mount.y+.034;
  const section=[[rear,-H/2],[front,bottom],[front,top-.035],[front+.035,top],[rear,top]];
  let twiceArea=0;for(let i=0;i<section.length;i++){const a=section[i],b=section[(i+1)%section.length];twiceArea+=a[0]*b[1]-a[1]*b[0];}
  for(const side of[-1,1]){const vertices:number[]=[],cx=w.mount.x+side*(w.width/2+.012);for(const x of[cx-.007,cx+.007])for(const [z,y]of section)vertices.push(x,y,z);part('drum_bearing_'+side,'weapon_actuator','chassis',{kind:'hull',vertices,volume:Math.abs(twiceArea)*.007},v(),'aluminium7075');}
 }
 else box('weapon_mount','weapon_actuator','chassis',v(.09,.025,.12),v(w.mount.x,w.mount.y-.035,w.mount.z+.03),'hardox',1.5,false);
 if(w.type==='crusher'){crusherParts(wc,parts);}
 else if(w.type==='flipper'&&wc.chassis.profile==='hydra'){hydraFlipperParts(wc,parts);}
 else if(w.type==='flipper'){
 const tip=unlimitedFlips(c)?HYDRA_TIP:{clearance:.003,thickness:.004},drop=H/2+ch.clearance+w.mount.y-tip.clearance-tip.thickness/2,vertices:number[]=[];
 for(const x of [-w.width/2,w.width/2])for(const z of [0,-w.length])for(const side of [-1,1])vertices.push(x,(z===0?0:-drop)+side*(z===0?w.thickness/2:tip.thickness/2),z);
 part('flipper','weapon','rotor',{kind:'hull',vertices,volume:w.width*(w.thickness+tip.thickness)/2*w.length},v(),w.material);
 }else{
 if(w.type==='horizontal_bar'){
 if(w.width/2>=w.radius-w.toothDepth)err('weapon.width','Bar width leaves no space for teeth inside the rotation envelope.');
 const barL=2*(Math.sqrt(Math.max(.0001,w.radius*w.radius-(w.width/2)**2))-w.toothDepth),x=barL/2,z=w.width/2,outline=[[-x,-z*.65],[-x*.84,-z],[x*.80,-z],[x,z*.65],[x*.84,z],[-x*.80,z]],vertices:number[]=[];
 for(const y of[-w.thickness/2,w.thickness/2])for(const [px,pz]of outline)vertices.push(px,y,pz);
 const area=Math.abs(outline.reduce((sum,p,i)=>{const n=outline[(i+1)%outline.length];return sum+p[0]*n[1]-p[1]*n[0];},0))/2;part('bar','weapon','rotor',{kind:'hull',vertices,volume:area*w.thickness},v(),w.material);
 const m=parts.at(-1)!.mass;rotorInertia=m*(barL**2+w.width**2)/12;
 }else if(w.type==='drum'){
 // Polygonal hollow drum: identical closed convex sectors in render and collision geometry.
 const ro=w.radius-w.toothDepth,ri=w.innerRadius,n=20;
 for(let j=0;j<n;j++){const a=j*2*Math.PI/n,b=(j+1)*2*Math.PI/n,vertices:number[]=[];for(const x of [-w.width/2,w.width/2])for(const [r,t]of[[ri,a],[ro,a],[ro,b],[ri,b]])vertices.push(x,r*Math.cos(t),r*Math.sin(t));const volume=w.width*(ro*ro-ri*ri)*Math.sin(2*Math.PI/n)/2;part('drum_'+j,'weapon','rotor',{kind:'hull',vertices,volume},v(),w.material);rotorInertia+=.5*parts.at(-1)!.mass*(ro*ro+ri*ri);}
 }
 if(w.type!=='horizontal_bar'&&w.type!=='drum')extendedRotor(wc,w,parts);
 else for(let i=0;i<w.teeth;i++){const a=i*2*Math.PI/w.teeth,r=Math.sqrt(Math.max(.0001,w.radius*w.radius-(w.type==='drum'?w.toothHeight:w.width)**2/4))-w.toothDepth/2;const size=w.type==='drum'?v(w.toothWidth,w.toothDepth,w.toothHeight):v(w.toothDepth,w.toothHeight,w.toothWidth);let pos:Vec,rotation:Quat;if(w.type==='drum'){pos=v(0,r*Math.cos(a),r*Math.sin(a));rotation=axisQ(v(1,0,0),a);}else{const side=i%2===0?1:-1,n=side===1?Math.ceil(w.teeth/2):Math.floor(w.teeth/2),j=Math.floor(i/2),z=n===1?0:(j/(n-1)-.5)*(w.width-w.toothWidth);pos=v(side*r,0,z);rotation=identity;}part('tooth_'+i,'weapon','rotor',chiselShape(size),pos,w.material,undefined,rotation,true,i);}
 tip=w.rpm*Math.PI/30*w.radius;availableRPM=48*MOTORS[w.motor].kv/w.ratio;
 if(w.massKg!==undefined){const rotor=parts.filter(p=>p.body==='rotor'),geometricMass=rotor.reduce((sum,p)=>sum+p.mass,0);for(const p of rotor)p.mass*=w.massKg/geometricMass;}
 const spinAxis=weaponAxis(w);rotorInertia=parts.filter(p=>p.body==='rotor').reduce((sum,p)=>sum+partProperties(p).about(spinAxis),0);
 let speed=0;for(let k=0;k<200*RULES.hz&&Math.abs(speed)<w.rpm*Math.PI/30*.95;k++){const m=spinnerMotor(w,speed);speed+=(m.torque-.015*speed)*RULES.dt/Math.max(.001,rotorInertia);spinup=(k+1)*RULES.dt;}
 if(spinup>=200)spinup=Infinity;
 if(tip>RULES.tip)err('weapon.rpm',`Tip speed ${tip.toFixed(1)} m/s exceeds ${RULES.tip} m/s.`);
 if(w.rpm>availableRPM)err('weapon.rpm',`Requested speed exceeds ${Math.floor(availableRPM)} available RPM.`);
 if(w.toothWidth>w.width&&['drum','vertical_disc','hammer_saw'].includes(w.type))err('weapon.toothWidth','Teeth are wider than the drum.');
 if(w.type==='horizontal_bar'&&w.toothWidth*Math.ceil(w.teeth/2)>w.width+.000001)err('weapon.teeth','Teeth do not fit along the two bar ends. Reduce their width or count.');
 const spacing=2*Math.PI*(w.radius-w.toothDepth/2)/w.teeth;
 if((w.type==='drum'?w.toothHeight:w.toothWidth)>spacing*.85)err('weapon.teeth','Teeth overlap in the rotation path.');
 if(w.type==='horizontal_bar'){const low=w.mount.y-Math.max(w.thickness,w.toothHeight)/2<H/2+c.armour.find(a=>a.mount==='top')!.thickness+.004;const nose=L/2+c.armour.find(a=>a.mount==='front')!.thickness+.004,rear=L/2+c.armour.find(a=>a.mount==='rear')!.thickness+.004,side=W/2+sideArm+c.drive.width+.016;const clear=w.mount.z+w.radius< -nose||w.mount.z-w.radius>rear||Math.abs(w.mount.x)-w.radius>side;const under=w.mount.y+Math.max(w.thickness,w.toothHeight)/2< -H/2-.004;if(low&&!clear&&!under)err('weapon.mount','Place the bar in front, above the top armour, or fully below the chassis.');if(w.mount.y+H/2+ch.clearance-Math.max(w.thickness,w.toothHeight)/2<.003)err('weapon.mount','The rotating bar must clear the floor by 3 mm.');}
 if((w.type==='drum'||w.type==='vertical_disc')&&!recessedDrum&&w.mount.z+w.radius> -L/2-.005)err('weapon.mount','Drum rotation overlaps the chassis.');
 if((w.type==='drum'||w.type==='vertical_disc'||w.type==='vertical_bar')&&w.mount.y+H/2+ch.clearance-w.radius<.003)err('weapon.radius','Drum must clear the floor by 3 mm.');
 if(w.type==='vertical_bar'){
  if(w.teeth!==2)err('weapon.teeth','A vertical bar uses two opposing teeth.');
  if(wc.chassis.profile==='huge'&&Math.hypot(w.mount.y-(c.drive.radius-H/2-ch.clearance),w.mount.z)+w.radius>c.drive.radius-.012)err('weapon.radius','Keep HUGE’s blade at least 12 mm inside its wheel circle.');
  const centreGap=ch.profile==='huge'||ch.profile==='deep_six';
  if(centreGap&&w.thickness>.10)err('weapon.thickness','The vertical blade must fit the centre channel.');
  if(!centreGap&&w.mount.z+w.radius> -L/2-.005&&w.mount.y-w.radius<H/2+.005)err('weapon.mount','Use a split frame or move the vertical bar clear of the chassis.');
 }
 if(w.type==='horizontal_cage'){
  if(w.teeth!==3)err('weapon.teeth','The three-arm cage uses three teeth.');
  if(w.mount.y-Math.max(w.thickness,w.toothHeight)/2<H/2+.01)err('weapon.mount','The cage must clear the top armour.');
 }
 if(w.type==='shell_spinner'){
  const y=H/2+c.armour.find(a=>a.mount==='top')!.thickness-w.mount.y,inner=(w.radius-w.toothDepth)*(1-.36*Math.max(0,y/w.width))-w.thickness;
  if(y>=w.width-.004||inner<Math.hypot(W/2+sideArm+c.drive.width+.008,L/2+.004))err('weapon.radius','The shell must enclose the chassis and wheels with clearance.');
  if(w.mount.y+H/2+ch.clearance-Math.max(0,w.toothHeight/2-.009)<.003)err('weapon.mount','The shell must clear the floor by 3 mm.');
 }
 if(w.type==='hammer_saw'&&wc.chassis.profile==='sawblaze'&&sawblazeSweepClearance(wc,parts)<.002)err('weapon.mount','The complete blade sweep must clear the chassis and front forks.');
 if(w.type==='hammer_saw'&&H/2+ch.clearance+w.mount.y+(w.armLength??.59)*Math.sin(1.2-(w.armTravel??1.12))-w.radius<.003)err('weapon.armTravel','The lowered disc must clear the floor by 3 mm.');

 }
 }else if(!practice)err('weapon.type','An active weapon is required for combat.');
 if(w.type==='flipper'||w.type==='crusher')rotorInertia=parts.filter(p=>p.body==='rotor').reduce((sum,p)=>sum+partProperties(p).about(v(1,0,0)),0);
 if(w.type==='crusher'){
  let clearance=Infinity;const closed=axisQ(v(1,0,0),-w.travel);
  for(const p of parts)if(p.id.startsWith('crusher_tooth')&&p.shape.kind==='hull')for(let i=0;i<p.shape.vertices.length;i+=3){const point=add(p.position,rotate(v(p.shape.vertices[i],p.shape.vertices[i+1],p.shape.vertices[i+2]),p.rotation));clearance=Math.min(clearance,H/2+ch.clearance+w.mount.y+rotate(point,closed).y);}
  if(clearance<.003)err('weapon.travel','The closed crusher teeth must clear the floor by 3 mm. Reduce jaw travel or raise the hinge.');
 }
 if(c.selfRight.type==='roll_arm'){
 module('self_right',200,'titanium');
 if(verticalSelfRight(c)){
  const span=W+c.drive.width*2+(rc.chassis.profile==='hypershock'?.11:.07),fold=rc.chassis.profile==='hypershock'?1:-1;
  for(const side of[-1,1])part('vertical_righting_rail_'+side,'self_right','self_right',{kind:'cylinder',radius:.008,width:c.selfRight.length},v(side*.065,0,fold*c.selfRight.length/2),'titanium',undefined,axisQ(v(1,0,0),Math.PI/2));
  part('vertical_righting_foot','self_right','self_right',{kind:'cylinder',radius:.013,width:span},v(0,0,fold*(c.selfRight.length-.015)),'rubber',undefined,axisQ(v(0,0,1),Math.PI/2));
  part('vertical_righting_hinge','self_right','self_right',{kind:'cylinder',radius:.023,width:.17},v(),'aluminium7075',undefined,axisQ(v(0,0,1),Math.PI/2));
  if(c.selfRight.mount.y<H/2+.028||Math.abs(c.selfRight.mount.x)>.04||(fold===1?c.selfRight.mount.z> -L*.28||c.selfRight.mount.z+c.selfRight.length>L/2+.05:c.selfRight.mount.z<L*.28||c.selfRight.mount.z-c.selfRight.length< -L/2-.05))err('selfRight.mount','Keep the vertical folding arm centred above the deck.');
 }else if(rrc.chassis.profile==='gigabyte'){
  for(const side of[-1,1])part('shell_righting_rail_'+side,'self_right','self_right',{kind:'cylinder',radius:.012,width:c.selfRight.length},v(c.selfRight.length/2,0,side*.09),'titanium',undefined,axisQ(v(0,0,1),Math.PI/2));
  box('shell_righting_foot','self_right','self_right',v(.06,.028,.27),v(c.selfRight.length-.03,0,0),'rubber');
  if(w.type!=='shell_spinner'||c.selfRight.mount.y<w.mount.y+w.width+.025||Math.abs(c.selfRight.mount.x)>w.radius*.65||Math.abs(c.selfRight.mount.z)>.04)err('selfRight.mount','Keep the folding arm above the shell roof.');
 }else{
  box('roll_arm','self_right','self_right',v(.05,.035,c.selfRight.length),v(0,0,c.selfRight.length/2),'titanium');
  if(c.selfRight.mount.y<H/2+.028||Math.abs(c.selfRight.mount.x)<W/2+armourAt(c.selfRight.mount.x)+c.drive.width+.038)err('selfRight.mount','Place the roll arm above the chassis and outside the wheel envelope.');
 }
 box('roll_motor','self_right','chassis',v(.08,.08,.10),c.selfRight.mount,'aluminium7075',1.3,false);
 }else if(w.type==='flipper')module('self_right',0,'hardox');
 if(c.drive.traction==='tracks'&&c.drive.layout===2)err('drive.layout','Caterpillar treads need 4 or 6 rollers.');
 if(c.drive.layout>2&&(wheelBase(c)/(c.drive.layout/2-1))<c.drive.radius*2+.006)err('drive.radius','Adjacent wheels overlap.');
 if(Math.abs(wheelY)+c.drive.radius<H/2)err('drive.radius','Wheels cannot reach the floor.');
 if(w.type==='flipper'&&ch.profile!=='hydra'&&(w.mount.y-w.thickness/2<H/2+.004||w.mount.z> -L/2-.005))err('weapon.mount','Place the flipper hinge above and in front of the chassis.');
 if(w.type==='flipper'&&ch.profile==='hydra'&&(Math.abs(w.mount.x)+w.width*.245>W*.1225||w.mount.y+H/2+ch.clearance<.028||w.mount.z< -L*.10||w.mount.z>L*.48))err('weapon.mount','Keep the Hydra hinge inside the rear center channel and above the floor.');
 for(const attachment of c.attachments??[]){const donor=compile(preset(attachment.template),true).parts.find(p=>p.id===attachment.part);if(!donor||donor.body!=='chassis'||donor.module==='weapon'||donor.module==='weapon_actuator'||donor.module==='battery'||donor.module==='self_right'||donor.module.startsWith('drive_')){err('attachments','Choose a structural chassis or armor part. Install a functional assembly for motors, wheels, weapons, batteries, or arms.');continue;}const id='addon_'+attachment.id,p={...copy(donor),id,position:copy(attachment.mount),rotation:copy(attachment.rotation)};parts.push(p);if(p.module.startsWith('armour_')){const m=modules[p.module],hp=p.mass/(MATERIALS[p.material as Material]?.density??1100)*200000;m.present=m.functional=true;m.max+=hp;m.hp+=hp;m.material=p.material as Material;}}
 let min=v(Infinity,Infinity,Infinity),max=v(-Infinity,-Infinity,-Infinity),mass=0,com=v();
 function bounds(p:Part){const offset=p.body.startsWith('wheel_')?v():bodyOrigin(c,p.body);
 if(p.body==='rotor'&&isSpinner(w))return{pos:add(bodyOrigin(c,'rotor'),v(0,w.type==='shell_spinner'?w.width/2:0,0)),ext:isHorizontal(w)?v(w.radius,w.type==='shell_spinner'?w.width/2:Math.max(w.thickness,w.toothHeight)/2,w.radius):v((w.type==='vertical_bar'?w.thickness:w.width)/2,w.radius,w.radius)};
 const pos=add(offset,p.position);if(p.shape.kind==='cylinder'){const axis=rotate(v(0,1,0),p.rotation),ext=v();for(const k of ['x','y','z'] as const)ext[k]=Math.abs(axis[k])*p.shape.width/2+Math.sqrt(Math.max(0,1-axis[k]**2))*p.shape.radius;return{pos,ext};}
 const points:Vec[]=[];if(p.shape.kind==='hull'){for(let i=0;i<p.shape.vertices.length;i+=3)points.push(rotate(v(p.shape.vertices[i],p.shape.vertices[i+1],p.shape.vertices[i+2]),p.rotation));}else{for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])points.push(rotate(v(x*p.shape.size.x/2,y*p.shape.size.y/2,z*p.shape.size.z/2),p.rotation));}
 const lo=v(),hi=v();for(const k of ['x','y','z'] as const){lo[k]=Math.min(...points.map(p=>p[k]));hi[k]=Math.max(...points.map(p=>p[k]));}return{pos:add(pos,mul(add(lo,hi),.5)),ext:mul(sub(hi,lo),.5)};}

 for(const p of parts){mass+=p.mass;const b=bounds(p);com=add(com,mul(b.pos,p.mass));for(const k of ['x','y','z'] as const){min[k]=Math.min(min[k],b.pos[k]-b.ext[k]);max[k]=Math.max(max[k],b.pos[k]+b.ext[k]);}}
 com=v();for(const p of parts){const origin=p.body.startsWith('wheel_')?v():bodyOrigin(c,p.body);com=add(com,mul(add(partProperties(p).centre,origin),p.mass));}com=mul(com,1/mass);const inertia=v();for(const p of parts){const origin=p.body.startsWith('wheel_')?v():bodyOrigin(c,p.body),properties=partProperties(p);inertia.x+=properties.about(v(1,0,0),sub(com,origin));inertia.y+=properties.about(v(0,1,0),sub(com,origin));inertia.z+=properties.about(v(0,0,1),sub(com,origin));}
 const envelope=sub(max,min);if(mass>RULES.weight)err('mass',`Mass ${mass.toFixed(2)} kg exceeds 113.398 kg.`);
 if(envelope.x>2.200001||envelope.z>2.200001||envelope.y>1.600001)err('envelope',`Starting envelope ${envelope.x.toFixed(2)} × ${envelope.z.toFixed(2)} × ${envelope.y.toFixed(2)} m exceeds 2.2 × 2.2 × 1.6 m.`);
 let steady=0;if(isSpinner(w))for(let i=0;i<90*RULES.hz;i++){const motor=spinnerMotor(w,steady);steady+=(motor.torque-steady*.015)*RULES.dt/Math.max(.001,rotorInertia);}
 const spinLoad=isSpinner(w)?spinnerMotor(w,steady).watts:8;
 // Reference floor: rolling resistance 0.015, steady 50% voltage for half the drive duty.
 const load=.015*mass*9.81*c.drive.radius/c.drive.layout;let low=0,high=48*MOTORS[c.drive.motor].kv/c.drive.ratio*Math.PI/30;for(let i=0;i<50;i++){const mid=(low+high)/2;if(motorModel(c.drive.motor,c.drive.ratio,mid,.5).torque>load)low=mid;else high=mid;}
 const driveLoad=(motorModel(c.drive.motor,c.drive.ratio,(low+high)/2,.5).watts*.5+motorModel(c.drive.motor,c.drive.ratio,0,0).watts*.5)*c.drive.layout;
 const endurance=c.battery.capacityWh*3600/(spinLoad+driveLoad+8);
 return{config:c,parts,mass,com,inertia,rotorInertia,modules,errors,tip,availableRPM,spinup,endurance,envelope};
}
export function canonical(c:BotConfig){const clean=parseConfig(c);function sort(x:any):any{return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;}return JSON.stringify(sort(clean));}
export function encodeBuild(c:BotConfig){const bytes=new TextEncoder().encode(canonical(c));let s='';bytes.forEach(b=>s+=String.fromCharCode(b));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function decodeBuild(s:string){if(s.length>16384||!s.length||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid build code. Maximum size is 16 KiB.');let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)));}catch{throw Error('Invalid build encoding.');}return parseConfig(JSON.parse(text));}
export const moduleLabel=(id:string)=>id.replace(/^armour_/,'Armour · ').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());

/** Diagnostic only; never changes collision response or damage. */
export function feedPerTooth(approachSpeed:number,toothCount:number,omega:number):number|null{return toothCount>0&&Math.abs(omega)>1e-6?2*Math.PI*Math.max(0,approachSpeed)/(toothCount*Math.abs(omega)):null;}
