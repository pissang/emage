define({
	name : "Teal Orange Plus Contrast",
	preview : "",

	passes : [{
		name : "Main",
		shader : "imagelookup.essl",

		uniforms : {
			lookup : {
				type : "t",
				value : "texture(lookups/images/tealorangepluscontrast.png)"
			}
		}
	}]
})