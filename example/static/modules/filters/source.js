define(function(){

function makeImage(src){
    var image = new Image();
    image.src = src;
    return image;
}

var ret = {
    filters : [{
        title : "Gaussian",
        name : "buildin.gaussian",
        preview : "preview/gaussian.jpg",
        description : "",
    },
    {
        title : "lensblur",
        name : "buildin.lensblur",
        preview : "preview/gaussian.jpg",
        description : ""
    },
    {
        title : "Sepia",
        name : "buildin.sepia",
        preview : "preview/sepia.jpg",
        description : ""
    },
    // Color Adjustment
    {
        title : "Miss Etikate",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/missetikate.png")
        }, 
        preview : "preview/missetikate.jpg",
        description : ""
    }, {
        title : "Amatorka",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/amatorka.png")
        }, 
        preview : "preview/amatorka.jpg",
        description : ""
    }, {
        title : "Bleach Bypass",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/bleachbypass.png")
        }, 
        preview : "preview/bleachbypass.jpg",
        description : ""
    }, {
        title : "Candle Light",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/candlelight.png")
        }, 
        preview : "preview/candlelight.jpg",
        description : ""
    }, {
        title : "Crisp Warm",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/crispwarm.png")
        }, 
        preview : "preview/crispwarm.jpg",
        description : ""
    }, {
        title : "Crisp Winter",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/crispwinter.png")
        }, 
        preview : "preview/crispwinter.jpg",
        description : ""
    }, {
        title : "Drop Blues",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/dropblues.png")
        }, 
        preview : "preview/dropblues.jpg",
        description : ""
    }, {
        title : "Edgy Amber",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/edgyamber.png")
        }, 
        preview : "preview/edgyamber.jpg",
        description : ""
    }, {
        title : "Fall Colors",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/fallcolors.png")
        }, 
        preview : "preview/fallcolors.jpg",
        description : ""
    }, {
        title : "Film Stock 50",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/filmstock_50.png")
        }, 
        preview : "preview/filmstock_50.jpg",
        description : ""
    }, {
        title : "Foggy Night",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/foggynight.png")
        }, 
        preview : "preview/foggynight.jpg",
        description : ""
    }, {
        title : "Futuristic Bleak",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/futuristicbleak.png")
        }, 
        preview : "preview/futuristicbleak.jpg",
        description : ""
    }, {
        title : "Horror Blue",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/horrorblue.png")
        }, 
        preview : "preview/horrorblue.jpg",
        description : ""
    }, {
        title : "Late Sunset",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/latesunset.png")
        }, 
        preview : "preview/latesunset.jpg",
        description : ""
    }, {
        title : "Moonlight",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/moonlight.png")
        }, 
        preview : "preview/moonlight.jpg",
        description : ""
    }, {
        title : "Night From Day",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/nightfromday.png")
        }, 
        preview : "preview/nightfromday.jpg",
        description : ""
    }, {
        title : "Soft Warming",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/softwarming.png")
        }, 
        preview : "preview/softwarming.jpg",
        description : ""
    }, {
        title : "Teal Orange Plus...",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/tealorangepluscontrast.png")
        }, 
        preview : "preview/tealorangepluscontrast.jpg",
        description : ""
    }, {
        title : "Tension Green",
        name : "buildin.lut",
        parameters : {
            lookup : makeImage("lut/tensiongreen.png")
        }, 
        preview : "preview/tensiongreen.jpg",
        description : ""
    }, {
        title : "Grayscale",
        name : "buildin.grayscale",
        preview : "preview/grayscale.jpg"
    },
    // {
    //     title : "Soft Elegance",
    //     name : "softelegance",
    //     preview : "softelegance.jpg",
    //     description : ""
    // },
    //
    {
        title : "Sketch",
        name : "buildin.sketch",
        preview : "preview/sketch.jpg"
    },
    {
        title : "Toon",
        name : "buildin.toon",
        preview : "preview/toon.jpg"
    },
    // edge detections
    // {
    //     title : "Sobel Edge Detection",
    //     name : "buildin.sobel",
    //     preview : "sobel.jpg"
    // },
    // {
    //     title : "Threshold Edge Detect",
    //     name : "buildin.thresholdedge",
    //     preview : "threshold.jpg"
    // },
    // {
    //     title : "Canny Edge Detection",
    //     name : "buildin.canny",
    //     preview : "canny.jpg"
    // }
    ]
}
return ret;

})