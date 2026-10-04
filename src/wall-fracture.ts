import {rng,clamp} from './model';
import {WALL_DAMAGE,type WallCrack} from './wall-damage';
export type FractureLine={u:number,y:number,v:number,z:number,brightness:number};
export function fractureLines(crack:WallCrack):FractureLine[]{
 const random=rng(crack.seed??Math.imul(crack.id,73856093)),pattern=crack.pattern??(crack.energy<900?'hairline':crack.energy<4200?'starburst':crack.energy<14000?'branching':'fracture'),severity=crack.severity??clamp(Math.log2(1+crack.energy/200)/10,0,1);
 const lines:FractureLine[]=[],ends:{u:number,y:number}[]=[],r=crack.radius,rotation=crack.angle??random()*Math.PI*2,stretch=crack.stretch??1;
 const add=(u:number,y:number,v:number,z:number,brightness=1)=>{if(lines.length<WALL_DAMAGE.maxSegments)lines.push({u:u*stretch,y,v:v*stretch,z,brightness});};
 const count=pattern==='hairline'?2+Math.floor(random()*2):pattern==='starburst'?5+Math.floor(random()*3):pattern==='branching'?7+Math.floor(random()*3):9+Math.floor(random()*3);
 for(let ray=0;ray<count;ray++){
  const angle=rotation+ray/count*Math.PI*2+(random()-.5)*.5,dx=Math.cos(angle),dy=Math.sin(angle),reach=r*(.4+random()*.6),steps=pattern==='hairline'?2:3;
  let u=0,y=0;
  for(let step=1;step<=steps;step++){const bend=(random()-.5)*reach*(.1+severity*.18),nu=dx*reach*step/steps-dy*bend,ny=dy*reach*step/steps+dx*bend;add(u,y,nu,ny,.62+random()*.38);
   if(step===2&&pattern!=='hairline'){const branch=(random()>.5?1:-1)*( .25+random()*.3),length=reach*(.16+random()*.28);add(nu,ny,nu+Math.cos(angle+branch)*length,ny+Math.sin(angle+branch)*length,.4+random()*.35);}
   u=nu;y=ny;
  }
  ends.push({u,y});
  if(pattern==='branching'&&random()>.3)add(u*.5,y*.5,u*.65-dy*reach*.3,y*.65+dx*reach*.3,.42);
 }
 if(pattern==='fracture')for(let i=0;i<ends.length;i++){if(random()<.2)continue;const a=ends[i],b=ends[(i+1)%ends.length],scale=.32+random()*.24;add(a.u*scale,a.y*scale,b.u*scale,b.y*scale,.55+severity*.25);if(random()>.45)add(a.u*.7,a.y*.7,b.u*.65,b.y*.65,.35);}
 return lines;
}
