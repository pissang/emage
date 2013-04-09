define(function(require){

	var qpf = require("qpf"),
		Button = qpf.use("components/meta/button"),
		Meta = qpf.use("components/meta/meta"),
		ko = qpf.use("knockout");

	var IconButton = Button.derive(function(){
		return {
			$el : $("<div></div>"),
			icon : ko.observable("")
		}
	}, {
		type : "ICONBUTTON",
		css : _.union("icon-button", Button.prototype.css),

		template : '<div class="qpf-icon" data-bind="css:icon"></div>',
	})

	Meta.provideBinding("iconbutton", IconButton);

	return IconButton;

})