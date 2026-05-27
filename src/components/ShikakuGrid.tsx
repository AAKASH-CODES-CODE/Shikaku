import { useState, useEffect, useRef, MouseEvent, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cell, BoardRectangle, DraggedRect } from '../types';
import { sfx, triggerHaptic } from '../utils/audio';

interface ShikakuGridProps {
  width: number;
  height: number;
  cells: Cell[];
  boardRectangles: BoardRectangle[];
  onAddRectangle: (rect: BoardRectangle) => void;
  onRemoveRectangle: (rectId: string) => void;
  isMuted: boolean;
  isDarkMode: boolean;
  hintFlashRect: BoardRectangle | null;
  onClearHintFlash: () => void;
  solutionRectangles: any[];
  isWinningCascade: boolean;
  cascadeIndex: number;
  reducedMotion?: boolean;
}

export default function ShikakuGrid({
  width,
  height,
  cells,
  boardRectangles,
  onAddRectangle,
  onRemoveRectangle,
  isMuted,
  isDarkMode,
  hintFlashRect,
  onClearHintFlash,
  solutionRectangles,
  isWinningCascade,
  cascadeIndex,
  reducedMotion = false,
}: ShikakuGridProps) {
  // Drag states
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [shakeActive, setShakeActive] = useState(false);

  // Track level changes to trigger scale pop stagger effect when starting a new level
  const [levelKey, setLevelKey] = useState(0);

  useEffect(() => {
    setLevelKey((prev) => prev + 1);
  }, [cells]);

  // References
  const gridRef = useRef<HTMLDivElement>(null);
  const lastTickCellRef = useRef<{ x: number; y: number } | null>(null);

  // Clear hint flash after 1.5 seconds
  useEffect(() => {
    if (hintFlashRect) {
      const timer = setTimeout(() => {
        onClearHintFlash();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hintFlashRect, onClearHintFlash]);

  // Utility to find clue count and coordinates in a dragged region
  const evaluateRegion = (r: DraggedRect) => {
    const xMin = Math.min(r.startX, r.endX);
    const xMax = Math.max(r.startX, r.endX);
    const yMin = Math.min(r.startY, r.endY);
    const yMax = Math.max(r.startY, r.endY);

    const cluesInRect: Cell[] = [];
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const cell = cells.find((c) => c.x === x && c.y === y);
        if (cell && cell.number !== null) {
          cluesInRect.push(cell);
        }
      }
    }
    return {
      clues: cluesInRect,
      xMin,
      xMax,
      yMin,
      yMax,
      clueCount: cluesInRect.length,
    };
  };

  // Helper to check collision with existing locked rectangles
  const hasCollisionWithLocked = (r: DraggedRect): boolean => {
    const xMin = Math.min(r.startX, r.endX);
    const xMax = Math.max(r.startX, r.endX);
    const yMin = Math.min(r.startY, r.endY);
    const yMax = Math.max(r.startY, r.endY);

    // Check if any part of the dragged selection overlaps with any existing locked rect
    for (const borderRect of boardRectangles) {
      const bMinX = borderRect.startX;
      const bMaxX = borderRect.endX;
      const bMinY = borderRect.startY;
      const bMaxY = borderRect.endY;

      // Overlap condition
      const overlapX = xMin <= bMaxX && xMax >= bMinX;
      const overlapY = yMin <= bMaxY && yMax >= bMinY;

      if (overlapX && overlapY) {
        return true;
      }
    }
    return false;
  };

  // Trigger grid snapping sounds/haptics when moving over cells
  const handleCellHover = (x: number, y: number) => {
    if (!lastTickCellRef.current || lastTickCellRef.current.x !== x || lastTickCellRef.current.y !== y) {
      lastTickCellRef.current = { x, y };
      sfx.playDragTick(isMuted);
      triggerHaptic(10, isMuted);
    }
  };

  // Calculate coordinates from cursor/touch point
  const getCellCoordsFromEvent = (clientX: number, clientY: number) => {
    if (!gridRef.current) return null;
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;

    const cellEl = element.closest('[data-cell]');
    if (cellEl) {
      const x = parseInt(cellEl.getAttribute('data-x') || '', 10);
      const y = parseInt(cellEl.getAttribute('data-y') || '', 10);
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
    return null;
  };

  // Mouse drag handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, cell: Cell) => {
    if (isWinningCascade) return;
    // Check if clicking directly on an existing rect to delete it
    const rectClicked = boardRectangles.find(
      (r) => cell.x >= r.startX && cell.x <= r.endX && cell.y >= r.startY && cell.y <= r.endY
    );

    if (rectClicked) {
      onRemoveRectangle(rectClicked.id);
      sfx.playDragTick(isMuted);
      triggerHaptic(15, isMuted);
      return;
    }

    // Direct single tap select for 1x1 box
    if (cell.number === 1) {
      const newId = `rect_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const completedRect: BoardRectangle = {
        id: newId,
        startX: cell.x,
        startY: cell.y,
        endX: cell.x,
        endY: cell.y,
        width: 1,
        height: 1,
        area: 1,
        clueX: cell.x,
        clueY: cell.y,
        clueValue: 1,
        isValid: true,
        containsMultipleClues: false,
        hasWrongArea: false,
      };
      onAddRectangle(completedRect);
      sfx.playLockClick(isMuted);
      triggerHaptic(15, isMuted);
      return;
    }

    setIsDragging(true);
    setDragOrigin({ x: cell.x, y: cell.y });
    setDragCurrent({ x: cell.x, y: cell.y });
    lastTickCellRef.current = { x: cell.x, y: cell.y };
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragOrigin) return;
    const coords = getCellCoordsFromEvent(e.clientX, e.clientY);
    if (coords) {
      setDragCurrent(coords);
      handleCellHover(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragOrigin || !dragCurrent) return;
    setIsDragging(false);

    finishDragSelection(dragOrigin, dragCurrent);
    setDragOrigin(null);
    setDragCurrent(null);
  };

  // Touch handlers (Pristine support with touch-action: none)
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isWinningCascade) return;
    const touch = e.touches[0];
    const coords = getCellCoordsFromEvent(touch.clientX, touch.clientY);
    if (!coords) return;

    const cell = cells.find((c) => c.x === coords.x && c.y === coords.y);
    if (!cell) return;

    // Check click delete
    const rectClicked = boardRectangles.find(
      (r) => coords.x >= r.startX && coords.x <= r.endX && coords.y >= r.startY && coords.y <= r.endY
    );

    if (rectClicked) {
      onRemoveRectangle(rectClicked.id);
      sfx.playDragTick(isMuted);
      triggerHaptic(15, isMuted);
      return;
    }

    // Direct single tap select for 1x1 box
    if (cell.number === 1) {
      const newId = `rect_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const completedRect: BoardRectangle = {
        id: newId,
        startX: cell.x,
        startY: cell.y,
        endX: cell.x,
        endY: cell.y,
        width: 1,
        height: 1,
        area: 1,
        clueX: cell.x,
        clueY: cell.y,
        clueValue: 1,
        isValid: true,
        containsMultipleClues: false,
        hasWrongArea: false,
      };
      onAddRectangle(completedRect);
      sfx.playLockClick(isMuted);
      triggerHaptic(15, isMuted);
      return;
    }

    setIsDragging(true);
    setDragOrigin({ x: coords.x, y: coords.y });
    setDragCurrent({ x: coords.x, y: coords.y });
    lastTickCellRef.current = { x: coords.x, y: coords.y };
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !dragOrigin) return;
    const touch = e.touches[0];
    const coords = getCellCoordsFromEvent(touch.clientX, touch.clientY);
    if (coords) {
      setDragCurrent(coords);
      handleCellHover(coords.x, coords.y);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !dragOrigin || !dragCurrent) return;
    setIsDragging(false);

    finishDragSelection(dragOrigin, dragCurrent);
    setDragOrigin(null);
    setDragCurrent(null);
  };

  // Shared completion of selection logic
  const finishDragSelection = (origin: { x: number; y: number }, current: { x: number; y: number }) => {
    const r: DraggedRect = {
      startX: origin.x,
      startY: origin.y,
      endX: current.x,
      endY: current.y,
    };

    // Check collision with locked rectangles
    if (hasCollisionWithLocked(r)) {
      triggerErrorFeedback();
      return;
    }

    const info = evaluateRegion(r);
    const rectWidth = info.xMax - info.xMin + 1;
    const rectHeight = info.yMax - info.yMin + 1;
    const rectArea = rectWidth * rectHeight;

    if (info.clueCount === 0) {
      // Reject instantly - zero numbers
      triggerErrorFeedback();
    } else if (info.clueCount >= 2) {
      // Reject instantly - multiple numbers
      triggerErrorFeedback();
    } else {
      // Exactly 1 clue cell
      const clueCell = info.clues[0];
      const clueVal = clueCell.number;
      const isValid = rectArea === clueVal;

      const newId = `rect_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const completedRect: BoardRectangle = {
        id: newId,
        startX: info.xMin,
        startY: info.yMin,
        endX: info.xMax,
        endY: info.yMax,
        width: rectWidth,
        height: rectHeight,
        area: rectArea,
        clueX: clueCell.x,
        clueY: clueCell.y,
        clueValue: clueVal,
        isValid,
        containsMultipleClues: false,
        hasWrongArea: !isValid,
      };

      onAddRectangle(completedRect);

      if (isValid) {
        sfx.playLockClick(isMuted);
        triggerHaptic(15, isMuted);
      } else {
        // Allow placement but visually warn (Wrong Area)
        sfx.playErrorThud(isMuted);
        triggerHaptic(30, isMuted);
      }
    }
  };

  const triggerErrorFeedback = () => {
    sfx.playErrorThud(isMuted);
    triggerHaptic([50, 40, 50], isMuted);
    setShakeActive(true);
    setTimeout(() => setShakeActive(false), 300);
  };

  // Compute active drag visual box
  const getActiveDragRect = () => {
    if (!isDragging || !dragOrigin || !dragCurrent) return null;
    const startX = Math.min(dragOrigin.x, dragCurrent.x);
    const startY = Math.min(dragOrigin.y, dragCurrent.y);
    const endX = Math.max(dragOrigin.x, dragCurrent.x);
    const endY = Math.max(dragOrigin.y, dragCurrent.y);

    const checkCollision = hasCollisionWithLocked({ startX, startY, endX, endY });
    const info = evaluateRegion({ startX, startY, endX, endY });
    
    // An error is when we have a collision, OR clueCount is 0, OR clueCount >= 2
    const isError = checkCollision || info.clueCount === 0 || info.clueCount >= 2;

    return {
      startX,
      startY,
      endX,
      endY,
      isError,
    };
  };

  const activeDrag = getActiveDragRect();

  // Grid background style settings
  const outerBorderColor = isDarkMode ? 'border-neutral-800' : 'border-neutral-300';
  const cellBorderColor = isDarkMode ? 'border-neutral-900/40' : 'border-neutral-200';
  const gridLineColor = isDarkMode ? '#1e1e21' : '#e5e5ea';

  return (
    <div className="w-full h-full flex items-center justify-center p-0 min-h-0 min-w-0 overflow-hidden">
      <div
        id="board-canvas-wrapper"
        className="relative select-none"
        style={{ 
          touchAction: 'none',
          aspectRatio: `${width} / ${height}`,
          maxHeight: '100%',
          maxWidth: '100%',
          width: '1000vh' // Absurd size, will safely hit max-height or max-width bounds
        }}
      >
        <motion.div
          ref={gridRef}
          className={`w-full h-full rounded-xl border-2 ${outerBorderColor} relative overflow-hidden bg-neutral-100 dark:bg-neutral-950 transition-colors duration-200 p-1.5 md:p-2`}
          animate={shakeActive ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.3 }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Interactive Cell Elements Grid */}
          <div
            className="w-full h-full grid relative"
            style={{
              gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
              gap: width > 10 ? '3px' : '4px',
            }}
          >
            {cells.map((cell) => {
              // Check if cell is the active clue and we've already satisfied it perfectly
              const matchingRect = boardRectangles.find(
                (r) => r.clueX === cell.x && r.clueY === cell.y && r.isValid
              );

              // Check if cell is inside any locked rectangle
              const isInsideLockedRect = boardRectangles.some(
                (r) => cell.x >= r.startX && cell.x <= r.endX && cell.y >= r.startY && cell.y <= r.endY
              );

              // Check if cell is inside active drag rectangle
              const isInsideDragRect = activeDrag && cell.x >= activeDrag.startX && cell.x <= activeDrag.endX && cell.y >= activeDrag.startY && cell.y <= activeDrag.endY;

              const hasBg = !isInsideLockedRect && !isInsideDragRect;

              // Calculate distance from center to configure stagger delay
              const centerX = (width - 1) / 2;
              const centerY = (height - 1) / 2;
              const dx = cell.x - centerX;
              const dy = cell.y - centerY;
              const distance = Math.sqrt(dx * dx + dy * dy);

              return (
                <motion.div
                  key={`cell-${cell.x}-${cell.y}-${levelKey}`}
                  data-cell="true"
                  data-x={cell.x}
                  data-y={cell.y}
                  onMouseDown={(e) => handleMouseDown(e, cell)}
                  aria-label={
                    cell.number !== null
                      ? `Cell at column ${cell.x + 1}, row ${cell.y + 1}. Clue value ${cell.number}`
                      : `Empty cell at column ${cell.x + 1}, row ${cell.y + 1}`
                  }
                  initial={reducedMotion ? { scale: 1, opacity: 0 } : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={reducedMotion ? {
                    duration: 0.15
                  } : {
                    type: 'spring',
                    stiffness: 240,
                    damping: 18,
                    delay: distance * 0.05,
                  }}
                  className={`w-full h-full flex items-center justify-center relative cursor-crosshair text-base select-none rounded-[10%] ${hasBg ? 'bg-white dark:bg-[#2A2B30]' : 'bg-transparent'} z-40`}
                  style={{
                    gridColumn: cell.x + 1,
                    gridRow: cell.y + 1,
                  }}
                >
                  {cell.number !== null && (
                    <motion.span
                      id={`clue-node-${cell.x}-${cell.y}`}
                      animate={matchingRect && !reducedMotion ? { scale: [1, 1.25, 1.0], fontWeight: 700 } : matchingRect ? { fontWeight: 700 } : {}}
                      transition={{ duration: 0.25 }}
                      className={`text-[1.35rem] leading-none ${
                        matchingRect
                          ? 'text-neutral-500 dark:text-neutral-400 font-bold'
                          : isDarkMode
                          ? 'text-white font-extrabold'
                          : 'text-neutral-950 font-extrabold'
                      } cursor-inherit relative z-40 transition-all duration-200 block drop-shadow-sm`}
                    >
                      {cell.number}
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
            
            {/* Render Active Locked Rectangles */}
            {boardRectangles.map((rect, idx) => {
              const isCascaded = isWinningCascade && idx <= cascadeIndex;
              
              const fillColor = rect.isValid
                ? isCascaded
                  ? 'bg-emerald-500/40'
                  : isDarkMode
                  ? 'bg-[#0A84FF]/30'
                  : 'bg-[#007AFF]/25'
                : isDarkMode
                ? 'bg-[#FF453A]/40'
                : 'bg-[#FF3B30]/30';

              const borderColor = rect.isValid
                ? isCascaded
                  ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : isDarkMode
                  ? 'border-[#0A84FF]'
                  : 'border-[#007AFF]'
                : isDarkMode
                ? 'border-[#FF453A]'
                : 'border-[#FF3B30]';

              return (
                <motion.div
                  key={rect.id}
                  id={`rect-overlay-${rect.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`rounded-[10%] border-2 transition-colors duration-250 ${fillColor} ${borderColor} z-30 flex items-center justify-center pointer-events-none`}
                  style={{
                    gridColumn: `${rect.startX + 1} / ${rect.endX + 2}`,
                    gridRow: `${rect.startY + 1} / ${rect.endY + 2}`,
                  }}
                >
                  {/* Visual clue validation dot indicator */}
                  {!rect.isValid && (
                    <div className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </motion.div>
              );
            })}

          {/* Real-time Dynamic Selection Drag Box */}
          {activeDrag && (
            <div
              className={`pointer-events-none border-2 rounded-[10%] z-30 flex items-center justify-center ${
                activeDrag.isError
                  ? isDarkMode
                    ? 'border-[#FF453A] bg-[#FF453A]/40'
                    : 'border-[#FF3B30] bg-[#FF3B30]/30'
                  : isDarkMode
                  ? 'border-[#0A84FF] bg-[#0A84FF]/30'
                  : 'border-[#007AFF] bg-[#007AFF]/25'
              }`}
              style={{
                gridColumn: `${activeDrag.startX + 1} / ${activeDrag.endX + 2}`,
                gridRow: `${activeDrag.startY + 1} / ${activeDrag.endY + 2}`,
              }}
            >
              {/* Dynamic size tag overlay for helpful UI alignment */}
              <div className={`text-[10px] font-semibold tracking-wider font-mono px-1.5 py-0.5 rounded shadow absolute -top-5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border ${
                activeDrag.isError ? 'border-red-500' : 'border-blue-500'
              }`}>
                {((activeDrag.endX - activeDrag.startX + 1) * (activeDrag.endY - activeDrag.startY + 1))}
              </div>
            </div>
          )}

          {/* Hint Flash Animation Layer */}
          <AnimatePresence>
            {hintFlashRect && (
              <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: [1, 0, 1, 0, 1], scale: [1, 1.02, 1, 1.02, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                className="pointer-events-none border-dashed border-4 border-amber-500 bg-amber-500/10 rounded-[10%] z-50"
                style={{
                  gridColumn: `${hintFlashRect.startX + 1} / ${hintFlashRect.endX + 2}`,
                  gridRow: `${hintFlashRect.startY + 1} / ${hintFlashRect.endY + 2}`,
                }}
              />
            )}
          </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
