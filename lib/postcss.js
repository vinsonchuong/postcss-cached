import postcss from 'postcss'
import Processor from 'postcss/lib/processor'
import LazyResult from 'postcss/lib/lazy-result'

class LazyResultOverride extends LazyResult {
  async() {
    const {result: {processor, opts: {afterPlugins = []}}} = this;
    this.result.processor = {plugins: processor.plugins.concat(afterPlugins)};
    const result = super.async();
    this.result.processor = processor;
    return result;
  }

  sync() {
    if (this.processed) return this.result;
    throw new Error('Use process(css).then(cb) to work with async plugins');
  }
}

export default class extends Processor {
  static entryPoint(SubClass) {
    return Object.assign(
      (...plugins) => new SubClass(plugins),
      postcss
    );
  }

  constructor(plugins) {
    if (plugins.length === 1 && Array.isArray(plugins[0])) {
      plugins = plugins[0];
    }

    const actualPlugins = [];
    for (const plugin of plugins) {
      if (Array.isArray(plugin.plugins)) {
        for (const plugin of plugin.plugins) {
          actualPlugins.push(plugin);
        }
      } else {
        actualPlugins.push(plugin);
      }
    }
    super(actualPlugins);
  }

  process(css, options = {}) {
    return new LazyResultOverride(this, css, options);
  }
}
Object.assign(Processor, postcss);
