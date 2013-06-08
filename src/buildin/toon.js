define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var Toon = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.graph.Node({
            shader : require("text!shaders/toon.essl"),
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

        var threshold = 0.2,
            quantizationLevels = 10;
        this.parameters = {
            threshold : {
                ui : "slider",
                min : 0,
                max : 2,
                get value(){
                    return threshold;
                },
                set value(val){
                    threshold = val;
                    node.setParameter("threshold", val);
                }
            },
            quantizationLevels : {
                ui : "spinner",
                min : 2,
                precision : 0,
                get value(){
                    return quantizationLevels;
                },
                set value(val){
                    quantizationLevels = val;
                    node.setParameter("quantizationLevels", val);
                }
            }
        }
    }

    Toon.prototype = new FX();

    Toon.prototype.constructor = Toon;

    Toon.prototype.reset = function(){
        this.parameters.threshold.value = 0.2;
        this.parameters.quantizationLevels.value = 10;
    }

    FX.export("buildin.toon", Toon);

    return Toon;
})