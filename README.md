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
`postcss-cached` adds to the interface of
[postcss](https://github.com/postcss/postcss) as follows: 

```js
var postcssCached = require('postcss-cached');
var postcssCachedInstance = postcssCached();

var result = postcssCachedInstance.process('css string', options);
console.log(result.imports);
```

`postcssCached.process(cssString, options)` returns an object with an `imports`
property, a tree of absolute file paths to subtrees of imports by those files.

`postcssCachedInstance.cache` is a map of absolute file path to processed
result. If a path exists in the cache, its processed result will be used;
the file will not be reprocessed.

`postcssCached.delete(filePath)` removes the `filePath` from the cache.

`postcssCached.change(filePath)` recursively removes `filePath` and files that
import it from the cache. So that calling `postcssCached.process` again picks
up the changes.
