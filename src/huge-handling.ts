import {clamp} from './model';

export const HUGE_HANDLING={friction:2.10,speed:4,yawRate:2.2,pitchSpring:2400,rollSpring:1600,pitchTorque:900,rollTorque:700} as const;

// Both commands use the same speed controller. Turning and braking stay
// within the wheel motors' current, torque and battery limits.
export function hugeDriveDuty(left:number,right:number,speed:number,yawRate:number,axleY:number){
 const level=clamp((.85-Math.abs(axleY))/.45,0,1),forward=(left+right)/2,turn=(left-right)/2;
 const drive=clamp(forward*.33+(forward*HUGE_HANDLING.speed-speed)*.70,-1,1)*(.2+.8*level);
 const steer=clamp(turn*.30+(yawRate+turn*HUGE_HANDLING.yawRate*level)*.38,-.7,.7);
 return[clamp(drive+steer,-1,1),clamp(drive-steer,-1,1)] as const;
}
