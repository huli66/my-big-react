import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

// console.log(import.meta.hot);
console.log(import.meta);

function App() {
	const [num, setNum] = useState(100);

	// 测试事件系统
	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
	// return <ul >{arr}</ul>;

	// 测试 fragment
	return (
		<ul
			onClickCapture={() => {
				setNum((num) => num + 1);
				setNum((num) => num + 1);
				setNum((num) => num + 2);
			}}
		>
			{num}
		</ul>
	);
}

function Child() {
	return <span>big-react</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
