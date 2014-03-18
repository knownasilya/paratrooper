# paratrooper
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
usage: nd [init | deploy | remove] -b <branch> -d <directory>
```

* Run `nd init` to generate the deploy config files. You need to commit and push these files before deploying.
* Run `nd deploy` to begin a deployment.
* Run `nd remove` to stop and remove the app from the server.

### Options
#### -b &lt;branch&gt;

node-deploy will deploy from the `master` branch. Use `-b <branch>` to deploy a different branch. The new branch will be deployed over the same application – it's just a means of deploying from an alternative branch.

####-d &lt;directory&gt;

Config files are stored in the `deploy` directory unless you specify a custom directory via `-d <directory>`. Example: `nd deploy -d deployconfigs`

##Example
First run `nd init` and answer the questions. It will try to guess some settings for you – if you're happy with the guess, just hit enter to accept it:

```no-highlight
node v0.10.8 in ~/Desktop/app on master 
→ nd init
app url: martinrue.com
app name (app): martinrue.com
app entry point (blog.js): 
upstream port (4001): 
app path on server (/var/www): 
nginx sites-enabled path (/etc/nginx/sites-enabled): 
git clone URL (git@github.com:martinrue/delme.git): 
server SSH address: root@192.168.2.4
```

Second, commit and push the newly created config files:

```no-highlight
node v0.10.8 in ~/Desktop/app on master 
→ git add -A

node v0.10.8 in ~/Desktop/app on master 
→ git commit -m "add deploy config"
[master 9a0def5] add deploy config
 3 files changed, 30 insertions(+)
 create mode 100644 deploy/deploy.json
 create mode 100644 deploy/martinrue.com
 create mode 100644 deploy/martinrue.com.conf

node v0.10.8 in ~/Desktop/app on master with unpushed 
→ git push
Counting objects: 7, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (6/6), done.
Writing objects: 100% (6/6), 912 bytes | 0 bytes/s, done.
Total 6 (delta 1), reused 0 (delta 0)
To git@github.com:martinrue/martinrue.git
   b973149..9a0def5  master -> master
```

And finally, deploy:

```no-highlight
node v0.10.8 in ~/Desktop/app on master 
→ nd deploy
deploying master to root@192.168.2.4:/var/www/martinrue.com
```

## Questions
After running `nd init`, you'll be asked a series of questions. Here's what each answer is used for:

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
- Following a successful deploy, `nd` will wait a further 15 seconds (to account for the configured respawn limits of upstart) to verify the app process is still alive and well.

- As a shorthand, the `nd init`, `nd deploy`, `nd remove` commands can also be referred to by their first letter, i.e. `nd i`, `nd d` and `nd r` respectively.

- If no errors are reported, the command was successful. The appropriate zero or non-zero error code is returned to allow `nd` to be invoked by third party tools.

- It's assumed that **all** files in the `sites-enabled` nginx directory are valid config files, i.e. that your `nginx.conf` includes them using something like this `include /etc/nginx/sites-enabled/*;`.

## Testing

Tests are written using tape, and can be executed via `npm test`.

## Attribution

This project is based off Martin Rue's [node-deploy][1].

[1]: https://github.com/martinrue/node-deploy
