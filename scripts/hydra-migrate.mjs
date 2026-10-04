import {readFileSync,writeFileSync} from 'node:fs';
function edit(path,fn){const before=readFileSync(path,'utf8'),after=fn(before);if(before===after)throw Error('No change: '+path);writeFileSync(path,after);}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing migration anchor: '+a.slice(0,140));return s.replace(a,b);}
edit('src/model.ts',s=>{
 s="import {hydraChassisParts,hydraFlipperParts,hydraPoint} from './hydra-geometry';\n"+s;
 s=replace(s,"if(index===2){c.weapon={type:'flipper',length:.30,width:.22,thickness:.012,material:'hardox',mount:v(0,.101,-.335),travel:1.48,actuator:'F3000',stroke:.20,charges:8};c.drive.magnet=0;}","if(index===2){c.chassis.height=.08;c.chassis.form='box';c.identity.primary='#21132f';c.identity.secondary='#6712ba';Object.assign(c.drive,{radius:.05,width:.038});c.weapon={type:'flipper',length:.663,width:.22,thickness:.028,material:'hardox',mount:hydraPoint(c,0,.099,.143),travel:1.48,actuator:'F3000',stroke:.20,charges:8};c.drive.magnet=0;}");
 s=replace(s,"length:bounded(w.length,'weapon.length',.2,.65)","length:bounded(w.length,'weapon.length',.2,c.profile==='hydra'?.8:.65)");
 s=replace(s,"return v(side*(c.chassis.width/2+a+c.drive.width/2+.008),","return v(side*(c.chassis.profile==='hydra'&&c.drive.traction!=='tracks'?c.chassis.width/2-c.drive.width/2-.009:c.chassis.width/2+a+c.drive.width/2+.008),");
 s=replace(s,"const z=wheelPositionZ(c,i),x=side*(W/2+sideArm+c.drive.width/2+.008);","const z=wheelPositionZ(c,i),x=bodyOrigin(c,`wheel_${side}_${i}`).x;");
 s=replace(s,"templateParts(c,parts);","if(ch.profile==='hydra'){for(let i=parts.length-1;i>=0;i--)if(/^(floor|lid|side-?1|end-?1|corner_|wedge|armour_)/.test(parts[i].id))parts.splice(i,1);hydraChassisParts(c,parts);}\n templateParts(c,parts);");
 s=replace(s,"else if(w.type==='flipper'){\n const tip=", "else if(w.type==='flipper'&&ch.profile==='hydra'){hydraFlipperParts(c,parts);}\n else if(w.type==='flipper'){\n const tip=");
 s=replace(s,"if(w.type==='flipper'&&(w.mount.y", "if(w.type==='flipper'&&ch.profile!=='hydra'&&(w.mount.y");
 s=replace(s,"p.id==='flipper'||", "p.id==='flipper'||p.id.startsWith('flipper_tine_')||");
 return s;
});
edit('src/mechanisms.ts',s=>{const a=s.indexOf(" if(p==='hydra'){"),b=s.indexOf(" if(p==='icewave'",a);if(a<0||b<0)throw Error('Hydra template anchors');return s.slice(0,a)+s.slice(b);});
edit('tests/systems.ts',s=>replace(s,"[2,'weapon.length',.2,.65]","[2,'weapon.length',.2,.8]"));
