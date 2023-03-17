export class Queue<T> {
  current?: T;
  items: T[] = [];

  get length() {
    return this.items.length;
  }

  enqueue(item: T): void {
    this.items.push(item);
  }

  next(): T | undefined {
    this.current = this.items.shift();
    return this.current;
  }

  remove(index: number) {
    this.items = this.items.filter((_, i) => i !== index);
  }

  clear(): void {
    this.items = [];
  }
}
