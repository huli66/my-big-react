import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	WorkTag
} from './workTags';
import { Flag, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';

export class FiberNode {
	type: any;
	tag: WorkTag;
	key: Key;
	stateNode: any;
	ref: Ref;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null; // TODO: 没有考虑数组？
	index: number;

	pendingProps: Props;
	memoizedProps: Props | null;
	memoizedState: any;

	alternate: FiberNode | null;
	flags: Flag;
	subtreeFlags: Flag;

	updateQueue: unknown;
	deletions: FiberNode[] | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例属性
		this.tag = tag;
		this.key = key || null;
		/** HostComponent <div></div> div DOM */
		this.stateNode = null;
		/** FiberNode 类型 FunctionComponent () => {} */
		this.type = null;

		// 构成树状结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		// 作为工作单元
		/** 刚开始准备工作时的属性 */
		this.pendingProps = pendingProps;
		/** 工作完之后的 props */
		this.memoizedProps = null;
		/** 存放链表 */
		this.memoizedState = null;
		this.updateQueue = null;

		this.deletions = null;

		/** 指向另一棵树对应的 FiberNode，current / wip 但是如果没有呢？ */
		this.alternate = null;
		// 副作用，宿主环境要执行的 API
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
	}
}

/** 根节点 */
export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;
	pendingLanes: Lanes;
	fineshedLane: Lane;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;

		this.pendingLanes = NoLanes;
		this.fineshedLane = NoLane;
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update，传入这次的props，清除掉上次的更新标志
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
	}
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};

export function createFiberFromElement(element: ReactElementType) {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	// div 的 type 为 'div'
	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未定义的type类型', element);
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key): FiberNode {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
}
