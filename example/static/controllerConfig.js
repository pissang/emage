// controller defines how and when the modules are loaded
// todo : add priority??
define({
    //---------region: main navigator-------------
    "navigator" : {
        "modules/navigator/index" : {
            "url" : "*"
        }
    },
    "viewport" : {
        "modules/viewport/index" : {
            "url" : "*"
        }
    },
    "filters" : {
        "modules/filters/index" : {
            "url" : "*"
        }
    },
    "imageList" : {
        "modules/imagelist/index" : {
            "url" : "*"
        }
    }
})