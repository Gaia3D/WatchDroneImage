


//http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html // GOOD TUTORIALS !!!!!!!!!!!!!!!!!!!!!!!!!!!

function genNoiseTextureRGBA(gl, w, h) {       
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  var b = new ArrayBuffer(w*h*4);
  var pixels = new Uint8Array(b);
  for(var y=0; y<h; y++) {
    for(var x=0; x<w; x++) {
      pixels[(y*w + x)*4+0] = Math.floor(255 * Math.random());
      pixels[(y*w + x)*4+1] = Math.floor(255 * Math.random());
      pixels[(y*w + x)*4+2] = Math.floor(255 * Math.random());
      pixels[(y*w + x)*4+3] = Math.floor(255 * Math.random());
    }
  } 
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);   
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.bindTexture(gl.TEXTURE_2D, null);  
  
  texture.width = w;
  texture.height = h; 
  return texture;
}

var f4d_manager = function()
{
	// F4D Data structure & objects.*****************************************
	this.f4dBR_buildingProjectsList = new f4d_BR_buildingProjectsList(); // Old. Provisionally for f4d projects.*** !!!
	this.f4d_terranTile = new f4d_TerranTile();// use this.***
	this.f4d_neoBuildingsList = new F4D_NeoBuildingsList();
	this.f4dRenderer = new f4d_renderer();
	this.f4dSelection = new f4d_selection();
	this.f4d_shadersManager = new f4d_ShadersManager();
	this.f4d_postFxShadersManager = new f4d_PostFx_ShadersManager();
	this.f4d_vboManager = new f4d_vbo_manager();
	this.f4d_readerWriter = new f4d_ReaderWriter();
	
	// SSAO.***************************************************
	this.noiseTexture = undefined;
	this.depthFbo = undefined; 
	this.normalFbo = undefined; // Only for test disply normals. No use this in release.***    
	this.ssaoFbo = undefined;
	
	this.depthFboNeo = undefined;    
	this.ssaoFboNeo = undefined;
	
	this.ssaoFSQuad = undefined;// No use this.***
	this.kernel = [];
	var kernelSize = 16;
	
	// Original for hemisphere.***
	/*
	for(var i=0; i<kernelSize; i++) {
		var x = 2.0 * (Math.random() - 0.5);
		var y = 2.0 * (Math.random() - 0.5);
		var z = Math.random();
		if(z<0.15)z = 0.15;
		this.kernel.push(x);
		this.kernel.push(y);
		this.kernel.push(z);				
	}
	*/
	
	// 1.***
	this.kernel.push(0.33);
	this.kernel.push(0.0);
	this.kernel.push(0.85);
	
	// 2.***
	this.kernel.push(0.25);
	this.kernel.push(0.3);
	this.kernel.push(0.5);
	
	// 3.***
	this.kernel.push(0.1);
	this.kernel.push(0.3);
	this.kernel.push(0.85);
	
	// 4.***
	this.kernel.push(-0.15);
	this.kernel.push(0.2);
	this.kernel.push(0.85);
	
	// 5.***
	this.kernel.push(-0.33);
	this.kernel.push(0.05);
	this.kernel.push(0.6);
	
	// 6.***
	this.kernel.push(-0.1);
	this.kernel.push(-0.15);
	this.kernel.push(0.85);
	
	// 7.***
	this.kernel.push(-0.05);
	this.kernel.push(-0.32);
	this.kernel.push(0.25);
	
	// 8.***
	this.kernel.push(0.2);
	this.kernel.push(-0.15);
	this.kernel.push(0.85);
	
	
	
	// 9.***
	this.kernel.push(0.6);
	this.kernel.push(0.0);
	this.kernel.push(0.75);
	
	// 10.***
	this.kernel.push(0.5);
	this.kernel.push(0.6);
	this.kernel.push(0.45);
	
	// 11.***
	this.kernel.push(-0.01);
	this.kernel.push(0.7);
	this.kernel.push(0.85);
	
	// 12.***
	this.kernel.push(-0.33);
	this.kernel.push(0.5);
	this.kernel.push(0.65);
	
	// 13.***
	this.kernel.push(-0.45);
	this.kernel.push(0.0);
	this.kernel.push(0.85);
	
	// 14.***
	this.kernel.push(-0.65);
	this.kernel.push(-0.5);
	this.kernel.push(0.9);
	
	// 15.***
	this.kernel.push(0.0);
	this.kernel.push(-0.5);
	this.kernel.push(0.55);
	
	// 16.***
	this.kernel.push(0.33);
	this.kernel.push(0.3);
	this.kernel.push(0.85);
	

	/*
	// Test for sphere.***
	for(var i=0; i<kernelSize; i++) {
		this.kernel.push(2.0 * (Math.random() - 0.5));
		this.kernel.push(2.0 * (Math.random() - 0.5));
		this.kernel.push(2.0 * (Math.random() - 0.5));				
	}
	*/
	// End ssao.------------------------------------------------
	
	this.f4d_atmos = new f4d_atmosphere();
	
	// Vars.****************************************************************
	this.modelViewProjRelToEye_matrix = new Float32Array(16);
	this.modelViewRelToEye_matrix = new Float32Array(16);
	this.modelView_matrix = new Float32Array(16);
	this.projection_matrix = new Float32Array(16);
	this.normalMat3 = new Cesium.Matrix3();
	this.normalMat3_array = new Float32Array(9);
	this.normalMat4 = new Cesium.Matrix4();
	this.normalMat4_array = new Float32Array(16);
	
	this.currentVisible_terranTiles_array = [];
	this.currentVisibleBuildings_array = [];
	this.currentVisibleBuildings_LOD0_array = [];
	this.currentVisibleBuildingsPost_array = [];
	
	this.currentVisibleNeoBuildings_array = [];
	this.curentVisiblesOctrees_array = [];
	this.currentVisibleClouds_array = [];
	this.detailed_building = undefined;
	this.detailed_neoBuilding = undefined;
	this.boundingSphere_Aux = new Cesium.BoundingSphere(); // Cesium dependency.***
	this.radiusAprox_aux = undefined;
	
	this.filteredVisibleTiles_array = [];
	this.detailedVisibleTiles_array = [];
	this.LOD0VisibleTiles_array = [];
	
	this.lastCamPos = new f4d_point3d();
	this.squareDistUmbral = 22.0;
	
	this.encodedCamPosMC_High = new Float32Array(3);
	this.encodedCamPosMC_Low = new Float32Array(3);
	
	this.compRefList_array = undefined;
	this.compRefList_array_background = undefined;
	this.intCRefList_array = [];
	this.intNeoRefList_array = [];
	
	this.currentSelectedObj_idx = -1;
	this.currentByteColorPicked = new Uint8Array(4);
	
	this.backGround_fileReadings_count = 0; // this can be as max = 9.***
	this.backGround_imageReadings_count = 0;
	this.isCameraMoving = false;
	this.isCameraInsideBuilding = false;
	this.isCameraInsideNeoBuilding = false;
	
	this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	this.min_squaredDist_to_see_LOD0 = 100000; // Original.***
	//this.min_squaredDist_to_see_LOD0 = 1000000; // 600m.***
	this.min_squaredDist_to_see = 5000000;
	this.min_squaredDist_to_see_smallBuildings = 700000;
	this.renders_counter = 0;
	this.render_time = 0;
	
	// SPEED TEST.********************************************************
	this.f4d_rendering_time = 0;
	this.xdo_rendering_time = 0;
	this.xdo_rendering_time_arrays = 0;
	
	this.f4d_amountRenderTime = 0;
	this.xdo_amountRenderTime = 0;
	this.xdo_amountRenderTime_arrays = 0;
	
	this.f4d_averageRenderTime = 0;
	this.xdo_averageRenderTime = 0;
	this.xdo_averageRenderTime_arrays = 0;
	
	this.allBuildingsLoaded = false;
	this.renderingCounter = 0;
	this.averageRenderingCounter = 0;
	
	//--------------------------------------------------------------------
	
	
	this.testFilesLoaded = false;
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this.pointSC= new f4d_point3d();
	this.pointSC_2= new f4d_point3d();
	var myCameraSC = undefined;
	
	this.currentTimeSC = undefined;
	this.dateSC = undefined;
	this.startTimeSC = undefined;
	this.maxMilisecondsForRender = 10;
	
	this.terranTileSC = undefined;
	
	this.textureAux_1x1 = undefined;
	
	// Workers.****************************************************************************
	/*
	this.worker_sonGeometry = new Worker(); 
	//this.worker_sonGeometry.setTest(77.77);
	this.worker_sonGeometry.onmessage = function (event) 
	{
		//document.getElementById('result').textContent = event.data;
		this.compRefList_array = event.data[0];
		
	};
	*/
	
	
	
	/*  
	this.worker_sonGeometry = new Worker('SonWebWorker.js'); 
	this.worker_sonGeometry.addEventListener('message', function(e) {
		document.getElementById('result').innerHTML  = e.data;
	  }, false);
	*/
	// End workers.------------------------------------------------------------------------
	
	this.create_clouds_TEST();
	
	this.load_samsung= false;
};

f4d_manager.prototype.create_clouds_TEST = function()
{
	var increLong = 0.004;
	var increLat = 0.004;
	
	var randomLongitude = 0;
	var randomLatitude = 0;
	var randomAltitude = 0;
	var randomRadius = 0;
	var randomDepth = 0;
	
	var cloud = undefined;
	
	for(var i =0; i<10; i++)
	{
		randomLongitude = 126.91+(0.05*Math.random());
		randomLatitude = 37.51+(0.05*Math.random());
		randomAltitude = 350+Math.random()*50;
		randomRadius = 10+Math.random()*150;
		randomDepth = 10+Math.random()*50;
		cloud = this.f4d_atmos.cloudsManager.newCircularCloud();
		cloud.createCloud(randomLongitude, randomLatitude, randomAltitude, randomRadius, randomDepth, 16);
	}
	
	for(var i =0; i<10; i++)
	{
		randomLongitude = 127.0+(0.05*Math.random());
		randomLatitude = 37.45+(0.05*Math.random());
		randomAltitude = 350+Math.random()*50;
		randomRadius = 10+Math.random()*150;
		randomDepth = 10+Math.random()*50;
		cloud = this.f4d_atmos.cloudsManager.newCircularCloud();
		cloud.createCloud(randomLongitude, randomLatitude, randomAltitude, randomRadius, randomDepth, 16);
	}
	/*
	cloud = this.f4d_atmos.cloudsManager.newCircularCloud();
	cloud.createCloud(126.929, 37.5172076, 300.0, 100.0, 40.0, 16);

	cloud = this.f4d_atmos.cloudsManager.newCircularCloud();
	cloud.createCloud(126.929+increLong, 37.5172076, 340.0, 50.0, 40.0, 16);
	
	cloud = this.f4d_atmos.cloudsManager.newCircularCloud();
	cloud.createCloud(126.929+increLong, 37.5172076+increLat, 340.0, 80.0, 90.0, 16);
	*/
};

f4d_manager.prototype.isCameraMoved = function(cameraPosition, squareDistUmbral)
{
	// if camera is interior of building -> this.squareDistUmbral = 22.0;
	// if camera is exterior of building -> this.squareDistUmbral = 200.0;
	/*
	if(this.detailed_building)
	{
		this.squareDistUmbral = 4.5*4.5;
	}
	else{
		this.squareDistUmbral = 50*50;
	}
	*/
	
	var camera_was_moved = false;
	var squareDistFromLastPos = this.lastCamPos.squareDistTo(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	if(squareDistFromLastPos > squareDistUmbral)
	{
		camera_was_moved = true;
		this.lastCamPos.x = cameraPosition.x;
		this.lastCamPos.y = cameraPosition.y;
		this.lastCamPos.z = cameraPosition.z;
	}
	
	return camera_was_moved;
};

f4d_manager.prototype.update_CameraMoved = function(cameraPosition)
{
	// This function must run in a background process.****
	// call this function if camera was moved.****
	//----------------------------------------------------------------
	
	// 1rst, do frustum culling and find a detailed building.***
	
	
};

f4d_manager.prototype.select_F4D_object = function(GL, _modelViewProjectionRelativeToEye, mousePickPos_x, mousePickPos_y, drawingBufferHeight)
{
	if(this.detailed_building)
	{

		GL.clearColor(1, 1, 1, 1);
		GL.bindFramebuffer(GL.FRAMEBUFFER, this.f4dSelection.GAIA_selectFrameBuffer);				
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
	
		//render_F4D_compRefList_forColorSelection(this, this.compRefList_array, this.detailed_building); // Old.***
		// Calculate "modelViewProjectionRelativeToEye".****************************************************
		Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
		
		// Color code render.****************************************************************************************************
		if(this.compRefList_array)
		{
			this.f4dRenderer.render_F4D_compRefList_forColorSelection(GL, this.compRefList_array, this.detailed_building, 
				this.modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
		}
		// End color code render.------------------------------------------------------------------------------------------------

		var pickX = mousePickPos_x;
		var pickY = drawingBufferHeight - mousePickPos_y; // Invert Y axis, bcos webgl has origen in left-down.***
		
		GL.readPixels(pickX, pickY, 1, 1, GL.RGBA, GL.UNSIGNED_BYTE, this.currentByteColorPicked); // Original.***
		//GL.readPixels(0, 0, this.drawingBufferWidth, this.drawingBufferHeight, GL.RGBA, GL.UNSIGNED_BYTE, this.lastCapturedColourMap);// Test, maybe util for deferredRenders....***
		
		this.currentSelectedObj_idx = 255*255*this.currentByteColorPicked[0] + 255*this.currentByteColorPicked[1] + this.currentByteColorPicked[2];
	}
	else
	{
		// For the moment... later we need select simple_buildings too.***
		this.currentSelectedObj_idx = -1;
	}
	
};

f4d_manager.prototype.render_F4D_Atmosphere = function(GL, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum)
{
	var clouds_count = this.f4d_atmos.cloudsManager.circularCloudsArray.length;
	if(clouds_count == 0)
		return;
	
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	this.encodedCamPosMC_High[0] = camSplitVelue_X.high;
	this.encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	this.encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	this.encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	this.encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	//-----------------------------------------------------------------------------------------
	// Test using f4d_shaderManager.************************
	var f4d_shadersManager = this.f4d_shadersManager;
	var standardShader = f4d_shadersManager.get_f4dShader(4); // 4 = cloud-shader.***
	var shaderProgram = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);

	GL.enableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	//------------------------------------------------------
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	GL.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	GL.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	
	// Clouds.***************************************************
	var cloud = undefined;
	
	for(var i=0; i<clouds_count; i++)
	{
		cloud = this.f4d_atmos.cloudsManager.circularCloudsArray[i];
		
		GL.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		GL.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);
		
		if(cloud.vbo_vertexCacheKey == undefined)
		{
			cloud.vbo_vertexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, cloud.get_vbo_vertexColor_FloatArray(), GL.STATIC_DRAW);
		}
		if(cloud.vbo_indexCacheKey == undefined)
		{
			cloud.vbo_indexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_indexCacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, cloud.get_vbo_indices_ShortArray(), GL.STATIC_DRAW);
		}

		// Interleaved mode.***
		GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
		GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,24,0);
		GL.vertexAttribPointer(standardShader._color, 3, GL.FLOAT, false,24,12);
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_indexCacheKey);
		GL.drawElements(GL.TRIANGLES, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
		//GL.drawElements(GL.LINE_LOOP, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	
	//-------------------------------------------------------
	GL.disableVertexAttribArray(standardShader._color);
	GL.disableVertexAttribArray(standardShader._position);
	
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	
};

f4d_manager.prototype.render_F4D_cloudShadows = function(GL, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum)
{
	//if(!isLastFrustum)
	//	return;
	//this.doFrustumCulling_clouds(cullingVolume, this.f4d_atmos.cloudsManager.circularCloudsArray, cameraPosition);
	
	var clouds_count = this.f4d_atmos.cloudsManager.circularCloudsArray.length;
	if(clouds_count == 0)
		return;
	
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	this.encodedCamPosMC_High[0] = camSplitVelue_X.high;
	this.encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	this.encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	this.encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	this.encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	//-----------------------------------------------------------------------------------------
	// Test using f4d_shaderManager.************************
	var f4d_shadersManager = this.f4d_shadersManager;
	var standardShader = f4d_shadersManager.get_f4dShader(4); // 4 = cloud-shader.***
	var shaderProgram = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	
	//GL.enableVertexAttribArray(standardShader._color);
	//GL.disableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	//------------------------------------------------------
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	GL.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	GL.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	
	var cloud = undefined;
	
	// SHADOW SETTINGS.**********************************************************************************
	GL.colorMask(false, false, false, false);
	GL.depthMask(false);
	GL.enable(GL.CULL_FACE);
	GL.enable(GL.STENCIL_TEST);
	GL.enable(GL.POLYGON_OFFSET_FILL);
	GL.polygonOffset(1.0, 2.0); // Original.***
	//GL.polygonOffset(1.0, 1.0);
	
	// First pas.****************************************************************************************************
	GL.cullFace(GL.FRONT);
	GL.stencilFunc(GL.ALWAYS, 0x0, 0xff);
	GL.stencilOp(GL.KEEP, GL.INCR, GL.KEEP);
	GL.clearStencil(0);
	//GL.clear(GL.STENCIL_BUFFER_BIT);

	// Clouds.***
	//clouds_count = this.currentVisibleClouds_array.length;
	for(var i=0; i<clouds_count; i++)
	{
		cloud = this.f4d_atmos.cloudsManager.circularCloudsArray[i]; // Original.***
		//cloud = this.currentVisibleClouds_array[i];
		
		GL.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		GL.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if(cloud.vbo_shadowVertexCacheKey == undefined)
		{
			cloud.vbo_shadowVertexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, cloud.get_vbo_shadowVertex_FloatArray(), GL.STATIC_DRAW);
		}
		if(cloud.vbo_shadowIndexCacheKey == undefined)
		{
			cloud.vbo_shadowIndexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, cloud.get_vbo_shadowIndices_ShortArray(), GL.STATIC_DRAW);
		}

		// Interleaved mode.***
		GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,0,0);
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
		GL.drawElements(GL.TRIANGLES, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
		//GL.drawElements(GL.LINE_LOOP, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	
	// Second pass.****************************************************************************************************
	GL.cullFace(GL.BACK);
	GL.stencilFunc(GL.ALWAYS, 0x0, 0xff);
	GL.stencilOp(GL.KEEP, GL.DECR, GL.KEEP);
	
	// Clouds.***
	for(var i=0; i<clouds_count; i++)
	{
		cloud = this.f4d_atmos.cloudsManager.circularCloudsArray[i];
		
		GL.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		GL.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if(cloud.vbo_shadowVertexCacheKey == undefined)
		{
			cloud.vbo_shadowVertexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, cloud.get_vbo_shadowVertex_FloatArray(), GL.STATIC_DRAW);
		}
		if(cloud.vbo_shadowIndexCacheKey == undefined)
		{
			cloud.vbo_shadowIndexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, cloud.get_vbo_shadowIndices_ShortArray(), GL.STATIC_DRAW);
		}

		// Interleaved mode.***
		GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,0,0);
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
		GL.drawElements(GL.TRIANGLES, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
		//GL.drawElements(GL.LINE_LOOP, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	//-------------------------------------------------------
	//GL.disableVertexAttribArray(standardShader._color);
	GL.disableVertexAttribArray(standardShader._position);
	
	//-------------------------------------------------------
	
	
	// Render the shadow.*********************************************************************************************
	GL.disable(GL.POLYGON_OFFSET_FILL);
	GL.disable(GL.CULL_FACE);
	GL.colorMask(true, true, true, true);
	GL.depthMask(true);

	GL.stencilFunc(GL.NOTEQUAL, 0x0, 0xff);
	GL.stencilOp(GL.REPLACE, GL.REPLACE, GL.REPLACE);

		GL.disable(GL.DEPTH_TEST);
		GL.enable(GL.BLEND);
		GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA); // Original.***
		//GL.blendFunc(GL.ONE, GL.ONE_MINUS_SRC_ALPHA);
		//--------------------------------------------------------------
		// must draw a rectangle for blending.***
		GL.cullFace(GL.FRONT);

		// render the shadowBlendingCube.***
				standardShader = f4d_shadersManager.get_f4dShader(5); // 5 = blendingCube-shader.***
				var shaderProgram_blendingCube = standardShader.SHADER_PROGRAM;
				GL.useProgram(shaderProgram_blendingCube);
				
				GL.enableVertexAttribArray(standardShader._color);
				GL.enableVertexAttribArray(standardShader._position);
				//------------------------------------------------------
				
				GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
				GL.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
				GL.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
		var shadowBC = this.f4d_atmos.shadowBlendingCube;
		if(shadowBC.vbo_vertexCacheKey == undefined)
		{
			shadowBC.vbo_vertexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, shadowBC.get_vbo_vertexColorRGBA_FloatArray(), GL.STATIC_DRAW);
		}
		if(shadowBC.vbo_indexCacheKey == undefined)
		{
			shadowBC.vbo_indexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, shadowBC.get_vbo_indices_ShortArray(), GL.STATIC_DRAW);
		}

			// Interleaved mode.***
			GL.bindBuffer(GL.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
			GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,28,0);
			GL.vertexAttribPointer(standardShader._color, 4, GL.FLOAT, false,28,12);
			
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
			GL.drawElements(GL.TRIANGLES, shadowBC.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
		
		GL.disableVertexAttribArray(standardShader._position);
		GL.disableVertexAttribArray(standardShader._color);
	
		//--------------------------------------------------------------
	
		GL.enable(GL.DEPTH_TEST);
		GL.disable(GL.BLEND);
	//------------------------------------------------------------
	// Finally.***
	GL.disable(GL.STENCIL_TEST);
	
};

f4d_manager.prototype.isButtonDown = function(scene)
{
	if(scene._screenSpaceCameraController._aggregator._isDown[0] ||
		scene._screenSpaceCameraController._aggregator._isDown[1]||
		scene._screenSpaceCameraController._aggregator._isDown[2]) // 0 = LEFT, 1 = RIGHT, 2 = MIDDLE,...
	{
		this.isCameraMoving = true;
	}
	else 
	{
		this.isCameraMoving = false;
	}
	
	return this.isCameraMoving;
};

f4d_manager.prototype.calculate_encodedCameraPositionMC_HighLow = function(encodedCamPosMC_High, encodedCamPosMC_Low, cameraPosition)
{
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	encodedCamPosMC_High[0] = camSplitVelue_X.high;
	encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	
	//var us = context._us;
	//this.encodedCamPosMC_High[0] = us._encodedCameraPositionMC.high.x;
	//this.encodedCamPosMC_High[1] = us._encodedCameraPositionMC.high.y;
	//this.encodedCamPosMC_High[2] = us._encodedCameraPositionMC.high.z;
	//this.encodedCamPosMC_Low[0] = us._encodedCameraPositionMC.low.x;
	//this.encodedCamPosMC_Low[1] = us._encodedCameraPositionMC.low.y;
	//this.encodedCamPosMC_Low[2] = us._encodedCameraPositionMC.low.z;
};

f4d_manager.prototype.render_F4D_pCloudProjects = function(GL, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum)
{
	this.isCameraMoving = this.isButtonDown(scene);
	
	// Check if camera was moved considerably for update the renderables objects.***
	if(this.detailed_building)
	{
		this.squareDistUmbral = 4.5*4.5;
	}
	else{
		this.squareDistUmbral = 50*50;
	}
	var cameraMoved = this.isCameraMoved(cameraPosition, this.squareDistUmbral);
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculate_encodedCameraPositionMC_HighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
	
	// Now, render the simple visible buildings.***************************************************************************
	// http://learningwebgl.com/blog/?p=684 // tutorial for shader with normals.***
	var shader = this.f4d_shadersManager.get_f4dShader(6);
	var shaderProgram = shader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(shader._color);
	GL.enableVertexAttribArray(shader._position);
	
	GL.enable(GL.DEPTH_TEST);
	  GL.depthFunc(GL.LEQUAL); 
	  GL.depthRange(0, 1);

	  GL.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	  GL.uniform3fv(shader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	  GL.uniform3fv(shader._encodedCamPosLOW, this.encodedCamPosMC_Low);

	//GL.activeTexture(GL.TEXTURE0);
	//------------------------------------------------------
	////////////////////////////////////
	this.currentVisibleBuildingsPost_array.length = 0;
	
	var filePath_scratch = "";
	
	// Now, render LOD0 texture buildings.***
	var pCloudProject = undefined;
	var pCloud_projectsCount = this.f4dBR_buildingProjectsList._pCloudMesh_array.length;
	for(var i=0; i<pCloud_projectsCount; i++)
	{
		pCloudProject = this.f4dBR_buildingProjectsList._pCloudMesh_array[i];
		
		if(!pCloudProject._f4d_header_readed)
		{
			// Must read the header file.***
			if(this.backGround_fileReadings_count < 20)
			{
				filePath_scratch = "/F4D_GeometryData/" + pCloudProject._f4d_headerPathName;
				
				this.f4d_readerWriter.readF4D_pCloudHeader_inServer(GL, filePath_scratch, pCloudProject, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		}
		else if(!pCloudProject._f4d_geometry_readed && pCloudProject._f4d_header_readed_finished)
		{
			if(this.backGround_fileReadings_count < 20)
			{
				filePath_scratch = "/F4D_GeometryData/" + pCloudProject._f4d_geometryPathName;
				
				this.f4d_readerWriter.readF4D_pCloudGeometry_inServer(GL, filePath_scratch, pCloudProject, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		}
		
		// Now, render the pCloud project.***
		if(pCloudProject._f4d_geometry_readed_finished)
			this.f4dRenderer.render_F4D_pCloudProject(GL, pCloudProject, this.modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this);

	}
	
	GL.disableVertexAttribArray(shader._color);
	GL.disableVertexAttribArray(shader._position);
};



function handleTextureLoaded(gl, image, texture) 
{
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	//var gl = viewer.scene.context._gl;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
};

// render_neobuildings
f4d_manager.prototype.renderNeoBuildings = function(GL, cameraPosition, _modelViewProjectionRelativeToEye, scene, isLastFrustum)
{
	if(!isLastFrustum)
		return;

	
	if(this.textureAux_1x1 == undefined)
	{
		this.textureAux_1x1 = GL.createTexture();
		// Test wait for texture to load.********************************************
		//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
		GL.bindTexture(GL.TEXTURE_2D, this.textureAux_1x1);
		//GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // red
		GL.bindTexture(GL.TEXTURE_2D, null);
	}
	
	if(this.depthFboNeo == undefined)this.depthFboNeo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	if(this.ssaoFboNeo == undefined)this.ssaoFboNeo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	var neoVisibleBuildings_array = [];
	
	// do frustum culling.***
	if(!this.isCameraMoving)
	{
		frustumVolume = scene._frameState.cullingVolume;
		this.currentVisibleNeoBuildings_array.length = 0;
		this.doFrustumCulling_neoBuildings(frustumVolume, this.currentVisibleNeoBuildings_array, cameraPosition);
	}
	
	//if(this.detailed_neoBuilding) // original.***
	if(this.currentVisibleNeoBuildings_array.length > 0)
	{
		// Calculate "modelViewProjectionRelativeToEye".*********************************************************
		Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
		Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEye_matrix); // Original.*** 
		Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
		Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
		//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
		// Calculate encodedCamPosMC high and low values.********************************************************
		this.calculate_encodedCameraPositionMC_HighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
		
		// Normal matrix.********************************************************************
		var mvMat = scene._context._us._modelView; // original.***
		var mvMat_inv = new Cesium.Matrix4();
		mvMat_inv = Cesium.Matrix4.inverse(mvMat, mvMat_inv);
		//var normalMat = new Cesium.Matrix4();
		this.normalMat4 = Cesium.Matrix4.transpose(mvMat_inv, this.normalMat4);// Original.***
		//this.normalMat4 = Cesium.Matrix4.clone(mvMat_inv, this.normalMat4);
		this.normalMat3 = Cesium.Matrix4.getRotation(this.normalMat4, this.normalMat3);

		Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
		Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 
		//-----------------------------------------------------------------------------------
	
	
		var camera = scene._camera;
		var frustum = camera.frustum;
		var current_frustum_near = scene._context._us._currentFrustum.x;
		var current_frustum_far = scene._context._us._currentFrustum.y;
		
		GL.enable(GL.CULL_FACE);
		
		scene._context._currentFramebuffer._bind();
	
		// 1) The depth render.***
		var currentShader = this.f4d_postFxShadersManager.pFx_shaders_array[3]; // neo depth.***
		//var currentShader = this.f4d_postFxShadersManager.pFx_shaders_array[5]; // neo depth TEST.***
		this.depthFboNeo.bind(); // DEPTH START.*****************************************************************************************************
		GL.clearColor(0, 0, 0, 1);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		GL.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);  
	
		shaderProgram = currentShader.program;
		GL.useProgram(shaderProgram);
		//GL.enableVertexAttribArray(currentShader.texCoord2_loc); // No textures for depth render.***
		GL.enableVertexAttribArray(currentShader.position3_loc);
		GL.enableVertexAttribArray(currentShader.normal3_loc);

		GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
		GL.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
		GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
		GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
		GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
		GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
		
		  GL.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding._buildingPositionHIGH);
		  GL.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding._buildingPositionLOW);
		
		GL.uniform1f(currentShader.near_loc, frustum._near);	
		//GL.uniform1f(currentShader.far_loc, frustum._far);	// Original (bad)..***
		GL.uniform1f(currentShader.far_loc, current_frustum_far); // test (best)..***	
		
		GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
		GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
		
		var renderTexture = false;
		
		var neoBuildingCount = this.currentVisibleNeoBuildings_array.length;
		for(var i=0; i <neoBuildingCount; i++)
		{
			this.detailed_neoBuilding = this.currentVisibleNeoBuildings_array[i];
			GL.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding._buildingPositionHIGH);
			GL.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding._buildingPositionLOW);
			this.forceRender_Detailed_neoBuilding(GL, cameraPosition, scene, currentShader, renderTexture, this.currentVisibleNeoBuildings_array[i]);
		}
		
		//this.render_Detailed_neoBuilding(GL, cameraPosition, scene, currentShader, renderTexture);
		
		GL.disableVertexAttribArray(currentShader.normal3_loc);
		GL.disableVertexAttribArray(currentShader.position3_loc);
		//GL.disableVertexAttribArray(currentShader.texCoord2_loc); // No textures for depth render.***
	
		this.depthFboNeo.unbind();
		
		// 2) ssao render.************************************************************************************************************
		scene._context._currentFramebuffer._bind();
		currentShader = this.f4d_postFxShadersManager.pFx_shaders_array[4];
		
		GL.clearColor(0, 0, 0, 1);
		//GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		GL.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
		
		if(this.noiseTexture == undefined)
		this.noiseTexture = genNoiseTextureRGBA(GL, 4, 4);
		
		shaderProgram = currentShader.program;
		GL.useProgram(shaderProgram);
		GL.enableVertexAttribArray(currentShader.texCoord2_loc);
		GL.enableVertexAttribArray(currentShader.position3_loc);
		GL.enableVertexAttribArray(currentShader.normal3_loc);

		GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
		GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
		GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
		GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
		GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix); // original.***
		
			GL.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding._buildingPositionHIGH);
		  GL.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding._buildingPositionLOW);

		GL.uniform1f(currentShader.near_loc, frustum._near);	
		//GL.uniform1f(currentShader.far_loc, frustum._far); // Original.***
		GL.uniform1f(currentShader.far_loc, current_frustum_far); // test.***	
		
		GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
		GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
			
		GL.uniform1i(currentShader.depthTex_loc, 0);	
		GL.uniform1i(currentShader.noiseTex_loc, 1);	
		GL.uniform1i(currentShader.diffuseTex_loc, 2);
		GL.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
		GL.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
		GL.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
		GL.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
		GL.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);	
		GL.uniform3fv(currentShader.kernel16_loc, this.kernel);	
			GL.activeTexture(GL.TEXTURE0);
			GL.bindTexture(GL.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***		
			GL.activeTexture(GL.TEXTURE1);            
			GL.bindTexture(GL.TEXTURE_2D, this.noiseTexture); 
			
		renderTexture = true;
		// Test.***
		
		var neoBuildingCount = this.currentVisibleNeoBuildings_array.length;
		for(var i=0; i <neoBuildingCount; i++)
		{
			this.detailed_neoBuilding = this.currentVisibleNeoBuildings_array[i];
			GL.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding._buildingPositionHIGH);
			GL.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding._buildingPositionLOW);
			this.forceRender_Detailed_neoBuilding(GL, cameraPosition, scene, currentShader, renderTexture, this.currentVisibleNeoBuildings_array[i]);
		}
		
		//this.render_Detailed_neoBuilding(GL, cameraPosition, scene, currentShader, renderTexture);
		
		GL.disableVertexAttribArray(currentShader.normal3_loc);
		GL.disableVertexAttribArray(currentShader.position3_loc);
		GL.disableVertexAttribArray(currentShader.texCoord2_loc);
		
	}
	
	
	/*
	
	
	var neoBuildings_count = this.curentVisiblesOctrees_array.length;
	for(var i=0; i<neoBuildings_count; i++)
	{
		var neoBuilding = this.f4d_neoBuildingsList.neoBuildings_Array[i];

	}
	*/
};

f4d_manager.prototype.render_Detailed_neoBuilding = function(GL, cameraPosition, scene, shader, renderTexture)
{
	this.isCameraMoving = this.isButtonDown(scene);
	
	// must make a relative camera for the building, to do octrees frustum culling.***
	transformedCamPos = this.detailed_neoBuilding.getTransformedRelativeEyePosition_toBuilding(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	this.isCameraInsideNeoBuilding = this.detailed_neoBuilding.isCameraInsideOfBuilding(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
	if(!this.isCameraMoving)
	{
		// Determine if the camera is inside of the building.***
		this.intCRefList_array.length = 0; // Init.***

		if(this.isCameraInsideNeoBuilding)
		{
			if(this.myCameraSC == undefined) this.myCameraSC = new Cesium.Camera(scene);
			
			if(this.detailed_neoBuilding.buildingPosMat_inv == undefined)
			{
			  this.detailed_neoBuilding.buildingPosMat_inv = new f4d_Matrix4();
			  this.detailed_neoBuilding.buildingPosMat_inv.setByFloat32Array(this.detailed_neoBuilding.move_matrix_inv);
			}
			
			var camera = scene.frameState.camera;
			var cameraDir = camera.direction;
			var transformedCamDir = undefined;
			var transformedCamUp = undefined;
			
			this.pointSC.set(cameraDir.x, cameraDir.y, cameraDir.z);
			transformedCamDir = this.detailed_neoBuilding.buildingPosMat_inv.transformPoint3D(this.pointSC, transformedCamDir);
			this.pointSC.set(camera.up.x, camera.up.y, camera.up.z);
			transformedCamUp = this.detailed_neoBuilding.buildingPosMat_inv.transformPoint3D(this.pointSC, transformedCamUp);
			
			
			this.myCameraSC.position.x = transformedCamPos.x;
			this.myCameraSC.position.y = transformedCamPos.y;
			this.myCameraSC.position.z = transformedCamPos.z;
			
			this.myCameraSC.direction.x = transformedCamDir.x;
			this.myCameraSC.direction.y = transformedCamDir.y;
			this.myCameraSC.direction.z = transformedCamDir.z;
			
			this.myCameraSC.up.x = transformedCamUp.x;
			this.myCameraSC.up.y = transformedCamUp.y;
			this.myCameraSC.up.z = transformedCamUp.z;
			
			var myCullingVolume = this.myCameraSC.frustum.computeCullingVolume(this.myCameraSC.position, this.myCameraSC.direction, this.myCameraSC.up);
		
			// then do frustum culling for interior octree.***
			this.intNeoRefList_array.length = 0;
			this.detailed_neoBuilding.octree.getFrustumVisibleNeoRefListArray(myCullingVolume, this.intNeoRefList_array, this.boundingSphere_Aux, transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
			for(var i=0; i<this.intNeoRefList_array.length; i++)
			{
				this.intNeoRefList_array[i].update_currentVisibleIndices_Interior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
			}
		}
		this.detailed_neoBuilding.update_currentVisibleIndices_exterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
	}

	
	//if(picking)// refrence: http://learningwebgl.com/blog/?p=1786
	//var f4d_shadersManager = this.f4d_shadersManager;
	//var standardShader = f4d_shadersManager.get_f4dShader(0);
	
	// Test for samsung.***********************************************************
	/*
	var neoBuildingCount = this.curentVisiblesOctrees_array.length;
		for(var i=0; i <neoBuildingCount; i++)
		{
			this.detailed_neoBuilding = this.curentVisiblesOctrees_array[i];
			var isInterior = false;
			this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array[0]._currentVisibleIndices.length = 0;
			this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array[0]._currentVisibleIndices.push(0);
			this.f4dRenderer.render_F4D_neoRefLists(GL, this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
		}
		*/
	// End Test for samsung.-------------------------------------------------------
	
	//var frameState = scene._frameState;
	
	
	
	var isInterior = false;
	this.f4dRenderer.render_F4D_neoRefLists(GL, this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
	//this.f4dRenderer.forceRender_F4D_neoRefLists(GL, this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
		
	if(this.isCameraInsideNeoBuilding && this.intNeoRefList_array.length)
	{
		isInterior = true;
		this.f4dRenderer.render_F4D_neoRefLists(GL, this.intNeoRefList_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
		//this.f4dRenderer.forceRender_F4D_neoRefLists(GL, this.intNeoRefList_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
		
		
		
		//exteriorNeoRefsList.length = 0;
		//exteriorNeoRefsList.push(this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array[3]);
		//this.f4dRenderer.render_F4D_neoRefLists(GL, exteriorNeoRefsList, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
	}
	
};

f4d_manager.prototype.forceRender_Detailed_neoBuilding = function(GL, cameraPosition, scene, shader, renderTexture, neoBuilding)
{


	
	//if(picking)// refrence: http://learningwebgl.com/blog/?p=1786
	//var f4d_shadersManager = this.f4d_shadersManager;
	//var standardShader = f4d_shadersManager.get_f4dShader(0);
	
	// Test for samsung.***********************************************************
	/*
	var neoBuildingCount = this.curentVisiblesOctrees_array.length;
		for(var i=0; i <neoBuildingCount; i++)
		{
			this.detailed_neoBuilding = this.curentVisiblesOctrees_array[i];
			var isInterior = false;
			this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array[0]._currentVisibleIndices.length = 0;
			this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array[0]._currentVisibleIndices.push(0);
			this.f4dRenderer.render_F4D_neoRefLists(GL, this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
		}
		*/
	// End Test for samsung.-------------------------------------------------------
	
	//var frameState = scene._frameState;
	
	
	
	var isInterior = false;
	this.f4dRenderer.forceRender_F4D_neoRefLists(GL, neoBuilding._neoRefLists_Container.neoRefsLists_Array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture);
	
};

f4d_manager.prototype.render_DetailedBuilding = function(GL, cameraPosition, _modelViewProjectionRelativeToEye, scene, shader)
{
	// Test for background task.*******************************************
	//this.worker_sonGeometry.building_project = scene.detailed_building;
	// End for Test for background task.-----------------------------------

	// must make a relative camera for the building, to do octrees frustum culling.***
	transformedCamPos = this.detailed_building.getTransformedRelativeEyePosition_toBuilding(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	this.isCameraInsideBuilding = this.detailed_building.isCameraInsideOfBuilding(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);

	console.log("[Is Camera In Inner Box???] : " + this.isCameraInsideBuilding);

	if(!this.isCameraMoving)
	{
		// Determine if the camera is inside of the building.***
		this.intCRefList_array.length = 0; // Init.***

		if(this.isCameraInsideBuilding)
		{
			if(this.myCameraSC == undefined) this.myCameraSC = new Cesium.Camera(scene);
			
			if(this.detailed_building.buildingPosMat_inv == undefined)
			{
			  this.detailed_building.buildingPosMat_inv = new f4d_Matrix4();
			  this.detailed_building.buildingPosMat_inv.setByFloat32Array(this.detailed_building.move_matrix_inv);
			}
			
			var camera = scene.frameState.camera;
			var cameraDir = camera.direction;
			var transformedCamDir = undefined;
			var transformedCamUp = undefined;
			
			this.pointSC.set(cameraDir.x, cameraDir.y, cameraDir.z);
			transformedCamDir = this.detailed_building.buildingPosMat_inv.transformPoint3D(this.pointSC, transformedCamDir);
			this.pointSC.set(camera.up.x, camera.up.y, camera.up.z);
			transformedCamUp = this.detailed_building.buildingPosMat_inv.transformPoint3D(this.pointSC, transformedCamUp);
			
			
			this.myCameraSC.position.x = transformedCamPos.x;
			this.myCameraSC.position.y = transformedCamPos.y;
			this.myCameraSC.position.z = transformedCamPos.z;
			
			this.myCameraSC.direction.x = transformedCamDir.x;
			this.myCameraSC.direction.y = transformedCamDir.y;
			this.myCameraSC.direction.z = transformedCamDir.z;
			
			this.myCameraSC.up.x = transformedCamUp.x;
			this.myCameraSC.up.y = transformedCamUp.y;
			this.myCameraSC.up.z = transformedCamUp.z;
			
			var myCullingVolume = this.myCameraSC.frustum.computeCullingVolume(this.myCameraSC.position, this.myCameraSC.direction, this.myCameraSC.up);
		
			// then do frustum culling for interior octree.***
			this.detailed_building.octree.getFrustumVisibleCRefListArray(myCullingVolume, this.intCRefList_array, this.boundingSphere_Aux, transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
			for(var i=0; i<this.intCRefList_array.length; i++)
			{
				//this.intCRefList_array[i].update_currentVisibleIndices_Interior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);

				var totalRefCount = this.intCRefList_array[i]._compoundRefsArray.length;
				this.intCRefList_array[i]._currentVisibleIndices = [];
				for(var j = 0; j < totalRefCount; j++)
					this.intCRefList_array[i]._currentVisibleIndices[j] = j;
			}
		}
		this.detailed_building.update_currentVisibleIndices_exterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
	}

	
	//if(picking)// refrence: http://learningwebgl.com/blog/?p=1786
	//var f4d_shadersManager = this.f4d_shadersManager;
	//var standardShader = f4d_shadersManager.get_f4dShader(0);
	
	//var frameState = scene._frameState;
	var isInterior = false;
	this.f4dRenderer.render_F4D_compRefLists_v1(GL, this.detailed_building._compRefList_Container._compRefsList_Array, this.detailed_building, 
		this.modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, isInterior, shader);
		
	if(this.isCameraInsideBuilding && this.intCRefList_array.length)
	{
		isInterior = true;
		this.f4dRenderer.render_F4D_compRefLists_v1(GL, this.intCRefList_array, this.detailed_building, 
			this.modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, isInterior, shader);

	}
};

f4d_manager.prototype.create_FirstTime_VBO_CacheKeys= function(GL, BR_Project)
{
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
	var vt_cacheKey = simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0];
	
	// interleaved vertices_texCoords.***
	vt_cacheKey._verticesArray_cacheKey = GL.createBuffer ();
	GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._verticesArray_cacheKey);
	GL.bufferData(GL.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer, GL.STATIC_DRAW);
	simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer = null;
	
	// normals.***
	if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer != undefined)
	{
		vt_cacheKey._normalsArray_cacheKey = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._normalsArray_cacheKey);
		GL.bufferData(GL.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer, GL.STATIC_DRAW);
		simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer = null;
	}

	// Simple building texture(create 1pixel X 1pixel bitmap).****************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	if(simpBuildingV1._simpleBuildingTexture == undefined)
			simpBuildingV1._simpleBuildingTexture = GL.createTexture();
	
	// Test wait for texture to load.********************************************
	//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
	GL.bindTexture(GL.TEXTURE_2D, simpBuildingV1._simpleBuildingTexture);
	//GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
	GL.bindTexture(GL.TEXTURE_2D, null);
	BR_Project._f4d_nailImage_readed_finished = true;
}

f4d_manager.prototype.reCalculate_ModelViewProjectionRelToEyeMatrix = function(scene)
{
	if(scene.context._us._modelView[0] == 0 && scene.context._us._modelView[1] == 0 && scene.context._us._modelView[2] == 0 && scene.context._us._modelView[3] == 0 && 
	scene.context._us._modelView[4] == 0 && scene.context._us._modelView[5] == 0 && scene.context._us._modelView[6] == 0 && scene.context._us._modelView[7] == 0 && 
	scene.context._us._modelView[8] == 0 && scene.context._us._modelView[9] == 0 && scene.context._us._modelView[10] == 0 && scene.context._us._modelView[11] == 0 && 
	scene.context._us._modelView[12] == 0 && scene.context._us._modelView[13] == 0 && scene.context._us._modelView[14] == 0 && scene.context._us._modelView[15] == 0 )
	{
		return;
	}
	var modelViewRelToEye = new Cesium.Matrix4();
	modelViewRelToEye = Cesium.Matrix4.clone(scene.context._us._modelView);
	modelViewRelToEye[12] = 0.0;
	modelViewRelToEye[13] = 0.0;
	modelViewRelToEye[14] = 0.0;
	var modelViewProjectionRelToEye = new Cesium.Matrix4();
	Cesium.Matrix4.multiply(scene.context._us._projection, modelViewRelToEye, modelViewProjectionRelToEye);
	Cesium.Matrix4.toArray(modelViewProjectionRelToEye, this.modelViewProjRelToEye_matrix); 
}

f4d_manager.prototype.render_F4D_Projects_TerranTileServiceFormat_PostFxShader = function(GL, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum, frustum_idx)
{
	if(this.isCameraInsideNeoBuilding)
		return;
	
	GL.disable(GL.CULL_FACE); // Optional.***
	
	if(!isLastFrustum)return;
		
	
	this.isCameraMoving = this.isButtonDown(scene);
	
	// Check if camera was moved considerably for update the renderables objects.***
	
	if(this.detailed_building)
	{
		this.squareDistUmbral = 0.5*0.5;
	}
	else{
		this.squareDistUmbral = 5*5;
	}
	var cameraMoved = this.isCameraMoved(cameraPosition, this.squareDistUmbral);
	
	if(this.depthFbo == undefined)this.depthFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	//if(this.normalFbo == undefined)this.normalFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	if(this.ssaoFbo == undefined)this.ssaoFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	//if(this.ssaoFSQuad == undefined)this.ssaoFSQuad = new FullScreenQuad(GL);
	
	// Another check for depthBuffer.***
	if(this.depthFbo.width != scene.drawingBufferWidth || this.depthFbo.height != scene.drawingBufferHeight)
	{
		this.depthFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}
	
	//this.renders_counter++;
	// Init the visible buildings array.***************************
	//this.currentVisibleBuildings_array.length = 0; // Init.***
	//this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
	//this.detailed_building = undefined;
	//-------------------------------------------------------------

	//if(cameraMoved && !this.isCameraMoving)
	if(!this.isCameraMoving)
	{
		this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // test ok.***
		this.doFrustumCulling_terranTile_serviceFormat(GL, cullingVolume, this.currentVisibleBuildings_array, cameraPosition); 
	}
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	this.reCalculate_ModelViewProjectionRelToEyeMatrix(scene);

	//Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEye_matrix); // Original.*** 
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	

	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculate_encodedCameraPositionMC_HighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);

	// *************************************************************************************************************************************************
	// Now, render the detailed building if exist.******************************************************************************************************

	var transformedCamPos = undefined;
	var currentShader = undefined;
	if(this.detailed_building && isLastFrustum)
	{
		currentShader = this.f4d_shadersManager.get_f4dShader(0);
		this.render_DetailedBuilding(GL, cameraPosition, _modelViewProjectionRelativeToEye, scene, currentShader);
	}
	// End render the detailed building if exist.---------------------------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------------------------------------------------------------------
	// Save the cesium framebuffer.***
	var cesium_frameBuffer = scene._context._currentFramebuffer._framebuffer;
	//var cesium_frameBuffer = scene._context._currentFramebuffer;
	
	// Now, render the simple visible buildings.***************************************************************************
	GL.enable(GL.DEPTH_TEST);
	  GL.depthFunc(GL.LEQUAL); 
	  GL.depthRange(0, 1);
	  
	  var shaderProgram = undefined;
	  
	//currentShader = this.f4d_shadersManager.get_f4dShader(3); // Original.***
	//currentShader = this.f4d_shadersManager.get_f4dShader(7);
	
	/*
	var shaderProgram = currentShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(currentShader._texcoord);
	GL.enableVertexAttribArray(currentShader._position);
	GL.enableVertexAttribArray(currentShader._normal);

	GL.uniformMatrix4fv(currentShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	GL.uniform3fv(currentShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	GL.uniform3fv(currentShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	*/

	//GL.activeTexture(GL.TEXTURE0);
	
	// Calculate the normal_matrix.***
	//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL
	// this code must be executed if the camera was moved.***
	var cameraLittleMoved = this.isCameraMoved(cameraPosition, 10);
	//if(cameraLittleMoved)
	{
		var mvMat = scene._context._us._modelView; // original.***
		//var mvMat = scene._context._us._modelViewRelativeToEye;
		//mvMat[12] = 0.0;
		//mvMat[13] = 0.0;
		//mvMat[14] = 0.0;
		var mvMat_inv = new Cesium.Matrix4();
		mvMat_inv = Cesium.Matrix4.inverse(mvMat, mvMat_inv);
		//var normalMat = new Cesium.Matrix4();
		this.normalMat4 = Cesium.Matrix4.transpose(mvMat_inv, this.normalMat4);// Original.***
		//this.normalMat4 = Cesium.Matrix4.clone(mvMat_inv, this.normalMat4);
		this.normalMat3 = Cesium.Matrix4.getRotation(this.normalMat4, this.normalMat3);
	}
	
	Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
	Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 
	//GL.uniformMatrix3fv(currentShader._NormalMatrix, false, this.normalMat3_array);
	
	
	//------------------------------------------------------
	this.render_time = 0;
	if(this.isCameraMoving)
	{
		this.dateSC = new Date();
		this.currentTimeSC = undefined;
		this.startTimeSC = this.dateSC.getTime();
	}
	
	////////////////////////////////////
	this.currentVisibleBuildingsPost_array.length = 0;
	
	var filePath_scratch = "";
	var camera = scene._camera;
	var frustum = camera.frustum;
	var current_frustum_near = scene._context._us._currentFrustum.x;
	var current_frustum_far = scene._context._us._currentFrustum.y;
	current_frustum_far = 5000.0;
	
	// Depth render.********************************************************
	// Depth render.********************************************************
	// Depth render.********************************************************
	this.depthFbo.bind(); // DEPTH START.**************************************************************************************************************************************************
		GL.clearColor(0, 0, 0, 1);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		GL.viewport(0, 0, this.depthFbo.width, this.depthFbo.height);  
		
		currentShader = this.f4d_postFxShadersManager.pFx_shaders_array[0];
	
	shaderProgram = currentShader.program;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(currentShader.texCoord2_loc);
	GL.enableVertexAttribArray(currentShader.position3_loc);
	GL.enableVertexAttribArray(currentShader.normal3_loc);

	GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	GL.uniform1f(currentShader.near_loc, frustum._near);	
	//GL.uniform1f(currentShader.far_loc, frustum._far);	// Original (bad)..***
	GL.uniform1f(currentShader.far_loc, current_frustum_far); // test (best)..***	
	
	GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
	
	//GL.uniform1i(currentShader.useRefTransfMatrix_loc, false, false);
	
	//*******************************************************************************************************************************
	// LOD0 BUILDINGS.***************************************************************************************************************

	// Now, render LOD0 texture buildings.***
	var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
	for(var i=0; i<LOD0_projectsCount; i++)
	{
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];
		
		//if(!this.isCameraMoving)
		{
			// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
			if(BR_Project._header._f4d_version == 2)
			{
				//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
				var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
				if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
				{
					this.create_FirstTime_VBO_CacheKeys(GL, BR_Project);
					continue;
				}
				else if(!BR_Project._f4d_nailImage_readed)
				{
					if(this.backGround_imageReadings_count < 100)
					{
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						///////////////////////////////////////////////////////////
						this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
						//--------------------------------------------------------------------------
					}
					continue;
				}
				else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists)
				{
					if(!this.isCameraMoving && this.backGround_fileReadings_count < 1)
					{
						//filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
						filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/Images/" + BR_Project._header._global_unique_id + ".jpg";
						
						this.f4d_readerWriter.readF4D_NailImage_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this, 0); 
						this.backGround_fileReadings_count ++;

					}
					//continue;
				}
				
			}
			else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}

		}
		
		//--------------------------------------------------------------------------------------------------------------
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1)// Test
		{
			//render_F4D_simpleBuilding_V1_PostFxShader
			if(BR_Project._f4d_lod0Image_exists)
			{
				if(BR_Project._f4d_lod0Image_readed_finished)
					this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 0, currentShader); // 0 = lod0.***

				else if(BR_Project._f4d_nailImage_readed_finished)
				{
					this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
				}
			}
			else if(BR_Project._f4d_nailImage_readed_finished)
			{
				this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
			}
		}
	}
	
	//********************************************************************************************************************************************
	var projects_count = this.currentVisibleBuildings_array.length;
	for(var p_counter = 0; p_counter<projects_count; p_counter++)
	{

		
		var BR_Project = this.currentVisibleBuildings_array[p_counter];
		
		//if(!this.isCameraMoving)
		{
			// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
			if(BR_Project._header._f4d_version == 2)
			{
				//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
				var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
				if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
				{
					this.create_FirstTime_VBO_CacheKeys(GL, BR_Project);
					continue;
				}
				
				else if(!BR_Project._f4d_nailImage_readed)
				{
					if(this.backGround_imageReadings_count < 100)
					{
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						//--------------------------------------------------------------------------
						///////////////////////////////////////////////////////////
						this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
						//--------------------------------------------------------------------------
					}
					continue;
				}
				
			}
			else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}
		
		}
		
		//--------------------------------------------------------------------------------------------------------------
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished)// Test
		{
			this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
		}

	}
	GL.disableVertexAttribArray(currentShader.texCoord2_loc);
	GL.disableVertexAttribArray(currentShader.position3_loc);
	GL.disableVertexAttribArray(currentShader.normal3_loc);
	this.depthFbo.unbind(); // DEPTH END.*****************************************************************************************************************************************************************
	
	
	
	//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	// Now, ssao.************************************************************
	// Now, ssao.************************************************************
	// Now, ssao.************************************************************
	scene._context._currentFramebuffer._bind();
	
	if(this.depthFbo.width != scene.drawingBufferWidth || this.depthFbo.height != scene.drawingBufferHeight)
	{
		this.depthFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}
	
	//this.ssaoFbo.bind();// SSAO START.********************************************************************************************************************************************************************
		GL.clearColor(0, 0, 0, 1);
		//GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		GL.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
		
		if(this.noiseTexture == undefined)
		this.noiseTexture = genNoiseTextureRGBA(GL, 4, 4);
	
	currentShader = this.f4d_postFxShadersManager.pFx_shaders_array[1];
	
	shaderProgram = currentShader.program;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(currentShader.texCoord2_loc);
	GL.enableVertexAttribArray(currentShader.position3_loc);
	GL.enableVertexAttribArray(currentShader.normal3_loc);

	GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix); // original.***

	GL.uniform1f(currentShader.near_loc, frustum._near);	
	//GL.uniform1f(currentShader.far_loc, frustum._far); // Original.***
	GL.uniform1f(currentShader.far_loc, current_frustum_far); // test.***	
	
	GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
		
	GL.uniform1i(currentShader.depthTex_loc, 0);	
	GL.uniform1i(currentShader.noiseTex_loc, 1);	
	GL.uniform1i(currentShader.diffuseTex_loc, 2);
	GL.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
	GL.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
	GL.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
	GL.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
	GL.uniform2fv(currentShader.noiseScale2_loc, [this.depthFbo.width/this.noiseTexture.width, this.depthFbo.height/this.noiseTexture.height]);	
	GL.uniform3fv(currentShader.kernel16_loc, this.kernel);	
		GL.activeTexture(GL.TEXTURE0);
		GL.bindTexture(GL.TEXTURE_2D, this.depthFbo.colorBuffer);  // original.***		
		GL.activeTexture(GL.TEXTURE1);            
		GL.bindTexture(GL.TEXTURE_2D, this.noiseTexture); 
		
			//*******************************************************************************************************************************
			// LOD0 BUILDINGS.***************************************************************************************************************
			// Now, render LOD0 texture buildings.***
			var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
			for(var i=0; i<LOD0_projectsCount; i++)
			{
				var BR_Project = this.currentVisibleBuildings_LOD0_array[i];
				
				//if(!this.isCameraMoving)
				{
					// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
					if(BR_Project._header._f4d_version == 2)
					{
						//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
						var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
						if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
						{
							this.create_FirstTime_VBO_CacheKeys(GL, BR_Project);
							continue;
						}
						else if(!BR_Project._f4d_nailImage_readed)
						{
							if(this.backGround_imageReadings_count < 100)
							{
								this.backGround_imageReadings_count++;
								BR_Project._f4d_nailImage_readed = true;
								
								var simpBuildingV1 = BR_Project._simpleBuilding_v1;
								///////////////////////////////////////////////////////////
								this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
								//--------------------------------------------------------------------------
							}
							continue;
						}
						else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists)
						{
							if(!this.isCameraMoving && this.backGround_fileReadings_count < 1)
							{
								//filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
								filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/Images/" + BR_Project._header._global_unique_id + ".jpg";
								
								this.f4d_readerWriter.readF4D_NailImage_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this, 0); 
								this.backGround_fileReadings_count ++;

							}
							//continue;
						}
						
					}
					else{
						this.currentVisibleBuildingsPost_array.push(BR_Project);
					}

				}
				
				//--------------------------------------------------------------------------------------------------------------
				
				//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
				if(BR_Project._simpleBuilding_v1)// Test
				{
					//render_F4D_simpleBuilding_V1_PostFxShader
					if(BR_Project._f4d_lod0Image_exists)
					{
						if(BR_Project._f4d_lod0Image_readed_finished)
							this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 0, currentShader); // 0 = lod0.***

						else if(BR_Project._f4d_nailImage_readed_finished)
						{
							this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
						}
					}
					else if(BR_Project._f4d_nailImage_readed_finished)
					{
						this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
					}
				}
			}
			
			//********************************************************************************************************************************************
			var projects_count = this.currentVisibleBuildings_array.length;
			for(var p_counter = 0; p_counter<projects_count; p_counter++)
			{
				/*
				if(!isLastFrustum && this.isCameraMoving && timeControlCounter == 0)
				{
					date = new Date();
					currentTime = date.getTime();
					secondsUsed = currentTime - startTime;
					if(secondsUsed > 20) // miliseconds.***
					{
						GL.disableVertexAttribArray(shader._texcoord);
						GL.disableVertexAttribArray(shader._position);
						return;
					}
					
				}
				*/
				
				var BR_Project = this.currentVisibleBuildings_array[p_counter];
				
				//if(!this.isCameraMoving)
				{
					// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
					if(BR_Project._header._f4d_version == 2)
					{
						//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
						var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
						if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
						{
							this.create_FirstTime_VBO_CacheKeys(GL, BR_Project);
							continue;
						}
						
						else if(!BR_Project._f4d_nailImage_readed)
						{
							if(this.backGround_imageReadings_count < 100)
							{
								this.backGround_imageReadings_count++;
								BR_Project._f4d_nailImage_readed = true;
								
								var simpBuildingV1 = BR_Project._simpleBuilding_v1;
								//--------------------------------------------------------------------------
								///////////////////////////////////////////////////////////
								this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
								//--------------------------------------------------------------------------
							}
							continue;
						}
						
					}
					else{
						this.currentVisibleBuildingsPost_array.push(BR_Project);
					}
				
				}
				
				//--------------------------------------------------------------------------------------------------------------
				
				//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
				if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished)// Test
				{
					this.f4dRenderer.render_F4D_simpleBuilding_V1_PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
				}
				/*
				if(this.isCameraMoving)
				{
					this.dateSC = new Date();
					this.currentTimeSC = this.dateSC.getTime();
					if(this.currentTimeSC-this.startTimeSC > this.maxMilisecondsForRender)
					{
						GL.disableVertexAttribArray(shader._texcoord);
						GL.disableVertexAttribArray(shader._position);
						return;
					}
				}
				*/
			}
			
			
		GL.activeTexture(GL.TEXTURE0);  
		//this.ssaoFbo.unbind();
		
		
	GL.disableVertexAttribArray(currentShader.texCoord2_loc);
	GL.disableVertexAttribArray(currentShader.position3_loc);
	GL.disableVertexAttribArray(currentShader.normal3_loc);	
	//this.ssaoFbo.unbind();// SSAO END.********************************************************************************************************************************************************************
	
	
	
	//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	// Now, blur.************************************************************
	// Now, blur.************************************************************
	// Now, blur.************************************************************
	/*
	scene._context._currentFramebuffer._bind();
	
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	
	currentShader = this.f4d_postFxShadersManager.pFx_shaders_array[2]; // blur.***
	
	shaderProgram = currentShader.program;
	GL.useProgram(shaderProgram);
	
	GL.enableVertexAttribArray(currentShader.texCoord2_loc);
	GL.enableVertexAttribArray(currentShader.position3_loc);
	//GL.enableVertexAttribArray(currentShader.normal3_loc);
	
	this.modelView_matrix[12] = 0.0;
	this.modelView_matrix[13] = 0.0;
	this.modelView_matrix[14] = 0.0;
	
	GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	
	GL.uniform1i(currentShader.colorTex_loc, 0);	
	GL.uniform2fv(currentShader.texelSize_loc, [1/this.ssaoFbo.width, 1/this.ssaoFbo.height]);	
	GL.activeTexture(GL.TEXTURE0);
	//GL.bindTexture(GL.TEXTURE_2D, this.ssaoFbo.colorBuffer); // original.*** 
	GL.bindTexture(GL.TEXTURE_2D, scene._context._currentFramebuffer.colorBuffer);
		//scene._context._currentFramebuffer._bind();	
	this.ssaoFSQuad.draw(currentShader, GL); 
	GL.activeTexture(GL.TEXTURE0);
		
		
	GL.disableVertexAttribArray(currentShader.texCoord2_loc);
	GL.disableVertexAttribArray(currentShader.position3_loc);
	//GL.disableVertexAttribArray(currentShader.normal3_loc);	
	*/
	// END BLUR.**************************************************************************************************************************************************************************************************************
	
	
	GL.viewport(0, 0, scene._canvas.width, scene._canvas.height);
	
	scene._context._currentFramebuffer._bind();
	//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, cesium_frameBuffer);
	// Render the lasts simpleBuildings.***
	
	var last_simpBuilds_count = this.currentVisibleBuildingsPost_array.length;
	
	for(var i=0; i<last_simpBuilds_count; i++)
	{
		this.f4dRenderer.render_F4D_simpleBuilding(GL, this.currentVisibleBuildingsPost_array[i], this.modelViewProjRelToEye_matrix, 
				this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
	}
	
	//GL.useProgram(null);
	//GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);

};


f4d_manager.prototype.render_F4D_Projects_TerranTileServiceFormat = function(GL, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum)
{
	GL.disable(GL.CULL_FACE); // Optional.***
	
	this.isCameraMoving = this.isButtonDown(scene);
	
	// Check if camera was moved considerably for update the renderables objects.***
	
	if(this.detailed_building)
	{
		this.squareDistUmbral = 4.5*4.5;
	}
	else{
		this.squareDistUmbral = 50*50;
	}
	var cameraMoved = this.isCameraMoved(cameraPosition, this.squareDistUmbral);
	
	//this.renders_counter++;
	// Init the visible buildings array.***************************
	//this.currentVisibleBuildings_array.length = 0; // Init.***
	//this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
	//this.detailed_building = undefined;
	//-------------------------------------------------------------

	//if(cameraMoved && !this.isCameraMoving)
	if(!this.isCameraMoving)
	{
		this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // test ok.***
		this.doFrustumCulling_terranTile_serviceFormat(GL, cullingVolume, this.currentVisibleBuildings_array, cameraPosition); 
	}

	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------

	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculate_encodedCameraPositionMC_HighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);

	// *************************************************************************************************************************************************
	// Now, render the detailed building if exist.******************************************************************************************************

	var transformedCamPos = undefined;
	if(this.detailed_building && isLastFrustum)
	{
		var standardShader = this.f4d_shadersManager.get_f4dShader(0);
		this.render_DetailedBuilding(GL, cameraPosition, _modelViewProjectionRelativeToEye, scene, standardShader);
	}
	// End render the detailed building if exist.---------------------------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------------------------------------------------------------------
	
	// Now, render the simple visible buildings.***************************************************************************
	//var shader = this.f4d_shadersManager.get_f4dShader(3); // Original.***
	var shader = this.f4d_shadersManager.get_f4dShader(7);
	var shaderProgram = shader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(shader._texcoord);
	GL.enableVertexAttribArray(shader._position);
	GL.enableVertexAttribArray(shader._normal);
	
	GL.enable(GL.DEPTH_TEST);
	  GL.depthFunc(GL.LEQUAL); 
	  GL.depthRange(0, 1);

	  GL.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	  GL.uniform3fv(shader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	  GL.uniform3fv(shader._encodedCamPosLOW, this.encodedCamPosMC_Low);

	GL.activeTexture(GL.TEXTURE0);
	
	// Calculate the normal_matrix.***
	//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL
	// this code must be executed if the camera was moved.***
	var cameraLittleMoved = this.isCameraMoved(cameraPosition, 10);
	if(cameraLittleMoved)
	{
		var mvMat = scene._context._us._modelView;
		var mvMat_inv = new Cesium.Matrix4();
		mvMat_inv = Cesium.Matrix4.inverse(mvMat, mvMat_inv);
		var normalMat = new Cesium.Matrix4();
		normalMat = Cesium.Matrix4.transpose(mvMat_inv, normalMat);
		this.normalMat3 = Cesium.Matrix4.getRotation(normalMat, this.normalMat3);
	}
	Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
	GL.uniformMatrix3fv(shader._NormalMatrix, false, this.normalMat3_array);
	
	//------------------------------------------------------
	this.render_time = 0;
	if(this.isCameraMoving)
	{
		this.dateSC = new Date();
		this.currentTimeSC = undefined;
		this.startTimeSC = this.dateSC.getTime();
	}
	
	////////////////////////////////////
	this.currentVisibleBuildingsPost_array.length = 0;
	
	var filePath_scratch = "";
	
	//*******************************************************************************************************************************
	// LOD0 BUILDINGS.***************************************************************************************************************
	//this.filteredVisibleTiles_array.length;
	//this.detailedVisibleTiles_array.length;
	//this.LOD0VisibleTiles_array.length;

	// Now, render LOD0 texture buildings.***
	var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
	for(var i=0; i<LOD0_projectsCount; i++)
	{
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];
		
		//if(!this.isCameraMoving)
		{
			// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
			if(BR_Project._header._f4d_version == 2)
			{
				//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
				var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
				if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
				{
					this.create_FirstTime_VBO_CacheKeys(GL, BR_Project);
					continue;
				}
				else if(!BR_Project._f4d_nailImage_readed)
				{
					if(this.backGround_imageReadings_count < 100)
					{
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						///////////////////////////////////////////////////////////
						this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
						//--------------------------------------------------------------------------
					}
					continue;
				}
				else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists)
				{
					if(!this.isCameraMoving && this.backGround_fileReadings_count < 1)
					{
						//filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
						filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/Images/" + BR_Project._header._global_unique_id + ".jpg";
						
						this.f4d_readerWriter.readF4D_NailImage_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this, 0); 
						this.backGround_fileReadings_count ++;

					}
					//continue;
				}
				
			}
			else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}

		}
		
		//--------------------------------------------------------------------------------------------------------------
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1)// Test
		{
			
			if(BR_Project._f4d_lod0Image_exists)
			{
				if(BR_Project._f4d_lod0Image_readed_finished)
					this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this, 0); // 0 = lod0.***
				else if(BR_Project._f4d_nailImage_readed_finished)
				{
					this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this, 3); // 3 = lod3.***
				}
			}
			else if(BR_Project._f4d_nailImage_readed_finished)
			{
				this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this, 3); // 3 = lod3.***
			}
		}
	}
	
	//********************************************************************************************************************************************
	var projects_count = this.currentVisibleBuildings_array.length;
	for(var p_counter = 0; p_counter<projects_count; p_counter++)
	{
		/*
		if(!isLastFrustum && this.isCameraMoving && timeControlCounter == 0)
		{
			date = new Date();
			currentTime = date.getTime();
			secondsUsed = currentTime - startTime;
			if(secondsUsed > 20) // miliseconds.***
			{
				GL.disableVertexAttribArray(shader._texcoord);
				GL.disableVertexAttribArray(shader._position);
				return;
			}
			
		}
		*/
		
		var BR_Project = this.currentVisibleBuildings_array[p_counter];
		
		//if(!this.isCameraMoving)
		{
			// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
			if(BR_Project._header._f4d_version == 2)
			{
				//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
				var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
				if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
				{
					this.create_FirstTime_VBO_CacheKeys(GL, BR_Project);
					continue;
				}
				
				else if(!BR_Project._f4d_nailImage_readed)
				{
					if(this.backGround_imageReadings_count < 100)
					{
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						//--------------------------------------------------------------------------
						///////////////////////////////////////////////////////////
						this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
						//--------------------------------------------------------------------------
					}
					continue;
				}
				
			}
			else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}
		
		}
		
		//--------------------------------------------------------------------------------------------------------------
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished)// Test
		{
			this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this, 3); // 3 = lod3.***
		}
		/*
		if(this.isCameraMoving)
		{
			this.dateSC = new Date();
			this.currentTimeSC = this.dateSC.getTime();
			if(this.currentTimeSC-this.startTimeSC > this.maxMilisecondsForRender)
			{
				GL.disableVertexAttribArray(shader._texcoord);
				GL.disableVertexAttribArray(shader._position);
				return;
			}
		}
		*/
	}

	
	GL.disableVertexAttribArray(shader._texcoord);
	GL.disableVertexAttribArray(shader._position);
	GL.disableVertexAttribArray(shader._normal);
	//---------------------------------------------------
	
	// Render the lasts simpleBuildings.***
	
	var last_simpBuilds_count = this.currentVisibleBuildingsPost_array.length;
	
	for(var i=0; i<last_simpBuilds_count; i++)
	{
		this.f4dRenderer.render_F4D_simpleBuilding(GL, this.currentVisibleBuildingsPost_array[i], this.modelViewProjRelToEye_matrix, 
				this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
	}
	
	//GL.useProgram(null);
	//GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	//GL.bindBuffer(GL.ARRAY_BUFFER, null);
	//GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	//---------------------------------------------------
	
	// Time control.************
		
		if(this.isCameraMoving)
		{
			this.dateSC = new Date();
			this.currentTimeSC = this.dateSC.getTime();
			this.render_time = this.currentTimeSC-this.startTimeSC;
			//if(this.currentTimeSC-this.startTimeSC > this.maxMilisecondsForRender)
			//{
			//	
			//}
		}
		
	
};


f4d_manager.prototype.render_F4D_Projects_SPEEDTEST = function(GL, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum)
{
	// http://blog.tojicode.com/2011/05/interleaved-array-basics.html
	// https://groups.google.com/forum/#!topic/webgl-dev-list/vwCq6BPBXEs
	
	GL.disable(GL.CULL_FACE); // Optional.***
	
	if(scene._screenSpaceCameraController._aggregator._isDown[0] ||
		scene._screenSpaceCameraController._aggregator._isDown[1]||
		scene._screenSpaceCameraController._aggregator._isDown[2]) // 0 = LEFT, 1 = RIGHT, 2 = MIDDLE,...
	{
		this.isCameraMoving = true;
	}
	else 
	{
		this.isCameraMoving = false;
	}
	
	
	// Check if camera was moved considerably for update the renderables objects.***
	if(this.detailed_building)
	{
		this.squareDistUmbral = 4.5*4.5;
	}
	else{
		this.squareDistUmbral = 50*50;
	}
	var cameraMoved = this.isCameraMoved(cameraPosition, this.squareDistUmbral);

	//if(cameraMoved && !this.isCameraMoving)
	//{
	//	this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // test ok.***
	//}
	//this.currentVisibleBuildings_array = this.f4dBR_buildingProjectsList._BR_buildingsArray; // No frustumCulling. All the buildings visible. SPEED TEST.***
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	// Calculate encodedCamPosMC high and low values.********************************************************
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	this.encodedCamPosMC_High[0] = camSplitVelue_X.high;
	this.encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	this.encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	this.encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	this.encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	
	
	// Now, render the simple visible buildings.***************************************************************************
	var shader = this.f4d_shadersManager.get_f4dShader(3);
	var shaderProgram = shader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(shader._texcoord);
	GL.enableVertexAttribArray(shader._position);
	
	GL.enable(GL.DEPTH_TEST);
	  GL.depthFunc(GL.LEQUAL); 
	  GL.depthRange(0, 1);

	  GL.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	  GL.uniform3fv(shader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	  GL.uniform3fv(shader._encodedCamPosLOW, this.encodedCamPosMC_Low);

	GL.activeTexture(GL.TEXTURE0);
	//------------------------------------------------------
	var filePath_scratch = "";
	
	this.f4d_rendering_time = 0;
	this.xdo_rendering_time = 0;
	this.xdo_rendering_time_arrays = 0;
	var buildingsLoaded = 0;
	// Render F4D.******************************************************************************************************
	//var currentTime = undefined;
	//var secondsUsed_f4d = undefined;
	//var secondsUsed_xdo = undefined;
	//var timeControlCounter = 0;
	
	//var date = new Date();
	//var startTime = date.getTime();
	
	
	////////////////////////////////////
	
	
	var f4d_projects_count = this.f4dBR_buildingProjectsList._BR_buildingsArray.length;
	for(var iAux = 0; iAux<100; iAux++)
	{
		buildingsLoaded = 0;
		
		for(var p_counter = 0; p_counter<f4d_projects_count; p_counter++)
		{
			
			var BR_Project = this.f4dBR_buildingProjectsList._BR_buildingsArray[p_counter];
			
			// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
			if(BR_Project._header._f4d_version == 2)
			{
				if(!BR_Project._f4d_header_readed)
				{
					// Must read the header file.***
					if(this.backGround_fileReadings_count < 40)
					{
						filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._f4d_headerPathName;
						this.f4d_readerWriter.readF4D_Header_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this);
						this.backGround_fileReadings_count ++;
					}
					continue;
				}
				else if(!BR_Project._f4d_simpleBuilding_readed && BR_Project._f4d_header_readed_finished)
				{
					if(this.backGround_fileReadings_count < 40)
					{
						filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._f4d_simpleBuildingPathName;
						
						this.f4d_readerWriter.readF4D_SimpleBuinding_A1_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this);
						this.backGround_fileReadings_count ++;
					}
					continue;
				}
				else if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
				{
					if(this.backGround_fileReadings_count < 40)
					{
						filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._f4d_nailImagePathName;
						
						this.f4d_readerWriter.readF4D_NailImage_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this);
						this.backGround_fileReadings_count ++;
					}
					continue;
				}
				else if(!BR_Project._xdo_simpleBuilding_readed && BR_Project._f4d_nailImage_readed_finished)
				{
					if(this.backGround_fileReadings_count < 40)
					{
						filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._xdo_simpleBuildingPathName;
						
						this.f4d_readerWriter.readXDO_SimpleBuinding_A1_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this);
						this.backGround_fileReadings_count ++;
					}
					continue;
				}
				else if(BR_Project._xdo_simpleBuilding_readed_finished)
				{
					buildingsLoaded++;
				}
			}
			else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}
			//--------------------------------------------------------------------------------------------------------------
			if(buildingsLoaded==f4d_projects_count)
				this.allBuildingsLoaded = true;
		
			//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
			if(BR_Project._simpleBuilding_v1 && BR_Project._xdo_simpleBuilding_readed_finished && this.allBuildingsLoaded)// Test
			{
				//for(var iAux = 0; iAux<100; iAux++)
				{

						//this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this.modelViewProjRelToEye_matrix, 
						//	this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this);
							
						//this.f4dRenderer.render_XDO_simpleBuilding_drawArrays(GL, BR_Project, this.modelViewProjRelToEye_matrix, 
						//	this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this);

						this.f4dRenderer.render_XDO_simpleBuilding_V1(GL, BR_Project, this.modelViewProjRelToEye_matrix, 
							this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this);

				}
				
				buildingsLoaded = f4d_projects_count;
				
				this.renderingCounter++;
				
			}
			else
			{
				var h=0;
			}
			
		}
		
	}
	
	if(this.renderingCounter > 50)
	{
		this.averageRenderingCounter++;
		
		// start calculating the average rendering time.***
		this.f4d_amountRenderTime += this.f4d_rendering_time;
		this.xdo_amountRenderTime += this.xdo_rendering_time;
		this.xdo_amountRenderTime_arrays += this.xdo_rendering_time_arrays;

		this.f4d_averageRenderTime = this.f4d_amountRenderTime/this.averageRenderingCounter;
		this.xdo_averageRenderTime = this.xdo_amountRenderTime/this.averageRenderingCounter;
		this.xdo_averageRenderTime_arrays = this.xdo_amountRenderTime_arrays/this.averageRenderingCounter;

	}
	
			
	console.log("Buildings Count: %o", buildingsLoaded);
	console.log("Renders Count: %o", this.averageRenderingCounter);
	console.log("F4D time: %o", this.f4d_averageRenderTime);
	console.log("XDO elem time: %o", this.xdo_averageRenderTime);
	console.log("XDO array time: %o", this.xdo_averageRenderTime_arrays);
	console.log("-------------------------------------------------");
	console.log("-------------------------------------------------");
	
	//date = new Date();
	//currentTime = date.getTime();
	//secondsUsed_f4d = currentTime - startTime;
	
	
	
	GL.disableVertexAttribArray(shader._texcoord);
	GL.disableVertexAttribArray(shader._position);
	//---------------------------------------------------
	
	// Render the lasts simpleBuildings.***
	/*
	var last_simpBuilds_count = this.currentVisibleBuildingsPost_array.length;
	
	for(var i=0; i<last_simpBuilds_count; i++)
	{
		this.f4dRenderer.render_F4D_simpleBuilding(GL, this.currentVisibleBuildingsPost_array[i], this.modelViewProjRelToEye_matrix, 
				this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
	}
	*/
	
	GL.useProgram(null);
	GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	//---------------------------------------------------
	
};

f4d_manager.prototype.doFrustumCulling = function(frustumVolume, visibleBuildings_array, cameraPosition)
{
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	// Init the visible buildings array.***
	visibleBuildings_array.length = 0;
	this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
	this.detailed_building = undefined;
	
	//this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	//this.min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	//this.min_squaredDist_to_see = 10000000;
	//this.min_squaredDist_to_see_smallBuildings = 700000;
	
	var squaredDistToCamera = undefined;
	var last_squared_dist = undefined;
	//var noHeaderReadedBuildings_count = 0;
	
	var building_projects_count = this.f4dBR_buildingProjectsList._BR_buildingsArray.length;
	for(var p_counter = 0; p_counter<building_projects_count; p_counter++)
	{
		var BR_Project = this.f4dBR_buildingProjectsList._BR_buildingsArray[p_counter];
		
		
		if(BR_Project._buildingPosition == undefined)
		{
			// this building does not readed the header yet.***
			if(!BR_Project._f4d_header_readed)
			{
				visibleBuildings_array.push(BR_Project);
			}
			continue;
		}
			
		
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
		if(squaredDistToCamera > this.min_squaredDist_to_see)
			continue;
		
		if(BR_Project._header.isSmall && squaredDistToCamera>this.min_squaredDist_to_see_smallBuildings)
			continue;
						
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
		this.radiusAprox_aux = BR_Project.getRadiusAprox();
		
		if(this.radiusAprox_aux)
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		}
		else
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}

		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull !== Cesium.Intersect.OUTSIDE) 
		{
			
			if(squaredDistToCamera < this.min_squaredDist_to_see_detailed)// min dist to see detailed.***
			{
				if(BR_Project._compRefList_Container._compRefsList_Array.length > 0)
				{
					// Detect the Detailed building.***
					if(BR_Project._header._f4d_version == 1)
					{
						if(last_squared_dist)
						{
							if(squaredDistToCamera < last_squared_dist && BR_Project._compRefList_Container._compRefsList_Array.length > 0)
							{
								last_squared_dist = squaredDistToCamera;
								visibleBuildings_array.push(this.detailed_building);
								this.detailed_building = BR_Project;
							}
							else{
								if(BR_Project._compRefList_Container._compRefsList_Array.length > 0)
									visibleBuildings_array.push(BR_Project);
							}
						}
						else{
							last_squared_dist = squaredDistToCamera;
							this.detailed_building = BR_Project;
						}
					}
				}
				else{
					if(BR_Project._header.isSmall)
						visibleBuildings_array.push(BR_Project);
					else
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
				
			}
			else if(squaredDistToCamera<this.min_squaredDist_to_see_LOD0)
			{
				if(BR_Project._header.isSmall)
						visibleBuildings_array.push(BR_Project);
					else
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			}	
			else{
				visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	return visibleBuildings_array;
};

f4d_manager.prototype.doFrustumCulling_neoBuildings = function(frustumVolume, neoVisibleBuildings_array, cameraPosition)
{
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	// Init the visible buildings array.***
	neoVisibleBuildings_array.length = 0;
	
	//this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	//this.min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	//this.min_squaredDist_to_see = 10000000;
	//this.min_squaredDist_to_see_smallBuildings = 700000;
	
	//this.min_squaredDist_to_see_detailed = 1000000; // Test for samsung.***
	
	var squaredDistToCamera = undefined;
	var last_squared_dist = undefined;
	this.detailed_neoBuilding = undefined;
	
	var neoBuildings_count = this.f4d_neoBuildingsList.neoBuildings_Array.length;
	for(var i=0; i<neoBuildings_count; i++)
	{
		var neoBuilding = this.f4d_neoBuildingsList.neoBuildings_Array[i];
		
		if(neoBuilding._buildingPosition == undefined)
		{
			continue;
		}
		
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, neoBuilding._buildingPosition);
		if(squaredDistToCamera > this.min_squaredDist_to_see)
			continue;
		
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(neoBuilding._buildingPosition);
		this.radiusAprox_aux = 1000.0;
		
		if(this.radiusAprox_aux)
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		}
		else
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}
		
		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull !== Cesium.Intersect.OUTSIDE) 
		{
			
			if(squaredDistToCamera < this.min_squaredDist_to_see_detailed)// min dist to see detailed.***
			{
				if(neoBuilding._neoRefLists_Container.neoRefsLists_Array.length > 0)
				{
					// Detect the Detailed building.***
					//if(neoBuilding._header._f4d_version == 1)	
					{
						if(last_squared_dist)
						{
							if(squaredDistToCamera < last_squared_dist)
							{
								last_squared_dist = squaredDistToCamera;
								neoVisibleBuildings_array.push(this.detailed_neoBuilding);
								this.detailed_neoBuilding = neoBuilding;
							}
							else{
									neoVisibleBuildings_array.push(neoBuilding);
							}
						}
						else{
							last_squared_dist = squaredDistToCamera;
							this.detailed_neoBuilding = neoBuilding;
							neoVisibleBuildings_array.push(neoBuilding);
						}
					}
				}
				else{
					if(neoBuilding._header && neoBuilding._header.isSmall)
						neoVisibleBuildings_array.push(neoBuilding);
					else
					{
						//neoVisibleBuildings_array.push(neoBuilding);
						//this.currentVisibleBuildings_LOD0_array.push(neoBuilding);
					}
				}
				
			}
			/*
			else if(squaredDistToCamera<this.min_squaredDist_to_see_LOD0)
			{
				if(neoBuilding._header.isSmall)
						neoVisibleBuildings_array.push(neoBuilding);
					else
						this.currentVisibleBuildings_LOD0_array.push(neoBuilding);
			}	
			*/
			else{
				//neoVisibleBuildings_array.push(neoBuilding);
			}
		}
		
	}
	
	return neoVisibleBuildings_array;
};

f4d_manager.prototype.doFrustumCulling_terranTile_serviceFormat = function(GL, frustumVolume, visibleBuildings_array, cameraPosition)
{
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	
	// Init the visible buildings array.***************************
	//visibleBuildings_array.length = 0; // Init.***
	//this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
	//this.detailed_building = undefined;
	//-------------------------------------------------------------
	
	//this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	//this.min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	//this.min_squaredDist_to_see = 10000000;
	//this.min_squaredDist_to_see_smallBuildings = 700000;
	
	var squaredDistToCamera = undefined;
	var squaredDistToCamera_candidate = undefined;
	var last_squared_dist = undefined;
	var buildings_count = undefined;
	var nearestTile = undefined;
	var nearestTile_candidate = undefined;
	
	this.filteredVisibleTiles_array.length = 0;
	this.detailedVisibleTiles_array.length = 0;
	this.LOD0VisibleTiles_array.length = 0;
	
	var BR_Project = undefined;
	
	var max_tileFilesReading = 10;
	
	this.currentVisible_terranTiles_array.length = 0;// Init.***
	this.f4d_terranTile.get_intersectedSmallestTiles(frustumVolume, this.currentVisible_terranTiles_array, this.boundingSphere_Aux);
	
	// Find the nearest tile to camera.***
	var visibleTiles_count = this.currentVisible_terranTiles_array.length;
	if(visibleTiles_count == 0)
		return;
	
	for(var i=0; i<visibleTiles_count; i++)
	{
		this.terranTileSC = this.currentVisible_terranTiles_array[i];
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, this.terranTileSC.position);
		
		if(squaredDistToCamera > this.min_squaredDist_to_see)
			continue;
		
		if(squaredDistToCamera < this.min_squaredDist_to_see_detailed * 1.2)
		{
			this.detailedVisibleTiles_array.push(this.terranTileSC);
		}
		else if(squaredDistToCamera <  this.min_squaredDist_to_see_LOD0 * 1.2)
		{
			this.LOD0VisibleTiles_array.push(this.terranTileSC);
		}
		else
		{
			this.filteredVisibleTiles_array.push(this.terranTileSC); // Original.***
			//this.LOD0VisibleTiles_array.push(this.terranTileSC); // Test.***
		}
	}
	
	//***************************************************************************************************************
	// Make the visible buildings list.******************************************************************************
	this.boundingSphere_Aux.radius = 50.0;
	var need_frustumCulling = false;
	var filePath_scratch = undefined;
	var tileNumberNameString = undefined;
	
	
	var detailedVisibleTiles_count = this.detailedVisibleTiles_array.length;
	for(var i=0; i<detailedVisibleTiles_count; i++)
	{
		this.terranTileSC = this.detailedVisibleTiles_array[i];
		
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/F4D_TerrainTiles/" + tileNumberNameString + ".til";	
				this.f4d_readerWriter.readF4D_TileArrayBuffer_inServer(GL, filePath_scratch, this.terranTileSC, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFile_oneBuilding(GL, this);
			this.terranTileSC.parseFile_allBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING)
			need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.detailedVisibleTiles_array[i]._BR_buildingsArray[j];

				
			if(BR_Project._buildingPosition == undefined)
			{
				this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				continue;
			}
			
			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
			if(squaredDistToCamera < this.min_squaredDist_to_see_detailed)
			{
				
				// Activate this in the future, when all f4d_projects unified.***
				if(BR_Project._compRefList_Container._compRefsList_Array.length > 0)
				{
					if(BR_Project._header._f4d_version == 1)
					{
						if(last_squared_dist)
						{
							if(squaredDistToCamera < last_squared_dist)
							{
								last_squared_dist = squaredDistToCamera;
								this.currentVisibleBuildings_LOD0_array.push(this.detailed_building);
								this.detailed_building = BR_Project;
							}
							else{
									this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						}
						else{
							last_squared_dist = squaredDistToCamera;
							this.detailed_building = BR_Project;
						}
					}
					
				}
				else{
					if(BR_Project._header.isSmall)
						visibleBuildings_array.push(BR_Project);
					else
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
				
			}
			else if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
			{
				if(need_frustumCulling)
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					if(need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
				else
					this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			}
			else
			{
				if(need_frustumCulling)
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					if(need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
						visibleBuildings_array.push(BR_Project);
				}
				else
					visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	
	var LOD0VisiblesTiles_count = this.LOD0VisibleTiles_array.length;
	for(var i=0; i<LOD0VisiblesTiles_count; i++)
	{
		this.terranTileSC = this.LOD0VisibleTiles_array[i];
		
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/F4D_TerrainTiles/" + tileNumberNameString + ".til";	
				this.f4d_readerWriter.readF4D_TileArrayBuffer_inServer(GL, filePath_scratch, this.terranTileSC, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFile_oneBuilding(GL, this);
			this.terranTileSC.parseFile_allBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING)
			need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.LOD0VisibleTiles_array[i]._BR_buildingsArray[j];

			if(BR_Project._buildingPosition == undefined)
			{
				visibleBuildings_array.push(BR_Project);
				continue;
			}
			
			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
			if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
			{
				
				if(need_frustumCulling)
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
				else
					this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			}
			else
			{
				if(need_frustumCulling)
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
						visibleBuildings_array.push(BR_Project);
				}
				else
					visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	
	
	var filteredVisibleTiles_count = this.filteredVisibleTiles_array.length;
	for(var i=0; i<filteredVisibleTiles_count; i++)
	{
		
		this.terranTileSC = this.filteredVisibleTiles_array[i];
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/F4D_TerrainTiles/" + tileNumberNameString + ".til";	
				this.f4d_readerWriter.readF4D_TileArrayBuffer_inServer(GL, filePath_scratch, this.terranTileSC, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFile_oneBuilding(GL, this);
			this.terranTileSC.parseFile_allBuildings(this);
			//continue;
		}
		
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING)
			need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.filteredVisibleTiles_array[i]._BR_buildingsArray[j];

			if(BR_Project._buildingPosition == undefined)
			{
				visibleBuildings_array.push(BR_Project);
				continue;
			}
			else
			{
				squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
				if(BR_Project._header.isSmall)
				{
					
					if(squaredDistToCamera < this.min_squaredDist_to_see_smallBuildings)
					{
						if(need_frustumCulling)
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
							visibleBuildings_array.push(BR_Project);
						}
						else
							visibleBuildings_array.push(BR_Project);
					}
				}
				else
				{
					// Provisionally check for LODzero distance.***
					if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
					{
						
						if(need_frustumCulling)
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
								this.currentVisibleBuildings_LOD0_array.push(BR_Project);
						}
						else
							this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					}
					else
					{
						if(need_frustumCulling)
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
								visibleBuildings_array.push(BR_Project);
						}
						else
							visibleBuildings_array.push(BR_Project);
					}
				}
			}	
			
		}
	}
	
	return visibleBuildings_array;
};

f4d_manager.prototype.doFrustumCulling_clouds = function(frustumVolume, visibleBuildings_array, cameraPosition)
{
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	// Init the visible buildings array.***
	
	this.currentVisibleClouds_array.length = 0; // Init.***
	
	var min_squaredDist_to_see_detailed = 40000; // 200m.***
	var min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	var min_squaredDist_to_see = 10000000;
	var min_squaredDist_to_see_smallBuildings = 700000;
	
	var squaredDistToCamera = undefined;
	var last_squared_dist = undefined;
	
	var clouds_count = this.f4d_atmos.cloudsManager.circularCloudsArray.length;
	for(var p_counter = 0; p_counter<clouds_count; p_counter++)
	{
		var cloud = this.f4d_atmos.cloudsManager.circularCloudsArray[p_counter];
		
		if(cloud.cullingPosition == undefined)
		{
			continue;
		}
		
/*		
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, cloud.cullingPosition);
		if(squaredDistToCamera > min_squaredDist_to_see)
			continue;
		
		if(BR_Project._header.isSmall && squaredDistToCamera>min_squaredDist_to_see_smallBuildings)
			continue;
		*/
					
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(cloud.cullingPosition);
		this.radiusAprox_aux = cloud.cullingRadius;
		
		if(this.radiusAprox_aux)
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		}
		else
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}

		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull !== Cesium.Intersect.OUTSIDE) 
		{
			this.currentVisibleClouds_array.push(cloud);

		}
	}
	
	return visibleBuildings_array;
	
};




















