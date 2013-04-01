define(function(require){
	
	var qpf = require("qpf"),
		ko = qpf.use("knockout"),
		Container = qpf.use('components/container/container');

	var ConfigItem = Container.derive(function(){

	}, {
		type : 'CONFIGITEM',

		css : 'configitem'

	});

	Container.provideBinding("configitem", ConfigItem);

	return ConfigItem;
})