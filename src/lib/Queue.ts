export class Queue<T> {
  current?: T;
  items: T[] = [];

  map = this.items.map;
  forEach = this.items.forEach;
  filter = this.items.filter;
  get length() { return this.items.length; }

  enqueue(item: T): void {
    this.items.push(item);
  }

  next(): T | undefined {
    this.current = this.items.shift();
    return this.current;
  }

  clear(): void {
    this.items = [];
  }
}

