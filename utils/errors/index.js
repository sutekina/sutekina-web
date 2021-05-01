module.exports = {
    SutekinaError: class extends Error {  
        constructor ({message, status, level}) {
            if(!message) message = module.exports.ErrorStatusCodes[status || 500];
            super(message);
            
            this.status = status || 500;
            this.name = this.constructor.name;
            this.level = level || "error";
        }
    },
    ErrorStatusCodes: require("./ErrorStatusCodes.json"),
    LoginErrors: require("./LoginErrors.json")
}