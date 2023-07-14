import React from 'react';
import ReactDOM from 'react-dom/client';

// const jsx = (
// 	<div>
// 		<span>World</span>
// 	</div>
// );

// console.log(React);
// console.log(ReactDOM);
// console.log(jsx);

// const root = document.querySelector('#root');
// ReactDOM.createRoot(root).render(jsx);

function App() {
	return (
		<div>
			<Child />
		</div>
	);
}

function Child() {
	return <span>big-react</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
