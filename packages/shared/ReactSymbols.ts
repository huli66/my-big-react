const supportSymbol = typeof Symbol === 'function' && Symbol.for;

// 防止滥用，将其设置为独一无二的值
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;
