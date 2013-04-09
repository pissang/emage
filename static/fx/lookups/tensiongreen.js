define({
	name : "Tension Green",
	preview : "",

	passes : [{
		name : "Main",
		shader : "imagelookup.essl",

		uniforms : {
			lookup : {
				type : "t",
				value : "texture(lookups/images/tensiongreen.png)"
			}
		}
	}]
})