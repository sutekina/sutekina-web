const {modules, config, app} = require('../main');
const {logging, errorHandling, request, mysql, Cache} = require('../utils');
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
            path: `/v2/beatmapsets/${req.params.beatmapSetId}?ascending=true`,
            method: "GET"
        }, "json");
        
        if(!beatmapSet[0]) return next(new errorHandling.SutekinaError({message: "Beatmapset not Found", status: 404, level: "debug"}));
        
        // this is required because osu avatar server only works with id but we store username for mapper.
        let creatorId = Cache.get(beatmapSet[0].creator);

        if(!creatorId) {
            try {
                const creator = await request({
                    hostname: "osu.ppy.sh",
                    protocol: "https:",
                    port: "443",
                    path: `/api/get_user?u=${encodeURI(beatmapSet[0].creator)}&type=string&k=${config.authentication.osu}`,
                    method: "GET"
                }, "json");

                creatorId = creator[0] ? creator[0].user_id : undefined;
                Cache.set(beatmapSet[0].creator, creatorId);
            } catch (err) {
                // we dont cache here cause the osu api request failed so we wanna keep requesting in case it'll work in the future
                creatorId = undefined;
            }
        }

        req.data.page.title = `${beatmapSet[0].artist} - ${beatmapSet[0].title}`
        let beatmapId = parseInt(req.params.beatmapId, 10) ? parseInt(req.params.beatmapId) : beatmapSet[0].beatmapId;
        // this is to test if beatmapId exists and is in the set, it's a bit complicated but thats okay.
        beatmapId = beatmapId !== beatmapSet[0].beatmapId && ((await mysql(modules["mysql2"].pool, "SELECT id FROM maps WHERE id = ? AND set_id = ?", [beatmapId, req.params.beatmapSetId])).results[0] || {id: undefined}).id !== undefined ? beatmapId : beatmapSet[0].beatmapId;
        
        const beatmapScores = await request({
            hostname: config.local.api.host,
            protocol: "http:",
            port: config.local.api.port,
            path: `/v2/beatmaps/${beatmapId}/scores?limit=50&order=score&ascending=false&scoreStatus=2&beatmapStatus=2&mod=vn&mode=std`,
            method: "GET"
        }, "json");
        
        let selfScore = [];
        if(req.data.user.id) selfScore = await request({
            hostname: config.local.api.host,
            protocol: "http:",
            port: config.local.api.port,
            path: `/v2/beatmaps/${beatmapId}/scores/user/${req.data.user.id}?limit=1&order=score&ascending=false&scoreStatus=2&beatmapStatus=2&mod=vn&mode=std`,
            method: "GET"
        }, "json");

        req.data.page.activeBeatmap = beatmapSet.filter(bm => bm.beatmapId == beatmapId)[0];
        req.data.page.beatmapSet = beatmapSet;
        req.data.page.beatmapScores = beatmapScores;
        req.data.page.selfScore = selfScore;
        req.data.page.creatorId = creatorId;
        res.render('index', req.data);
    } catch(err) {
        next(new errorHandling.SutekinaError({message: err.message, status: 500, level: "error"}));
    } 
});

module.exports = router;