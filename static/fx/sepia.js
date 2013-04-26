define({
    name : "Sepia",
    description : "Sepia",
    preview : "",

    passes : [{
        name : "ColorMatrix",
        shader : "colormatrix.essl",

        uniforms : {
            intensity : {
                value : 1.0,
                type : "f"
            },
            colorMatrix : {
                type : "m4",
                value : "mat4(0.3588, 0.2990, 0.2392, 0.0,\
                                0.7044, 0.5870, 0.4696, 0.0,\
                                0.1368, 0.1140, 0.0912 ,0.0,\
                                0,0,0,1.0)"
            }
        }
    }]
})