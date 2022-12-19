import { Rock } from "./rock.ts";

const EMPTY = 0;
const STONE = 1;

export class Board {
  _width = 0;
  _height = 0;
  _pixels: Uint8Array[] = [];
  _movingRocks: Rock[] = [];

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
          return y;
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

      const boardPixel = this._pixels[boardY][boardX];
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
    this._height *= 2;
    this._pixels = Array(this._height).fill(null).map((_, y) => {
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
    const yInBoard = rock.y - rock.height + 1;

    for (let rockY = 0; rockY < rock.height; rockY++) {
      for (let rockX = 0; rockX < rock.width; rockX++) {
        const tweakedY = (rock.height - rockY) - 1;
        const result = callback(
          rockX,
          rockY,
          xInBoard + rockX,
          yInBoard + tweakedY,
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
        this._pixels[boardY][boardX] = STONE;
      },
    );
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

    const longestY = String(this._pixels.length - 1).length;
    const hbar = Array(longestY + 1 + this.width + 1).fill("-").join(
      "",
    );

    return [
      hbar,
      ...grid.map((row, y) => {
        return [
          (grid.length - y - 1).toString().padStart(longestY, " "),
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
