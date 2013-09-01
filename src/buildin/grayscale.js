define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var GrayScale = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.Node({
            shader : qtek3d.Shader.source("buildin.compositor.grayscale"),
            inputs : {
                "texture" : {
                    node : null,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {}
            }
        })
        this.node = node;
    }

    GrayScale.prototype = new FX();

    GrayScale.prototype.constructor = GrayScale;

    FX.export("buildin.grayscale", GrayScale);

    return GrayScale;
})