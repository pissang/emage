define(function(require){
	var qpf = require("qpf"),
		Widget = qpf.use("components/widget/widget"),
		ko = qpf.use("knockout"),
		layerHTML = require("text!./layer.html");

	var Layer = Widget.derive(function(){

		return {
			title : ko.observable(""),
			parameters : ko.observableArray()
		}
	}, {

		type : "Layer",
		css : "layer",

		template : layerHTML
	});

	return Layer;
})