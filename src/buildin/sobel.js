define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var Sobel = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.graph.Node({
            shader : require("text!shaders/sobel.essl"),
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

    Sobel.prototype = new FX();

    Sobel.prototype.constructor = Sobel;

    FX.export("buildin.sobel", Sobel);

    return Sobel;
})