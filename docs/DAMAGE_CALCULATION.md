# Final damage calculation

The simulation uses SI units and a fixed 240 Hz timestep. Rapier solves contact forces and robot motion.

Robot speed contributes through contact-normal translation energy. Weapon rotation contributes through a separate rotor budget.

The damage calculation assigns solved work to these sources. It does not add kinetic energy to a second copy of contact energy.

## Contact energy

`J` is the solved normal impulse in N·s. `v_close` is the contact-point closing speed in m/s.

```text
E_solved = 0.5 × J × max(0, v_close)
v_translation = max(0, dot(v_chassis_A - v_chassis_B, contact_normal))
mu = m_A × m_B / (m_A + m_B)
E_normal_translation = 0.5 × mu × v_translation²
translation_share = clamp(v_translation / max(0.001, v_close), 0, 1)
spin_share = clamp(spin_contact_speed / max(0.001, v_close), 0, 1 - translation_share)
E_translation = min(E_solved × translation_share, E_normal_translation, remaining_motion_budget)
E_rotation = min(E_solved × spin_share, spent_rotor_work)
E_other = E_solved × (1 - translation_share - spin_share) + solved_shear_work
E_contact = E_translation + E_rotation + E_other
```

`m_A` and `m_B` are the actual attached masses. For a fixed arena surface, the effective mass equals the attached robot mass.

Each robot shares its available translation energy across contacts in the same timestep. That budget uses `0.5 × mass × chassis_speed²`.

Only the closing component contributes to translation damage. Parallel motion, separation, and a gentle stationary push do not supply a speed bonus.

The ledger records both robot speeds and the energy components. The components sum to the recorded contact energy.

Saw hazards also use the solved tangential work:

```text
E_shear = 0.5 × friction_impulse × tangential_relative_speed
```

Robot contact episodes need 200 J before ordinary HP damage starts. Saw hazard episodes use 25 J.

## Rotor energy and tooth engagement

```text
omega = RPM × pi / 30
E_rotor = 0.5 × rotor_inertia × omega²
feed_per_tooth = 2 × pi × closing_feed_speed / (tooth_count × abs(omega))
bite_depth = min(exposed_tooth_depth, insertion, feed_per_tooth)
engagement = clamp(bite_depth / exposed_tooth_depth, 0, 1) × clamp(incidence, 0, 1)
tooth_damage_scale = 0.15 + 0.85 × engagement
```

A non-tooth surface uses a damage scale of 0.08. SawBlaze adds its physical arm stroke through a separate swing share.

Simultaneous rotor contacts share one energy budget. Floor and wall contacts also reduce rotor speed.

Finite motor work can restore rotor energy on later timesteps. HP multipliers do not add physical launch energy.

## HP allocation

A weapon strike damages its receiver. Weapon-to-weapon contacts use a target share of 0.5.

Other weapon targets use a target share of 1.2. HUGE uses a stock strike multiplier of 3.

Deep Six uses a stock strike multiplier of 4. Other stock robots retain their existing multiplier.

```text
assigned_energy = contact_energy_delta × target_share × strike_multiplier × engagement_scale
HP_loss = min(current_HP, max(0, assigned_energy) / material_resistance)
remaining_energy = assigned_energy - HP_loss × material_resistance
```

The route first consumes energy at the contacted module. Remaining energy follows the existing armor, chassis, drive, and battery route.

A located battery strike must reach its fitted battery zone. Local puncture work consumes energy before internal battery damage.

HUGE wheel-only contacts use half HP damage. This rule does not change the solved contact impulse.

A ram requires at least 1 m/s of closing horizontal translation. The opposing closing speeds determine its damage shares.

Exact fractional HP remains internal. Floating labels use integers and suppress values that round to 1 HP.

## Landing and hydraulic work

```text
E_landing = 0.5 × actual_attached_mass × downward_speed²
E_gravity = min(E_landing, mass × 9.81 × descent)
E_cushion = min(E_landing, mass × 9.81 × 0.12)
E_landing_damage = max(0, E_landing - E_cushion)
```

The gravity term identifies an energy source. The calculation does not add that term to landing energy again.

Landing damage retains the 1.5 m/s threshold. The contacted part receives 70 percent and the chassis receives 30 percent.

Quantum retains its pressure-contact and finite hydraulic-work calculation. Flippers retain support-dependent physical work and their existing damage rules.

## Cosmetic wall damage

Wall impacts need at least 200 J and 20 N·s. The wall collision geometry remains intact.

| Impact energy | Crack pattern |
| --- | --- |
| 200–899 J | Short hairlines |
| 900–4,199 J | Uneven starbursts |
| 4,200–13,999 J | Branches and forks |
| 14,000 J or more | Dense fracture networks |

Energy controls crack radius and pattern. Impulse also controls the normalized visual severity.

Impact direction controls crack orientation and stretch. A deterministic seed changes individual branches without changing a replay.

The renderer retains at most 48 cracks and 72 segments per crack. The maximum base radius changes from 0.85 m to 1.15 m.

These values are cosmetic game estimates. The game does not claim measured fracture properties or structural HP for real arena walls.

## Source

| File | Responsibility |
| --- | --- |
| `src/impact-energy.ts` | Contact-normal translation and rotor-work allocation |
| `src/sim.ts` | Solved contacts, shared budgets, ledger, and HP routes |
| `src/combat-damage.ts` | Receiver shares and protected output |
| `src/weapon-impact.ts` | Tooth engagement and rotor limits |
| `src/landing-impact.ts` | Landing energy |
| `src/wall-damage.ts` | Cosmetic wall-impact records |
| `src/wall-fracture.ts` | Deterministic crack segments |
