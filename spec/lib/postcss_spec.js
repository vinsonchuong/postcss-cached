import originalPostcss from 'postcss';
import cssnext from 'cssnext';
import {Promise as TestPromise} from 'jasmine-es6';
import PostCss from '../../lib/postcss';

function pluginSpy(name) {
  const promise = new TestPromise();
  const plugin = jasmine.createSpy(name).and.returnValue(promise);
  return {plugin, promise};
}

describe('postcss', function() {
  it('has the same public interface as PostCSS', function() {
    const wrappedPostcss = PostCss.entryPoint(PostCss);

    const plugin1 = jasmine.createSpy('plugin1');
    const plugin2 = jasmine.createSpy('plugin2');
    expect(wrappedPostcss(plugin1, plugin2).plugins)
      .toEqual(originalPostcss(plugin1, plugin2).plugins);
    expect(wrappedPostcss([plugin1, plugin2]).plugins)
      .toEqual(originalPostcss([plugin1, plugin2]).plugins);

    const wrappedInstance = wrappedPostcss();
    const originalInstance = originalPostcss();
    expect(wrappedInstance.use).toBe(originalInstance.use);
    expect(wrappedInstance.normalize).toBe(originalInstance.normalize);

    expect(wrappedPostcss.plugin).toBe(originalPostcss.plugin);

    expect(wrappedPostcss.vendor).toBe(originalPostcss.vendor);
    expect(wrappedPostcss.parse).toBe(originalPostcss.parse);
    expect(wrappedPostcss.list).toBe(originalPostcss.list);

    expect(wrappedPostcss.comment).toBe(originalPostcss.comment);
    expect(wrappedPostcss.atRule).toBe(originalPostcss.atRule);
    expect(wrappedPostcss.decl).toBe(originalPostcss.decl);
    expect(wrappedPostcss.rule).toBe(originalPostcss.rule);
    expect(wrappedPostcss.root).toBe(originalPostcss.root);
  });

  it('can can take the cssnext plugin in the constructor', function() {
    const wrappedPostcss = PostCss.entryPoint(PostCss);
    const cssnextPlugin = cssnext();
    expect(wrappedPostcss(cssnextPlugin).plugins)
      .toEqual(cssnextPlugin.plugins);
  });

  it('exposes the postcss helper functions as static methods', function() {
    expect(PostCss.plugin).toBe(originalPostcss.plugin);

    expect(PostCss.vendor).toBe(originalPostcss.vendor);
    expect(PostCss.parse).toBe(originalPostcss.parse);
    expect(PostCss.list).toBe(originalPostcss.list);

    expect(PostCss.comment).toBe(originalPostcss.comment);
    expect(PostCss.atRule).toBe(originalPostcss.atRule);
    expect(PostCss.decl).toBe(originalPostcss.decl);
    expect(PostCss.rule).toBe(originalPostcss.rule);
    expect(PostCss.root).toBe(originalPostcss.root);
  });

  it('extends postcss with an `afterPlugin` hook', async function() {
    const {plugin: plugin1, promise: promise1} = pluginSpy('plugin1');
    const {plugin: plugin2, promise: promise2} = pluginSpy('plugin2');
    const {plugin: afterPlugin, promise: afterPromise} = pluginSpy('afterPlugin');

    class WrappedPostCss extends PostCss {
      process(css, options = {}) {
        if (!('afterPlugins' in options)) {
          options.afterPlugins = [afterPlugin];
        }
        return super.process(css, options);
      }
    }
    const wrappedPostcss = WrappedPostCss.entryPoint(WrappedPostCss);

    const postcssPromise = wrappedPostcss(plugin1, plugin2).process('').async();
    expect(afterPlugin).not.toHaveBeenCalled();

    await promise1.resolve();
    expect(afterPlugin).not.toHaveBeenCalled();

    await promise2.resolve();
    expect(afterPlugin).toHaveBeenCalled();

    await afterPromise.resolve();
    await postcssPromise;
  });

  it('disables synchronous processing', async function() {
    const wrappedPostcss = PostCss.entryPoint(PostCss);
    expect(() => wrappedPostcss().process('body {color: red}').css)
      .toThrowError('Use process(css).then(cb) to work with async plugins');
    expect((await wrappedPostcss().process('body {color: red}').async()).css)
      .toEqual('body {color: red}');
  });
});
