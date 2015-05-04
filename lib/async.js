import resolve from 'resolve';
import promisify from 'es6-promisify';

const promisifiedResolve = promisify(resolve);
export {promisifiedResolve as resolve};

