export class Rock {
  private _x = 0;
  private _y = 0;
  private _width = 0;
  private _height = 0;
  private _pixels: Uint8Array[] = [];

  constructor(pixels: number[][] | Uint8Array[], x = 0, y = 0) {
    let width: number | undefined;
    this._pixels = pixels.map((row) => {
      if (width == null) {
        width = row.length;
      } else if (row.length !== width) {
        throw new Error("Invalid width");
      }
      return new Uint8Array(row);
    });

    if (!width) {
      throw new Error("No width");
    }

    this._height = pixels.length;
    this._width = width;
    this._x = x;
    this._y = y;
  }

  get height(): number {
    return this._height;
  }

  get width(): number {
    return this._width;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  pixel(x: number, y: number): number {
    return this._pixels[y][x];
  }

  position(
    x: number | ((width: number, height: number) => number) | undefined,
    y?: number | ((width: number, height: number) => number) | undefined,
  ): Rock {
    x = typeof x === "function" ? x(this.width, this.height) : x;
    y = typeof y === "function" ? y(this.width, this.height) : y;
    if (x === this.x && y === this.y) {
      return this;
    }
    return new Rock(this._pixels, x ?? this.x, y ?? this.y);
  }
}

export const ROCKS = [
  new Rock([
    [1, 1, 1, 1],
  ]),
  new Rock([
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ]),
  new Rock([
    [0, 0, 1],
    [0, 0, 1],
    [1, 1, 1],
  ]),
  new Rock([
    [1],
    [1],
    [1],
    [1],
  ]),
  new Rock([
    [1, 1],
    [1, 1],
  ]),
];
