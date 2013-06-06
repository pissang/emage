define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var LUT = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.graph.Node({
            shader : require("text!shaders/lut.essl"),
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

        var lookup = new qtek3d.texture.Texture2D({
            minFilter : "NEAREST",
            magFilter : 'NEAREST',
            generateMipmaps : false,
            flipY : false
        });
        node.setParameter("lookup", lookup);

        this.parameters = {
            lookup : {
                get value(){
                    return lookup.image
                },
                set value(val){
                    lookup.image = val;
                    lookup.dirty();
                }
            }
        }
    }

    LUT.prototype = new FX();

    LUT.prototype.constructor = LUT;

    FX.export("buildin.lut", LUT);

    return LUT;
})