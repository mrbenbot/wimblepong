import { BALL_COLOUR_RGB } from "../config";
import { MutableGameState, Player } from "../types";

export const initWebGL = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("Your browser does not support WebGL");
  }
  return gl;
};

const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("An error occurred creating the shader");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const createProgram = (gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
  const program = gl.createProgram();
  if (!program) {
    console.error("Unable to create the shader program: ");
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
    return null;
  }
  return program;
};

const vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;

    void main() {
      vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
  `;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
  `;

export const initShaders = (gl: WebGL2RenderingContext) => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (vertexShader && fragmentShader) {
    const program = createProgram(gl, vertexShader, fragmentShader);
    return program;
  }
  return null;
};

const drawRectangle = (positions: Float32Array, x: number, y: number, width: number, height: number, offset: number) => {
  const x1 = x;
  const y1 = y;
  const x2 = x + width;
  const y2 = y + height;
  positions.set([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2], offset);
};

const createCircleVertices = (centerX: number, centerY: number, radius: number, numSegments: number, vertices: Float32Array) => {
  vertices[0] = centerX;
  vertices[1] = centerY;
  let offset = 2;
  for (let i = 0; i < numSegments; i++) {
    const angle = (i * 2 * Math.PI) / numSegments;
    vertices[offset++] = centerX + radius * Math.cos(angle);
    vertices[offset++] = centerY + radius * Math.sin(angle);
  }
  vertices[offset++] = vertices[2]; // Closing vertex
  vertices[offset] = vertices[3];
};

export function initDrawingContext(canvas: HTMLCanvasElement) {
  const gl = initWebGL(canvas);
  if (!gl) return;
  const program = initShaders(gl);
  if (!program) return;

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const colorLocation = gl.getUniformLocation(program, "u_color");
  gl.useProgram(program);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = new Float32Array(12); // Buffer for one rectangle

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const numSegments = 50; // Increase for a smoother circle
  const circleVertices = new Float32Array((numSegments + 2) * 2); // Common buffer for the circle vertices

  gl.bindVertexArray(null);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  return (gameState: MutableGameState) => {
    gl.bindVertexArray(vao);

    [Player.Player1, Player.Player2].forEach((player) => {
      const {
        x,
        y,
        width,
        height,
        colour: { r, g, b },
      } = gameState[player];
      gl.uniform4f(colorLocation, r, g, b, 1);
      drawRectangle(positions, x, y, width, height, 0);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    const { x: ballX, y: ballY, radius } = gameState.ball;
    const { r: br, g: bg, b: bb } = BALL_COLOUR_RGB;

    gl.uniform4f(colorLocation, br, bg, bb, 1);
    createCircleVertices(ballX, ballY, radius, numSegments, circleVertices);
    gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2); // +2 for center and closing vertex

    gl.bindVertexArray(null);
  };
}
