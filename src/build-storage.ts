import {compile,decodeBuild,encodeBuild,ROSTER,type BotConfig} from './model';
const KEY='cra.saved-build';
export function saveBuild(config:BotConfig,base:number){
 const errors=compile(config,config.weapon.type==='none').errors;
 if(errors.length)throw Error(errors.map(e=>e.message).join(' '));
 localStorage.setItem(KEY,JSON.stringify({base,code:encodeBuild(config)}));
}
export function loadBuild():{base:number,config:BotConfig}|undefined{
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)??'null');
  if(!raw||!Number.isInteger(raw.base)||raw.base<0||raw.base>=ROSTER.length||typeof raw.code!=='string')return;
  const config=decodeBuild(raw.code);if(compile(config,config.weapon.type==='none').errors.length)return;
  return{base:raw.base,config};
 }catch{return;}
}
export function clearSavedBuild(){localStorage.removeItem(KEY);}
