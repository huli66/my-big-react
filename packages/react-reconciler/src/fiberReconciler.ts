import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { ReactElementType } from 'shared/ReactTypes';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue';
import { HostRoot } from './workTags';
import { scheduleUpdateOnFiber } from './wokrLoop';

export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);

	console.log('createContainer');
	hostRootFiber.updateQueue = createUpdateQueue();

	return root;
}

export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;

	console.log('updateContainer');
	const update = createUpdate<ReactElementType | null>(element);
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);
	scheduleUpdateOnFiber(hostRootFiber);
	return element;
}
