'use strict';

/**
 * Unit Test FE — renderVueloCard
 * Fuente: travelnow/views/buscar.html
 *
 * renderVueloCard recibe los datos de un vuelo y un URLSearchParams de la búsqueda
 * original, y devuelve el HTML de la tarjeta de resultado. Verificamos:
 *   - El precio se muestra formateado con 2 decimales
 *   - Origen y destino aparecen en el HTML
 *   - El link de "Seleccionar" apunta a /checkout con los parámetros correctos
 *   - El nombre del proveedor aparece; si no existe, cae al texto por defecto
 *
 * Para ejecutar:
 *   npx jest unit.renderVueloCard.test.js
 */

// ── Función bajo prueba (copiada de views/buscar.html) ───────────────────────
function renderVueloCard(v, sp) {
  const precio  = v.precio_agencia || 0;
  const asiento = v.tipo_asiento   || '—';

  const detalleParams = new URLSearchParams({
    tipo:         'vuelo',
    id_vuelo:     v.id_vuelo     || '',
    id_proveedor: v.id_proveedor || '',
  });
  const checkoutParams = new URLSearchParams({
    tipo:         'vuelo',
    id_vuelo:     v.id_vuelo     || '',
    id_proveedor: v.id_proveedor || '',
    precio,
    asiento,
    origen:       v.origen_iata  || v.origen_ciudad  || sp.get('origen')  || '',
    destino:      v.destino_iata || v.destino_ciudad || sp.get('destino') || '',
    fecha_salida: v.fecha_salida || sp.get('fecha_salida') || '',
    num_pasajeros: sp.get('num_pasajeros') || 1,
  });

  return `<div class="result-card mb-3">
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <span class="result-tag">
          <i class="fa-solid fa-plane me-1"></i>${v.nombre_proveedor || 'Aerolínea'}
        </span>
        <div class="mt-2" style="font-size:0.95rem;color:var(--cream);">
          ${v.origen_ciudad || ''} <i class="fa-solid fa-arrow-right mx-2" style="color:var(--gold)"></i> ${v.destino_ciudad || ''}
        </div>
        <div style="font-size:0.82rem;color:var(--text-muted);">${asiento} · ${v.asientos_disponibles || ''} disponibles</div>
      </div>
      <div class="text-end">
        <div class="result-price">$${precio.toFixed(2)}<small>/persona</small></div>
        <a href="/detalle-vuelo?${detalleParams}"  class="btn-ver  mt-2 d-inline-block me-1">Ver detalles <i class="fa-solid fa-info-circle ms-1"></i></a>
        <a href="/checkout?${checkoutParams}" class="btn-reservar mt-2 d-inline-block">Seleccionar <i class="fa-solid fa-arrow-right ms-1"></i></a>
      </div>
    </div>
  </div>`;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const vueloEjemplo = {
  id_vuelo:              'V-123',
  id_proveedor:           3,
  nombre_proveedor:      'AeroGuatemala',
  precio_agencia:         450.5,
  tipo_asiento:          'turista',
  origen_ciudad:         'Guatemala',
  destino_ciudad:        'Miami',
  origen_iata:           'GUA',
  destino_iata:          'MIA',
  fecha_salida:          '2026-06-15',
  asientos_disponibles:   28,
};

const searchParamsEjemplo = new URLSearchParams({
  origen:        'GUA',
  destino:       'MIA',
  fecha_salida:  '2026-06-15',
  num_pasajeros: '2',
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('renderVueloCard — tarjeta HTML de resultado de vuelo', () => {

  test('precio se formatea con dos decimales', () => {
    const html = renderVueloCard(vueloEjemplo, searchParamsEjemplo);
    expect(html).toContain('$450.50');
    expect(html).toContain('/persona');
  });

  test('muestra origen, destino y nombre del proveedor', () => {
    const html = renderVueloCard(vueloEjemplo, searchParamsEjemplo);
    expect(html).toContain('Guatemala');
    expect(html).toContain('Miami');
    expect(html).toContain('AeroGuatemala');
    expect(html).toContain('turista');
  });

  test('el link "Seleccionar" apunta a /checkout con todos los parámetros correctos', () => {
    const html = renderVueloCard(vueloEjemplo, searchParamsEjemplo);

    // Extraer el href del checkout con un regex simple
    const match = html.match(/href="\/checkout\?([^"]+)"/);
    expect(match).not.toBeNull();

    const checkoutParams = new URLSearchParams(match[1]);
    expect(checkoutParams.get('tipo')).toBe('vuelo');
    expect(checkoutParams.get('id_vuelo')).toBe('V-123');
    expect(checkoutParams.get('id_proveedor')).toBe('3');
    expect(checkoutParams.get('precio')).toBe('450.5');
    expect(checkoutParams.get('asiento')).toBe('turista');
    expect(checkoutParams.get('origen')).toBe('GUA');
    expect(checkoutParams.get('destino')).toBe('MIA');
    expect(checkoutParams.get('fecha_salida')).toBe('2026-06-15');
    expect(checkoutParams.get('num_pasajeros')).toBe('2');
  });

  test('si no hay nombre_proveedor, usa el texto por defecto "Aerolínea"', () => {
    const vueloSinProveedor = { ...vueloEjemplo, nombre_proveedor: undefined };
    const html = renderVueloCard(vueloSinProveedor, searchParamsEjemplo);
    expect(html).toContain('Aerolínea');
    expect(html).not.toContain('AeroGuatemala');
  });

});