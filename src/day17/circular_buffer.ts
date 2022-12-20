export class CircularBuffer<T> {
  _items: T[];
  _index = -1;

  constructor(items: T[]) {
    this._items = [...items];
  }

  get index(): number {
    return this._index;
  }

  set index(newIndex: number) {
    if (newIndex < 0 || newIndex >= this._items.length) {
      throw new Error(`Invalid index: ${newIndex}`);
    }
    this._index = newIndex;
  }

  get value(): T {
    return this._items[this._index];
  }

  next(): T {
    this._index++;
    if (this._index >= this._items.length) {
      this._index = 0;
    }
    return this.value;
  }
}
