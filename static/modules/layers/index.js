define(function(require){

    var Module = require("../module");
    var xml = require("text!./layers.xml");
    var Layer = require("./layer");
    var List = require("../common/list");
    var Manager = require("../ppmanager/manager");

    var layers = new Module({
        name : "layers",
        xml : xml,

        Layer  : Layer,
        manager : new Manager()
    })

    layers.manager.add("coloradjust");

    layers.setFilter = function(filterName){
        layers.manager.fxs( _.filter(layers.manager.fxs(), function(fx){
            if( fx.__filter__){
                fx.dispose && fx.dispose();
            }else{
                return true;
            }
        } ) );
        layers.manager.add(filterName, function(fx){
            fx.__filter__ = true;
        });
    }
    
    return layers;
})