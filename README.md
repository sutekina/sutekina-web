# sutekina web
nodejs frontend implementation for cmyui's gulag.
the code isn't good, i tried to make it easy to work with but that came at the cost of the code, for prettier code look at sutekina-api. xx
another note, this code isn't focused on performance but rather user friendliness, i could and might in the future do all information querying serverside rather than to interact with the api but this is cleaner to work with imo.

## requirements
`NODE JS LTS`
`MYSQL (tested w/ 5.7.33)`
`A REVERSE PROXY (tested w/ nginx)`
`SUTEKINA-API`

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
# - for permission issues either run with sudo or use "sudo chown -R <user> .", preferably do the latter.
```

## uninstalling:

generally speaking, if you are uninstalling it's pretty straightforward but you should be aware that sutekina-web creates an event scheduler in your mysql db, you can easily drop it using `DROP EVENT AddUserHistory;`, you should do this otherwise it will run daily and add to the user_history table.
