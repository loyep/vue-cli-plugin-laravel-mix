const modifyConfig = (config, fn) => {
  if (Array.isArray(config)) {
    config.forEach(c => fn(c))
  } else {
    fn(config)
  }
}

module.exports = (api, options) => {
  const defaultOptions = {
    resourcePath: api.resolve('./resources/assets'),
    entry: api.resolve('resources/assets/app.js')
  }

  const pluginOptions = Object.assign({}, defaultOptions, (options.pluginOptions ? options.pluginOptions.laravel || {} : {}));
  const { build } = api.service.commands

  api.registerCommand('watch', {
      description: 'watch for production',
      usage: 'vue-cli-service watch',
      options: {}
  }, async (args) => {
      args.watch = true
      process.env.VUE_APP_WATCH_MODE = 'true';
      await build.fn(args).then(() => {
        // delete process.env.VUE_APP_WATCH_MODE
      });
  })

  api.registerCommand('analyzer', {
    description: 'analyzer for production',
    usage: 'vue-cli-service analyzer',
    options: {}
  }, async (args) => {
    process.env.VUE_APP_ANALYZER_MODE = 'true';
    await build.fn(args).then(() => {

    })
  })

  api.chainWebpack(webpackConfig => {
    const target = process.env.VUE_CLI_BUILD_TARGET
    if (target && target !== 'app') {
        return
    }

    webpackConfig
      .entry('app')
        .delete('./src/main.js')
        .add(pluginOptions.entry)
        .end()
      .resolve
        .alias
        .set('@', pluginOptions.resourcePath)
        .end()
    
    if (process.env.VUE_APP_WATCH_MODE) {
      webpackConfig.optimization.minimize(false) 
    }

    if (process.env.VUE_APP_ANALYZER_MODE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      webpackConfig
        .plugin('webpack-bundle-analyzer')
        .use(BundleAnalyzerPlugin)
    }

    if (process.env.NODE_ENV === 'production') {
      const manifestPath = api.resolve('public/static/mix-manifest.json')
      webpackConfig
        .plugin('laravel')
          .use(require('webpack-manifest-plugin'), [{
            fileName: manifestPath,
            publicPath: '/',
            basePath: '/',
            filter: desc => (desc.path.endsWith('.js') || desc.path.endsWith('.css')) && !desc.path.includes('precache-manifest')
          }])
    }

  })

  api.configureDevServer(app => {

  })
}

module.exports.defaultModes = {
  watch: 'production',
  analyzer: 'production'
}
