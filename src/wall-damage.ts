import {RULES,clamp,type Vec} from './model';
export type WallName='north'|'south'|'west'|'east';
export type CrackPattern='hairline'|'starburst'|'branching'|'fracture';
export type WallCrack={id:number,tick:number,wall:WallName,point:Vec,energy:number,impulse:number,radius:number,pattern?:CrackPattern,severity?:number,seed?:number,angle?:number,stretch?:number};
// Cosmetic game thresholds. The walls retain their collision geometry.
export const WALL_DAMAGE={minEnergy:200,minImpulse:20,maxCracks:48,cooldownTicks:60,maxSegments:72,maxRadius:1.15} as const;
export const isArenaWall=(name:string|undefined):name is WallName=>['north','south','west','east'].includes(name??'');
export class WallDamage{
 cracks:readonly WallCrack[]=[];private next=1;
 impact(wall:WallName,point:Vec,energy:number,impulse:number,tick:number,velocity?:Vec){
  if(!Number.isFinite(energy+impulse+point.x+point.y+point.z)||energy<WALL_DAMAGE.minEnergy||impulse<WALL_DAMAGE.minImpulse||point.y<.35||point.y>RULES.wallHeight)return false;
  const axis=wall==='east'||wall==='west'?'x':'z',along=axis==='x'?'z':'x',side=wall==='east'||wall==='south'?1:-1;
  const p={...point};p[axis]=side*(RULES.floor/2-.006);p[along]=clamp(p[along],-RULES.floor/2+.02,RULES.floor/2-.02);
  if(this.cracks.some(c=>c.wall===wall&&tick-c.tick<WALL_DAMAGE.cooldownTicks&&Math.hypot(c.point[along]-p[along],c.point.y-p.y)<.65))return false;
  const severity=clamp((Math.log2(1+energy/200)+Math.log2(1+impulse/20)) / 14,0,1),pattern:CrackPattern=energy<900?'hairline':energy<4200?'starburst':energy<14000?'branching':'fracture';
  const id=this.next++,seed=(Math.imul(id,73856093)^Math.imul(tick,19349663)^Math.round(p[along]*1000)^Math.round(p.y*1000)^Math.round(energy))>>>0;
  const tangent=velocity?Math.hypot(velocity[along],velocity.y):0,normal=velocity?Math.abs(velocity[axis]):0;
  const crack:WallCrack={id,tick,wall,point:p,energy,impulse,radius:clamp(.18+Math.sqrt(energy/200)*.09,.25,WALL_DAMAGE.maxRadius),pattern,severity,seed,angle:velocity&&tangent>.01?Math.atan2(velocity.y,velocity[along]):(seed%6283)/1000,stretch:1+clamp(tangent/Math.max(1,normal),0,1)*.65};
  this.cracks=[...this.cracks.slice(-(WALL_DAMAGE.maxCracks-1)),crack];return true;
 }
}
