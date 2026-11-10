// Combined Basic + Advanced EDD questionnaire: Basic questions keep their numbers
// (1–11); the Advanced document questions follow as 12–15 and the declarations
// become 16–17, so error messages from those parts are renumbered to match.
(function () {
  const form = document.getElementById('survey-form');
  if (!form || form.dataset.surveyType !== 'full_edd') return;

  const ADVANCED_QMAP = { '3': '12', '4': '13', '4.1': '13.1', '5': '14', '6': '15' };
  const DECLARATION_QMAP = { '12': '16', '13': '17' };

  window.EDD.run(form, 'full_edd', [
    window.EDD_PARTS.basic(form),
    window.EDD_PARTS.advanced(form, { qmap: ADVANCED_QMAP }),
  ], { oathErr: 'err.bedd.oath', pepErr: 'err.bedd.pep', declMap: DECLARATION_QMAP });
})();
