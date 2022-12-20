import { CircularBuffer } from "./circular_buffer.ts";
import { Rock } from "./rock.ts";

const EMPTY = 0;
const STONE = 1;

type BoardHistoryItem = {
  key: string;
  lastJetIndex: number;
  lastRockIndex: number;
  rocksPlaced: number;
  maxY: number;
  offsets: number[];
};

type BoardShape = {
  y: number;
  offsets: number[];
};

export class Board {
  private _jets: CircularBuffer<string>;
  private _rocks: CircularBuffer<Rock>;
  private _maxY = -1;

  _floor = 0;
  _width = 0;
  _pixels: Uint8Array[] = [];
  _movingRocks: Rock[] = [];
  _lastPlacedRock: Rock | undefined;
  _rocksPlaced = 0;

  private _stateHistory: BoardHistoryItem[] = [];

  constructor(
    width: number,
    jets: CircularBuffer<string>,
    rocks: CircularBuffer<Rock>,
  ) {
    this._width = width;

    this._pixels = [];

    this._jets = jets;
    this._rocks = rocks;
  }

  get width(): number {
    return this._width;
  }

  get maxY(): number {
    return this._maxY;
  }

  get rocksPlaced(): number {
    return this._rocksPlaced;
  }

  addMovingRock(rock: Rock): Rock {
    // > Each rock appears so that its left edge is two units away from the left
    // > wall and its bottom edge is three units above the highest rock in the
    // > room (or the floor, if there isn't one).

    const y = this.maxY + rock.height + 3;

    const pixelY = y - this._floor;

    while (this._pixels.length < pixelY + 1) {
      this._pixels.push(new Uint8Array(this.width));
    }

    rock = rock.position(2, y);

    this._movingRocks.push(rock);

    return rock;
  }

  applyBoardShapeOffsets(offsets: number[]) {
    // Our new floor will be the our maxY - largest offset
    const largestOffset = offsets.reduce(
      function (max, value) {
        return value > max ? value : max;
      },
      -Infinity,
    );

    if (!isFinite(largestOffset)) {
      return;
    }

    this._floor = this.maxY - largestOffset;

    this._pixels = Array(largestOffset + 1).fill(null).map(() =>
      new Uint8Array(this.width)
    );

    // apply the offsets (note we need to draw solid lines)
    offsets.forEach((maxY, x) => {
      for (let y = maxY; y >= 0; y--) {
        this._pixels[y][x] = STONE;
      }
    });
  }

  calculateBoardShape(): BoardShape | undefined {
    if (this.hasMovingRocks()) {
      return;
    }

    type ColumnInfo = {
      maxY: number;
      minY: number;
    };

    const columns: ColumnInfo[] = Array(this.width).fill(undefined);

    for (let pixelY = this._pixels.length - 1; pixelY >= 0; pixelY--) {
      for (let x = 0; x < this.width; x++) {
        const pixel = this._pixels[pixelY][x];
        if (pixel === EMPTY) {
          continue;
        }

        const y = this._floor + pixelY;

        if (columns[x]) {
          if (columns[x].minY > y + 1) {
            // we found a gap in one's oop
          } else {
            columns[x].minY = y;
          }
        } else {
          columns[x] = {
            maxY: y,
            minY: y,
          };
        }
      }

      if (columns.filter(Boolean).length === this.width) {
        break;
      }
    }

    columns.forEach((c, index) => {
      if (!c) {
        columns[index] = {
          // "-1" means there's nothing in this column
          minY: -1,
          maxY: -1,
        };
      }
    });

    let gapsDetected = false;

    for (let x = 1; x < this.width; x++) {
      const prev = columns[x - 1];
      const col = columns[x];

      const prevMaxY = prev.maxY;
      const prevMinY = prev.minY;
      const maxY = col.maxY + 1; // Allow for diagonal gaps
      const minY = col.minY - 1;

      const linesOverlap = (prevMinY >= minY && prevMinY <= maxY) ||
        (prevMaxY >= minY && prevMaxY <= maxY) ||
        (minY >= prevMinY && minY <= prevMaxY) ||
        (maxY >= prevMinY && maxY <= prevMaxY);

      if (!linesOverlap) {
        gapsDetected = true;
        break;
      }
    }

    if (gapsDetected) {
      return;
    }

    const y = columns.reduce(
      function (min, c) {
        return c.minY < min ? c.minY : min;
      },
      Infinity,
    );

    const offsets = columns.map((c) => c.maxY - y);

    return { y, offsets };
  }

  canPlaceRock(rock: Rock): boolean {
    let result = true;

    this.iterateThroughRockPixels(rock, (rockX, rockY, boardX, boardY) => {
      if (boardX < 0 || boardX >= this.width) {
        result = false;
        return false;
      }

      if (boardY < 0) {
        result = false;
        return false;
      }

      const rockPixel = rock.pixel(rockX, rockY);
      if (!rockPixel) {
        return;
      }

      const boardPixelY = boardY - this._floor;

      if (boardPixelY < 0) {
        result = false;
        return false;
      }

      if (boardPixelY >= this._pixels.length) {
        // outside the "bounds" of our board
        return;
      }

      const boardPixel = this._pixels[boardPixelY][boardX];
      if (boardPixel !== EMPTY) {
        result = false;
        return false;
      }
    });

    return result;
  }

  draw() {
    console.log(this.stringify());
  }

  /**
   * Attempts to fast forward the state of this board no higher than dropping
   * <maxRockCount> rocks.
   * @param maxRockCount
   */
  fastForward(maxRockCount: number) {
    let boardShape = this.calculateBoardShape();

    if (!boardShape) {
      // We aren't in a good state to manage fast forwarding
      return;
    }

    this.fastForwardFromBoardState(boardShape, maxRockCount);

    boardShape = this.calculateBoardShape();
    if (!boardShape) {
      return;
    }

    const lastJetIndex = this._jets.index;
    const lastRockIndex = this._rocks.index;

    // Even if we weren't able to fast forward, let's save a checkpoint
    // that might help future fast forwarding efforts. If we see
    // a similar board state in the future, we can apply intermediate
    // board states quickly.
    const snapshot = {
      key: [...boardShape.offsets, lastJetIndex, lastRockIndex].join(
        ",",
      ),
      lastJetIndex,
      lastRockIndex,
      maxY: this.maxY,
      rocksPlaced: this.rocksPlaced,
      offsets: boardShape.offsets,
      pixelHeight: this._pixels.length,
    };
    this._stateHistory.push(snapshot);
  }

  fastForwardFromBoardState(
    boardShape: BoardShape,
    maxRockCount: number,
  ) {
    const lastJetIndex = this._jets.index;
    const lastRockIndex = this._rocks.index;
    const key = [...boardShape.offsets, lastJetIndex, lastRockIndex].join(",");

    const prevItem = this._stateHistory.find((i) => i.key === key);
    if (!prevItem) {
      return;
    }

    /*
    If history looks like this: A, B, C, D, B
    Then we can apply the changes from B -> C -> D -> B until we hit our maxRockCount
    */

    const rocksAddedPerLoop = this.rocksPlaced - prevItem.rocksPlaced;
    const yAddedPerLoop = this.maxY - prevItem.maxY;

    const loopsNeeded = Math.floor(
      (maxRockCount - this.rocksPlaced) / rocksAddedPerLoop,
    );

    this._rocksPlaced += loopsNeeded * rocksAddedPerLoop;
    this._maxY += loopsNeeded * yAddedPerLoop;
    this._floor += loopsNeeded * yAddedPerLoop;

    this.optimize();
  }

  getHeightAfter(maxRockCount: number, fastForward?: boolean): number {
    while (true) {
      if (this.rocksPlaced > maxRockCount) {
        throw new Error("overran it");
      }

      if (this.rocksPlaced === maxRockCount) {
        this.draw();
        return this.maxY + 1;
      }

      if (fastForward == null || fastForward) {
        this.fastForward(maxRockCount);
      }

      this.tick();
    }
  }

  hasMovingRocks(): boolean {
    return this._movingRocks.length > 0;
  }

  iterateThroughRockPixels(
    rock: Rock,
    callback: (
      rockX: number,
      rockY: number,
      boardX: number,
      boardY: number,
    ) => void | false,
  ) {
    const xInBoard = rock.x;
    const yInBoard = rock.y;

    for (let rockY = 0; rockY < rock.height; rockY++) {
      for (let rockX = 0; rockX < rock.width; rockX++) {
        const result = callback(
          rockX,
          rockY,
          xInBoard + rockX,
          yInBoard - rockY,
        );
        if (result === false) {
          return;
        }
      }
    }
  }

  mapRocks(func: (rock: Rock, index: number) => Rock | undefined) {
    this._movingRocks = this._movingRocks.map(func).filter(Boolean) as Rock[];
  }

  optimize() {
    if (this.hasMovingRocks()) {
      return;
    }

    const columns: boolean[] = Array(this.width).fill(false);
    for (let pixelY = this._pixels.length - 1; pixelY > 0; pixelY--) {
      let allOk = true;
      const row = this._pixels[pixelY];
      for (let x = 0; x < this.width; x++) {
        const pixel = row[x];
        columns[x] = columns[x] || pixel !== EMPTY;
        allOk = allOk && columns[x];
      }
      if (allOk) {
        this._floor += pixelY;
        this._pixels = this._pixels.slice(pixelY);
        break;
      }
    }

    while (
      this._pixels.length > 1 &&
      this._pixels[this._pixels.length - 1].every((v) => v === EMPTY)
    ) {
      this._pixels.pop();
    }
  }

  placeRock(rock: Rock) {
    // Grow the pixel grid to allow this
    const pixelY = rock.y - this._floor;
    const rowsNeeded = pixelY - this._pixels.length + 1;

    if (rowsNeeded > 0) {
      this._pixels.push(
        ...Array(rowsNeeded).fill(null).map(() => new Uint8Array(this.width)),
      );
    }

    this.iterateThroughRockPixels(
      rock,
      (rockX, rockY, boardX, boardY) => {
        const pixel = rock.pixel(rockX, rockY);
        if (!pixel) {
          return;
        }
        if (boardX < 0 || boardX >= this.width) {
          throw new Error(`boardX outside bounds (was ${boardX}`);
        }
        if (boardY < 0) {
          throw new Error(`boardY outside bounds (was ${boardY})`);
        }
        this._pixels[boardY - this._floor][boardX] = STONE;

        if (boardY > this._maxY) {
          this._maxY = boardY;
        }
      },
    );

    this._lastPlacedRock = rock;
    this._rocksPlaced++;
  }

  stringify() {
    const grid: string[][] = this._pixels.map(
      (row) => {
        return Array.from(row).map((cell) => cell === EMPTY ? " " : "#");
      },
    );

    this._movingRocks.forEach((rock) => {
      this.iterateThroughRockPixels(
        rock,
        (rockX, rockY, boardX, boardY) => {
          if (rock.pixel(rockX, rockY)) {
            grid[boardY][boardX] = "@";
          }
        },
      );
    });

    grid.reverse();

    const longestY = String(this._floor + this._pixels.length - 1).length;
    const bar = Array(longestY + 1 + this.width + 1).fill("-").join(
      "",
    );

    return [
      bar,
      ...grid.map((row, y) => {
        return [
          (grid.length - y - 1 + this._floor).toString().padStart(
            longestY,
            " ",
          ),
          "|",
          row.join(""),
          "|",
        ].join("");
      }),
      bar,
      [
        "".padStart(longestY, " "),
        " ",
        ...Array(this.width).fill(null).map((_, index) =>
          (index % 10).toString()
        ),
        "|",
      ].join(""),
      bar,
    ].join("\n");
  }

  tick() {
    if (!this.hasMovingRocks()) {
      const rockToAdd = this._rocks.next();
      this.addMovingRock(rockToAdd);
      return;
    }

    const jet = this._jets.next();

    // Evaluate effect of jets on each moving rock
    this.mapRocks((rock) => {
      switch (jet) {
        case ">": {
          // Attempt to move rock to the right
          const movedRight = rock.position(rock.x + 1);
          return this.canPlaceRock(movedRight) ? movedRight : rock;
        }
        case "<": {
          // Move to the left
          const movedLeft = rock.position(rock.x - 1);
          return this.canPlaceRock(movedLeft) ? movedLeft : rock;
        }
        default: {
          throw new Error(`Unrecognized jet direction: '${jet}'`);
        }
      }
    });

    // Evaluate effect of gravity on rocks
    const rocksToPlace: Rock[] = [];

    this.mapRocks((rock) => {
      const movedDown = rock.position(undefined, rock.y - 1);
      if (this.canPlaceRock(movedDown)) {
        return movedDown;
      }

      // Rock can't move down any more.
      rocksToPlace.push(rock);
      return undefined;
    });

    rocksToPlace.forEach((rock) => this.placeRock(rock));

    if (this.hasMovingRocks()) {
      // Can't do anything else this tick.
      return;
    }

    // Clean up the board in memory a bit
    this.optimize();
  }
}
