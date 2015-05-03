import path from 'path';
import {fs} from '../../lib/async';

export default async function fixture(filePath) {
  const absolutePath = path.resolve(__dirname, '..', 'fixtures', filePath);
  const contents = await fs.readFile(absolutePath, 'utf8');
  return {path: absolutePath, contents};
};
