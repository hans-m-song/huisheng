export class Queue<T> {
  current?: T;
  items: T[] = [];

  map = this.items.map.bind(this.items);
  forEach = this.items.forEach.bind(this.items);
  filter = this.items.filter.bind(this.items);
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
