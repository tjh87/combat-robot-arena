import {ROSTER,RULES} from './model';
import type {ImpactEvent,VisualFrame,Result} from './sim';
export function randomRobot(current:number,random=Math.random){
 const index=Math.min(ROSTER.length-2,Math.floor(Math.max(0,random())*(ROSTER.length-1)));
 return index>=current?index+1:index;
}
export function knockoutClip(frames:VisualFrame[],events:ImpactEvent[],result:Result){
 if(!['Structural KO','Count-out','Out of arena'].includes(result.reason))return [];
 const hit=[...events].reverse().find(e=>e.target===1-result.winner&&e.attacker!==null&&e.tick<=result.tick&&result.tick-e.tick<=.65*RULES.hz&&e.allocations.some(a=>a.bot===e.target&&a.hp>0));
 return hit?frames.filter(f=>f.tick>=hit.tick-.35*RULES.hz):[];
}
