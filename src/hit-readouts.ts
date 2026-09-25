import {RULES,type Vec} from './model';
import type {ImpactEvent} from './sim';

export type HitReadout={key:string,bot:number,hp:number,point:Vec,tick:number,summary?:boolean};
export function hitTier(hp:number){return hp>=1000?6:hp>=800?5:hp>=500?4:hp>=250?3:hp>=100?2:hp>=40?1:0;}
// Quantize the label only. Continuous contact damage retains its exact HP.
export function roundedDamage(hp:number){return hp>0&&Number.isFinite(hp)?Math.max(1,Math.round(hp)):0;}
export function damageNumber(hp:number){return roundedDamage(hp).toLocaleString();}
// Empty decorative shapes only; the caller inserts the measured damage number.
export const HIT_BUBBLE_MARKUP='<span class="hit-graphic"><i class="hit-rays"></i><i class="hit-dots"></i><i class="hit-echo"></i><i class="hit-puff hit-puff-a"></i><i class="hit-puff hit-puff-b"></i><i class="hit-spark hit-spark-a"></i><i class="hit-spark hit-spark-b"></i><i class="hit-spark hit-spark-c"></i><i class="hit-bolt hit-bolt-a"></i><i class="hit-bolt hit-bolt-b"></i><span class="hit-burst"><i class="hit-paper"></i><span class="hit-hp"></span></span></span>';
// Impact episodes can gain damage over several steps. Display only newly lost
// HP, and combine simultaneous contacts on the same robot into one number.
export class HitReadouts{
 private seen=new Map<string,number>();
 private serial=0;
 hits:HitReadout[]=[];
 reset(){this.seen.clear();this.serial=0;this.hits=[];}
 update(events:ImpactEvent[],tick:number){
  this.hits=this.hits.filter(h=>tick-h.tick<RULES.hz*1.3);
  const live=new Set<string>();
  for(const event of events)for(const bot of[0,1]){
   const key=event.id+':'+bot;live.add(key);
   if(event.cause==='crush'&&event.releasedTick===undefined)continue;
   const total=event.allocations.filter(a=>a.bot===bot).reduce((sum,a)=>sum+a.hp,0),delta=total-(this.seen.get(key)??0);
   if(delta<=0)continue;
   this.seen.set(key,total);
   const recent=event.cause==='crush'?undefined:[...this.hits].reverse().find(h=>!h.summary&&h.bot===bot&&tick-h.tick<RULES.hz*.12);
   if(recent){recent.hp+=delta;recent.point={...event.point};}
   else this.hits.push({key:key+':'+this.serial++,bot,hp:delta,point:{...event.point},tick,summary:event.cause==='crush'});
  }
  for(const key of this.seen.keys())if(!live.has(key))this.seen.delete(key);
  this.hits=this.hits.slice(-12);return this.hits;
 }
}
