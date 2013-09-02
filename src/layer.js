define(function(require){

    var qtek = require("qtek");
    var FX = require("./fx");

    var Layer = function(fxName){

        this.fx = null;
        this.enabled = true;

        this.prevSibling = null;
        this.nextSibling = null;

        this._fxCaches = {};

        if(fxName){
            this.use(fxName);
        }
    }

    Layer.prototype.use = function(fxName){
        var fx = this._fxCaches[fxName];
        if(!fx){
            fx = FX.create(fxName);
        }else{
            fx.reset();
        }
        if(fx){
            fx.input = this.prevSibling;
            this._fxCaches[fxName] = fx;
            this.fx = fx;
            return fx;
        }
    }

    Layer.prototype.set = function(name, value){
        if( ! name){
            return;
        }
        if(typeof(name) === "object"){
            var obj = name;
            for(var name in obj){
                this.set(name, obj[name]);
            }
            return;
        }
        if( this.fx &&
            this.fx.parameters[name]){
            this.fx.parameters[name].value = value;
        }
    }

    // Buildin fxs
    // Most from GPUImage
    // https://github.com/BradLarson/GPUImage
    require("./buildin/gaussian");
    require("./buildin/lensblur");
    require("./buildin/boxblur");
    require("./buildin/coloradjust");
    require("./buildin/hue");
    require("./buildin/colormatrix");
    require("./buildin/sepia");
    require("./buildin/lut");
    require("./buildin/sobel");
    require("./buildin/sketch");
    require("./buildin/toon");
    require("./buildin/grayscale");

    return Layer;
})