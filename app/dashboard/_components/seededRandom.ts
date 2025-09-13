// Deterministisk PRNG (mulberry32) + string->seed hash.
// Brug: const rng = seededRng(`${instanceId}::riskReward`); rng() -> 0..1
export function hashSeed(str: string): number {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
}

export function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6D2B79F5) >>> 0;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function seededRng(seedStr: string): () => number {
    return mulberry32(hashSeed(seedStr));
}
