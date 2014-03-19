# paratrooper [![Build Status][1]][2]

> They are used for tactical advantage as they can be inserted into the battlefield from the air, 
> thereby allowing them to be positioned in areas not accessible by land. -- [Wikipedia][4]

A CLI tool for deploying a node web app to an Ubuntu server with nginx, upstart and git, in a simple way.


## Installation

```
npm install -g paratrooper
```


## Prerequisites

The remote machine must have `git`, `nginx`, `node` and `npm` installed before deployments can be made to it. The machine should also be configured for remote access via ssh.


## Usage
```no-highlight
pt <init|deploy|remove> [target] -d <directory>
```

_note: You can also use `paratrooper` instead of `pt` for verbosity._

* Run `pt init [target]` to generate the deploy config files. You need to commit and push these files before deploying.
* Run `pt deploy [target]` to begin a deployment.
* Run `pt remove [target]` to stop and remove the app from the server.

### Options
####[target]

Specifies the type of environment, and is an arbitrary value based on your workflow. Target is usually `alpha`, `beta`, `staging`, or `production`,
but you are free to specify whatever value you want. Each target has it's own set of configurations. If a target isn't specified, then by default it's `production`.

####-d &lt;directory&gt;

Config files are stored in the `deploy` directory unless you specify a custom directory via `-d <directory>`. Example: `pt deploy -d deployconfigs`.
If this option is used with `pt init`, it must be used with all other commands.

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

####upstream port

The port the node app listens on. This is needed to properly link the node process with the upstream nginx server.

####git clone URL

The URL of the repo. The repo is cloned on the first deploy and then pulled from thereafter.

####server SSH address

The user + host address of the server, i.e. `root@yourserver.com` or `myname@123.23.211.23` or `deployuser@someinstance`.

####branch

The origin branch of your repo that paratrooper will pull from to make the deployment.

## Notes
- Following a successful deploy, `pt` will wait a further 15 seconds (to account for the configured respawn limits of upstart) to verify the app process is still alive and well.

- As a shorthand, the `pt init`, `pt deploy`, `pt remove` commands can also be referred to by their first letter, i.e. `pt i`, `pt d` and `pt r` respectively.

- If no errors are reported, the command was successful. The appropriate zero or non-zero error code is returned to allow `pt` to be invoked by third party tools.

- It's assumed that **all** files in the `sites-enabled` nginx directory are valid config files, i.e. that your `nginx.conf` includes them using something like this `include /etc/nginx/sites-enabled/*;`.

## Testing

Tests are written using mocha/chai, and can be executed via `npm test`.

## Attribution

This project is based off Martin Rue's [node-deploy][3].

[1]: https://travis-ci.org/knownasilya/paratrooper.png?branch=master
[2]: https://travis-ci.org/knownasilya/paratrooper
[3]: https://github.com/martinrue/node-deploy
[4]: http://en.wikipedia.org/wiki/Paratrooper
