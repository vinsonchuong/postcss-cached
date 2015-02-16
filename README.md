# postcss-cached
[![Build Status](https://travis-ci.org/vinsonchuong/postcss-cached.svg?branch=master)](https://travis-ci.org/vinsonchuong/postcss-cached)

A wrapper around PostCSS that processes, caches, and inlines `@import` rules
for incremental building

`postcss-cached` takes a CSS file and computes a tree of `@import`'ed
dependencies. It processes that tree from bottom to top, caching each
individual result. When a file changes, only files that depend on it need to
be rebuilt.

## Installing
`postcss-cached` is available as an
[npm package](https://www.npmjs.com/package/postcss-cached).

## Usage
`postcss-cached` follows the same interface as
[postcss](https://github.com/postcss/postcss). In addition, `#process()` now
takes and returns the following:

```js
var postcssCached = require('postcss-cached');
var postcssCachedInstance = postcssCached();

var options = {};
options.cache = {};

var result = postcssCachedInstance.process('css string', options);

console.log(result.imports);
```

### Options
* `cache`: If given an object, enables caching and stores processed files in the
  given object using absolute paths as keys.

### Returns
* `imports`: A tree of absolute file path to files imported by that file
