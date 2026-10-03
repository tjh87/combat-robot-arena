import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const oldEquipment=Number(execFileSync('node',['--import','tsx','--input-type=module','-e',"import {preset} from './src/model.ts';console.log(preset(8).chassis.equipmentMassKg)"],{encoding:'utf8'}).trim());
function replace(s,a,b){if(!s.includes(a))throw Error('Reviewed source differs: '+a.slice(0,100));return s.replace(a,b);}
function edit(path,fn){const before=readFileSync(path,'utf8'),after=fn(before);if(after===before)throw Error('No edit: '+path);writeFileSync(path,after);}
edit('src/sawblade-profile.ts',s=>replace(s,'(centre[0]-x)*radius/pixelRadius','(x-centre[0])*radius/pixelRadius'));
edit('src/mechanisms.ts',s=>{
 s="import {sawblazeNoseProfile} from './sawblaze-geometry';\n"+s;
 const marker='export function templateParts';
 s=replace(s,marker,`export function sawblazeFrontParts(c:BotConfig,parts:Part[],slot:Slot,thickness:number,material:Material){
 const b=writer(parts),offset=slot==='armour_front'?c.chassis.thickness/2+thickness/2:0,profile=sawblazeNoseProfile(c,offset),width=c.chassis.width*.88;
 for(let i=0;i<profile.length-1;i++){const a=profile[i],z=profile[i+1];b.prism('saw_nose_'+slot+'_'+i,slot,'chassis',width,[[a[0]-thickness/2,a[1]],[z[0]-thickness/2,z[1]],[z[0]+thickness/2,z[1]],[a[0]+thickness/2,a[1]]],v(),material);}
}
`+marker);
 s=replace(s," const fork=(id:string", " if(p==='sawblaze')sawblazeFrontParts(c,parts,'chassis',c.chassis.thickness,c.chassis.material);\n const fork=(id:string");
 const start=s.indexOf(" if(w.type==='hammer_saw'){"),end=s.indexOf(" if(p==='deep_six'",start);if(start<0||end<start)throw Error('Missing hammer-saw assembly');
 s=s.slice(0,start)+` if(w.type==='hammer_saw'){
  const joint=-.435,front=-.57,rear=-L/2+.08,joinY=floor+.030;
  for(const side of[-1,0,1]){
   const body='ground_fork_'+side+'_0',mount=groundForkMount(c,side,0),pos=sub(v(side*.21,0,0),mount);
   b.prism('saw_fork_'+side,'chassis',body,.110,[[floor+.002,front],[floor+.002,joint],[joinY,joint]],pos,'titanium');
   b.prism('saw_fork_support_'+side,'chassis',body,.040,[[floor+.014,rear],[floor+.010,joint],[joinY,joint],[floor+.095,rear]],pos,'titanium');
   b.prism('saw_fork_collar_'+side,'chassis',body,.110,[[floor+.010,joint+.019],[floor+.010,joint],[joinY,joint],[floor+.035,joint+.019]],pos,'titanium');
   for(const flank of[-1,1])b.prism('saw_fork_web_'+side+'_'+flank,'chassis',body,.006,[[floor+.032,joint+.08],[floor+.080,rear-.035],[floor+.045,rear]],add(pos,v(flank*.023,0,0)),'titanium');
  }
  for(const side of[-1,1]){
   b.prism('saw_cheek_'+side,'weapon_actuator','chassis',.011,[[floor+.006,-L*.63],[floor+.006,L*.35],[top+.09,L*.35],[top+.13,-.05],[top*.6,-L*.50]],v(side*W*.43,0,0),'aluminium7075');
   b.tube('saw_pivot_support_'+side,'weapon_actuator','chassis',v(side*.075,top-.02,w.mount.z+.03),add(w.mount,v(side*.075,0,0)),.013,'aluminium7075');
   b.tube('saw_rear_skid_'+side,'chassis','chassis',v(side*W*.36,floor+.028,L*.36),v(side*W*.36,floor+.012,L/2+.035),.010,'titanium');
  }
  const end=armOffset(w);
  b.box('saw_arm_cover','weapon_actuator','weapon_arm',v(.065,.026,(w.armLength??.50)*.94),mul(end,.5),'aluminium7075',axisQ(v(1,0,0),1.2));
  for(const side of[-1,1])b.tube('saw_arm_'+side,'weapon_actuator','weapon_arm',v(side*.026,0,0),add(end,v(side*.026,0,0)),.010,'aluminium7075');
  b.put('arm_hinge','weapon_actuator','weapon_arm',{kind:'cylinder',radius:.038,width:.10},v(),'aluminium7075',axisQ(v(0,0,1),Math.PI/2));
  b.put('arm_bearing','weapon_actuator','weapon_arm',{kind:'cylinder',radius:.032,width:.082},end,'aluminium7075',axisQ(v(0,0,1),Math.PI/2));
  const upper=v(0,w.radius*.76,w.radius*.32),middle=v(0,w.radius*.24,w.radius*.82),lower=v(0,-w.radius*.45,w.radius*.61);
  for(const side of[-1,1]){const shift=v(side*(w.width/2+.024),0,0),points=[upper,middle,lower];for(let i=0;i<3;i++)b.tube('saw_guard_'+side+'_'+i,'weapon_actuator','weapon_arm',add(end,add(shift,points[i])),add(end,add(shift,points[(i+1)%3])),.006,'aluminium7075');}
  for(const [i,point]of[upper,lower].entries())b.put('saw_guard_roller_'+i,'weapon_actuator','weapon_arm',{kind:'cylinder',radius:.011,width:w.width+.075},add(end,point),'aluminium7075',axisQ(v(0,0,1),Math.PI/2));
 }
`+s.slice(end);return s;
});
edit('src/model.ts',s=>{
 s="import {sawblazeSweepClearance} from './sawblaze-geometry';\n"+s;
 s=replace(s,'templateParts,extendedRotor','templateParts,sawblazeFrontParts,extendedRotor');
 s=replace(s,"mount:v(0,.115,.115),armLength:.50","mount:v(0,.088,-.045),armLength:.50");
 s=replace(s,"else box('end'+side,'chassis'","else if(ch.profile!=='sawblaze'||side!==-1)box('end'+side,'chassis'");
 s=replace(s,"else box('armour_'+a.mount,('armour_'+a.mount)","else if(ch.profile==='sawblaze'&&a.mount==='front')sawblazeFrontParts(c,parts,'armour_front',t,a.material);else box('armour_'+a.mount,('armour_'+a.mount)");
 s=replace(s," if(w.type==='hammer_saw'&&H/2+ch.clearance", " if(w.type==='hammer_saw'&&ch.profile==='sawblaze'&&sawblazeSweepClearance(c,parts)<.002)err('weapon.mount','The complete blade sweep must clear the chassis and front forks.');\n if(w.type==='hammer_saw'&&H/2+ch.clearance");
 return s;
});
// Migrate only the saved default geometry and its unchanged hardware allowance.
const newEquipment=Number(execFileSync('node',['--import','tsx','--input-type=module','-e',"import {preset} from './src/model.ts';console.log(preset(8).chassis.equipmentMassKg)"],{encoding:'utf8'}).trim());
edit('src/model.ts',s=>replace(s,' // Keep saved stock builds compatible',` if(parsed.chassis.profile==='sawblaze'&&parsed.weapon.type==='hammer_saw'&&Math.abs(parsed.chassis.length-.52)<1e-6&&Math.abs(parsed.chassis.width-.47)<1e-6&&Math.abs(parsed.weapon.radius-.2032)<1e-6&&Math.abs(parsed.weapon.armLength!-.50)<1e-6&&Math.abs(parsed.weapon.mount.y-.115)<1e-6&&Math.abs(parsed.weapon.mount.z-.115)<1e-6){
  parsed.weapon.mount=v(parsed.weapon.mount.x,.088,-.045);
  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-${oldEquipment})<1e-6)parsed.chassis.equipmentMassKg=${newEquipment};
 }
 // Keep saved stock builds compatible`));
edit('src/sim.ts',s=>replace(s,"joint.setLimits(-.12,.18);","joint.setLimits(c.chassis.profile==='sawblaze'?-.02:-.12,c.chassis.profile==='sawblaze'?.015:.18);"));
edit('src/finish-geometry.ts',s=>{
 s="import {sawblazeNoseProfile} from './sawblaze-geometry';\n"+s;
 return replace(s,' const s=p.shape,w=c.weapon;\n',` const s=p.shape,w=c.weapon;
 if(c.chassis.profile==='sawblaze'&&p.id.startsWith('saw_nose_')&&s.kind==='hull'){
  const g=sawbladeSector(p),position=g.getAttribute('position'),normal=g.getAttribute('normal'),index=Number(p.id.split('_').at(-1)),profile=sawblazeNoseProfile(c),tangents=profile.map((_,i)=>{const a=profile[Math.max(0,i-1)],b=profile[Math.min(profile.length-1,i+1)],dy=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dy,dz);return new THREE.Vector3(0,-dz/length,dy/length);});
  for(let i=0;i<position.count;i++)if(normal.getY(i)>.05){const z=position.getZ(i),t=Math.abs(z-profile[index][1])<Math.abs(z-profile[index+1][1])?tangents[index]:tangents[index+1];normal.setXYZ(i,t.x,t.y,t.z);}
  return g;
 }
`);
});
edit('src/visuals.ts',s=>{
 s=replace(s,"c.chassis.profile==='sawblaze'&&p.id.startsWith('saw_fork')","c.chassis.profile==='sawblaze'&&/^saw_fork_-?[01]$/.test(p.id)");
 s=replace(s,"if(id.startsWith('saw_fork'))return c.identity.primary;","if(/^saw_fork_-?[01]$/.test(id))return c.identity.secondary;\n  if(id.startsWith('saw_fork_')||id.startsWith('saw_nose_')||id.startsWith('saw_guard_')&&!id.startsWith('saw_guard_roller'))return '#202729';");
 return replace(s," if(/^wheel_-?1_",` if(c.chassis.profile==='sawblaze'&&/^wheel_-?1_\\d+$/.test(p.id)&&p.shape.kind==='cylinder'){
  const green=metal(c.identity.secondary,.36,.20);for(const side of[-1,1])b.cylinder(p.shape.radius*.63,.006,[0,side*(p.shape.width/2+.005),0],green,undefined,40);
 }
 if(/^wheel_-?1_`);
});
edit('src/combat-visuals.ts',s=>{
 s="import {sawbladeExposure,updateSawbladeExposure} from './sawblaze-blur';\n"+s;
 s=replace(s,' const w=config.weapon,root=new THREE.Group();'," if(config.chassis.profile==='sawblaze'&&config.weapon.type==='hammer_saw')return sawbladeExposure(config);\n const w=config.weapon,root=new THREE.Group();");
 return replace(s,' const speed=Number.isFinite(rpm)?'," if(root.userData.sawbladeExposure){updateSawbladeExposure(rotor!,root,rpm,reduced,Math.sign(direction??root.userData.direction??1)||1);return;}\n const speed=Number.isFinite(rpm)?");
});
edit('src/render.ts',s=>{
 s="import {disposeSawbladeExposure} from './sawblaze-blur';\n"+s;
 s=replace(s,'for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();','for(const m of Array.isArray(o.material)?o.material:[o.material]){disposeSawbladeExposure(m);m.dispose();}');
 return replace(s,"for(const m of mats){if('map'in m)","for(const m of mats){disposeSawbladeExposure(m);if('map'in m)");
});
edit('tests/blades-update.ts',s=>{
 s=replace(s,'if(motion.userData.horizontal){','if(motion.userData.sawbladeExposure){assert(o.material instanceof THREE.ShaderMaterial);assert(o.material.uniforms.exposureAngle.value>0);assert.equal(o.material.blending,THREE.NormalBlending);}else if(motion.userData.horizontal){');
 s=replace(s,'if(!motion.userData.horizontal)assert(coverage<.04);','if(!motion.userData.horizontal&&!motion.userData.sawbladeExposure)assert(coverage<.04);');
 return replace(s,'if(!motion.userData.horizontal)assert.notEqual(mesh.rotation.z,angle);','if(!motion.userData.horizontal&&!motion.userData.sawbladeExposure)assert.notEqual(mesh.rotation.z,angle);');
});
console.log('Approved assembly source is ready. Hardware allowance:',{before:oldEquipment,after:newEquipment});
