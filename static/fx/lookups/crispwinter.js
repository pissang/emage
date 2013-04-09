define({
	name : "Crisp Winter",
	preview : "",

	passes : [{
		name : "Main",
		shader : "imagelookup.essl",

		uniforms : {
			lookup : {
				type : "t",
				value : "texture(lookups/images/crispwinter.png)"
			}
		}
	}]
})