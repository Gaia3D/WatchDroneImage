

function f4d_PostFx_Shader(gl)
{
	// shader program.***
	this.program = undefined;
	this.shader_vertex = undefined;
	this.shader_fragment = undefined;
	
	// attributes.***
	this.position3_loc = undefined;
	this.color3_loc = undefined;
	this.normal3_loc = undefined;
	this.texCoord2_loc = undefined;
	
	// uniforms matrix.***
	this.projectionMatrix4_loc = undefined; // usually no used.***
	this.modelViewMatrix4_loc = undefined;
	this.modelViewProjectionMatrix4_loc = undefined;
	this.modelViewMatrix4RelToEye_loc = undefined;
	this.modelViewProjectionMatrix4RelToEye_loc = undefined;
	this.normalMatrix4_loc = undefined;
	this.normalMatrix3_loc = undefined;
	this.RefTransfMatrix = undefined;
	
	// uniform vectors.***
	this.buildingPosHIGH_loc = undefined;
	this.buildingPosLOW_loc = undefined;
	this.cameraPosHIGH_loc = undefined;
	this.cameraPosLOW_loc = undefined;
	this.noiseScale2_loc = undefined;
	this.kernel16_loc = undefined;
	
	// uniform values.***
	this.near_loc = undefined;
	this.far_loc = undefined;
	this.fov_loc = undefined;
	this.aspectRatio_loc = undefined;
	this.screenWidth_loc = undefined;
	this.screenHeight_loc = undefined;
	
	// uniform samplers.***
	this.diffuseTex_loc = undefined;
	this.depthTex_loc = undefined;
	this.noiseTex_loc = undefined;
	
	// blur.***
	this.texelSize_loc = undefined;
	this.colorTex_loc = undefined;
	
	// Model Reference meshes.***
	this.useRefTransfMatrix_loc = undefined;
	this.useTexture_loc = undefined;
	this.invertNormals_loc  = undefined;
};

function f4d_PostFx_ShadersManager()
{
	this.pFx_shaders_array = [];
};

f4d_PostFx_ShadersManager.prototype.get_shader = function(GL, source, type, typeString)
{
	// Source from internet.***
	var shader = GL.createShader(type);
	GL.shaderSource(shader, source);
	GL.compileShader(shader);
	if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
	  alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
	  return false;
	}
	return shader;
};

f4d_PostFx_ShadersManager.prototype.create_defaultShaders = function(GL)
{
	this.create_renderDepthShader(GL); // 0.***
	this.create_ssaoShader(GL); // 1.***
	this.create_blurShader(GL); // 2.***
	
	// Now, create shaders for modelReference geometries.****
	this.create_renderDepthShader_ModelRef(GL); // 3.***
	this.create_ssaoShader_ModelRef(GL); // 4.***
	//this.create_blurShader_ModelRef(GL); // 5.***
	
	//this.create_renderDepthShader_TEST_ModelRef(GL); // 5
};

f4d_PostFx_ShadersManager.prototype.create_blurShader = function(gl)
{
	var shader = new f4d_PostFx_Shader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var blur_vs_source = "\n\
		attribute vec4 position;\n\
		attribute vec2 texCoord;\n\
\n\
		uniform mat4 projectionMatrix;\n\
		uniform mat4 modelViewMatrix;  \n\
\n\
		varying vec2 vTexCoord;\n\
\n\
		void main() {	\n\
			gl_Position = projectionMatrix * modelViewMatrix * position;\n\
			vTexCoord = texCoord;\n\
		}";
	
	var blur_fs_source = "\n\
		#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
		uniform sampler2D colorTex;\n\
		uniform vec2 texelSize;\n\
		varying vec2 vTexCoord; 	 	\n\
		\n\
		void main() {\n\
			vec3 result = vec3(0.0);\n\
			for (int i = 0; i < 4; ++i) {\n\
				for (int j = 0; j < 4; ++j) {\n\
					vec2 offset = vec2(texelSize.x * float(j), texelSize.y * float(i));\n\
					result += texture2D(colorTex, vTexCoord + offset).rgb;\n\
				}\n\
			}\n\
				   \n\
			gl_FragColor.rgb = vec3(result * 0.0625); \n\
			gl_FragColor.a = 1.0;\n\
		}";
		
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, blur_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, blur_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	//shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	//shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	//shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	//shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	
	//shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	//shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	//shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");
	
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	//shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	
	shader.texelSize_loc = gl.getUniformLocation(shader.program, "texelSize");
	shader.colorTex_loc = gl.getUniformLocation(shader.program, "colorTex");
};

f4d_PostFx_ShadersManager.prototype.create_ssaoShader = function(gl)
{
	var shader = new f4d_PostFx_Shader(this.gl);
	this.pFx_shaders_array.push(shader);
		
	var ssao_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;  \n\
		uniform mat4 modelViewMatrix;// No used. *** \n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		\n\
		varying vec3 vNormal;\n\
		varying vec2 vTexCoord;  \n\
		\n\
		void main() {	\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
			//vNormal = (normalMatrix4 * vec4(normal, 1.0)).xyz; // Original.***\n\
			vNormal = (normalMatrix4 * vec4(-normal.x, -normal.y, -normal.z, 1.0)).xyz;\n\
			vTexCoord = texCoord;\n\
		}";
		
	var ssao_fs_source = "\n\
		#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
		uniform sampler2D depthTex;\n\
		uniform sampler2D noiseTex;  \n\
		uniform sampler2D diffuseTex;\n\
		varying vec3 vNormal;\n\
		uniform mat4 projectionMatrix;\n\
		uniform mat4 m;\n\
		uniform vec2 noiseScale;\n\
		uniform float near;\n\
		uniform float far;            \n\
		uniform float fov;\n\
		uniform float aspectRatio;    \n\
		uniform float screenWidth;    \n\
		uniform float screenHeight;    \n\
		uniform vec3 kernel[16];   \n\
		\n\
		varying vec2 vTexCoord;   \n\
		\n\
		const int kernelSize = 16;  \n\
		//const float radius = 0.01;      \n\
		const float radius = 1.0;      \n\
		\n\
		float unpackDepth(const in vec4 rgba_depth) {\n\
			//const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0); // original.***\n\
			const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
			float depth = dot(rgba_depth, bit_shift);\n\
			return depth;\n\
		}                \n\
		\n\
		vec3 getViewRay(vec2 tc) {\n\
			float hfar = 2.0 * tan(fov/2.0) * far;\n\
			float wfar = hfar * aspectRatio;    \n\
			vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
			return ray;                      \n\
		}         \n\
				   \n\
		//linear view space depth\n\
		float getDepth(vec2 coord) {                          \n\
			return unpackDepth(texture2D(depthTex, coord.xy));\n\
		}    \n\
		\n\
		void main() {          \n\
			vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
			//screenPos.y = 1.0 - screenPos.y;   \n\
			\n\
			\n\
			float linearDepth = getDepth(screenPos);          \n\
			vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
					\n\
			vec3 normal2 = normalize(vNormal);   \n\
					\n\
			vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
			vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
			vec3 bitangent = cross(normal2, tangent);\n\
			mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
			\n\
			float occlusion = 0.0;\n\
			for(int i = 0; i < kernelSize; ++i) {    	 \n\
				vec3 sample = origin + (tbn * kernel[i]) * radius; // original.***\n\
				//vec3 sample = origin + (kernel[i]) * radius; // Test.***\n\
				vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
				offset.xy /= offset.w;\n\
				offset.xy = offset.xy * 0.5 + 0.5;        \n\
				float sampleDepth = -sample.z/far;\n\
				float depthBufferValue = getDepth(offset.xy);				              \n\
				//float range_check = abs(linearDepth - depthBufferValue); // original.***\n\
				float range_check = abs(linearDepth - depthBufferValue)+radius*0.998; // test.***\n\
				if (range_check < radius && depthBufferValue <= sampleDepth) {\n\
					occlusion +=  1.0;\n\
				}\n\
				\n\
			}   \n\
			   \n\
			occlusion = 1.0 - (occlusion) / float(kernelSize);\n\
									   \n\
			vec3 lightPos = vec3(10.0, 10.0, 10.0);\n\
			vec3 L = normalize(lightPos);\n\
			float NdotL = abs(dot(normal2, L));\n\
			vec3 diffuse = vec3(NdotL);\n\
			vec3 ambient = vec3(1.0);\n\
			vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
			//gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8) * occlusion); // original.***\n\
			//gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8 * occlusion)); // test.***\n\
			gl_FragColor.rgb = vec3((textureColor.xyz*0.2 + textureColor.xyz*0.8) * occlusion); // with texture.***\n\
			gl_FragColor.a = 1.0;   \n\
		}";
		
		
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	
	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	
	// ssao uniforms.**********************************************************************
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");
	
	// uniform values.***
	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");
	
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");
	
	// uniform samplers.***
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");
	
	// ModelReference.****
	//shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	//shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	//shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");

};

f4d_PostFx_ShadersManager.prototype.create_renderDepthShader = function(gl)
{
	var shader = new f4d_PostFx_Shader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var showDepth_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;// No used.***  \n\
		uniform mat4 modelViewMatrix;// No used. *** \n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 normalMatrix3;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform float near;\n\
		uniform float far;\n\
		\n\
		varying vec3 vN;\n\
		varying vec2 vTexCoord;\n\
		varying float depth;  \n\
		varying vec4 vVSPos;\n\
		void main() {	\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4; // original.**\n\
			//gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // Test. \n\
			vN = normalize((normalMatrix4 * vec4(normal, 1.0)).xyz);\n\
			\n\
			\n\
			//linear depth in camera space (0..far)\n\
			depth = (modelViewMatrixRelToEye * pos4).z/far; // Original.***\n\
			//depth = (modelViewMatrix * vec4(position, 1.0)).z/far; // Test.***\n\
			//depth = 0.0;\n\
			\n\
			vTexCoord = texCoord;   \n\
			vVSPos = modelViewMatrixRelToEye * pos4;\n\
		}";
		
		var showDepth_fs_source = "\n\
			#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
			uniform float near;\n\
			uniform float far;\n\
			\n\
			varying float depth;  \n\
			varying vec3 vN; \n\
			varying vec4 vVSPos;\n\
			\n\
			//from http://spidergl.org/example.php?id=6\n\
			vec4 packDepth(const in float depth) {\n\
				//const vec4 bit_shift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0); // original.***\n\
				const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
				//const vec4 bit_mask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0); // original.***\n\
				const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
				vec4 res = fract(depth * bit_shift);\n\
				res -= res.xxyz * bit_mask; // original.***\n\
				return res;  \n\
			}\n\
			\n\
			void main() {     \n\
				gl_FragData[0] = packDepth(-depth); // original.***\n\
				gl_FragData[0].r = -depth/far; // original\n\
				//gl_FragData[0].g = 1.0; // test\n\
				//gl_FragData[0].b = 1.0; // test\n\
			}";
			
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	
	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");	
	
	// ModelReference.****
	//shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	//shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	//shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");
		
		
	/*	// Tutorial code in http://marcinignac.com/experiments/ssao/v01/index.html.***
	var showDepth_vs_source = "\n\
		attribute vec4 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;\n\
		uniform mat4 modelViewMatrix;\n\
		uniform mat4 normalMatrix;\n\
		uniform float near;\n\
		uniform float far;\n\
		\n\
		varying vec3 vN;\n\
		varying vec2 vTexCoord;\n\
		varying float depth;  \n\
		varying vec4 vVSPos;\n\
		void main() {	\n\
			gl_Position = projectionMatrix * modelViewMatrix * position;\n\
			vN = normalize((normalMatrix * vec4(normal, 1.0)).xyz);\n\
			\n\
			//linear depth in camera space (0..far)\n\
			depth = (modelViewMatrix * position).z/far;\n\
			\n\
			vTexCoord = texCoord;   \n\
			vVSPos = modelViewMatrix * position;\n\
		}";
	var showDepth_fs_source = "\n\	
		#ifdef GL_ES
		precision highp float;
		#endif          
		uniform float near;
		uniform float far;

		varying float depth;   
		varying vec3 vN;     
		varying vec4 vVSPos;  

		//from http://spidergl.org/example.php?id=6
		vec4 packDepth(const in float depth) {
			const vec4 bit_shift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
			const vec4 bit_mask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
			vec4 res = fract(depth * bit_shift);
			res -= res.xxyz * bit_mask;
			return res;    		
		}

		void main() {         
			gl_FragData[0] = packDepth(-depth);
			gl_FragData[0].r = -depth/far;
		}
	*/
		
};

// Ref Model.***********************************************************************************************************************
// Ref Model.***********************************************************************************************************************
// Ref Model.***********************************************************************************************************************
f4d_PostFx_ShadersManager.prototype.create_ssaoShader_ModelRef = function(gl)
{
	var shader = new f4d_PostFx_Shader(this.gl);
	this.pFx_shaders_array.push(shader);
		
	var ssao_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;  \n\
		uniform mat4 modelViewMatrix;// No used. *** \n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 RefTransfMatrix;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		\n\
		varying vec3 vNormal;\n\
		varying vec2 vTexCoord;  \n\
		varying vec3 uAmbientColor;\n\
		varying vec3 vLightWeighting;\n\
		\n\
		void main() {	\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
			vec4 rotatedNormal = RefTransfMatrix * vec4(normal.xyz, 1.0);\n\
			//vNormal = (normalMatrix4 * vec4(normal, 1.0)).xyz; // Original.***\n\
			vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
			uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
			vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
			vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
			vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
			vTexCoord = texCoord;\n\
			float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
			vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		}";
		
	var ssao_fs_source = "\n\
		#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
		uniform sampler2D depthTex;\n\
		uniform sampler2D noiseTex;  \n\
		uniform sampler2D diffuseTex;\n\
		//uniform bool hasTexture;\n\
		varying vec3 vNormal;\n\
		uniform mat4 projectionMatrix;\n\
		uniform mat4 m;\n\
		uniform vec2 noiseScale;\n\
		uniform float near;\n\
		uniform float far;            \n\
		uniform float fov;\n\
		uniform float aspectRatio;    \n\
		uniform float screenWidth;    \n\
		uniform float screenHeight;    \n\
		uniform vec3 kernel[16];   \n\
		\n\
		varying vec2 vTexCoord;   \n\
		varying vec3 vLightWeighting;\n\
		\n\
		const int kernelSize = 16;  \n\
		//const float radius = 0.01;      \n\
		const float radius = 0.25;      \n\
		\n\
		float unpackDepth(const in vec4 rgba_depth) {\n\
			//const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0); // original.***\n\
			const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
			float depth = dot(rgba_depth, bit_shift);\n\
			return depth;\n\
		}                \n\
		\n\
		vec3 getViewRay(vec2 tc) {\n\
			float hfar = 2.0 * tan(fov/2.0) * far;\n\
			float wfar = hfar * aspectRatio;    \n\
			vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
			return ray;                      \n\
		}         \n\
				   \n\
		//linear view space depth\n\
		float getDepth(vec2 coord) {                          \n\
			return unpackDepth(texture2D(depthTex, coord.xy));\n\
		}    \n\
		\n\
		void main() {          \n\
			vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
			//screenPos.y = 1.0 - screenPos.y;   \n\
			\n\
			\n\
			float linearDepth = getDepth(screenPos);          \n\
			vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
					\n\
			vec3 normal2 = normalize(vNormal);   \n\
					\n\
			vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
			vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
			vec3 bitangent = cross(normal2, tangent);\n\
			mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
			\n\
			float occlusion = 0.0;\n\
			for(int i = 0; i < kernelSize; ++i) {    	 \n\
				vec3 sample = origin + (tbn * kernel[i]) * radius;\n\
				vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
				offset.xy /= offset.w;\n\
				offset.xy = offset.xy * 0.5 + 0.5;        \n\
				float sampleDepth = -sample.z/far;\n\
				float depthBufferValue = getDepth(offset.xy);				              \n\
				//float range_check = abs(linearDepth - depthBufferValue); // original.***\n\
				float range_check = abs(linearDepth - depthBufferValue)+radius*0.998; // test_original.***\n\
				if (range_check < radius && depthBufferValue <= sampleDepth) {\n\
					occlusion +=  1.0;\n\
				}\n\
				\n\
			}   \n\
			   \n\
			occlusion = 1.0 - occlusion / float(kernelSize);\n\
									   \n\
			vec3 lightPos = vec3(10.0, 10.0, 10.0);\n\
			vec3 L = normalize(lightPos);\n\
			float NdotL = abs(dot(normal2, L));\n\
			vec3 diffuse = vec3(NdotL);\n\
			vec3 ambient = vec3(1.0);\n\
			vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
			//gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8) * occlusion); // original.***\n\
			////gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8 * occlusion)); // test.***\n\
			gl_FragColor.rgb = vec3((textureColor.xyz*0.2 + textureColor.xyz*0.8)*vLightWeighting * occlusion); // with texture.***\n\
			gl_FragColor.a = 1.0;   \n\
		}";
		
		/*
		// Old texture shader.***
		shader.shader_fragment_source="\n\
		precision mediump float;\n\
		varying vec4 vColor;\n\
		varying vec2 vTextureCoord;\n\
		uniform sampler2D uSampler;\n\
		varying vec3 vLightWeighting;\n\
		void main(void) {\n\
			vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
			gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n\
		}";
		*/
		
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	
	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	
	// ssao uniforms.**********************************************************************
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");
	
	// uniform values.***
	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");
	
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");
	
	// uniform samplers.***
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");
	
	// ModelReference.****
	shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");

};

f4d_PostFx_ShadersManager.prototype.create_renderDepthShader_ModelRef = function(gl)
{
	var shader = new f4d_PostFx_Shader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var showDepth_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;// No used.***  \n\
		uniform mat4 modelViewMatrix;// No used. *** \n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 RefTransfMatrix;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 normalMatrix3;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform float near;\n\
		uniform float far;\n\
		\n\
		varying vec3 vN;\n\
		varying vec2 vTexCoord;\n\
		varying float depth;  \n\
		varying vec4 vVSPos;\n\
		void main() {	\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4; // original.**\n\
			//gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // Test. \n\
			vN = normalize((normalMatrix4 * vec4(normal, 1.0)).xyz);\n\
			\n\
			\n\
			//linear depth in camera space (0..far)\n\
			depth = (modelViewMatrixRelToEye * pos4).z/far; // Original.***\n\
			\n\
			vTexCoord = texCoord;   \n\
			vVSPos = modelViewMatrixRelToEye * pos4;\n\
		}";
		
		var showDepth_fs_source = "\n\
			#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
			uniform float near;\n\
			uniform float far;\n\
			\n\
			varying float depth;  \n\
			varying vec3 vN; \n\
			varying vec4 vVSPos;\n\
			\n\
			//from http://spidergl.org/example.php?id=6\n\
			vec4 packDepth(const in float depth) {\n\
				//const vec4 bit_shift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0); // original.***\n\
				const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
				//const vec4 bit_mask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0); // original.***\n\
				const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
				vec4 res = fract(depth * bit_shift);\n\
				res -= res.xxyz * bit_mask; // original.***\n\
				return res;  \n\
			}\n\
			\n\
			void main() {     \n\
				gl_FragData[0] = packDepth(-depth); // original.***\n\
				gl_FragData[0].r = -depth/far; // original\n\
				//gl_FragData[0].g = 1.0; // test\n\
				//gl_FragData[0].b = 1.0; // test\n\
			}";
			
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	
	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");	
	
	// ModelReference.****
	shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	//shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");
		
};



f4d_PostFx_ShadersManager.prototype.create_renderDepthShader_TEST_ModelRef = function(gl)
{
	var shader = new f4d_PostFx_Shader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var showDepth_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;// No used.***  \n\
		uniform mat4 modelViewMatrix;// No used. *** \n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 RefTransfMatrix;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 normalMatrix3;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform float near;\n\
		uniform float far;\n\
		\n\
		varying vec3 vN;\n\
		varying vec2 vTexCoord;\n\
		varying float depth;  \n\
		varying vec4 vVSPos;\n\
		varying vec2 vTextureCoord;\n\
		void main() {	\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
			//vec4 rotatedPos = vec4(position.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4; // original.**\n\
			//gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // Test. \n\
			vN = normalize((normalMatrix4 * vec4(normal, 1.0)).xyz);\n\
			\n\
			\n\
			//linear depth in camera space (0..far)\n\
			depth = (modelViewMatrixRelToEye * pos4).z/far; // Original.***\n\
			\n\
			vTextureCoord = texCoord;   \n\
			vVSPos = modelViewMatrixRelToEye * pos4;\n\
		}";
		
		var showDepth_fs_source = "\n\
			#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
			uniform sampler2D diffuseTex; // delete this.***\n\
			varying vec2 vTextureCoord;\n\
			uniform float near;\n\
			uniform float far;\n\
			\n\
			varying float depth;  \n\
			varying vec3 vN; \n\
			varying vec4 vVSPos;\n\
			\n\
			//from http://spidergl.org/example.php?id=6\n\
			vec4 packDepth(const in float depth) {\n\
				//const vec4 bit_shift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0); // original.***\n\
				const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
				//const vec4 bit_mask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0); // original.***\n\
				const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
				vec4 res = fract(depth * bit_shift);\n\
				res -= res.xxyz * bit_mask; // original.***\n\
				return res;  \n\
			}\n\
			\n\
			void main() {     \n\
				//vec4 textureColor = texture2D(diffuseTex, vec2(vTextureCoord.s, vTextureCoord.t));\n\
				//gl_FragColor = vec4(textureColor.rgb, textureColor.a);\n\
				gl_FragData[0] = packDepth(-depth); // original.***\n\
				gl_FragData[0].r = -depth/far; // original\n\
			}";
			
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	
	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");	
	
	// uniform samplers.***
	//shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	//shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");
	
	// ModelReference.****
	shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");
		
};










