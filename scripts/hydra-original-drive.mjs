import {readFileSync,writeFileSync} from 'node:fs';
function replace(s,a,b){if(!s.includes(a))throw Error('Missing restore anchor: '+a);return s.replace(a,b);}
function edit(path,fn){writeFileSync(path,fn(readFileSync(path,'utf8')));}
edit('src/model.ts',s=>{
 s=replace(s,'hydraTuning?:1,','hydraTuning?:1|2,');
 s=replace(s,"return c.chassis.profile==='hydra'?c.chassis.length*.305/.64:c.chassis.profile==='hypershock'?","return c.chassis.profile==='hypershock'?");
 s=replace(s,"return c.chassis.profile==='hydra'?c.chassis.length*.0425/.64:c.chassis.profile==='hypershock'?-.065:0;","return c.chassis.profile==='hypershock'?-.065:0;");
 s=replace(s,"c.chassis.profile==='hydra'&&c.drive.traction!=='tracks'?c.chassis.width/2-c.drive.width/2-.009:c.chassis.width/2+a+c.drive.width/2+.008","c.chassis.width/2+a+c.drive.width/2+.008");
 s=replace(s,'radius:.046,width:.038,ratio:6.5,hydraTuning:1','radius:.10,width:.075,ratio:14,hydraTuning:2');
 s=replace(s,"en(d.hydraTuning,[1] as const,'drive.hydraTuning')","en(d.hydraTuning,[1,2] as const,'drive.hydraTuning')");
 s=replace(s,'parsed.drive.radius=.046;parsed.drive.width=.038;if(parsed.drive.ratio===14)parsed.drive.ratio=6.5;','parsed.drive.radius=.10;parsed.drive.width=.075;');
 const old=" if(parsed.chassis.profile==='hydra'&&parsed.chassis.length===.64&&parsed.chassis.width===.58&&parsed.chassis.height===.08&&parsed.weapon.type==='flipper'&&parsed.weapon.length===.663&&parsed.drive.layout===4&&parsed.drive.radius===.046&&parsed.drive.width===.038&&parsed.drive.motor==='drive48'&&parsed.drive.hydraTuning===undefined&&parsed.drive.ratio===14)parsed.drive.ratio=6.5;\n if(parsed.chassis.profile==='hydra')parsed.drive.hydraTuning=1;";
 const next=" if(parsed.chassis.profile==='hydra'&&parsed.chassis.length===.64&&parsed.chassis.width===.58&&parsed.chassis.height===.08&&parsed.weapon.type==='flipper'&&parsed.weapon.length===.663&&parsed.drive.layout===4&&parsed.drive.radius===.046&&parsed.drive.width===.038&&parsed.drive.motor==='drive48'&&parsed.drive.hydraTuning!==2&&(parsed.drive.ratio===6.5||parsed.drive.ratio===14)){\n  parsed.drive.radius=.10;parsed.drive.width=.075;parsed.drive.ratio=14;\n  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-50.608441509370486)<1e-6)parsed.chassis.equipmentMassKg=preset(2).chassis.equipmentMassKg;\n }\n if(parsed.chassis.profile==='hydra')parsed.drive.hydraTuning=2;";
 return replace(s,old,next);
});
edit('src/sim.ts',s=>{s=replace(s,"if((c.chassis.profile==='gigabyte'||c.chassis.profile==='hydra'||tracks)&&supported","if((c.chassis.profile==='gigabyte'||tracks)&&supported");return replace(s,"*(tracks?.45:c.chassis.profile==='hydra'?3:.85)","*(tracks?.45:.85)");});
edit('tests/hydra-browser.mjs',s=>s.replaceAll("['drive.radius','46']","['drive.radius','100']").replaceAll("['drive.width','38']","['drive.width','75']").replaceAll("['drive.ratio','6.5']","['drive.ratio','14']"));
