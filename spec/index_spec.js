'use strict';
var path = require('path');
var fs = require('fs');
var postcss = require('postcss');
var postcssCached = require('../index');

function resolvePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

function readFile(relativePath) {
  return fs.readFileSync(resolvePath(relativePath), {encoding: 'utf8'});
}

describe('PostCSSCached', function() {
  beforeEach(function() {
    this.postcssCached = postcssCached();
    this.processCss = function(file, options) {
      options = options || {};
      options.from = resolvePath(file);
      return this.postcssCached
        .process(readFile(file), options)
        .toResult(options)
        .css;
    };
  });

  it('has the same interface as PostCSS', function() {
    expect(postcss.parse).toBe(postcssCached.parse);
    expect(postcss.comment).toBe(postcssCached.comment);
    expect(postcss.atRule).toBe(postcssCached.atRule);
    expect(postcss.decl).toBe(postcssCached.decl);
    expect(postcss.rule).toBe(postcssCached.rule);
    expect(postcss.root).toBe(postcssCached.root);

    var plugin = jasmine.createSpy('plugin');
    var instance = postcssCached(plugin);
    expect(instance.plugins).toEqual([plugin]);
  });

  it('inlines imports', function() {
    expect(this.processCss('fixtures/basic_import.css'))
      .toEqual(readFile('fixtures/basic_import.out.css'));
  });

  it('imports CSS files from an npm package', function() {
    var result = this.processCss('fixtures/npm_import.css');
    expect(result).toContain('h1 {\n  color: red;\n}');
    expect(result).toContain('Bootstrap v3.3.2');
  });

  it('imports the default CSS file from an npm package', function() {
    var result = this.processCss('fixtures/npm_default_import.css');
    expect(result).toContain('h1 {\n  color: red;\n}');
    expect(result).toContain('Bootstrap v3.3.2');
  });

  it('raises an error when importing a file that does not exist', function() {
    var self = this;
    expect(function() {
      self.processCss('fixtures/bad_import.css');
    }).toThrowError('Unable to resolve imaginary_file.css');
  });

  it('does not import the same file twice', function() {
    expect(this.processCss('fixtures/duplicate_import.css'))
      .toEqual(readFile('fixtures/duplicate_import.out.css'));
  });

  it('converts any media queries on the import', function() {
    expect(this.processCss('fixtures/media_queries.css'))
      .toEqual(readFile('fixtures/media_queries.out.css'));
  });

  it('caches the result of processing each file', function() {
    var dep1 = fs.readFileSync(resolvePath('fixtures/dep1.css'), {encoding: 'utf8'});
    var result = this.processCss('fixtures/basic_import.css');
    fs.writeSync(fs.openSync(resolvePath('fixtures/dep1.css'), 'w'), 'h1 {color: black}');
    var result2 = this.processCss('fixtures/basic_import.css');
    fs.writeSync(fs.openSync(resolvePath('fixtures/dep1.css'), 'w'), dep1);
    expect(result2).toEqual(result);
  });

  it('generates the correct source maps', function() {
    expect(this.processCss('fixtures/basic_import.css', {map: true}))
      .toEqual(readFile('fixtures/basic_with_source_map.css'));
  });
});
