import { makeTurbotStrategy } from './utils.js';

export const emptyRectangle = makeTurbotStrategy('empty-rectangle', { zh: '空矩形', en: 'Empty Rectangle' }, 52, (left, right) => {
  const boxLine = (left.houseType === 'box' && right.houseType !== 'box') || (right.houseType === 'box' && left.houseType !== 'box');
  return boxLine;
});
