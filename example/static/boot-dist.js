/**
 * boot the web app
 */
(function(){    
    //=========================
    // CONFIG
    //=========================

    this["LIB_PATH"]    = "lib/";

    $LAB.setGlobalDefaults({BasePath:LIB_PATH});
    //=========================
    // Load Library
    //=========================
    $LAB.script("lib.js")
        .wait(boot);

    //========================
    // Load Main Module
    //========================
    function boot(){

        config();
        
        // ZipClipboard
        ZeroClipboard.setMoviePath("resource/ZeroClipboard.swf");

        require(["app"], function(app){
            app.start();
        })
    }


    function config(){

    }

}).call( this )