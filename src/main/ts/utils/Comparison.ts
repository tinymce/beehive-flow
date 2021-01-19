export const enum Comparison {
  LT = -1,
  EQ = 0,
  GT = 1
}

export const toNumber = (c: Comparison): number => {
  switch (c) {
    case Comparison.LT:
      return -1;
    case Comparison.EQ:
      return 0;
    case Comparison.GT:
      return 1;
  }
};

export const fromNumber = (n: number): Comparison => {
  if (n < 0) {
    return Comparison.LT;
  } else if (n === 0) {
    return Comparison.EQ;
  } else {
    return Comparison.GT;
  }
};

export const compareNative = <A> (a: A, b: A): Comparison => {
  if (a < b) {
    return Comparison.LT;
  } else if (a === b) {
    return Comparison.EQ;
  } else {
    return Comparison.GT;
  }
};

export const drill = (a: Comparison, b: () => Comparison): Comparison =>
  a === Comparison.EQ ? b() : a;

export const isGte = (c: Comparison): boolean =>
  c !== Comparison.LT;

export const isLte = (c: Comparison): boolean =>
  c !== Comparison.GT;

export const isNotEqual = (c: Comparison): boolean =>
  c !== Comparison.EQ;
