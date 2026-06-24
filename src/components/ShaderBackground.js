'use client';

import { useEffect, useRef } from 'react';

/**
 * WebGL animated background — adapted from Stitch shader code.
 * Renders a subtle organic orange-red glow on a deep dark background.
 */
export default function ShaderBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncSize);
      ro.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;

    // Create organic movement
    float t = u_time * 0.3;

    // Soft noise-like blobs using sine waves
    float noise = 0.5 + 0.5 * sin(uv.x * 3.0 + t + sin(uv.y * 2.0 + t));
    noise *= 0.5 + 0.5 * cos(uv.y * 4.0 - t * 0.5 + cos(uv.x * 2.5 + t));

    // Base dark color (hsl(220, 20%, 8%) -> approx rgb(16, 19, 25))
    vec3 baseColor = vec3(0.06, 0.07, 0.1);

    // Zomato Accent Colors: Orange (#f97316) to Red (#e94560)
    vec3 orange = vec3(0.976, 0.451, 0.086);
    vec3 red = vec3(0.914, 0.271, 0.376);

    // Mix accents based on noise and position
    vec3 accent = mix(orange, red, uv.x * 0.5 + 0.5 * sin(t));

    // Final composite: very subtle glow against the dark background
    vec3 color = mix(baseColor, accent, noise * 0.12);

    // Vignette
    float vignette = 1.0 - length(uv - 0.5) * 1.5;
    color *= smoothstep(0.0, 0.8, vignette);

    gl_FragColor = vec4(color, 1.0);
}`;

    function createShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let animId;

    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    render(0);

    return () => {
      cancelAnimationFrame(animId);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div className="shader-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
