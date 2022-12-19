import { Rock } from "./rock.ts";

const EMPTY = 0;
const STONE = 1;

export class Board {
  _floor = 0;
  _width = 0;
  _height = 0;
  _pixels: Uint8Array[] = [];
  _movingRocks: Rock[] = [];
  _lastPlacedRock: Rock | undefined;

  constructor(
    width: number,
    height: number,
  ) {
    this._width = width;
    this._height = height;

    this._pixels = Array(height).fill(null).map(() => new Uint8Array(width));
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get highestRockY(): number {
    for (let y = this._pixels.length - 1; y >= 0; y--) {
      for (let x = 0; x < this._pixels[y].length; x++) {
        if (this._pixels[y][x] === STONE) {
          return y + this._floor;
        }
      }
    }
    return -1;
  }

  addMovingRock(rock: Rock): Rock {
    // > Each rock appears so that its left edge is two units away from the left
    // > wall and its bottom edge is three units above the highest rock in the
    // > room (or the floor, if there isn't one).

    const y = this.highestRockY + rock.height + 3;

    while (y >= this.height) {
      this.grow();
    }

    rock = rock.position(2, y);

    this._movingRocks.push(rock);

    return rock;
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
    const rowsToScan = new Set<number>();

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
        rowsToScan.add(boardY);
      },
    );

    this._lastPlacedRock = rock;
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
    const hbar = Array(longestY + 1 + this.width + 1).fill("-").join(
      "",
    );

    return [
      hbar,
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
      hbar,
      [
        "".padStart(longestY, " "),
        " ",
        ...Array(this.width).fill(null).map((_, index) =>
          (index % 10).toString()
        ),
        "|",
      ].join(""),
      hbar,
    ].join("\n");
  }
}
