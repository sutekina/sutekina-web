const {modules, config, app} = require('../main');
const {logging, errorHandling, mysql} = require('../utils');
const router = modules['express'].Router();
const pool = modules["mysql2"].pool;

router.get("/", (req, res, next) => {
    res.redirect(301, "/beatmapsets");
});
router.get("/:beatmapId", async (req, res, next) => {
    let {results} = await mysql(pool, `SELECT set_id FROM maps WHERE id = ? LIMIT 1;`, [req.params.beatmapId]);
    if(!results || !results[0]) next(new errorHandling.SutekinaError({message: "Beatmap couldn't be found", status: 404, level: "debug"}));
    res.redirect(301, `/beatmapsets/${results[0].set_id}/${req.params.beatmapId}`);
});

module.exports = router;