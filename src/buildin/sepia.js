define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var ColorMatrix = require("./colormatrix");
    var FX = require("../fx")

    var Sepia = function(){
        
        ColorMatrix.call(this);

        this.parameters.colorMatrix.value = new Float32Array([0.3588, 0.7044, 0.1368, 0.0,
                                                              0.2990, 0.5870, 0.1140, 0.0,
                                                              0.2392, 0.4696, 0.0912 ,0.0,
                                                              0,      0,      0,      1.0]);
    }

    Sepia.prototype = new ColorMatrix();

    Sepia.prototype.constructor = Sepia;

    FX.export("buildin.sepia", Sepia);

    return Sepia;
})