import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {preset,compile,RULES,SLOTS,bodyOrigin,axisQ,rotate,sub,add,v,horizontal,flipEnergy,selfRightKind} from '../src/model';
import {Simulation,initializePhysics,neutral,type Travel} from '../src/sim';
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/hydra-offset-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
function overturned(s:Simulation,id:number,x=-3.5,z=0){const b=s.bots[id],p=v(x,.7,z),q=axisQ(v(1,0,0),Math.PI);for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();b.history=[{tick:s.tick-RULES.hz,p:{...p},ground:false,powered:false}];}
await test('Hydra stays upright at four additional off-centre contact positions',()=>{
 const rows=[];for(const sideOffset of[.08,-.08,.20,-.20]){
  const f=preset(2),target=preset(0),mass=compile(f).mass;target.weapon={type:'none'};Object.assign(target.chassis,{length:.64,width:.58,height:.16,clearance:.018});Object.assign(target.drive,{layout:4,radius:.10,width:.075});let low=.004,high=.020;for(let i=0;i<30;i++){target.chassis.thickness=(low+high)/2;if(compile(target).mass>mass)high=target.chassis.thickness;else low=target.chassis.thickness;}
  const s=new Simulation([f,target],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
   for(const[id,x]of[[0,-.7],[1,.7]]){const b=s.bots[id],delta=sub(v(x,b.chassis.translation().y,id===1?sideOffset:0),b.chassis.translation());for(const body of b.bodies.values())body.setTranslation(add(body.translation(),delta),true);}s.world.propagateModifiedBodyPositionsToColliders();s.bots[1].energy=0;
   let peak=0,minUp=1,ownPeak=0;for(let t=0;t<1500;t++){s.step([{...neutral(),left:t<450?.3:0,right:t<450?.3:0,weapon:t===450},neutral()]);peak=Math.max(peak,s.bots[1].chassis.translation().y);if(t>=450){minUp=Math.min(minUp,s.axis(s.bots[0],v(0,1,0)).y);ownPeak=Math.max(ownPeak,s.bots[0].chassis.translation().y);}}
   assert.equal(s.fault,undefined);assert(peak>1.2);assert(minUp>Math.cos(15*Math.PI/180),'Hydra tilted past 15 degrees');assert(ownPeak<.16,'Excessive chassis recoil');assert(s.bots[0].flipWork<=flipEnergy(f));rows.push({offsetM:sideOffset,opponentPeakM:peak,hydraPeakM:ownPeak,maxTiltDegrees:Math.acos(minUp)*180/Math.PI,workJ:s.bots[0].flipWork});
  }finally{s.dispose();}
 }return rows;
});
