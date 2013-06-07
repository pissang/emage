define(function(require){

    var qpf = require("qpf");
    var ko = require("knockout");
    var Module = require("../module");
    var xml = require("text!./navigator.xml");
    var NavLink = require("./navlink");

    var viewport = require("../viewport/index");
    var router = require("../router");

    var nav = new Module({
        name : "navigator",
        xml : xml
    });
    
    nav.$el.delegate(".qpf-ui-navlink", "click", function(){
        var $this= $(this),
            navlink = $this.qpf("get")[0];
        if( navlink ){
            switch(navlink.icon()){
                case "camera":
                    // switchToCamera();
                    break;
                case "cloud":
                    // switchToCloud();
            }
        }
        nav.$el.find(".qpf-ui-navlink").removeClass("active");
        $this.addClass("active");
    })
    var video;
    
    function switchToCamera(){
        viewport.on("beforerender", function(){
            tex.needsUpdate = true;
        })
        var videoObj = {
            video : true
        }
        // use camera
        if(navigator.getUserMedia) { // Standard
            navigator.getUserMedia(videoObj, function(stream) {
                video.src = stream;
                video.play();
            }, errBack);
        } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
            navigator.webkitGetUserMedia(videoObj, function(stream){
                video.src = window.webkitURL.createObjectURL(stream);
                video.play();
            }, errBack);
        }; 
        function errBack(){
            console.log(arguments);
        }
    }

    return nav;
})