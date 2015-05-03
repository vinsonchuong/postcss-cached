class ImportGraphNode {
  constructor(importGraph, filePath) {
    this.importGraph = importGraph || this;
    this.filePath = filePath;
    this.importers = new Set();
    this.imports = new Set();
  }

  import(filePath) {
    const {importGraph: {identityMap}} = this;
    const child = identityMap.has(filePath) ?
      identityMap.get(filePath) :
      new ImportGraphNode(this.importGraph, filePath);
    identityMap.set(filePath, child);
    this.imports.add(child);
    child.importers.add(this);
    return child;
  }

  * ancestors(visitedNodes = new Set()) {
    for (const importer of this.importers) {
      if (visitedNodes.has(importer)) continue;
      visitedNodes.add(importer);
      yield importer;
      yield* importer.ancestors(visitedNodes);
    }
  }

  * topologicalSort(visitedNodes = new Set()) {
    for (const imported of this.imports) {
      if (visitedNodes.has(imported)) continue;
      visitedNodes.add(imported);
      yield imported;
      yield* imported.topologicalSort(visitedNodes);
    }
  }
}

export default class ImportGraph extends ImportGraphNode {
  constructor(filePath) {
    super(null, filePath);
    this.identityMap = new Map().set(filePath, this);
  }

  get(filePath) {
    return this.identityMap.get(filePath);
  }

  has(filePath) {
    return this.identityMap.has(filePath);
  }
}
