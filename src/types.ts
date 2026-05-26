export interface Cell {
  x: number;
  y: number;
  number: number | null; // Clue value, or null if empty
}

export interface DraggedRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface BoardRectangle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
  area: number;
  clueX: number | null;
  clueY: number | null;
  clueValue: number | null;
  isValid: boolean; // Valid if it contains exactly one clue AND area equals that clue value
  containsMultipleClues: boolean; // Overlaps multiple clue cells
  hasWrongArea: boolean; // Contains exactly one clue but the drawn area is incorrect
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameSettings {
  difficulty: Difficulty;
  isMuted: boolean;
  isDarkMode: boolean;
}

export interface LevelData {
  difficulty: Difficulty;
  width: number;
  height: number;
  cells: Cell[];
  solutionclues: { x: number; y: number; area: number }[];
  solutionRectangles: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    clueX: number;
    clueY: number;
    area: number;
  }[];
}

export interface GameAction {
  type: 'ADD_RECTANGLE' | 'REMOVE_RECTANGLE' | 'REPLACE_RECTANGLES' | 'CLEAR_ALL';
  rectangles: BoardRectangle[];
}
