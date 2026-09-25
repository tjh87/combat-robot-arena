import type {ImpactEvent,Travel} from './sim';
export type RobotHighlights={furthestTravel:number,maxHeight:number,hardestHit:number,hardestReceived:number};
// These maxima live for the whole match, independently of capped replay logs.
export class MatchHighlights{
 robots:RobotHighlights[]=[{furthestTravel:0,maxHeight:0,hardestHit:0,hardestReceived:0},{furthestTravel:0,maxHeight:0,hardestHit:0,hardestReceived:0}];
 hit(event:ImpactEvent){
  if(event.attacker===null||event.target===null||event.attacker===event.target||!['weapon','ram','crush'].includes(event.cause))return;
  const stats=this.robots[event.attacker];
  stats.hardestHit=Math.max(stats.hardestHit,event.energy);
  const receiver=this.robots[event.target];
  receiver.hardestReceived=Math.max(receiver.hardestReceived,event.energy);
 }
 travel(track:Travel,grounded:boolean,driving:boolean){
  if(track.role!=='Post-impact travel')return;
  // Airborne movement and unpowered sliding count. Ground travel after the
  // driver powers away, recovery teleports, and the attacker's recoil do not.
  if(grounded&&(track.powered||driving)&&!(track.airborne&&track.landed<=1))return;
  if(track.airborne&&track.landed>1)return;
  const stats=this.robots[track.bot];stats.furthestTravel=Math.max(stats.furthestTravel,track.horizontal);stats.maxHeight=Math.max(stats.maxHeight,track.height??0);
 }
}
