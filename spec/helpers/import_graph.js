import ImportGraph from '../../lib/import_graph';

export function importGraph([tree]) {
  let [rootFile, ...files] = tree.trim().split('\n');
  let [, rootIndent, rootFileName] = rootFile.match(/^(\s*)(.*)$/);
  let nodes = {[rootFileName]: new ImportGraph(rootFileName)};
  let stack = [{parentNode: nodes[rootFileName], parentIndent: rootIndent}];
  for (let file of files) {
    let {parentNode, parentIndent} = stack[0];
    let [, indent, fileName] = file.match(/^(\s*)(.*)$/);
    while (indent.length <= parentIndent.length) {
      stack.shift();
      ({parentNode, parentIndent} = stack[0]);
    }
    stack.unshift({
      parentNode: nodes[fileName] = parentNode.import(fileName),
      parentIndent: indent
    });
  }
  return nodes;
}

export function toGenerate(util, equalityTesters) {
  return {
    compare: function([...actual], ...expected) {
      let result = {};
      result.pass = util.equals(actual, expected, equalityTesters);
      if (!result.pass) {
        actual = `[${actual.map(f => f.filePath).join(', ')}]`;
        expected = `[${expected.map(f => f.filePath).join(', ')}]`;
        result.message = `Expected ${actual} to equal ${expected}`;
      }
      return result;
    }
  }
}
