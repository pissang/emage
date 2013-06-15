/**
 * Interface for all fx
 * Each fx input texture channel and output color channel
 */
define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];

    var FX = function(){
        this.node = null;
        this.input = null;

        this.parameters = {};

        this.imageSize = {
            width : 512,
            height : 512
        }

        Object.defineProperty(this, "input", {
            set : function(value){
                if(this.node){
                    this.node.inputs.texture.node = value;
                }
            },
            get : function(){
                return this.node.inputs.texture.node;
            }
        });
    }

    FX.prototype.reset = function(){};
    FX.prototype.dispose = function(){

    };
    FX.prototype.setImageSize = function(width, height){
        if( ! this.node){
            return;
        }
        if(this.node.instanceof(qtek3d.compositor.graph.Group)){
            for(var i = 0; i < this.node.nodes.length; i++){
                var node = this.node.nodes[i];
                node.setParameters({
                    imageWidth : width,
                    imageHeight : height
                })
                if(node.outputs){
                    for(var name in node.outputs){
                        var info = node.outputs[name];
                        if( ! info.parameters){
                            info.parameters = {
                                width : width,
                                height : height
                            }
                        }else if( ! info.parameters.width){
                            info.parameters.width = width;
                            info.parameters.height = height;
                        }
                    }
                }
            }
        }else{
            this.node.setParameters({
                imageWidth : width,
                imageHeight : height
            })
            var node = this.node;
            if(node.outputs){
                for(var name in node.outputs){
                    var info = node.outputs[name];
                    if( ! info.parameters){
                        info.parameters = {
                            width : width,
                            height : height
                        }
                    }else if( ! info.parameters.width){
                        info.parameters.width = width;
                        info.parameters.height = height;
                    }
                }
            }
        }
    }

    var fxFactory = {};
    FX.export = function(name, constructor){
        fxFactory[name] = constructor;
    }
    FX.create = function(name){
        if(fxFactory[name]){
            var fx = new fxFactory[name]();
        }else{
            console.error("FX " + name + " not exist");
            return;
        }
        return fx;
    }

    return FX;
})