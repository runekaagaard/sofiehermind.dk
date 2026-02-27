// 3D Rotating Sun with Three.js
class Sun3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 3;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Create sun
        this.createSun();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Animation
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    createSun() {
        // Sphere geometry
        const geometry = new THREE.SphereGeometry(1, 64, 64);

        // Load sun texture
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('/assets/images/sun-texture.jpg');

        // Custom shader material for sun effect with texture
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                sunTexture: { value: sunTexture }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;

                // Noise function for surface variation
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }

                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);

                    // Add subtle surface displacement
                    vec3 pos = position;
                    float noise = snoise(position * 2.0 + time * 0.1) * 0.02;
                    pos += normal * noise;

                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;
                uniform sampler2D sunTexture;

                void main() {
                    // Scale UV coordinates to zoom out texture (0.85 = less zoom)
                    vec2 centeredUv = (vUv - 0.5) * 0.85 + 0.5;

                    // Sample the texture with scaled UVs
                    vec4 texColor = texture2D(sunTexture, centeredUv);

                    // Animated UV offset for subtle movement
                    vec2 animUv = centeredUv + vec2(
                        sin(time * 0.1 + centeredUv.y * 3.14) * 0.01,
                        cos(time * 0.08 + centeredUv.x * 3.14) * 0.01
                    );
                    vec4 animTexColor = texture2D(sunTexture, animUv);

                    // Mix static and animated texture
                    vec3 color = mix(texColor.rgb, animTexColor.rgb, 0.3);

                    // Enhance brightness and saturation
                    color *= 1.3;

                    // Fresnel effect for glow
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 2.5);

                    // Add golden glow at edges
                    vec3 glowColor = vec3(1.0, 0.9, 0.5);
                    color += glowColor * fresnel * 0.5;

                    // Subtle pulsing effect
                    float pulse = sin(time * 0.5) * 0.05 + 1.0;
                    color *= pulse;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        this.sun = new THREE.Mesh(geometry, material);
        this.scene.add(this.sun);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsed = this.clock.getElapsedTime();

        // Slow rotation
        this.sun.rotation.y = elapsed * 0.1;
        this.sun.rotation.x = Math.sin(elapsed * 0.05) * 0.1;

        // Update shader time uniform
        this.sun.material.uniforms.time.value = elapsed;

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if Three.js is loaded
    if (typeof THREE !== 'undefined') {
        const sun = new Sun3D('sun-3d-container');
    }
});
