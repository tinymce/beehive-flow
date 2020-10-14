export const impossible = (_v: never): never => {
  throw new Error('Should not happen');
};