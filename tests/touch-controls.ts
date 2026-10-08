import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {joystickDrive,knobVector,shortView,touchDefaults,validTouchPrefs,touchOnly,touchControls} from '../src/touch-controls';
import {neutral} from '../src/sim';

const near=(a:number,b:number,msg:string)=>assert.ok(Math.abs(a-b)<1e-6,`${msg}: ${a} vs ${b}`);

// Joystick → arcade drive matches the gamepad mix (forward ± turn·0.7).
let d=joystickDrive(0,-1,.15);near(d.left,1,'full forward left');near(d.right,1,'full forward right');
d=joystickDrive(0,1,.15);near(d.left,-1,'reverse left');near(d.right,-1,'reverse right');
d=joystickDrive(1,0,.15);near(d.left,.7,'turn right left');near(d.right,-.7,'turn right right');
d=joystickDrive(.05,.05,.15);assert.deepEqual(d,{left:0,right:0},'inside dead zone is neutral');
d=joystickDrive(NaN,0,.15);assert.deepEqual(d,{left:0,right:0},'invalid input is neutral');
d=joystickDrive(.7071,-.7071,.15);assert.ok(d.left<=1&&d.right>=-1&&d.left>d.right,'diagonal stays clamped and turns right');

// Knob limited to the base radius.
let k=knobVector(200,0,50);near(k.x,1,'knob clamps x');near(k.y,0,'knob y');
k=knobVector(10,-20,50);near(k.x,.2,'knob inside x');near(k.y,-.4,'knob inside y');

// Preferences are validated.
assert.deepEqual(validTouchPrefs(undefined),touchDefaults());
assert.deepEqual(validTouchPrefs({mode:'on',size:'l',opacity:5,leftHanded:true,haptics:false}),{mode:'on',size:'l',opacity:.8,leftHanded:true,haptics:false});
assert.equal(validTouchPrefs({mode:'bogus'}).mode,'auto');

// View labels fit the small button.
assert.equal(shortView('Third person'),'3RD PERSON');assert.equal(shortView('Robot POV'),'ROBOT POV');assert.equal(shortView('Tactical'),'TACTICAL');

// Without a browser (or on desktop with no touch) the layer is inert and never alters commands.
assert.equal(touchOnly(),false);const cmd={...neutral(),left:.3,right:.3,weapon:true};
assert.deepEqual(touchControls().merge(cmd,.15),cmd,'hidden touch layer leaves keyboard/gamepad input unchanged');

// Wiring: every mode's Input feeds player 1 through the touch layer; Local 2P is unavailable on touch-only devices.
const input=readFileSync('src/input.ts','utf8'),main=readFileSync('src/main.ts','utf8'),css=readFileSync('src/mobile.css','utf8'),html=readFileSync('index.html','utf8');
assert.match(input,/player===0\?this\.touch\.merge\(cmd,this\.prefs\.deadzone\):cmd/);
assert.match(input,/quality:'medium'/,'phones use the same default graphics quality as desktop');
assert.match(main,/touchOnly\(\)\?'disabled title="Local 2P needs a keyboard or two gamepads"'/);
assert.match(css,/html\.touch-device \.narrow-message\{display:none!important\}/,'phones are no longer blocked');
assert.match(css,/@media \(orientation:portrait\)/,'rotate prompt for portrait');
assert.match(html,/viewport-fit=cover/);assert.match(html,/rel="manifest"/);
const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));assert.equal(manifest.orientation,'landscape');assert.equal(manifest.display,'fullscreen');
console.log('touch-controls: all checks passed');
