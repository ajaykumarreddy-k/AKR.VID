/* ArtKit shared engine — vanilla JS, no build step, no dependencies.
   Every tool page includes this file and calls ArtKit.createTool(...). */

(function (global) {
  'use strict';

  class ArtKitTool {
    /**
     * @param {Object} opts
     * @param {string} opts.canvasId   - id of the <canvas> used for output
     * @param {function} opts.onRender - (ctx, srcCanvas, w, h, params) => void
     * @param {Object}  [opts.params]  - initial parameter values, mutated by sliders
     */
    constructor(opts) {
      this.canvas = document.getElementById(opts.canvasId);
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      this.onRender = opts.onRender;
      this.params = opts.params || {};

      // Offscreen canvas always holds the *current raw frame* (image or video frame)
      this.srcCanvas = document.createElement('canvas');
      this.srcCtx = this.srcCanvas.getContext('2d', { willReadFrequently: true });

      this.source = null;     // HTMLImageElement | HTMLVideoElement
      this.isVideo = false;
      this._raf = null;
      this._hasFrame = false;

      // Auto-load default video so tools are immediately interactive
      setTimeout(() => {
        if (!this.source) {
           this.loadUrl('../tonekit.webm', true);
        }
      }, 300);
    }

    /** Wire up a <input type="file"> and an optional drop-target element. */
    bindUpload(inputEl, dropEl) {
      const handle = (file) => file && this.loadFile(file);
      inputEl.addEventListener('change', (e) => handle(e.target.files[0]));
      if (dropEl) {
        ['dragenter', 'dragover'].forEach((ev) =>
          dropEl.addEventListener(ev, (e) => {
            e.preventDefault();
            dropEl.classList.add('dragging');
          })
        );
        ['dragleave', 'drop'].forEach((ev) =>
          dropEl.addEventListener(ev, (e) => {
            e.preventDefault();
            dropEl.classList.remove('dragging');
          })
        );
        dropEl.addEventListener('drop', (e) => handle(e.dataTransfer.files[0]));
      }
    }

    /** Open the user's webcam as a live source. */
    async openCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      this.isVideo = true;
      this.setSource(video);
      this.startLoop();
    }

    loadFile(file) {
      const url = URL.createObjectURL(file);
      this.loadUrl(url, file.type.startsWith('video/'));
    }

    loadUrl(url, isVideo = true) {
      if (isVideo) {
        this.isVideo = true;
        const video = document.createElement('video');
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.addEventListener('loadedmetadata', () => {
          this.setSource(video);
          video.play();
          this.startLoop();
          const stage = document.getElementById('stage');
          if (stage) stage.classList.add('has-source');
          const btnExportWebm = document.getElementById('btnExportWebm');
          if (btnExportWebm) btnExportWebm.classList.remove('hidden');
        });
      } else {
        this.isVideo = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.setSource(img);
          this.renderOnce();
          const stage = document.getElementById('stage');
          if (stage) stage.classList.add('has-source');
        };
        img.src = url;
      }
    }

    setSource(src) {
      this.stopLoop();
      this.source = src;
      const w = src.videoWidth || src.naturalWidth || src.width;
      const h = src.videoHeight || src.naturalHeight || src.height;
      this.canvas.width = w;
      this.canvas.height = h;
      this.srcCanvas.width = w;
      this.srcCanvas.height = h;
      this._hasFrame = true;
    }

    startLoop() {
      this.stopLoop();
      const loop = () => {
        this.renderOnce();
        this._raf = requestAnimationFrame(loop);
      };
      loop();
    }

    stopLoop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
    }

    /** Draw current frame into srcCanvas, then hand off to the tool's effect fn. */
    renderOnce() {
      if (!this.source || !this._hasFrame) return;
      this.srcCtx.drawImage(this.source, 0, 0, this.srcCanvas.width, this.srcCanvas.height);
      this.onRender(this.ctx, this.srcCanvas, this.srcCanvas.width, this.srcCanvas.height, this.params);
    }

    /** Re-run the effect once (call after a slider changes on a still image). */
    refresh() {
      if (!this.isVideo) this.renderOnce();
    }

    exportPNG(filename) {
      const a = document.createElement('a');
      a.href = this.canvas.toDataURL('image/png');
      a.download = filename || 'artkit-export.png';
      a.click();
    }

    exportWebM(filename, durationMs) {
      if (!this.canvas.captureStream) {
        alert('Video export needs a recent Chrome/Edge/Firefox build.');
        return;
      }
      const stream = this.canvas.captureStream(60);
      
      let options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 16000000 };
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm', videoBitsPerSecond: 16000000 };
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename || 'artkit-export.webm';
        a.click();
      };
      
      const btn = document.getElementById('btnExportWebm');
      if (btn) {
        btn.dataset.origText = btn.textContent;
        btn.textContent = 'Exporting...';
        btn.disabled = true;
      }

      recorder.start(100); // use timeslice for reliable chunking
      setTimeout(() => {
        recorder.stop();
        if (btn) {
          btn.textContent = btn.dataset.origText;
          btn.disabled = false;
        }
      }, durationMs || 5000);
    }
  }

  /** Build a labeled <input type="range"> row inside `container` and wire it to params[key]. */
  function mountSlider(container, { key, label, min, max, step, value, params, onChange }) {
    const row = document.createElement('div');
    row.className = 'ctrl-row';
    const head = document.createElement('div');
    head.className = 'ctrl-head';
    const lbl = document.createElement('span');
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'ctrl-val';
    val.textContent = value;
    head.append(lbl, val);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    params[key] = Number(value);

    input.addEventListener('input', () => {
      const v = Number(input.value);
      params[key] = v;
      val.textContent = v;
      onChange && onChange(v);
    });

    row.append(head, input);
    container.appendChild(row);
    return input;
  }

  /** Build a row of selectable pill buttons; sets params[key] = option value. */
  function mountChoice(container, { key, label, options, value, params, onChange }) {
    const wrap = document.createElement('div');
    wrap.className = 'ctrl-row';
    const head = document.createElement('div');
    head.className = 'ctrl-head';
    head.innerHTML = `<span>${label}</span>`;
    const pills = document.createElement('div');
    pills.className = 'pill-group';

    params[key] = value;
    options.forEach((opt) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pill' + (opt === value ? ' active' : '');
      b.textContent = opt;
      b.addEventListener('click', () => {
        pills.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
        b.classList.add('active');
        params[key] = opt;
        onChange && onChange(opt);
      });
      pills.appendChild(b);
    });

    wrap.append(head, pills);
    container.appendChild(wrap);
  }

  /** Build a row of color swatches; sets params[key] = '#hex'. */
  function mountColorSwatches(container, { key, label, colors, value, params, onChange }) {
    const wrap = document.createElement('div');
    wrap.className = 'ctrl-row';
    const head = document.createElement('div');
    head.className = 'ctrl-head';
    head.innerHTML = `<span>${label}</span>`;
    const row = document.createElement('div');
    row.className = 'swatch-group';

    params[key] = value;
    colors.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (c === value ? ' active' : '');
      b.style.background = c;
      b.addEventListener('click', () => {
        row.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
        b.classList.add('active');
        params[key] = c;
        onChange && onChange(c);
      });
      row.appendChild(b);
    });

    wrap.append(head, row);
    container.appendChild(wrap);
  }

  global.ArtKit = { ArtKitTool, mountSlider, mountChoice, mountColorSwatches };
})(window);
