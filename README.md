# paratrooper [![Build Status][1]][2]

> They are used for tactical advantage as they can be inserted into the battlefield from the air, 
> thereby allowing them to be positioned in areas not accessible by land. -- [Wikipedia][4]

A CLI tool for deploying a node web app to an Ubuntu server with nginx, upstart and git, in a simple way.

## Installation

### npm
```
npm install -g paratrooper
```

## Prerequisites
The remote machine must have `git`, `nginx`, `node` and `npm` installed before deployments can be made to it. The machine should also be configured for remote access via ssh.

## Usage
```no-highlight
pt [init | deploy | remove] -b <branch> -d <directory>
```

_note: You can also use `paratrooper` instead of `pt` for verbosity._

* Run `pt init` to generate the deploy config files. You need to commit and push these files before deploying.
* Run `pt deploy` to begin a deployment.
* Run `pt remove` to stop and remove the app from the server.

### Options
#### -b &lt;branch&gt;

paratrooper will deploy from the `master` branch. Use `-b <branch>` to deploy a different branch. 
The new branch will be deployed over the same application – it's just a means of deploying from an alternative branch.

####-d &lt;directory&gt;

Config files are stored in the `deploy` directory unless you specify a custom directory via `-d <directory>`. Example: `pt deploy -d deployconfigs`

##Example
First run `pt init` and answer the questions. It will try to guess some settings for you – if you're happy with the guess, just hit enter to accept it:

```no-highlight
pt init
```
Commit your repo with the new deplyoment directory and it's contents, then deploy.

```no-highlight
pt deploy
```

## Questions
After running `pt init`, you'll be asked a series of questions. Here's what each answer is used for:

####app url

This is the public URL your app will be served from.

####app name

Specifies the name of the app directory and the nginx/upstart config files.

####app entry point

The app's main `.js` file. This is the file that `node` will execute when your app starts.

####upstream port

The port the node app listens on. This is needed to properly link the node process with the upstream nginx server.

####app path on server

The directory the app will be cloned into and run from on the server.

####nginx sites-enabled path

The path of the nginx `sites-enabled` directory. The nginx config file will be copied here.

####git clone URL

The URL of the repo. The repo is cloned on the first deploy and then pulled from thereafter.

####server SSH address

The user + host address of the server, i.e. `root@yourserver.com`.

## Notes
- Following a successful deploy, `pt` will wait a further 15 seconds (to account for the configured respawn limits of upstart) to verify the app process is still alive and well.

- As a shorthand, the `pt init`, `pt deploy`, `pt remove` commands can also be referred to by their first letter, i.e. `pt i`, `pt d` and `pt r` respectively.

- If no errors are reported, the command was successful. The appropriate zero or non-zero error code is returned to allow `pt` to be invoked by third party tools.

- It's assumed that **all** files in the `sites-enabled` nginx directory are valid config files, i.e. that your `nginx.conf` includes them using something like this `include /etc/nginx/sites-enabled/*;`.

## Testing

Tests are written using tape, and can be executed via `npm test`.

## Attribution

This project is based off Martin Rue's [node-deploy][3].

[1]: https://travis-ci.org/knownasilya/paratrooper.png?branch=master
[2]: https://travis-ci.org/knownasilya/paratrooper
[3]: https://github.com/martinrue/node-deploy
[4]: http://en.wikipedia.org/wiki/Paratrooper
