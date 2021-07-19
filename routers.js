module.exports = [
    {   
        "url": "/home",
        "export": require("./routers/home")
    },
    {   
        "url": "/leaderboard",
        "export": require("./routers/leaderboard")
    }
    ,
    {   
        "url": "/users",
        "export": require("./routers/users")
    }
]