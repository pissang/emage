define(function(require){

	var qpf 		= require("qpf"),
		Region 		= require("modules/common/region"),
		appXML		= require("text!modules/app.xml"),

		router		= require("modules/router"),

		controllerConfig = require("./controllerConfig"),

		Event 		= qpf.use("core/mixin/event");
        
	function start(){
		var ko = qpf.use("knockout"),
			XMLParser = qpf.use("core/xmlparser");

		var dom = XMLParser.parse(appXML);

		document.body.appendChild( dom );
		
		ko.applyBindings(controllerConfig, dom);
		
		router.init("/");
	}

	var app = {
		
		start : start

	}
	_.extend(app, Event);

	return app;
})