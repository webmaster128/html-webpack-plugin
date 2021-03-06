/* This loader renders the template with underscore if no other loader was found */
'use strict';

const _ = require('lodash');
const loaderUtils = require('loader-utils');

module.exports = function (source) {
  if (this.cacheable) {
    this.cacheable();
  }
  const allLoadersButThisOne = this.loaders.filter(function (loader) {
    // Loader API changed from `loader.module` to `loader.normal` in Webpack 2.
    return (loader.module || loader.normal) !== module.exports;
  });
  // This loader shouldn't kick in if there is any other loader
  if (allLoadersButThisOne.length > 0) {
    return source;
  }
  // Skip .js files
  if (/\.js$/.test(this.resourcePath)) {
    return source;
  }

  // The following part renders the tempalte with lodash as aminimalistic loader
  //
  // Get templating options
  const options = this.query !== '' ? loaderUtils.parseQuery(this.query) : {};
  // Webpack 2 does not allow with() statements, which lodash templates use to unwrap
  // the parameters passed to the compiled template inside the scope. We therefore
  // need to unwrap them ourselves here. This is essentially what lodash does internally
  // To tell lodash it should not use with we set a variable
  const template = _.template(source, _.defaults(options, { variable: 'data' }));
  // All templateVariables which should be available
  // @see HtmlWebpackPlugin.prototype.executeTemplate
  const templateVariables = [
    'compilation',
    'webpack',
    'webpackConfig',
    'htmlWebpackPlugin'
  ];
  // Require !!lodash - using !! will disable all loaders (e.g. babel)
  return 'var _ = require(' + loaderUtils.stringifyRequest(this, '!!' + require.resolve('lodash')) + ');' +
    'module.exports = function (templateParams) {' +
      // Declare the template variables in the outer scope of the
      // lodash template to unwrap them
      templateVariables.map(function (variableName) {
        return 'var ' + variableName + ' = templateParams.' + variableName;
      }).join(';') + ';' +
      // Execute the lodash template
      'return (' + template.source + ')();' +
    '}';
};
