function wrap(jasmineFn) {
  return function(description, fn) {
    if (fn.toString().includes('regeneratorRuntime.async')) {
      let oldFn = fn;
      fn = async function(done) {
        try {
          await oldFn.call(this);
          done();
        } catch(e) {
          done.fail(e.stack);
        }
      }
    }
    jasmineFn(description, fn);
  };
}

for (let jasmineFn of ['describe', 'it', 'fit']) {
  global[jasmineFn] = wrap(global[jasmineFn]);
}
