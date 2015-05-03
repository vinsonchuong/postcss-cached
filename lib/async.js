import fs from 'fs';
import resolve from 'resolve';
import promisify from 'es6-promisify';

const promisifiedFs = {
  open: promisify(fs.open),
  readFile: promisify(fs.readFile),
  write: promisify(fs.write),
  writeFile: promisify(fs.writeFile)
};
export {promisifiedFs as fs};

const promisifiedResolve = promisify(resolve);
export {promisifiedResolve as resolve};

