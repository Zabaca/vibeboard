import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
const ThreeCube = () => {
  const containerRef = useRef(null);
  const [renderer, setRenderer] = useState(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [cube, setCube] = useState(null);
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene with transparent background
    const newScene = new THREE.Scene();
    newScene.background = null;

    // Create camera
    const newCamera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    newCamera.position.z = 5;

    // Create renderer with transparent background
    const newRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    newRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    newRenderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(newRenderer.domElement);

    // Create cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.9,
      wireframe: false
    });
    const newCube = new THREE.Mesh(geometry, material);
    newScene.add(newCube);

    // Add some lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    newScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    newScene.add(directionalLight);

    // Set state
    setRenderer(newRenderer);
    setScene(newScene);
    setCamera(newCamera);
    setCube(newCube);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (newCube) {
        newCube.rotation.x += 0.01;
        newCube.rotation.y += 0.01;
      }
      if (newRenderer && newScene && newCamera) {
        newRenderer.render(newScene, newCamera);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !newCamera || !newRenderer) return;
      newCamera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      newCamera.updateProjectionMatrix();
      newRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && newRenderer) {
        containerRef.current.removeChild(newRenderer.domElement);
      }
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    style: {
      width: '100%',
      height: '400px',
      position: 'relative',
      overflow: 'hidden'
    }
  });
};
export default ThreeCube;