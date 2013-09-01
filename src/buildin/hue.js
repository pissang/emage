define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var Hue = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.Node({
            shader : require("text!shaders/hue.essl"),
            inputs : {
                "texture" : {
                    node : null,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {}
            }
        });
        this.node = node;

        var hue = 0;
        this.parameters = {
            hue : {
                max : 180,
                min : -180,
                precision : 1.0,
                ui : 'slider',
                get value(){
                    return hue;
                },
                set value(val){
                    hue = val;
                    node.setParameter('hueAdjust', val / 180.0 * Math.PI);
                }
            }
        }

        this.reset();
    }

    Hue.prototype = new FX();

    Hue.prototype.constructor = Hue;

    Hue.prototype.reset = function(){
        this.parameters.hue.value = 0;
    }

    FX.export("buildin.hue", Hue);

    return Hue;
})