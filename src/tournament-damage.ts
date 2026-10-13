import {SLOTS,type Slot} from './model';

type DamageState={startHP:Record<Slot,number>;modules:Record<Slot,{hp:number}>};

/** Total HP lost in the current match; carry-over damage is excluded by the bot's startHP snapshot. */
export function totalHPLost(bot:DamageState){
 return SLOTS.reduce((total,slot)=>{
  const before=bot.startHP[slot],after=bot.modules[slot].hp;
  return total+(Number.isFinite(before)&&Number.isFinite(after)?Math.max(0,before-after):0);
 },0);
}
