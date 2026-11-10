// Advanced EDD questionnaire ($1,000,000 – $10,000,000). Every document question
// accepts several files: they accumulate across picks (so a client can add photos
// one at a time) and each can be removed before submitting.
//
// The questions themselves are a "part" (see survey-edd-common.js), so the combined
// Basic + Advanced page can reuse them; opts.qmap renumbers the error messages there.
(function () {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;   // per file — the server enforces the same cap
  const MAX_TOTAL_SIZE = 35 * 1024 * 1024;  // whole submission, after photo compression
  // Photos are re-encoded before upload, so a large phone original is fine at pick
  // time; the 10 MB cap is enforced on the compressed result instead.
  const MAX_PHOTO_INTAKE = 40 * 1024 * 1024;
  const MIN_PHOTOS = 3;

  window.EDD_PARTS.advanced = function (form, opts) {
    const qmap = (opts && opts.qmap) || null;
    const t = window.EDD.t;
    const retranslate = window.EDD.retranslate;
    function te(key) { return window.EDD.renumber(t(key), qmap); }

    // --- Multi-file buckets
    function makeBucket(wrapId, maxFiles) {
      const wrapEl = document.getElementById(wrapId);
      const input = wrapEl.querySelector('input[type="file"]');
      const listEl = wrapEl.querySelector('[data-file-list]');
      const errEl = wrapEl.querySelector('[data-file-error]');
      const bucket = { files: [], isImages: wrapEl.dataset.images === '1' };

      function render() {
        listEl.innerHTML = '';
        bucket.files.forEach(function (f, idx) {
          const li = document.createElement('li');
          const name = document.createElement('span');
          name.className = 'file-list-name';
          name.textContent = f.name;
          const rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'file-list-remove';
          rm.setAttribute('data-i18n', 'btn.removeFile');
          rm.addEventListener('click', function () { bucket.files.splice(idx, 1); errEl.textContent = ''; render(); });
          li.appendChild(name);
          li.appendChild(rm);
          listEl.appendChild(li);
        });
        retranslate(listEl);
        wrapEl.classList.toggle('has-file', bucket.files.length > 0);
      }

      input.addEventListener('change', function () {
        errEl.textContent = '';
        const intakeCap = bucket.isImages ? MAX_PHOTO_INTAKE : MAX_FILE_SIZE;
        Array.prototype.forEach.call(input.files || [], function (f) {
          if (f.size > intakeCap) { errEl.textContent = t('file.tooBig'); return; }
          if (bucket.files.length >= maxFiles) { errEl.textContent = t('file.tooMany'); return; }
          const dup = bucket.files.some(function (g) { return g.name === f.name && g.size === f.size && g.lastModified === f.lastModified; });
          if (!dup) bucket.files.push(f);
        });
        input.value = ''; // so picking the same file again (after removing it) still fires
        render();
      });

      bucket.clear = function () { bucket.files = []; errEl.textContent = ''; render(); };
      return bucket;
    }

    const buckets = {
      licenses: makeBucket('licenses-wrap', 10),
      padron: makeBucket('padron-wrap', 10),
      vaNotices: makeBucket('notices-wrap', 10),
      taxReturn: makeBucket('tax-wrap', 10),
      photos: makeBucket('photos-wrap', 15),
    };

    // --- Q3: "no license required" hides the description + uploads
    const licensesNone = document.getElementById('licenses-none');
    const licensesDetails = document.getElementById('licenses-details');
    function updateLicenses() {
      licensesDetails.hidden = licensesNone.checked;
      if (licensesNone.checked) {
        document.getElementById('licenses-text').value = '';
        buckets.licenses.clear();
      }
    }
    licensesNone.addEventListener('change', updateLicenses);
    updateLicenses();

    // --- Q4: "no Padrón registration required" swaps the upload for an explanation
    // and hides Q4.1 — notices only exist for companies registered in the Padrón.
    const padronNone = document.getElementById('padron-none');
    const padronWrap = document.getElementById('padron-wrap');
    const padronWhyWrap = document.getElementById('padron-why-wrap');
    const noticesBlock = document.getElementById('block-notices');
    function updatePadron() {
      const none = padronNone.checked;
      padronWrap.hidden = none;
      padronWhyWrap.hidden = !none;
      noticesBlock.hidden = none;
      if (none) {
        buckets.padron.clear();
        buckets.vaNotices.clear();
      } else {
        document.getElementById('padron-why').value = '';
      }
    }
    padronNone.addEventListener('change', updatePadron);
    updatePadron();

    // --- Photo compression: phone photos are several MB each; re-encode to a
    // 2000px JPEG. createImageBitmap decodes the Blob directly, so no blob: URL is
    // needed (the CSP only allows 'self' and data: images). Anything that cannot be
    // decoded here (e.g. HEIC outside Safari) is sent as-is.
    function compressImage(file) {
      if (typeof createImageBitmap !== 'function' || !/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        return Promise.resolve(file);
      }
      return createImageBitmap(file).then(function (bmp) {
        const MAX = 2000;
        const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
        const c = document.createElement('canvas');
        c.width = Math.round(bmp.width * scale);
        c.height = Math.round(bmp.height * scale);
        const cx = c.getContext('2d');
        cx.fillStyle = '#fff'; // PNG transparency -> white, JPEG has no alpha
        cx.fillRect(0, 0, c.width, c.height);
        cx.drawImage(bmp, 0, 0, c.width, c.height);
        return new Promise(function (resolve) {
          c.toBlob(function (blob) {
            if (!blob || blob.size >= file.size) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.85);
        });
      }).catch(function () { return file; });
    }

    function readFileAsBase64(file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          const dataUrl = reader.result;
          const base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
          resolve({ fileName: file.name, fileBase64: base64, mimeType: file.type || 'application/octet-stream' });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function val(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    function validate() {
      const errors = [];
      if (!licensesNone.checked && (!val('licenses-text') || !buckets.licenses.files.length)) {
        errors.push(te('err.edd.licenses'));
      }
      if (padronNone.checked) {
        if (!val('padron-why')) errors.push(te('err.edd.padronWhy'));
      } else {
        if (!buckets.padron.files.length) errors.push(te('err.edd.padron'));
        if (!buckets.vaNotices.files.length) errors.push(te('err.edd.notices'));
      }
      if (!buckets.taxReturn.files.length) errors.push(te('err.edd.tax'));
      if (buckets.photos.files.length < MIN_PHOTOS) errors.push(te('err.edd.photos'));
      return errors;
    }

    // Compresses photos, checks the sizes, then reads every file as base64.
    function collect() {
      const keys = Object.keys(buckets);
      // Compress photos first, then check the total before reading anything into memory.
      return Promise.all(keys.map(function (k) {
        const b = buckets[k];
        return Promise.all(b.files.map(function (f) { return b.isImages ? compressImage(f) : Promise.resolve(f); }));
      })).then(function (prepared) {
        const oversized = prepared.some(function (list) { return list.some(function (f) { return f.size > MAX_FILE_SIZE; }); });
        if (oversized) {
          const err = new Error('file too big');
          err.userMessage = te('err.edd.photoBig');
          throw err;
        }
        const total = prepared.reduce(function (sum, list) {
          return sum + list.reduce(function (s, f) { return s + f.size; }, 0);
        }, 0);
        if (total > MAX_TOTAL_SIZE) {
          const err = new Error('too big');
          err.userMessage = t('err.edd.total');
          throw err;
        }
        // Read every group in its original order so the payload is deterministic.
        return Promise.all(prepared.map(function (list) { return Promise.all(list.map(readFileAsBase64)); }));
      }).then(function (read) {
        const files = {};
        keys.forEach(function (k, i) { files[k] = read[i]; });
        const padronNotRequired = padronNone.checked;
        return {
          licenses: { notRequired: licensesNone.checked, description: val('licenses-text'), files: files.licenses },
          padron: { notRequired: padronNotRequired, explanation: val('padron-why'), files: files.padron },
          vaNotices: padronNotRequired ? null : { files: files.vaNotices },
          taxReturn: { files: files.taxReturn },
          photos: { files: files.photos },
        };
      });
    }

    return { validate: validate, collect: collect };
  };

  const form = document.getElementById('survey-form');
  if (form && form.dataset.surveyType === 'advanced_edd') {
    window.EDD.run(form, 'advanced_edd', [window.EDD_PARTS.advanced(form)], { oathErr: 'err.edd.oath', pepErr: 'err.edd.pep' });
  }
})();
