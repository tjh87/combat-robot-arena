import {readFileSync,writeFileSync} from 'node:fs';
function replace(s,a,b){if(!s.includes(a))throw Error('Missing sleek-wheel anchor: '+a);return s.replace(a,b);}
function edit(path,fn){writeFileSync(path,fn(readFileSync(path,'utf8')));}
edit('src/model.ts',s=>{
 s="import {hydraSleekWheels} from './hydra-wheels';\n"+s;
 s=replace(s,'racerWheelParts,crusherParts','racerWheelParts,hydraWheelParts,crusherParts');
 s=replace(s,'hydraTuning?:1|2,','hydraTuning?:1|2|3,');
 s=replace(s,"return c.chassis.profile==='hypershock'?Math.max(c.chassis.length*.72","return c.chassis.profile==='hydra'?c.chassis.length*.425/.64:c.chassis.profile==='hypershock'?Math.max(c.chassis.length*.72");
 s=replace(s,'c.chassis.width/2+a+c.drive.width/2+.008','c.chassis.width/2+a+(hydraSleekWheels(c)?Math.max(.075,c.drive.width):c.drive.width)/2+.008');
 s=replace(s,'radius:.10,width:.075,ratio:14,hydraTuning:2','radius:.060,width:.040,ratio:8.4,hydraTuning:3');
 s=replace(s,"en(d.hydraTuning,[1,2] as const,'drive.hydraTuning')","en(d.hydraTuning,[1,2,3] as const,'drive.hydraTuning')");
 s=replace(s,'parsed.drive.hydraTuning!==2&&(parsed.drive.ratio===6.5||parsed.drive.ratio===14)','(parsed.drive.hydraTuning===undefined||parsed.drive.hydraTuning===1)&&(parsed.drive.ratio===6.5||parsed.drive.ratio===14)');
 const anchor=" if(parsed.chassis.profile==='hydra')parsed.drive.hydraTuning=2;";
 s=replace(s,anchor," if(parsed.chassis.profile==='hydra'&&parsed.chassis.length===.64&&parsed.chassis.width===.58&&parsed.chassis.height===.08&&parsed.weapon.type==='flipper'&&parsed.weapon.length===.663&&parsed.drive.traction!=='tracks'&&parsed.drive.layout===4&&parsed.drive.radius===.10&&parsed.drive.width===.075&&parsed.drive.motor==='drive48'&&parsed.drive.ratio===14&&parsed.drive.hydraTuning!==3){\n  parsed.drive.radius=.060;parsed.drive.width=.040;parsed.drive.ratio=8.4;\n  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-41.35266615371938)<1e-6)parsed.chassis.equipmentMassKg=preset(2).chassis.equipmentMassKg;\n }\n if(parsed.chassis.profile==='hydra')parsed.drive.hydraTuning=3;");
 s=replace(s,"else if(ch.profile==='hypershock'&&c.drive.traction!=='tracks')racerWheelParts(c,id,slot,v(x,wheelY,z),parts);else part","else if(ch.profile==='hypershock'&&c.drive.traction!=='tracks')racerWheelParts(c,id,slot,v(x,wheelY,z),parts);else if(hydraSleekWheels(c))hydraWheelParts(c,id,slot,v(x,wheelY,z),parts);else part");
 return s;
});
edit('src/mechanisms.ts',s=>"import {hydraCoreRadius,hydraCoreWidth} from './hydra-wheels';\n"+s+`\nexport function hydraWheelParts(c:BotConfig,id:string,slot:Slot,position:Vec,parts:Part[]){
 const b=writer(parts),first=parts.length;
 b.ring(id,slot,id,c.drive.radius,hydraCoreRadius(c),c.drive.width,position,'rubber',32);
 for(const p of parts.slice(first))p.analyticPrism=true;
 b.put(id+'_hub',slot,id,{kind:'cylinder',radius:hydraCoreRadius(c),width:hydraCoreWidth(c)},position,'hardox',axisQ(v(0,0,1),Math.PI/2));
}\n`);
edit('src/sim.ts',s=>{
 s="import {hydraSleekWheels} from './hydra-wheels';\n"+s;
 s=replace(s,"if(c.chassis.profile==='huge'&&c.drive.traction!=='tracks'&&p.body.startsWith('wheel_'))desc.setCollisionGroups(0);","if((c.chassis.profile==='huge'&&c.drive.traction!=='tracks'||hydraSleekWheels(c))&&p.body.startsWith('wheel_'))desc.setCollisionGroups(0);");
 const anchor=' const startHP={} as Record<Slot,number>;';
 const contact="  if(hydraSleekWheels(c))for(const[key,body]of bodies)if(key.startsWith('wheel_')){\n   const part=compiled.parts.find(p=>p.body===key)!,edge=Math.min(.0012,c.drive.width*.08),desc=RAPIER.ColliderDesc.roundCylinder(c.drive.width/2-edge,c.drive.radius-edge,edge).setRotation(axisQ(v(0,0,1),Math.PI/2)).setMass(0).setFriction(1.35).setRestitution(.06).setContactSkin(.001).setCollisionGroups(groups(id===0?2:4,id===0?21:19)).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);\n   const collider=this.world.createCollider(desc,body);colliders.set(key+'_contact',collider);this.meta.set(collider.handle,{bot:id,module:part.module,part:{...part,id:key+'_contact'}});\n  }\n";
 return replace(s,anchor,contact+anchor);
});
edit('src/finish-geometry.ts',s=>{
 s="import {hydraSleekWheels,hydraCoreRadius} from './hydra-wheels';\n"+s;
 return replace(s," if(wheel&&['huge','hypershock'].includes(c.chassis.profile??'')){"," if(wheel&&hydraSleekWheels(c))return ring(c.drive.radius,hydraCoreRadius(c),c.drive.width,Number(wheel[3]??0),32);\n if(wheel&&['huge','hypershock'].includes(c.chassis.profile??'')){");
});
edit('src/render.ts',s=>{
 s="import {hydraSleekWheels} from './hydra-wheels';\n"+s;
 s=replace(s,"composite=config.drive.traction!=='tracks'&&['huge','hypershock'].includes(config.chassis.profile??'')","composite=config.drive.traction!=='tracks'&&(['huge','hypershock'].includes(config.chassis.profile??'')||hydraSleekWheels(config))");
 return replace(s,"if(moulded&&group.kind==='uhmw')mesh.name='huge-moulded-five-spoke-wheel';","if(moulded&&group.kind==='uhmw')mesh.name='huge-moulded-five-spoke-wheel';if(hydraSleekWheels(config))mesh.name=group.kind==='rubber'?'hydra-sleek-wheel-tire':'hydra-sleek-wheel-hub';");
});
edit('src/visuals.ts',s=>"import {hydraHubDetail} from './hydra-wheel-finish';\n"+replace(s,' if(hydraDetail(mesh,p,c))return;',' if(hydraHubDetail(mesh,p,c)||hydraDetail(mesh,p,c))return;'));
edit('src/main.ts',s=>replace(s,"c.chassis.profile==='hydra'?.5:1,':1'","c.chassis.profile==='hydra'?.1:1,':1'"));
edit('tests/hydra-browser.mjs',s=>s.replaceAll("['drive.radius','100']","['drive.radius','60']").replaceAll("['drive.width','75']","['drive.width','40']").replaceAll("['drive.ratio','14']","['drive.ratio','8.4']"));
edit('tests/hydra-mobility-benchmark.ts',s=>s.replace('/^wheel_-?1_\\d$/','/^wheel_-?1_\\d(?:_contact)?$/'));
