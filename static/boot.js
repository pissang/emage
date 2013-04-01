/**
 * boot the web app
 */
(function(){	
	//=========================
	// CONFIG
	//=========================

	this["LIB_PATH"] 	= "lib/";

	$LAB.setGlobalDefaults({BasePath:LIB_PATH});
	//=========================
	// Load Library
	//=========================
	$LAB.script("require.js")
		.script("jquery.js")
		.script("jquery.mockjax.js")
		.script("director.js")
		.script("underscore.js")
		.script('ZeroClipboard.js')
		.script("three.js")
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

		requirejs.config({
			paths : {
				async	: LIB_PATH + "async",
				qpf		: LIB_PATH + "qpf",

				// fx resource
				fxs : "fx",
				shaders : "shaders"
			},
			shim : {
				"app" : [// 公用的组件
						"modules/common/list.js", 
						"modules/common/iconbutton", 
						"modules/common/modal", 
						"modules/common/region"]
			}
		})
	}

}).call( this )