define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    qtek3d.Shader.import(require("text!shaders/hexagonal_blur.essl"));

    var LensBlur = function(){

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

        var floatTextureParam = {
            width : 1024,
            height : 1024,
            type : 'FLOAT'
        }

        var gammaNode = new qtek3d.compositor.graph.Node({
            shader : require("text!shaders/gamma.essl"),
            groupInputs : {
                "texture" : "texture"
            },
            outputs : {
                "color" : {
                    parameters : floatTextureParam
                }
            }
        });

        var blurPass1 = new qtek3d.compositor.graph.Node({
            shader : qtek3d.Shader.source("emage.hexagonal_blur_1"),
            inputs : {
                "texture" : {
                    node : gammaNode,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {
                    parameters : floatTextureParam
                }
            }
        });

        var blurPass2 = new qtek3d.compositor.graph.Node({
            shader : qtek3d.Shader.source("emage.hexagonal_blur_2"),
            inputs : {
                "texture" : {
                    node : gammaNode,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {
                    parameters : floatTextureParam
                }
            }
        });

        var blurPass3 = new qtek3d.compositor.graph.Node({
            shader : qtek3d.Shader.source("emage.hexagonal_blur_3"),
            inputs : {
                "texture1" : {
                    node : blurPass1,
                    pin : "color"
                },
                "texture2" : {
                    node : blurPass2,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {
                    parameters : floatTextureParam
                }
            }
        });

        var gammaInverseNode = new qtek3d.compositor.graph.Node({
            shader : require("text!shaders/gamma.essl"),
            inputs : {
                "texture" : {
                    node : blurPass3,
                    pin : "color"
                }
            },
            outputs : {
                "color" : {
                    parameters : {
                        width : 1024,
                        height : 1024
                    }
                }
            },
            groupOutputs : {
                "color" : "color"
            }
        });

        this.node.add(gammaNode);
        this.node.add(blurPass1);
        this.node.add(blurPass2);
        this.node.add(blurPass3);
        this.node.add(gammaInverseNode);

        
        var blurSize = 1.0;
        var brightness = 8.0;

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
                    blurPass1.setParameter("blurSize", val);
                    blurPass2.setParameter("blurSize", val);
                    blurPass3.setParameter("blurSize", val);
                }
            },
            brightness : {
                max : 10.0,
                min : 0.0,
                step : 0.1,
                ui : "range",
                get value(){
                    return brightness;
                },
                set value(val){
                    brightness = val;
                    gammaNode.setParameter("gamma", val);
                    gammaInverseNode.setParameter("gamma", 1.0/val);
                }
            }
        }
    }

    LensBlur.prototype = new FX();
    LensBlur.prototype.reset = function(){
        this.parameters.blurSize.value = 0.4;
        this.parameters.brightness.value = 6.0;
    }
    LensBlur.prototype.constructor = LensBlur;

    FX.export("buildin.lensblur", LensBlur);

    return LensBlur;
})