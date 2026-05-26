import { Difficulty, Cell, LevelData } from '../types';
import { SeededRandom } from './seededRandom';

interface RawRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Splits a rectangle recursively.
 * - Easy: smaller grid, smaller areas (max area 8-10, simpler shapes)
 * - Medium: 10x10, moderate areas (max area 15-18)
 * - Hard: 12x12, elongated areas up to 24-28 (1x8, 1x12 shapes)
 */
function splitRect(
  rect: RawRect,
  difficulty: Difficulty,
  results: RawRect[],
  random: () => number
): void {
  const w = rect.x2 - rect.x1 + 1;
  const h = rect.y2 - rect.y1 + 1;
  const area = w * h;

  let maxArea = 8;
  let splitChance = 0.4;

  if (difficulty === 'easy') {
    maxArea = 9;
    splitChance = area > 6 ? 0.7 : 0.2;
  } else if (difficulty === 'medium') {
    maxArea = 16;
    splitChance = area > 12 ? 0.8 : area > 6 ? 0.45 : 0.15;
  } else {
    maxArea = 24;
    splitChance = area > 16 ? 0.85 : area > 8 ? 0.5 : 0.1;
  }

  const mustSplit = area > maxArea;
  const canSplit = area > 2 && (w > 1 || h > 1);

  if (canSplit && (mustSplit || random() < splitChance)) {
    // Determine the preferred split axis
    // If wider than tall, split vertically (along X axis)
    // If taller than wide, split horizontally (along Y axis)
    // If close to square, choose randomly
    let splitVertical = random() < 0.5;
    if (w > h * 1.5) {
      splitVertical = true;
    } else if (h > w * 1.5) {
      splitVertical = false;
    }

    let didSplit = false;

    if (splitVertical && w > 1) {
      // Pick a split offset
      // For Easy, avoid extremely thin long rectangles if possible
      // For Hard, we embrace 1-width or 1-height rectangles willingly
      let splitX = rect.x1 + Math.floor(random() * (w - 1));
      
      const r1: RawRect = { x1: rect.x1, y1: rect.y1, x2: splitX, y2: rect.y2 };
      const r2: RawRect = { x1: splitX + 1, y1: rect.y1, x2: rect.x2, y2: rect.y2 };
      
      splitRect(r1, difficulty, results, random);
      splitRect(r2, difficulty, results, random);
      didSplit = true;
    } else if (!splitVertical && h > 1) {
      let splitY = rect.y1 + Math.floor(random() * (h - 1));
      
      const r1: RawRect = { x1: rect.x1, y1: rect.y1, x2: rect.x2, y2: splitY };
      const r2: RawRect = { x1: rect.x1, y1: splitY + 1, x2: rect.x2, y2: rect.y2 };
      
      splitRect(r1, difficulty, results, random);
      splitRect(r2, difficulty, results, random);
      didSplit = true;
    } else {
      // fallback if the random axis couldn't split
      const tryOther = !splitVertical;
      if (tryOther && w > 1) {
        let splitX = rect.x1 + Math.floor(random() * (w - 1));
        const r1: RawRect = { x1: rect.x1, y1: rect.y1, x2: splitX, y2: rect.y2 };
        const r2: RawRect = { x1: splitX + 1, y1: rect.y1, x2: rect.x2, y2: rect.y2 };
        splitRect(r1, difficulty, results, random);
        splitRect(r2, difficulty, results, random);
        didSplit = true;
      } else if (!tryOther && h > 1) {
        let splitY = rect.y1 + Math.floor(random() * (h - 1));
        const r1: RawRect = { x1: rect.x1, y1: rect.y1, x2: rect.x2, y2: splitY };
        const r2: RawRect = { x1: rect.x1, y1: splitY + 1, x2: rect.x2, y2: rect.y2 };
        splitRect(r1, difficulty, results, random);
        splitRect(r2, difficulty, results, random);
        didSplit = true;
      }
    }

    if (didSplit) {
      return;
    }
  }

  // Base case: store rectangle
  results.push(rect);
}

/**
 * Generates a complete random or seeded Shikaku level.
 */
export function generateLevel(difficulty: Difficulty, seed?: string): LevelData {
  let width = 7;
  let height = 7;

  if (difficulty === 'easy') {
    // Easy: 5x5 Grid
    width = 5;
    height = 5;
  } else if (difficulty === 'medium') {
    // Medium: 10x10 Grid
    width = 10;
    height = 10;
  } else {
    // Hard: 15x15 Grid
    width = 15;
    height = 15;
  }

  const baseRect: RawRect = { x1: 0, y1: 0, x2: width - 1, y2: height - 1 };
  const rawRects: RawRect[] = [];
  
  // Choose random generator
  let rand = Math.random;
  if (seed) {
    const sr = new SeededRandom(seed);
    rand = () => sr.next();
  }

  // Perform multiple tries to ensure we get a well-balanced grid
  splitRect(baseRect, difficulty, rawRects, rand);

  // Initialize clues and final cell grid
  const cells: Cell[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push({ x, y, number: null });
    }
  }

  const solutionclues: { x: number; y: number; area: number }[] = [];
  const solutionRectangles: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    clueX: number;
    clueY: number;
    area: number;
  }[] = [];

  // Populate actual numbers from generated partitions
  rawRects.forEach((r) => {
    const rw = r.x2 - r.x1 + 1;
    const rh = r.y2 - r.y1 + 1;
    const area = rw * rh;

    // Place a clue inside a random cell of this rectangle
    const rx = r.x1 + Math.floor(rand() * rw);
    const ry = r.y1 + Math.floor(rand() * rh);

    const cellIndex = ry * width + rx;
    if (cells[cellIndex]) {
      cells[cellIndex].number = area;
    }

    solutionclues.push({
      x: rx,
      y: ry,
      area: area
    });

    solutionRectangles.push({
      startX: r.x1,
      startY: r.y1,
      endX: r.x2,
      endY: r.y2,
      clueX: rx,
      clueY: ry,
      area: area
    });
  });

  return {
    difficulty,
    width,
    height,
    cells,
    solutionclues,
    solutionRectangles
  };
}
