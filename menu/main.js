"use strict";

// ---------------------------------------------------------------------------
// Basic 3D menu in raw WebGL: a sphere on the left side of the screen and
// two extruded buttons ("About me", "Contact") hovering to its right, one
// over the other, with mouse-ray picking, hover animation and a subtle
// parallax effect. No dependencies.
// ---------------------------------------------------------------------------

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl", { antialias: true });

if (!gl) {
    document.body.innerHTML = "<p style='color:#fff;font-family:monospace;padding:2rem;'>WebGL is not available in this browser.</p>";
    throw new Error("WebGL not supported");
}

// ------------------------------ mat4 helpers ------------------------------

const mat4 = {
    identity() {
        return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
    },

    multiply(a, b) {
        const out = new Float32Array(16);
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 4; row++) {
                let s = 0;
                for (let k = 0; k < 4; k++) s += a[k * 4 + row] * b[col * 4 + k];
                out[col * 4 + row] = s;
            }
        }
        return out;
    },

    translation(x, y, z) {
        const m = mat4.identity();
        m[12] = x; m[13] = y; m[14] = z;
        return m;
    },

    scaling(x, y, z) {
        const m = mat4.identity();
        m[0] = x; m[5] = y; m[10] = z;
        return m;
    },

    rotationX(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
    },

    rotationY(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
    },

    perspective(fovy, aspect, near, far) {
        const f = 1 / Math.tan(fovy / 2);
        const out = new Float32Array(16);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[14] = (2 * far * near) / (near - far);
        return out;
    },

    invert(m) {
        const inv = new Float32Array(16);

        inv[0]  =  m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
        inv[4]  = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
        inv[8]  =  m[4]*m[9]*m[15]  - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
        inv[12] = -m[4]*m[9]*m[14]  + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
        inv[1]  = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
        inv[5]  =  m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
        inv[9]  = -m[0]*m[9]*m[15]  + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
        inv[13] =  m[0]*m[9]*m[14]  - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
        inv[2]  =  m[1]*m[6]*m[15]  - m[1]*m[7]*m[14]  - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7]  - m[13]*m[3]*m[6];
        inv[6]  = -m[0]*m[6]*m[15]  + m[0]*m[7]*m[14]  + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7]  + m[12]*m[3]*m[6];
        inv[10] =  m[0]*m[5]*m[15]  - m[0]*m[7]*m[13]  - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7]  - m[12]*m[3]*m[5];
        inv[14] = -m[0]*m[5]*m[14]  + m[0]*m[6]*m[13]  + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6]  + m[12]*m[2]*m[5];
        inv[3]  = -m[1]*m[6]*m[11]  + m[1]*m[7]*m[10]  + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7]   + m[9]*m[3]*m[6];
        inv[7]  =  m[0]*m[6]*m[11]  - m[0]*m[7]*m[10]  - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7]   - m[8]*m[3]*m[6];
        inv[11] = -m[0]*m[5]*m[11]  + m[0]*m[7]*m[9]   + m[4]*m[1]*m[11] - m[4]*m[3]*m[9]  - m[8]*m[1]*m[7]   + m[8]*m[3]*m[5];
        inv[15] =  m[0]*m[5]*m[10]  - m[0]*m[6]*m[9]   - m[4]*m[1]*m[10] + m[4]*m[2]*m[9]  + m[8]*m[1]*m[6]   - m[8]*m[2]*m[5];

        let det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
        if (det === 0) return mat4.identity();
        det = 1 / det;
        for (let i = 0; i < 16; i++) inv[i] *= det;
        return inv;
    },

    transformPoint(m, p) {
        const x = p[0], y = p[1], z = p[2];
        const w = m[3]*x + m[7]*y + m[11]*z + m[15];
        return [
            (m[0]*x + m[4]*y + m[8]*z  + m[12]) / w,
            (m[1]*x + m[5]*y + m[9]*z  + m[13]) / w,
            (m[2]*x + m[6]*y + m[10]*z + m[14]) / w,
        ];
    },

    transformDirection(m, v) {
        const x = v[0], y = v[1], z = v[2];
        return [
            m[0]*x + m[4]*y + m[8]*z,
            m[1]*x + m[5]*y + m[9]*z,
            m[2]*x + m[6]*y + m[10]*z,
        ];
    },
};

// ------------------------------- shaders -----------------------------------

const VERT_SRC = /*glsl*/`
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;

varying vec3 vNormal;
varying vec2 vUV;

void main() {
    vNormal = mat3(uModel[0].xyz, uModel[1].xyz, uModel[2].xyz) * aNormal;
    vUV = aUV;
    gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}
`;

const FRAG_SRC = /*glsl*/`
precision mediump float;

varying vec3 vNormal;
varying vec2 vUV;

uniform vec3 uColor;
uniform float uUseTexture;
uniform float uHighlight;
uniform sampler2D uTexture;

const vec3 LIGHT_DIR = vec3(0.35, 0.5, 0.8);

void main() {
    vec3 n = normalize(vNormal);
    float diffuse = max(dot(n, normalize(LIGHT_DIR)), 0.0);
    float light = 0.45 + 0.55 * diffuse;

    if (uUseTexture > 0.5) {
        vec4 tex = texture2D(uTexture, vUV);
        if (tex.a < 0.01) discard;
        gl_FragColor = vec4(tex.rgb, tex.a);
    } else {
        vec3 base = uColor + uHighlight * vec3(0.18);
        gl_FragColor = vec4(base * light, 1.0);
    }
}
`;

function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, VERT_SRC));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FRAG_SRC));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

const attribs = {
    position: gl.getAttribLocation(program, "aPosition"),
    normal: gl.getAttribLocation(program, "aNormal"),
    uv: gl.getAttribLocation(program, "aUV"),
};

const uniforms = {
    proj: gl.getUniformLocation(program, "uProj"),
    view: gl.getUniformLocation(program, "uView"),
    model: gl.getUniformLocation(program, "uModel"),
    color: gl.getUniformLocation(program, "uColor"),
    useTexture: gl.getUniformLocation(program, "uUseTexture"),
    highlight: gl.getUniformLocation(program, "uHighlight"),
    texture: gl.getUniformLocation(program, "uTexture"),
};

// ------------------------------- geometry ----------------------------------

// Unit cube centered at the origin (positions, normals, UVs).
function buildCube() {
    // x, y, z, nx, ny, nz, u, v
    const faces = [
        // +Z (front)
        [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5], [0,0,1]],
        // -Z (back)
        [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5], [0,0,-1]],
        // +X
        [[ 0.5,-0.5, 0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5], [1,0,0]],
        // -X
        [[-0.5,-0.5,-0.5],[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5], [-1,0,0]],
        // +Y
        [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5], [0,1,0]],
        // -Y
        [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5], [0,-1,0]],
    ];
    const uvCorners = [[0,0],[1,0],[1,1],[0,1]];

    const data = [];
    for (const [a, b, c, d, n] of faces) {
        const quad = [a, b, c, a, c, d];
        const uvs = [uvCorners[0], uvCorners[1], uvCorners[2], uvCorners[0], uvCorners[2], uvCorners[3]];
        for (let i = 0; i < 6; i++) {
            data.push(...quad[i], ...n, ...uvs[i]);
        }
    }
    return new Float32Array(data);
}

// Flat quad facing +Z, unit size, centered at origin.
function buildQuad() {
    const n = [0, 0, 1];
    const verts = [
        [-0.5,-0.5,0, ...n, 0,0],
        [ 0.5,-0.5,0, ...n, 1,0],
        [ 0.5, 0.5,0, ...n, 1,1],
        [-0.5,-0.5,0, ...n, 0,0],
        [ 0.5, 0.5,0, ...n, 1,1],
        [-0.5, 0.5,0, ...n, 0,1],
    ];
    return new Float32Array(verts.flat());
}

// UV sphere with unit diameter, centered at the origin.
function buildSphere(latBands, longBands) {
    const vert = (lat, lon) => {
        const theta = (lat / latBands) * Math.PI;
        const phi = (lon / longBands) * 2 * Math.PI;
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.cos(theta);
        const z = Math.sin(theta) * Math.sin(phi);
        // Position (radius 0.5), normal, UV.
        return [x * 0.5, y * 0.5, z * 0.5, x, y, z, lon / longBands, 1 - lat / latBands];
    };

    const data = [];
    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < longBands; lon++) {
            const a = vert(lat, lon);
            const b = vert(lat + 1, lon);
            const c = vert(lat + 1, lon + 1);
            const d = vert(lat, lon + 1);
            data.push(...a, ...b, ...c, ...a, ...c, ...d);
        }
    }
    return new Float32Array(data);
}

function makeBuffer(data) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { buffer: buf, vertexCount: data.length / 8 };
}

const cubeMesh = makeBuffer(buildCube());
const quadMesh = makeBuffer(buildQuad());
const sphereMesh = makeBuffer(buildSphere(32, 48));

function bindMesh(mesh) {
    const STRIDE = 8 * 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.enableVertexAttribArray(attribs.position);
    gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(attribs.normal);
    gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, STRIDE, 3 * 4);
    gl.enableVertexAttribArray(attribs.uv);
    gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, STRIDE, 6 * 4);
}

// ---------------------------- label textures -------------------------------

function makeLabelTexture(text) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, c.width / 2, c.height / 2);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
}

// -------------------------------- scene ------------------------------------

const BUTTON_SIZE = [2.6, 0.8, 0.3]; // width, height, depth

// Sphere on the left side of the screen. The buttons hover over its right
// side, one over the other.
const sphere = {
    position: [-2.4, 0, 0],
    radius: 1.7,
    color: [0.35, 0.2, 0.5],
    model: mat4.identity(),
};

function buttonPosition(button_number) {
    const angle = (3 * Math.PI / 8) + (button_number * (3 * Math.PI / 24));
    const extended_radius = sphere.radius + 1.8;
    return [
        sphere.position[0] + Math.sin(angle) * extended_radius,
        sphere.position[1] + Math.cos(angle) * extended_radius,
        0.0,
    ];
}

const buttons = [
    {
        label: "About me",
        href: "../",
        position: buttonPosition(0),
        color: [0.16, 0.32, 0.55],
        texture: makeLabelTexture("About me"),
        scale: 1,
        targetScale: 1,
        phase: 0,
        model: mat4.identity(),
    },
    {
        label: "Contact",
        href: "mailto:cpedraza@unal.edu.co",
        position: buttonPosition(1),
        color: [0.16, 0.45, 0.35],
        texture: makeLabelTexture("Contact"),
        scale: 1,
        targetScale: 1,
        phase: Math.PI / 2,
        model: mat4.identity(),
    },
];

const camera = {
    fov: Math.PI / 4,
    near: 0.1,
    far: 100,
    // Simple camera at +Z looking at the origin.
    view: mat4.translation(0, 0, -8),
};

let proj = mat4.identity();

const mouse = { x: 0, y: 0, nx: 0, ny: 0, inside: false };
let hovered = null;

// ------------------------------- resizing ----------------------------------

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        proj = mat4.perspective(camera.fov, w / h, camera.near, camera.far);
    }
}

window.addEventListener("resize", resize);

// -------------------------------- picking ----------------------------------

// Ray-AABB intersection (slab method) in the button's local space.
function rayHitsUnitBox(origin, dir) {
    let tmin = -Infinity, tmax = Infinity;
    for (let i = 0; i < 3; i++) {
        if (Math.abs(dir[i]) < 1e-9) {
            if (Math.abs(origin[i]) > 0.5) return false;
            continue;
        }
        let t1 = (-0.5 - origin[i]) / dir[i];
        let t2 = ( 0.5 - origin[i]) / dir[i];
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return false;
    }
    return tmax >= 0;
}

function pick() {
    if (!mouse.inside) return null;

    const invViewProj = mat4.invert(mat4.multiply(proj, camera.view));
    const near = mat4.transformPoint(invViewProj, [mouse.nx, mouse.ny, -1]);
    const far  = mat4.transformPoint(invViewProj, [mouse.nx, mouse.ny,  1]);
    const dir = [far[0] - near[0], far[1] - near[1], far[2] - near[2]];

    for (const button of buttons) {
        const invModel = mat4.invert(button.model);
        const localOrigin = mat4.transformPoint(invModel, near);
        const localDir = mat4.transformDirection(invModel, dir);
        if (rayHitsUnitBox(localOrigin, localDir)) return button;
    }
    return null;
}

// --------------------------------- input -----------------------------------

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.inside = true;
});

canvas.addEventListener("mouseleave", () => {
    mouse.inside = false;
});

canvas.addEventListener("click", () => {
    if (hovered) window.location.href = hovered.href;
});

// -------------------------------- render -----------------------------------

function updateModels(time) {
    // Parallax: the whole menu leans towards the mouse.
    const leanY = mouse.inside ? mouse.nx * 0.35 : 0;
    const leanX = mouse.inside ? -mouse.ny * 0.2 : 0;
    const parent = mat4.multiply(mat4.rotationY(leanY), mat4.rotationX(leanX));

    // Sphere: slow spin plus the same parallax lean as the buttons.
    const spin = mat4.rotationY(time * 0.0003);
    const sphereT = mat4.translation(...sphere.position);
    const sphereS = mat4.scaling(sphere.radius * 2, sphere.radius * 2, sphere.radius * 2);
    sphere.model = mat4.multiply(parent, mat4.multiply(sphereT, mat4.multiply(spin, sphereS)));

    for (const button of buttons) {
        button.scale += (button.targetScale - button.scale) * 0.15;

        const float = Math.sin(time * 0.001 + button.phase) * 0.04;
        const t = mat4.translation(button.position[0], button.position[1] + float, button.position[2]);
        const s = mat4.scaling(
            BUTTON_SIZE[0] * button.scale,
            BUTTON_SIZE[1] * button.scale,
            BUTTON_SIZE[2] * button.scale,
        );
        button.model = mat4.multiply(parent, mat4.multiply(t, s));
    }
}

function draw() {
    gl.clearColor(0.063, 0.063, 0.102, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.uniformMatrix4fv(uniforms.proj, false, proj);
    gl.uniformMatrix4fv(uniforms.view, false, camera.view);
    gl.uniform1i(uniforms.texture, 0);

    gl.disable(gl.BLEND);
    gl.uniform1f(uniforms.useTexture, 0);

    // Sphere body.
    bindMesh(sphereMesh);
    gl.uniformMatrix4fv(uniforms.model, false, sphere.model);
    gl.uniform3fv(uniforms.color, sphere.color);
    gl.uniform1f(uniforms.highlight, 0);
    gl.drawArrays(gl.TRIANGLES, 0, sphereMesh.vertexCount);

    // Opaque button bodies.
    bindMesh(cubeMesh);
    for (const button of buttons) {
        gl.uniformMatrix4fv(uniforms.model, false, button.model);
        gl.uniform3fv(uniforms.color, button.color);
        gl.uniform1f(uniforms.highlight, button === hovered ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, cubeMesh.vertexCount);
    }

    // Text labels, slightly in front of each button.
    bindMesh(quadMesh);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uniforms.useTexture, 1);
    for (const button of buttons) {
        // Place the label on the front face: local +Z is at 0.5, nudge it out.
        const labelOffset = mat4.translation(0, 0, 0.51);
        const labelScale = mat4.scaling(0.85, 0.85 * (128 / 512) * (BUTTON_SIZE[0] / BUTTON_SIZE[1]), 1);
        const model = mat4.multiply(button.model, mat4.multiply(labelOffset, labelScale));
        gl.uniformMatrix4fv(uniforms.model, false, model);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, button.texture);
        gl.drawArrays(gl.TRIANGLES, 0, quadMesh.vertexCount);
    }
}

function frame(time) {
    resize();
    updateModels(time);

    hovered = pick();
    for (const button of buttons) {
        button.targetScale = button === hovered ? 1.1 : 1;
    }
    canvas.classList.toggle("pointer", hovered !== null);

    draw();
    requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
