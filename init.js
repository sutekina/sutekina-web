const log = require("./utils/log");
const fs = require("fs");
const package = require("./package.json");

let config;

try {
    config = require("./config.json");
} catch(e) {
    log.error("config.json doesn't exist or couldn't be read, creating config.json")
    fs.readFile("./ext/sample.config.json", (err, data) => {
        if(err) {
            log.error("Error when trying to read ./ext/sample.config.json, no permissions?");
            log.error(err);
            process.exit()
        }
        fs.writeFile("./config.json", data, (err) => {
            if(err) {
                log.error("Error when trying to write ./config.json, no permissions?");
                log.error(err);
                process.exit()
            } else {
                config = require("./config.json");
                log.info("config.json was automatically created with the default values, please modify to your liking.");
            }
        })
    });
}

module.exports = new Promise(async(resolve, reject) => {
    // this code wait for config to be defined and then the shit after runs
    while(!config) await new Promise(resolve => setTimeout(resolve, 1000));
    let modules_ready = false;
    if(config.debug.install_modules_on_boot) {
        log.info("Please wait shortly while we check for missing modules and install them.")
        const util = require('util');
        const exec = util.promisify(require('child_process').exec);
        async function npm_install() {
            try {
                const { stdout, stderr } = await exec('npm install');
                if(stdout) log.output(stdout);
                if(stderr) log.error(stderr);
                modules_ready = true;
            } catch (err) {
                log.error(err);
            };
        };
        npm_install();
    } else {
        modules_ready = true
    }

    while(!modules_ready) await new Promise(resolve => setTimeout(resolve, 1000));

    let modules = {}
    for(let i = 0; i < Object.keys(package.dependencies).length; i++) {
        let key = Object.keys(package.dependencies)[i];
        modules[key] = require(key);
        log.info(`Successfully required "${key}"`)
    }

    log.info(`Successfully required all modules, connecting to MYSQL now.`)

    const db_config = {
        host : config.mysql.host,
        user : config.mysql.user,
        password : config.mysql.password,
        database : config.mysql.database,
        timezone: config.mysql.timezone,
        insecureAuth : config.mysql.insecureAuth
    }
 
    let connection;

    handleDisconnect = () => {
        connection = modules.mysql2.createConnection(db_config);
        // console.log(modules.mysql2.connection)
        connection.connect(function(err) {
            if(err) {
                log.error('MYSQL CONNECT ERR ' + err);
                setTimeout(handleDisconnect, 2000);
            } else {
                log.info(`Successfully connected to MYSQL`)
            }
        });
    
        connection.on('error', function(err) {
            log.error('MYSQL ERR ' + err);
            handleDisconnect();                         
        });
    }
    
    handleDisconnect();
    
    resolve([modules, config]);
});