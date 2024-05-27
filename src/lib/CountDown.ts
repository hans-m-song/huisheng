export class CountDown {
  duration: number;
  remainder: number;
  private ticker?: NodeJS.Timeout;

  constructor(seconds: number) {
    this.duration = seconds;
    this.remainder = seconds;
  }

  get ticking() {
    return typeof this.ticker !== 'undefined' && this.remainder < this.duration;
  }

  get runtime() {
    return this.duration - this.remainder;
  }

  reset() {
    this.remainder = this.duration;
  }

  start() {
    if (this.ticker) {
      return;
    }

    this.ticker = setInterval(() => {
      if (this.remainder < 1) {
        clearInterval(this.ticker);
        return;
      }

      this.remainder -= 1;
    }, 1000);
  }

  stop() {
    clearInterval(this.ticker);
    this.ticker = undefined;
  }
}
