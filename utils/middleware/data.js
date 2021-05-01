const {modules, config, app} = require('../../main');
module.exports = (req, res, next) => {
    req.data = {
        config: config,
        page: {
            redir: req.query.redir || '/home',
            title: undefined,
            type: "home",
            url: req.path,
        },
        user: {
            id: null,
            name: null
        }
    };
    
    next();
}