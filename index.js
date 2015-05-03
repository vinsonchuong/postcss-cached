'use strict';
require('babel').transform('code', {
  stage: 1,
  optional: ['runtime']
});
module.exports = require('./lib/postcss-cached');
