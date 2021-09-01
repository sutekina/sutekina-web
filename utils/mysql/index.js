const logging = require("../logging");
module.exports = (pool, query, parameters = []) => {
    return new Promise((resolve, reject) => {
        pool.execute(query, parameters, (error, result, fields) => {
            logging.trace(query);
            if(error) return reject(error);

            resolve({result, fields});
        });
    });
}