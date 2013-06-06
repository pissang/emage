({
    appDir : '../static',
    baseUrl : "./",
    dir : "../static-dist",
    paths : {
        async   : "lib/async",
        qpf     : "lib/qpf",
        qtek    : "lib/qtek"
    },
    shim : {
        "app" : ["modules/filters/index",
                "modules/histogram/index",
                "modules/imagelist/index",
                "modules/layers/index",
                "modules/navigator/index",
                "modules/viewport/index"]
    },
    modules : [{
        name : "app"
    }]
})