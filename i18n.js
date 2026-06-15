(function () {
  // Spanish (Mexico) is the default. English is the toggle alternative.
  // Stable keys are referenced from HTML via data-i18n / data-i18n-html / data-i18n-ph,
  // and from the survey JS when building dynamic cards. Radio/checkbox `value`
  // attributes stay canonical (English) — only visible labels are translated.
  var DICT = {
    es: {
      // App / shared
      'app.title.medium': 'Preguntas adicionales',
      'app.title.high': 'Preguntas adicionales',
      'btn.submit': 'Enviar',
      'btn.saving': 'Enviando…',
      'btn.remove': 'Eliminar',
      'opt.yes': 'Sí',
      'opt.no': 'No',
      'hint.selectOne': 'Seleccione una opción.',
      'hint.selectMany': 'Puede seleccionar varias opciones.',

      // Q1 — Legal representative
      'legalRep.title': '1. Nombre completo del representante legal',
      'legalRep.ph': 'Escriba el nombre completo',
      // Q2 — Company name
      'companyName.title': '2. Razón social',
      'companyName.ph': 'Escriba la razón social',
      // Q3 — Email
      'email.title': '3. Correo electrónico',
      'email.ph': 'nombre@ejemplo.com',

      // Q4 — Activities (internal q1)
      'q1.title': '4. ¿La empresa realiza actualmente alguna de las siguientes actividades?',
      'q1.opt.1': 'Juegos de azar, concursos o sorteos',
      'q1.opt.2': 'Prestación de servicios de construcción o desarrollo de bienes inmuebles, o intermediación en la transmisión de propiedad o constitución de derechos sobre dichos bienes',
      'q1.opt.3': 'Emisión o comercialización de cheques de viajero',
      'q1.opt.4': 'Subasta o comercialización habitual/profesional de obras de arte',
      'q1.opt.5': 'Servicios de blindaje',
      'q1.opt.6': 'Servicios profesionales independientes en los que actúa por cuenta de un cliente para realizar cualquiera de lo siguiente: (a) comprar/vender bienes inmuebles, (b) administrar dinero, activos o cuentas bancarias/de inversión del cliente, o (c) constituir, operar o reestructurar sociedades, fideicomisos u otras personas jurídicas (incluida la compra/venta de empresas)',
      'q1.opt.7': 'Recepción de donativos',
      'q1.opt.8': 'Constitución de derechos personales de uso o goce de bienes inmuebles',
      'q1.opt.9': 'Emisión o comercialización de tarjetas de crédito, tarjetas de servicios, tarjetas prepagadas o cualquier otro instrumento que constituya un almacenamiento de valor monetario',
      'q1.opt.10': 'Otorgamiento de préstamos o créditos, u operaciones de garantía',
      'q1.opt.11': 'Comercialización o intermediación habitual o profesional de metales preciosos, piedras preciosas, joyería o relojes',
      'q1.opt.12': 'Comercialización o distribución de vehículos, nuevos o usados',
      'q1.opt.13': 'Servicios de traslado o custodia de dinero o valores',
      'q1.opt.14': 'Servicios de fe pública (notarios o corredores públicos)',
      'q1.opt.15': 'Prestación de servicios de comercio exterior como agente o apoderado aduanal',
      'q1.opt.16': 'Intercambio de activos virtuales o criptomonedas',
      'q1.opt.17': 'Ninguna de las anteriores',

      // Q4.1 — How long (internal q1_1)
      'q1_1.title': '4.1. ¿Cuánto tiempo lleva la empresa realizando esta actividad?',
      'q1_1.opt.1': '0 – 5 años',
      'q1_1.opt.2': '5 – 10 años',
      'q1_1.opt.3': 'Más de 10 años',

      // Q5 — Jurisdictions (internal q2)
      'q2.title': '5. ¿La empresa opera o tiene relaciones directas con alguna de las siguientes jurisdicciones?',
      'q2.viewlist': 'Ver lista completa',

      // Q6 — Providers (internal q3)
      'q3.title': '6. ¿Quiénes son sus 3 principales proveedores por volumen?',
      'q3.hint': 'En el caso de una persona física, proporcione su nombre completo, RFC y CURP.<br>En el caso de empresas, proporcione su razón social y RFC. Agregue al menos un proveedor.',

      // Q7 — Client segment (internal q4)
      'q4.title': '7. ¿Qué segmento representa a los clientes que tiene?',
      'q4.opt.1': 'Mi clientela está formada por el consumidor general y no por personas físicas o morales específicas o identificables (por ejemplo, el negocio es un restaurante que atiende a una multitud de personas o una ferretería con múltiples clientes individuales).',
      'q4.opt.2': 'Mis principales clientes son personas físicas o empresas específicas e identificables (un negocio que opera principalmente bajo contratos u órdenes recurrentes con un número reducido de clientes conocidos, de modo que puede identificar a sus principales clientes por nombre/razón social y RFC, y esos clientes representan una parte significativa de sus ventas. Por ejemplo, una empresa de logística o transporte que opera rutas principalmente para embarcadores específicos bajo órdenes de servicio recurrentes).',
      'q4.opt.3': 'Todas las anteriores, con clientes identificables y el público en general como consumidores.',

      // Q7.1 — Main clients (internal q4_1)
      'q4_1.title': '7.1. ¿Quiénes son sus 3 principales clientes por volumen?',
      'q4_1.hint': 'En el caso de una persona física, proporcione su nombre completo, RFC y CURP.<br>En el caso de empresas, proporcione su razón social y RFC. Agregue al menos un cliente.',

      // Q8 — Business model (internal q5)
      'q5.title': '8. Explique su modelo de negocio.',
      'q5.ph': 'Escriba su respuesta...',

      // Q8.1 — Directors (high, internal q5_1)
      'q5_1.title': '8.1. Otros administradores o directores',
      'q5_1.hint': 'Proporcione el nombre completo, la fecha de nacimiento y el país de residencia de su director general o, en su caso, de al menos 2 miembros de su consejo de administración. Proporcione la identificación oficial de las personas mencionadas. Agregue al menos 1 director general y al menos 2 miembros del consejo.',

      // Q8.2 — Shareholders (high, internal q5_2)
      'q5_2.title': '8.2. Información de los accionistas',
      'q5_2.hint': 'De todos los accionistas de la empresa con acciones que representen directa o indirectamente el 10 % o más de su capital social, proporcione: nombre completo, CURP o número de identificación fiscal cuando no haya CURP, y RFC cuando esté disponible o, en su caso, número de identificación fiscal. Agregue al menos un accionista.',

      // Q9 — UBO (internal q6)
      'q6.medium.title': '9. Proporcione el comprobante de domicilio de todos los beneficiarios finales (UBO).',
      'q6.medium.hint': 'Agregue al menos un UBO. Puede cargar cualquier documento de hasta 10 MB.',
      'q6.high.title': '9. Proporcione la información de los beneficiarios finales (UBO).',
      'q6.high.hint': 'Agregue al menos un UBO. Puede cargar cualquier documento de hasta 10 MB.',
      'q6.amount.title': 'Monto aproximado aportado por el UBO para iniciar el negocio',
      'q6.amount.opt.1': 'Menos de $50,000.00 MXN (especificar).',
      'q6.amount.opt.2': 'Entre $50,001.00 y $100,000.00 MXN.',
      'q6.amount.opt.3': 'Entre $100,001.00 y $150,000.00 MXN.',
      'q6.amount.opt.4': 'Más de $150,000.00 (especificar)',
      'q6.amount.specify.ph': 'Texto o monto',
      'q6.howlong.title': '¿Cuánto tiempo lleva el UBO aportando a la empresa?',
      'q6.howlong.opt.1': 'Entre 1 mes y menos de un año.',
      'q6.howlong.opt.2': 'Entre 1 y 2 años.',
      'q6.howlong.opt.3': 'Entre 2 y 5 años.',
      'q6.howlong.opt.4': 'Más de 5 años (especificar)',
      'q6.howlong.specify': 'Especificar (p. ej. número de años)',
      'q6.source.title': '¿Cuál es el origen del patrimonio del UBO para proporcionar a la empresa fondos de crecimiento o inversión?',
      'q6.source.opt.1': 'Salario/bonos (empleo)',
      'q6.source.opt.2': 'Utilidades/dividendos de otra empresa',
      'q6.source.opt.3': 'Venta de un negocio / acciones',
      'q6.source.opt.4': 'Venta de bienes inmuebles u otro activo',
      'q6.source.opt.5': 'Herencia',
      'q6.source.opt.6': 'Rendimientos de inversión (valores/fondos/cripto/otros)',
      'q6.source.opt.7': 'Préstamo (bancario o de un tercero)',
      'q6.source.opt.8': 'Otro (especificar)',
      'q6.sourceProof.title': 'Comprobante del origen del patrimonio',
      'q6.proofAddress.title': 'Agregar comprobante de domicilio del UBO',
      'q6.declaration.text': 'Declaro que la información proporcionada es verdadera, exacta y completa a mi leal saber y entender, y que los fondos/recursos descritos son de origen lícito.',
      'q6.specify': 'Especificar',

      // Q10 / Q11 — Declarations (internal q7 / q8)
      'q7.title': '10. Declaro bajo protesta de decir verdad que la información de este formulario es verdadera y exacta, y que no he omitido ninguna información relevante que pudiera afectar este proceso.',
      'q8.title': '11. Declaro que no soy una persona políticamente expuesta (PEP), ni lo son los UBO, accionistas u otros representantes legales de la empresa, ni tenemos vínculos con funcionarios públicos o autoridades que pudieran interferir con la transparencia requerida para esta relación.',

      // Entity / field labels
      'btn.addIndividual': 'Agregar persona física',
      'btn.addCompany': 'Agregar persona moral',
      'btn.addDirector': 'Agregar director general',
      'btn.addBoard': 'Agregar miembro del consejo',
      'btn.addShareholder': 'Agregar accionista',
      'btn.addUbo': 'Agregar información del UBO',
      'entity.individual': 'Persona física',
      'entity.company': 'Persona moral',
      'entity.generalDirector': 'Director general',
      'entity.boardMember': 'Miembro del consejo',
      'entity.shareholder': 'Accionista',
      'entity.ubo': 'UBO',
      'field.fullName': 'Nombre completo',
      'field.rfc': 'RFC',
      'field.curp': 'CURP',
      'field.fullLegalName': 'Razón social',
      'field.dob': 'Fecha de nacimiento',
      'field.country': 'País de residencia',
      'field.officialIdTitle': 'Cargar identificación oficial',
      'field.officialId': 'Identificación oficial (documento, máx. 10 MB)',
      'field.curpIf': 'CURP (si está disponible)',
      'field.rfcIf': 'RFC (si está disponible)',
      'field.taxNumber': 'Número de identificación fiscal (si no hay CURP/RFC) (opcional)',
      'field.ownershipPct': 'Porcentaje de participación',
      'field.uboName': 'Nombre completo del UBO',
      'field.uboProof': 'Comprobante de domicilio del UBO (documento, máx. 10 MB)',
      'field.uboPosition': 'Cargo o título dentro de la empresa (si lo hay)',
      'field.uboExpertise': 'Describa la experiencia relevante del UBO (hasta 250 palabras): incluya información como años de experiencia, sectores/mercados, cargos ocupados, habilidades clave, educación/certificaciones, logros destacados y otra información relevante.',
      'field.uboRole': 'Describa el rol y las principales responsabilidades del UBO dentro de la empresa (hasta 250 palabras)',
      'field.uboDecisions': '¿Qué decisiones relacionadas con fondos/recursos aprueba o influye el UBO (uso, distribución, disposición, etc.)?',
      'field.docMax': 'Documento, máx. 10 MB',

      // Signature
      'sig.title': 'Agregue su firma',
      'sig.placeholder': 'Firme aquí',
      'sig.remove': 'Borrar firma',

      // File
      'file.tooBig': 'El archivo debe ser de 10 MB o menos.',

      // Validation
      'err.legalRep': 'Pregunta 1: escriba el nombre completo del representante legal.',
      'err.companyName': 'Pregunta 2: escriba el nombre de la empresa.',
      'err.email': 'Pregunta 3: escriba un correo electrónico válido.',
      'err.q1': 'Pregunta 4: seleccione al menos una opción.',
      'err.q1_1': 'Pregunta 4.1: seleccione una opción.',
      'err.q2': 'Pregunta 5: seleccione Sí o No.',
      'err.q3': 'Pregunta 6: agregue al menos un proveedor (persona física o moral).',
      'err.q4': 'Pregunta 7: seleccione una opción.',
      'err.q4_1': 'Pregunta 7.1: agregue al menos un cliente (persona física o moral).',
      'err.q5': 'Pregunta 8: explique su modelo de negocio.',
      'err.q5_1': 'Pregunta 8.1: agregue al menos 1 director general O al menos 2 miembros del consejo.',
      'err.q5_2': 'Pregunta 8.2: agregue al menos un accionista.',
      'err.q6': 'Pregunta 9: agregue al menos un UBO.',
      'err.q6.uboName': 'Pregunta 9: el nombre completo del UBO es obligatorio.',
      'err.q6.file': 'Pregunta 9: el comprobante de domicilio es obligatorio para cada UBO.',
      'err.q6.fileBig': 'Pregunta 9: uno de los archivos supera los 10 MB.',
      'err.q6.declaration': 'Pregunta 9: la declaración Sí/No es obligatoria para cada UBO.',
      'err.q7': 'Pregunta 10: seleccione Sí o No.',
      'err.q8': 'Pregunta 11: seleccione Sí o No.',
      'err.signature': 'Agregue su firma.',
      'err.network': 'No se pudo enviar. Verifique su conexión e inténtelo de nuevo.',

      // Success
      'success.title': '¡Gracias!',
      'success.message': 'Su información se ha enviado correctamente.'
    },

    en: {
      'app.title.medium': 'Additional questions',
      'app.title.high': 'Additional questions',
      'btn.submit': 'Submit',
      'btn.saving': 'Saving…',
      'btn.remove': 'Remove',
      'opt.yes': 'Yes',
      'opt.no': 'No',
      'hint.selectOne': 'Select one option.',
      'hint.selectMany': 'You may select multiple options.',

      'legalRep.title': '1. Full Name of Legal Representative',
      'legalRep.ph': 'Enter full name',
      'companyName.title': '2. Company name',
      'companyName.ph': 'Enter the company name',
      'email.title': '3. Email',
      'email.ph': 'name@example.com',

      'q1.title': '4. Is the company currently engaged in any of the following activities?',
      'q1.opt.1': 'Gambling, contests, or raffles',
      'q1.opt.2': 'Provision of construction services or development of real estate, or intermediation in the transfer of ownership or establishment of rights over such property',
      'q1.opt.3': "Issuance or commercialization of traveler's checks",
      'q1.opt.4': 'Auctioning or habitual/professional commercialization of works of art',
      'q1.opt.5': 'Armoring services',
      'q1.opt.6': "Independent professional services where you act on a client's behalf to do any of the following: (a) Buy/sell real estate, (b) Manage client money, assets, or bank/investment accounts, or (c) Set up, run, or restructure companies, trusts or other legal entities (including buying/selling companies)",
      'q1.opt.7': 'Receipt of donations',
      'q1.opt.8': 'Establishment of personal rights of use or enjoyment of real estate',
      'q1.opt.9': 'Issuance or commercialization of credit cards, service cards, prepaid cards, or any other instrument that constitutes a store of monetary value',
      'q1.opt.10': 'Granting of loans or credits, or guarantee operations',
      'q1.opt.11': 'Habitual or professional commercialization or intermediation of Precious Metals, Precious Stones, jewelry, or watches',
      'q1.opt.12': 'Commercialization or distribution of vehicles, new or used',
      'q1.opt.13': 'Services for the transport or custody of money or valuables',
      'q1.opt.14': 'Public faith services (notaries or public brokers)',
      'q1.opt.15': 'Provision of foreign trade services as a customs agent or representative',
      'q1.opt.16': 'Exchange of virtual assets or cryptocurrency',
      'q1.opt.17': 'None of the above',

      'q1_1.title': '4.1. How long has the company been engaged in this activity?',
      'q1_1.opt.1': '0 – 5 years',
      'q1_1.opt.2': '5 – 10 years',
      'q1_1.opt.3': 'More than 10 years',

      'q2.title': '5. Does the company operate in or have direct relationships with any of the following jurisdictions?',
      'q2.viewlist': 'View full list',

      'q3.title': '6. Who are your 3 main providers by volume?',
      'q3.hint': 'In case of an individual, please provide their full name, RFC and CURP.<br>In case of companies, please provide their full legal name and RFC. Add at least one provider.',

      'q4.title': '7. Which segment represents the clients you have?',
      'q4.opt.1': 'My clientele consists of the general consumer and not specific or identifiable individuals or corporations (i.e. the business is a restaurant that serves a multitude of people or a hardware store with multiple individual clients).',
      'q4.opt.2': 'My main clients are specific and identifiable individuals or companies (a business that works mainly under contracts or recurring orders with a small number of known customers, such that it can identify its main clients by name/corporate name and RFC, and those clients represent a significant share of its sales. For example, a logistics or transport company that operates routes mainly for specific shippers under recurring service orders).',
      'q4.opt.3': 'All of the above, with both identifiable clients and the general public as consumers.',

      'q4_1.title': '7.1. Who are your 3 main clients by volume?',
      'q4_1.hint': 'In case of an individual, please provide their full name, RFC and CURP.<br>In case of companies, please provide their corporate name and RFC. Add at least one client.',

      'q5.title': '8. Please explain your business model.',
      'q5.ph': 'Enter your answer...',

      'q5_1.title': '8.1. Other Administrators or Directors',
      'q5_1.hint': 'Please provide the full name, date of birth and country of residence of your general director or, given the case, of at least 2 members of your board of directors. Please provide the official ID of the above mentioned people. Add at least 1 general director and at least 2 members of the board.',

      'q5_2.title': '8.2. Information from shareholders',
      'q5_2.hint': 'From all of the company\'s shareholders with shares representing directly or indirectly 10% or more of its capital stock, please provide: full name, CURP or tax identification number when CURP is not available and RFC when available or, given the case, tax identification number. Add at least one shareholder.',

      'q6.medium.title': "9. Please provide all of the UBO's proof of address.",
      'q6.medium.hint': 'Add at least one UBO. You may upload any document up to 10 MB.',
      'q6.high.title': "9. Please provide information of the UBO's.",
      'q6.high.hint': 'Add at least one UBO. You may upload any document up to 10 MB.',
      'q6.amount.title': 'Approximate amount contributed by the UBO to start the business',
      'q6.amount.opt.1': 'Less than $50,000.00 MXN (specify).',
      'q6.amount.opt.2': 'Between $50,001.00 - $100,000.00 MXN.',
      'q6.amount.opt.3': 'Between $100,001.00 - $150,000.00 MXN.',
      'q6.amount.opt.4': 'More than $150,000.00 (specify)',
      'q6.amount.specify.ph': 'Text or amount',
      'q6.howlong.title': 'How long has the UBO contributed to the company?',
      'q6.howlong.opt.1': 'Between 1 month and less than a year.',
      'q6.howlong.opt.2': 'Between 1 and 2 years.',
      'q6.howlong.opt.3': 'Between 2 and 5 years.',
      'q6.howlong.opt.4': 'More than 5 years (specify)',
      'q6.howlong.specify': 'Specify (e.g. number of years)',
      'q6.source.title': "What is the source of the UBO's wealth to provide the company with growth funds or investment?",
      'q6.source.opt.1': 'Salary/bonuses (employment)',
      'q6.source.opt.2': 'Business profits/dividends from another company',
      'q6.source.opt.3': 'Sale of a business / shares',
      'q6.source.opt.4': 'Sale of real estate or other asset',
      'q6.source.opt.5': 'Inheritance',
      'q6.source.opt.6': 'Investment returns (securities/funds/crypto/other)',
      'q6.source.opt.7': 'Loan (bank or third party)',
      'q6.source.opt.8': 'Other (specify)',
      'q6.sourceProof.title': 'Proof of Source of Wealth',
      'q6.proofAddress.title': 'Add UBO Proof of address',
      'q6.declaration.text': 'I declare that the information provided is true, accurate, and complete to the best of my knowledge, and that the funds/resources described are of lawful origin.',
      'q6.specify': 'Specify',

      'q7.title': '10. I declare under oath that the information in this form is true and accurate, and that I have not omitted any relevant information that could affect this process.',
      'q8.title': "11. I declare that I am not a politically exposed person (PEP), nor the company's UBOs, shareholders or other legal representatives, nor do we have ties with public officials or authorities that could interfere with the transparency required for this relationship.",

      'btn.addIndividual': 'Add individual',
      'btn.addCompany': 'Add company',
      'btn.addDirector': 'Add general director',
      'btn.addBoard': 'Add member of board',
      'btn.addShareholder': 'Add shareholder',
      'btn.addUbo': 'Add Information about UBO',
      'entity.individual': 'Individual',
      'entity.company': 'Company',
      'entity.generalDirector': 'General director',
      'entity.boardMember': 'Member of board',
      'entity.shareholder': 'Shareholder',
      'entity.ubo': 'UBO',
      'field.fullName': 'Full name',
      'field.rfc': 'RFC',
      'field.curp': 'CURP',
      'field.fullLegalName': 'Full legal name',
      'field.dob': 'Date of birth',
      'field.country': 'Country of residence',
      'field.officialIdTitle': 'Upload Official ID',
      'field.officialId': 'Official ID (document, max 10 MB)',
      'field.curpIf': 'CURP (if available)',
      'field.rfcIf': 'RFC (if available)',
      'field.taxNumber': 'Tax number (if no CURP/RFC) (optional)',
      'field.ownershipPct': 'Ownership percentage',
      'field.uboName': 'UBO Full Name',
      'field.uboProof': 'UBO proof of address (document, max 10 MB)',
      'field.uboPosition': 'Position or title within the company (if any)',
      'field.uboExpertise': "Please describe the UBO's relevant expertise (up to 250 words): Include information such as years of experience, sectors/markets, roles held, key skills, education/certifications, notable achievements, and other relevant information.",
      'field.uboRole': "Describe the UBO's role and main responsibilities within the company (up to 250 words)",
      'field.uboDecisions': 'What decisions related to funds/resources does the UBO approve or influence (use, distribution, disposal, etc.)',
      'field.docMax': 'Document, max 10 MB',

      'sig.title': 'Add your signature',
      'sig.placeholder': 'Sign here',
      'sig.remove': 'Remove signature',

      'file.tooBig': 'File must be 10 MB or smaller.',

      'err.legalRep': "Question 1: enter the legal representative's full name.",
      'err.companyName': 'Question 2: enter the company name.',
      'err.email': 'Question 3: enter a valid email.',
      'err.q1': 'Question 4: select at least one option.',
      'err.q1_1': 'Question 4.1: select one option.',
      'err.q2': 'Question 5: select Yes or No.',
      'err.q3': 'Question 6: add at least one provider (individual or company).',
      'err.q4': 'Question 7: select one option.',
      'err.q4_1': 'Question 7.1: add at least one client (individual or company).',
      'err.q5': 'Question 8: please explain your business model.',
      'err.q5_1': 'Question 8.1: add at least 1 general director OR at least 2 members of the board.',
      'err.q5_2': 'Question 8.2: add at least one shareholder.',
      'err.q6': 'Question 9: add at least one UBO.',
      'err.q6.uboName': 'Question 9: UBO Full Name is required.',
      'err.q6.file': 'Question 9: proof of address file is required for each UBO.',
      'err.q6.fileBig': 'Question 9: one of the files exceeds 10 MB.',
      'err.q6.declaration': 'Question 9: declaration Yes/No is required for each UBO.',
      'err.q7': 'Question 10: select Yes or No.',
      'err.q8': 'Question 11: select Yes or No.',
      'err.signature': 'Please add your signature.',
      'err.network': 'Could not submit. Check your connection and try again.',

      'success.title': 'Thank you!',
      'success.message': 'Your information has been submitted successfully.'
    }
  };

  var LANG_KEY = 'surveyLang';

  function getLang() {
    try {
      var l = localStorage.getItem(LANG_KEY);
      return (l === 'en' || l === 'es') ? l : 'es';
    } catch (e) {
      return 'es';
    }
  }

  function t(key, lang) {
    lang = lang || getLang();
    var d = DICT[lang] || DICT.es;
    if (d[key] != null) return d[key];
    if (DICT.es[key] != null) return DICT.es[key];
    return key;
  }

  function applyTranslations(root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    var htmlNodes = root.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlNodes.length; j++) htmlNodes[j].innerHTML = t(htmlNodes[j].getAttribute('data-i18n-html'));
    var phNodes = root.querySelectorAll('[data-i18n-ph]');
    for (var k = 0; k < phNodes.length; k++) phNodes[k].setAttribute('placeholder', t(phNodes[k].getAttribute('data-i18n-ph')));
  }

  function updateToggleActive() {
    var lang = getLang();
    var btns = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-lang') === lang) btns[i].classList.add('active');
      else btns[i].classList.remove('active');
    }
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'es') lang = 'es';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    applyTranslations(document);
    updateToggleActive();
  }

  function init() {
    document.documentElement.lang = getLang();
    applyTranslations(document);
    var btns = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang')); });
      })(btns[i]);
    }
    updateToggleActive();
  }

  window.I18N = { t: t, applyTranslations: applyTranslations, setLang: setLang, getLang: getLang };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
