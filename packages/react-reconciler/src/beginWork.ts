import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';

export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	// 比较，返回子 FiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip, renderLane);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLane);
		case Fragment:
			return updateFragment(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork未实现类型');
			}
			break;
	}
	return null;
};

// Fragment 的属性直接保存子节点，其实其他子属性保存也行，只要约定即可
function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
	const nextChildren = renderWithHooks(wip, renderLane);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

/** 对比子节点的 FiberNode 和 ReactElement 生成子节点的 FiberNode */
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	// 获取当前节点的 current FiberNode，子节点的 current FiberNode 就是 当前 FiberNode 的 child
	const current = wip.alternate;

	// 返回的 子节点的 FiberNode 挂载在 wip.child 上，双缓冲交换后就是下次的 curret.child
	if (current !== null) {
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount 阶段 current 没有数据
		wip.child = mountChildFibers(wip, null, children);
	}
}
