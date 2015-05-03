import path from 'path';
import {fs, resolve} from './async';

export default class Ast {
  constructor(root) {
    this.root = root;
  }

  get path() {
    return this.root.source.input.file;
  }

  resolvePath(relativePath) {
    return path.resolve(path.dirname(this.path), relativePath);
  }

  parseImportRule(rule) {
    const [,, file, mediaQueries] =
      rule.params.match(/(['"])(.*?)\1(?:.*?\s+(.*))?/);
    return {file, mediaQueries};
  }

  async readImport(file, absolutePath) {
    try {
      return await fs.readFile(absolutePath, 'utf8');
    } catch (e) {
      try {
        absolutePath = await resolve(file, {
          extensions: ['.css'],
          packageFilter: ({style}) => ({main: style})
        });
        return await fs.readFile(absolutePath, 'utf8');
      } catch(e) {
        throw new Error(`Unable to resolve ${file}`);
      }
    }
  }

  get imports() {
    const imports = [];
    this.root.eachAtRule('import', rule => {
      const {file, mediaQueries} = this.parseImportRule(rule);
      const absolutePath = this.resolvePath(file);
      const contents = this.readImport(file, absolutePath);
      imports.push(Object.assign(
        rule,
        {path: file, absolutePath, contents, mediaQueries}
      ));
    });
    return imports;
  }
}
