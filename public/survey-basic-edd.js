// Basic EDD questionnaire ($250,000 – $1,000,000). No documents: only choices,
// country and month pickers, and one card per UBO. Countries are stored as ISO
// codes and months as numbers 1–12, so the answers do not depend on the language.
//
// The questions themselves are a "part" (see survey-edd-common.js), so the combined
// Basic + Advanced page can reuse them.
(function () {
  const SUPPLIER_ROWS = 3;

  window.EDD_PARTS.basic = function (form) {
    const t = window.EDD.t;
    const lang = window.EDD.lang;
    const retranslate = window.EDD.retranslate;
    function countryName(code) { return window.COUNTRIES.name(code, lang()); }
    function fold(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

    // Everything that shows a country or month name re-renders on a language switch.
    const relabelers = [];
    document.addEventListener('i18n:change', function () { relabelers.forEach(function (fn) { fn(); }); });

    // --- Country picker: search box, chips of the selected countries, filtered checkbox list.
    function makeCountryPicker(el) {
      const exclude = (el.dataset.exclude || '').split(',').filter(Boolean);
      const selected = [];
      el.innerHTML =
        '<input type="search" class="q-input country-search" autocomplete="off" data-i18n-ph="bedd.country.search">' +
        '<div class="country-chips"></div>' +
        '<div class="country-list" role="group"></div>';
      const search = el.querySelector('.country-search');
      const chips = el.querySelector('.country-chips');
      const list = el.querySelector('.country-list');
      retranslate(el);

      function renderChips() {
        chips.innerHTML = '';
        selected.forEach(function (code) {
          const chip = document.createElement('span');
          chip.className = 'country-chip';
          chip.textContent = countryName(code);
          const x = document.createElement('button');
          x.type = 'button';
          x.setAttribute('aria-label', t('btn.remove'));
          x.textContent = '×';
          x.addEventListener('click', function () { toggle(code, false); });
          chip.appendChild(x);
          chips.appendChild(chip);
        });
      }
      function renderList() {
        list.innerHTML = '';
        window.COUNTRIES.sorted(lang()).forEach(function (code) {
          if (exclude.indexOf(code) >= 0) return;
          const label = document.createElement('label');
          label.dataset.code = code;
          label.dataset.search = fold(countryName(code) + ' ' + window.COUNTRIES.name(code, 'en'));
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = code;
          cb.checked = selected.indexOf(code) >= 0;
          cb.addEventListener('change', function () { toggle(code, cb.checked); });
          const span = document.createElement('span');
          span.textContent = countryName(code);
          label.appendChild(cb);
          label.appendChild(span);
          list.appendChild(label);
        });
        filter();
      }
      function filter() {
        const q = fold(search.value.trim());
        Array.prototype.forEach.call(list.children, function (label) {
          label.hidden = q && label.dataset.search.indexOf(q) < 0;
        });
      }
      function toggle(code, on) {
        const i = selected.indexOf(code);
        if (on && i < 0) selected.push(code);
        if (!on && i >= 0) selected.splice(i, 1);
        const cb = list.querySelector('label[data-code="' + code + '"] input');
        if (cb) cb.checked = on;
        renderChips();
      }
      search.addEventListener('input', filter);
      // Enter in the search box would submit the form; pick the single match instead.
      search.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const visible = Array.prototype.filter.call(list.children, function (l) { return !l.hidden; });
        if (visible.length === 1) { toggle(visible[0].dataset.code, true); search.value = ''; filter(); }
      });
      relabelers.push(function () { renderList(); renderChips(); });
      renderList();

      return {
        values: function () { return selected.slice(); },
        clear: function () { selected.length = 0; search.value = ''; renderList(); renderChips(); },
      };
    }

    // Shows `wrap` when the radio group `name` has one of `showValues` selected.
    function bindReveal(name, wrap, showWhen, onHide) {
      function update() {
        const sel = form.querySelector('input[name="' + name + '"]:checked');
        const show = !!sel && showWhen(sel.value);
        wrap.hidden = !show;
        if (!show && onHide) onHide();
      }
      form.querySelectorAll('input[name="' + name + '"]').forEach(function (r) { r.addEventListener('change', update); });
      update();
    }

    // --- Q5: each selected channel reveals its own detail field
    form.querySelectorAll('input[name="channel"]').forEach(function (cb) {
      const detail = form.querySelector('[data-detail-for="' + cb.value + '"]');
      cb.addEventListener('change', function () {
        detail.hidden = !cb.checked;
        if (!cb.checked) detail.querySelector('input').value = '';
      });
    });

    // --- Q6: "Other" customer type needs a description
    const customerOther = document.getElementById('customer-other');
    const customerOtherWrap = document.getElementById('customer-other-wrap');
    customerOther.addEventListener('change', function () {
      customerOtherWrap.hidden = !customerOther.checked;
      if (!customerOther.checked) document.getElementById('customer-other-text').value = '';
    });

    // --- Q7: supplier rows (name + country, Mexico first). Three by default;
    // the respondent can remove down to one and add back up to three.
    const supplierBox = document.getElementById('suppliers');
    const addSupplierBtn = document.getElementById('add-supplier');
    function renumberSuppliers() {
      const rows = supplierBox.querySelectorAll('.supplier-row');
      rows.forEach(function (r, i) {
        r.querySelector('.supplier-num').textContent = (i + 1) + '.';
        r.querySelector('.supplier-remove').hidden = rows.length === 1;
      });
      addSupplierBtn.hidden = rows.length >= SUPPLIER_ROWS;
    }
    function addSupplier() {
      const rowEl = document.createElement('div');
      rowEl.className = 'supplier-row';
      rowEl.innerHTML =
        '<span class="supplier-num"></span>' +
        '<input type="text" class="q-input" data-supplier-name data-i18n-ph="bedd.suppliers.name">' +
        '<select class="q-input" data-supplier-country></select>' +
        '<button type="button" class="supplier-remove">×</button>';
      rowEl.querySelector('.supplier-remove').addEventListener('click', function () {
        rowEl.remove();
        renumberSuppliers();
      });
      supplierBox.appendChild(rowEl);
      retranslate(rowEl);
      labelSupplierRemove(rowEl);
      fillSupplierCountries(rowEl.querySelector('select'));
      renumberSuppliers();
      return rowEl;
    }
    function labelSupplierRemove(scope) {
      scope.querySelectorAll('.supplier-remove').forEach(function (b) {
        b.setAttribute('aria-label', t('btn.remove'));
        b.title = t('btn.remove');
      });
    }
    addSupplierBtn.addEventListener('click', function () {
      addSupplier().querySelector('[data-supplier-name]').focus();
    });
    function fillSupplierCountries(sel) {
      const current = sel.value;
      sel.innerHTML = '';
      sel.appendChild(new Option(t('bedd.suppliers.country'), ''));
      sel.appendChild(new Option(countryName('MX'), 'MX'));
      window.COUNTRIES.sorted(lang()).forEach(function (code) {
        if (code !== 'MX') sel.appendChild(new Option(countryName(code), code));
      });
      sel.value = current;
    }
    relabelers.push(function () {
      supplierBox.querySelectorAll('select[data-supplier-country]').forEach(fillSupplierCountries);
      labelSupplierRemove(supplierBox);
    });
    for (let i = 0; i < SUPPLIER_ROWS; i++) addSupplier();

    // --- Q8 / Q9: country pickers behind a "yes"
    const wirePicker = makeCountryPicker(document.getElementById('wire-countries'));
    bindReveal('wires', document.getElementById('wire-countries-wrap'), function (v) { return v !== 'No'; }, wirePicker.clear);
    const abroadPicker = makeCountryPicker(document.getElementById('abroad-countries'));
    bindReveal('abroad', document.getElementById('abroad-countries-wrap'), function (v) { return v === 'Yes'; }, abroadPicker.clear);

    // --- Q10: month grid behind a "yes"
    const monthsBox = document.getElementById('months');
    for (let m = 1; m <= 12; m++) {
      const label = document.createElement('label');
      label.innerHTML = '<input type="checkbox" name="month" value="' + m + '"><span></span>';
      monthsBox.appendChild(label);
    }
    function renderMonths() {
      const fmt = new Intl.DateTimeFormat(lang() === 'en' ? 'en' : 'es-MX', { month: 'long', timeZone: 'UTC' });
      monthsBox.querySelectorAll('label').forEach(function (label, i) {
        const n = fmt.format(new Date(Date.UTC(2024, i, 15)));
        label.querySelector('span').textContent = n.charAt(0).toUpperCase() + n.slice(1);
      });
    }
    relabelers.push(renderMonths);
    renderMonths();
    bindReveal('seasonal', document.getElementById('months-wrap'), function (v) { return v === 'Yes'; }, function () {
      monthsBox.querySelectorAll('input').forEach(function (cb) { cb.checked = false; });
    });

    // --- Q11: UBO cards
    const EXPERIENCE = [
      ['Founded or actively managed a business carrying out the same activity', 'bedd.ubo.exp.1'],
      ['Held a technical, professional or operational role in a business carrying out the same activity', 'bedd.ubo.exp.2'],
      ['Managed sales, purchasing, distribution or customer relationships in this market', 'bedd.ubo.exp.3'],
      ['Worked in a related part of the industry or provided professional services to businesses in this sector', 'bedd.ubo.exp.4'],
      ['Invested in businesses in this sector without participating in their management or operations', 'bedd.ubo.exp.5'],
      ['Has relevant education or training, but no practical experience in this activity or market', 'bedd.ubo.exp.6'],
      ['Has no relevant experience, education or training in this activity or market', 'bedd.ubo.exp.7'],
    ];
    const EXPERIENCE_NONE = EXPERIENCE[6][0];
    const FUNCTIONS = [
      ['Sets business strategy or makes major decisions, such as approving budgets or appointing senior management', 'bedd.ubo.fn.1'],
      ['Manages day-to-day business operations', 'bedd.ubo.fn.2'],
      ['Selects or negotiates with customers, suppliers or business partners', 'bedd.ubo.fn.3'],
      ["Personally performs or supervises the technical or professional activities needed to deliver the company's products or services", 'bedd.ubo.fn.4'],
      ['Decides how company funds are used or approves significant payments', 'bedd.ubo.fn.5'],
      ['Holds an ownership or investment interest without participating in business decisions or operations', 'bedd.ubo.fn.6'],
      ['Other', 'bedd.ubo.fn.7'],
    ];

    const uboList = document.getElementById('ubo-list');
    let uboSeq = 0;
    function renumberUbos() {
      const cards = uboList.querySelectorAll('.entity-card');
      cards.forEach(function (card, i) {
        card.querySelector('[data-ubo-num]').textContent = 'UBO #' + (i + 1);
        card.querySelector('.btn-remove-card').hidden = cards.length === 1;
      });
    }
    function addUbo() {
      const id = 'ubo' + (++uboSeq);
      const card = document.createElement('div');
      card.className = 'entity-card entity-card-ubo-high';
      const boxes = function (list, field) {
        return list.map(function (o) {
          return '<label><input type="checkbox" name="' + id + '_' + field + '" value="' + o[0] + '"><span class="option-label" data-i18n="' + o[1] + '"></span></label>';
        }).join('');
      };
      card.innerHTML =
        '<div class="entity-card-header"><h4 data-ubo-num></h4><button type="button" class="btn-remove-card" data-i18n="btn.remove"></button></div>' +
        '<div class="fields">' +
        '<label><span data-i18n="field.uboName"></span> <input type="text" data-ubo-name></label>' +
        '<p class="ubo-subheading" data-i18n="bedd.ubo.exp.title"></p>' +
        '<div class="options options-checkbox">' + boxes(EXPERIENCE, 'exp') + '</div>' +
        '<p class="ubo-subheading" data-i18n="bedd.ubo.fn.title"></p>' +
        '<div class="options options-checkbox">' + boxes(FUNCTIONS, 'fn') + '</div>' +
        '<div class="conditional-field" data-fn-other hidden><input type="text" class="q-input" data-i18n-ph="bedd.ubo.fn.other.ph"></div>' +
        '</div>';
      uboList.appendChild(card);
      retranslate(card);

      // "No relevant experience" excludes every other experience answer, and vice versa.
      card.querySelectorAll('input[name="' + id + '_exp"]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          if (!cb.checked) return;
          card.querySelectorAll('input[name="' + id + '_exp"]').forEach(function (other) {
            if (other !== cb && (cb.value === EXPERIENCE_NONE || other.value === EXPERIENCE_NONE)) other.checked = false;
          });
        });
      });
      const fnOther = card.querySelector('input[name="' + id + '_fn"][value="Other"]');
      const fnOtherWrap = card.querySelector('[data-fn-other]');
      fnOther.addEventListener('change', function () {
        fnOtherWrap.hidden = !fnOther.checked;
        if (!fnOther.checked) fnOtherWrap.querySelector('input').value = '';
      });
      card.querySelector('.btn-remove-card').addEventListener('click', function () { card.remove(); renumberUbos(); });
      renumberUbos();
    }
    document.getElementById('add-ubo').addEventListener('click', addUbo);
    addUbo();

    // --- Collect + validate
    function val(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }
    function radio(name) {
      const el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }
    function checked(name, root) {
      return Array.prototype.map.call((root || form).querySelectorAll('input[name="' + name + '"]:checked'), function (cb) { return cb.value; });
    }
    // "1,500.50" / "1500" -> "1500.50" / "1500"; anything else -> null
    function parseAmount(s) {
      const clean = String(s).replace(/[\s,$]/g, '');
      return /^\d+(\.\d{1,2})?$/.test(clean) && Number(clean) > 0 ? clean : null;
    }

    function collect() {
      const channels = checked('channel').map(function (c) {
        return { channel: c, detail: form.querySelector('[data-detail-for="' + c + '"] input').value.trim() };
      });
      const suppliers = Array.prototype.map.call(supplierBox.querySelectorAll('.supplier-row'), function (r) {
        return { name: r.querySelector('[data-supplier-name]').value.trim(), country: r.querySelector('[data-supplier-country]').value };
      }).filter(function (s) { return s.name || s.country; });
      const ubos = Array.prototype.map.call(uboList.querySelectorAll('.entity-card'), function (card) {
        const nameOf = card.querySelector('input[type="checkbox"]').name.replace(/_exp$/, '');
        return {
          fullName: card.querySelector('[data-ubo-name]').value.trim(),
          experience: checked(nameOf + '_exp', card),
          functions: checked(nameOf + '_fn', card),
          functionsOther: card.querySelector('[data-fn-other] input').value.trim(),
        };
      });
      const wires = radio('wires');
      const abroad = radio('abroad');
      const seasonal = radio('seasonal');
      return {
        cashShare: radio('cashShare'),
        averageTicket: parseAmount(val('averageTicket')),
        channels: channels,
        customers: { types: checked('customer'), other: val('customer-other-text') },
        suppliers: suppliers,
        wireTransfers: wires,
        wireCountries: wires && wires !== 'No' ? wirePicker.values() : [],
        operatesAbroad: abroad,
        abroadCountries: abroad === 'Yes' ? abroadPicker.values() : [],
        seasonal: seasonal,
        seasonalMonths: seasonal === 'Yes' ? checked('month').map(Number) : [],
        ubos: ubos,
      };
    }

    function validate() {
      const a = collect();
      const errors = [];
      if (!a.cashShare) errors.push(t('err.bedd.cash'));
      if (!a.averageTicket) errors.push(t('err.bedd.ticket'));
      if (!a.channels.length || a.channels.some(function (c) { return !c.detail; })) errors.push(t('err.bedd.channels'));
      if (!a.customers.types.length || (a.customers.types.indexOf('Other') >= 0 && !a.customers.other)) errors.push(t('err.bedd.customers'));
      if (!a.suppliers.length || a.suppliers.some(function (s) { return !s.name || !s.country; })) errors.push(t('err.bedd.suppliers'));
      if (!a.wireTransfers || (a.wireTransfers !== 'No' && !a.wireCountries.length)) errors.push(t('err.bedd.wires'));
      if (!a.operatesAbroad || (a.operatesAbroad === 'Yes' && !a.abroadCountries.length)) errors.push(t('err.bedd.abroad'));
      if (!a.seasonal || (a.seasonal === 'Yes' && !a.seasonalMonths.length)) errors.push(t('err.bedd.season'));
      const uboBad = a.ubos.some(function (u) {
        return !u.fullName || !u.experience.length || !u.functions.length || (u.functions.indexOf('Other') >= 0 && !u.functionsOther);
      });
      if (uboBad) errors.push(t('err.bedd.ubo'));
      return errors;
    }

    return { validate: validate, collect: collect };
  };

  const form = document.getElementById('survey-form');
  if (form && form.dataset.surveyType === 'basic_edd') {
    window.EDD.run(form, 'basic_edd', [window.EDD_PARTS.basic(form)], { oathErr: 'err.bedd.oath', pepErr: 'err.bedd.pep' });
  }
})();
