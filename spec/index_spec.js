import path from 'path';
import cssnext from 'cssnext';
import postcss from 'postcss';
import {fs, resolve} from '../lib/async';
import catchError from './helpers/catch_error';
import fixture from './helpers/fixture';
import postcssCached from '../';

async function process(plugins, file, options = {}) {
  const {contents, path: from} = await fixture(file);
  return await postcssCached(plugins)
    .process(contents, Object.assign(options, {from}))
    .async();
}

describe('PostCSSCached', function() {
  it('has the same interface as PostCSS', function() {
    expect(postcssCached.parse).toBe(postcss.parse);
    expect(postcssCached.comment).toBe(postcss.comment);
    expect(postcssCached.atRule).toBe(postcss.atRule);
    expect(postcssCached.decl).toBe(postcss.decl);
    expect(postcssCached.rule).toBe(postcss.rule);
    expect(postcssCached.root).toBe(postcss.root);

    const plugin = jasmine.createSpy('plugin');
    const instance = postcssCached(plugin);
    expect(instance.plugins).toEqual([plugin]);
  });

  it('inlines imports', async function() {
    const {css: actualCss} = await process([], 'basic_import.css');
    const {contents: expectedCss} = await fixture('basic_import.out.css');
    expect(actualCss).toEqual(expectedCss);
  });

  it('imports CSS files from an npm package', async function() {
    const {css: result} = await process([], 'npm_import.css');
    expect(result).toContain('h1 {\n  color: red;\n}');
    expect(result).toContain('Bootstrap v3.3.2');
  });

  it('imports the default CSS file from an npm package', async function() {
    const {css: result} = await process([], 'npm_default_import.css');
    expect(result).toContain('h1 {\n  color: red;\n}');
    expect(result).toContain('Bootstrap v3.3.2');
  });

  it('raises an error when importing a file that does not exist', async function() {
    expect(await catchError(process([], 'bad_import.css')))
      .toBe('Unable to resolve imaginary_file.css');
  });

  it('does not import the same file twice', async function() {
    const {css: actualCss} = await process([], 'duplicate_import.css');
    const {contents: expectedCss} = await fixture('duplicate_import.out.css');
    expect(actualCss).toEqual(expectedCss);
  });

  it('converts any media queries on the import', async function() {
    const {css: actualCss} = await process([], 'media_queries.css');
    const {contents: expectedCss} = await fixture('media_queries.out.css');
    expect(actualCss).toEqual(expectedCss);
  });

  it('generates the correct source maps', async function() {
    const {css: actualCss} = await process([], 'basic_import.css', {map: true});
    const {contents: expectedCss} = await fixture('basic_with_source_map.css');
    expect(actualCss).toEqual(expectedCss);
  });

  it('supports the cssnext plugin', async function() {
    const {css: actualCss} = await process([cssnext()], 'cssnext.css');
    const {contents: cssnextFixture} = await fixture('cssnext.css');
    const {css: expectedCss} = await postcss().use(cssnext())
      .process(cssnextFixture).async();
    expect(actualCss).toEqual(expectedCss);
  });

  it('caches the result of processing each file', async function() {
    const basicImport = await fixture('basic_import.css');
    const {contents: dep1, path: dep1Path} = await fixture('dep1.css');
    const postcssCachedInstance = postcssCached();
    const {css} = await postcssCachedInstance
      .process(basicImport.contents, {from: basicImport.path})
      .async();
    await fs.write(await fs.open(dep1Path, 'w'), 'h1 {color: black}');
    const {css: css2} = await postcssCachedInstance
      .process(basicImport.contents, {from: basicImport.path})
      .async();
    await fs.write(await fs.open(dep1Path, 'w'), dep1);
    expect(css2).toEqual(css);
  });

  xit('can remove files from the cache', function() {
    this.processCss('fixtures/basic_import.css').css;
    expect(this.postcssCached.cache[resolvePath('fixtures/dep1.css')])
      .toBeTruthy();
    this.postcssCached.delete(resolvePath('fixtures/dep1.css'))
    expect(this.postcssCached.cache[resolvePath('fixtures/dep1.css')])
      .toBeFalsy();
  });

  xit('can remove changed files and their importers from the cache', function() {
    this.processCss('fixtures/basic_import.css');

    this.postcssCached.change(resolvePath('fixtures/dep1.css'));
    expect(Object.keys(this.postcssCached.cache).sort()).toEqual([
      resolvePath('fixtures/dep2.css'),
      resolvePath('fixtures/folder/dep3.css')
    ]);

    this.processCss('fixtures/basic_import.css');

    this.postcssCached.change(resolvePath('fixtures/folder/dep3.css'));
    expect(Object.keys(this.postcssCached.cache)).toEqual([
      resolvePath('fixtures/dep1.css')
    ]);

    this.processCss('fixtures/basic_import.css');
    expect(Object.keys(this.postcssCached.cache).sort()).toEqual([
      resolvePath('fixtures/dep1.css'),
      resolvePath('fixtures/dep2.css'),
      resolvePath('fixtures/folder/dep3.css')
    ]);
  });

  xit('can property expire changed files with duplicate imports', function() {
    this.processCss('fixtures/duplicate_import.css');

    this.postcssCached.change(resolvePath('fixtures/dep2.css'));
    expect(Object.keys(this.postcssCached.cache)).toEqual([
      resolvePath('fixtures/folder/dep3.css')
    ]);

    this.processCss('fixtures/duplicate_import.css');

    this.postcssCached.change(resolvePath('fixtures/folder/dep3.css'));
    expect(Object.keys(this.postcssCached.cache)).toEqual([]);
  });
});
