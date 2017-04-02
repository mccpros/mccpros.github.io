var winWidth = window.innerWidth;
var halfWidth = window.innerWidth / 2;
var orientation = 'front';
var cardsArr = [];
var hotspotsArr = [];
var navArr = [];

// Init and Config everything
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

// Set Image
var geometry = new THREE.SphereGeometry(500, 60, 40);
var loader = new THREE.TextureLoader();
var texture = loader.load('/common/views/frontView.jpg');

//Set VR Controls
var controls = new THREE.VRControls(camera);
controls.standing = true;
camera.position.y = controls.userHeight;

// Set Image more
var material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
var mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, controls.userHeight, -1);
scene.add(mesh);


//Set all the hotspots
function createHotspots(orientation) {

  hotspotsArr.forEach(function(hotspot) {
    scene.remove(hotspot);
    Reticulum.remove(hotspot);
  });
  cardsArr.forEach(function(card) {
    scene.remove(card);
    Reticulum.remove(card);
  });

  hotspotsArr = [];
  cardsArr = [];

  for (var i = 0; i < hotspots.length; i++) {
    if(hotspots[i].orientation !== orientation) {
      continue;
    }

    var hotspot      = hotspots[i],
        sphereData   = hotspot.sphere,
        cardData     = hotspot.card,
        outlineData  = hotspot.outline,
        cardTextData = hotspot.cardText;
    var sphereGeometry = new THREE.SphereGeometry( sphereData.size.x, sphereData.size.y, sphereData.size.z );
    var sphereMaterial = new THREE.MeshBasicMaterial({color: 0xf1f1f1, side: THREE.DoubleSide});
    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );

    sphere.name = hotspot.name;
    sphere.position.set( sphereData.pos.x, sphereData.pos.y, sphereData.pos.z );
    scene.add(sphere);
    hotspotsArr.push( sphere );

    (function(sphere, cardData) {
      loader.load(hotspot.src, function(texture) {
        var cardGeo = new THREE.PlaneBufferGeometry( cardData.size.x, cardData.size.y, cardData.size.z );
        var cardMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture, color: 0xf1f1f1, transparent:true, opacity: 1 });
        var card = new THREE.Mesh( cardGeo, cardMat );

        card.rotation.set
        cardsArr.push(card);

        card.name = 'card';
        card.position.set( cardData.pos.x, cardData.pos.y, cardData.pos.z );

        card.scale.set( 0, 0, 1 );
        scene.add( card );

        Reticulum.add( sphere, card, {
          clickCancelFuse: true, // Overrides global setting for fuse's clickCancelFuse
          reticleHoverColor: 0xf1f1f1, // Overrides global reticle hover color
          fuseVisible: true, // Overrides global fuse visibility
          fuseDuration: 1, // Overrides global fuse duration
          fuseColor: 0x16b1c1, // Overrides global fuse color
          sphere: sphere,
          card: card,
          opened: false,
          cardPosition: cardData.pos,
          timeout: null,
          onGazeOver: function() {
            // do something when user targets object
            this.scale.set(1.1, 1.1, 1.1, 1.1);
          },
          onGazeOut: function(){
            // do something when user moves reticle off targeted object
            this.scale.set(1, 1, 1, 1);

            this.timeout = setTimeout(function() {
              if(this.opened) {
                var shallowPosition = JSON.parse(JSON.stringify(this.sphere.position))
                shrinkCard(this.card, shallowPosition, this.card.position, 200);
                this.opened = false;
              }
            }.bind(this), 2000)
          },
          onGazeLong: function() {
            if(!this.opened) {
              var shallowPosition = JSON.parse(JSON.stringify(this.sphere.position))
              growCard(this.card, shallowPosition, this.cardPosition, 200);
              this.opened = true;
            }
          },
          onGazeCard: function(){
            clearTimeout(this.parentSphere.timeout);
          },
          outGazeCard: function(){
            if(this.parentSphere.opened) {
              clearTimeout(this.parentSphere.timeout);
              this.parentSphere.onGazeOut();
            }
          }
        })
      })
    })(sphere, cardData);
  }
}

createHotspots(orientation);

function createNavSpots(orientation) {
  var positionY = 3;

  // Remove old navs
  navArr.forEach(function(nav) {
    scene.remove(nav);
    Reticulum.remove(nav);
  })
  navArr = [];

  //Set all the nav spots
  for (var i = 0; i < navspots.length; i++) {
    if(navspots[i].orientation !== orientation) {
      continue;
    }

    var navspot      = navspots[i],
        panoData     = navspot.pano;

    var planeGeometry = new THREE.PlaneGeometry(3, 1);
    var planeMaterial = new THREE.MeshBasicMaterial({ map: loader.load(navspot.prev), side: THREE.DoubleSide })
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(panoData.pos.x, panoData.pos.y, panoData.pos.z)
    plane.rotation.x = Math.PI / 180 * 20;
    plane.name = navspot.name;
    plane.src = navspot.src;
    plane.lookAt(camera);
    scene.add(plane);
    navArr.push(plane);

    Reticulum.add( plane, null, {
      clickCancelFuse: true, // Overrides global setting for fuse's clickCancelFuse
      reticleHoverColor: 0xf1f1f1, // Overrides global reticle hover color
      fuseVisible: true, // Overrides global fuse visibility
      fuseDuration: 1, // Overrides global fuse duration
      fuseColor: 0x16b1c1, // Overrides global fuse color
      src: "/common/leftView.jpg",
      onGazeOver: function() {
        // do something when user targets object
        this.scale.set(1.1, 1.1, 1.1, 1.1);
      },
      onGazeOut: function(){
        // do something when user moves reticle off targeted object
        this.scale.set(1, 1, 1, 1);
        console.log("Out");
      },
      onGazeLong: function(name) {
        loader.load(this.src, function(texture) {
          material.map = texture;

          createNavSpots(name);
          createHotspots(name);
        })
      },
    })
  }
}

createNavSpots(orientation);

var crosshairGeometry = new THREE.SphereGeometry( .3, 32, 32 );
var crosshairMaterial = new THREE.MeshBasicMaterial({color: 0x4b4b4b, side: THREE.DoubleSide});
var crosshair = new THREE.Mesh( crosshairGeometry, crosshairMaterial );
crosshair.name = 'crosshair';
crosshair.position.set(0, 0, -50);

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
document.getElementById('vr-button').addEventListener('touchstart', function() {
  document.getElementsByTagName('canvas')[0].addEventListener( 'touchstart', onTouchDown );
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
    color: 0x0b0b0b,
    innerRadius: 0.0001,
    outerRadius: 0.002,
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
    innerRadius: 0.02,
    outerRadius: 0.025,
    vibrate: [], //Set to 0 or [] to disable
    clickCancelFuse: false //If users clicks on targeted object fuse is canceled
  }
});

animate();

function lookat(c) {
  c.lookAt( camera.position );
}

function animate(delta) {
  Reticulum.update();

  cardsArr.forEach(lookat);
  navArr.forEach(lookat);

  TWEEN.update();
  effect.render(scene, camera);

  if (enterVRButton.isPresenting()) {
    controls.update();
  }

  requestAnimationFrame(animate);
}

function growCard(card, oldPosition, newPosition, animationSpeed) {
  var position = oldPosition;
  position.scaleX = 0;
  position.scaleY = 0;

  var target = newPosition;
  target.scaleX = 1;
  target.scaleY = 1;

  var tween = new TWEEN.Tween(position).to(target, animationSpeed);

  tween.onUpdate(function() {
    card.position.x = position.x;
    card.position.y = position.y;
    card.position.z = position.z;

    card.scale.set(position.scaleX, position.scaleY, 1);
    // outlineMesh.position.x = position.x;
    // outlineMesh.position.x = position.y;
    // outlineMesh.position.x = position.z;
  });

  if(card.scale.x < 1 || card.scale.y < 1) {
    tween.start();
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
  if(event.clientX) {
    if(event.clientX >= halfWidth) {
      camera.fov -= 20;
    } else {
      camera.fov += 20;
    }
  }

  if(event.touches && event.touches[0]) {
    if(event.touches[0].clientX >= halfWidth) {
      var newCoord = Math.round((camera.scale.x - 0.2) * 10) / 10;
      camera.scale.set(newCoord, newCoord, 1);
    } else {
      var newCoord = Math.round((camera.scale.x + 0.2) * 10) / 10;
      camera.scale.set(newCoord, newCoord, 1);
    }
  }

  if(camera.fov > 75) {
    camera.fov = 75;
  }

  if(camera.fov < 15) {
    camera.fov = 15;
  }

  if(camera.scale.x <= .2) {
    camera.scale.set(.2, .2, 1);
  }

  if(camera.scale.x > 1) {
    camera.scale.set(1, 1, 1);
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
