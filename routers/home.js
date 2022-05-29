const {modules, config, app} = require('../main');
const {logging, errorHandling, request} = require('../utils');
const router = modules['express'].Router();

router.get("/", async (req, res, next) => {
    req.data.page.title = "home";
    let userCount;
    try {
        userCount = await request({
            hostname: `gulag.${config.domains.base}`,
            protocol: "https:",
            port: 443,
            path: `/get_player_count`,
            method: "GET"
        }, "json");
    } catch(err) {
        next(new errorHandling.SutekinaError({message: err.message, status: 500, level: "error"}));
    }
    req.data.page.userCount = userCount.counts;
    
    res.render('index', req.data);
});

router.get("/account/edit", (req, res, next) => {
    res.redirect(301, "/account/settings");
});

module.exports = router;