import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import { jsxDEV, jsx, isValidElement as isValidElementFn } from './src/jsx';
// React

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRE = {
	currentDispatcher
};

export const version = '0.0.0';

// TODO: 根据环境判断使用 jsx-生产 或者 jsxDEV-开发
export const createElement = jsx;
// export const createElement = jsxDEV;

export const isValidElement = isValidElementFn;
