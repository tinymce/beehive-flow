/** Getting the time is a side-effect, but a clock is pure. */
export interface Clock {
  readonly getTimeMillis: () => number;
}

export const realClock = () => ({
  getTimeMillis: () => Date.now()
});

/** useful for testing */
export const stoppedClock = (time: number) => ({
  getTimeMillis: () => time
});
