import path from 'path';
import {fs, resolve} from './async';
import Ast from './ast';
import ImportGraph from './import_graph';
import PostCss from './postcss';

class PostCssCached extends PostCss {
  process(css, options) {
    if (!('importGraph' in this)) {
      this.importGraph = new ImportGraph(options.from);
    }
    return super.process(css, Object.assign({
      afterPlugins: [(...args) => this.processImports(...args)]
    }, options));
  }

  async processImports(root, result) {
    const {opts: options} = result;
    const {importGraph} = this;
    const importerNode = importGraph.get(root.source.input.file);
    const ast = new Ast(root);

    for (const rule of ast.imports) {
      const {path, absolutePath, mediaQueries, contents} = rule;

      if (importGraph.has(absolutePath)) {
        const {importers: [firstImporterNode]} = importGraph.get(absolutePath);
        if (importerNode !== firstImporterNode) {
          rule.removeSelf();
          continue;
        }
      }

      const importedNode = importerNode.import(absolutePath);

      if (!('contents' in importedNode)) {
        let {root: importRoot} = await this.process(
          await contents,
          Object.assign({}, options, {from: absolutePath})
        ).async();

        if (mediaQueries) {
          importRoot = PostCss
            .atRule({name: 'media', params: mediaQueries})
            .append(importRoot);
        }

        importedNode.contents = importRoot;
      }

      rule.replaceWith(importedNode.contents);
    }
  }
}

export default PostCss.entryPoint(PostCssCached);
