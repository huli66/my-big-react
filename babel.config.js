// jest 会直接读取项目下面的 babel.config.js 配置
module.exports = {
	presets: ['@babel/preset-env'],
	plugins: [['@babel/plugin-transform-react-jsx', { throwIfNamespace: false }]]
};
