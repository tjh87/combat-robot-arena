import {clamp,type Module,type Slot} from './model';

export const HUGE_WHEEL_DAMAGE_SCALE=.5;

export const BATTERY_FIRE={damageThreshold:.70,seconds:8,chassisHPPerSecond:30,batteryHPPerSecond:10,chargePerSecond:.04} as const;

export function damageFraction(module:Module){
 return module.present&&module.max>0?clamp(1-module.hp/module.max,0,1):0;
}

// Keep a reduced-output reserve so damage never silently switches a weapon off.
// The RPM cap follows sqrt(output); torque and mechanical losses set actual RPM.
export function damageStatus(modules:Record<Slot,Module>){
 const weaponDamage=Math.max(damageFraction(modules.weapon),damageFraction(modules.weapon_actuator));
 const batteryDamage=damageFraction(modules.battery);
 // Armour wear in the first half of the damage range does not derate the
 // mechanism. The protected weapon reserve is independent of drive power.
 const weaponOutput=1-.55*clamp((weaponDamage-.5)/.5,0,1);
 return{weaponDamage,batteryDamage,weaponOutput,rpmScale:Math.sqrt(weaponOutput),driveOutput:modules.battery.functional?1-.7*batteryDamage:0};
}

export type ContactDamageInput={weaponA:boolean,weaponB:boolean,cutA:boolean,cutB:boolean,ramA:number,ramB:number,speedA?:number,speedB?:number};
export function contactDamage(input:ContactDamageInput){
 const {weaponA,weaponB,cutA,cutB,ramA,ramB}=input;
 if(cutA||cutB){
  // The incoming strike damages only its receiver. A blade clash still
  // absorbs half the energy, but never damages the weapon delivering it.
  const attacker=cutA&&cutB?(input.speedB??0)>(input.speedA??0)?1:0:cutA?0:1;
  const targetShare=weaponA&&weaponB?.5:1.2;
  const shares:[number,number]=attacker===0?[0,targetShare]:[targetShare,0];
  return{cause:'weapon',attacker,shares} as const;
 }
 // Only horizontal, closing translation qualifies as a ram. A spinning chassis,
 // resting wedge, or a slow pushing contact cannot become a damaging attack.
 const a=ramA>=1,b=ramB>=1,total=(a?ramA:0)+(b?ramB:0);
 if(!total)return null;
 return{cause:'ram',attacker:a&&b?null:a?0:1,shares:[b?ramB/total:0,a?ramA/total:0] as [number,number]} as const;
}
