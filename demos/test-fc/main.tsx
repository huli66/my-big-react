import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

console.log(import.meta.hot);
console.log(import.meta);

function App() {
	const [num, setNum] = useState(100);
	// window.setNum = setNum;
	// return num === 3 ? <Child /> : <div>{num}</div>;
	return <div onClickCapture={() => setNum(num + 1)}>{num}</div>;
}

function Child() {
	return <span>big-react</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
