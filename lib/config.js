import fs from 'fs';
import path from 'path';
import debug from 'debug';
import mkdirp from 'mkdirp';
import chalk from 'chalk';
import inquirer from 'inquirer';
import prompts from './prompts';
import validate from './validate';

const configFileName = 'paratrooper.json';

export function generate(options, cb) {
  var log = debug('generate');

  options = options || {};
  log('options: ', options);

  var pkg = options.pkg || {};
  var data = {
    appName: pkg.name
  };

  if (pkg.repository && pkg.repository.type === 'git') {
    data.cloneUrl = pkg.repository.url;
  }

  data.scriptKeys = pkg.scripts ? Object.keys(pkg.scripts) : [];

  log('prompt data: ', data);
  log('plugin prompts: ', options.pluginPrompts);

  inquirer.prompt(prompts(data, options.pluginPrompts), function (answers) {
    answers.appName = answers.appUrl || path.basename(process.cwd());
    answers.serverAppPath = '/var/www';
    answers.sitesEnabledPath = '/etc/nginx/sites-enabled';
    answers.rootPath = options.rootPath;


    validate(answers, function (error) {
      if (error) {
        throw new Error(error);
      }

      save(options.targetPath, answers, function (err, configPath) {
        console.log(chalk.green(`Created a '${path.basename(options.targetPath)}' deploy environment.`));

        var envs = {
          NODE_ENV: answers.nodeEnv,
          PORT: answers.upstreamPort
        };

        answers.configPath = configPath;
        answers.envs = envs;

        log('answers: ', answers);
        cb(answers);
      });
    });
  });
}

export function load(targetPath, cb) {
  var configPath = getConfigPath(targetPath);

  fs.readFile(configPath, function (error, data) {
    if (error) {
      throw new Error(error);
    }

    var config = JSON.parse(data);

    if (!config) {
      console.log(chalk.red(`'${targetPath}' config is invalid – please run \`pt init [target]\` to generate a valid configuration file.`));
      return process.exit(1);
    }

    cb(config);
  });
}

function save(basePath, config, cb) {
  var configPath = getConfigPath(basePath, true);

  mkdirp(path.dirname(configPath), function (error) {
    if (error) {
      throw error;
    }

    fs.writeFile(configPath, JSON.stringify(config, null, 2), function () {
      cb(undefined, configPath);
    });
  });
}

function getConfigPath(basePath, create) {
  var configPath = path.join(basePath, configFileName);
  var deprecatedConfigPath = path.join(basePath, 'config.json');

  if (!fs.existsSync(configPath) && !create) {
    if (fs.existsSync(deprecatedConfigPath)) {
      fs.renameSync(deprecatedConfigPath, configPath);
    }

    if (!fs.existsSync(configPath)) {
      throw new Error(chalk.red('Configuration file (' + configPath +
        ') not found, please run `pt init [target]` from your project directory.'));
    }
  }

  return configPath;
}
