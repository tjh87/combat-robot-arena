import {hydraCoreRadius,hydraCoreWidth} from './hydra-wheels';
import {sawblazeNoseProfile} from './sawblaze-geometry';
import {sawbladeCells} from './sawblade-profile';
import {MATERIALS,partProperties,chiselShape,WEDGE_TIP,HYDRA_TIP,groundForkMount,v,add,sub,mul,length,axisQ,identity,armOffset,type BotConfig,type Spinner,type Part,type Slot,type Material,type Vec,type Quat} from './model';

// These plates, tubes and rotor sectors are the actual collision geometry.
// All hulls are convex prisms; mass and moments use the shared analytic model.
function writer(parts:Part[]){
 const put=(id:string,module:Slot,body:string,shape:Part['shape'],position=v(),material:Part['material']='hardox',rotation=identity,tooth?:number)=>{
  const volume=shape.kind==='box'?shape.size.x*shape.size.y*shape.size.z:shape.kind==='cylinder'?Math.PI*shape.radius**2*shape.width:shape.volume;
  parts.push({id,module,body,shape,position,material,rotation,mass:volume*(material==='rubber'?1100:MATERIALS[material].density),collides:true,tooth});
 };
 const box=(id:string,module:Slot,body:string,size:Vec,position=v(),mat:Material='hardox',rotation=identity)=>put(id,module,body,{kind:'box',size},position,mat,rotation);
 const prism=(id:string,module:Slot,body:string,width:number,section:number[][],position=v(),mat:Part['material']='hardox',rotation=identity,tooth?:number)=>{
  let twice=0;const vertices:number[]=[];for(let i=0;i<section.length;i++){const a=section[i],b=section[(i+1)%section.length];twice+=a[0]*b[1]-a[1]*b[0];}for(const x of[-width/2,width/2])for(const [y,z]of section)vertices.push(x,y,z);
  put(id,module,body,{kind:'hull',vertices,volume:Math.abs(twice)*width/2},position,mat,rotation,tooth);
 };
 const tube=(id:string,module:Slot,body:string,a:Vec,b:Vec,r:number,mat:Material='hardox')=>{
  const d=sub(b,a),len=length(d),n=mul(d,1/len),s=Math.sqrt(2*(1+n.y)),q:Quat=s<1e-6?axisQ(v(1,0,0),Math.PI):{x:n.z/s,y:0,z:-n.x/s,w:s/2};
  put(id,module,body,{kind:'cylinder',radius:r,width:len},mul(add(a,b),.5),mat,q);
 };
 const ring=(id:string,module:Slot,body:string,ro:number,ri:number,width:number,position=v(),mat:Part['material']='hardox',count=20)=>{
  for(let j=0;j<count;j++){const a=j*2*Math.PI/count,b=(j+1)*2*Math.PI/count;prism(j===0?id:id+'_'+j,module,body,width,[[ro*Math.cos(a),ro*Math.sin(a)],[ro*Math.cos(b),ro*Math.sin(b)],[ri*Math.cos(b),ri*Math.sin(b)],[ri*Math.cos(a),ri*Math.sin(a)]],position,mat);}
 };
 return{put,box,prism,tube,ring};
}
export function largeWheelParts(c:BotConfig,id:string,slot:Slot,position:Vec,parts:Part[]){
 const b=writer(parts),r=c.drive.radius,w=c.drive.width;
 b.ring(id,slot,id,r-.009,r*.84,w,position,'uhmw',16);
 b.ring(id+'_tread',slot,id,r,r-.009,w,position,'rubber',16);
 for(let j=0;j<5;j++)b.box(id+'_spoke_'+j,slot,id,v(w,.07,r*.77),add(position,v(0,Math.sin(j*Math.PI*2/5)*r*.40,Math.cos(j*Math.PI*2/5)*r*.40)),'uhmw',axisQ(v(1,0,0),-j*Math.PI*2/5));
 b.put(id+'_hub',slot,id,{kind:'cylinder',radius:r*.13,width:w+.018},position,'aluminium7075',axisQ(v(0,0,1),Math.PI/2));
}
export function racerWheelParts(c:BotConfig,id:string,slot:Slot,position:Vec,parts:Part[]){
 const b=writer(parts),r=c.drive.radius,w=c.drive.width;
 b.ring(id,slot,id,r,r*.78,w,position,'rubber',16);
 b.ring(id+'_rim',slot,id,r*.79,r*.67,.015,position,'aluminium7075',16);
 for(let j=0;j<5;j++)b.box(id+'_spoke_'+j,slot,id,v(.016,r*.13,r*.70),add(position,v(0,Math.sin(j*Math.PI*2/5)*r*.36,Math.cos(j*Math.PI*2/5)*r*.36)),'aluminium7075',axisQ(v(1,0,0),-j*Math.PI*2/5));
 b.put(id+'_hub',slot,id,{kind:'cylinder',radius:r*.23,width:.055},position,'aluminium7075',axisQ(v(0,0,1),Math.PI/2));
}
export function sawblazeFrontParts(c:BotConfig,parts:Part[],slot:Slot,thickness:number,material:Material){
 const b=writer(parts),offset=slot==='armour_front'?c.chassis.thickness/2+thickness/2:0,profile=sawblazeNoseProfile(c,offset),width=c.chassis.width*.88;
 for(let i=0;i<profile.length-1;i++){const a=profile[i],z=profile[i+1];b.prism('saw_nose_'+slot+'_'+i,slot,'chassis',width,[[a[0]-thickness/2,a[1]],[z[0]-thickness/2,z[1]],[z[0]+thickness/2,z[1]],[a[0]+thickness/2,a[1]]],v(),material);}
}
export function templateParts(c:BotConfig,parts:Part[]){
 const b=writer(parts),p=c.chassis.profile,w=c.weapon,L=c.chassis.length,W=c.chassis.width,H=c.chassis.height,floor=-H/2-c.chassis.clearance,top=H/2;
 if(p==='sawblaze')sawblazeFrontParts(c,parts,'chassis',c.chassis.thickness,c.chassis.material);
 const fork=(id:string,x:number,front:number,rear:number,width=.065,height=.07,mat:Material='hardox')=>{const tip=p==='hydra'?HYDRA_TIP:WEDGE_TIP;return b.prism(id,'chassis','chassis',width,[[floor+tip.clearance,front],[floor+height-.009,rear],[floor+height,rear],[floor+tip.clearance+tip.thickness,front]],v(x,0,0),mat);};
 // A thin triangular plate presents a floor-level edge to a sideways sweep.
 // Its inner rear corner rises into the existing scoop; the side is a ramp,
 // not the vertical end face of an extruded front wedge.
 const sideRamps=(id:string,inner:number,width:number,front:number,rear:number,height:number,mat:Material)=>{
  const tip=p==='hydra'?HYDRA_TIP:WEDGE_TIP;
  for(const side of[-1,1]){
   const vertices:number[]=[];
   for(const lift of[0,tip.thickness])for(const[x,y,z]of[[side*inner,floor+tip.clearance,front],[side*inner,floor+height,rear],[side*(inner+width),floor+tip.clearance,rear]])vertices.push(x,y+lift,z);
   b.put(id+'_'+side,'chassis','chassis',{kind:'hull',vertices,volume:width*(rear-front)*tip.thickness/2},v(),mat);
  }
 };
 if(p==='minotaur'){
  for(const side of[-1,1]){const x=side*(W/2+c.drive.width+.024);b.prism('drum_guard_'+side,'chassis','chassis',.012,[[floor+.008,-L*.61],[floor+.008,L*.43],[top-.01,L*.43],[top+.015,-L*.3]],v(x,0,0),'aluminium7075');}
 }
 if(p==='quantum'){
  const section=quantumScoopSection(c);
  for(let i=0;i<section.length-1;i++){
   const [a,d]=[section[i],section[i+1]];
   b.prism(i?'crusher_scoop_curve_'+i:'crusher_scoop','chassis','chassis',W+.08,[[a[1],a[0]],[d[1],d[0]],[d[1]+.004,d[0]],[a[1]+.004,a[0]]],v(),'hardox');
  }
  sideRamps('crusher_scoop_side',(W+.08)/2,.10,-.68,-.50,.058,'hardox');
  for(const side of[-1,1]){
   b.prism('crusher_shoulder_'+side,'chassis','chassis',.010,[[floor+.012,-.56],[top+.20,-.17],[top+.18,.12],[floor+.018,.23]],v(side*W*.40,0,0),'aluminium7075');
   b.tube('crusher_ram_'+side,'weapon_actuator','chassis',v(side*.14,top,.23),v(side*.14,top+.20,.02),.026,'aluminium7075');
  }
 }
 if(p==='icewave'&&w.type==='horizontal_bar'){
  // Stationary engine cowl above the rotating bar, with a central bearing.
  const r=.17,bevel=.043,outline=[[-r+bevel,-r],[r-bevel,-r],[r,-r+bevel],[r,r-bevel],[r-bevel,r],[-r+bevel,r],[-r,r-bevel],[-r,-r+bevel]],vertices:number[]=[];
  for(const y of[0,.18])for(const [x,z]of outline)vertices.push(x,y,z);
  b.put('engine_cowl','weapon_actuator','chassis',{kind:'hull',vertices,volume:(4*r*r-2*bevel*bevel)*.18},v(0,w.mount.y+.03,0),'uhmw');
  b.put('engine_bearing','weapon_actuator','chassis',{kind:'cylinder',radius:.046,width:.12},v(0,w.mount.y-.03,0),'aluminium7075');
  b.tube('engine_exhaust','weapon_actuator','chassis',v(0,w.mount.y+.19,.03),v(.01,w.mount.y+.29,.08),.019,'titanium');
  fork('engine_plow',0,-L/2-.14,-L/2+.015,W+.10,.09,'aluminium7075');
 }
 if(p==='hypershock'&&w.type==='vertical_disc'){
  for(const side of[-1,1]){
   fork('disc_scoop_'+side,side*.13,w.mount.z-.155,-L/2+.035,.105,.10,'aluminium7075');
   b.prism('disc_bearing_'+side,'weapon_actuator','chassis',.014,[[floor+.012,w.mount.z-.06],[floor+.018,-L/2+.04],[w.mount.y+.035,-L/2+.04],[w.mount.y+.055,w.mount.z+.025],[w.mount.y+.030,w.mount.z-.055]],v(side*(w.width/2+.017),0,0),'aluminium7075');
  }
  b.box('racer_spoiler','chassis','chassis',v(W*.78,.008,.065),v(0,top+.082,L*.38),'aluminium7075',axisQ(v(1,0,0),-.16));
  for(const side of[-1,1])b.box('spoiler_mount_'+side,'chassis','chassis',v(.008,.065,.014),v(side*W*.27,top+.035,L*.39),'aluminium7075');
 }
 if(p==='gigabyte'&&w.type==='shell_spinner'&&c.selfRight.type==='none'){
  b.tube('shell_mast','chassis','chassis',v(0,top,0),v(0,w.mount.y+w.width+.29,0),.009,'titanium');
  b.tube('shell_pointer','chassis','chassis',v(0,w.mount.y+w.width+.29,0),v(0,w.mount.y+w.width+.34,.33),.008,'titanium');
 }
 if(p==='whyachi'&&w.type==='horizontal_cage'){
  for(const side of[-1,1])fork('cage_skirt_'+side,side*(W/2+.06),-.27,.26,.09,.11,'aluminium7075');
  fork('cage_plow',0,-L/2-.10,-L/2+.025,W+.12,.10,'aluminium7075');
  b.put('cage_bearing','weapon_actuator','chassis',{kind:'cylinder',radius:.047,width:.14},v(0,w.mount.y-.06,0),'aluminium7075');
 }
 if(p==='huge'){
  for(const side of[-1,1]){
   const wheelX=W/2+c.armour.find(a=>a.mount===(side<0?'left':'right'))!.thickness+c.drive.width/2+.008;
   const axleY=c.drive.radius-H/2-c.chassis.clearance;
   b.tube('large_side_outrigger_'+side,'chassis','chassis',v(side*wheelX,axleY,0),v(side*(wheelX+.36),axleY,0),.014,'titanium');
   b.tube('large_tail_'+side,'chassis','chassis',v(side*W*.30,0,L*.3),v(side*W*.30,floor+.014,.48),.010,'titanium');
   b.tube('large_front_stabilizer_'+side,'chassis','chassis',v(side*W*.30,0,-L*.3),v(side*W*.30,floor+.014,-.26),.010,'titanium');
   b.tube('large_front_brace_'+side,'chassis','chassis',v(side*W*.42,-.02,0),v(side*W*.30,floor+.014,-.26),.007,'titanium');
   b.tube('large_tail_brace_'+side,'chassis','chassis',v(side*W*.42,-.02,0),v(side*W*.30,floor+.014,.48),.007,'titanium');
  }
 }
 if(w.type==='hammer_saw'){
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
 if(p==='deep_six'&&w.type==='vertical_bar'){
  for(const side of[-1,1]){
   for(const z of[-.13,.15])b.tube('vertical_tower_'+side+'_'+z,'weapon_actuator','chassis',v(side*.068,floor+.013,z),v(side*.068,w.mount.y+.01,w.mount.z),.014,'aluminium7075');
   fork('vertical_outrigger_'+side,side*(W/2-.038),-.68,.34,.035,.075,'aluminium7075');
   b.tube('vertical_tail_'+side,'chassis','chassis',v(side*(W/2-.038),floor+.06,.10),v(side*(W/2-.038),floor+.012,.70),.006,'titanium');
   b.tube('tower_brace_'+side,'weapon_actuator','chassis',v(side*.28,top,.10),v(side*.074,w.mount.y-.03,w.mount.z),.01,'aluminium7075');
  }
 }
}
export function quantumScoopSection(c:BotConfig){
 const floor=-c.chassis.height/2-c.chassis.clearance;
 return Array.from({length:9},(_,i)=>{const t=i/8;return[-.68+(.68-c.chassis.length/2+.035)*t,floor+WEDGE_TIP.clearance+.126*t*t];});
}
export function crusherParts(c:BotConfig,parts:Part[]){
 const w=c.weapon;if(w.type!=='crusher')return;const b=writer(parts),scale=w.length/.66;
 // Separate curved ribs leave the open, arched head visible from every side.
 const path=[[0,0],[.16,-.07],[.30,-.20],[.39,-.36],[.40,-.50],[.34,-.61]];
 for(const side of[-1,1])for(let i=0;i<path.length-1;i++){
  const a=path[i],z=path[i+1];b.prism('crusher_rib_'+side+'_'+i,'weapon','rotor',w.thickness,[[a[0]-.032,a[1]],[z[0]-.032,z[1]],[z[0]+.032,z[1]],[a[0]+.032,a[1]]].map(p=>[p[0]*scale,p[1]*scale]),v(side*w.width*.43,0,0),w.material);
 }
 for(const i of[1,3,4]){const p=path[i];b.tube('crusher_bridge_'+i,'weapon','rotor',v(-w.width*.43,p[0]*scale,p[1]*scale),v(w.width*.43,p[0]*scale,p[1]*scale),.016,w.material);}
 for(const side of[-1,1])b.prism('crusher_tooth_'+side,'weapon','rotor',.025,[[.38,-.565],[.34,-.645],[.18,-.66],[.25,-.595]].map(p=>[p[0]*scale,p[1]*scale]),v(side*w.width*.26,0,0),w.material,identity,side<0?0:1);
 if(c.chassis.profile==='quantum')for(const side of[-1,1])b.prism('crusher_tooth_rear_'+side,'weapon','rotor',.018,[[.38,-.43],[.38,-.47],[.18,-.462]].map(p=>[p[0]*scale,p[1]*scale]),v(side*w.width*.26,0,0),w.material,identity,side<0?2:3);
 b.put('crusher_pivot','weapon','rotor',{kind:'cylinder',radius:.031,width:w.width+.055},v(),'titanium',axisQ(v(0,0,1),Math.PI/2));
}
export function extendedRotor(c:BotConfig,w:Spinner,parts:Part[]){
 const b=writer(parts),R=w.radius,ro=R-w.toothDepth;
 if(c.chassis.profile==='hypershock'&&w.type==='vertical_disc'){
  // Two separately modelled steel cutters share a live axle. The swept
  // envelope is lower than the tyres on both sides of the inverted chassis.
  const thickness=Math.min(w.thickness,w.width*.28),offset=(w.width-thickness)/2;
  for(const side of[-1,1]){
   const pos=v(side*offset,0,0),prefix='hyper_disc_'+(side<0?'left':'right');
   b.ring(prefix,'weapon','rotor',ro,w.innerRadius,thickness,pos,w.material,24);
   for(let i=0;i<3;i++)b.box(prefix+'_spoke_'+i,'weapon','rotor',v(thickness,.023,ro*1.75),pos,w.material,axisQ(v(1,0,0),i*Math.PI/3));
   for(let i=0;i<w.teeth;i++){
    const a=i*Math.PI*2/w.teeth,r=Math.sqrt(R*R-w.toothHeight*w.toothHeight/4)-w.toothDepth/2;
    b.put(prefix+'_tooth_'+i,'weapon','rotor',chiselShape(v(thickness,w.toothDepth,w.toothHeight)),add(pos,v(0,r*Math.cos(a),r*Math.sin(a))),w.material,axisQ(v(1,0,0),a),i+(side>0?w.teeth:0));
   }
  }
  b.put('hyper_disc_axle','weapon','rotor',{kind:'cylinder',radius:.028,width:w.width+.030},v(),'titanium',axisQ(v(0,0,1),Math.PI/2));
  return;
 }
 if(w.type==='hammer_saw'&&c.chassis.profile==='sawblaze'){
  // Convex prisms share the approved SVG surface and both holes.
  const first=parts.length;let sector=0;
  for(const {section,tooth}of sawbladeCells(R)){
   const id=tooth===undefined?(sector++===0?'disc':'disc_'+(sector-1)):'tooth_'+tooth;
   // Center each hull locally to preserve Rapier precision at small SVG edges.
   const cy=section.reduce((sum,p)=>sum+p[0],0)/section.length,cz=section.reduce((sum,p)=>sum+p[1],0)/section.length;
   b.prism(id,'weapon','rotor',w.width,section.map(([y,z])=>[y-cy,z-cz]),v(0,cy,cz),w.material,identity,tooth);
   parts.at(-1)!.analyticPrism=true;
  }
  if(w.massKg!==undefined){
   // Game balance estimate: cell masses place the center of mass on the bore axis.
   // The model retains the configured rotor mass and the original SVG geometry.
   const cells=parts.slice(first).map(p=>({p,c:partProperties(p).centre}));
   let my=0,mz=0,yy=0,yz=0,zz=0;
   for(const {p,c}of cells){my+=p.mass*c.y;mz+=p.mass*c.z;yy+=p.mass*c.y*c.y;yz+=p.mass*c.y*c.z;zz+=p.mass*c.z*c.z;}
   const det=yy*zz-yz*yz,a=(-my*zz+mz*yz)/det,d=(-mz*yy+my*yz)/det;
   for(const {p,c}of cells){const factor=1+a*c.y+d*c.z;if(!Number.isFinite(factor)||factor<=0)throw Error('SVG blade balance requires positive cell masses.');p.mass*=factor;}
  }
  return;
 }
 if(w.type==='vertical_disc'||w.type==='hammer_saw'){
  b.ring('disc', 'weapon','rotor',ro,w.innerRadius,w.width,v(),w.material,20);
  b.put('disc_hub','weapon','rotor',{kind:'cylinder',radius:.041,width:w.width+.016},v(),w.material,axisQ(v(0,0,1),Math.PI/2));
  for(let j=0;j<4;j++)b.box('disc_spoke_'+j,'weapon','rotor',v(w.width,.024,ro*1.75),v(),w.material,axisQ(v(1,0,0),j*Math.PI/4));
 }else if(w.type==='vertical_bar'){
  if(c.chassis.profile==='deep_six'){
   // The opposed swept arms form a copper scythe with a narrow neck, broad
   // axe head and hooked back spur. All physical tips stay inside radius R.
   const r=R/.57,z=Math.min(r,w.width/.145),shape=(points:number[][])=>points.map(([y,z0])=>[y*r,z0*z]);
   for(const side of[-1,1]){
    const q=axisQ(v(1,0,0),side<0?Math.PI:0);
    b.prism('vertical_bar_root_'+side,'weapon','rotor',w.thickness,shape([[0,-.036],[.35,-.130],[.33,-.065],[.20,.010],[.07,.041]]),v(),w.material,q);
    b.prism('vertical_bar_sweep_'+side,'weapon','rotor',w.thickness*.75,shape([[.28,-.11],[.37,-.15],[.48,-.155],[.51,-.124],[.44,-.072],[.34,-.053]]),v(),w.material,q);
    b.prism('vertical_bar_tip_'+side,'weapon','rotor',w.thickness*.65,shape([[.43,-.15],[.52,-.16],[.555,-.11],[.54,-.08],[.48,-.07]]),v(),w.material,q);
    b.prism('vertical_bar_spur_'+side,'weapon','rotor',w.thickness*.55,shape([[.40,-.055],[.46,-.013],[.43,.060]]),v(),w.material,q);
   }
  }else{
   const reach=Math.sqrt(R*R-w.width*w.width/4)-w.toothDepth;
   for(const side of[-1,1]){
    const q=axisQ(v(1,0,0),side<0?Math.PI:0);
    b.prism('vertical_bar_root_'+side,'weapon','rotor',w.thickness,[[0,-w.width*.28],[reach*.62,-w.width*.55],[reach*.62,w.width*.12],[0,w.width*.28]],v(),w.material,q);
    b.prism('vertical_bar_tip_'+side,'weapon','rotor',w.thickness,[[reach*.62,-w.width*.55],[reach,-w.width*.12],[reach,w.width*.48],[reach*.62,w.width*.12]],v(),w.material,q);
   }
  }
  b.put('vertical_hub','weapon','rotor',{kind:'cylinder',radius:.048,width:w.thickness+.025},v(),w.material,axisQ(v(0,0,1),Math.PI/2));
 }else if(w.type==='horizontal_cage'){
  if(c.chassis.profile==='whyachi'){
   const tilt=8*Math.PI/180,lift=.04,L=R-w.toothDepth,span=Math.max(w.width*1.7,w.toothWidth),headR=Math.sqrt(R*R-span*span/4)-w.toothDepth/2,ends:Vec[]=[];
   for(let i=0;i<3;i++){const a=i*Math.PI*2/3,sy=Math.sin(a/2),cy=Math.cos(a/2),sx=Math.sin(tilt/2),cx=Math.cos(tilt/2),q={x:cy*sx,y:sy*cx,z:-sy*sx,w:cy*cx};const point=(x:number,y:number,z:number)=>{const zz=y*Math.sin(tilt)+z*Math.cos(tilt);return v(x*Math.cos(a)+zz*Math.sin(a),lift+y*Math.cos(tilt)-z*Math.sin(tilt),-x*Math.sin(a)+zz*Math.cos(a));};
    b.box('cage_arm_'+i,'weapon','rotor',v(w.width,w.thickness,L),point(0,0,L/2),w.material,q);ends.push(point(0,0,L));b.box('cage_hammer_'+i,'weapon','rotor',v(span,w.toothHeight*.65,w.toothDepth*.5),point(0,0,headR),w.material,q);
    for(const side of[-1,1]){const section=[[side*span*.29,headR-w.toothDepth*.45],[side*span*.5,headR-w.toothDepth*.20],[side*span*.5,Math.sqrt(R*R-span*span/4)]],heights=[w.toothHeight/2,w.toothHeight/2,.004],vertices:number[]=[];for(const sign of[-1,1])for(let k=0;k<3;k++){const p=point(section[k][0],sign*heights[k],section[k][1]);vertices.push(p.x,p.y,p.z);}const area=Math.abs((section[1][0]-section[0][0])*(section[2][1]-section[0][1])-(section[2][0]-section[0][0])*(section[1][1]-section[0][1]))/2,volume=area*heights.reduce((n,h)=>n+2*h,0)/3;b.put(side<0?'tooth_'+i:'tooth_'+i+'_outer','weapon','rotor',{kind:'hull',vertices,volume},v(),w.material,identity,i);}
   }
   for(let i=0;i<3;i++)b.tube('cage_tie_'+i,'weapon','rotor',ends[i],ends[(i+1)%3],.008,'titanium');b.put('cage_hub','weapon','rotor',{kind:'cylinder',radius:.052,width:.09},v(0,.02,0),'hardox');
  }else{
  const ends=Array.from({length:3},(_,i)=>v(Math.sin(i*Math.PI*2/3)*(R-w.toothDepth),0,Math.cos(i*Math.PI*2/3)*(R-w.toothDepth)));
  for(let i=0;i<3;i++){
   b.box('cage_arm_'+i,'weapon','rotor',v(w.width,w.thickness,R-w.toothDepth),mul(ends[i],.5),w.material,axisQ(v(0,1,0),i*Math.PI*2/3));
   b.tube('cage_tie_'+i,'weapon','rotor',ends[i],ends[(i+1)%3],.008,'titanium');
  }
  b.put('cage_hub','weapon','rotor',{kind:'cylinder',radius:.052,width:.05},v(),'hardox');

  }
 }else if(w.type==='shell_spinner'){
  const top=ro*.64,n=24,t=w.thickness;
  for(let i=0;i<n;i++)b.prism('shell_panel_'+i,'weapon','rotor',2*ro*Math.tan(Math.PI/n),[[0,ro-t],[0,ro],[w.width,top],[w.width,top-t]],v(),w.material,axisQ(v(0,1,0),i*2*Math.PI/n));
  for(let i=0;i<16;i++){
   const a=i*2*Math.PI/16,z=(i+1)*2*Math.PI/16,vertices:number[]=[],ri=top*.76;
   for(const y of[-.003,.003])for(const [r,angle]of[[ri,a],[top,a],[top,z],[ri,z]])vertices.push(r*Math.cos(angle),y,r*Math.sin(angle));
   b.put('shell_crown_'+i,'weapon','rotor',{kind:'hull',vertices,volume:.006*(top*top-ri*ri)*Math.sin(2*Math.PI/16)/2},v(0,w.width,0),w.material);
  }
  for(let i=0;i<3;i++)b.box('shell_spoke_'+i,'weapon','rotor',v(.025,.006,top*2),v(0,w.width,0),w.material,axisQ(v(0,1,0),i*Math.PI/3));
  b.put('shell_hub','weapon','rotor',{kind:'cylinder',radius:.06,width:.022},v(0,w.width,0),'aluminium7075');
  // Three raised, tapered teeth share the shell's spinning rigid body. Their
  // tips extend past the sloped roof without exceeding the lower teeth's reach.
  for(let i=0;i<3;i++)b.prism('shell_upper_tooth_'+i,'weapon','rotor',.075,
   [[-.015,top*.90],[.018,top*.92],[.024,top*1.06],[.003,ro*.88],[-.014,ro*.87]],
   v(0,w.width*.75,0),w.material,axisQ(v(0,1,0),i*Math.PI*2/3+Math.PI/6),w.teeth+i);
 }
 if(c.chassis.profile==='whyachi'&&w.type==='horizontal_cage')return;
 for(let i=0;i<w.teeth;i++){
  let a=i*2*Math.PI/w.teeth;
  if(w.type==='vertical_bar')a=i%2*Math.PI;
  const horizontal=w.type==='shell_spinner'||w.type==='horizontal_cage',wide=horizontal?w.toothWidth:w.type==='vertical_bar'?w.width:w.toothHeight,r=Math.sqrt(Math.max(.001,R*R-wide*wide/4))-w.toothDepth/2;
  const pos=horizontal?v(r*Math.sin(a),w.type==='shell_spinner'?.009:0,r*Math.cos(a)):v(0,r*Math.cos(a),r*Math.sin(a));
  const size=horizontal?v(w.toothWidth,w.toothHeight,w.toothDepth):v(w.type==='vertical_bar'?w.thickness:w.toothWidth,w.toothDepth,w.type==='vertical_bar'?w.width:w.toothHeight);
  if(w.type==='vertical_bar'){
   const section=c.chassis.profile==='deep_six'?[[.49,-.095],[.54,-.097],[.568,-.025],[.50,-.02]].map(([y,z])=>[y*R/.57,z*Math.min(R/.57,w.width/.145)]):[[r-w.toothDepth/2,-w.width*.5],[r+w.toothDepth*.4,-w.width*.5],[r+w.toothDepth/2,w.width*.1],[r-w.toothDepth/2,w.width*.5]];
   b.prism('tooth_'+i,'weapon','rotor',c.chassis.profile==='deep_six'?w.thickness*.8:w.thickness,section,v(),w.material,axisQ(v(1,0,0),a),i);
  }
  else b.put('tooth_'+i,'weapon','rotor',chiselShape(size),pos,w.material,axisQ(horizontal?v(0,1,0):v(1,0,0),a),i);
 }
}

export function hydraWheelParts(c:BotConfig,id:string,slot:Slot,position:Vec,parts:Part[]){
 const b=writer(parts),first=parts.length;
 b.ring(id,slot,id,c.drive.radius,hydraCoreRadius(c),c.drive.width,position,'rubber',32);
 for(const p of parts.slice(first))p.analyticPrism=true;
 b.put(id+'_hub',slot,id,{kind:'cylinder',radius:hydraCoreRadius(c),width:hydraCoreWidth(c)},position,'hardox',axisQ(v(0,0,1),Math.PI/2));
}
