var scene, scene1, camera, renderer;

var start = Date.now(),
  WIDTH,
  HEIGHT,
  halfX,
  halfY,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  controls,
  light,
  ambientLight,
  ncolor,
  mouseX = 0,
  mouseY = 0,
  cameraY = 55,
  cameraZ = 80,
  cameraX = 40,
  cameraXYZ = { x: 40, y: 55, z: 80 },
  paused = false,
  loopFunctions = [],
  stone = null,
  devices = [],
  core,
  st = 0,
  isMobile = false;

var __r = 250,
  numberOfDevices = 20,
  slices = Math.floor(360 / numberOfDevices);

var pos = new THREE.Vector3();

function init() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  fieldOfView = 60;
  aspectRatio = WIDTH / HEIGHT;
  nearPlane = 1;
  farPlane = 1000;

  initGraphics();
  initObjects();
  initEvents();
}

// set up the scene and related stuff
function initGraphics() {
  container = document.getElementById("container");

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  camera.position.set(cameraX, cameraY, cameraZ);
  camera.lookAt(-20, 10, 0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdff6f2);
  //scene.fog = new THREE.FogExp2(0xa1abff, 0.003);

  ambientLight = new THREE.AmbientLight(0xf0eeff, 0.3);
  scene.add(ambientLight);

  light = new THREE.DirectionalLight(0xeefbff, 0.4);
  light.position.set(0, 50, 20);
  light.castShadow = true;

  scene.add(light);

  /*
  controls = new THREE.OrbitControls(camera);
  controls.target.set(0, 2, 0);
  controls.update();
  */

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.autoClear = false;

  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  loopFunctions.push([render, "RENDER"]);
}

function initObjects() {
  animate();

  initDevices();

  var beam = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 20, 100, 30, 1),
    new THREE.MeshPhongMaterial({
      color: 0xd460ff,
      transparent: true,
      opacity: 1.5,
      blending: THREE.AdditiveBlending
    })
  );
  beam.position.y = 52;
  beam.opacity = 0.3;
  scene.add(beam);

  var loader = new THREE.TextureLoader();
  loader.load(
    "assets/logo.png",
    function(texture) {
      var materials = [
        new THREE.MeshBasicMaterial({ color: 0x3dc1eb }),
        new THREE.MeshBasicMaterial({ map: texture })
      ];
      var stage = new THREE.Mesh(
        new THREE.CylinderGeometry(20.2, 20.2, 2, 30, 1),
        materials
      );
      stage.position.y = 3;
      stage.rotation.y = 90 * THREE.Math.DEG2RAD;
      scene.add(stage);
    },

    // onProgress callback currently not supported
    undefined,

    // onError callback
    function(err) {
      console.error("An error happened.");
    }
  );

  var sphere = new THREE.SphereGeometry(__r * 2, 20, 40);
  var earth = new THREE.Mesh(
    sphere,
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.1,
      transparent: true,
      wireframe: true
    })
  );
  earth.position.y = -__r * 2;
  scene.add(earth);
  stone = earth;

  core = new THREE.Mesh(
    new THREE.SphereGeometry(__r * 2 - 5, 20, 20),
    new THREE.MeshNormalMaterial(0xdff6f2)
  );
  core.position.y = -__r * 2 - 2.5;
  scene.add(core);

  loopFunctions.push([animateAccordingToMouse, "ANIMATE_ACCORDING_TO_MOUSE"]);
  loopFunctions.push([updateVertices, "NOISE"]);
}

var v = { val: 0, k: 0 };

function initDevices() {
  for (var i = 0; i < numberOfDevices; ++i) {
    var random = Math.random();
    var device;
    if (random < 0.4) device = makePhone();
    else if (random > 0.6) device = makeLaptop();
    else device = makeTablet();

    device._angle = i * slices * THREE.Math.DEG2RAD;

    device.position.copy(pos);
    scene.add(device);

    devices.push(device);
  }

  roll();
}

function roll() {
  TweenMax.to(v, 3, {
    k: v.k + 1,
    ease: Expo.easeInOut,
    detay: 2,
    onUpdate: function() {
      for (var i = 0; i < devices.length; ++i) {
        pos.set(
          0,
          Math.cos(devices[i]._angle + slices * v.k * THREE.Math.DEG2RAD) *
            __r *
            1.5 -
            __r * 1.5 +
            8,
          Math.sin(devices[i]._angle + slices * v.k * THREE.Math.DEG2RAD) *
            __r *
            1.5
        );

        if (pos.z > -5 && pos.z < 100) {
          toColor(devices[i]._screen, 0x32c53b, devices[i]);
        } else {
          devices[i]._screen.material = new THREE.MeshBasicMaterial({
            color: 0xa01e4f
          });
          devices[i]._check.material.opacity = 0;
        }

        devices[i].position.copy(pos);
      }
    },
    onComplete: function() {
      //v.k += 1;
      roll();
    }
  });
}

function toColor(target, value, device) {
  var initial = new THREE.Color(target.material.color.getHex());
  var value = new THREE.Color(value);
  TweenMax.to(initial, 1, {
    r: value.r,
    g: value.g,
    b: value.b,

    onUpdate: function() {
      target.material.color = initial;
    },
    onComplete: function() {
      TweenMax.to(device._check.material, 0.5, { opacity: 1 });
    }
  });
}

function makePhone() {
  var obj = new THREE.Object3D();
  var mesh = createRoundedbox(8, 16, 1.2, null, createMaterial(0x444444));
  mesh.position.set(-4, 0, 0);
  var screen = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 13),
    new THREE.MeshBasicMaterial({ color: 0x32c53b })
  );
  screen.position.set(0, 8, 0.8);
  var check = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("assets/check.png"),
      transparent: true
    })
  );
  check.position.set(0, 8, 1);
  obj.add(check);
  obj.add(screen);
  obj.add(mesh);

  obj._screen = screen;
  obj._check = check;

  return obj;
}

function makeTablet() {
  var obj = new THREE.Object3D();
  var mesh = createRoundedbox(14, 18, 1.2, null, createMaterial(0x444444));
  mesh.position.set(-7, 0, 0);
  var screen = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 15),
    new THREE.MeshBasicMaterial({ color: 0x32c53b })
  );
  screen.position.set(0, 9, 0.8);
  var check = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("assets/check.png"),
      transparent: true
    })
  );
  check.position.set(0, 9, 1);
  obj.add(check);
  obj.add(screen);
  obj.add(mesh);

  obj._screen = screen;
  obj._check = check;

  return obj;
}

function makeLaptop() {
  var obj = new THREE.Object3D();
  var mesh1 = createRoundedbox(22, 14, 1, null, createMaterial(0x444444));
  mesh1.position.set(-11, 0, -5);
  mesh1.rotation.x = -10 * THREE.Math.DEG2RAD;
  var mesh2 = createRoundedbox(22, 14, 1, null, createMaterial(0x444444));
  mesh2.position.set(-11, 0, -5);
  mesh2.rotation.x = 90 * THREE.Math.DEG2RAD;
  var screen = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 11),
    new THREE.MeshBasicMaterial({ color: 0x32c53b })
  );
  screen.rotation.x = -10 * THREE.Math.DEG2RAD;
  screen.position.set(0, 7.7, -5.4);
  var check = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("assets/check.png"),
      transparent: true
    })
  );
  check.rotation.x = -10 * THREE.Math.DEG2RAD;
  check.position.set(0, 7.7, -5);
  obj.add(check);
  obj.add(screen);
  obj.add(mesh1);
  obj.add(mesh2);

  obj._screen = screen;
  obj._check = check;

  return obj;
}

function createRoundedbox(width, height, radius, extrude, material) {
  var w = width,
    h = height,
    r = radius,
    extrudeSettings = extrude || {
      steps: 1,
      depth: 0.3,
      bevelThickness: 0.4,
      bevelSize: 0.3,
      bevelSegments: 3
    };

  var shape = new THREE.Shape();
  shape.moveTo(r, 0);
  shape.lineTo(w - r, 0);
  shape.bezierCurveTo(w - r, 0, w, 0, w, r);
  shape.lineTo(w, h - r);
  shape.bezierCurveTo(w, h - r, w, h, w - r, h);
  shape.lineTo(r, h);
  shape.bezierCurveTo(r, h, 0, h, 0, h - r);
  shape.lineTo(0, r);
  shape.bezierCurveTo(0, r, 0, 0, r, 0);

  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var mesh = new THREE.Mesh(geometry, material);

  return mesh;
}

// CREATE MATERIAL
function createMaterial(color, texture, sides) {
  sides = sides || THREE.FrontSide;
  color = color || 0xdddddd;
  var material = new THREE.MeshPhongMaterial({
    color: color,
    wireframe: false,
    side: sides
  });
  material.needsUpdate = true;
  return material;
}

function removeFromLoop(fx) {
  for (i in loopFunctions)
    if (loopFunctions[i][1] === fx) loopFunctions.splice(i, 1);
}

function animate() {
  if (!paused) requestAnimationFrame(animate);

  var time = Date.now() * 0.00005;

  for (i in loopFunctions) loopFunctions[i][0](time);
}

function initEvents() {
  document.addEventListener("mousemove", onDocumentMouseMove, false);
  window.addEventListener("resize", onWindowResize, false);
  onWindowResize();
}

function onDocumentMouseMove(e) {
  mouseX = e.clientX - windowHalfX;
  mouseY = e.clientY - windowHalfY;
}

function animateAccordingToMouse(time) {
  //camera
  if (!isMobile) {
    var xdest = cameraX + (mouseX - camera.position.x) * 0.02;
    var ydest = cameraY + (-mouseY - camera.position.y) * 0.03;
    var zdest = cameraZ + (-mouseY - camera.position.y) * 0.02;

    var xvec = xdest - camera.position.x;
    var yvec = ydest - camera.position.y;
    var zvec = zdest - camera.position.z;

    camera.position.x += xvec / 30;
    camera.position.y += yvec / 30;
    camera.position.z += zvec / 30;
  }
}

function onWindowResize() {
  if (window.innerWidth < 740) {
    $("body").addClass("mobile");
    isMobile = true;
    camera.lookAt(0, 0, 0);
  } else {
    $("body").removeClass("mobile");
    isMobile = false;
    camera.lookAt(-20, 10, 0);

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

function render(time) {
  renderer.clear();
  renderer.render(scene, camera);
}

var distortion = {
    base: __r + __r,
    noise: 5
  },
  k = 15.5; //extent;

function updateVertices() {
  if (stone) {
    var time = performance.now() * 0.001;
    for (var i = 0; i < stone.geometry.vertices.length; i++) {
      var p = stone.geometry.vertices[i];
      p.normalize().multiplyScalar(
        distortion.base +
          distortion.noise * noise.perlin3(p.x * k + time, p.y * k, p.z * k)
      );
    }
    stone.geometry.computeVertexNormals();
    stone.geometry.normalsNeedUpdate = true;
    stone.geometry.verticesNeedUpdate = true;
  }
}

init();

$("button").click(function() {
  console.log(camera.position);
});

$(document).scroll(function() {
  st = $(document).scrollTop();
  if (st < window.innerHeight && !isMobile) {
    cameraZ = cameraXYZ.z + st * 0.07;
    cameraX = cameraXYZ.x + st * 0.07;
    cameraY = cameraXYZ.y - st * 0.03;
  }
  if (st > 150) {
    $("body").addClass("scrolled");
  } else {
    $("body").removeClass("scrolled");
  }
});
