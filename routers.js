module.exports = [
    {   
        "url": "/home",
        "export": require("./routers/home")
    },
    {   
        "url": "/leaderboard",
        "export": require("./routers/leaderboard")
    },
    {   
        "url": "/users",
        "export": require("./routers/users")
    },
    {   
        "url": "/clans",
        "export": require("./routers/clans")
    },
    {   
        "url": "/beatmaps",
        "export": require("./routers/beatmaps")
    },
    {

        "url": "/rules",
        "export": require("./routers/rules")

    },
    {

        "url": "/team",
        "export": require("./routers/team")
    },
]