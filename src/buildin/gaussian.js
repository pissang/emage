define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var Gaussian = function(){
        
        FX.call(this);

        this.node = new qtek3d.compositor.Group({
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

        var gaussian_h = new qtek3d.compositor.Node({
            name : "gaussian_h",
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

        var gaussian_v = new qtek3d.compositor.Node({
            name : "gaussian_v",
            shader : qtek3d.Shader.source("buildin.compositor.gaussian_blur_v"),
            inputs : {
                "texture" : {
                    node : gaussian_h,
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

        this.node.add(gaussian_h);
        this.node.add(gaussian_v);

        var blurSize = 2.0;

        // Parameters of gaussian blur
        this.parameters = {
            blurSize : {
                max : 10.0,
                min : 0.0,
                step : 0.1,
                ui : "slider",
                get value(){
                    return blurSize;
                },
                set value(val){
                    blurSize = val;
                    gaussian_v.setParameter("blurSize", val);
                    gaussian_h.setParameter("blurSize", val);
                }
            }
        }

        this.reset();
    }

    Gaussian.prototype = new FX();
    Gaussian.prototype.reset = function(){
        this.parameters.blurSize.value = 2.0;
    }
    Gaussian.prototype.constructor = Gaussian;

    FX.export("buildin.gaussian", Gaussian);

    return Gaussian;
})