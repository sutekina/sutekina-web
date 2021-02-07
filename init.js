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
        modules["mysql2"].connection = modules["mysql2"].createConnection(db_config);
        modules["mysql2"].connection.connect(function(err) {
            if(err) {
                log.error('MYSQL CONNECT ERR ' + err);
                setTimeout(handleDisconnect, 2000);
            } else {
                log.info(`Successfully connected to MYSQL`)
            }
        });
    
        modules["mysql2"].connection.on('error', function(err) {
            log.error('MYSQL ERR ' + err);
            handleDisconnect();                         
        });
    }
    
    handleDisconnect();
    /*
    if you get the error ER_NOT_SUPPORTED_AUTH_MODE, execute this mysql query 

    ALTER USER 'YOUR-USERNAME'@'YOUR-HOST' IDENTIFIED WITH mysql_native_password BY 'YOUR-PASSWORD';

    flush privileges;
    */
    let MySQLStore = modules["express-mysql-session"](modules["express-session"]);

    let session_config = Object.assign(db_config, {
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

    const app = modules["express"]();
    app.listen(config.port, () => log.info(`${config.app_name} is running on the port ${config.port}`));
    
    app.use('/public', modules["express"].static('public'));
    
    if(config.debug.request_logging) app.use(modules["morgan"]('dev'));
    
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
    }
    app.use(modules["express-session"]({
        key: config.cookies.name,
        domain: config.domains.base,
        secret: config.cookies.secret,
        store: sessionStore,
        saveUninitialized: false,
        resave: false,
        cookie: {
            httpOnly: true,
            sameSite: true,
            secure: config.protocol.https, //in production set https ig
            maxAge: 315569259747
        }
    }));

    app.use((req, res, next) => {
        req.data = {
            page: {
                redir: req.query.redir || '/',
                title: undefined,
                url: req.path
            },
            user: {
                id: null,
                name: null
            }
        };
        
        if(req.session.name) {
            q = `SELECT * FROM users WHERE safe_name = ?`;
            modules["mysql"].connection.execute(q, [req.session.name], (error, result) => {
                    log.mysql(q)
                    if(error) return router.next(new modules["utility"].errorHandling.SutekinaError(error.message, 400));
                    if(!result[0]) req.session.destroy((err) => {
                        if(err) return next(new modules["utility"].errorHandling.SutekinaError(err.message, 500));
                        return res.redirect(req.data.page.redir);
                    });
                    req.data.user.id = result[0].id;
                    req.data.user.name = result[0].name;
                    next();
                }
            );
        } else {
            next();
        }
    });

    app.disable('case sensitive routing');
    app.disable('strict routing');
    app.disable('x-powered-by');
    app.set('etag', 'weak');
    app.set('view engine', 'ejs');
    
    resolve([modules, config, app]);
});