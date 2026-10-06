# Wall containment performance

## Change

Wall containment caches immutable robot geometry and parent-local transforms. It calculates exact bounds without per-vertex vector objects.

The cache retains the original collision surfaces. The physics timestep and result rules remain the same.

## Acceptance

[Full acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37402035969) tested `807d255b14565ebc52a17ea64c8b9a0e546a80ae`.
[Trajectory acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37402532567) tested `04d09efcaac9bb6600c2011a73dd672b8e01fee6`.

The bounds matched the previous implementation for all colliders in all 11 stock robots. The comparison covered four rotation axes.

A Hydra and HyperShock benchmark performed 22,880 bounds queries. Cached queries ran about 15.28 times faster in that cloud run.

The near-wall simulation used 1,200 normal physics ticks. The previous implementation took 7,983 ms.

The cached implementation took 5,144 ms. The complete simulation ran about 1.55 times faster and produced an identical snapshot.

These measurements describe that benchmark environment. Hardware and the active fight determine the actual rate.

The complete acceptance also covered:

- All stock configurations and physical fit checks
- Scratch recovery and the saved library
- Seven physical offline tournament fights
- Seven native online tournament fights
- Repair purchases and spectator instruments
- Armed impacts and integer damage bubbles
- Continued controls and refresh recovery.

## Cache contract

Only robot colliders with immutable geometry use the cache. The registration occurs during wall containment and also covers restored checkpoints.

Unregistered colliders retain live geometry reads. A new collider receives a new cache entry.

Body movement updates the world pose. It does not change the cached parent-local transform.
