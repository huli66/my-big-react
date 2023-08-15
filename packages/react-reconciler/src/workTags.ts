export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment;

/** 组件 */
export const FunctionComponent = 0;
/** 根节点 */
export const HostRoot = 3;
/** div 等元素 */
export const HostComponent = 5;
/** 文本节点，字符串或数字 */
export const HostText = 6;
export const Fragment = 7;
