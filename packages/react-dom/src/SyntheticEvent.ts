import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';

export const elementPropsKey = '__props';
const validEventTypeList = ['click'];

type EventCallback = (e: Event) => void;

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

// 创建 DOM 时 和 更新属性时调用，将事件回调保存在 DOM 中
export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('当前不支持', eventType, '事件');
	}
	if (__DEV__) {
		console.log('初始化事件', eventType);
	}
	// container 上面触发了某个原生事件后，开始触发合成事件
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

function createSyntheticEvent(e: Event) {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			// __stopPropagation 这里只是一个标记，用于React层面阻止冒泡
			// 原始的 stopPropagation 用于阻止浏览器的冒泡？
			originStopPropagation();
		}
	};
	return syntheticEvent;
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
	const targetElement = e.target;

	if (targetElement === null) {
		console.warn('事件不存在', e);
		return;
	}

	// 1.收集沿途的事件
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	// 2.构造合成事件
	const se = createSyntheticEvent(e);
	// 3.遍历capture
	triggerEventFlow(capture, se);

	if (!se.__stopPropagation) {
		// 4.遍历bubble TODO: 这里应该存在问题，按照这样不冒泡也不执行本身的冒泡事件，而且下面的函数以及有阻止冒泡的判断了
		triggerEventFlow(bubble, se);
	}
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);

		if (se.__stopPropagation) {
			break;
		}
	}
}

function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

// 收集路径上要执行的 冒泡和捕获事件数组
function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		// 收集
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			// click -> onClick onClickCapture
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList?.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						if (i === 0) {
							// capture
							paths.capture.unshift(eventCallback);
						} else {
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}
	return paths;
}
