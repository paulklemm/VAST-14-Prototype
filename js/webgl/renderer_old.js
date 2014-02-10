// Constructor
function Renderer(containerId){
  this._containerId = containerId;
  this._renderer = undefined;
  this._camera = undefined;
  this._scene = undefined;
  this._controls = undefined;
  this.create();
  this.render();
}

Renderer.prototype.render = function() {
	this._camera.lookAt(this._scene.position);
	this._controls.update();
	this._renderer.render(this._scene, this._camera);
}
Renderer.prototype.create = function(){ 
	var renderer, camera, scene, light;
	var container = $(this._containerId);
	// DEBUG
	var width = 100;
	var height = 100;
	camera = new THREE.PerspectiveCamera( 90, width / height, 1, 10000 );
      camera.position.z = 200;
	scene = new THREE.Scene();
	var omni = new THREE.PointLight(0xffffff, 1, 300);
	omni.position.set(0, 0, 100);
	scene.add(omni);
	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 0, 80 );
	light.castShadow = true;
	light.shadowBias = 0.01;
	// light.shadowDarkness = 0.25;
	// light.shadowMapWidth = 1024;
	// light.shadowMapHeight = 1024;
	// light.shadowCameraFar = 500;
	scene.add( light );

	var ballGeometry  = new THREE.IcosahedronGeometry(120, 1);
	ballGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 120, 0 ) );
	var iconSphereMaterials = [
				new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading, opacity: 0.2, transparent: true, side: THREE.BackSide }),
				new THREE.MeshBasicMaterial( { color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true })
                              ];
	ball = THREE.SceneUtils.createMultiMaterialObject( ballGeometry, iconSphereMaterials );
	ball.position.y = -120;
	scene.add(ball);

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.setSize( width, height );
	renderer.shadowMapEnabled = true;
	renderer.setClearColor( 0x000000, 0 );
	renderer.shadowMapType = THREE.PCFSoftShadowMap;

	controls = new THREE.TrackballControls(camera); // Last element says that to only rotate when cursor is on renderer

	controls.rotateSpeed = 5.0;
	controls.zoomSpeed = 5;
	controls.panSpeed = 2;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	container.append( renderer.domElement );
	this._renderer = renderer;
	this._camera = camera;
	this._scene = scene;
	this._controls = controls;

	var $circle = $('.circle');
}