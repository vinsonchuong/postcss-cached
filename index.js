'use strict';
var path = require('path');
var fs = require('fs');
var postcss = require('postcss');
var Root = require('postcss/lib/root');
var resolve = require('resolve');

module.exports = function() {
  var self = Object.create(postcss.apply(null, arguments));

  function processImports(processedCss, options) {
    var parentDir = path.dirname(processedCss.source.input.file);
    processedCss.imports = {};

    processedCss.eachAtRule('import', function(rule) {
      var parsedParams = rule.params.match(/(['"])(.*?)\1(?:.*?\s+(.*))?/);
      var file = parsedParams[2];
      var mediaQueries = parsedParams[3];
      var absolutePath = path.resolve(parentDir, file);

      if (options.alreadyImported[absolutePath]) {
        rule.removeSelf();
        processedCss.imports[absolutePath] = true;
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
          var importOptions = Object.create(options)
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

        processedCss.imports[absolutePath] = processedRule.imports;

        rule.replaceWith(processedRule);
      }
    });

    return processedCss;
  };

  function processCss(css, options) {
    return self.plugins.concat(processImports)
      .reduce(function(memo, plugin) {
        var result =  plugin(memo, options);
        return result instanceof Root ? result : memo;
      }, postcss.parse(css, options));
  }

  self.process = function(css, options) {
    options = Object.create(Object(options));
    options.alreadyImported = {};

    var processedCss = processCss(css, options);
    var result = processedCss.toResult(options);
    result.imports = processedCss.imports;
    return result;
  }

  return self;
};

Object.keys(postcss).forEach(function(staticMember) {
  module.exports[staticMember] = postcss[staticMember];
});
