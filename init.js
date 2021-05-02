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
            logging.fatal(err);
            process.exit();
        }
        fs.writeFile("./config.json", data, (err) => {
            if(err) {
                logging.fatal("Error when trying to write ./config.json, no permissions?");
                logging.fatal(err);
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
                if(stderr) logging.fatal(stderr);
                logging.info(`Finished checking for missing modules and installing them, approximate time elapsed: ${clock(mi_start)}ms`)
                modules_ready = true;
            } catch (err) {
                logging.fatal(err);
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

    const db_config = {
        host : config.mysql.host,
        user : config.mysql.user,
        password : config.mysql.password,
        database : config.mysql.database,
        timezone: config.mysql.timezone,
        insecureAuth : config.mysql.insecureAuth
    }
 
    handleDisconnect = () => {
        modules["mysql2"].connection = modules["mysql2"].createConnection(db_config);
        modules["mysql2"].connection.connect(function(err) {
            if(err) {
                logging.fatal(err.message, err);
                setTimeout(handleDisconnect, 2000);
            } else {
                logging.debug(`Successfully connected to MYSQL.`)
            }
        });
    
        modules["mysql2"].connection.on('error', function(err) {
            logging.fatal(err.message, err);
            if(err.code === "PROTOCOL_CONNECTION_LOST") return setTimeout(handleDisconnect, 2000);
            err.level = "fatal";
            throw err;
        });
    };
    
    handleDisconnect();

    const app = modules["express"]();
    app.server = app.listen(config.port, () => logging.info(`sutekina-web:${config.port} running, boot time elapsed: ${clock(boot_start)}ms.`));
// pretty sprite if thats what you like
// `
// //     ▄▄▄▄▄   ▄     ▄▄▄▄▀ ▄███▄   █  █▀ ▄█    ▄   ██     ▄ ▄   ▄███▄   ███   
// //    █     ▀▄  █ ▀▀▀ █    █▀   ▀  █▄█   ██     █  █ █   █   █  █▀   ▀  █  █  
// //  ▄  ▀▀▀▀▄ █   █    █    ██▄▄    █▀▄   ██ ██   █ █▄▄█ █ ▄   █ ██▄▄    █ ▀ ▄ 
// //   ▀▄▄▄▄▀  █   █   █     █▄   ▄▀ █  █  ▐█ █ █  █ █  █ █  █  █ █▄   ▄▀ █  ▄▀ 
// //           █▄ ▄█  ▀      ▀███▀     █    ▐ █  █ █    █  █ █ █  ▀███▀   ███   
// //            ▀▀▀                   ▀       █   ██   █    ▀ ▀                 
// `

    let MySQLStore = modules["express-mysql-session"](modules["express-session"]);

    let session_config = Object.assign({}, db_config, {
        clearExpired: true,
        checkExpirationInterval: 900000,
        expiration: 86400000,
        createDatabaseTable: true,
        connectionLimit: 2,
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
        let cors_origin; 
        if(config.protocol.https) cors_origin = "https://";
        else cors_origin = "http://";

        cors_origin = cors_origin + config.domains.base
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