import {readFileSync,writeFileSync} from 'node:fs';
const path='src/model.ts',s=readFileSync(path,'utf8'),anchor=" // Keep saved stock builds compatible with the vertical recovery mechanisms.";if(!s.includes(anchor))throw Error('Missing import anchor');writeFileSync(path,s.replace(anchor,` // Migrate only the exact legacy stock geometry. Preserve edited builds.
 if(parsed.chassis.profile==='hydra'&&parsed.weapon.type==='flipper'&&parsed.chassis.length===.64&&parsed.chassis.width===.58&&parsed.chassis.height===.16&&parsed.weapon.length===.30&&parsed.weapon.width===.22&&parsed.weapon.thickness===.012&&Math.abs(parsed.weapon.mount.y-.101)<1e-6&&Math.abs(parsed.weapon.mount.z+.335)<1e-6&&parsed.drive.radius===.10&&parsed.drive.width===.075){
  const stock=preset(2);parsed.chassis.height=.08;parsed.chassis.form='box';parsed.weapon={...parsed.weapon,length:.663,thickness:.028,mount:copy(stock.weapon.type==='flipper'?stock.weapon.mount:v())};parsed.drive.radius=.05;parsed.drive.width=.038;
  if(Math.abs((parsed.chassis.equipmentMassKg??-1)-18.629719642711223)<1e-6)parsed.chassis.equipmentMassKg=stock.chassis.equipmentMassKg;
 }
`+anchor));
