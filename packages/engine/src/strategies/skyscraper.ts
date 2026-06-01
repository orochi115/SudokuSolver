import { makeTurbotStrategy, sameColumn, sameRow } from './utils.js';

export const skyscraper = makeTurbotStrategy('skyscraper', { zh: '摩天楼', en: 'Skyscraper' }, 50, (left, right, connectedA, connectedB) => {
  return (left.houseType === 'row' && right.houseType === 'row' && sameColumn(connectedA, connectedB)) || (left.houseType === 'column' && right.houseType === 'column' && sameRow(connectedA, connectedB));
});
