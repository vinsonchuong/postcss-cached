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
var result = postcssCached().process('css file contents', {from: 'path to css file'});
```
