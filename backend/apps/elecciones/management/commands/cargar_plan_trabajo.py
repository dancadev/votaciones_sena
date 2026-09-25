"""Carga el plan de trabajo de una candidatura.

El plan se guarda como secciones estructuradas (ver `PlanTrabajo` en
`apps/elecciones/models.py`) para poder renderizar párrafos, listas, tablas y
bloques destacados sin perder el formato del documento original.

El plan de **Jhonatan Rolando Arcos Portillo** (candidato #1) va incluido en
este comando y sirve de **plantilla**: define la estructura completa que deben
seguir los planes de los demás candidatos.

Uso:
    # Carga el plan de ejemplo en el candidato #1
    python manage.py cargar_plan_trabajo --candidato 1

    # Carga el mismo plan como plantilla vacía en otro candidato, para editarlo
    python manage.py cargar_plan_trabajo --candidato 2 --plantilla-vacia

    # Carga un plan desde un archivo JSON
    python manage.py cargar_plan_trabajo --candidato 2 --archivo mi_plan.json

    # Ver la estructura de secciones de un candidato
    python manage.py cargar_plan_trabajo --candidato 1 --mostrar
"""

import json
import os

from django.core.management.base import BaseCommand, CommandError

from apps.elecciones.models import Candidato, PlanTrabajo


def parrafo(texto):
    return {'tipo': 'parrafo', 'texto': texto}


def vinetas(items):
    return {'tipo': 'lista', 'estilo': 'vinetas', 'items': items}


def numeros(items):
    return {'tipo': 'lista', 'estilo': 'numeros', 'items': items}


def destacado(texto, etiqueta=None):
    return {'tipo': 'destacado', 'texto': texto, 'etiqueta': etiqueta}


def secuencia(items):
    return {'tipo': 'secuencia', 'items': items}


def tabla(columnas, filas):
    return {'tipo': 'tabla', 'columnas': columnas, 'filas': filas}


def seccion(numero, titulo, bloques, nivel=1, proyecto=None):
    return {
        'numero': numero,
        'titulo': titulo,
        'proyecto': proyecto,
        'nivel': nivel,
        'bloques': bloques,
    }


# --------------------------------------------------------------------------- #
# Plan de trabajo de Jhonatan Rolando Arcos Portillo (candidato #1)
# --------------------------------------------------------------------------- #

PLAN_ARCOS = {
    'titulo': 'Plan de Trabajo y Propuestas',
    'eslogan': 'Tu voz, nuestro SENA',
    'lema': 'Escuchar • Gestionar • Hacer seguimiento • Rendir cuentas',
    'vigencia': '2026',
    #: Resumen corto que se muestra en la tarjeta del módulo de propuestas.
    'resumen': (
        'Representación cercana que escucha, prioriza, gestiona y rinde cuentas. Diez ejes de '
        'trabajo con proyectos, metas e indicadores: bienestar, refrigerios, emprendimiento, '
        'cultura, integración, empleabilidad, formación, salud mental, ambiente e inclusión.'
    ),
    'secciones': [
        seccion('1', 'Presentación', [
            parrafo(
                'Este Plan de Trabajo presenta la ruta de acción propuesta para la candidatura a '
                'Representante de Aprendices del Centro Internacional de Producción Limpia Lope '
                'SENA, Regional Nariño. Su propósito es convertir la representación en un ejercicio '
                'permanente de escucha, participación, gestión, seguimiento y rendición de cuentas.'
            ),
            parrafo(
                'La propuesta se proyecta en el marco de los principios, valores y procederes éticos '
                'institucionales, el Reglamento del Aprendiz SENA, el Plan Nacional Integral de '
                'Bienestar al Aprendiz y las acciones de bienestar que correspondan al Centro de '
                'Formación.'
            ),
            destacado(
                'El representante no debe prometer aquello que no puede decidir. Su compromiso debe '
                'ser escuchar, priorizar, canalizar, gestionar, hacer seguimiento y comunicar los '
                'resultados.',
                etiqueta='Idea fundamental',
            ),
        ]),
        seccion('2', 'Propósito de la candidatura', [
            destacado('Tu voz, nuestro SENA', etiqueta='Propósito'),
            parrafo(
                'Construir una representación cercana a los aprendices, capaz de recoger sus '
                'necesidades y convertirlas en propuestas viables, articuladas con las instancias '
                'institucionales y acompañadas de mecanismos de seguimiento.'
            ),
            secuencia(['Escuchar', 'Priorizar', 'Proponer', 'Gestionar', 'Hacer seguimiento', 'Rendir cuentas']),
        ]),
        seccion('3', 'Objetivo general', [
            parrafo(
                'Representar responsable, democrática, ética e incluyentemente a los aprendices del '
                'Centro Internacional de Producción Limpia Lope, promoviendo acciones que fortalezcan '
                'el bienestar integral, la permanencia, la formación, la participación, la convivencia, '
                'la cultura, el deporte, el emprendimiento, el ambiente y la conexión con oportunidades '
                'para la etapa productiva y laboral.'
            ),
        ]),
        seccion('4', 'Objetivos específicos', [
            numeros([
                'Escuchar las necesidades de los aprendices de los diferentes programas, jornadas y modalidades.',
                'Fortalecer la comunicación entre aprendices, voceros y las diferentes instancias institucionales.',
                'Gestionar propuestas relacionadas con bienestar, permanencia y formación integral.',
                'Promover oportunidades de emprendimiento, empleabilidad y preparación para la etapa productiva.',
                'Fortalecer las actividades culturales, deportivas, artísticas y recreativas.',
                'Promover espacios de integración entre aprendices, instructores, personal administrativo y demás integrantes de la comunidad institucional.',
                'Impulsar mecanismos de seguimiento a situaciones de interés para los aprendices, incluido el servicio de alimentación o refrigerios cuando corresponda.',
                'Presentar informes periódicos de gestión.',
            ]),
        ]),
        seccion('5', 'Metodología: "Lope te escucha"', [
            parrafo(
                'Antes de consolidar nuevas iniciativas, se propone realizar un diagnóstico '
                'participativo.'
            ),
            vinetas([
                'Mesas de escucha por programas o grupos.',
                'Encuesta general de necesidades.',
                'Buzón físico y digital de propuestas.',
                'Reuniones periódicas con voceros.',
                'Registro y clasificación de solicitudes.',
                'Priorización según impacto, viabilidad y competencia institucional.',
            ]),
            destacado(
                'Las propuestas definitivas deberán construirse con base en las necesidades '
                'identificadas y en las posibilidades reales de gestión del Centro.',
                etiqueta='Criterio',
            ),
        ]),
        seccion('6', 'Ejes y proyectos prioritarios', [
            parrafo(
                'El plan se organiza en diez ejes de trabajo. Cada uno cuenta con un proyecto '
                'concreto, sus acciones y su meta.'
            ),
        ]),
        seccion('6.1', 'Eje de bienestar y permanencia', [
            parrafo('Proyecto: "Lope te escucha"'),
            vinetas([
                'Mesas periódicas de escucha.',
                'Divulgación de rutas y servicios de bienestar.',
                'Identificación de necesidades que puedan afectar la permanencia.',
                'Canalización de situaciones a las instancias competentes.',
                'Seguimiento general a compromisos.',
            ]),
            destacado(
                'Convertir la representación en un canal permanente de comunicación.',
                etiqueta='Meta',
            ),
        ], nivel=2, proyecto='Lope te escucha'),
        seccion('6.2', 'Eje de alimentación y refrigerios', [
            parrafo('Proyecto: "Refrigerio con seguimiento"'),
            parrafo(
                'Promover un mecanismo de seguimiento participativo a las novedades relacionadas con '
                'el servicio de refrigerios o alimentación que corresponda al Centro, sin reemplazar '
                'las funciones de supervisión contractual, técnica o administrativa.'
            ),
            vinetas([
                'Formato para registrar fecha, jornada, novedad y observación.',
                'Canalización de novedades por las rutas institucionales.',
                'Seguimiento a respuestas y acciones de mejora.',
                'Presentación periódica de resultados generales a los aprendices.',
                'Promoción del uso responsable de los canales institucionales de quejas, sugerencias y reclamos.',
            ]),
            destacado(
                'Observar, registrar, canalizar y hacer seguimiento; no sustituir a la administración '
                'ni emitir conceptos técnicos. Se crea la mesa de seguimiento de refrigerio.',
                etiqueta='Principio',
            ),
        ], nivel=2, proyecto='Refrigerio con seguimiento'),
        seccion('6.3', 'Eje de emprendimiento', [
            parrafo('Proyecto: "Feria Lope Emprende"'),
            parrafo(
                'Fortalecer y ampliar las actividades de emprendimiento de los aprendices mediante una '
                'feria periódica que permita mostrar productos, servicios, proyectos e iniciativas '
                'desarrolladas dentro de los programas de formación.'
            ),
            vinetas([
                'Feria de emprendimientos de aprendices.',
                'Stands por programas o categorías.',
                'Muestra de productos y servicios.',
                'Espacios de demostración de proyectos.',
                'Charlas de emprendimiento y educación financiera.',
                'Invitación a aliados institucionales y sector productivo cuando sea viable.',
                'Reconocimiento a iniciativas destacadas.',
                'Espacio para conectar emprendimientos con potenciales clientes o aliados, respetando las autorizaciones institucionales.',
            ]),
            destacado('Convertir el talento de los aprendices en oportunidades visibles.', etiqueta='Meta'),
        ], nivel=2, proyecto='Feria Lope Emprende'),
        seccion('6.4', 'Eje de cultura y talento (arte y cultura)', [
            parrafo('Proyecto: "Lope tiene talento"'),
            parrafo(
                'Fortalecer la feria o jornada de talento como un espacio institucional para visibilizar '
                'las capacidades artísticas, culturales, creativas y comunicativas de los aprendices.'
            ),
            vinetas([
                'Música.',
                'Danza.',
                'Teatro.',
                'Poesía y literatura.',
                'Artes visuales.',
                'Fotografía.',
                'Creación audiovisual.',
                'Stand de talentos y proyectos.',
                'Presentaciones por programas.',
                'Inter-regional.',
            ]),
            destacado(
                'La actividad deberá coordinarse con Bienestar y las áreas responsables para definir '
                'espacios, horarios, logística y condiciones de participación, con integración de '
                'directivos, administrativos e instructores.',
                etiqueta='Coordinación',
            ),
        ], nivel=2, proyecto='Lope tiene talento'),
        seccion('6.5', 'Eje de integración institucional', [
            parrafo('Proyecto: "Noche Lope: lunada de talento y convivencia"'),
            parrafo(
                'Crear, previa autorización institucional, una jornada cultural y de integración en '
                'horario extendido que reúna a aprendices, instructores, personal administrativo y '
                'demás integrantes autorizados de la comunidad institucional.'
            ),
            vinetas([
                'Presentaciones musicales de aprendices.',
                'Artistas invitados cuando exista viabilidad y autorización.',
                'Muestra de danza y expresiones culturales.',
                'Espacios de poesía, narración y talento.',
                'Feria de emprendimientos complementaria.',
                'Actividades de integración y convivencia.',
                'Reconocimientos a talentos y participación.',
                'Cierre musical o concierto, sujeto a autorización, logística, seguridad y presupuesto disponible.',
            ]),
            destacado(
                'Una jornada institucional de integración, talento y sentido de pertenencia. Esta '
                'iniciativa no se plantea como una fiesta de campaña, sino como una propuesta de '
                'bienestar e integración para la comunidad institucional. Su realización dependerá de '
                'las autorizaciones, recursos, protocolos y programación del Centro.',
                etiqueta='Concepto',
            ),
        ], nivel=2, proyecto='Noche Lope'),
        seccion('6.6', 'Eje de empleabilidad y etapa productiva', [
            parrafo('Proyecto: "Lope emplea"'),
            vinetas([
                'Tablero de oportunidades laborales y de etapa productiva.',
                'Talleres de hoja de vida.',
                'Preparación para entrevistas.',
                'Orientación sobre búsqueda de empresas.',
                'Charlas con egresados y sector productivo.',
                'Divulgación de ferias de empleo y convocatorias verificadas.',
                'Articulación con las dependencias institucionales competentes.',
            ]),
        ], nivel=2, proyecto='Lope emplea'),
        seccion('6.7', 'Eje de formación', [
            parrafo('Proyecto: "Mesa de necesidades de formación"'),
            vinetas([
                'Identificar dificultades recurrentes de los aprendices.',
                'Recoger propuestas de mejora.',
                'Canalizar necesidades sobre ambientes y recursos.',
                'Promover talleres complementarios.',
                'Hacer seguimiento a las solicitudes presentadas.',
            ]),
        ], nivel=2, proyecto='Mesa de necesidades de formación'),
        seccion('6.8', 'Eje de salud mental y vida saludable', [
            parrafo('Proyecto: "No estás solo"'),
            vinetas([
                'Divulgación de rutas de atención.',
                'Campañas de prevención.',
                'Espacios de escucha articulados con Bienestar.',
                'Actividades de manejo del estrés y organización del tiempo.',
                'Promoción de hábitos saludables.',
            ]),
        ], nivel=2, proyecto='No estás solo'),
        seccion('6.9', 'Eje ambiental', [
            parrafo('Proyecto: "Guardianes de Lope"'),
            vinetas([
                'Separación adecuada de residuos.',
                'Cuidado de zonas verdes.',
                'Ahorro de agua y energía.',
                'Jornadas de sensibilización.',
                'Retos ambientales entre programas.',
                'Reconocimiento a iniciativas ambientales.',
            ]),
        ], nivel=2, proyecto='Guardianes de Lope'),
        seccion('6.10', 'Eje de inclusión y convivencia', [
            parrafo('Proyecto: "Un Lope para todos"'),
            vinetas([
                'Mesas de escucha incluyentes.',
                'Campañas de respeto y tolerancia.',
                'Prevención de discriminación.',
                'Actividades de integración.',
                'Promoción de resolución pacífica de conflictos.',
            ]),
        ], nivel=2, proyecto='Un Lope para todos'),
        seccion('7', 'Matriz de ejecución', [
            parrafo(
                'Cada proyecto tiene definido su acción, plazo, responsable, indicador y evidencia.'
            ),
            tabla(
                ['Proyecto', 'Acción', 'Plazo', 'Responsable', 'Indicador', 'Evidencia'],
                [
                    ['Lope te escucha', 'Mesas y encuesta', 'Primer mes / periódicas',
                     'Representante + voceros', 'Mesas realizadas', 'Actas y resultados'],
                    ['Refrigerio con seguimiento', 'Registro de novedades y canalización',
                     'Permanente', 'Representante + instancias competentes',
                     'Novedades con seguimiento', 'Matriz de seguimiento'],
                    ['Feria Lope Emprende', 'Feria de emprendimientos', 'Semestral',
                     'Representante + Bienestar / áreas competentes', 'Ferias y participantes',
                     'Registro fotográfico / listados'],
                    ['Lope tiene talento', 'Muestra artística', 'Semestral',
                     'Representante + Bienestar', 'Participantes', 'Programación / evidencias'],
                    ['Noche Lope', 'Lunada cultural / concierto', 'Anual o según viabilidad',
                     'Representante + áreas autorizadas', 'Evento realizado', 'Agenda / evidencias'],
                    ['Lope emplea', 'Oportunidades y talleres', 'Mensual / trimestral',
                     'Representante + áreas competentes', 'Actividades / oportunidades',
                     'Registro'],
                    ['Etapa productiva', 'Preparación y divulgación', 'Trimestral',
                     'Representante + áreas competentes', 'Jornadas realizadas',
                     'Listados, actas y evidencias'],
                    ['Mesa de formación', 'Reunión de necesidades', 'Bimestral',
                     'Representante + voceros', 'Mesas realizadas', 'Informe publicado'],
                    ['No estás solo', 'Campañas de bienestar', 'Trimestral',
                     'Articulación con Bienestar', 'Actividades', 'Evidencias'],
                    ['Guardianes de Lope', 'Campañas ambientales', 'Trimestral',
                     'Representante + aprendices', 'Campañas', 'Evidencias'],
                    ['Un Lope para todos', 'Espacios de inclusión', 'Trimestral',
                     'Representante + áreas competentes', 'Participación', 'Evidencias'],
                    ['Cuentas claras', 'Informe de gestión', 'Trimestral', 'Representante',
                     'Informes presentados', 'Informes publicados'],
                ],
            ),
        ]),
        seccion('8', 'Cronograma de los primeros 100 días', [
            tabla(
                ['Días', 'Etapa', 'Acciones'],
                [
                    ['1 – 15', 'Escuchar', 'Presentación de la representación · Reunión con voceros · Encuesta general · Primera mesa de escucha'],
                    ['16 – 30', 'Priorizar', 'Consolidar resultados · Identificar las principales necesidades · Construir la Agenda de Prioridades del Aprendiz'],
                    ['31 – 45', 'Presentar', 'Presentar propuestas a las instancias competentes · Definir rutas de gestión'],
                    ['46 – 75', 'Gestionar', 'Hacer seguimiento · Promover las primeras actividades viables · Impulsar la preparación de Feria Lope Emprende y Lope Tiene Talento'],
                    ['76 – 90', 'Evaluar', 'Consultar nuevamente a los aprendices · Revisar avances y dificultades'],
                    ['91 – 100', 'Rendir cuentas', 'Presentar el primer informe · Mostrar avances, pendientes y próximos pasos'],
                ],
            ),
        ]),
        seccion('9', 'Matriz de seguimiento', [
            parrafo(
                'Herramienta para registrar cada necesidad recibida, la instancia a la que se canaliza, '
                'la respuesta obtenida, su estado y el próximo paso.'
            ),
            tabla(
                ['Código', 'Fecha', 'Necesidad / propuesta', 'Instancia', 'Respuesta', 'Estado', 'Próximo paso'],
                [
                    ['WB-01', '', '', '', '', 'En gestión', ''],
                    ['RF-02', '', '', '', '', 'En gestión', ''],
                    ['EM-03', '', '', '', '', 'En gestión', ''],
                    ['EP-04', '', '', '', '', 'En gestión', ''],
                    ['FT-05', '', '', '', '', 'En gestión', ''],
                    ['CU-06', '', '', '', '', 'En gestión', ''],
                    ['AM-07', '', '', '', '', 'En gestión', ''],
                ],
            ),
            destacado(
                'Estados sugeridos: atendido/solucionado; en gestión; pendiente o sin respuesta. La '
                'clasificación deberá utilizarse de manera objetiva y verificable.',
                etiqueta='Estados',
            ),
        ]),
        seccion('10', 'Indicadores de gestión', [
            vinetas([
                'Número de propuestas recibidas.',
                'Número de propuestas gestionadas.',
                'Número de mesas de escucha realizadas.',
                'Número de aprendices participantes.',
                'Número de actividades de bienestar y cultura promovidas.',
                'Número de emprendimientos participantes.',
                'Número de oportunidades de empleo o etapa productiva divulgadas.',
                'Número de solicitudes relacionadas con alimentación/refrigerios con seguimiento.',
                'Número de informes de gestión presentados.',
            ]),
        ]),
        seccion('11', 'Transparencia y rendición de cuentas', [
            parrafo(
                'La representación deberá informar periódicamente qué propuestas fueron recibidas, '
                'cuáles fueron gestionadas, ante qué instancia se presentaron, qué respuesta se obtuvo '
                'y cuáles permanecen pendientes.'
            ),
            destacado('Gestionar, no prometer.', etiqueta='Compromiso'),
        ]),
        seccion('12', 'Límites y responsabilidades', [
            parrafo(
                'La candidatura respetará las competencias institucionales. El representante no '
                'sustituirá a instructores, coordinadores, Bienestar, supervisores de contratos, '
                'funcionarios administrativos ni directivos.'
            ),
            vinetas([
                'No prometer beneficios que dependan de decisiones de terceros.',
                'No presentar como decisión institucional algo que todavía sea una propuesta.',
                'No realizar acusaciones sin evidencia.',
                'No intervenir técnicamente en contratos o servicios que correspondan a funcionarios responsables.',
                'No utilizar recursos institucionales para beneficio personal sin autorización.',
                'Solicitar autorización para actividades, espacios, horarios, publicidad y eventos dentro del Centro.',
                'Respetar el Reglamento del Aprendiz y las reglas específicas de la elección.',
            ]),
        ]),
        seccion('13', 'Propuesta diferencial de la candidatura', [
            destacado('Un representante que deja huella', etiqueta='Propuesta diferencial'),
            parrafo(
                'La diferencia de esta propuesta será que cada iniciativa tendrá una ruta de ejecución '
                'y seguimiento. La representación no terminará con la elección.'
            ),
            vinetas([
                'Agenda de Prioridades del Aprendiz.',
                'Observatorio / Matriz de seguimiento.',
                'Mesas de escucha.',
                'Mesa de seguimiento a alimentación y refrigerios.',
                'Feria Lope Emprende.',
                'Lope Tiene Talento.',
                'Noche Lope: lunada de talento y convivencia.',
                'Lope Emplea y Etapa Productiva.',
                'Informes trimestrales de gestión.',
            ]),
        ]),
        seccion('14', 'Mensaje de campaña', [
            parrafo('No vengo a prometer lo imposible. Vengo a escuchar, gestionar y hacer seguimiento.'),
            vinetas([
                'Tu voz cuenta.',
                'Tu propuesta importa.',
                'Tu SENA también es tuyo.',
            ]),
        ]),
        seccion('15', 'Compromiso del candidato', [
            parrafo(
                'Me comprometo a ejercer la representación con respeto, responsabilidad, transparencia, '
                'participación, inclusión y sentido de pertenencia. Escucharé las necesidades de los '
                'aprendices, gestionaré las propuestas dentro de mis competencias, respetaré los '
                'procedimientos institucionales y comunicaré los avances y dificultades.'
            ),
            parrafo(
                'Especialmente, me comprometo a promover espacios de participación donde los aprendices '
                'puedan aportar a la construcción de las actividades de bienestar, emprendimiento, '
                'cultura, deporte, formación, empleabilidad y convivencia.'
            ),
            destacado(
                'Escuchar antes de hablar. Consultar antes de proponer. Gestionar antes de prometer. '
                'Informar antes de concluir.',
                etiqueta='Principios de trabajo',
            ),
        ]),
    ],
}


def validar_plan(datos):
    """Revisa que el plan tenga la forma que espera la plantilla del frontend.

    Devuelve la lista de errores encontrados. Un plan mal formado se vería como
    una página vacía, así que es mejor detenerlo antes de guardarlo.
    """
    errores = []
    tipos_validos = {'parrafo', 'lista', 'destacado', 'secuencia', 'tabla'}

    if not isinstance(datos, dict):
        return ['El archivo debe contener un objeto JSON con el plan.']
    if not datos.get('titulo'):
        errores.append('Falta el campo "titulo".')

    secciones = datos.get('secciones')
    if not isinstance(secciones, list) or not secciones:
        return errores + ['El plan debe tener una lista "secciones" con al menos una sección.']

    numeros = set()
    for indice, seccion in enumerate(secciones):
        etiqueta = f'secciones[{indice}]'
        if not isinstance(seccion, dict):
            errores.append(f'{etiqueta}: debe ser un objeto.')
            continue
        for campo in ('numero', 'titulo'):
            if not seccion.get(campo):
                errores.append(f'{etiqueta}: falta "{campo}".')
        if seccion.get('numero') in numeros:
            errores.append(f'{etiqueta}: el número "{seccion.get("numero")}" está repetido.')
        numeros.add(seccion.get('numero'))

        if not isinstance(seccion.get('nivel', 1), int):
            errores.append(f'{etiqueta}: "nivel" debe ser un número entero.')

        bloques = seccion.get('bloques')
        if not isinstance(bloques, list):
            errores.append(f'{etiqueta}: "bloques" debe ser una lista.')
            continue

        for posicion, bloque in enumerate(bloques):
            donde = f'{etiqueta}.bloques[{posicion}]'
            if not isinstance(bloque, dict):
                errores.append(f'{donde}: debe ser un objeto.')
                continue
            tipo = bloque.get('tipo')
            if tipo not in tipos_validos:
                errores.append(
                    f'{donde}: tipo "{tipo}" desconocido. '
                    f'Válidos: {", ".join(sorted(tipos_validos))}.'
                )
                continue
            if tipo in ('parrafo', 'destacado') and not isinstance(bloque.get('texto', ''), str):
                errores.append(f'{donde}: "texto" debe ser una cadena.')
            if tipo in ('lista', 'secuencia') and not isinstance(bloque.get('items'), list):
                errores.append(f'{donde}: "items" debe ser una lista.')
            if tipo == 'lista' and bloque.get('estilo') not in (None, 'vinetas', 'numeros'):
                errores.append(f'{donde}: "estilo" debe ser "vinetas" o "numeros".')
            if tipo == 'tabla':
                columnas = bloque.get('columnas')
                filas = bloque.get('filas')
                if not isinstance(columnas, list) or not columnas:
                    errores.append(f'{donde}: "columnas" debe ser una lista con al menos un elemento.')
                    continue
                if not isinstance(filas, list):
                    errores.append(f'{donde}: "filas" debe ser una lista.')
                    continue
                for numero_fila, fila in enumerate(filas):
                    if not isinstance(fila, list):
                        errores.append(f'{donde}.filas[{numero_fila}]: debe ser una lista.')
                    elif len(fila) != len(columnas):
                        errores.append(
                            f'{donde}.filas[{numero_fila}]: tiene {len(fila)} celdas y '
                            f'la tabla declara {len(columnas)} columnas.'
                        )
    return errores


def plantilla_vacia():
    """Misma estructura de secciones que el plan modelo, pero sin contenido.

    Sirve para que los demás candidatos completen su plan conservando el formato
    y los apartados del documento de referencia.
    """
    vacia = {
        'titulo': PLAN_ARCOS['titulo'],
        'eslogan': '',
        'lema': '',
        'vigencia': PLAN_ARCOS['vigencia'],
        'secciones': [],
    }
    for seccion_modelo in PLAN_ARCOS['secciones']:
        copia = {
            'numero': seccion_modelo['numero'],
            'titulo': seccion_modelo['titulo'],
            'proyecto': seccion_modelo['proyecto'],
            'nivel': seccion_modelo['nivel'],
            'bloques': [],
        }
        for bloque in seccion_modelo['bloques']:
            if bloque['tipo'] == 'parrafo':
                copia['bloques'].append(parrafo(''))
            elif bloque['tipo'] == 'lista':
                copia['bloques'].append({
                    'tipo': 'lista',
                    'estilo': bloque.get('estilo', 'vinetas'),
                    'items': [''],
                })
            elif bloque['tipo'] == 'destacado':
                copia['bloques'].append(destacado('', bloque.get('etiqueta')))
            elif bloque['tipo'] == 'secuencia':
                copia['bloques'].append(secuencia(bloque['items']))
            elif bloque['tipo'] == 'tabla':
                copia['bloques'].append(tabla(
                    bloque['columnas'],
                    [['' for _ in bloque['columnas']]],
                ))
        vacia['secciones'].append(copia)
    return vacia


class Command(BaseCommand):
    help = 'Carga el plan de trabajo de un candidato (el del candidato #1 sirve de plantilla)'

    def add_arguments(self, parser):
        parser.add_argument('--candidato', type=str, required=True,
                            help='Id o número de tarjetón del candidato')
        parser.add_argument('--archivo', type=str, default=None,
                            help='Archivo JSON con el plan (si se omite, usa el plan modelo)')
        parser.add_argument('--plantilla-vacia', action='store_true',
                            help='Carga la estructura del plan modelo sin contenido, para completarla')
        parser.add_argument('--mostrar', action='store_true',
                            help='Muestra la estructura del plan guardado y no modifica nada')
        parser.add_argument('--resumen', type=str, default=None,
                            help='Resumen corto que se muestra en la tarjeta del módulo de propuestas')

    def handle(self, *args, **options):
        candidato = self._buscar_candidato(options['candidato'])

        if options['mostrar']:
            self._mostrar(candidato)
            return

        if options['archivo']:
            ruta = options['archivo']
            if not os.path.isabs(ruta):
                ruta = os.path.join(os.getcwd(), ruta)
            if not os.path.exists(ruta):
                raise CommandError(f'No se encontró el archivo: {ruta}')
            with open(ruta, encoding='utf-8') as archivo:
                datos = json.load(archivo)
            origen = os.path.basename(ruta)
        elif options['plantilla_vacia']:
            datos = plantilla_vacia()
            origen = 'plantilla vacía basada en el plan modelo'
        else:
            datos = PLAN_ARCOS
            origen = 'plan modelo (Jhonatan Rolando Arcos Portillo)'

        errores = validar_plan(datos)
        if errores:
            self.stdout.write(self.style.ERROR('El plan tiene errores y no se guardó:'))
            for error in errores:
                self.stdout.write(self.style.ERROR(f'  - {error}'))
            raise CommandError('Corrige el plan e inténtalo de nuevo.')

        plan, creado = PlanTrabajo.objects.update_or_create(
            candidato=candidato,
            defaults={
                'titulo': datos.get('titulo', ''),
                'eslogan': datos.get('eslogan', ''),
                'lema': datos.get('lema', ''),
                'vigencia': datos.get('vigencia', ''),
                'secciones': datos.get('secciones', []),
                'publicado': True,
            },
        )

        self.stdout.write(self.style.SUCCESS(
            f'Plan {"creado" if creado else "actualizado"} para '
            f'#{candidato.numero_tarjeton} {candidato.nombre}'
        ))
        self.stdout.write(f'  Origen: {origen}')
        self.stdout.write(f'  Secciones: {plan.total_secciones}')
        self._mostrar(candidato)

        resumen = options['resumen'] if options['resumen'] else datos.get('resumen')
        if resumen:
            # Resumen corto para la tarjeta del módulo de propuestas.
            candidato.propuesta = resumen
            candidato.save(update_fields=['propuesta'])
            self.stdout.write(self.style.SUCCESS('  Resumen de la tarjeta actualizado.'))
        elif options['plantilla_vacia'] or options['archivo']:
            self.stdout.write(self.style.WARNING(
                '  Sin --resumen ni campo "resumen" en el archivo: '
                'la tarjeta del módulo de propuestas quedó como estaba.'
            ))

    def _buscar_candidato(self, referencia):
        candidato = None
        if str(referencia).isdigit():
            candidato = Candidato.objects.filter(id=int(referencia)).first()
            if candidato is None:
                candidato = Candidato.objects.filter(numero_tarjeton=int(referencia)).first()
        if candidato is None:
            raise CommandError(f'No se encontró el candidato "{referencia}".')
        return candidato

    def _mostrar(self, candidato):
        plan = getattr(candidato, 'plan_trabajo', None)
        if plan is None:
            self.stdout.write(self.style.WARNING('  Este candidato no tiene plan de trabajo.'))
            return
        self.stdout.write(f'  Título: {plan.titulo}')
        self.stdout.write(f'  Eslogan: {plan.eslogan or "(sin eslogan)"}')
        self.stdout.write(f'  Campos de la tarjeta: {len(candidato.propuesta or "")} caracteres')
        self.stdout.write('  Secciones:')
        for item in plan.secciones or []:
            sangria = '    ' if item.get('nivel', 1) > 1 else '  '
            tipos = ', '.join(bloque.get('tipo', '?') for bloque in item.get('bloques', []))
            etiqueta = f" [{item['proyecto']}]" if item.get('proyecto') else ''
            self.stdout.write(
                f"{sangria}{item.get('numero', '')} {item.get('titulo', '')}{etiqueta} "
                f"-> {tipos}"
            )
