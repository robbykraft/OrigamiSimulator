/**
 * Created by amandaghassaei on 5/5/17.
 */

// import * as THREE from "../import/three.module";
import Node from "./node";
import window from "./environment/window";

const THREE = window.THREE || require("three");

function init3DUI(globals) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const raycasterPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1));
  let isDragging = false;
  let draggingNode = null;
  let draggingNodeFixed = false;
  let mouseDown = false;
  let highlightedObj;

  const highlighter1 = new Node(globals, new THREE.Vector3());
  highlighter1.setTransparent();
  globals.threeView.scene.add(highlighter1.getObject3D());

  function setHighlightedObj(object) {
    if (highlightedObj && (object != highlightedObj)) {
      // highlightedObj.unhighlight();
      highlighter1.getObject3D().visible = false;
    }
    highlightedObj = object;
    if (highlightedObj) {
      // highlightedObj.highlight();
      highlighter1.getObject3D().visible = true;
    }
  }

  window.document.addEventListener("mousedown", (e) => {
    mouseDown = true;

    if (globals.touchMode === "grab") {
      // let bounds = e.target.getBoundingClientRect();
      // i know what we're targeting. target it directly
      const parent = globals.parent || window.document.getElementsByTagName("body")[0];
      const bounds = parent.getBoundingClientRect();
      // e.preventDefault();
      // mouse.x = (e.clientX/window.innerWidth)*2-1;
      // mouse.y = - (e.clientY/window.innerHeight)*2+1;
      mouse.x = ((e.clientX - bounds.x) / bounds.width) * 2 - 1;
      mouse.y = -((e.clientY - bounds.y) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(mouse, globals.threeView.camera);

      const obj = checkForIntersections(e, globals.model.getMesh());
      setHighlightedObj(obj);

      if (highlightedObj) {
        draggingNode = highlightedObj;
        draggingNodeFixed = draggingNode.isFixed();
        draggingNode.setFixed(true);
        globals.fixedHasChanged = true;
        globals.threeView.enableCameraRotate(false);
      } else {
        // clicked somewhere outside the origami, temp switch to rotate mode
        globals.threeView.enableCameraRotate(true);
      }
    }
  }, false);

  window.document.addEventListener("mouseup", () => {
    isDragging = false;
    if (draggingNode) {
      draggingNode.setFixed(draggingNodeFixed);
      draggingNode = null;
      globals.fixedHasChanged = true;
      setHighlightedObj(null);
      globals.shouldCenterGeo = true;
    }
    if (globals.touchMode === "grab") {
      // grab mode temporarily becomes rotate when clicking outside object
      globals.threeView.enableCameraRotate(false);
    }
    mouseDown = false;
  }, false);
  window.document.addEventListener("mousemove", mouseMove, false);
  function mouseMove(e) {
    if (mouseDown) {
      isDragging = true;
    }
    // if (!globals.userInteractionEnabled) return;
    if (globals.touchMode === "rotate") { return; }

    if (isDragging) {
      if (highlightedObj) {
        const parent = globals.parent || window.document.getElementsByTagName("body")[0];
        const bounds = parent.getBoundingClientRect();
        mouse.x = ((e.clientX - bounds.x) / bounds.width) * 2 - 1;
        mouse.y = -((e.clientY - bounds.y) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(mouse, globals.threeView.camera);
        const intersection = getIntersectionWithObjectPlane(highlightedObj.getPosition().clone());
        highlightedObj.moveManually(intersection);
        globals.nodePositionHasChanged = true;
      }
    } else {
      const parent = globals.parent || window.document.getElementsByTagName("body")[0];
      const bounds = parent.getBoundingClientRect();
      mouse.x = ((e.clientX - bounds.x) / bounds.width) * 2 - 1;
      mouse.y = -((e.clientY - bounds.y) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(mouse, globals.threeView.camera);
      const obj = checkForIntersections(e, globals.model.getMesh());
      setHighlightedObj(obj);
    }
    if (highlightedObj) {
      const position = highlightedObj.getPosition();
      highlighter1.getObject3D().position.set(position.x, position.y, position.z);
    }
  }

  function getIntersectionWithObjectPlane(position) {
    const cameraOrientation = globals.threeView.camera.getWorldDirection();
    const dist = position.dot(cameraOrientation);
    raycasterPlane.set(cameraOrientation, -dist);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(raycasterPlane, intersection);
    return intersection;
  }

  function checkForIntersections(e, objects) {
    let _highlightedObj = null;
    const intersections = raycaster.intersectObjects(objects, false);
    if (intersections.length > 0) {
      const face = intersections[0].face;
      const position = intersections[0].point;
      const positionsArray = globals.model.getPositionsArray();
      const vertices = [];
      vertices.push(new THREE.Vector3(
        positionsArray[3 * face.a],
        positionsArray[3 * face.a + 1],
        positionsArray[3 * face.a + 2]
      ));
      vertices.push(new THREE.Vector3(
        positionsArray[3 * face.b],
        positionsArray[3 * face.b + 1],
        positionsArray[3 * face.b + 2]
      ));
      vertices.push(new THREE.Vector3(
        positionsArray[3 * face.c],
        positionsArray[3 * face.c + 1],
        positionsArray[3 * face.c + 2]
      ));
      let dist = vertices[0].clone().sub(position).lengthSq();
      let nodeIndex = face.a;
      for (let i = 1; i < 3; i += 1) {
        const _dist = (vertices[i].clone().sub(position)).lengthSq();
        if (_dist < dist) {
          dist = _dist;
          if (i === 1) nodeIndex = face.b;
          else nodeIndex = face.c;
        }
      }
      const nodesArray = globals.model.getNodes();
      _highlightedObj = nodesArray[nodeIndex];
    }
    return _highlightedObj;
  }

  function hideHighlighters() {
    highlighter1.getObject3D().visible = false;
  }

  // globals.threeView.sceneAdd(raycasterPlane);

  return {
    hideHighlighters
  };
}

export default init3DUI;
