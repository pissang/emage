define(function(require){

	var Module = require("../module"),
		xml = require("text!./layers.xml"),
		Layer = require("./layer"),
		List = require("../common/list"),
		Manager = require("../ppmanager/manager");

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