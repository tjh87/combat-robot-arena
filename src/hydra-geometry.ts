import {MATERIALS,v,sub,add,mul,length,axisQ,identity,type BotConfig,type Part,type Slot,type Material,type Vec,type Quat} from './model';

// Preview 12 coordinates are game estimates. Negative Z is the nose.
export function hydraPoint(c:BotConfig,x:number,y:number,z:number){return v(x*c.chassis.width/.58,y*(c.chassis.height+c.chassis.clearance)/.100-c.chassis.height/2-c.chassis.clearance,(z+.010)*c.chassis.length/.64);}
function writer(parts:Part[]){
 const put=(id:string,module:Slot,body:string,shape:Part['shape'],position:Vec,material:Material,rotation=identity)=>{const volume=shape.kind==='box'?shape.size.x*shape.size.y*shape.size.z:shape.kind==='cylinder'?Math.PI*shape.radius**2*shape.width:shape.volume;parts.push({id,module,body,shape,position,material,rotation,mass:volume*MATERIALS[material].density,collides:true});};
 const prism=(id:string,module:Slot,body:string,width:number,section:number[][],position=v(),material:Material='aluminium7075')=>{let area=0;const vertices:number[]=[];for(let i=0;i<section.length;i++){const a=section[i],b=section[(i+1)%section.length];area+=a[0]*b[1]-a[1]*b[0];}for(const x of[-width/2,width/2])for(const [y,z]of section)vertices.push(x,y,z);put(id,module,body,{kind:'hull',vertices,volume:Math.abs(area)*width/2},position,material);parts.at(-1)!.analyticPrism=true;};
 const box=(id:string,module:Slot,body:string,size:Vec,position:Vec,material:Material='aluminium7075')=>put(id,module,body,{kind:'box',size},position,material);
 const tube=(id:string,module:Slot,body:string,a:Vec,b:Vec,r:number,material:Material='aluminium7075')=>{const d=sub(b,a),n=mul(d,1/length(d)),s=Math.sqrt(2*(1+n.y)),q:Quat=s<1e-6?axisQ(v(1,0,0),Math.PI):{x:n.z/s,y:0,z:-n.x/s,w:s/2};put(id,module,body,{kind:'cylinder',radius:r,width:length(d)},mul(add(a,b),.5),material,q);};
 return{prism,box,tube};
}
export function hydraChassisParts(c:BotConfig,parts:Part[]){
 const b=writer(parts),ch=c.chassis,sx=ch.width/.58,sz=ch.length/.64,sy=(ch.height+ch.clearance)/.100,p=(x:number,y:number,z:number)=>hydraPoint(c,x,y,z),section=(a:number[][])=>a.map(([y,z])=>{const q=p(0,y,z);return[q.y,q.z];});
 b.box('floor','chassis','chassis',v(ch.width,ch.thickness,ch.length),v(0,-ch.height/2+ch.thickness/2,0),ch.material);
 // Separate roof banks leave the flipper and cylinder channel open.
 for(const slot of['chassis','armour_top'] as const){const armour=c.armour.find(a=>a.mount==='top')!,t=slot==='chassis'?ch.thickness:armour.thickness,mat=slot==='chassis'?ch.material:armour.material;if(!t)continue;const y=ch.height/2+(slot==='chassis'?-t/2:t/2),prefix=slot==='chassis'?'lid':'armour_top';
  for(const side of[-1,1])b.box(prefix+'_'+side,slot,'chassis',v(.215*sx,t,.395*sz),v(side*.1785*sx,y,p(0,0,-.0525).z),mat);
  b.box(prefix+'_rear',slot,'chassis',v(.572*sx,t,.165*sz),v(0,y,p(0,0,.2275).z),mat);
 }
 const walls=(side:number,slot:Slot,t:number,mat:Material)=>{if(!t)return;const x=side*(ch.width/2+(slot==='chassis'?-t/2:t/2)),prefix=slot==='chassis'?'hydra_wall_'+side:'armour_'+(side<0?'left':'right');let n=0;
  const plate=(a:number[][])=>b.prism(prefix+'_'+n++,slot,'chassis',t,section(a),v(x,0,0),mat);
  plate([[.018,-.330],[.027,-.330],[.100,-.250],[.100,-.246],[.018,-.246]]);
  plate([[.018,-.246],[.035,-.246],[.035,.310],[.018,.310]]);plate([[.048,-.246],[.100,-.246],[.100,.310],[.048,.310]]);
  let rear=-.246;for(let z=-.240;z<.280;z+=.044){const a=Math.max(rear,z-.0065),end=z+.0065;if(a>rear)plate([[.035,rear],[.048,rear],[.048,a],[.035,a]]);rear=end;}
  plate([[.035,rear],[.048,rear],[.048,.310],[.035,.310]]);
 };
 for(const side of[-1,1]){walls(side,'chassis',ch.thickness,ch.material);const a=c.armour.find(a=>a.mount===(side<0?'left':'right'))!;walls(side,side<0?'armour_left':'armour_right',a.thickness,a.material);}
 b.box('end1','chassis','chassis',v(ch.width-2*ch.thickness,ch.height-2*ch.thickness,ch.thickness),v(0,0,(ch.length-ch.thickness)/2),ch.material);
 for(const name of['front','rear'] as const){const a=c.armour.find(a=>a.mount===name)!;if(!a.thickness)continue;if(name==='rear')b.box('armour_rear','armour_rear','chassis',v(ch.width,ch.height,a.thickness),v(0,0,(ch.length+a.thickness)/2),a.material);else for(const side of[-1,1])b.prism('armour_front_'+side,'armour_front','chassis',.215*sx,section([[.088,-.254],[.100,-.250],[.100,-.245],[.088,-.249]]),v(side*.1785*sx,0,0),a.material);}
 for(const side of[-1,1]){
  for(let i=0;i<6;i++){const leading=.006+i*.0025,heel=leading+Math.tan(Math.PI/6)*.145;b.prism('flipper_fang_'+side+'_'+i,'chassis','chassis',.041*sx,section([[heel,-.250],[leading,-.395],[leading-.003,-.395],[heel-.012,-.250]]),v(side*(.103+i*.034)*sx,0,0),'titanium');}
  b.prism('flipper_fang_side_'+side,'chassis','chassis',.007*sx,section([[.018,-.395],[.107,-.266],[.076,-.230],[.023,-.173]]),v(side*.289*sx,0,0),'titanium');
 }
 const front=p(0,.054,-.182),rear=p(0,.064,.083),d=mul(sub(rear,front),1/length(sub(rear,front)));
 b.tube('hydra_cylinder','weapon_actuator','chassis',front,rear,.024*sx);
 for(const [id,point,sign]of[['front',front,1],['rear',rear,-1]] as const)b.tube('hydra_cap_'+id,'weapon_actuator','chassis',add(point,mul(d,.007*sign)),add(point,mul(d,-.007*sign)),.027*sx);
 const w=c.weapon;if(w.type==='flipper'){
  b.tube('hydra_piston','weapon_actuator','chassis',rear,w.mount,.009*sx);
  b.tube('hydra_axle','weapon_actuator','chassis',add(w.mount,v(-.071*sx,0,0)),add(w.mount,v(.071*sx,0,0)),.010*sy);
  for(const side of[-1,1])b.prism('hydra_hinge_'+side,'weapon_actuator','chassis',.010*sx,section([[.074,.121],[.110,.131],[.113,.160],[.077,.173]]),v(side*.063*sx,0,0));
 }
}
export function hydraTineSamples(c:BotConfig,side:number){
 const w=c.weapon;if(w.type!=='flipper')throw Error('Hydra requires a flipper.');const middle=side===0,end=middle?-.520:-.500,sz=w.length/.663,sx=w.width/.22,sy=(c.chassis.height+c.chassis.clearance)/.100;
 const a=[.093,-.248],b=[.055,middle?-.323:-.314],d=[.0015,end+.051],e=[.001,end];
 return Array.from({length:25},(_,i)=>{const t=i/24,u=1-t,y=u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*d[0]+t*t*t*e[0],z=u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*d[1]+t*t*t*e[1],thickness=Math.min(.0008+(w.thickness===.028?.0272:w.thickness-.0008)*(1-t)**.55,Math.max(.0008,y-.0002));return{x:side*.041*sx,half:(middle?.015-.003*t:.022-.006*t)*sx,y:y*sy-c.chassis.height/2-c.chassis.clearance-w.mount.y,z:(z-.143)*sz,thickness:thickness*sy};});
}
export function hydraFlipperParts(c:BotConfig,parts:Part[]){
 const w=c.weapon;if(w.type!=='flipper')return;const b=writer(parts),sx=w.width/.22,sz=w.length/.663,sy=(c.chassis.height+c.chassis.clearance)/.100;
 for(const side of[-1,1])b.box('hydra_rail_'+side,'weapon','rotor',v(.014*sx,.012*sy,.378*sz),v(side*.047*sx,.004*sy,-.182*sz));
 b.box('hydra_bridge','weapon','rotor',v(.123*sx,.012*sy,.029*sz),v(0,.004*sy,-.010*sz));
 b.prism('hydra_neck','weapon','rotor',.148*sx,[[.004,-.369],[-.025,-.424],[-.035,-.424],[-.006,-.369]].map(([y,z])=>[y*sy,z*sz]));
 for(const side of[-1,0,1]){const samples=hydraTineSamples(c,side);for(let i=0;i<samples.length-1;i++){const a=samples[i],d=samples[i+1];b.prism('flipper_tine_'+side+'_'+i,'weapon','rotor',2*Math.min(a.half,d.half),[[a.y,a.z],[d.y,d.z],[d.y-d.thickness,d.z],[a.y-a.thickness,a.z]],v(a.x,0,0),w.material);}}
}
