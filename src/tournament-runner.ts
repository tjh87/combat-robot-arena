import type {Tournament} from './sim';
export class TournamentRunner {
 worker?:Worker;active='';progress=0;private jobId=0;
 constructor(readonly tournament:Tournament,readonly changed:()=>void){this.createWorker();this.update();}
 private createWorker(){
  const worker=this.worker=new Worker(new URL('./tournament-worker.ts',import.meta.url),{type:'module'});
  worker.onerror=()=>{if(this.worker!==worker)return;this.tournament.fault='Computer fight paused. Retry the fight.';this.tournament.busy=false;this.active='';this.changed();};
  worker.onmessage=event=>{
   const data=event.data,key=data.round+'/'+data.index;
   if(this.worker!==worker||data.jobId!==this.jobId||key!==this.active)return;
   const match=this.tournament.matches[data.round]?.[data.index];if(!match)return;
   if(data.type==='progress'){this.progress=data.tick/240;this.changed();}
   else if(data.type==='fault'){this.tournament.fault='Computer fight paused: '+data.message;this.tournament.busy=false;this.active='';this.changed();}
   else if(data.type==='result'){match.winner=data.winner===0?match.a:match.b;match.reason=data.reason;this.active='';this.tournament.busy=false;this.progress=0;this.changed();this.update();}
  };
 }
 update(){
  if(!this.worker||this.active||this.tournament.fault||this.tournament.champion)return;
  const round=this.tournament.matches[this.tournament.round],index=round.findIndex(m=>!m.a.player&&!m.b.player&&!m.winner);
  if(index<0){this.tournament.busy=false;return;}
  const m=round[index];this.active=this.tournament.round+'/'+index;this.tournament.busy=true;
  this.worker.postMessage({type:'match',jobId:++this.jobId,round:this.tournament.round,index,configs:[m.a.config,m.b.config],hazards:this.tournament.hazards,seed:this.tournament.seed+this.tournament.round*31+index});
 }
 retry(){this.worker?.terminate();this.worker=undefined;this.tournament.fault=undefined;this.active='';this.progress=0;this.createWorker();this.update();}
 dispose(){this.worker?.postMessage({type:'stop'});this.worker?.terminate();this.worker=undefined;this.active='';this.tournament.busy=false;}
}
