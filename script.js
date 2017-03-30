var winWidth = window.innerWidth;
var halfWidth = window.innerWidth / 2;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/ window.innerHeight, 1, 1100);

camera.target = new THREE.Vector3(0, 0, 0);
camera.lookAt(camera.target);
camera.updateMatrixWorld()

var renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

var effect = new THREE.VREffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.SphereGeometry(500, 60, 40);
var loader = new THREE.TextureLoader();
var texture = loader.load('/common/converted.jpg');

var controls = new THREE.VRControls(camera);
controls.standing = true;
camera.position.y = controls.userHeight;

var material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
var mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, controls.userHeight, -1);
scene.add(mesh);


var sphereGeometry = new THREE.SphereGeometry( .95, 32, 32 );
var sphereMaterial = new THREE.MeshBasicMaterial({color: 0xf1f1f1, side: THREE.DoubleSide});
var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.name = 'lancontroller';
sphere.position.set(20, 9, -6);
scene.add(sphere);

var cardText = new THREEx.DynamicTexture(800, 800);
cardText.context.font = "100px Roboto";
cardText.texture.anisotropy = renderer.getMaxAnisotropy();
cardText.drawText("LAN Controller", undefined, 85, 'white');

var cardGeo = new THREE.PlaneBufferGeometry( 8, 10, 10 );
var cardMat = new THREE.MeshBasicMaterial({ color: 0xf1f1f1, side: THREE.DoubleSide, map: cardText.texture });
var card = new THREE.Mesh( cardGeo, cardMat );

card.name = 'lancontroller';
card.position.set(20, 9, -6);
card.scale.set( 0, 0 );
scene.add(card);

var crosshairGeometry = new THREE.SphereGeometry( .3, 32, 32 );
var crosshairMaterial = new THREE.MeshBasicMaterial({color: 0x4b4b4b, side: THREE.DoubleSide});
var crosshair = new THREE.Mesh( crosshairGeometry, crosshairMaterial );
crosshair.name = 'crosshair';
crosshair.position.set(0, 0, -50);

Reticulum.add( sphere, {
    clickCancelFuse: true, // Overrides global setting for fuse's clickCancelFuse
    reticleHoverColor: 0xf1f1f1, // Overrides global reticle hover color
    fuseVisible: true, // Overrides global fuse visibility
    fuseDuration: 1, // Overrides global fuse duration
    fuseColor: 0x16b1c1, // Overrides global fuse color
    sphere: sphere,
    card: card,
    opened: false,
    cardPosition: { x: 28, y: 9, z: -15 },
    onGazeOver: function() {
      // do something when user targets object
      this.scale.set(1.1, 1.1, 1.1, 1.1);
    },
    onGazeOut: function(){
      // do something when user moves reticle off targeted object
      this.scale.set(1, 1, 1);
      if(this.opened) {
        var shallowPosition = JSON.parse(JSON.stringify(this.sphere.position))
        shrinkCard(this.card, shallowPosition, this.card.position, 200);
        this.opened = false;
      }
    },
    onGazeLong: function() {
      if(!this.opened) {
        var shallowPosition = JSON.parse(JSON.stringify(this.sphere.position))
        growCard(this.card, shallowPosition, this.cardPosition, 200);
        this.opened = true;
      }
    },
    onGazeClick: function(){
      // have the object react when user clicks / taps on targeted object
    }
  });

scene.add(camera);
camera.add( crosshair );

var options = {
  color: 'black',
  background: 'white',
  corners: 'square'
};
var enterVRButton = new webvrui.EnterVRButton(renderer.domElement, options);
enterVRButton.on('exit', function() {
  camera.quaternion.set(0, 0, 0, 1);
  camera.position.set(0, controls.userHeight, 0);
});
enterVRButton.on('hide', function() {
  document.getElementById('ui').style.display = 'none';
});
enterVRButton.on('show', function() {
  document.getElementById('ui').style.display = 'inherit';
});
document.getElementById('vr-button').appendChild(enterVRButton.domElement);
document.getElementById('vr-button').addEventListener('click', function() {
  window.addEventListener( 'touchstart', onTouchDown, false );
});
document.getElementById('no-vr').addEventListener('click', function() {
  // document.addEventListener( 'click', onTouchDown, false );
  enterVRButton.requestEnterFullscreen();
});

Reticulum.init(camera, {
  proximity: false,
  clickevents: true,
  near: null, //near factor of the raycaster (shouldn't be negative and should be smaller than the far property)
  far: null, //far factor of the raycaster (shouldn't be negative and should be larger than the near property)
  reticle: {
    visible: true,
    restPoint: 1000, //Defines the reticle's resting point when no object has been targeted
    color: 0xcc0000,
    innerRadius: 0.0001,
    outerRadius: 0.003,
    hover: {
      color: 0xcc0000,
      innerRadius: 0.009,
      outerRadius: 0.011,
      speed: 5,
      vibrate: [] //Set to 0 or [] to disable
    }
  },
  fuse: {
    visible: true,
    duration: 1.5,
    color: 0xf1f1f1,
    innerRadius: 0.035,
    outerRadius: 0.0436,
    vibrate: [], //Set to 0 or [] to disable
    clickCancelFuse: false //If users clicks on targeted object fuse is canceled
  }
});

var hotspots = [sphere];
var updateTexture = 0;
var hoverTime = 0;
var clock = new THREE.Clock();
clock.autoStart = true;

var panoList = [
  '/common/snow_pano.jpg',
  '/common/pano1.jpg',
  '/common/pano2.jpg',
  '/common/pano3.jpg',
]

animate();

function animate(delta) {
  Reticulum.update();
  card.lookAt( camera.position );
  TWEEN.update();

  effect.render(scene, camera);

  if (enterVRButton.isPresenting()) {
    controls.update();
  }

  requestAnimationFrame(animate);
}

function growCard(card, oldPosition, newPosition, animationSpeed) {
  var position = oldPosition;
  var scale = { x: 0, y: 0 };

  var targetPosition = newPosition;
  var targetScale = { x: 1, y: 1 };

  var tweenPosition = new TWEEN.Tween(position).to(targetPosition, animationSpeed);
  var tweenScale = new TWEEN.Tween(scale).to(targetScale, animationSpeed);

  tweenPosition.onUpdate(function() {
    card.position.x = position.x;
    card.position.y = position.y;
    card.position.z = position.z;
  });

  tweenScale.onUpdate(function() {
    card.scale.x = scale.x;
    card.scale.y = scale.y;
  });

  if(card.scale.x < 1 || card.scale.y < 1) {
    tweenScale.start();
    tweenPosition.start();
  }
}

function shrinkCard(card, newPosition, oldPosition, animationSpeed) {
  var position = oldPosition;
  var scale = { x: 1, y: 1 };

  var targetPosition = newPosition;
  var targetScale = { x: 0, y: 0 };

  var tweenPosition = new TWEEN.Tween(position).to(targetPosition, animationSpeed);
  var tweenScale = new TWEEN.Tween(scale).to(targetScale, animationSpeed);

  tweenPosition.onUpdate(function() {
    card.position.x = position.x;
    card.position.y = position.y;
    card.position.z = position.z;
  });

  tweenScale.onUpdate(function() {
    card.scale.x = scale.x;
    card.scale.y = scale.y;
  });

  if(card.scale.x > 0 || card.scale.y > 0) {
    tweenScale.start();
    tweenPosition.start();
  }
}

window.addEventListener('resize', onResize, false);

function onTouchDown(event) {
  event.preventDefault();

  if(event.clientX >= halfWidth) {
    camera.fov -= 20;
  } else {
    camera.fov += 20;
  }

  if(camera.fov > 75) {
    camera.fov = 75;
  }

  if(camera.fov < 15) {
    camera.fov = 15;
  }
  camera.updateProjectionMatrix();
}

function onTouchMove(event) {
  if (interacting) {
    lng = ( pointerX - event.touches[0].clientX ) * 0.1 + savedLng;
    lat = ( pointerY - event.touches[0].clientY ) * 0.1 + savedLat;
  }
}

function onTouchEnd(event) {
  event.preventDefault();
  interacting = false;
}

function onResize() {
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
