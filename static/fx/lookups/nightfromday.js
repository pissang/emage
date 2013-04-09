define({
	name : "Night From Day",
	preview : "",

	passes : [{
		name : "Main",
		shader : "imagelookup.essl",

		uniforms : {
			lookup : {
				type : "t",
				value : "texture(lookups/images/nightfromday.png)"
			}
		}
	}]
})