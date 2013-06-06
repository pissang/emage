define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var Sketch = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.graph.Node({
            shader : require("text!shaders/sketch.essl"),
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

    Sketch.prototype = new FX();

    Sketch.prototype.constructor = Sketch;

    FX.export("buildin.sketch", Sketch);

    return Sketch;
})