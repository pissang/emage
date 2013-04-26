define(function(require){

    var qpf = require("qpf");
    var Region = require("modules/common/region");
    var appXML = require("text!modules/app.xml");

    var router = require("modules/router");

    var controllerConfig = require("./controllerConfig");

    var Event = qpf.use("core/mixin/event");
        
    //dependency
    require('modules/common/toggle');
    require('modules/common/iconbutton');

    function start(){
        var ko = qpf.use("knockout");
        var XMLParser = qpf.use("core/xmlparser");

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