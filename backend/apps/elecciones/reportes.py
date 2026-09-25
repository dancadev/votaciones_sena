"""Genera el acta de resultados electorales en PDF.

Usa ReportLab con una fuente TrueType del sistema para que los nombres con
tildes y eñes salgan correctos (Helvetica no cubre bien esos caracteres).

El documento incluye encabezado institucional, datos de la jornada, cifras
clave, gráfico de barras, tabla de escrutinio con porcentajes, ganador y notas
al pie.
"""

import io
import os

from django.db.models import Count
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .models import Candidato, EstadoElectoral

# Colores institucionales (los mismos del frontend).
VERDE = colors.HexColor('#39A900')
AZUL = colors.HexColor('#00324D')
GRIS = colors.HexColor('#64748B')
GRIS_CLARO = colors.HexColor('#E2E8F0')
GRIS_FONDO = colors.HexColor('#F4F6F8')

MARGEN = 48
ANCHO, ALTO = A4
ANCHO_UTIL = ANCHO - 2 * MARGEN

#: Fuentes del sistema con soporte Unicode; se usa la primera que exista.
FUENTES_CANDIDATAS = [
    ('Arial', r'C:\Windows\Fonts\arial.ttf', r'C:\Windows\Fonts\arialbd.ttf'),
    ('Verdana', r'C:\Windows\Fonts\verdana.ttf', r'C:\Windows\Fonts\verdanab.ttf'),
    ('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
     '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
]

FUENTE_POR_DEFECTO = 'Helvetica'
NEGRITA_POR_DEFECTO = 'Helvetica-Bold'


def _registrar_fuentes():
    """Registra una fuente Unicode y devuelve (normal, negrita)."""
    for nombre, ruta_normal, ruta_negrita in FUENTES_CANDIDATAS:
        if os.path.exists(ruta_normal) and os.path.exists(ruta_negrita):
            try:
                pdfmetrics.registerFont(TTFont(nombre, ruta_normal))
                pdfmetrics.registerFont(TTFont(f'{nombre}-Bold', ruta_negrita))
                return nombre, f'{nombre}-Bold'
            except Exception:  # fuente dañada o bloqueada: se prueba la siguiente
                continue
    return FUENTE_POR_DEFECTO, NEGRITA_POR_DEFECTO


def _porcentaje(votos, total):
    if not total:
        return '0,0 %'
    return f'{votos / total * 100:.1f} %'.replace('.', ',')


def _formato_fecha(valor):
    if not valor:
        return '—'
    return timezone.localtime(valor).strftime('%d/%m/%Y %H:%M')


def _recortar(pdf, texto, fuente, tamano, ancho):
    """Acorta un texto con puntos suspensivos si no cabe en el ancho dado."""
    texto = str(texto)
    if pdf.stringWidth(texto, fuente, tamano) <= ancho:
        return texto
    while texto and pdf.stringWidth(f'{texto}…', fuente, tamano) > ancho:
        texto = texto[:-1]
    return f'{texto}…' if texto else ''


def datos_escrutinio():
    """Candidatos con su total de votos, ordenados de mayor a menor."""
    return [
        {
            'id': candidato.id,
            'nombre': candidato.nombre,
            'numero_tarjeton': candidato.numero_tarjeton,
            'es_voto_blanco': candidato.es_voto_blanco,
            'activo': candidato.activo,
            'votos': candidato.total_votos,
        }
        for candidato in Candidato.objects.annotate(total_votos=Count('votos')).order_by(
            '-total_votos', 'numero_tarjeton'
        )
    ]


def _obtener_estado():
    """Estado de la jornada.

    Se consulta aquí y no en `views` para no crear una importación circular
    (`views` importa este módulo para generar el PDF).
    """
    estado, _ = EstadoElectoral.objects.get_or_create(id=1)
    return estado


def construir_pdf_resultados():
    """Devuelve el PDF del escrutinio como bytes."""
    fuente, fuente_negrita = _registrar_fuentes()
    estado = _obtener_estado()
    candidatos = datos_escrutinio()
    total_votos = sum(candidato['votos'] for candidato in candidatos)

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle('Resultados electorales · Representante de Aprendices SENA')
    pdf.setAuthor('Sistema de Votaciones SENA')
    pdf.setSubject('Acta de escrutinio')

    # ------------------------------------------------------------- Encabezado
    pdf.setFillColor(AZUL)
    pdf.rect(0, ALTO - 104, ANCHO, 104, stroke=0, fill=1)

    pdf.setFillColor(colors.white)
    pdf.setFont(fuente_negrita, 15)
    pdf.drawString(MARGEN, ALTO - 44, 'SERVICIO NACIONAL DE APRENDIZAJE — SENA')
    pdf.setFillColor(colors.HexColor('#CBD5E1'))
    pdf.setFont(fuente, 10)
    pdf.drawString(MARGEN, ALTO - 60, 'Centro Internacional de Producción Limpia Lope · Regional Nariño')

    pdf.setFillColor(colors.white)
    pdf.setFont(fuente_negrita, 13)
    pdf.drawString(MARGEN, ALTO - 84, 'Acta de resultados · Representante de Aprendices')

    pdf.setFillColor(VERDE)
    pdf.rect(0, ALTO - 112, ANCHO, 8, stroke=0, fill=1)

    y = ALTO - 150

    # -------------------------------------------------------- Datos de la jornada
    pdf.setFillColor(AZUL)
    pdf.setFont(fuente_negrita, 11)
    pdf.drawString(MARGEN, y, 'Datos de la jornada')
    y -= 6
    pdf.setStrokeColor(GRIS_CLARO)
    pdf.setLineWidth(0.6)
    pdf.line(MARGEN, y, ANCHO - MARGEN, y)
    y -= 16

    for etiqueta, valor in (
        ('Estado de la jornada', 'En curso' if estado.is_activa else 'Cerrada'),
        ('Hora límite de votación', estado.hora_cierre_votacion.strftime('%H:%M')
         if estado.hora_cierre_votacion else '—'),
        ('Fecha de cierre', _formato_fecha(estado.fecha_cierre)),
        ('Escrutinio generado', _formato_fecha(timezone.now())),
        ('Resultados publicados a los votantes', 'Sí' if estado.resultados_publicos else 'No'),
    ):
        pdf.setFillColor(GRIS)
        pdf.setFont(fuente, 9.5)
        pdf.drawString(MARGEN, y, etiqueta)
        pdf.setFillColor(AZUL)
        pdf.setFont(fuente_negrita, 9.5)
        pdf.drawString(MARGEN + 210, y, valor)
        y -= 14

    y -= 14

    # ------------------------------------------------------------ Cifras clave
    tarjetas = [
        ('Total de votos', str(total_votos)),
        ('Candidatos en el tarjetón', str(sum(1 for c in candidatos if not c['es_voto_blanco']))),
    ]
    ancho_tarjeta = (ANCHO_UTIL - 12) / len(tarjetas)
    for indice, (etiqueta, valor) in enumerate(tarjetas):
        x = MARGEN + indice * (ancho_tarjeta + 12)
        pdf.setFillColor(GRIS_FONDO)
        pdf.roundRect(x, y - 46, ancho_tarjeta, 46, 6, stroke=0, fill=1)
        pdf.setFillColor(AZUL)
        pdf.setFont(fuente_negrita, 20)
        pdf.drawCentredString(x + ancho_tarjeta / 2, y - 24, valor)
        pdf.setFillColor(GRIS)
        pdf.setFont(fuente, 8)
        pdf.drawCentredString(x + ancho_tarjeta / 2, y - 38, etiqueta.upper())
    y -= 68

    # ------------------------------------------------------------------ Gráfico
    if candidatos:
        pdf.setFillColor(AZUL)
        pdf.setFont(fuente_negrita, 11)
        pdf.drawString(MARGEN, y, 'Votación por opción')
        y -= 6
        pdf.setStrokeColor(GRIS_CLARO)
        pdf.line(MARGEN, y, ANCHO - MARGEN, y)
        y -= 16

        maximo = max((c['votos'] for c in candidatos), default=0) or 1
        ancho_etiqueta = 150
        ancho_barra = ANCHO_UTIL - ancho_etiqueta - 70

        for candidato in candidatos:
            etiqueta = _recortar(
                pdf, candidato['nombre'] or 'Cupo sin candidato', fuente, 8.5, ancho_etiqueta - 8
            )
            pdf.setFillColor(GRIS if candidato['es_voto_blanco'] else AZUL)
            pdf.setFont(fuente, 8.5)
            pdf.drawString(MARGEN, y, etiqueta)

            pdf.setFillColor(GRIS_FONDO)
            pdf.roundRect(MARGEN + ancho_etiqueta, y - 3, ancho_barra, 10, 3, stroke=0, fill=1)

            pdf.setFillColor(GRIS if candidato['es_voto_blanco'] else VERDE)
            pdf.roundRect(
                MARGEN + ancho_etiqueta, y - 3,
                max(2, ancho_barra * candidato['votos'] / maximo), 10, 3, stroke=0, fill=1,
            )

            pdf.setFillColor(AZUL)
            pdf.setFont(fuente_negrita, 8.5)
            pdf.drawRightString(
                ANCHO - MARGEN, y,
                f"{candidato['votos']}  ({_porcentaje(candidato['votos'], total_votos)})",
            )
            y -= 20

        y -= 14

    # -------------------------------------------------------------------- Tabla
    pdf.setFillColor(AZUL)
    pdf.setFont(fuente_negrita, 11)
    pdf.drawString(MARGEN, y, 'Escrutinio detallado')
    y -= 8
    pdf.setStrokeColor(GRIS_CLARO)
    pdf.line(MARGEN, y, ANCHO - MARGEN, y)
    y -= 20

    columnas = [
        ('#', 30, 'izquierda'),
        ('Candidato', ANCHO_UTIL - 30 - 62 - 76 - 92, 'izquierda'),
        ('Votos', 62, 'derecha'),
        ('Porcentaje', 76, 'derecha'),
        ('Estado', 92, 'izquierda'),
    ]
    posiciones = []
    acumulado = MARGEN
    for _, ancho, _ in columnas:
        posiciones.append(acumulado)
        acumulado += ancho

    pdf.setFillColor(AZUL)
    pdf.rect(MARGEN, y - 4, ANCHO_UTIL, 18, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont(fuente_negrita, 9)
    for (titulo, ancho, alineacion), x in zip(columnas, posiciones):
        if alineacion == 'derecha':
            pdf.drawRightString(x + ancho - 8, y + 2, titulo)
        else:
            pdf.drawString(x + 6, y + 2, titulo)
    y -= 20

    for indice, candidato in enumerate(candidatos):
        if indice % 2 == 0:
            pdf.setFillColor(GRIS_FONDO)
            pdf.rect(MARGEN, y - 4, ANCHO_UTIL, 16, stroke=0, fill=1)

        pdf.setFillColor(AZUL)
        pdf.setFont(fuente, 9)
        pdf.drawString(
            posiciones[0] + 6, y,
            'VB' if candidato['es_voto_blanco'] else f"#{candidato['numero_tarjeton']}",
        )

        pdf.drawString(
            posiciones[1] + 6, y,
            _recortar(pdf, candidato['nombre'] or 'Cupo sin candidato', fuente, 9, columnas[1][1] - 12),
        )

        pdf.setFont(fuente_negrita, 9)
        pdf.drawRightString(posiciones[2] + columnas[2][1] - 8, y, str(candidato['votos']))

        pdf.setFont(fuente, 9)
        pdf.drawRightString(
            posiciones[3] + columnas[3][1] - 8, y,
            _porcentaje(candidato['votos'], total_votos),
        )

        pdf.setFillColor(GRIS)
        pdf.setFont(fuente, 8)
        pdf.drawString(
            posiciones[4] + 6, y,
            'En tarjetón' if candidato['activo'] else 'Fuera del tarjetón',
        )

        y -= 16

    pdf.setStrokeColor(GRIS_CLARO)
    pdf.line(MARGEN, y + 8, ANCHO - MARGEN, y + 8)

    # ------------------------------------------------------------------ Ganador
    ganador = next((c for c in candidatos if not c['es_voto_blanco']), None)
    if ganador and total_votos:
        y -= 20
        pdf.setFillColor(VERDE)
        pdf.roundRect(MARGEN, y - 46, ANCHO_UTIL, 46, 8, stroke=0, fill=1)
        pdf.setFillColor(colors.white)
        pdf.setFont(fuente_negrita, 8)
        pdf.drawString(MARGEN + 14, y - 15, 'MAYOR VOTACIÓN')
        pdf.setFont(fuente_negrita, 14)
        pdf.drawString(
            MARGEN + 14, y - 33,
            _recortar(pdf, ganador['nombre'], fuente_negrita, 14, ANCHO_UTIL - 190),
        )
        pdf.setFont(fuente, 9)
        pdf.drawRightString(
            ANCHO - MARGEN - 14, y - 24,
            f"{ganador['votos']} votos · {_porcentaje(ganador['votos'], total_votos)}",
        )
        y -= 62

    # --------------------------------------------------------------------- Notas
    pdf.setFillColor(GRIS)
    notas = []
    if not estado.resultados_publicos:
        notas.append(
            'Los resultados aún no han sido publicados a los votantes: este documento es de uso '
            'exclusivo del administrador.'
        )
    notas += [
        'El voto es secreto: el sistema cuenta los sufragios sin asociarlos a cada votante.',
        'Cada cédula validada por el administrador puede registrar un único voto.',
        'Los votos en blanco se contabilizan como una opción más del tarjetón.',
        'Documento generado automáticamente por el Sistema de Votaciones SENA.',
    ]
    for nota in notas:
        for linea in simpleSplit(f'•  {nota}', fuente, 8, ANCHO_UTIL):
            if y < MARGEN + 26:
                break
            pdf.setFont(fuente, 8)
            pdf.drawString(MARGEN, y, linea)
            y -= 10
        y -= 4

    # ----------------------------------------------------------- Pie de página
    pdf.setStrokeColor(GRIS_CLARO)
    pdf.line(MARGEN, MARGEN + 16, ANCHO - MARGEN, MARGEN + 16)
    pdf.setFont(fuente, 7.5)
    pdf.setFillColor(GRIS)
    pdf.drawString(
        MARGEN, MARGEN + 6,
        'Sistema de Votaciones SENA · Centro Internacional de Producción Limpia Lope',
    )
    pdf.drawRightString(
        ANCHO - MARGEN, MARGEN + 6,
        f"Generado el {timezone.localtime(timezone.now()).strftime('%d/%m/%Y a las %H:%M')}",
    )

    pdf.showPage()
    pdf.save()

    return buffer.getvalue()


def nombre_archivo():
    sello = timezone.localtime(timezone.now()).strftime('%Y%m%d-%H%M')
    return f'resultados-representante-aprendices-{sello}.pdf'
