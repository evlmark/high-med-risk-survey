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

      // Q5.1 — Which jurisdictions (internal q2_1, shown only when Q5 = Yes)
      'q2_1.title': '5.1. Indique todas las jurisdicciones en las que la empresa opera o con las que tiene relaciones directas.',
      'q2_1.hint': 'Escriba un país por línea o sepárelos con comas.',
      'q2_1.ph': 'Por ejemplo: Panamá, Hong Kong, Emiratos Árabes Unidos',

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
      'q6.medium.title': '9. Proporcione la información de todos los beneficiarios finales (UBO) de la empresa que tengan, de forma directa o indirecta, una participación del 25% o más del capital social.',
      'q6.medium.hint': 'Debe agregar a todos y cada uno de los UBO con una participación del 25% o más. Por cada UBO cargue dos documentos: el comprobante de domicilio y la Constancia de Situación Fiscal (CSF). Cada archivo puede pesar hasta 10 MB.',
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
      'field.uboCsf': 'Constancia de Situación Fiscal (CSF) del UBO (documento, máx. 10 MB)',
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
      'err.q2_1': 'Pregunta 5.1: indique las jurisdicciones donde opera o tiene relaciones directas.',
      'err.q3': 'Pregunta 6: agregue al menos un proveedor (persona física o moral).',
      'err.q4': 'Pregunta 7: seleccione una opción.',
      'err.q4_1': 'Pregunta 7.1: agregue al menos un cliente (persona física o moral).',
      'err.q5': 'Pregunta 8: explique su modelo de negocio.',
      'err.q5_1': 'Pregunta 8.1: agregue al menos 1 director general O al menos 2 miembros del consejo.',
      'err.q5_2': 'Pregunta 8.2: agregue al menos un accionista.',
      'err.q6': 'Pregunta 9: agregue al menos un UBO.',
      'err.q6.uboName': 'Pregunta 9: el nombre completo del UBO es obligatorio.',
      'err.q6.file': 'Pregunta 9: el comprobante de domicilio es obligatorio para cada UBO.',
      'err.q6.csf': 'Pregunta 9: la Constancia de Situación Fiscal (CSF) es obligatoria para cada UBO.',
      'err.q6.fileBig': 'Pregunta 9: uno de los archivos supera los 10 MB.',
      'err.q6.declaration': 'Pregunta 9: la declaración Sí/No es obligatoria para cada UBO.',
      'err.q7': 'Pregunta 10: seleccione Sí o No.',
      'err.q8': 'Pregunta 11: seleccione Sí o No.',
      'err.signature': 'Agregue su firma.',
      'err.network': 'No se pudo enviar. Verifique su conexión e inténtelo de nuevo.',

      // Success
      // ===== Registered-company surveys (new_company / existing_company) =====
      'app.title.newCompany': 'Preguntas adicionales',
      'app.title.existingCompany': 'Preguntas adicionales',

      // Q3 — differs by survey
      'reg.padron.title': '3. Constancia de alta en el Padrón',
      'reg.padron.hint': 'Acuse de alta en el Padrón Federal de Actividades Vulnerables, emitido por el sistema electrónico de la Secretaría de Hacienda (Portal del SAT). Cargue el acuse que recibió al completar el registro.',
      'reg.notices.title': '3. Acuses de los avisos de Actividad Vulnerable presentados',
      'reg.notices.hint': 'Los acuses que confirman la presentación de sus avisos de Actividad Vulnerable de los últimos 3 meses. Si en algún mes no tuvo operaciones que reportar, incluya el aviso «sin operaciones» correspondiente. Reúna todo en un solo archivo.',

      // Q4 — tax compliance opinion
      'reg.tax.title': '4. Opinión del cumplimiento de obligaciones fiscales en sentido positivo',
      'reg.tax.hint': 'La «Opinión del cumplimiento de obligaciones fiscales» que emite el SAT, en sentido positivo. De forma independiente a su inscripción en el registro del SAT, este documento confirma que la empresa está al corriente con sus obligaciones fiscales y que opera realmente. Una opinión en sentido negativo, o con estatus «no localizado» o restringido, implica que revisaremos su solicitud con mayor detalle.',
      'reg.tax.link': 'Cómo obtenerla en el Portal del SAT',

      // Q5 — compliance program (optional)
      'reg.compliance.title': '5. Evidencia de su programa de cumplimiento',
      'reg.compliance.hint': 'Su manual interno de políticas PLD/FT y KYC: el documento que describe cómo la empresa previene el lavado de dinero y el financiamiento al terrorismo, cómo identifica a sus clientes, quién es el responsable de cumplimiento y cómo se conservan los registros. Si cuenta con ese manual, cárguelo.',

      // Q6 — origin of funds
      'reg.funds.title': '6. ¿Cuál es el origen de los recursos con los que opera el negocio?',
      'reg.funds.opt.1': 'Aportaciones de capital de los socios o propietarios',
      'reg.funds.opt.2': 'Utilidades generadas por la operación de la propia empresa',
      'reg.funds.opt.3': 'Financiamiento bancario o línea de crédito',
      'reg.funds.opt.4': 'Préstamo o inversión de un tercero (persona física o moral)',
      'reg.funds.opt.5': 'Venta de activos, de un negocio o de acciones',
      'reg.funds.opt.6': 'Otro (especifique)',
      'reg.funds.other.ph': 'Describa el origen de los recursos',

      // Q7 — UBO (first six fields of the High Risk UBO block)
      'reg.ubo.title': '8. Proporcione la información de los beneficiarios finales (UBO)',
      'reg.ubo.hint': 'Agregue la información de todos los propietarios reales.',
      'reg.uboExpertise': 'Describa la experiencia relevante del UBO (entre 100 y 250 palabras): incluya información como años de experiencia, sectores/mercados, cargos ocupados, habilidades clave, educación/certificaciones, logros destacados y otra información relevante.',
      'reg.uboRole': 'Describa el rol y las principales responsabilidades del UBO dentro de la empresa (entre 100 y 250 palabras).',
      'reg.words.range': 'palabras (mín. 100, máx. 250)',

      // Q8 — average ticket
      'reg.ticket.title': '7. ¿Cuál es su ticket promedio por operación, en pesos mexicanos (MXN)?',
      'reg.ticket.hint': 'Indique el monto típico de una venta u operación, en MXN.',
      'reg.ticket.ph': 'Por ejemplo: $15,000.00 MXN',

      'err.reg.doc3': 'Pregunta 3: el documento es obligatorio.',
      'err.reg.tax': 'Pregunta 4: la opinión del cumplimiento es obligatoria.',
      'err.reg.funds': 'Pregunta 6: seleccione el origen de los recursos.',
      'err.reg.fundsOther': 'Pregunta 6: describa el origen de los recursos.',
      'err.reg.ubo': 'Pregunta 8: agregue al menos un UBO.',
      'err.reg.uboFields': 'Pregunta 8: complete todos los campos obligatorios de cada UBO.',
      'err.reg.uboWords': 'Pregunta 8: los campos de experiencia y responsabilidades de cada UBO deben tener entre 100 y 250 palabras.',
      'err.reg.ticket': 'Pregunta 7: indique su ticket promedio.',
      'err.reg.oath': 'Pregunta 9: seleccione Sí o No.',
      'err.reg.pep': 'Pregunta 10: seleccione Sí o No.',

      'badge.optional': 'Opcional',
      'reg.oath.title': '9. Declaro bajo protesta de decir verdad que la información de este formulario es verdadera y exacta, y que no he omitido ninguna información relevante que pudiera afectar este proceso.',
      'reg.pep.title': '10. Declaro que no soy una persona políticamente expuesta (PEP), ni lo son los UBO, accionistas u otros representantes legales de la empresa, ni tenemos vínculos con funcionarios públicos o autoridades que pudieran interferir con la transparencia requerida para esta relación.',

      // ===== Advanced EDD ($1,000,000 – $10,000,000) =====
      'app.title.edd': 'Preguntas adicionales',
      'field.docsMax': 'Documentos, máx. 10 MB cada uno',
      'field.photosMax': 'Fotografías (se comprimen automáticamente)',
      'btn.removeFile': 'Quitar',
      'file.tooMany': 'Se alcanzó el número máximo de archivos para esta pregunta.',

      'edd.licenses.title': '3. ¿Qué licencias, registros o autorizaciones son necesarios para realizar su actividad económica?',
      'edd.licenses.hint': 'Indíquelos y adjunte una copia de cada uno. Si su empresa no requiere ninguna licencia, registro o autorización gubernamental, marque la casilla.',
      'edd.licenses.none': 'La empresa no requiere autorización, licencia o registro gubernamental para realizar su actividad económica.',
      'edd.licenses.label': 'Licencias, registros o autorizaciones',
      'edd.licenses.ph': 'Por ejemplo: licencia sanitaria de COFEPRIS…',

      'edd.padron.title': '4. Alta en el Padrón de Actividades Vulnerables del SAT',
      'edd.padron.hint': 'Adjunte el acuse de alta de su empresa en el Padrón de Actividades Vulnerables del SAT.',
      'edd.padron.none': 'La empresa no requiere alta en el Padrón de Actividades Vulnerables del SAT.',
      'edd.padron.why': 'Explique por qué la empresa no requiere este registro',

      'edd.notices.title': '4.1. Avisos de Actividades Vulnerables presentados ante el SAT en los últimos 3 meses',
      'edd.notices.hint': 'Adjunte los acuses de los avisos de Actividades Vulnerables que su empresa presentó ante el SAT en los últimos 3 meses, incluidos los avisos «sin operaciones».',

      'edd.tax.title': '5. Declaración anual de impuestos más reciente',
      'edd.tax.hint': 'Adjunte la declaración anual más reciente de la empresa. Si la empresa es de reciente creación y aún no la ha presentado, adjunte información sustituta, como sus declaraciones mensuales de IVA o ISR.',

      'edd.photos.title': '6. Fotografías de la operación de la empresa (mínimo 3)',
      'edd.photos.hint': 'Cargue al menos 3 fotografías que muestren dónde y cómo opera el negocio, por ejemplo:<ul><li>Sus oficinas, tienda o cualquier otro lugar donde se realiza la actividad económica.</li><li>Si vende productos o mercancías: los productos, el almacén donde los guarda y/o el espacio donde los vende.</li><li>Si su actividad incluye operaciones logísticas: los medios que utiliza (vehículos de la empresa, guías de mensajería, mercancía lista para enviarse).</li><li>Espacios de manufactura como fábricas, plantas de ensamble u otras instalaciones de procesamiento.</li></ul>',

      'edd.oath.title': '7. Declaro bajo protesta de decir verdad que la información de este formulario es verdadera y exacta, y que no he omitido ninguna información relevante que pudiera afectar este proceso.',
      'edd.pep.title': '8. Declaro que no soy una persona políticamente expuesta (PEP), ni lo son los UBO, accionistas u otros representantes legales de la empresa, ni tenemos vínculos con funcionarios públicos o autoridades que pudieran interferir con la transparencia requerida para esta relación.',

      'err.edd.licenses': 'Pregunta 3: indique las licencias y adjúntelas, o marque la casilla si no se requiere ninguna.',
      'err.edd.padron': 'Pregunta 4: adjunte el acuse de alta en el Padrón, o marque la casilla si no se requiere.',
      'err.edd.padronWhy': 'Pregunta 4: explique por qué la empresa no requiere el registro.',
      'err.edd.notices': 'Pregunta 4.1: adjunte los acuses de los avisos de los últimos 3 meses.',
      'err.edd.tax': 'Pregunta 5: adjunte la declaración anual más reciente (o la información sustituta).',
      'err.edd.photos': 'Pregunta 6: cargue al menos 3 fotografías.',
      'err.edd.oath': 'Pregunta 7: seleccione Sí o No.',
      'err.edd.pep': 'Pregunta 8: seleccione Sí o No.',
      'err.edd.total': 'Los archivos adjuntos son demasiado grandes en total (máx. 35 MB). Adjunte menos archivos o archivos más pequeños.',
      'err.edd.photoBig': 'Pregunta 6: una de las fotografías sigue pesando más de 10 MB después de comprimirla. Use una fotografía más pequeña.',

      // ---- Basic EDD ($250,000 – $1,000,000) ----
      'opt.other': 'Otro',
      'bedd.cash.title': '3. ¿Qué porcentaje de su negocio opera en efectivo?',
      'bedd.cash.opt4': 'Más del 60%',
      'bedd.ticket.title': '4. ¿Cuál es el valor promedio (ticket promedio) de los bienes o servicios que vende la empresa?',
      'bedd.ticket.hint': 'Monto en pesos mexicanos (MXN), solo números.',
      'bedd.channels.title': '5. ¿Cómo lo encuentran la mayoría de sus clientes?',
      'bedd.channels.hint': 'Seleccione todas las opciones que apliquen y especifique cada canal.',
      'bedd.channels.store': 'En tienda o sucursal física',
      'bedd.channels.store.ph': 'Dirección de la tienda o sucursal',
      'bedd.channels.online': 'En línea',
      'bedd.channels.online.ph': 'Sitio web, redes sociales, marketplace…',
      'bedd.channels.resellers': 'A través de distribuidores o revendedores',
      'bedd.channels.resellers.ph': 'Nombres de los principales distribuidores o revendedores',
      'bedd.channels.other.ph': 'Describa el canal',
      'bedd.customers.title': '6. ¿Quiénes son sus clientes?',
      'bedd.customers.large': 'Grandes empresas',
      'bedd.customers.sme': 'Pequeñas y medianas empresas',
      'bedd.customers.individuals': 'Personas físicas',
      'bedd.customers.gov': 'Organismos gubernamentales',
      'bedd.customers.other.ph': 'Describa a sus clientes',
      'bedd.suppliers.title': '7. ¿Quiénes son sus 3 principales proveedores y dónde se encuentran?',
      'bedd.suppliers.hint': 'Si tiene menos de 3 proveedores, elimine las filas que sobren.',
      'bedd.suppliers.add': 'Agregar proveedor',
      'bedd.suppliers.name': 'Nombre o razón social del proveedor',
      'bedd.suppliers.country': 'País',
      'bedd.wires.title': '8. ¿Recibe o envía transferencias internacionales (desde o hacia otros países)?',
      'bedd.wires.both': 'Sí, recibo transferencias desde otros países y envío transferencias a otros países.',
      'bedd.wires.send': 'Sí, pero solo envío transferencias a otros países.',
      'bedd.wires.receive': 'Sí, pero solo recibo transferencias desde otros países.',
      'bedd.wires.no': 'No, no recibo ni envío transferencias desde o hacia otros países.',
      'bedd.wires.countries': 'Seleccione los países',
      'bedd.abroad.title': '9. ¿Opera en países fuera de México?',
      'bedd.abroad.countries': 'Seleccione los países en los que opera',
      'bedd.country.search': 'Buscar país…',
      'bedd.season.title': '10. ¿Sus ingresos o pagos aumentan o disminuyen por temporada? ¿Cuándo?',
      'bedd.season.hint': 'Por ejemplo, un hotel normalmente recibe más dinero en verano.',
      'bedd.season.months': 'Seleccione los meses',
      'bedd.ubo.title': '11. Beneficiarios finales (UBO)',
      'bedd.ubo.hint': 'Responda las siguientes preguntas por cada beneficiario final: las personas que poseen el 25% o más de la empresa o que la controlan.',
      'bedd.ubo.add': 'Agregar otro UBO',
      'bedd.ubo.exp.title': '11.1. ¿Qué experiencia tiene en el mercado de la actividad específica de la empresa? Seleccione todas las que apliquen, incluida la experiencia adquirida en esta empresa.',
      'bedd.ubo.exp.1': 'Fundó o dirigió activamente un negocio que realiza la misma actividad.',
      'bedd.ubo.exp.2': 'Ocupó un puesto técnico, profesional u operativo en un negocio que realiza la misma actividad.',
      'bedd.ubo.exp.3': 'Gestionó ventas, compras, distribución o relaciones con clientes en este mercado.',
      'bedd.ubo.exp.4': 'Trabajó en un área relacionada de la industria o prestó servicios profesionales a negocios de este sector.',
      'bedd.ubo.exp.5': 'Invirtió en negocios de este sector sin participar en su administración u operación.',
      'bedd.ubo.exp.6': 'Tiene formación o capacitación relevante, pero no experiencia práctica en esta actividad o mercado.',
      'bedd.ubo.exp.7': 'No tiene experiencia, formación ni capacitación relevante en esta actividad o mercado.',
      'bedd.ubo.fn.title': '11.2. ¿Qué funciones desempeña realmente en la empresa, independientemente de su cargo formal? Seleccione todas las que apliquen.',
      'bedd.ubo.fn.1': 'Define la estrategia del negocio o toma decisiones importantes, como aprobar presupuestos o nombrar a la alta dirección.',
      'bedd.ubo.fn.2': 'Administra la operación diaria del negocio.',
      'bedd.ubo.fn.3': 'Selecciona o negocia con clientes, proveedores o socios comerciales.',
      'bedd.ubo.fn.4': 'Realiza o supervisa personalmente las actividades técnicas o profesionales necesarias para entregar los productos o servicios de la empresa.',
      'bedd.ubo.fn.5': 'Decide cómo se usan los fondos de la empresa o aprueba pagos significativos.',
      'bedd.ubo.fn.6': 'Tiene una participación accionaria o de inversión sin intervenir en las decisiones ni en la operación del negocio.',
      'bedd.ubo.fn.7': 'Desempeña una función que no corresponde a las categorías anteriores.',
      'bedd.ubo.fn.other.ph': 'Describa la función',
      'bedd.oath.title': '12. Declaro bajo protesta de decir verdad que la información de este formulario es verdadera y exacta, y que no he omitido ninguna información relevante que pudiera afectar este proceso.',
      'bedd.pep.title': '13. Declaro que no soy una persona políticamente expuesta (PEP), ni lo son los UBO, accionistas u otros representantes legales de la empresa, ni tenemos vínculos con funcionarios públicos o autoridades que pudieran interferir con la transparencia requerida para esta relación.',
      'err.bedd.cash': 'Pregunta 3: seleccione el porcentaje en efectivo.',
      'err.bedd.ticket': 'Pregunta 4: escriba el ticket promedio, solo números (por ejemplo: 1500).',
      'err.bedd.channels': 'Pregunta 5: seleccione al menos un canal y especifique cada canal seleccionado.',
      'err.bedd.customers': 'Pregunta 6: seleccione al menos un tipo de cliente (y descríbalo si eligió «Otro»).',
      'err.bedd.suppliers': 'Pregunta 7: indique al menos un proveedor con su nombre y país.',
      'err.bedd.wires': 'Pregunta 8: seleccione una opción y, si envía o recibe transferencias internacionales, los países.',
      'err.bedd.abroad': 'Pregunta 9: seleccione Sí o No y, si opera fuera de México, los países.',
      'err.bedd.season': 'Pregunta 10: seleccione Sí o No y, si hay temporadas, los meses.',
      'err.bedd.ubo': 'Pregunta 11: para cada UBO escriba el nombre y seleccione su experiencia y funciones (describa la función si eligió la última opción).',
      'err.bedd.oath': 'Pregunta 12: seleccione Sí o No.',
      'err.bedd.pep': 'Pregunta 13: seleccione Sí o No.',

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

      // Q5.1 — Which jurisdictions (internal q2_1, shown only when Q5 = Yes)
      'q2_1.title': '5.1. Please list all the jurisdictions where the company operates or has direct relationships.',
      'q2_1.hint': 'Write one country per line, or separate them with commas.',
      'q2_1.ph': 'For example: Panama, Hong Kong, United Arab Emirates',

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

      'q6.medium.title': "9. Please provide the information of every ultimate beneficial owner (UBO) of the company holding, directly or indirectly, 25% or more of the capital stock.",
      'q6.medium.hint': 'You must add each and every UBO with 25% or more ownership. For each UBO upload two documents: the proof of address and the Tax Status Certificate (Constancia de Situación Fiscal, CSF). Each file may be up to 10 MB.',
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
      'field.uboCsf': 'UBO Tax Status Certificate — CSF (document, max 10 MB)',
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
      'err.q2_1': 'Question 5.1: list the jurisdictions where the company operates or has direct relationships.',
      'err.q3': 'Question 6: add at least one provider (individual or company).',
      'err.q4': 'Question 7: select one option.',
      'err.q4_1': 'Question 7.1: add at least one client (individual or company).',
      'err.q5': 'Question 8: please explain your business model.',
      'err.q5_1': 'Question 8.1: add at least 1 general director OR at least 2 members of the board.',
      'err.q5_2': 'Question 8.2: add at least one shareholder.',
      'err.q6': 'Question 9: add at least one UBO.',
      'err.q6.uboName': 'Question 9: UBO Full Name is required.',
      'err.q6.file': 'Question 9: proof of address file is required for each UBO.',
      'err.q6.csf': 'Question 9: the Tax Status Certificate (CSF) is required for each UBO.',
      'err.q6.fileBig': 'Question 9: one of the files exceeds 10 MB.',
      'err.q6.declaration': 'Question 9: declaration Yes/No is required for each UBO.',
      'err.q7': 'Question 10: select Yes or No.',
      'err.q8': 'Question 11: select Yes or No.',
      'err.signature': 'Please add your signature.',
      'err.network': 'Could not submit. Check your connection and try again.',

      // ===== Registered-company surveys (new_company / existing_company) =====
      'app.title.newCompany': 'Additional questions',
      'app.title.existingCompany': 'Additional questions',

      // Q3 — differs by survey
      'reg.padron.title': '3. Proof of registration in the Padrón',
      'reg.padron.hint': 'Acknowledgment of your registration in the Federal Registry of Vulnerable Activities, issued by the Ministry of Finance electronic system (SAT Portal). Upload the acknowledgment you received when you completed the registration.',
      'reg.notices.title': '3. Records of filed Vulnerable Activity notices',
      'reg.notices.hint': 'The receipts confirming that you filed your Vulnerable Activity notices for the last 3 months. If there was nothing to report in a given month, include the corresponding "no transactions" notice. Combine everything into a single file.',

      // Q4 — tax compliance opinion
      'reg.tax.title': '4. Positive tax compliance opinion',
      'reg.tax.hint': 'The "Opinión del cumplimiento de obligaciones fiscales" issued by the SAT, in a positive sense. Independently of your registration in the SAT register, this document confirms that the company is up to date with its tax obligations and genuinely operating. An opinion in a negative sense, or one showing a "not located" or restricted status, means we will review your application in more detail.',
      'reg.tax.link': 'How to obtain it on the SAT Portal',

      // Q5 — compliance program (optional)
      'reg.compliance.title': '5. Evidence of your compliance program',
      'reg.compliance.hint': 'Your internal AML/CFT and KYC policies manual: the document describing how the company prevents money laundering and terrorist financing, how it identifies its clients, who is responsible for compliance, and how records are kept. If you have such a manual, upload it.',

      // Q6 — origin of funds
      'reg.funds.title': '6. What is the origin of the funds the business operates with?',
      'reg.funds.opt.1': 'Capital contributed by the shareholders or owners',
      'reg.funds.opt.2': "Profits generated by the company's own operations",
      'reg.funds.opt.3': 'Bank financing or a credit line',
      'reg.funds.opt.4': 'Loan or investment from a third party (individual or company)',
      'reg.funds.opt.5': 'Sale of assets, of a business or of shares',
      'reg.funds.opt.6': 'Other (specify)',
      'reg.funds.other.ph': 'Describe the origin of the funds',

      // Q7 — UBO (first six fields of the High Risk UBO block)
      'reg.ubo.title': "8. Please provide information of the UBO's",
      'reg.ubo.hint': 'Add the information of every ultimate beneficial owner (UBO).',
      'reg.uboExpertise': "Please describe the UBO's relevant expertise (between 100 and 250 words): Include information such as years of experience, sectors/markets, roles held, key skills, education/certifications, notable achievements, and other relevant information.",
      'reg.uboRole': "Describe the UBO's role and main responsibilities within the company (between 100 and 250 words).",
      'reg.words.range': 'words (min 100, max 250)',

      // Q8 — average ticket
      'reg.ticket.title': '7. What is your average ticket per transaction, in Mexican pesos (MXN)?',
      'reg.ticket.hint': 'Enter the typical amount of a single sale or transaction, in MXN.',
      'reg.ticket.ph': 'For example: $15,000.00 MXN',

      'err.reg.doc3': 'Question 3: the document is required.',
      'err.reg.tax': 'Question 4: the tax compliance opinion is required.',
      'err.reg.funds': 'Question 6: select the origin of the funds.',
      'err.reg.fundsOther': 'Question 6: describe the origin of the funds.',
      'err.reg.ubo': 'Question 8: add at least one UBO.',
      'err.reg.uboFields': 'Question 8: fill in every required field for each UBO.',
      'err.reg.uboWords': "Question 8: each UBO's expertise and responsibilities fields must be between 100 and 250 words.",
      'err.reg.ticket': 'Question 7: enter your average ticket.',
      'err.reg.oath': 'Question 9: select Yes or No.',
      'err.reg.pep': 'Question 10: select Yes or No.',

      'badge.optional': 'Optional',
      'reg.oath.title': '9. I declare under oath that the information in this form is true and accurate, and that I have not omitted any relevant information that could affect this process.',
      'reg.pep.title': "10. I declare that I am not a politically exposed person (PEP), nor the company's UBOs, shareholders or other legal representatives, nor do we have ties with public officials or authorities that could interfere with the transparency required for this relationship.",

      // ===== Advanced EDD ($1,000,000 – $10,000,000) =====
      'app.title.edd': 'Additional questions',
      'field.docsMax': 'Documents, max 10 MB each',
      'field.photosMax': 'Photos (compressed automatically)',
      'btn.removeFile': 'Remove',
      'file.tooMany': 'You have reached the maximum number of files for this question.',

      'edd.licenses.title': '3. Which licenses, registrations or authorizations are required to carry out your economic activity?',
      'edd.licenses.hint': 'List them and attach a copy of each one. If your company does not need any governmental license, registration or authorization, tick the box.',
      'edd.licenses.none': 'The company does not require a governmental authorization, license or registration to perform its economic activity.',
      'edd.licenses.label': 'Licenses, registrations or authorizations',
      'edd.licenses.ph': 'For example: COFEPRIS sanitary license…',

      'edd.padron.title': "4. Registration in SAT's Registry for Vulnerable Activities (Padrón de Actividades Vulnerables)",
      'edd.padron.hint': "Attach the acknowledgment of your company's registration in SAT's Padrón de Actividades Vulnerables.",
      'edd.padron.none': "The company does not require registration in SAT's Padrón de Actividades Vulnerables.",
      'edd.padron.why': 'Please explain why the company does not require this registration',

      'edd.notices.title': '4.1. Vulnerable Activity notices filed with SAT in the last 3 months',
      'edd.notices.hint': 'Attach the receipts of the Vulnerable Activity notices your company filed with SAT in the last 3 months, including any "no transactions" notices.',

      'edd.tax.title': '5. Latest annual tax return',
      'edd.tax.hint': "Attach the company's latest annual tax return. If the company was recently incorporated and has not filed one yet, attach substitute information, such as its monthly VAT or income tax returns.",

      'edd.photos.title': "6. Photos of the company's operation (at least 3)",
      'edd.photos.hint': "Upload at least 3 photos showing where and how the business operates, for example:<ul><li>Your offices, store or any other place where the economic activity is carried out.</li><li>If you sell products or goods: the products, the warehouse where you keep them and/or the space where you sell them.</li><li>If your activity involves logistics: the means you use (company vehicles, courier waybills, merchandise ready to be shipped).</li><li>Manufacturing spaces such as factories, assembly plants or other processing facilities.</li></ul>",

      'edd.oath.title': '7. I declare under oath that the information in this form is true and accurate, and that I have not omitted any relevant information that could affect this process.',
      'edd.pep.title': "8. I declare that I am not a politically exposed person (PEP), nor the company's UBOs, shareholders or other legal representatives, nor do we have ties with public officials or authorities that could interfere with the transparency required for this relationship.",

      'err.edd.licenses': 'Question 3: list the licenses and attach them, or tick the box if none are required.',
      'err.edd.padron': 'Question 4: attach the Padrón registration acknowledgment, or tick the box if it is not required.',
      'err.edd.padronWhy': 'Question 4: explain why the company does not require the registration.',
      'err.edd.notices': 'Question 4.1: attach the notice receipts for the last 3 months.',
      'err.edd.tax': 'Question 5: attach the latest annual tax return (or substitute information).',
      'err.edd.photos': 'Question 6: upload at least 3 photos.',
      'err.edd.oath': 'Question 7: select Yes or No.',
      'err.edd.pep': 'Question 8: select Yes or No.',
      'err.edd.total': 'The attached files are too large in total (max 35 MB). Please attach fewer or smaller files.',
      'err.edd.photoBig': 'Question 6: one of the photos is still larger than 10 MB after compression. Please use a smaller photo.',

      // ---- Basic EDD ($250,000 – $1,000,000) ----
      'opt.other': 'Other',
      'bedd.cash.title': '3. What percentage of your business do you run in cash?',
      'bedd.cash.opt4': 'More than 60%',
      'bedd.ticket.title': '4. What is the average ticket value of the goods or services the company sells?',
      'bedd.ticket.hint': 'Amount in Mexican pesos (MXN), numbers only.',
      'bedd.channels.title': '5. How do most of your customers find you?',
      'bedd.channels.hint': 'Select all that apply and specify each channel.',
      'bedd.channels.store': 'In-store',
      'bedd.channels.store.ph': 'Store or branch address',
      'bedd.channels.online': 'Online',
      'bedd.channels.online.ph': 'Website, social media, marketplace…',
      'bedd.channels.resellers': 'Through distributors or resellers',
      'bedd.channels.resellers.ph': 'Names of the main distributors or resellers',
      'bedd.channels.other.ph': 'Describe the channel',
      'bedd.customers.title': '6. Who are your customers?',
      'bedd.customers.large': 'Large businesses',
      'bedd.customers.sme': 'Small and medium-sized businesses',
      'bedd.customers.individuals': 'Individuals',
      'bedd.customers.gov': 'Government organizations',
      'bedd.customers.other.ph': 'Describe your customers',
      'bedd.suppliers.title': '7. Who are your 3 main suppliers and where are they located?',
      'bedd.suppliers.hint': 'If you have fewer than 3 suppliers, remove the extra rows.',
      'bedd.suppliers.add': 'Add supplier',
      'bedd.suppliers.name': "Supplier's name or legal name",
      'bedd.suppliers.country': 'Country',
      'bedd.wires.title': '8. Do you receive or send wire transfers to or from other countries?',
      'bedd.wires.both': 'Yes, I receive wire transfers from and send them to other countries.',
      'bedd.wires.send': 'Yes, but I only send wire transfers to other countries.',
      'bedd.wires.receive': 'Yes, but I only receive wire transfers from other countries.',
      'bedd.wires.no': 'No, I do not receive or send wire transfers to or from other countries.',
      'bedd.wires.countries': 'Select the countries',
      'bedd.abroad.title': '9. Do you operate in countries outside Mexico?',
      'bedd.abroad.countries': 'Select the countries where you operate',
      'bedd.country.search': 'Search country…',
      'bedd.season.title': '10. Do your incoming or outgoing payments increase or decrease seasonally? When?',
      'bedd.season.hint': 'For example, a hotel usually receives more money during the summer.',
      'bedd.season.months': 'Select the months',
      'bedd.ubo.title': '11. Ultimate beneficial owners (UBOs)',
      'bedd.ubo.hint': 'Answer the questions below for each UBO: the people who own 25% or more of the company or control it.',
      'bedd.ubo.add': 'Add another UBO',
      'bedd.ubo.exp.title': "11.1. What experience does the UBO have in the market of the company's specific business activity? Select all that apply, including experience gained in this company.",
      'bedd.ubo.exp.1': 'Founded or actively managed a business carrying out the same activity.',
      'bedd.ubo.exp.2': 'Held a technical, professional or operational role in a business carrying out the same activity.',
      'bedd.ubo.exp.3': 'Managed sales, purchasing, distribution or customer relationships in this market.',
      'bedd.ubo.exp.4': 'Worked in a related part of the industry or provided professional services to businesses in this sector.',
      'bedd.ubo.exp.5': 'Invested in businesses in this sector without participating in their management or operations.',
      'bedd.ubo.exp.6': 'Has relevant education or training, but no practical experience in this activity or market.',
      'bedd.ubo.exp.7': 'Has no relevant experience, education or training in this activity or market.',
      'bedd.ubo.fn.title': '11.2. Which functions does the UBO actually perform in the company, regardless of their formal title? Select all that apply.',
      'bedd.ubo.fn.1': 'Sets business strategy or makes major decisions, such as approving budgets or appointing senior management.',
      'bedd.ubo.fn.2': 'Manages day-to-day business operations.',
      'bedd.ubo.fn.3': 'Selects or negotiates with customers, suppliers or business partners.',
      'bedd.ubo.fn.4': "Personally performs or supervises the technical or professional activities needed to deliver the company's products or services.",
      'bedd.ubo.fn.5': 'Decides how company funds are used or approves significant payments.',
      'bedd.ubo.fn.6': 'Holds an ownership or investment interest without participating in business decisions or operations.',
      'bedd.ubo.fn.7': 'Performs a function that does not fit the categories above.',
      'bedd.ubo.fn.other.ph': 'Describe the function',
      'bedd.oath.title': '12. I declare under oath that the information in this form is true and accurate, and that I have not omitted any relevant information that could affect this process.',
      'bedd.pep.title': "13. I declare that I am not a politically exposed person (PEP), nor are the company's UBOs, shareholders or other legal representatives, and that we have no ties to public officials or authorities that could interfere with the transparency required for this relationship.",
      'err.bedd.cash': 'Question 3: select the share of cash.',
      'err.bedd.ticket': 'Question 4: enter the average ticket, numbers only (for example: 1500).',
      'err.bedd.channels': 'Question 5: select at least one channel and specify each selected channel.',
      'err.bedd.customers': 'Question 6: select at least one customer type (and describe it if you chose "Other").',
      'err.bedd.suppliers': 'Question 7: enter at least one supplier with its name and country.',
      'err.bedd.wires': 'Question 8: select an option and, if you send or receive international wire transfers, the countries.',
      'err.bedd.abroad': 'Question 9: select Yes or No and, if you operate outside Mexico, the countries.',
      'err.bedd.season': 'Question 10: select Yes or No and, if there are seasons, the months.',
      'err.bedd.ubo': 'Question 11: for each UBO enter the name and select their experience and functions (describe the function if you chose the last option).',
      'err.bedd.oath': 'Question 12: select Yes or No.',
      'err.bedd.pep': 'Question 13: select Yes or No.',

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
    // Pages that build labels outside the dictionary (country and month names) re-render on this.
    try { document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang } })); } catch (e) {}
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
