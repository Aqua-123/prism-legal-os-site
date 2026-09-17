// Adapted from research/sentientx/light-hero/background-bccade.html.
/* Light-theme adaptation of the public SentientX shape-grid effect.
 * Source reference and integration notes are in README.md. No dependencies.
 */
  const SHAPES = [
      "M40.942 0C18.33 0 0 18.33 0 40.94c0 22.612 18.33 40.942 40.942 40.942 22.61 0 40.94-18.33 40.94-40.941S63.552 0 40.942 0M27.768 67.527l2.354 2.5 5.608-4.88 23.928-20.82.966-.84-.047-1.164-.114-2.879-.047-1.17-.822-.673L44.34 25.12 29.472 12.954l-1.343-1.1-.981 1.343-2.748 3.751-.746 1.02 21.313 23.44L26.451 61.78l-1.943 2.137-.068.075.066.07z",
      "m26.57 67.526 2.353 2.5 5.61-4.88 23.927-20.82.965-.84-.046-1.164-.116-2.879-.046-1.17-.821-.673-15.254-12.48-14.869-12.167-1.343-1.1-.982 1.343-2.747 3.751-.746 1.02 21.312 23.44-18.516 20.372-1.942 2.137-.068.075.066.07z",
      "M32.673 32.841c-2.129 2.079-3.21 4.708-3.21 7.723 0 3.186 1.07 6.007 3.21 8.313l.014.014.013.014c2.198 2.3 4.94 3.511 8.092 3.511 2.109 0 4.085-.56 5.878-1.667a11.4 11.4 0 0 0 4.121-4.113 11.4 11.4 0 0 0 1.626-5.922c0-3.135-1.193-5.852-3.491-7.995-2.255-2.153-5.01-3.255-8.134-3.255-3.032 0-5.71 1.082-7.91 3.178z"
    ];
  const VERTEX = 'attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}';
  const FRAGMENT = `
    precision highp float;
    uniform sampler2D atlas;
    uniform vec2 resolution, mouse;
    uniform float dpr, cell, waveTime, enter, opacity, shift;
    uniform vec3 ink, trailColor, trail[24];
    float hash(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
    void main(){
      vec2 offset=vec2(mouse.x,-mouse.y)*shift*dpr;
      float cs=cell*dpr;
      vec2 frag=gl_FragCoord.xy-offset;
      vec2 id=floor(frag/cs), local=fract(frag/cs);
      local.y=1.-local.y;
      float w1=sin(dot(id,vec2(.62,.78))*.10-waveTime*1.7);
      float w2=sin(dot(id,vec2(-.5,.66))*.07-waveTime*1.1);
      float wave=clamp(.5+.5*(.62*w1+.38*w2),0.,1.);
      float selection=clamp(wave+(hash(id)-.5)*.9,0.,1.);
      float shape=selection>.6667?0.:(selection>.3333?1.:2.);
      float glyph=texture2D(atlas,vec2((shape+local.x)/3.,local.y)).a;
      float pulse=.35+.65*wave;
      float blank=step(.14,hash(id+vec2(19.,7.)));
      float cp=(gl_FragCoord.x/resolution.x*.62+gl_FragCoord.y/resolution.y*.78)/1.4;
      float front=enter*1.48-.16;
      float revealed=clamp((front-cp)/.03+.5,0.,1.);
      float bright=exp(-pow((cp-front)/.16,2.));
      float base=revealed*mix(opacity,min(opacity*2.1,.32),bright);
      vec2 center=(id+.5)*cs+offset;
      float touched=0.;
      for(int i=0;i<23;i++){
        vec3 a=trail[i],b=trail[i+1];
        if(a.z<=0.||b.z<=0.)continue;
        vec2 delta=center-a.xy,segment=b.xy-a.xy;
        float p=clamp(dot(delta,segment)/max(dot(segment,segment),1.),0.,1.);
        if(length(delta-segment*p)<5.5*dpr) touched=max(touched,min(a.z,b.z));
      }
      float alpha=glyph*blank*mix(pulse*base,min(opacity*3.2,.55),touched);
      vec3 color=mix(ink,trailColor,smoothstep(0.,.25,touched));
      gl_FragColor=vec4(color*alpha,alpha);
    }`;

  export function createLightHeroBackground(canvas, options = {}) {
    const config = Object.assign({ cell: 6, opacity: .23, speed: 1, shift: 60, entranceMs: 1800, trailMs: 550,
      ink: [.20, .26, .34], trailColor: [1, 1, 1] }, options);
    const host = canvas.parentElement;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let gl = null;
    try { gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' }); } catch (_) { /* Static field remains visible. */ }
    let resources = null, available = !!gl, disposed = false, paused = false, inView = true, lost = false;
    let raf = 0, previous = 0, elapsed = 0, waveTime = 0, mx = 0, my = 0, targetX = 0, targetY = 0;
    let width = 1, height = 1, dpr = 1, points = [];
    const trail = new Float32Array(72);
    const announce = () => canvas.dispatchEvent(new Event('fieldstatechange'));
    const moving = () => available && !lost && !disposed && !paused && !preference.matches && !document.hidden && inView;

    function fallback() {
      available = false;
      cancelAnimationFrame(raf); raf = 0;
      canvas.dataset.renderer = 'static';
      delete canvas.dataset.rendered;
      canvas.style.backgroundImage = 'radial-gradient(circle, rgba(51,66,87,.16) .7px, transparent .9px)';
      canvas.style.backgroundSize = '6px 6px';
      announce();
    }
    function atlas() {
      const art = document.createElement('canvas'); art.width = 288; art.height = 96;
      const ctx = art.getContext('2d'); ctx.fillStyle = 'white';
      SHAPES.forEach((shape, i) => {
        ctx.save(); ctx.translate(i * 96 + 48, 48); ctx.scale(96 * .82 / 82, 96 * .82 / 82); ctx.translate(-41, -41);
        ctx.fill(new Path2D(shape), i === 0 ? 'evenodd' : 'nonzero'); ctx.restore();
      });
      return art;
    }
    function setup() {
      const shaders = [];
      const compile = (kind, code) => {
        const shader = gl.createShader(kind); shaders.push(shader); gl.shaderSource(shader, code); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const program = gl.createProgram();
      try {
        const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, precision?.precision ? FRAGMENT : FRAGMENT.replace('highp', 'mediump')));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      } catch (error) {
        gl.deleteProgram(program); throw error;
      } finally { shaders.forEach(shader => gl.deleteShader(shader)); }
      gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const uniform = {};
      for (const name of ['atlas','resolution','mouse','dpr','cell','waveTime','enter','opacity','shift','ink','trailColor','trail']) {
        uniform[name] = gl.getUniformLocation(program, name === 'trail' ? 'trail[0]' : name);
      }
      resources = { program, buffer, texture, uniform };
      available = true; canvas.dataset.renderer = 'webgl'; canvas.style.backgroundImage = '';
    }
    function draw(now) {
      if (!available || lost || disposed || !resources) return;
      const u = resources.uniform;
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
      previous = now;
      if (moving()) elapsed += dt * 1000;
      const progress = preference.matches ? 1 : Math.min(elapsed / config.entranceMs, 1);
      const enter = 1 - Math.pow(1 - progress, 3);
      if (moving()) waveTime += dt * config.speed * (1 + 11 * (1 - enter));
      const easing = 1 - Math.pow(1 - .08, dt * 60);
      if (moving()) { mx += (targetX - mx) * easing; my += (targetY - my) * easing; }
      trail.fill(0);
      points = points.filter(p => now - p.time < config.trailMs).slice(-24);
      points.forEach((p, i) => { trail[i*3] = p.x * dpr; trail[i*3+1] = (height - p.y) * dpr; trail[i*3+2] = 1 - (now - p.time)/config.trailMs; });
      gl.useProgram(resources.program);
      gl.uniform1i(u.atlas, 0); gl.uniform2f(u.resolution, canvas.width, canvas.height);
      gl.uniform2f(u.mouse, mx, my); gl.uniform1f(u.dpr, dpr); gl.uniform1f(u.cell, config.cell);
      gl.uniform1f(u.waveTime, waveTime); gl.uniform1f(u.enter, enter); gl.uniform1f(u.opacity, config.opacity);
      gl.uniform1f(u.shift, config.shift); gl.uniform3fv(u.ink, config.ink); gl.uniform3fv(u.trailColor, config.trailColor);
      gl.uniform3fv(u.trail, trail);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES,0,3);
      canvas.dataset.progress = progress.toFixed(3);
      if (progress >= .15) canvas.dataset.rendered = 'true';
    }
    function loop(now) { raf = 0; draw(now); if (moving()) raf = requestAnimationFrame(loop); }
    function reconcile() {
      cancelAnimationFrame(raf); raf = 0; previous = 0;
      if (moving()) raf = requestAnimationFrame(loop);
      else if (!paused || preference.matches) draw(performance.now());
    }
    function resize() {
      const rect = canvas.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
      if (available && !lost) { gl.viewport(0,0,canvas.width,canvas.height); draw(performance.now()); }
    }
    function pointer(event) {
      if (!moving() || event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
      targetX = x/width*2-1; targetY = y/height*2-1;
      const now = performance.now(), last = points[points.length-1];
      if (!last || Math.hypot(x-last.x,y-last.y)>4 || now-last.time>40) points.push({x,y,time:now});
    }
    function leave() { targetX = 0; targetY = 0; }
    function changePreference() { points = []; targetX = targetY = mx = my = 0; reconcile(); announce(); }
    function contextLost(event) { event.preventDefault(); lost = true; fallback(); }
    function contextRestored() {
      lost = false;
      try { setup(); resize(); reconcile(); announce(); } catch { fallback(); }
    }
    if (gl) { try { setup(); } catch (error) { console.warn('Using static background:', error.message); fallback(); } } else fallback();
    resize();
    const observer = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (observer) observer.observe(canvas);
    else window.addEventListener('resize', resize);
    const visibility = window.IntersectionObserver ? new IntersectionObserver(entries => { inView = entries[0].isIntersecting; reconcile(); }) : null;
    if (visibility) visibility.observe(canvas);
    host.addEventListener('pointermove', pointer, { passive: true }); host.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', reconcile); if (preference.addEventListener) preference.addEventListener('change', changePreference);
    else preference.addListener(changePreference);
    canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
    reconcile();
    return {
      get paused() { return paused || preference.matches; },
      get reducedMotion() { return preference.matches; },
      get available() { return available; },
      pause() { paused = true; reconcile(); announce(); },
      play() { paused = false; points = []; reconcile(); announce(); },
      replay() { if (preference.matches || disposed) return; elapsed = 0; waveTime = 0; points = []; paused = false; reconcile(); announce(); },
      destroy() {
        if (disposed) return; disposed = true; cancelAnimationFrame(raf);
        if (observer) observer.disconnect();
        else window.removeEventListener('resize', resize);
        if (visibility) visibility.disconnect(); host.removeEventListener('pointermove', pointer); host.removeEventListener('pointerleave', leave);
        document.removeEventListener('visibilitychange', reconcile); if (preference.removeEventListener) preference.removeEventListener('change', changePreference);
        else preference.removeListener(changePreference);
        canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
        if (resources && !lost) { gl.deleteBuffer(resources.buffer); gl.deleteTexture(resources.texture); gl.deleteProgram(resources.program); }
      }
    };
  }
