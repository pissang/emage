define(function(require){

	var Module = require("../module"),
		xml = require("text!./filters.xml"),
		qpf = require("qpf"),
		FilterView = require("./filter"),
		dataSource = require("./source"),
		layers = require("../layers/index"),

		ko = qpf.use('knockout');

	var filters = new Module({
		name : "filters",
		xml : xml,

		filters : ko.observableArray( dataSource.filters ),
		FilterView : FilterView,

		seachKeyword : ko.observable("")
	})

	filters.seachKeyword.subscribe(function(newValue){
		if( ! newValue ){
			filters.filters( dataSource.filters );
		}else{
			filters.filters( _.filter(filters.filters(), function(value){
				return value.name.indexOf( newValue.toLowerCase() ) >= 0 ||
						value.title.indexOf( newValue )>=0;
			}) )	
		}
	})

	// preload 
	var cursor = 0;
	function preload(){
		var item = dataSource.filters[cursor];
		if( item ){
			layers.manager.load( item.name, function(){
				cursor++;
				preload();
			} );
		}
	}
	preload();

	return filters;
})