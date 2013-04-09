define({
	name : "Crisp Warm",
	preview : "",

	passes : [{
		name : "Main",
		shader : "imagelookup.essl",

		uniforms : {
			lookup : {
				type : "t",
				value : "texture(lookups/images/crispwarm.png)"
			}
		}
	}]
})