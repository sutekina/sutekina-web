const {modules, config, app} = require('../main');
const {logging, errorHandling, request, mysql} = require('../utils');
const router = modules['express'].Router();

router.get("/", (req, res, next) => {
    next({code: 501, message: "Not Implemented", level:"debug"});
});

router.get("/:beatmapSetId/:beatmapId?", async (req, res, next) => {
    req.data.page.title = `${req.params.beatmapSetId}`;
    req.data.page.type = "beatmapsets";
    try {
        const beatmapSet = await request({
            hostname: config.local.api.host,
            protocol: "http:",
            port: config.local.api.port,
            path: `/v2/beatmapsets/${req.params.beatmapSetId}`,
            method: "GET"
        }, "json");

        let beatmapId = parseInt(req.params.beatmapId, 10) ? parseInt(req.params.beatmapId) : beatmapSet[0].beatmapId;
        // this is to test if beatmapId exists and is in the set, it's a bit complicated but thats okay.
        beatmapId = beatmapId !== beatmapSet[0].beatmapId && ((await mysql(modules["mysql2"].pool, "SELECT id FROM maps WHERE id = ? AND set_id = ?", [beatmapId, req.params.beatmapSetId])).results[0] || {id: undefined}).id !== undefined ? beatmapId : beatmapSet[0].beatmapId;
        req.data.page.activeBeatmap = req.params.beatmapId || beatmapSet[0].beatmapId;
        req.data.page.beatmapSet = beatmapSet;
        res.render('index', req.data);
    } catch(err) {
        next(new errorHandling.SutekinaError({message: err.message, status: 500, level: "error"}));
    } 
});

module.exports = router;