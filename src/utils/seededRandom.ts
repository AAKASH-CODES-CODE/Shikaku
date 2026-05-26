export class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
       
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    this.seed = Math.abs(hash) || 123456789;
  }

  /**
   * Generates a pseudo-random floating point number between 0 and 1 (non-inclusive)
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const val = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return val;
  }

  /**
   * Generates a random integer in [min, max)
   */
  range(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min));
  }
}
