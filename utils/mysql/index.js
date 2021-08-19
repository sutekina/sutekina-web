module.exports = (pool, query, parameters = []) => {
    return new Promise((resolve, reject) => {
        pool.execute(query, parameters, (error, result, fields) => {
            if(error) return reject(error);

            resolve({result, fields});
        });
    });
}