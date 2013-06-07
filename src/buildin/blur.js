define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var Blur = function(){
        
        FX.call(this);

        this.node = new qtek3d.compositor.graph.Group({
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

        var blur_h = new qtek3d.compositor.graph.Node({
            shader : qtek3d.Shader.source("buildin.compositor.gaussian_blur_h"),
            groupInputs : {
                "texture" : "texture"
            },
            outputs : {
                "color" : {
                    parameters : this.imageSize
                }
            }
        });

        var blur_v = new qtek3d.compositor.graph.Node({
            shader : qtek3d.Shader.source("buildin.compositor.gaussian_blur_v"),
            inputs : {
                "texture" : {
                    node : blur_h,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {
                    parameters : this.imageSize
                }
            },
            groupOutputs : {
                "color" : "color"
            }
        });

        this.node.add(blur_h);
        this.node.add(blur_v);

        var blurSize = 1.0;

        // Parameters of gaussian blur
        this.parameters = {
            blurSize : {
                max : 10.0,
                min : 0.0,
                step : 0.1,
                ui : "range",
                get value(){
                    return blurSize;
                },
                set value(val){
                    blurSize = val;
                    blur_v.setParameter("blurSize", val);
                    blur_h.setParameter("blurSize", val);
                }
            }
        }
    }

    Blur.prototype = new FX();
    Blur.prototype.reset = function(){
        this.parameters.blurSize.value = 2.0;
    }
    Blur.prototype.constructor = Blur;

    FX.export("buildin.gaussian", Blur);

    return Blur;
})