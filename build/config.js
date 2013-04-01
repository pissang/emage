({
	appDir : '../static',
	// 这里baseUrl是../static的话就会把app.js覆盖掉不知道为什么
	baseUrl : "./",
	dir : "../static-dist",
	paths : {
		async	: "lib/async",
		qpf		: "lib/qpf"
	},
	shim : {
		"app" : ["modules/common/list.js", 
				"modules/common/iconbutton", 
				"modules/common/modal", 
				"modules/common/region"]
	},
	modules : [{
		name : "app"
	}]
})