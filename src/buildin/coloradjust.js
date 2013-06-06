define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var FX = require("../fx");

    var ColorAdjust = function(){
        
        FX.call(this);

        var node = new qtek3d.compositor.graph.Node({
            shader : qtek3d.Shader.source("buildin.compositor.coloradjust"),
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

        var brightness = 0.0,
            contrast = 1.0,
            exposure = 0.0,
            gamma = 1.0,
            saturation = 1.0;

        this.parameters = {
            brightness : {
                max : 1.0,
                min : -1.0,
                step : 0.1,
                ui : "range",
                get value(){
                    return brightness;
                },
                set value(val){
                    brightness = val;
                    node.setParameter("brightness", val);
                }
            },
            contrast : {
                max : 4.0,
                min : 0.0,
                step : 0.1,
                ui : "range",
                get value(){
                    return contrast;
                },
                set value(val){
                    contrast = val;
                    node.setParameter("contrast", val);
                }
            },
            exposure : {
                max : 10.0,
                min : -10.0,
                step : 0.1,
                ui : "range",
                get value(){
                    return exposure;
                },
                set value(val){
                    exposure = val;
                    node.setParameter("exposure", val);
                }
            },
            gamma : {
                max : 3.0,
                min : 0.0,
                step : 0.1,
                ui : "range",
                get value(){
                    return gamma;
                },
                set value(val){
                    gamma = val;
                    node.setParameter("gamma", val);
                }
            },
            saturation : {
                max : 10.0,
                min : 0.0,
                step : 0.1,
                ui : "range",
                get value(){
                    return saturation;
                },
                set value(val){
                    saturation = val;
                    node.setParameter("saturation", val);
                }
            }
        }

        this.reset();
    }

    ColorAdjust.prototype = new FX();
    ColorAdjust.prototype.reset = function(){
        this.parameters.brightness.value = 0.0;
        this.parameters.exposure.value = 0.0;
        this.parameters.contrast.value = 1.0;
        this.parameters.saturation.value = 1.0;
        this.parameters.gamma.value = 1.0;
    }
    ColorAdjust.prototype.constructor = ColorAdjust;

    FX.export("buildin.coloradjust", ColorAdjust);

    return ColorAdjust;
})