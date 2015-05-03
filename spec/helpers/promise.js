class Privates extends WeakMap {
  assign(instance, obj) {
    return this.set(instance, Object.assign(this.get(instance), obj));
  }
}

let privates = new Privates();

export default class extends Promise {
  constructor() {
    let resolve, reject, finish;
    super((...args) => [resolve, reject] = args);
    let finished = new Promise(resolve => finish = resolve);
    privates.set(this, {resolve, reject, finish, finished, count: 0});
  }

  resolve() {
    let {resolve, finished} = privates.get(this);
    resolve();
    return finished;
  }

  acquire() {
    let {count} = privates.get(this);
    count++;
    privates.assign(this, {count});
  }

  release() {
    let {count, finish} = privates.get(this);
    count--;
    privates.assign(this, {count})
    if (count === 0) finish();
  }

  then(onFulfilled, onRejected) {
    this.acquire();
    return super.then(
      result => {
        onFulfilled(result);
        this.release();
      },
      onRejected
    );
  }
}

