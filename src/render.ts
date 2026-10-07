import {FollowCamera,StableTrackingPose} from './follow-camera';
import {componentConfig} from './model';
import {hydraSleekWheels} from './hydra-wheels';
import {hydraTineGeometry} from './hydra-finish';
import {disposeSawbladeExposure} from './sawblaze-blur';
import {WallCrackVisual} from './wall-cracks';
import {AdaptiveResolution,graphicsPixelRatio} from './performance';
import {compactGeometry} from './geometry-memory';
import {batteryOutlines} from './battery-outline';
import {trackMesh,animateTrack} from './track-visual';
import {BatteryFireVisual} from './battery-fire-visual';
import {quantumHead,quantumFang,quantumScoop,quantumShoulder} from './quantum-visual';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildFoundry,detailPart,hazardVisual,templateColor} from './visuals';
import {rotorMotion,updateRotorMotion} from './combat-visuals';
import {FlightLabel} from './flight-label';
import {finishedGeometry,frontMarker,hugeWheelGeometry,sawblazeNoseGeometry} from './finish-geometry';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RULES,batteryPosition,clamp,SLOTS,MATERIALS,compile,bodyOrigin,povMount,povDirection,identity,rotate,add,v,type BotConfig,type Part,type Vec} from './model';
import {Simulation,type VisualFrame} from './sim';
import {ExhaustPlume} from './exhaust';
import {TireEffects} from './tire-effects';
import {sparkProfile,sparkParticle,sparkMaterial,sparkHeadColor,writeSparkTrail,SPARK_CAPACITY,SPARK_TRAIL_FLOATS,roundParticleMaterial} from './impact-sparks';
export type Quality='low'|'medium'|'high';
const vec=(p:Vec)=>new THREE.Vector3(p.x,p.y,p.z);
export class ArenaRenderer{
 adaptive=true;resolution=new AdaptiveResolution();needsRender=true;private shadowDirty=true;private lastShadowTime=-Infinity;private lastShadowTick=-1;private lastShadowMode='';private lastVisualTick=-1;
 wallCracks=new WallCrackVisual();
 batteryFireVisual=new BatteryFireVisual();replayFireFrame?:VisualFrame;
 tireEffects=new TireEffects();
 private followCamera=new FollowCamera();private povTracking=new StableTrackingPose();private followGeneration=0;exhaust?:ExhaustPlume;renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(42,1,.05,100);insetCamera=new THREE.PerspectiveCamera(76,1,.04,70);arena=new THREE.Group();preMatch=false;cameraSideWall?:THREE.Object3D;bots=new THREE.Group();preview=new THREE.Group();effects=new THREE.Group();bodyGroups=new Map<string,THREE.Group>();partMeshes=new Map<string,THREE.Mesh>();hazardMeshes=new Map<string,THREE.Group>();replayRoot=new THREE.Group();replayGroups=new Map<string,THREE.Object3D>();mainLight:THREE.DirectionalLight;travelEnd?:THREE.Mesh;cameraTarget=new THREE.Vector3(0,.08,0);quality:Quality='medium';mode:'menu'|'match'|'builder'='menu';viewerBotId=0;cameraMode:'tactical'|'pov'|'chase'='tactical';width=1;height=1;resize:ResizeObserver;replay=false;time=0;lastInset=0;inset=false;reduced=false;triangleCount=0;drawCalls=0;renderMs=0;particles:THREE.Points;particlePositions:Float32Array;particleAges:Float32Array;particleVelocity:Float32Array;lastImpact=0;sparkTrails?:THREE.LineSegments;sparkTrailPositions=new Float32Array(SPARK_CAPACITY*SPARK_TRAIL_FLOATS);sparkColors=new Float32Array(SPARK_CAPACITY*SPARK_TRAIL_FLOATS);sparkLifetimes=new Float32Array(SPARK_CAPACITY);sparkLengths=new Float32Array(SPARK_CAPACITY);sparkSizes=new Float32Array(SPARK_CAPACITY);sparkBranches=new Uint8Array(SPARK_CAPACITY);sparkHeadColors=new Float32Array(SPARK_CAPACITY*3);sparkTints=new Float32Array(SPARK_CAPACITY*3);replaySparkTrails?:THREE.LineSegments;previewConfig?:BotConfig;travelLine:THREE.Line;disposed=false;environment:THREE.WebGLRenderTarget;smoke:THREE.Points;smokePositions=new Float32Array(64*3);smokeAges=new Float32Array(64).fill(-1);smokeClock=0;replayParticles?:THREE.Points;insetTarget?:THREE.WebGLRenderTarget;insetScene=new THREE.Scene();insetScreenCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);insetQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({toneMapped:false}));travelOrigin:THREE.Mesh;flightLabel?:FlightLabel;
 constructor(readonly container:HTMLElement,onLost:()=>void,onRestore:()=>void){
 this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setClearColor(0x0b1015);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;container.appendChild(this.renderer.domElement);
 this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onLost();});this.renderer.domElement.addEventListener('webglcontextrestored',onRestore);
 this.scene.fog=new THREE.FogExp2(0x0b1015,.021);this.scene.add(this.arena,this.bots,this.preview,this.effects,this.replayRoot,this.batteryFireVisual);
 const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;room.dispose();pmrem.dispose();
 this.scene.add(new THREE.HemisphereLight(0xc1d4ec,0x161c27,.85));this.mainLight=new THREE.DirectionalLight(0xf6f3ec,3.2);this.mainLight.position.set(3,14,5);this.mainLight.castShadow=true;this.mainLight.shadow.camera.left=-10;this.mainLight.shadow.camera.right=10;this.mainLight.shadow.camera.top=10;this.mainLight.shadow.camera.bottom=-10;this.mainLight.shadow.camera.near=.1;this.mainLight.shadow.camera.far=40;this.mainLight.shadow.bias=-.0007;this.mainLight.shadow.normalBias=.035;this.scene.add(this.mainLight);
 const fill=new THREE.DirectionalLight(0x4887e0,1.1);fill.position.set(-10,5,-6);this.scene.add(fill);const rim=new THREE.DirectionalLight(0xe0474a,1.0);rim.position.set(8,4,-5);this.scene.add(rim);
 this.makeArena();this.arena.add(this.wallCracks);this.particlePositions=new Float32Array(SPARK_CAPACITY*3);this.particleVelocity=new Float32Array(SPARK_CAPACITY*3);this.particleAges=new Float32Array(SPARK_CAPACITY).fill(-1);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.particlePositions,3));geo.setAttribute('color',new THREE.BufferAttribute(this.sparkHeadColors,3));geo.setAttribute('sparkSize',new THREE.BufferAttribute(this.sparkSizes,1));this.particles=new THREE.Points(geo,sparkMaterial());this.particles.frustumCulled=false;this.effects.add(this.particles);const streaks=new THREE.BufferGeometry();streaks.setAttribute('position',new THREE.BufferAttribute(this.sparkTrailPositions,3));streaks.setAttribute('color',new THREE.BufferAttribute(this.sparkColors,3));this.sparkTrails=new THREE.LineSegments(streaks,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));this.sparkTrails.frustumCulled=false;this.effects.add(this.sparkTrails);const smokeGeometry=new THREE.BufferGeometry();smokeGeometry.setAttribute('position',new THREE.BufferAttribute(this.smokePositions,3));this.smoke=new THREE.Points(smokeGeometry,roundParticleMaterial({color:0x858b8c,size:.21,transparent:true,opacity:.38,depthWrite:false}));this.smoke.frustumCulled=false;this.effects.add(this.smoke);this.exhaust=new ExhaustPlume();this.effects.add(this.exhaust.points,this.tireEffects.smoke,this.tireEffects.marks);
 this.travelLine=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(242*3),3)),new THREE.LineBasicMaterial({color:0xf2d56d,transparent:true,opacity:.8}));this.effects.add(this.travelLine);this.travelLine.visible=false;this.travelOrigin=new THREE.Mesh(new THREE.RingGeometry(.07,.105,20),new THREE.MeshBasicMaterial({color:0xf2d56d,side:THREE.DoubleSide}));this.travelOrigin.rotation.x=-Math.PI/2;this.travelOrigin.visible=false;this.effects.add(this.travelOrigin);this.travelEnd=new THREE.Mesh(new THREE.RingGeometry(.085,.12,24),new THREE.MeshBasicMaterial({color:0xffec9e,side:THREE.DoubleSide}));this.travelEnd.rotation.x=-Math.PI/2;this.travelEnd.visible=false;this.effects.add(this.travelEnd);this.insetScreenCamera.position.z=1;this.insetScene.add(this.insetQuad);
 this.flightLabel=new FlightLabel(container);
 this.resize=new ResizeObserver(()=>this.size());this.resize.observe(container);this.setQuality('medium');this.size();
 }
 size(){this.width=Math.max(1,this.container.clientWidth);this.height=Math.max(1,this.container.clientHeight);const ratio=graphicsPixelRatio(this.quality,devicePixelRatio,this.width,this.height,this.adaptive,this.resolution.scale);if(Math.abs(this.renderer.getPixelRatio()-ratio)>.001)this.renderer.setPixelRatio(ratio);this.renderer.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();this.needsRender=true;}
 material(color:string|number,roughness=.5,metalness=.65){return new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:metalness>.2?.35:0,clearcoatRoughness:.24});}
 box(size:Vec,pos:Vec,material:THREE.Material,parent:THREE.Object3D,shadow=true){const m=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),material);m.position.copy(vec(pos));m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
 textTexture(text:string,fg:string,bg:string,width=1024,height=128){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.font=`900 ${height*.59}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;ctx.fillText(text,width/2,height/2,width*.92);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 sign(text:string,width:number,height:number,pos:Vec,rotation:THREE.Euler,fg='#b6bfc2',bg='#1b2228'){const mat=new THREE.MeshStandardMaterial({map:this.textTexture(text,fg,bg),roughness:.7,metalness:.2});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);mesh.position.copy(vec(pos));mesh.rotation.copy(rotation);this.arena.add(mesh);return mesh;}
 makeArena(){buildFoundry(this.arena);this.cameraSideWall=this.arena.getObjectByName('camera-side-wall');this.arena.updateMatrixWorld(true);this.arena.traverse(o=>{o.matrixAutoUpdate=false;o.matrixWorldAutoUpdate=false;});}

 geometry(p:Part,config:BotConfig){return compactGeometry(finishedGeometry(p,config));}
 part(p:Part,config:BotConfig){if(p.body.startsWith('wheel_')||p.module.startsWith('drive_'))config=componentConfig(config,'drive');else if(p.body==='self_right'||p.module==='self_right')config=componentConfig(config,'selfRight');else if(p.module==='weapon'||p.module==='weapon_actuator'||p.body==='rotor'||p.body==='weapon_arm')config=componentConfig(config,'weapon');else if(p.module==='battery')config=componentConfig(config,'battery');const material=p.material==='rubber'?this.material('#151a1c',.78,.03):this.material(MATERIALS[p.material].color,MATERIALS[p.material].roughness,MATERIALS[p.material].metalness);
 if(p.module==='battery'){material.color.set('#274145');material.roughness=.55;material.metalness=.2;}
 if(p.id.startsWith('lid')||p.id.startsWith('armour_')||p.id==='wedge'){material.color.set(p.id.startsWith('armour_top')||p.id.startsWith('lid')?config.identity.primary:config.identity.secondary);material.roughness=['minotaur','tombstone','deep_six'].includes(config.chassis.profile??'')?.28:.20;material.clearcoat=.85;material.clearcoatRoughness=.18;}
 if(config.weapon.type==='horizontal_bar'&&p.id.startsWith('armour_')&&p.id!=='armour_top')material.color.lerp(new THREE.Color('#151a20'),.85);
 if(p.module==='weapon'){material.color.set(config.weapon.type==='horizontal_bar'?'#b61e27':config.weapon.type==='flipper'?config.identity.primary:p.tooth!==undefined?'#d3dce0':'#59656c');material.roughness=p.tooth!==undefined?.16:.28;}if(p.id.startsWith('frame_'))material.color.set('#1b2027');if(p.id.startsWith('drum_bearing_'))material.color.set(config.identity.primary);const paint=templateColor(p,config);if(paint)material.color.set(paint);const mesh=new THREE.Mesh(this.geometry(p,config),material);mesh.userData={module:p.module,part:p.id,material:p.material,baseColor:material.color.getHex(),baseRoughness:material.roughness};mesh.position.copy(vec(p.position));mesh.quaternion.set(p.rotation.x,p.rotation.y,p.rotation.z,p.rotation.w);mesh.castShadow=true;mesh.receiveShadow=true;
 if(mesh.geometry.userData.profileHood){material.vertexColors=true;material.color.set(0xffffff);mesh.userData.baseColor=0xffffff;}
 if(config.chassis.profile==='quantum'&&p.module==='weapon'){material.roughness=.12;material.metalness=.97;}detailPart(mesh,p,config);
 return mesh;}
 displayParts(config:BotConfig,parts:Part[]){
  const out:{p:Part,mesh:THREE.Mesh}[]=[],wheels=new Map<string,Part[]>(),composite=config.drive.traction!=='tracks'&&(['huge','hypershock'].includes(config.chassis.profile??'')||hydraSleekWheels(config));
  for(const p of parts){if(p.id.startsWith('track_belt_')){out.push({p,mesh:trackMesh(p,config)});continue;}if(!p.collides&&p.module!=='battery')continue;
  if(config.chassis.profile==='hydra'&&p.id.startsWith('flipper_tine_')){
   if(!p.id.endsWith('_0'))continue;const mesh=this.part(p,config);mesh.geometry.dispose();mesh.geometry=compactGeometry(hydraTineGeometry(config,Number(p.id.split('_')[2])));mesh.name='hydra-bronze-flipper-tine';out.push({p,mesh});continue;
  }
  if(config.chassis.profile==='sawblaze'&&p.id.startsWith('saw_nose_')){
   if(!p.id.endsWith('_0'))continue;const mesh=this.part(p,config);mesh.geometry.dispose();mesh.geometry=compactGeometry(sawblazeNoseGeometry(config,p.module==='armour_front'));out.push({p,mesh});continue;
  }
  if(config.chassis.profile==='quantum'&&(p.id==='crusher_scoop'||p.id.startsWith('crusher_scoop_curve_')||p.id.startsWith('crusher_shoulder_'))){
   if(p.id.startsWith('crusher_scoop_curve_'))continue;
   const mesh=p.id==='crusher_scoop'?quantumScoop(config):quantumShoulder(config,p.position.x<0?-1:1),material=mesh.material;
   mesh.userData={module:p.module,part:p.id,material:p.material,baseColor:material.color.getHex(),baseRoughness:material.roughness};out.push({p,mesh});continue;
  }
  if(config.chassis.profile==='quantum'&&config.weapon.type==='crusher'&&/^crusher_tooth_-?1$/.test(p.id)){const mesh=quantumFang(config,p.position.x<0?-1:1),material=mesh.material;mesh.userData={module:'weapon',part:p.id,material:p.material,baseColor:material.color.getHex(),baseRoughness:material.roughness};out.push({p,mesh});continue;}
  if(config.chassis.profile==='quantum'&&config.weapon.type==='crusher'&&/^(crusher_rib_|crusher_bridge_)/.test(p.id)){
   if(p.id==='crusher_rib_-1_0'){const mesh=quantumHead(config),material=mesh.material as THREE.MeshPhysicalMaterial;mesh.userData={module:'weapon',part:p.id,material:p.material,baseColor:material.color.getHex(),baseRoughness:material.roughness};out.push({p,mesh});}continue;
  }
  if(composite&&p.body.startsWith('wheel_')){const list=wheels.get(p.body)??[];list.push(p);wheels.set(p.body,list);}else out.push({p,mesh:this.part(p,config)});}
  // Wheel sectors share one moving body and damage module. Batch their exact
  // authored surfaces by finish; the independent collision sectors remain intact.
  for(const [body,list]of wheels){
   const origin=vec(bodyOrigin(config,body)),groups=new Map<string,{geometries:THREE.BufferGeometry[],material:THREE.MeshStandardMaterial,kind:string}>();
   const moulded=config.chassis.profile==='huge';let wheelSkin=false;
   for(const p of list){let root:THREE.Mesh;
    if(moulded&&p.material==='uhmw'){
     if(wheelSkin)continue;wheelSkin=true;root=new THREE.Mesh(hugeWheelGeometry(config.drive.radius,config.drive.width),this.material(config.identity.primary,.52,.03));root.position.copy(origin);
    }else root=this.part(p,config);
    root.position.sub(origin);root.updateMatrixWorld(true);
    root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const m=o.material as THREE.MeshStandardMaterial,key=[m.color.getHex(),m.roughness,m.metalness,m.map?.uuid??'',m.side,m.transparent,m.opacity].join('/');let group=groups.get(key);if(!group){const material=m.clone();if(m.map)material.map=m.map.clone();group={geometries:[],material,kind:p.material};groups.set(key,group);}const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));geo.applyMatrix4(o.matrixWorld);group.geometries.push(geo);});
    this.disposeObject(root);
   }
   let i=0;for(const group of groups.values()){const p=list[i++],geo=compactGeometry(mergeGeometries(group.geometries)!);group.geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,group.material);mesh.position.copy(origin);mesh.castShadow=mesh.receiveShadow=true;mesh.userData={module:p.module,part:p.id,material:group.kind,baseColor:group.material.color.getHex(),baseRoughness:group.material.roughness};if(moulded&&group.kind==='uhmw')mesh.name='huge-moulded-five-spoke-wheel';if(hydraSleekWheels(config))mesh.name=group.kind==='rubber'?'hydra-sleek-wheel-tire':'hydra-sleek-wheel-hub';out.push({p,mesh});}
  }return out;
 }
 attach(sim:Simulation){this.followCamera.reset();this.povTracking.reset();this.followGeneration++;this.wallCracks.update(sim.wallDamage.cracks);this.shadowDirty=true;this.needsRender=true;this.lastVisualTick=-1;this.clear(this.bots);this.bodyGroups.clear();this.partMeshes.clear();this.hazardMeshes.clear();this.lastImpact=0;this.endReplay();this.particleAges.fill(-1);this.smokeAges.fill(-1);this.smokeClock=0;this.exhaust?.reset();this.tireEffects.reset();
 for(const b of sim.bots){for(const [key]of b.bodies){const group=new THREE.Group();this.bots.add(group);this.bodyGroups.set(`b${b.id}:${key}`,group);}for(const {p,mesh} of this.displayParts(b.compiled.config,b.compiled.parts)){if(p.body.startsWith('wheel_'))mesh.position.sub(vec(bodyOrigin(b.compiled.config,p.body)));this.bodyGroups.get(`b${b.id}:${p.body}`)!.add(mesh);this.partMeshes.set(`b${b.id}:${p.id}`,mesh);}
 const rotor=this.bodyGroups.get(`b${b.id}:rotor`);if(rotor)rotor.add(rotorMotion(b.compiled.config));
 const ch=this.bodyGroups.get(`b${b.id}:chassis`)!;ch.add(frontMarker(b.compiled.config,b.id===0?'#91c9ff':'#ff8b69'),batteryOutlines(b.compiled.config));const light=new THREE.Mesh(new THREE.BoxGeometry(.16,.008,.013),new THREE.MeshBasicMaterial({color:b.id===0?0x72acff:0xff626b}));light.position.set(0,b.compiled.config.chassis.height/2+.006,.25);ch.add(light);
 const flagCanvas=document.createElement('canvas');flagCanvas.width=128;flagCanvas.height=48;const ctx=flagCanvas.getContext('2d')!;ctx.fillStyle=b.id===0?'#7ab5ff':'#ff7c86';ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.fillText(b.id===0?'■ P1':'◆ P2',64,34);const texture=new THREE.CanvasTexture(flagCanvas);const flag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));flag.scale.set(.74,.28,1);flag.position.set(0,.66,0);ch.add(flag);}
 for(const h of sim.hazards){const group=hazardVisual(h.kind,h.deck);
 this.bots.add(group);this.bodyGroups.set('hazard_'+h.id,group);this.hazardMeshes.set('hazard_'+h.id,group);}
 this.update(sim,0);
 }
 showBuilder(c:BotConfig){this.shadowDirty=true;this.needsRender=true;this.mode='builder';this.previewConfig=c;this.clear(this.preview);const compiled=compile(c,true),root=new THREE.Group();root.userData.createdAt=this.time;this.preview.add(root);for(const {p,mesh} of this.displayParts(c,compiled.parts)){if(!p.body.startsWith('wheel_'))mesh.position.add(vec(bodyOrigin(c,p.body)));root.add(mesh);}root.add(frontMarker(c,'#91c9ff'),batteryOutlines(c));const bounds=new THREE.Box3().setFromObject(root);root.userData.centre=bounds.getCenter(new THREE.Vector3());root.userData.span=bounds.getSize(new THREE.Vector3()).length();const pedestal=this.box(v(1.7,.12,1.7),v(0,-c.chassis.height/2-c.chassis.clearance-.065,0),this.material('#283239',.6,.6),root);pedestal.receiveShadow=true;}
 setQuality(q:Quality){this.quality=q;this.resolution.reset();this.renderer.shadowMap.enabled=q!=='low';const n=q==='high'?2048:q==='medium'?1024:512;if(this.mainLight.shadow.mapSize.x!==n){this.mainLight.shadow.mapSize.set(n,n);this.mainLight.shadow.map?.dispose();this.mainLight.shadow.map=null;}this.shadowDirty=true;this.size();}
 setAdaptive(enabled:boolean){this.adaptive=enabled;this.resolution.reset();this.size();}
 observeFrame(seconds:number){if(this.adaptive&&this.resolution.sample(seconds))this.size();}
 update(sim:Simulation,dt:number,alpha=1){if(!this.replay)this.wallCracks?.update(sim.wallDamage.cracks);if(this.mode!=='match'&&this.lastVisualTick===sim.tick)return;this.lastVisualTick=sim.tick;for(const b of sim.bots){for(const [key,body]of b.bodies){const group=this.bodyGroups.get(`b${b.id}:${key}`);if(!group)continue;const current=body.translation(),q=body.rotation(),previous=sim.pre.get(body.handle);if(previous&&alpha<1){group.position.lerpVectors(vec(previous.p),vec(current),alpha);group.quaternion.set(previous.q.x,previous.q.y,previous.q.z,previous.q.w).slerp(new THREE.Quaternion(q.x,q.y,q.z,q.w),alpha);}else{group.position.copy(vec(current));group.quaternion.set(q.x,q.y,q.z,q.w);}}for(const p of b.compiled.parts){const mesh=this.partMeshes.get(`b${b.id}:${p.id}`);if(!mesh)continue;const m=b.modules[p.module];mesh.visible=b.colliders.has(p.id);this.applyHealth(mesh,m.max?m.hp/m.max:1);if(p.id.startsWith('track_belt_'))animateTrack(mesh,b.trackPhase?.[mesh.userData.trackSide]??0);}updateRotorMotion(this.bodyGroups.get(`b${b.id}:rotor`),b.rpm,this.time,this.reduced,Math.sign(sim.omega(b))||b.spinDirection);}
 const liveDebris=new Set<string>();for(const d of sim.debris){liveDebris.add(d.id);let group=this.bodyGroups.get(d.id);if(!group){group=new THREE.Group();const mesh=this.part({...d.part,position:v(),rotation:identity},sim.bots[Number(d.id.split('_')[2])===1?1:0].compiled.config);group.add(mesh);this.bots.add(group);this.bodyGroups.set(d.id,group);}group.position.copy(vec(d.body.translation()));const q=d.body.rotation();group.quaternion.set(q.x,q.y,q.z,q.w);}for(const [id,g]of this.bodyGroups)if(id.startsWith('debris_')&&!liveDebris.has(id)){this.disposeObject(g);this.bodyGroups.delete(id);}
 for(const h of sim.hazards){const group=this.hazardMeshes.get('hazard_'+h.id)!;group.position.copy(vec(h.body.translation()));const q=h.body.rotation();group.quaternion.set(q.x,q.y,q.z,q.w);group.traverse(o=>{if(o instanceof THREE.Mesh&&(o.material as THREE.MeshStandardMaterial).emissive)(o.material as THREE.MeshStandardMaterial).emissive.setHex(h.phase==='warning'?0x85420a:0x000000);});}
 for(const event of sim.events)if(event.id>this.lastImpact&&sim.tick-event.tick>=10){this.lastImpact=event.id;if(event.cause!=='crush'&&event.cause!=='battery fire')this.sparks(event.point,event.energy,event.sparkDirection,event.id,event.allocations.reduce((sum,a)=>sum+a.hp,0));}
 this.exhaust?.update(sim,dt,this.reduced);
 this.tireEffects.update(sim,dt,this.reduced);
 const track=sim.displayedTravel;this.flightLabel?.update(track);this.travelLine.visible=!!track&&this.mode==='match';this.travelOrigin.visible=this.travelLine.visible;if(this.travelEnd)this.travelEnd.visible=this.travelLine.visible;
 if(track){this.travelOrigin.position.set(track.origin.x,.044,track.origin.z);this.travelEnd?.position.set(track.final.x,.045,track.final.z);
 const a=this.travelLine.geometry.getAttribute('position') as THREE.BufferAttribute,points=[...track.points,track.final].slice(0,a.count);
 points.forEach((p,i)=>a.setXYZ(i,p.x,.046+Math.max(0,p.y-track.origin.y),p.z));a.needsUpdate=true;this.travelLine.geometry.setDrawRange(0,points.length);this.travelLine.geometry.computeBoundingSphere();}
 if(dt>0&&!this.reduced){this.smokeClock+=dt;if(this.smokeClock>=.1){this.smokeClock%=.1;for(const b of sim.bots)for(const slot of['drive_left','drive_right','weapon_actuator','chassis'] as const){const m=b.modules[slot];if(m.present&&m.hp/m.max<.65){const i=this.smokeAges.findIndex(a=>a<0);if(i>=0){const point=add(b.chassis.translation(),rotate(v(slot==='drive_left'?-.22:slot==='drive_right'?.22:0,.17,slot==='weapon_actuator'?-.16:.05),b.chassis.rotation()));this.smokePositions.set([point.x,point.y,point.z],i*3);this.smokeAges[i]=1.2;}}}}}
 for(let i=0;i<64;i++){if(this.smokeAges[i]<0)this.smokePositions[i*3+1]=-10;else{this.smokeAges[i]-=dt;this.smokePositions[i*3]+=(i%2?.025:-.025)*dt;this.smokePositions[i*3+1]+=.23*dt;}}this.smoke.geometry.getAttribute('position').needsUpdate=true;this.smoke.visible=!this.reduced&&this.smokeAges.some(a=>a>=0);
 this.animateParticles(dt);
 }
 sparks(p:Vec,energy:number,direction:Vec=v(0,.4,1),seed=0,damage=0){
  if(this.reduced)return;const count=sparkProfile(energy).count;let emitted=0;
  for(let i=0;i<this.particleAges.length&&emitted<count;i++)if(this.particleAges[i]<0){
   const j=i*3,particle=sparkParticle(energy,direction,emitted++,seed,damage),velocity=particle.velocity;
   this.sparkTints.set([particle.color.x,particle.color.y,particle.color.z],j);this.particlePositions.set([p.x,p.y+.008,p.z],j);this.particleVelocity.set([velocity.x,velocity.y,velocity.z],j);
   this.particleAges[i]=this.sparkLifetimes[i]=particle.life;this.sparkLengths[i]=particle.trail;this.sparkSizes[i]=particle.size;this.sparkBranches[i]=Number(particle.branch);
  }
  this.particles.geometry.getAttribute('sparkSize').needsUpdate=true;
 }
 animateParticles(dt:number){
  const active=!this.reduced&&this.particleAges.some(age=>age>=0);this.particles.visible=active;if(this.sparkTrails)this.sparkTrails.visible=active;if(!active)return;
  for(let i=0;i<this.particleAges.length;i++){
   const j=i*3,t=i*SPARK_TRAIL_FLOATS;
   if(this.particleAges[i]<0){this.particlePositions[j+1]=-10;this.sparkTrailPositions.fill(-10,t,t+SPARK_TRAIL_FLOATS);continue;}
   this.particleAges[i]-=dt;this.particleVelocity[j+1]-=9.81*dt;
   const drag=Math.exp(-.55*dt);this.particleVelocity[j]*=drag;this.particleVelocity[j+2]*=drag;
   for(let k=0;k<3;k++)this.particlePositions[j+k]+=this.particleVelocity[j+k]*dt;
   if(this.particlePositions[j+1]<.012){this.particlePositions[j+1]=.012;this.particleVelocity[j+1]=Math.abs(this.particleVelocity[j+1])*.22;this.particleVelocity[j]*=.78;this.particleVelocity[j+2]*=.78;}
   const fade=Math.max(0,this.particleAges[i]/this.sparkLifetimes[i]),tint=v(this.sparkTints[j],this.sparkTints[j+1],this.sparkTints[j+2]);
   writeSparkTrail(this.sparkTrailPositions,this.sparkColors,i,this.particlePositions[j],this.particlePositions[j+1],this.particlePositions[j+2],this.particleVelocity[j],this.particleVelocity[j+1],this.particleVelocity[j+2],this.sparkLengths[i],fade,!!this.sparkBranches[i],tint);
   const color=sparkHeadColor(tint,fade);this.sparkHeadColors.set([color.x,color.y,color.z],j);
  }
  this.particles.visible=!this.reduced;if(this.sparkTrails){this.sparkTrails.visible=!this.reduced;this.sparkTrails.geometry.getAttribute('position').needsUpdate=true;this.sparkTrails.geometry.getAttribute('color').needsUpdate=true;}
  this.particles.geometry.getAttribute('position').needsUpdate=true;this.particles.geometry.getAttribute('color').needsUpdate=true;
 }
 applyHealth(mesh:THREE.Mesh,health:number){
 if(mesh.userData.appliedHealth===health)return;mesh.userData.appliedHealth=health;
 const {module,material,baseColor,baseRoughness}=mesh.userData,mat=mesh.material as THREE.MeshStandardMaterial;
 if(baseColor!==undefined)mat.color.setHex(baseColor).lerp(new THREE.Color(0x342e29),(1-health)*.65).multiplyScalar(.72+.28*health);
 mat.roughness=Math.min(1,(baseRoughness??(material==='rubber'?.91:.42))+(1-health)*.75);
 if(module==='weapon_actuator'||String(module).startsWith('drive'))mat.emissive.setRGB((1-health)*.20,0,0);
 for(const child of mesh.children){if(child.userData.paint&&child instanceof THREE.Mesh){const paint=child.material as THREE.MeshStandardMaterial;paint.color.setScalar(.62+.38*health);paint.roughness=Math.min(1,.29+(1-health)*.65);}}
 if((String(module).startsWith('armour_')||module==='chassis')&&material!=='uhmw'){const damage=1-health;mesh.scale.set(1,1,1);const axis=String(module).endsWith('top')?'y':String(module).endsWith('left')||String(module).endsWith('right')?'x':'z';mesh.scale[axis]=1-damage*.42;}
 if(material==='uhmw'&&String(module).startsWith('armour_')){mesh.scale.set(1,1,1);const mount=String(module).slice(7);mesh.scale[mount==='top'?'y':mount==='left'||mount==='right'?'x':'z']=Math.max(0,health);}
 }
 startReplay(){this.endReplay();this.shadowDirty=true;this.needsRender=true;this.replay=true;this.bots.visible=false;for(const [id,group]of this.bodyGroups){const clone=group.clone(true);clone.traverse(o=>{if(o instanceof THREE.Mesh)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();else if(o instanceof THREE.Sprite||o instanceof THREE.Line)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();});this.replayRoot.add(clone);this.replayGroups.set(id,clone);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY*3),3));geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY*3),3));geometry.setAttribute('sparkSize',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY),1));this.replayParticles=new THREE.Points(geometry,sparkMaterial());this.replayParticles.frustumCulled=false;this.replayRoot.add(this.replayParticles);const tails=new THREE.BufferGeometry();tails.setAttribute('position',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY*SPARK_TRAIL_FLOATS),3));tails.setAttribute('color',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY*SPARK_TRAIL_FLOATS),3));this.replaySparkTrails=new THREE.LineSegments(tails,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));this.replaySparkTrails.frustumCulled=false;this.replayRoot.add(this.replaySparkTrails);}
 replayFrame(frame:VisualFrame,next?:VisualFrame,alpha=0){this.wallCracks?.update(frame.wallCracks);const renderTick=frame.tick+(next?next.tick-frame.tick:0)*alpha,nextTransforms=new Map(next?.transforms.map(t=>[t.id,t])??[]);this.replayFireFrame=frame;for(let i=0;i<2;i++)updateRotorMotion(this.replayGroups.get(`b${i}:rotor`),THREE.MathUtils.lerp(frame.rpm?.[i]??0,next?.rpm?.[i]??frame.rpm?.[i]??0,alpha),renderTick/RULES.hz,this.reduced,frame.directions?.[i]);const present=new Set(frame.transforms.map(t=>t.id));for(const [id,g]of this.replayGroups)if(id.startsWith('debris_'))g.visible=present.has(id);for(const t of frame.transforms){const group=this.replayGroups.get(t.id);if(group){const following=nextTransforms.get(t.id);group.position.copy(vec(t.p));group.quaternion.set(t.q.x,t.q.y,t.q.z,t.q.w);if(following&&alpha>0){group.position.lerp(vec(following.p),alpha);group.quaternion.slerp(new THREE.Quaternion(following.q.x,following.q.y,following.q.z,following.q.w),alpha);}const match=/^b([01]):/.exec(t.id);if(match){const bot=Number(match[1]);group.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.module){const slot=SLOTS.indexOf(o.userData.module),health=frame.health[bot][slot];if(String(o.userData.module).startsWith('armour_'))o.visible=health>0;this.applyHealth(o,health);if(o.userData.trackSide!==undefined)animateTrack(o,frame.tracks?.[bot]?.[o.userData.trackSide]??0);}});}}}if(this.replayParticles&&this.replaySparkTrails){
 const p=this.replayParticles.geometry.getAttribute('position') as THREE.BufferAttribute,c=this.replayParticles.geometry.getAttribute('color') as THREE.BufferAttribute,sizes=this.replayParticles.geometry.getAttribute('sparkSize') as THREE.BufferAttribute,tail=this.replaySparkTrails.geometry.getAttribute('position') as THREE.BufferAttribute,colors=this.replaySparkTrails.geometry.getAttribute('color') as THREE.BufferAttribute;let j=0;
 for(const e of frame.effects){const t=Math.max(0,(renderTick-e.tick)/RULES.hz),spec=sparkProfile(e.energy);if(t>=spec.life)continue;
  for(let i=0;i<spec.count&&j<SPARK_CAPACITY;i++){
   const particle=sparkParticle(e.energy,e.direction??v(0,.4,1),i,e.id,e.damage??0);if(t>=particle.life)continue;
   const {x:vx,y:vy,z:vz}=particle.velocity,fade=1-t/particle.life,drag=(1-Math.exp(-.55*t))/.55;
   const x=e.p.x+vx*drag,y=Math.max(.012,e.p.y+.008+vy*t-4.905*t*t),z=e.p.z+vz*drag;
   const color=sparkHeadColor(particle.color,fade);p.setXYZ(j,x,y,z);c.setXYZ(j,color.x,color.y,color.z);sizes.setX(j,particle.size);
   writeSparkTrail(tail.array as Float32Array,colors.array as Float32Array,j,x,y,z,vx,vy-9.81*t,vz,particle.trail,fade,particle.branch,particle.color);j++;
  }
 }
 while(j<SPARK_CAPACITY){p.setXYZ(j,0,-10,0);(tail.array as Float32Array).fill(-10,j*SPARK_TRAIL_FLOATS,(j+1)*SPARK_TRAIL_FLOATS);j++;}
 for(const attribute of[p,c,sizes,tail,colors])attribute.needsUpdate=true;this.replayParticles.visible=this.replaySparkTrails.visible=!this.reduced;
 }}

 endReplay(){this.followCamera.reset();this.povTracking.reset();this.shadowDirty=true;this.needsRender=true;this.replayFireFrame=undefined;this.replay=false;this.bots.visible=true;this.replayRoot.traverse(o=>{if(o instanceof THREE.Mesh){if(o instanceof THREE.InstancedMesh)o.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){disposeSawbladeExposure(m);m.dispose();}}else if(o instanceof THREE.Sprite)o.material.dispose();else if(o instanceof THREE.Line){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});if(this.replayParticles){this.replayParticles.geometry.dispose();(this.replayParticles.material as THREE.Material).dispose();this.replayParticles=undefined;}if(this.replaySparkTrails){this.replaySparkTrails.geometry.dispose();this.replaySparkTrails=undefined;}this.replayRoot.clear();this.replayGroups.clear();}
 positionPOVCamera(camera:THREE.PerspectiveCamera,sim:Simulation,dt=.016){
 const side=this.viewerBotId??0,config=sim.bots[side].compiled.config,body=(this.replay?this.replayGroups:this.bodyGroups).get('b'+side+':chassis'),p=body?.position??vec(sim.bots[side].chassis.translation()),raw=sim.bots[side].chassis.rotation(),q=body?.quaternion??new THREE.Quaternion(raw.x,raw.y,raw.z,raw.w);
 const state=this.povTracking.update(p,q,config,this.followGeneration+'/'+side+'/'+this.replay,dt),heading=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-state.yaw),eye=vec(povMount(config)).applyQuaternion(heading).add(state.position),direction=vec(povDirection()).normalize().applyQuaternion(heading);
 camera.position.copy(eye);camera.up.set(0,1,0);camera.lookAt(eye.clone().add(direction));camera.updateMatrixWorld();
 }
 projectCombatPoint(point:Vec){
  this.camera.updateMatrixWorld();const position=vec(point),local=position.clone().applyMatrix4(this.camera.matrixWorldInverse),p=position.project(this.camera);
  return{x:50+p.x*50,y:50-p.y*50,visible:local.z<0&&Math.abs(p.x)<.96&&Math.abs(p.y)<.94};
 }
 robotWarningPosition(sim:Simulation,id:number){
 const bot=sim.bots[id],position=this.bodyGroups.get('b'+id+':chassis')?.position.clone()??vec(bot.chassis.translation());
 position.y+=Math.max(.38,bot.compiled.envelope.y*.55)+.18;this.camera.updateMatrixWorld();
 const local=position.clone().applyMatrix4(this.camera.matrixWorldInverse),projected=position.project(this.camera);
 return{x:Math.max(10,Math.min(90,50+projected.x*50)),y:50-projected.y*50,visible:local.z<0&&Math.abs(projected.x)<.95&&projected.y>-.7&&projected.y<.58};
 }
 opponentHealth(sim:Simulation){const side=1-this.viewerBotId;return this.replay?(this.replayFireFrame?.health?.[side]?.[0]??sim.bots[side].modules.chassis.hp):sim.bots[side].modules.chassis.hp;}
 opponentIndicator(sim:Simulation){
 const side=this.viewerBotId,groups=this.replay?this.replayGroups:this.bodyGroups,own=groups.get('b'+side+':chassis')?.position??vec(sim.bots[side].chassis.translation()),other=groups.get('b'+(1-side)+':chassis')?.position??vec(sim.bots[1-side].chassis.translation()),position=other.clone();
 position.y+=Math.max(.42,sim.bots[1-side].compiled.envelope.y)+.12;this.camera.updateMatrixWorld();const local=position.clone().applyMatrix4(this.camera.matrixWorldInverse),projected=position.clone().project(this.camera),behind=local.z>=-this.camera.near;
 const onScreen=!behind&&projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<.84&&projected.y>-.42&&projected.y<.62,distance=own.distanceTo(other);
 if(onScreen)return{x:50+projected.x*50,y:50-projected.y*50,angle:Math.PI,distance,behind,onScreen};
 let dx=behind?local.x:projected.x,dy=behind?-Math.max(.1,Math.abs(local.z)):projected.y;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)){dx=local.x;dy=local.y;}if(Math.abs(dx)+Math.abs(dy)<.001)dy=-1;
 const scale=Math.max(Math.abs(dx)/.84,Math.abs(dy)/.54);return{x:50+dx/scale*50,y:47-dy/scale*50,angle:Math.atan2(dx*this.width,dy*this.height),distance,behind,onScreen:false};
 }

 draw(sim?:Simulation,dt=.016){const start=performance.now();this.time+=dt;this.arena.visible=this.mode!=='builder';this.bots.visible=this.mode!=='builder'&&!this.replay;this.preview.visible=this.mode==='builder';this.effects.visible=this.mode==='match'&&!this.replay;
 if(sim&&this.mode!=='builder')for(const b of sim.bots){const body=(this.replay?this.replayGroups:this.bodyGroups).get(`b${b.id}:chassis`),marker=body?.getObjectByName('front-direction');if(!body||!marker)continue;const f=b.compiled.config.chassis.profile==='huge'?new THREE.Vector3(0,1,0).cross(new THREE.Vector3(1,0,0).applyQuaternion(body.quaternion)):new THREE.Vector3(0,0,-1).applyQuaternion(body.quaternion);f.y=0;if(f.lengthSq()<.001)f.set(0,0,-1);f.normalize();const inv=body.quaternion.clone().invert(),yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(-f.x,-f.z));marker.quaternion.copy(inv).multiply(yaw);marker.position.copy(f.multiplyScalar(b.compiled.config.chassis.length/2+.29));marker.position.y=.035-body.position.y;marker.position.applyQuaternion(inv);}
 const pov=this.mode==='match'&&this.cameraMode==='pov'&&!!sim,follow=this.mode==='match'&&this.cameraMode==='chase'&&!!sim,fov=pov?76:follow?60:42;if(!follow)this.followCamera.reset();if(this.camera.fov!==fov){this.camera.fov=fov;this.camera.updateProjectionMatrix();}this.camera.up.set(0,1,0);
 if(pov){this.positionPOVCamera(this.camera,sim!,dt);}
 else if(follow&&sim){const side=this.viewerBotId,body=(this.replay?this.replayGroups:this.bodyGroups).get('b'+side+':chassis'),p=body?.position??vec(sim.bots[side].chassis.translation()),rotation=sim.bots[side].chassis.rotation(),q=body?.quaternion??new THREE.Quaternion(rotation.x,rotation.y,rotation.z,rotation.w);this.followCamera.update(this.camera,p,q,sim.bots[side].compiled.config,sim.bots[side].compiled.envelope,this.followGeneration+'/'+side+'/'+this.replay,dt,this.reduced);}
 else if(this.mode==='builder'){const group=this.preview.children[0],centre=(group?.userData.centre as THREE.Vector3|undefined)??new THREE.Vector3(0,.01,-.13),scale=Math.max(1,(group?.userData.span??1.5)/1.55)*Math.max(1,1.1/this.camera.aspect);this.camera.position.copy(centre).add(new THREE.Vector3(this.previewConfig?.chassis.profile==='sawblaze'?-1.30:1.30,.84,-1.55).multiplyScalar(scale));this.camera.lookAt(centre);if(group)group.rotation.y=this.reduced?.25:(this.time-(group.userData.createdAt??this.time))*.15-.25;}
 else if(this.mode==='menu'){const t=this.reduced?0:Math.sin(this.time*.045)*.45;this.camera.position.set(10.4+t,9.7,12.6-t);this.camera.lookAt(0,.25,-.7);}
 else{const p0=(this.replay?this.replayGroups.get('b0:chassis')?.position:sim?.bots[0].chassis.translation())??v(-2,0,0),p1=(this.replay?this.replayGroups.get('b1:chassis')?.position:sim?.bots[1].chassis.translation())??v(2,0,0),cx=(p0.x+p1.x)/2,cz=(p0.z+p1.z)/2,dist=Math.hypot(p0.x-p1.x,p0.z-p1.z);const fit=Math.max(1,1.35/this.camera.aspect),distance=Math.max(4.2,dist*.78+2.9,Math.abs(p0.y-p1.y)*1.8+3)*fit;const elevation=sim?.bots.some(b=>b.compiled.config.chassis.profile==='icewave')?1.125:.90;const cy=Math.max(.08,(p0.y+p1.y)*.5),blend=1-Math.exp(-4*Math.max(0,Math.min(.1,dt))),desired=new THREE.Vector3(cx+.8,cy+distance*elevation,cz+distance);this.camera.position.lerp(desired,blend);this.cameraTarget.lerp(new THREE.Vector3(cx,cy,cz),blend);this.camera.lookAt(this.cameraTarget);}
 // The tall camera-side wall can fill the view during countdown or from outside.
 if(this.cameraSideWall){const show=this.mode==='match'&&!this.preMatch&&this.camera.position.z<RULES.floor/2-.15;if(this.cameraSideWall.visible!==show){this.cameraSideWall.visible=show;this.shadowDirty=true;}}
 this.batteryFireVisual.visible=this.mode==='match';
 if(sim&&this.mode==='match'){const frame=this.replay?this.replayFireFrame:undefined;
  this.batteryFireVisual.update(sim.bots.map(b=>{const group=(this.replay?this.replayGroups:this.bodyGroups).get('b'+b.id+':chassis'),position=vec((frame?frame.firePoints?.[b.id]:b.batteryFire?.localPoint)??batteryPosition(b.compiled.config));if(group)position.applyQuaternion(group.quaternion).add(group.position);position.y+=.09;return{position,active:(frame?frame.fires?.[b.id]??0:sim.batteryFireSeconds(b))>0};}),(frame?.tick??sim.tick)/RULES.hz,this.reduced);
 }
 this.flightLabel?.draw(this.camera,this.width,this.height,this.mode==='match'&&!this.replay);
 const shadowDue=this.shadowDirty||this.lastShadowMode!==this.mode||((this.mode==='builder'||this.replay||(sim?.tick??0)!==this.lastShadowTick)&&this.time-this.lastShadowTime>=1/(this.quality==='high'?60:30)-.0005);
 if(this.renderer.shadowMap.enabled&&shadowDue){this.renderer.shadowMap.needsUpdate=true;this.shadowDirty=false;this.lastShadowMode=this.mode;this.lastShadowTick=sim?.tick??0;this.lastShadowTime=this.time;}
 this.renderer.setViewport(0,0,this.width,this.height);this.renderer.setScissorTest(false);this.renderer.render(this.scene,this.camera);
 let triangles=this.renderer.info.render.triangles,calls=this.renderer.info.render.calls;
 if(this.inset&&!pov&&this.mode==='match'&&this.quality!=='low'&&sim&&!this.replay){
 const w=Math.min(260,this.width*.24),h=w*.6,pixels=Math.ceil(w*this.renderer.getPixelRatio()),height=Math.ceil(h*this.renderer.getPixelRatio());
 if(!this.insetTarget||this.insetTarget.width!==pixels||this.insetTarget.height!==height){this.insetTarget?.dispose();this.insetTarget=new THREE.WebGLRenderTarget(pixels,height);this.insetQuad.material.map=this.insetTarget.texture;this.insetQuad.material.needsUpdate=true;this.lastInset=-1;}
 if(this.time-this.lastInset>=1/30){this.positionPOVCamera(this.insetCamera,sim);this.insetCamera.aspect=w/h;this.insetCamera.updateProjectionMatrix();this.renderer.setRenderTarget(this.insetTarget);this.renderer.setViewport(0,0,pixels,height);this.renderer.render(this.scene,this.insetCamera);triangles+=this.renderer.info.render.triangles;calls+=this.renderer.info.render.calls;this.renderer.setRenderTarget(null);this.lastInset=this.time;}
 this.renderer.setViewport(this.width-w-18,18,w,h);this.renderer.setScissor(this.width-w-18,18,w,h);this.renderer.setScissorTest(true);this.renderer.render(this.insetScene,this.insetScreenCamera);calls+=this.renderer.info.render.calls;triangles+=this.renderer.info.render.triangles;this.renderer.setScissorTest(false);
 }
 this.triangleCount=triangles;this.drawCalls=calls;this.renderMs=performance.now()-start;this.needsRender=false;
 }
 clear(group:THREE.Group){for(const child of [...group.children])this.disposeObject(child);}
 disposeObject(o:THREE.Object3D){o.traverse(x=>{if(x instanceof THREE.Mesh||x instanceof THREE.Points||x instanceof THREE.Line){if(x instanceof THREE.InstancedMesh)x.dispose();x.geometry.dispose();const mats=Array.isArray(x.material)?x.material:[x.material];for(const m of mats){disposeSawbladeExposure(m);if('map'in m)(m.map as THREE.Texture|undefined)?.dispose();m.dispose();}}else if(x instanceof THREE.Sprite){x.material.map?.dispose();x.material.dispose();}});o.removeFromParent();}
 dispose(){if(this.disposed)return;this.disposed=true;this.resize.disconnect();this.flightLabel?.dispose();this.endReplay();this.clear(this.arena);this.clear(this.bots);this.clear(this.preview);this.clear(this.effects);this.clear(this.batteryFireVisual);this.environment.dispose();this.insetTarget?.dispose();this.insetQuad.geometry.dispose();this.insetQuad.material.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
