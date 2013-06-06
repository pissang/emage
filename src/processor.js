define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek['3d'];
    var Layer = require("./layer");
    var FX = require("./fx");

    var Processor = function(canvas){

        this.canvas = canvas || document.createElement("canvas");

        this.renderer = new qtek3d.Renderer({
            canvas : this.canvas,
            devicePixelRatio : 1.0
        });
        this.scale = 1.0;
        this.compositor = new qtek3d.Compositor();

        this.layers = [];

        this._inputNode = new qtek3d.compositor.graph.TextureNode({
            texture : new qtek3d.texture.Texture2D({
                image : null
            }),
            outputs : {
                "color" : {
                    parameters : {
                        width : 1024,
                        height : 1024
                    }
                }
            }
        });
        this._outputNode = new qtek3d.compositor.graph.Node({
            shader : qtek3d.Shader.source("buildin.compositor.output"),
            inputs : {
                "texture" : {
                    node : null,
                    pin : "color"
                }
            }
        })

        this._imageChanged = true;
        Object.defineProperty(this, "image", {
            set : function(value){
                this._inputNode.texture.image = value;
                this._inputNode.texture.dirty();
                this._imageChanged = true;
            },
            get : function(value){
                return this._inputNode.texture.image
            }
        })
    }

    Processor.prototype.add = function(layer){
        this.layers.push(layer);
    }
    Processor.prototype.remove = function(layer){
        var idx = this.layers.indexOf(layer);
        this.layers.splice(idx, 1);
    }
    Processor.prototype.update = function(){

        var layers = [];
        // Filter the enabled layer
        for(var i = 0; i < this.layers.length; i++){
            var layer = this.layers[i];
            if(layer.enabled && layer.fx){
                layers.push(this.layers[i]);
            }
        }
        // Update linked list
        for(var i = 0; i < layers.length; i++){
            var layer = layers[i],
                layerPrev = layers[i-1] || null,
                layerNext = layers[i+1] || null;
            layer.prevSibling = layerPrev;
            layer.nextSibling = layerNext;
            if(layerPrev){
                layer.fx.input = layerPrev.fx.node;
            }
        }
        if(layers.length){
            this._outputNode.inputs['texture'].node = layers[layers.length-1].fx.node;
            layers[0].fx.input = this._inputNode;
        }else{
            this._outputNode.inputs.texture.node = this._inputNode;
        }

        var width = this.image.width * this.scale;
        var height = this.image.height * this.scale;

        if(this._imageChanged){
            this.renderer.resize( width, height );
        }

        this.compositor.nodes = [];
        // Update graph
        for(var i = 0; i < layers.length; i++){
            this.compositor.add(layers[i].fx.node);
            if(this._imageChanged){
                layers[i].fx.setImageSize(width, height);
            }
        }
        this._inputNode.outputs.color.parameters = {
            width : width,
            height : height
        }
        this.compositor.add(this._inputNode);
        this.compositor.add(this._outputNode);
    
        this.compositor.render(this.renderer);
    }

    return Processor;
})