# sutekina web
nodejs frontend implementation for cmyui's gulag

## requirements
`NODE JS LTS`
`MYSQL (tested w/ 8.0.20)`
`A REVERSE PROXY (test w/ nginx)`
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
# - for permission issues either run with sudo or use "sudo chmod -R a+rwx ./*", preferably do the latter.
```

# config file:

```JavaScript
{
  app_name: "the name of the application, used throughout the service for the website title and lots of other things.",
  port: "the port that the application should run on, use one that is free.",
  debug: {
    logging: {
      logging_levels: `
        fatal: errors that could impact the functionality of the application,
        error: server-side errors that aren't impactful to the functionality but aren't properly handled,
        warn: things that probably will solve themselves but are important to be aware of,
        info: informational things, nothing detrimental,
        debug: more information to help identify problems or keep track of your software,
        trace: debug but with more details to come to the root of problems,
        all: everything, in theory trace shows everything too but this is prettier >:3`,
      timestamp_format: "https://github.com/taylorhakes/fecha#formatting-tokens"
    },
    
    install_modules_on_boot: `
      this executes "npm install" when you boot the application, 
      it's recommended to keep this on in case that i add modules to the repository 
      but if you want to boot the application quickly turn it off.`
  },
  middleware: {
    use_cors: `
      NOT_IMPLEMENTED

      currently this isn't properly implemented so just leave it off, you dont really need it in this instance anyways, 
      more info: https://stackoverflow.com/questions/24611450/cors-do-i-need-it-here`
  },
  protocol: `
    NOT_IMPLEMENTED

    this isnt necessarily needed since you can just use nginx & cloudflare for ssl but i still provided it optionally, not yet implemented.`,
  cookies: {
    name: "the name of the session that the browser displays.",
    secret: `
      hmm you should make this something secure but even if somebody cracked that,
      it wouldn't help them much, more info: 
      https://security.stackexchange.com/questions/92122/why-is-it-insecure-to-store-the-session-id-in-a-cookie-directly`
  },
  mysql: {
    user: "mysql username, preferably make separate user from root.",
    host: "hostname, this can be localhost if it's on your local machine or it can be an ip address or domain to your mysql server.",
    password: "the password of your mysql user.",
    port: "self explanatory, usually 3306 is the default.",
    database: "the database where gulag is stored.",
    timezone: "Z is Zulu time, don't mess with this, i just provided it optionally if you know what you are doing.",
    insecureAuth: "if you get the error 'ER_NOT_SUPPORTED_AUTH_MODE' you might wanna turn insecureAuth on, you probably also have to modify your mysql setting or switch to mysql 5, for more info https://stackoverflow.com/questions/44946270/er-not-supported-auth-mode-mysql-server and https://github.com/fdl-stuff/nashi/issues/1."
  },
  domains: "dont put the protocol in the domains except for the discord & github, if your base domain is a subdomain this might cause issues with session.domain if you use the session across multiple domains but it should still work on that subdomain."
}
```
