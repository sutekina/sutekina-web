const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/", (req, res, next) => {
    req.data.page.title = "leaderboard";
    req.data.page.type = "leaderboard";

    req.data.sample = [{"id":38,"name":"Len","country":"iq","privilege":3,"creationTime":1612584807,"playtime":136,"playcount":4,"pp":0,"accuracy":0,"globalRank":58,"countryRank":1},{"id":104,"name":"Superior","country":"au","privilege":3,"creationTime":1625719205,"playtime":1053,"playcount":45,"pp":0,"accuracy":0,"globalRank":58,"countryRank":1},{"id":47,"name":"Dash","country":"xx","privilege":3,"creationTime":1612635686,"playtime":293,"playcount":3,"pp":0,"accuracy":0,"globalRank":58,"countryRank":32},{"id":93,"name":"bort","country":"us","privilege":3,"creationTime":1620843898,"playtime":0,"playcount":0,"pp":0,"accuracy":0,"globalRank":58,"countryRank":8},{"id":55,"name":"ExoticEmerald","country":"xx","privilege":3,"creationTime":1612835989,"playtime":0,"playcount":0,"pp":0,"accuracy":0,"globalRank":58,"countryRank":32},{"id":81,"name":"Coachette","country":"xx","privilege":3,"creationTime":1619561853,"playtime":0,"playcount":0,"pp":0,"accuracy":0,"globalRank":58,"countryRank":32},{"id":19,"name":"DropOmar","country":"xx","privilege":3,"creationTime":1612149452,"playtime":45,"playcount":3,"pp":0,"accuracy":0,"globalRank":58,"countryRank":32},{"id":69,"name":"meramipop fan","country":"xx","privilege":3,"creationTime":1615995932,"playtime":0,"playcount":0,"pp":0,"accuracy":0,"globalRank":58,"countryRank":32},{"id":39,"name":"cant","country":"xx","privilege":3,"creationTime":1612592067,"playtime":891,"playcount":13,"pp":0,"accuracy":0,"globalRank":58,"countryRank":32},{"id":85,"name":"Blarrz","country":"nl","privilege":3,"creationTime":1619719004,"playtime":674,"playcount":6,"pp":0,"accuracy":97.97200012207031,"globalRank":58,"countryRank":1}];
    res.render('index', req.data);
});

module.exports = router;