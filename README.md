# sutekina web
nodejs frontend implementation for cmyui's gulag

## requirements
`NODE JS LTS`
`MYSQL (tested w/ 8.0.20)`
`A REVERSE PROXY (test w/ nginx)`

## notes
installation is done in ubuntu 18.05 but you can make this work on windows or ubuntu 20 (ubuntu 20 is known to have issues with nginx and osu, i'd preferably not use it) and probably even other linux distros but since gulag is recommended to be used on ubuntu 18 i recommend using that.

## starting it up

```bash
# installation

sudo apt-get install git-all nodejs-dev node-gyp libssl1.0-dev npm
sudo git clone https://github.com/sutekina/sutekina-web.git

cd sutekina-web

npm install

# starting it:

node .

# NOTES:
# - you should configure the config!
# - if you aren't root then you might have to run it with sudo or give the directory full read write permissions with: sudo chmod a+rwx ./*
```
