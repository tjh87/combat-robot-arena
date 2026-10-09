import assert from 'node:assert/strict';
import {ROSTER,copy,preset} from '../src/model';
import {tournamentRobotTiles} from '../src/robot-selection';

const stock=tournamentRobotTiles(4);
assert.equal((stock.match(/data-tournament-robot="\d+"/g)??[]).length,ROSTER.length);
assert.equal((stock.match(/aria-pressed="true"/g)??[]).length,1);
assert.match(stock,/data-tournament-robot="4" aria-pressed="true"/);
assert.match(stock,/role="group" aria-label="Choose your tournament contender"/);
assert.match(stock,/class="tournament-roster-rail"/);

const custom=copy(preset(0));
custom.identity.name='Workshop Champion';
const withCustom=tournamentRobotTiles('custom',custom);
assert.equal((withCustom.match(/data-tournament-robot="\d+"/g)??[]).length,ROSTER.length);
assert.equal((withCustom.match(/data-tournament-robot="custom"/g)??[]).length,1);
assert.equal((withCustom.match(/aria-pressed="true"/g)??[]).length,1);
assert.match(withCustom,/data-tournament-robot="custom" aria-pressed="true"/);
assert.match(withCustom,/Workshop Champion/);

console.log('PASS tournament contender tile rail exposes every stock robot and a selectable custom contender');
