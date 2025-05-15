/* global AFRAME, THREE */

AFRAME.registerComponent('walk-effects', {
    schema: {
      bobFrequency: { type: 'number', default: 5 },    // How fast the bobbing happens (steps per second)
      bobAmplitude: { type: 'number', default: 0.05 }, // How high/low the bob goes (in meters)
      swayFrequency: { type: 'number', default: 0.6 },  // How fast the side-to-side sway happens
      swayAmplitude: { type: 'number', default: 0.03 }, // How far side-to-side the sway goes (in meters)
      moveThreshold: { type: 'number', default: 0.001 } // Minimum distance moved to trigger effects
    },
  
    init: function () {
      this.cameraEl = this.el.querySelector('a-camera');
      if (!this.cameraEl) {
        console.error("walk-effects component needs to be attached to an entity with an a-camera child.");
        return;
      }
      this.rigElement = this.el; // The entity this component is attached to (the rig)
  
      this.bobTime = 0;
      this.swayTime = 0;
      this.baseCameraY = this.cameraEl.object3D.position.y; // Store original camera height
      this.baseCameraX = this.cameraEl.object3D.position.x; // Store original camera X offset (usually 0)
      this.previousPosition = new THREE.Vector3();
      this.currentPosition = new THREE.Vector3();
  
      // Store the initial rig position
      this.rigElement.object3D.getWorldPosition(this.previousPosition); 
    },
  
    tick: function (time, timeDelta) {
      if (!this.cameraEl || !this.rigElement) return;
      
      const data = this.data;
      const dt = timeDelta / 1000; // Convert timeDelta to seconds
  
      // Get current world position of the rig
      this.rigElement.object3D.getWorldPosition(this.currentPosition);
  
      // Calculate distance moved since last frame
      const distanceMoved = this.currentPosition.distanceTo(this.previousPosition);
  
      let isMoving = distanceMoved > data.moveThreshold * dt; // Check if moved significantly
  
       // Simple check for WASD activity (less reliable than distance check, but can supplement)
       // Note: This requires wasd-controls to be on the same entity or its children
      const wasdControls = this.rigElement.components['wasd-controls'] || (this.cameraEl && this.cameraEl.components['wasd-controls']);
      if (wasdControls && (wasdControls.keys.KeyW || wasdControls.keys.KeyA || wasdControls.keys.KeyS || wasdControls.keys.KeyD || wasdControls.keys.ArrowUp || wasdControls.keys.ArrowLeft || wasdControls.keys.ArrowDown || wasdControls.keys.ArrowRight)) {
          isMoving = true; // Uncomment this line if distance check isn't sensitive enough
      }
  
  
      if (isMoving) {
        // Increment timers based on delta time for consistent speed
        this.bobTime += dt * data.bobFrequency;
        this.swayTime += dt * data.swayFrequency;
  
        // Calculate bob offset (sine wave for up/down)
        // Use Math.abs(Math.sin) to ensure it starts by going down slightly like a footstep might
        let bobOffset = data.bobAmplitude * Math.abs(Math.sin(this.bobTime * Math.PI)); 
        // Or a simpler bob: let bobOffset = data.bobAmplitude * Math.sin(this.bobTime * Math.PI * 2);
  
        // Calculate sway offset (sine wave for left/right)
        let swayOffset = data.swayAmplitude * Math.sin(this.swayTime * Math.PI * 2);
  
        // Apply offsets to the CAMERA's LOCAL position relative to the rig
        this.cameraEl.object3D.position.y = this.baseCameraY - bobOffset; // Subtract bobOffset to simulate foot landing
        this.cameraEl.object3D.position.x = this.cameraEl.object3D.position.x + swayOffset;
  
      } 
      // Update previous position for the next frame's calculation
      this.previousPosition.copy(this.currentPosition);
    }
  });