'use strict';
var path = require('path');
var fs = require('fs');
var postcss = require('postcss');
var resolve = require('resolve');

module.exports = function() {
  var self = Object.create(postcss.apply(null, arguments));

  function processImports(processedCss, options) {
    var currentDir = path.dirname(processedCss.source.input.file);

    processedCss.eachAtRule('import', function(rule) {
      var parsedParams = rule.params.match(/(['"])(.*?)\1(?:.*?\s+(.*))?/);
      var file = parsedParams[2];
      var mediaQueries = parsedParams[3];
      var absolutePath = path.resolve(currentDir, file);

      if (options.alreadyImported[absolutePath]) {
        rule.removeSelf();
      } else {
        options.alreadyImported[absolutePath] = true;

        var processedRule = options.cache && options.cache[absolutePath];
        if (!processedRule) {
          var css;
          try {
            css = fs.readFileSync(absolutePath, {encoding: 'utf8'})
          } catch(e) {
            try {
              absolutePath = resolve.sync(file, {
                extensions: ['.css'],
                packageFilter: function(pkg) {
                  return {main: pkg.style};
                }
              });
              css = fs.readFileSync(absolutePath, {encoding: 'utf8'})
            } catch(e) {
              throw new Error('Unable to resolve ' + file);
            }
          }
          var importOptions = Object(options)
          importOptions.from = absolutePath;
          processedRule = processCss(css, importOptions);

          if (mediaQueries) {
            processedRule = postcss
              .atRule({name: 'media', params: mediaQueries})
              .append(processedRule);
          }

          if (options.cache) {
            options.cache[absolutePath] = processedRule;
          }
        }

        rule.replaceWith(processedRule);
      }
    });

    return processedCss;
  };

  function processCss(css, options) {
    options = Object(options);
    return self.plugins.concat(processImports)
      .reduce(function(memo, plugin) {
        return plugin(memo, options);
      }, postcss.parse(css, options));
  }

  self.process = function(css, options) {
    options.alreadyImported = {};
    return processCss(css, options)
      .toResult(options);
  }

  return self;
};

Object.keys(postcss).forEach(function(staticMember) {
  module.exports[staticMember] = postcss[staticMember];
});
