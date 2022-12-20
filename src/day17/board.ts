import { max } from "../shared/reducers.ts";
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

type BoardState = {
  y: number;
  offsets: number[];
};

export class Board {
  private _jets: CircularBuffer<string>;
  private _rocks: CircularBuffer<Rock>;
  private _maxY = -1;

  _floor = 0;
  _width = 0;
  _height = 0;
  _pixels: Uint8Array[] = [];
  _movingRocks: Rock[] = [];
  _lastPlacedRock: Rock | undefined;
  _rocksPlaced = 0;

  private _stateHistory: BoardHistoryItem[] = [];

  constructor(
    width: number,
    height: number,
    jets: CircularBuffer<string>,
    rocks: CircularBuffer<Rock>,
  ) {
    this._width = width;
    this._height = height;

    this._pixels = Array(height).fill(null).map(() => new Uint8Array(width));

    this._jets = jets;
    this._rocks = rocks;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
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

    while (y >= this.height) {
      this.grow();
    }

    rock = rock.position(2, y);

    this._movingRocks.push(rock);

    return rock;
  }

  /**
   * Attempts to summarize the board state as a small array.
   */
  calculateBoardState(): BoardState | undefined {
    if (this.hasMovingRocks()) {
      return;
    }

    type ColumnInfo = {
      maxY: number;
      minY: number;
    };

    const columns: ColumnInfo[] = Array(this.width).fill(undefined);

    for (let y = this.height - 1; y >= this._floor; y--) {
      for (let x = 0; x < this.width; x++) {
        const pixel = this._pixels[y - this._floor][x];
        if (pixel === EMPTY) {
          continue;
        }

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

      if (boardY < 0 || boardY >= this.height) {
        result = false;
        return false;
      }

      const rockPixel = rock.pixel(rockX, rockY);
      if (!rockPixel) {
        return;
      }

      const boardPixelY = boardY - this._floor;
      if (boardPixelY < 0 || boardPixelY >= this._pixels.length) {
        throw new Error(`Invalid pixel y: ${boardPixelY}`);
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
    let boardState = this.calculateBoardState();

    if (!boardState) {
      // We aren't in a good state to manage fast forwarding
      return;
    }

    this.fastForwardFromBoardState(boardState, maxRockCount);

    boardState = this.calculateBoardState();
    if (!boardState) {
      return;
    }

    const lastJetIndex = this._jets.index;
    const lastRockIndex = this._rocks.index;

    // Even if we weren't able to fast forward, let's save a checkpoint
    // that might help future fast forwarding efforts. If we see
    // a similar board state in the future, we can apply intermediate
    // board states quickly.
    const snapshot = {
      key: [...boardState.offsets, lastJetIndex, lastRockIndex].join(
        ",",
      ),
      lastJetIndex,
      lastRockIndex,
      maxY: this.maxY,
      rocksPlaced: this.rocksPlaced,
      offsets: boardState.offsets,
    };
    console.error("snapshot", snapshot, this._stateHistory.length);
    this._stateHistory.push(snapshot);
  }

  fastForwardFromBoardState(
    boardState: BoardState,
    maxRockCount: number,
  ) {
    const lastJetIndex = this._jets.index;
    const lastRockIndex = this._rocks.index;
    const key = [...boardState.offsets, lastJetIndex, lastRockIndex].join(",");

    const index = this._stateHistory.findIndex((i) => i.key === key);
    if (index < 0) {
      return;
    }

    for (let i = index; i < this._stateHistory.length - 1; i++) {
      const thisItem = this._stateHistory[i];
      const nextItem = this._stateHistory[i + 1];

      // We can apply the transition from thisItem -> nextItem
      const addlRocksPlaced = nextItem.rocksPlaced - thisItem.rocksPlaced;
      if (this.rocksPlaced + addlRocksPlaced > maxRockCount) {
        return;
      }

      this._rocksPlaced += addlRocksPlaced;

      const addlY = nextItem.maxY - thisItem.maxY;
      this._maxY += addlY;

      this._jets.index = nextItem.lastJetIndex;
      this._rocks.index = nextItem.lastRockIndex;

      // TODO: Actually apply the offsets to the current board
      /*
        Our new floor will be the our maxY - largest offset
      */
      const largestOffset = nextItem.offsets.reduce(
        function (max, value) {
          return value > max ? value : max;
        },
        -Infinity,
      );

      this._floor = this.maxY - largestOffset;
      this._height = this.maxY + 10;

      this._pixels = Array(this._height - this._floor).fill(null).map(() =>
        new Uint8Array(this.width)
      );

      // apply the offsets
      nextItem.offsets.forEach((maxY, x) => {
        for (let y = maxY; y >= 0; y--) {
          this._pixels[y][x] = STONE;
        }
      });
    }
  }

  getHeightAfter(maxRockCount: number): number {
    while (true) {
      if (this.rocksPlaced > maxRockCount) {
        throw new Error("overran it");
      }
      if (this.rocksPlaced === maxRockCount) {
        return this.maxY + 1;
      }

      this.fastForward(maxRockCount);

      this.tick();
    }
  }

  grow() {
    this._height = Math.floor(this.height * 1.25);

    const physicalHeight = this._height - this._floor;

    this._pixels = Array(physicalHeight).fill(null).map((_, y) => {
      return this._pixels[y] ?? new Uint8Array(this.width);
    });
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
    // if we can trace a line of pixels from (0,y) -> (width-1,y)
    // then we consider the lowest y on the traced line our new floor

    if (this._movingRocks.length > 0) {
      return;
    }

    if (this._lastPlacedRock == null) {
      return;
    }

    const traceLine = (
      x: number,
      y: number,
      recurse: boolean,
    ): number | undefined => {
      if (x >= this.width) {
        return y;
      }

      const pixel = this._pixels[y - this._floor][x];
      if (pixel !== EMPTY) {
        return traceLine(x + 1, y, true);
      }

      if (!recurse) {
        return;
      }

      if (y < this.height - 1) {
        const fromAbove = traceLine(x, y + 1, false);
        if (fromAbove) {
          return Math.min(y, fromAbove);
        }
      }

      if (y > 0) {
        const fromBelow = traceLine(x, y - 1, false);
        if (fromBelow) {
          return Math.min(y, fromBelow);
        }
      }
    };

    for (let rockY = 0; rockY < this._lastPlacedRock.height; rockY++) {
      const lowestY = traceLine(0, this._lastPlacedRock.y - rockY, true);
      if (lowestY) {
        const prevFloor = this._floor;
        const newFloor = lowestY;

        const newBufferHeight = this.height - newFloor;

        this._pixels = Array(newBufferHeight).fill(null).map((_, y) => {
          // row 0 in the buffer will be row prevFloor in the prev pixel array
          return this._pixels[lowestY + y - prevFloor] ??
            new Uint8Array(this.width);
        });

        this._floor = newFloor;

        return;
      }
    }
  }

  placeRock(rock: Rock) {
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
        if (boardY < 0 || boardY >= this.height) {
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

    const longestY = String(this.height - 1).length;
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
