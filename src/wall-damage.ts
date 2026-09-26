import {RULES,clamp,type Vec} from './model';
export type WallName='north'|'south'|'west'|'east';
export type WallCrack={id:number,tick:number,wall:WallName,point:Vec,energy:number,impulse:number,radius:number};
// Visual game thresholds, not measured fracture specifications for real arena panels.
export const WALL_DAMAGE={minEnergy:200,minImpulse:20,maxCracks:48,cooldownTicks:60} as const;
export const isArenaWall=(name:string|undefined):name is WallName=>['north','south','west','east'].includes(name??'');
export class WallDamage{
 cracks:readonly WallCrack[]=[];private next=1;
 impact(wall:WallName,point:Vec,energy:number,impulse:number,tick:number){
  if(!Number.isFinite(energy+impulse+point.x+point.y+point.z)||energy<WALL_DAMAGE.minEnergy||impulse<WALL_DAMAGE.minImpulse||point.y<.35||point.y>RULES.wallHeight)return false;
  const axis=wall==='east'||wall==='west'?'x':'z',along=axis==='x'?'z':'x',side=wall==='east'||wall==='south'?1:-1;
  const p={...point};p[axis]=side*(RULES.floor/2-.006);p[along]=clamp(p[along],-RULES.floor/2+.02,RULES.floor/2-.02);
  if(this.cracks.some(c=>c.wall===wall&&tick-c.tick<WALL_DAMAGE.cooldownTicks&&Math.hypot(c.point[along]-p[along],c.point.y-p.y)<.65))return false;
  const crack:WallCrack={id:this.next++,tick,wall,point:p,energy,impulse,radius:clamp(.18+Math.sqrt(energy/200)*.09,.25,.85)};
  this.cracks=[...this.cracks.slice(-(WALL_DAMAGE.maxCracks-1)),crack];return true;
 }
}
