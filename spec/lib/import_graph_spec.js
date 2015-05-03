import {importGraph, toGenerate} from '../helpers/import_graph';

describe('ImportGraph', function() {
  beforeEach(function() {
    jasmine.addMatchers({toGenerate});
  });

  it('can represent a simple tree of imports', function() {
    const {root, f1, f1a, f1a1, f1b, f2} = importGraph`
      root
        f1
          f1a
            f1a1
          f1b
        f2`;

    expect(root.imports).toGenerate(f1, f2);
    expect(f1.imports).toGenerate(f1a, f1b);
    expect(f1a.imports).toGenerate(f1a1);
    expect(f1a1.imports).toGenerate();
    expect(f1b.imports).toGenerate();
    expect(f2.imports).toGenerate();

    expect(root.importers).toGenerate();
    expect(f1.importers).toGenerate(root);
    expect(f1a.importers).toGenerate(f1);
    expect(f1a1.importers).toGenerate(f1a);
    expect(f1b.importers).toGenerate(f1);
    expect(f2.importers).toGenerate(root);
  });

  it('creates at most a single vertex per file', function() {
    const {root, f1, f2} = importGraph`
      root
        f1
          f2
        f2`;
    expect(root.imports[1]).toBe(f1.imports[0]);
    expect(f2.importers).toGenerate(f1, root);
  });

  it('creates at most a single edge per file', function() {
    const {root, f1} = importGraph`
      root
        f1`;
    const f2 = f1.import('f2');
    f1.import('f2');
    expect(f1.imports).toGenerate(f2)
    expect(f2.importers).toGenerate(f1);
  });

  it('can find nodes by file path', function() {
    const {root, f1, f2} = importGraph`
      root
        f1
          f2
        f2`;

    expect(root.get('f1')).toBe(f1);
    expect(root.get('f2')).toBe(f2);
    expect(root.get('f3')).toBeUndefined();

    expect(root.has('f1')).toBe(true);
    expect(root.has('f2')).toBe(true);
    expect(root.has('f3')).toBe(false);
  });

  describe('computing the ancestors of a node', function() {
    describe('for a simple tree of imports', function() {
      it('generates a recursive list of importers', function() {
        const {root, f1, f1a, f1a1, f1b, f2} = importGraph`
          root
            f1
              f1a
                f1a1
              f1b
            f2`;
        expect(root.ancestors()).toGenerate();
        expect(f1.ancestors()).toGenerate(root);
        expect(f1a.ancestors()).toGenerate(f1, root);
        expect(f1a1.ancestors()).toGenerate(f1a, f1, root);
        expect(f1b.ancestors()).toGenerate(f1, root);
        expect(f2.ancestors()).toGenerate(root);
      });
    });

    describe('for a tree with multiple importers of one file', function() {
      it('recursively generates all importers without duplicates', function() {
        const {root, f1, f2, f3} = importGraph`
          root
            f1
              f3
            f2
              f3`;
        expect(f3.ancestors()).toGenerate(f1, root, f2);
      });
    });
  });

  describe('computing the topological sort of imports', function() {
    describe('for a simple tree of imports', function() {
      it('generates all the files a node requires', function() {
        const {root, f1, f1a, f1a1, f1b, f2} = importGraph`
          root
            f1
              f1a
                f1a1
              f1b
            f2`;
        expect(root.topologicalSort()).toGenerate(f1, f1a, f1a1, f1b, f2);
        expect(f1.topologicalSort()).toGenerate(f1a, f1a1, f1b);
        expect(f1a.topologicalSort()).toGenerate(f1a1);
        expect(f1a1.topologicalSort()).toGenerate();
        expect(f1b.topologicalSort()).toGenerate();
        expect(f2.topologicalSort()).toGenerate();
      });
    });

    describe('for a tree with multiple importers of one file', function() {
      it('generates all imports without duplicates', function() {
        const {root, f1, f2, f3, f4} = importGraph`
          root
            f1
              f3
                f4
            f2
              f3
                f4`;
        expect(root.topologicalSort()).toGenerate(f1, f3, f4, f2);
      });
    });
  });
});
