/**
 * boot the web app
 */
(function(){	
	//=========================
	// CONFIG
	//=========================

	$LAB.setGlobalDefaults({BasePath:'lib/'});
	//=========================
	// Load Library
	//=========================
	$LAB.script("require.js")
		.script("jquery.js")
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
				async	: "lib/async",
				qpf		: "lib/qpf",
				qtek 	: "lib/qtek",
				// fx resource
				fxs : "fx",
				shaders : "shaders"
			}
		})
	}

}).call( this )