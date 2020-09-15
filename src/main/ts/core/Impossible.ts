export const impossible = (v: never): never => {
  throw new Error('Should not happen');
}