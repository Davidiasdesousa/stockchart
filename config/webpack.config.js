const webpack = require("webpack");
const path = require("path");
const { getIfUtils, removeEmpty } = require("webpack-config-utils");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");

const rootPath = path.join(__dirname, "..");

function buildConfig(mode) {
	const { ifWatch, ifDocs } = getIfUtils(mode, ["docs", "watch"]);

	const entry = "./src/index.js"; // ou o arquivo principal do seu app

	const devServer = {
		static: {
			directory: [
				path.join(rootPath, "docs"),
				path.join(rootPath, "build"),
				path.join(rootPath, "node_modules"),
			]
		},
		host: process.env.IP,
		port: parseInt(process.env.PORT),
		hot: true,
	};

	const context = rootPath;

	console.log("MODE", mode);
	return {
		context,
		entry,
		mode: ifDocs("production", "development"),
		output: {
			path: path.join(rootPath, "build/"),
			filename: `dist/[name]${ifDocs(".[chunkhash]", "")}.js`,
			publicPath: "/",
			library: {
				name: "ReStock",
				type: "umd",
			},
			pathinfo: ifWatch(true, false),
		},
		devtool: ifWatch("eval-cheap-module-source-map", "source-map"),
		module: {
			rules: removeEmpty([
				{
					test: /\.(js|jsx)$/,
					use: ["babel-loader"],
					exclude: /node_modules/
				},
				{
					test: /\.jpg$/,
					type: "asset/resource"
				},
				{
					test: /\.(png|svg)$/,
					type: "asset",
					parser: {
						dataUrlCondition: {
							maxSize: 8 * 1024 // 8kb
						}
					}
				},
				{
					test: /\.md$/,
					use: [
						"html-loader",
						{
							loader: "remarkable-loader",
							options: getRemarkable()
						}
					]
				},
				{
					test: /\.scss$/,
					use: [
						"style-loader",
						"css-loader",
						"postcss-loader",
						{
							loader: "sass-loader",
							options: {
								implementation: require("sass"),
								sassOptions: {
									outputStyle: "expanded"
								}
							}
						}
					]
				}
			])
		},
		performance: {
			hints: false,
		},
		plugins: removeEmpty([
			new ProgressBarPlugin(),
			new webpack.NoEmitOnErrorsPlugin(),
			// Remova os HtmlWebpackPlugin relacionados à documentação
		]),
		devServer,
		externals: {
			"react": "React",
			"react-dom": "ReactDOM",
		},
		resolve: {
			extensions: [".js", ".jsx", ".scss", ".md"],
			alias: {
				"react-stockcharts": path.join(rootPath, "src"),
			},
			modules: ["docs", "node_modules"]
		},
		optimization: {
			minimize: ifDocs(true, false),
		}
	};
}

function getRemarkable() {
	const Prism = require("prismjs");
	require("prismjs/components/prism-jsx");
	require("prismjs/plugins/line-numbers/prism-line-numbers");

	return {
		preset: "full",
		html: true,
		linkify: true,
		typographer: true,
		highlight: function(str, lang) {
			const grammer = lang === undefined || Prism.languages[lang] === undefined ? Prism.languages.markup : Prism.languages[lang];
			return Prism.highlight(str, grammer, lang);
		}
	};
}

module.exports = buildConfig;
