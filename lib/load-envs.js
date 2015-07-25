import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export default function loadEnvs(targetPath, callback) {
  var envs;

  try {
    envs = yaml.safeLoad(fs.readFileSync(path.join(targetPath, 'envs.yml'), 'utf8'));
    callback(undefined, envs);
  } catch(e) {
    callback(e);
  }
}
