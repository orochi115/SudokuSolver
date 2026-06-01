import { makeTurbotStrategy, sameBox } from './utils.js';

export const twoStringKite = makeTurbotStrategy('two-string-kite', { zh: '双线风筝', en: '2-String Kite' }, 51, (left, right, connectedA, connectedB) => {
  const rowColumn = (left.houseType === 'row' && right.houseType === 'column') || (left.houseType === 'column' && right.houseType === 'row');
  return rowColumn && sameBox(connectedA, connectedB);
});
