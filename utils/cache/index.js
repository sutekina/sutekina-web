class Cache {
    constructor() {
        Cache.data = {};
    }
};

Cache.data = {};

Cache.get = (key) => {
    if(!key) throw new Error("Please enter a key.");
    if(Cache.data[key]) return Cache.data[key];
};

Cache.set = (key, value) => {
    Cache.data[key] = value;
};

Cache.size = () => JSON.stringify(Cache.data).length;

Cache.reset = () => {
    if(Cache.size() > 10000) new Cache();
};

module.exports = Cache;