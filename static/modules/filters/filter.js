define(function(require){
	var qpf = require("qpf"),
		Widget = qpf.use("components/widget/widget"),
		ko = qpf.use("knockout"),
		filterHTML = require("text!./filter.html"),
		layers = require("../layers/index");

	var Filter = Widget.derive(function(){

		var viewModel = {
			title : ko.observable(""),
			icon : ko.observable(""),
			description : ko.observable(""),

			// filter name will be used in finding the fx file
			name : ko.observable(""),

			use : function(){
				layers.setFilter(this.name());
			}
		}

		viewModel._iconSrc = ko.computed(function(){
			if( viewModel.icon() ){
				return "../../fx/icons/" + viewModel.icon()
			}
		})
		return viewModel;
	}, {

		type : "FILTER",
		css : "filter",

		template : filterHTML
	});

	return Filter;
})