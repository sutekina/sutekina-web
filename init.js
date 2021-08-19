const {logging, errorHandling, clock} = require("./utils/");
const boot_start = clock();
const fs = require("fs");
const package = require("./package.json");

let config;

try {
    config = require("./config.json");
} catch(e) {
    logging.warn("config.json doesn't exist or couldn't be read, creating config.json")
    fs.readFile("./ext/sample.config.json", (err, data) => {
        if(err) {
            logging.fatal("Error when trying to read ./ext/sample.config.json, no permissions?");
            logging.fatal(err.message, err);
            process.exit();
        }
        fs.writeFile("./config.json", data, (err) => {
            if(err) {
                logging.fatal("Error when trying to write ./config.json, no permissions?");
                logging.fatal(err.message, err);
                process.exit();
            } else {
                config = require("./config.json");
                logging.fatal("config.json was automatically created with the default values, please modify before continuing.");
                process.exit();
            }
        })
    });
}

module.exports = new Promise(async(resolve, reject) => {
    // this code wait for config to be defined and then the shit after runs
    while(!config) await new Promise(resolve => setTimeout(resolve, 1000));
    let modules_ready = false;
    if(config.debug.install_modules_on_boot) {
        logging.info("Please wait shortly while we check for missing modules and install them.");
        const util = require('util');
        const exec = util.promisify(require('child_process').exec);
        async function npm_install() {
            try {
                const mi_start = clock();
                const { stdout, stderr } = await exec('npm install');
                if(stdout) logging.debug(stdout);
                if(stderr) logging.fatal(stderr.message || stderr, stderr);
                logging.info(`Finished checking for missing modules and installing them, approximate time elapsed: ${clock(mi_start)}ms`)
                modules_ready = true;
            } catch (err) {
                reject(err);
            };
        };
        npm_install();
    } else {
        modules_ready = true
    }

    while(!modules_ready) await new Promise(resolve => setTimeout(resolve, 100));
    
    let modules = {}
    Object.keys(package.dependencies).map(key => {
        modules[key] = require(key);
        logging.debug(`Successfully required "${key}"`)
    });

    logging.debug(`Successfully required all modules, connecting to MYSQL now.`)

    modules["mysql2"].pool = modules["mysql2"].createPool(config.mysql);

    let mysql_ready = false;
    let mysql_boot_time = clock();
    logging.info("Running mysql boot scripts.");
    fs.readFile("./ext/db.sql", (err, data) => {
        if(err) throw err;
        logging.debug(`Successfully read script, querying now, time elapsed so far: ${clock(mysql_boot_time)}ms.`);
        modules["mysql2"].pool.execute(data.toString(), (err, res) => {
            logging.trace(data.toString());
            if(err) throw err;
            logging.info(`Successfully ran mysql boot scripts, time elapsed: ${clock(mysql_boot_time)}.`)

            mysql_ready = true;
        });
    });
    while(!mysql_ready) await new Promise(resolve => setTimeout(resolve, 100));
    
    const app = modules["express"]();
    app.server = app.listen(config.port, () => logging.info(`sutekina-web:${config.port} running, boot time elapsed: ${clock(boot_start)}ms.`));
    
    app.use(modules["body-parser"].urlencoded({ extended: true }));
    
    let MySQLStore = modules["express-mysql-session"](modules["express-session"]);
    
    let session_config = Object.assign({}, config.mysql, {
        clearExpired: true,
        checkExpirationInterval: 900000,
        expiration: 86400000,
        createDatabaseTable: true,
        schema: {
            tableName: 'user_sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
                data: 'data'
            }
        }
    });
    
    const sessionStore = new MySQLStore(session_config);
    
    app.use(modules["express-session"]({
        key: config.cookies.name,
        secret: config.cookies.secret,
        store: sessionStore,
        saveUninitialized: false,
        resave: false,
        cookie: {
            domain: config.domains.base,
            httpOnly: true,
            sameSite: true,
            secure: config.protocol.https,
            maxAge: 315569259747
        }
    }));
    
    if(config.middleware.use_cors) {
        let cors_origin = (config.protocol.https ? "https://" : "http://") + config.domains.base;
        
        app.use(modules["cors"]({
            origin: cors_origin,
            optionsSuccessStatus: 200,
            methods: 'GET,PUT,POST,DELETE',
            allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization'
        }));
    };
    
    app.disable('case sensitive routing');
    app.disable('strict routing');
    app.disable('x-powered-by');
    app.set('etag', 'weak');
    app.set('view engine', 'ejs');
    resolve([modules, config, app]);
});