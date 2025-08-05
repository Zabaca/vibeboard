import React, { useState, useEffect, useRef } from 'react';
const ThreeDBox = () => {
  const canvasRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);

    // Dynamically import three.js to avoid SSR issues
    import('three').then(THREE => {
      if (!canvasRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
      camera.position.z = 5;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true
      });
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Create cube
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({
        color: 0x4f46e5,
        shininess: 100,
        specular: 0x111111
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(3, 3, 3);
      scene.add(directionalLight);

      // Handle resize
      const handleResize = () => {
        if (!canvasRef.current) return;
        camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      };
      window.addEventListener('resize', handleResize);

      // Animation loop
      let animationId;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      };
    });
  }, []);
  const containerStyle = {
    width: '100%',
    height: '400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  };
  const canvasStyle = {
    width: '100%',
    height: '100%',
    display: 'block'
  };
  const loadingStyle = {
    color: '#64748b',
    fontSize: '18px',
    fontWeight: '500',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };
  return /*#__PURE__*/React.createElement('div', {
    style: containerStyle
  }, isMounted ? /*#__PURE__*/React.createElement('canvas', {
    ref: canvasRef,
    style: canvasStyle
  }) : /*#__PURE__*/React.createElement('div', {
    style: loadingStyle
  }, 'Loading 3D viewer...'));
};
export default ThreeDBox;