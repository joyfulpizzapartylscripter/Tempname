import {
    world,
    system,
    BlockPermutation
} from "@minecraft/server";


/*
========================================
VOID STAFF
========================================
*/

world.beforeEvents.itemUseOn.subscribe((ev) => {

    const item = ev.itemStack;

    if (!item) return;

    if (item.typeId !== "chaos:void_staff")
        return;

    const block = ev.block;

    if (!block) return;

    const dim = block.dimension;
    const pos = block.location;

    // black block
    try {

        block.setPermutation(
            BlockPermutation.resolve(
                "minecraft:black_concrete"
            )
        );

    } catch {}

    // particles
    try {

        dim.spawnParticle(
            "minecraft:huge_explosion_emitter",
            {
                x: pos.x + 0.5,
                y: pos.y + 0.5,
                z: pos.z + 0.5
            }
        );

    } catch {}

    // explode after 3 sec
    system.runTimeout(() => {

        try {

            dim.createExplosion(
                {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z
                },
                5,
                {
                    breaksBlocks: true,
                    causesFire: false
                }
            );

        } catch {}

    }, 60);

});


/*
========================================
INFINITE STAFF
========================================
*/

world.afterEvents.itemUse.subscribe((ev) => {

    const item = ev.itemStack;

    if (!item) return;

    if (item.typeId !== "chaos:infinite_staff")
        return;

    const player = ev.source;

    if (!player) return;

    const dim = player.dimension;

    const dir = player.getViewDirection();

    let pos = {
        x: player.location.x,
        y: player.location.y + 1.5,
        z: player.location.z
    };

    let ticks = 0;

    // 5 blocks/sec
    const speed = 0.25;

    const proj = system.runInterval(() => {

        ticks++;

        pos.x += dir.x * speed;
        pos.y += dir.y * speed;
        pos.z += dir.z * speed;

        // projectile particles
        try {

            dim.spawnParticle(
                "minecraft:endrod",
                pos
            );

        } catch {}

        try {

            dim.spawnParticle(
                "minecraft:portal_directional",
                pos
            );

        } catch {}

        const block = dim.getBlock({
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            z: Math.floor(pos.z)
        });

        // collision
        if (
            block &&
            block.typeId !== "minecraft:air"
        ) {

            corruptNearby(
                dim,
                pos
            );

            system.clearRun(proj);

            return;
        }

        // max range
        if (ticks > 120) {

            system.clearRun(proj);

        }

    }, 1);

});


/*
========================================
CORRUPTION
========================================
*/

function corruptNearby(dim, loc) {

    const commandBlocks = [

        "minecraft:command_block",

        "minecraft:chain_command_block",

        "minecraft:repeating_command_block"
    ];

    let changed = [];

    for (let x = -2; x <= 2; x++) {

        for (let y = -2; y <= 2; y++) {

            for (let z = -2; z <= 2; z++) {

                const block = dim.getBlock({

                    x: Math.floor(loc.x + x),

                    y: Math.floor(loc.y + y),

                    z: Math.floor(loc.z + z)
                });

                if (!block) continue;

                if (
                    block.typeId === "minecraft:air"
                ) continue;

                const randomType =

                    commandBlocks[
                        Math.floor(
                            Math.random()
                            * commandBlocks.length
                        )
                    ];

                try {

                    block.setPermutation(
                        BlockPermutation.resolve(
                            randomType
                        )
                    );

                    changed.push(block);

                } catch {}

            }
        }
    }

    // corruption explosion
    try {

        dim.createExplosion(
            loc,
            2,
            {
                breaksBlocks: false,
                causesFire: false
            }
        );

    } catch {}

    // remove after 1 sec
    system.runTimeout(() => {

        for (const block of changed) {

            try {

                block.setPermutation(
                    BlockPermutation.resolve(
                        "minecraft:air"
                    )
                );

            } catch {}

        }

    }, 20);
              }
