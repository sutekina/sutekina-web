const log = require("./utils/log");
const fs = require("fs");

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

(async() => {
    // this code wait for config to be defined and then the shit after runs
    while(!config) await new Promise(resolve => setTimeout(resolve, 1000));

    if(config.debug.install_modules_on_boot) {
        log.info("Please wait shortly while we check for missing modules and install them.")
        const util = require('util');
        const exec = util.promisify(require('child_process').exec);
        async function npm_install() {
            try {
                const { stdout, stderr } = await exec('npm install');
                if(stdout) log.output(stdout);
                if(stderr) log.error(stderr);
            } catch (err) {
                log.error(err);
            };
        };
        npm_install();
    }
})();
