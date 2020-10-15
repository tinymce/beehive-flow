/** Getting the time is a side-effect, but a clock is pure. */
export interface Clock {
  readonly getTimeMillis: () => number;
}

export const realClock = (): Clock => ({
  getTimeMillis: () => Date.now()
});

/** useful for testing */
export const stoppedClock = (time: number): Clock => ({
  getTimeMillis: () => time
});
