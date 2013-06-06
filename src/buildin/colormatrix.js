define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var ColorMatrix = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.graph.Node({
            shader : require("text!shaders/colormatrix.essl"),
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

        var colorMatrix = new Float32Array([1, 0, 0, 0,
                                           0, 1, 0, 0,
                                           0, 0, 1, 0,
                                           0, 0, 0, 1]);
        var intensity = 1.0;
        this.parameters = {
            colorMatrix : {
                get value(){
                    return colorMatrix;
                },
                set value(val){
                    colorMatrix = val;
                    node.setParameter("colorMatrix", val);
                }
            },
            intensity : {
                min : 0.0,
                max : 1.0,
                ui : "slider",
                step : 0.01,
                get intensity(){
                    return intensity;
                },
                set intensity(val){
                    intensity = val;
                    node.setParameter("intensity", val);
                }
            }
        }
    }

    ColorMatrix.prototype = new FX();

    ColorMatrix.prototype.constructor = ColorMatrix;

    FX.export("buildin.colormatrix", ColorMatrix);

    return ColorMatrix;
})