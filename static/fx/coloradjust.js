define({

    name : "Color Adjustment",
    description : "",
    preview : "",

    passes : [{
        name : "Main",
        shader : "coloradjust.essl",

        uniforms : {
            brightness : {
                name : "Brightness",
                type : "f",
                ui : "range",
                min : -1,
                max : 1,
                precision : 2,
                value : 0
            },
            contrast : {
                name : "Contrast",
                type : "f",
                ui : "range",
                min : 0,
                max : 4,
                precision : 2,
                value : 1.0
            },
            exposure : {
                name : "Exposure",
                type : "f",
                ui : "range",
                min : -10,
                max : 10,
                precision : 1,
                value : 0
            },
            gamma : {
                name : "Gamma",
                type : "f",
                ui : "range",
                min : 0,
                max : 3,
                precision : 2,
                value : 1
            },
            saturation : {
                name : "Saturation",
                type : "f",
                ui : "range",
                min : 0,
                max : 2,
                precision : 2,
                value : 1
            }
        }
    }]
})