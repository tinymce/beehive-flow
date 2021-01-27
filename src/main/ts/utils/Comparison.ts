export const enum Comparison {
  LT = -1,
  EQ = 0,
  GT = 1
}

export const compareNative = <A> (a: A, b: A): Comparison => {
  if (a < b) {
    return Comparison.LT;
  } else if (a === b) {
    return Comparison.EQ;
  } else {
    return Comparison.GT;
  }
};

export const chain = (c1: Comparison, c2: Comparison): Comparison =>
  c1 !== Comparison.EQ ? c1 : c2;

export const chainN = (...cs: Comparison[]): Comparison =>
  cs.reduce(chain, Comparison.EQ);

export const isGte = (c: Comparison): boolean =>
  c !== Comparison.LT;

export const isLte = (c: Comparison): boolean =>
  c !== Comparison.GT;

export const isNotEqual = (c: Comparison): boolean =>
  c !== Comparison.EQ;
