import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	Deletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			// 继续向子节点遍历
			nextEffect = child;
		} else {
			// 向上遍历
			up: while (nextEffect !== null) {
				// 向下找到第一个subtreeFlags 上没有符合mutationMask的层级，此时这个节点的flags中可能有符合的flag，需要更新，其兄弟节点也有可能有
				commitMutationEffectsOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;

				if (sibling !== null) {
					// 跳到兄弟节点，兄弟节点继续深度优先遍历
					nextEffect = sibling;
					break up;
				}
				// 或者向上，直到有兄弟节点的层级，可以继续深度优先遍历
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		// 移除对应flag
		finishedWork.flags &= ~Placement;
	}
	// 其他操作
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		// 移除对应flag
		finishedWork.flags &= ~Update;
	}
	if ((flags & Deletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}
		// 移除对应flag
		finishedWork.flags &= ~Deletion;
	}
};

function commitDeletion(childToDelete: FiberNode) {
	// 对不同子树处理，找到最近的 根
	let rootHostNode: FiberNode | null = null;

	// 递归子树
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				// TODO: 解绑 ref
				return;

			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;

			case FunctionComponent:
				// TODO: useEffect
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', rootHostNode);
				}
				return;
		}
	});
	// 移除rootHostNode的DOM
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);

		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === root) {
			// 终止条件
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上归
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}
	// 找到父级节点
	const hostParent = getHostParent(finishedWork);

	// host sibling
	const sibling = getHostSibling(finishedWork);

	// 插入到父级节点
	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		// 向上遍历
		while (node.tag !== HostText && node.tag !== HostComponent) {
			while (node.sibling === null) {
				const parent = node.return;

				if (
					parent === null ||
					parent.tag === HostComponent ||
					parent.tag === HostRoot
				) {
					return;
				}
				node = parent;
			}
			node.sibling.return = node.return;
			node = node.sibling;
			// 向下遍历
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		// 找到真正的宿主环境元素或者根节点，而不是层层嵌套的React元素
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到 host parent');
	}
	return null;
}

/**
 * 将节点及其兄弟节点全部插入到父级节点下
 * @param finishedWork 当前节点
 * @param hostParent 父级节点，比如 div
 * @returns
 */
function insertOrAppendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	// 找到第一层 HostComponent(宿主环境的组件，比如 div，而不是React组件APP) 或者 HostText(字符串或者数字)
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}
	const child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			// 是否有可能把下一个循环的dom也插入进去了
			// 不会，因为到这一步至少已经往下一个层级了，上一个层级如果是宿主环境dom，那早就插进去了
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
