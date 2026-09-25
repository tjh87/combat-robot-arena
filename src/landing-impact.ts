export const LANDING={gravity:9.81,safeDrop:.12,minSpeed:1.5,contactShare:.70,chassisShare:.30,windowSeconds:.20} as const;

// Height and speed describe the same falling energy. Split its sources;
// never add m*g*h to the kinetic energy already gained during that fall.
export function landingEnergy(massKg:number,downwardSpeed:number,dropHeight:number){
 const speed=Math.max(0,downwardSpeed),height=Math.max(0,dropHeight),kinetic=.5*massKg*speed*speed;
 const gravity=Math.min(kinetic,massKg*LANDING.gravity*height),absorbed=Math.min(kinetic,massKg*LANDING.gravity*LANDING.safeDrop);
 return{massKg,speed,height,kinetic,gravity,otherMotion:kinetic-gravity,absorbed,damageBudget:Math.max(0,kinetic-absorbed)};
}
