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
		FilterView : FilterView
	})
	
	return filters;
})