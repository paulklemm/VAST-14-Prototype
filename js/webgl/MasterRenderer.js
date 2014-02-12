function MasterRenderer () {
	this._camera = new THREE.PerspectiveCamera( 45, 1, 1, 1000 );
	this._target = new THREE.Vector3();
}

MasterRenderer.prototype.foo = function() { 
	console.log ("Foo")
}