// Postproceso: oclusion ambiental, bloom de las luminarias y un grado final
// con vineta, grano y desenfoque radial durante los cambios de capitulo.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GradoShader = {
  uniforms: {
    tDiffuse: { value: null },
    uT: { value: 0 },
    uTrans: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) }
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uT, uTrans;
    uniform vec2 uRes;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      float bl = uTrans * 0.0075;
      vec3 c = vec3(0.0);
      float ws = 0.0;
      for (int i = 0; i < 7; i++) {
        float k = float(i) / 6.0;
        float w = 1.0 - k * 0.62;
        c += texture2D(tDiffuse, vUv - d * k * bl).rgb * w;
        ws += w;
      }
      c /= ws;
      float ca = (0.0007 + uTrans * 0.0032) * r2;
      c.r = mix(c.r, texture2D(tDiffuse, vUv - d * ca).r, 0.55);
      c.b = mix(c.b, texture2D(tDiffuse, vUv + d * ca).b, 0.55);
      c = max(c, 0.0);
      c *= 1.0 - smoothstep(0.22, 0.92, r2 * 1.55) * 0.46;
      c += (hash(vUv * uRes + uT) - 0.5) * 0.016;
      c = c * 1.015 + vec3(0.0035, 0.003, 0.0025);
      gl_FragColor = vec4(c, 1.0);
    }
  `
};

export function crearPost({ R, S, cam, MOV }) {
  const composer = new EffectComposer(R);
  composer.setPixelRatio(R.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(S, cam));

  let ssao = null;
  if (!MOV) {
    ssao = new SSAOPass(S, cam, innerWidth, innerHeight);
    ssao.kernelRadius = 1.4;
    ssao.minDistance = 0.0015;
    ssao.maxDistance = 0.055;
    composer.addPass(ssao);
  }

  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.5, 1.05);
  composer.addPass(bloom);

  const grade = new ShaderPass(GradoShader);
  grade.uniforms.uRes.value.set(innerWidth, innerHeight);
  composer.addPass(grade);

  composer.addPass(new OutputPass());

  function setSize(w, h) {
    composer.setPixelRatio(R.getPixelRatio());
    composer.setSize(w, h);
    grade.uniforms.uRes.value.set(w * R.getPixelRatio(), h * R.getPixelRatio());
  }

  return { composer, grade, bloom, ssao, setSize };
}
