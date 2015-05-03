import path from 'path';
import postcss from 'postcss';
import Ast from '../../lib/ast';
import fixture from '../helpers/fixture';

async function setup() {
  const [basicImport, dep1, dep2] = await* [
    fixture('basic_import.css'),
    fixture('dep1.css'),
    fixture('dep2.css')
  ];
  const {root} = await postcss()
    .process(basicImport.contents, {from: basicImport.path})
    .async();
  const ast = new Ast(root);
  return {root, ast, basicImport, dep1, dep2};
};

function importRules(root) {
  const rules = [];
  root.eachAtRule('import', rule => rules.push(rule));
  return rules;
}

describe('Ast', function() {
  it('provides the absolute path to the CSS file', async function() {
    const {ast, basicImport, dep1, dep2} = await setup();
    expect(ast.path).toBe(basicImport.path);
  });

  it('provides a parsed array of imports', async function() {
    const {ast: {imports}, basicImport, dep1, dep2} = await setup();
    expect(imports).toEqual([
      jasmine.objectContaining({path: 'dep1.css', absolutePath: dep1.path}),
      jasmine.objectContaining({path: 'dep2.css', absolutePath: dep2.path})
    ]);
    expect(await imports[0].contents).toBe(dep1.contents);
    expect(await imports[1].contents).toBe(dep2.contents);
  });

  it('wraps each import rule', async function() {
    const {ast: {imports: [import1, import2]}, root} = await setup();
    const rules = importRules(root);
    expect(import1).toBe(rules[0]);
    expect(import2).toBe(rules[1]);
  });
});
