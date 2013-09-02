define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    qtek3d.Shader.import(require("text!shaders/box_blur.essl"));

    var BoxBlur = function(){
        
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

        var parameters = {
            width : this.imageSize.width,
            height : this.imageSize.height,
            wrapS : 'REPEAT',
            wrapT : 'REPEAT'
        }

        var boxblur_h = new qtek3d.compositor.Node({
            name : "boxblur_h",
            shader : qtek3d.Shader.source("emage.box_blur_h"),
            groupInputs : {
                "texture" : "texture"
            },
            outputs : {
                "color" : {
                    parameters : parameters
                }
            }
        });

        var boxblur_v = new qtek3d.compositor.Node({
            name : "boxblur_v",
            shader : qtek3d.Shader.source("emage.box_blur_v"),
            inputs : {
                "texture" : {
                    node : boxblur_h,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {
                    parameters : parameters
                }
            },
            groupOutputs : {
                "color" : "color"
            }
        });

        this.node.add(boxblur_h);
        this.node.add(boxblur_v);

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
                    boxblur_v.setParameter("blurSize", val);
                    boxblur_h.setParameter("blurSize", val);
                }
            }
        }

        this.reset();
    }

    BoxBlur.prototype = new FX();
    BoxBlur.prototype.reset = function(){
        this.parameters.blurSize.value = 2.0;
    }
    BoxBlur.prototype.constructor = BoxBlur;

    FX.export("buildin.boxblur", BoxBlur);

    return BoxBlur;
})