import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import {
	Lane,
	NoLane,
	SyncLane,
	getHighestPriorityLane,
	mergeLanes
} from './fiberLanes';
import { flushSyncCallbacks, secheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';

let workInprogress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	workInprogress = createWorkInProgress(root.current, {});
	wipRootRenderLane = lane;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// TODO: 调度功能
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdated(root, lane);
	// renderRoot(root);
	ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);

	if (updateLane === NoLane) {
		return;
	}
	if (updateLane === SyncLane) {
		// 同步优先级，用微任务调度
		if (__DEV__) {
			console.log('在微任务中调度优先级：', updateLane);
		}
		// 构造一个数组
		secheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级，用宏任务调度
	}
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

/** 找到挂载节点的 FiberNode，即 hostRootFiber 其stateNode 指向 fiberRootNode */
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	if (node.tag === HostRoot) {
		return node.stateNode;
	}

	return null;
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);

	if (nextLane !== SyncLane) {
		// 其他比 SyncLane 低低优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}
	// 初始化
	prepareFreshStack(root, lane);

	// 维持出现改动就diff
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('开发环境, workLoop 发生错误', e);
			}
			console.warn('workLoop 发生错误', e);
			workInprogress = null;
		}
	} while (true);

	// TODO: 这里应该有问题，对比之后提交，应该是放在 workLoop 中
	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.fineshedLane = lane;
	wipRootRenderLane = NoLane;

	// wip fiberNode树 树中的flags
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit 阶段开始', finishedWork);
	}

	const lane = root.fineshedLane;

	if (lane === NoLane && __DEV__) {
		console.error('commit 阶段 d finishedLane 不应该是 NoLane');
	}

	// 重置
	root.finishedWork = null;
	root.fineshedLane = NoLane;

	// 判断是否存在3个子阶段需要执行的操作
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation
		commitMutationEffects(finishedWork);

		// 切换fiber树
		root.current = finishedWork;

		// layout
	} else {
		//
		root.current = finishedWork;
	}
}

function workLoop() {
	console.log('workLoop start');
	while (workInprogress !== null) {
		performUnitOfWork(workInprogress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber, wipRootRenderLane);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInprogress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	// 用循环是为了返回到父节点后
	do {
		completeWork(node);
		// 执行完当前 FiberNode 的 completeWork 后
		// 如果有兄弟节点则进入兄弟节点，退出 completeUnitWork，进入兄弟节点的 beginWork
		// 没有则返回父节点，执行父节点的 completeWork
		// 循环到最后则是根节点的 fiber.return 为 null 被赋值给 wip，此时 跳出循环，workLoop
		const sibling = node.sibling;

		if (sibling !== null) {
			workInprogress = sibling;
			return;
		}
		node = node.return;
		workInprogress = node;
	} while (node !== null);
}
