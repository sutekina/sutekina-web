const crypto = require("crypto");
const {modules, config, app} = require('../main');
const {logging, errorHandling, clock, mysql} = require('../utils');
const router = modules['express'].Router();
const pool = modules["mysql2"].pool;

router.get("/", (req, res, next) => {
    if(!req.data.user.id) return res.redirect(307, `/account/login`);
    
    res.redirect(307, `/users/${req.data.user.id}`);
});

router.get("/login", (req, res, next) => {
    if(req.data.user.id) return res.redirect(req.data.page.redir);
    req.data.page.type = "login";
    req.data.page.title = "login";
    res.render('index', req.data);
});

router.post("/login", async (req, res, next) => {
    let reqTimer = clock();
    if(req.data.user.id) return res.redirect(req.data.page.redir);
    if(!req.body) return res.redirect(`/account/login?error=LOGIN_FAILED&redir=${req.data.page.redir}`);
    let geoInfo = JSON.parse(req.body.geoInfo) ? JSON.parse(req.body.geoInfo) : false;
    if(!geoInfo || !geoInfo.date) return res.redirect(`/account/login?error=LOGIN_FAILED&redir=${req.data.page.redir}`);
    if((new Date().getTime() - geoInfo.date) > 1000) return res.redirect(`/account/login?error=LOGIN_TIMEOUT&redir=${req.data.page.redir}`);
    
    
    let test = {
        username: testUsername(req.body.username),
        password: testPassword(req.body.password),
        ip: testIP(geoInfo.ip)
    }
    
    try {
        if(test.username !== true) return res.redirect(`/account/login?error=${test.username}&redir=${req.data.page.redir}`);
        let safe_name = req.body.username.toLowerCase().replace(" ", "_");
        if(test.password !== true) return res.redirect(`/account/login?error=${test.password}&redir=${req.data.page.redir}`);
        if(!test.ip) return res.redirect(`/account/login?error=LOGIN_FAILED`);
        
        logging.debug(`Login request for "${req.body.username}" from ${geoInfo.ip}, time elapsed: ${clock(reqTimer)}ms`);

        query = `SELECT id, safe_name, pw_bcrypt, priv, country FROM users WHERE safe_name = ?`;
        let {result} = await mysql(pool, query, [req.body.username.toLowerCase().trim().replace(" ", "_")]);
        logging.trace(query);
        if(!result[0]) return res.redirect(`/account/login?error=LOGIN_FAILED&redir=${req.data.page.redir}`);
        let user = result[0];
        let passwordMd5 = new Buffer.from(crypto.createHash("md5").update(new Buffer.from(req.body.password, "utf-8")).digest("hex"), "utf-8");
        
        // ~325ms avg, i could cache but i don't want to.
        result = await modules["bcrypt"].compare(passwordMd5, user.pw_bcrypt);
        if(!result) return res.redirect(`/account/login?error=LOGIN_FAILED&redir=${req.data.page.redir}`);

        // code to do something if user from other country than the country they created their acc with
        // if(user.country != req.get("cf-ipcountry").toLowerCase()) 
        
        // is user unbanned?
        if((user.priv & 1 << 0) === 0) return res.redirect(`/account/login?error=ACCOUNT_BANNED&redir=${req.data.page.redir}`);
        // is user verified?
        if((user.priv & 1 << 1) === 0) return res.redirect(`/connect`);

        query = `INSERT INTO user_logins (user_id, ip_address, register, geo_info, user_login_flags) VALUES(?, INET6_ATON(?), ?, ?, ?);`;;
        result = await mysql(pool, query, [user.id, geoInfo.ip, false, geoInfo, 0])
        logging.trace(query);
        req.session.safe_name = user.safe_name;
        if(!req.body.keeplogin) req.session.cookie.expires = false;
        logging.debug(`Login took ${clock(reqTimer)}ms`);
        res.redirect(req.data.page.redir);
    } catch(error) {
        next(new errorHandling.SutekinaError({message:error.message, status:500, level:"error"}));
    }
   
});

router.get("/logout", (req, res, next) => {
    if(!req.data.user.id) return res.redirect(`/account/login?error=LOGOUT_FAILED&redir=${req.data.page.redir}`);
    req.session.destroy((err) => {
        if(err) return next(new errorHandling.SutekinaError({message:err.message, status: 500, level: "error"}));
        return res.redirect(req.data.page.redir);
    });
});

router.get("/register", (req, res, next) => {
    if(req.data.user.id) return res.redirect(req.data.page.redir);
    req.data.page.type = "register";
    req.data.page.title = "register";
    res.render('index', req.data);
});

router.post("/register", async (req, res, next) => {
    let reqTimer = clock();
    if(req.data.user.id) return res.redirect(req.data.page.redir);
    if(!req.body) return res.redirect(`/account/register?error=REGISTER_FAILED&redir=${req.data.page.redir}`);
    let geoInfo = JSON.parse(req.body.geoInfo) ? JSON.parse(req.body.geoInfo) : false;
    if(!geoInfo || !geoInfo.date) return res.redirect(`/account/register?error=REGISTER_FAILED&redir=${req.data.page.redir}`);
    if((new Date().getTime() - geoInfo.date) > 1000) return res.redirect(`/account/register?error=REGISTER_TIMEOUT&redir=${req.data.page.redir}`);
    
    let test = {
        username: testUsername(req.body.username),
        email: testEmail(req.body.email),
        password: testPassword(req.body.password),
        ip: testIP(geoInfo.ip)
    }

    try {
        if(test.username !== true) return res.redirect(`/account/register?error=${test.username}&redir=${req.data.page.redir}`);
        let safe_name = req.body.username.toLowerCase().replace(" ", "_");
        if((await mysql(pool, `SELECT 1 FROM users WHERE safe_name = ?`, [safe_name])).result[0]) return res.redirect(`/account/register?error=USERNAME_TAKEN&redir=${req.data.page.redir}`);
        if(test.email !== true) return res.redirect(`/account/register?error=${test.email}&redir=${req.data.page.redir}`);
        if((await mysql(pool, `SELECT 1 FROM users WHERE email = ?`, [req.body.email])).result[0]) return res.redirect(`/account/register?error=EMAIL_TAKEN&redir=${req.data.page.redir}`);
        if(test.password !== true) return res.redirect(`/account/register?error=${test.password}&redir=${req.data.page.redir}`);
        if(!test.ip) return res.redirect(`/account/register?error=REGISTER_FAILED`);
        
        logging.debug(`Register request for "${req.body.username}@${req.body.email}" from ${geoInfo.ip}, time elapsed: ${clock(reqTimer)}ms`);
    
        let passwordMd5 = new Buffer.from(crypto.createHash("md5").update(new Buffer.from(req.body.password, "utf-8")).digest("hex"), "utf-8");
        let password = await modules["bcrypt"].hash(passwordMd5, await modules["bcrypt"].genSalt());
    
        // best case use cloudflare ipcountry otherwise use geoInfo country code, geoInfo isn't the best way because people could in theory intercept what geoInfo sends easily since it's done client-side.
        let country = req.get(req.get("cf-ipcountry").toLowerCase()) || geoInfo.country_code.toLowerCase() || "xx";

        query = `INSERT INTO users (name, safe_name, email, pw_bcrypt, country, creation_time, latest_activity) VALUES(?, ?, ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`;
        result = (await mysql(pool, query, [req.body.username, safe_name, req.body.email, password, country])).result;
        console.log(result)
        query = `INSERT INTO user_logins (user_id, ip_address, register, geo_info, user_login_flags) VALUES(?, INET6_ATON(?), ?, ?, ?);`;
        let {} = await mysql(pool, query, [result.insertId, geoInfo.ip, true, geoInfo, 0])
        logging.trace(query);
        logging.debug(`Login took ${clock(reqTimer)}ms`);
        res.redirect("/connect");
    } catch(error) {
        next(new errorHandling.SutekinaError({message:error.message, status:500, level:"error"}));
    }
});


router.get("/settings", (req, res, next) => {
    req.data.page.type = "home";
    req.data.page.title = "settings";
    res.render('index', req.data);
});

module.exports = router;


function testPassword(password) {
    if(!password) return "NO_PASSWORD";
    if(password.length < config.settings.password.minimum) return "PASSWORD_TOO_SHORT";
    if(password.length > config.settings.password.maximum) return "PASSWORD_TOO_LONG";
    const regexp = new RegExp(`[${config.settings.password.forbidden_characters.join("")}]`);
    if(regexp.test(password)) return "PASSWORD_INVALID";

    return true;
}

function testUsername(username) {
    if(!username) return "NO_USERNAME";
    if(username.length < config.settings.username.minimum) return "USERNAME_TOO_SHORT";
    if(username.length > config.settings.username.maximum) return "USERNAME_TOO_LONG";
    let allowedCharacters = config.settings.username.allowed_characters.join("");
    if(config.settings.username.forbidden_names.includes(username)) return "USERNAME_FORBIDDEN";
    const regexp = new RegExp(`^(?![${allowedCharacters}]*[^${allowedCharacters}]).*$`);
    if(!regexp.test(username)) return "USERNAME_INVALID";
    if(new RegExp("^(?=.* )(?=.*_).*$").test(username)) return "USERNAME_INVALID";
    return true;
}

function testEmail(email) {
    if (!email) return "NO_EMAIL";
    if(email.length>254) return "EMAIL_TOO_LONG";
    const emailRegex = new RegExp(/^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/);
    if(!emailRegex.test(email)) return "EMAIL_INVALID";
    const parts = email.split("@");
    if(parts[0].length>64) return "EMAIL_INVALID";
    var domainParts = parts[1].split(".");
    if(domainParts.some(part => {
        return part.length > 63
    })) return "EMAIL_INVALID";
    return true;
}

function testIP(ip) {
    const regExp = new RegExp(/((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/g);

    return regExp.test(ip);
}