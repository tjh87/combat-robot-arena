const MINIMUM_DELAY_MS=42;
const MAXIMUM_DELAY_MS=140;

/**
 * Keeps rendering just behind the newest authoritative snapshot. The estimate
 * measures arrival variation after the connection clock mapping is applied, so
 * a stable link stays close to the newest 30 Hz frame while jitter gets enough
 * room to avoid visible snap-back.
 */
export class SnapshotTiming{
 delay=MINIMUM_DELAY_MS;
 jitter=0;
 private previous?:{server:number,arrival:number};

 reset(){this.delay=MINIMUM_DELAY_MS;this.jitter=0;this.previous=undefined;}

 observe(serverTime:number,arrivalTime:number){
  if(!Number.isFinite(serverTime)||!Number.isFinite(arrivalTime)){this.reset();return this.delay;}
  const previous=this.previous;
  if(previous&&serverTime>previous.server){
   const serverDelta=serverTime-previous.server,arrivalDelta=arrivalTime-previous.arrival;
   // A clock adjustment is not network jitter; only compare adjacent frames
   // whose server cadence is plausible for the authoritative snapshot stream.
   if(serverDelta>0&&serverDelta<250&&arrivalDelta>=0&&arrivalDelta<500){
    const variation=Math.abs(arrivalDelta-serverDelta);
    this.jitter=Math.min(80,this.jitter*.82+variation*.18);
   }else this.jitter=Math.min(80,Math.max(this.jitter,24));
  }
  this.previous={server:serverTime,arrival:arrivalTime};
  this.delay=Math.round(Math.max(MINIMUM_DELAY_MS,Math.min(MAXIMUM_DELAY_MS,MINIMUM_DELAY_MS+this.jitter*3)));
  return this.delay;
 }
}
