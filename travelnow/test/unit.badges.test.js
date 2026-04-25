'use strict';

/**
 * Unit Test FE — funciones badge*
 * Fuente: travelnow/views/admin/usuarios.html
 *         travelnow/views/admin/proveedores.html
 *         travelnow/views/admin/reservaciones.html
 *
 * Las funciones badgeRol, badgeEstado y badgeTipo generan fragmentos HTML
 * usados en las tablas del panel admin. Son funciones puras (string → string)
 * así que no necesitan jsdom: comparamos el HTML generado directamente.
 *
 * Para ejecutar:
 *   npx jest unit.badges.test.js
 */

// ── Funciones bajo prueba (copiadas de los <script> de las vistas) ───────────

/**
 * badgeRol — de views/admin/usuarios.html
 * Genera HTML para mostrar el rol con color según tipo.
 */
function badgeRol(rol) {
  const map = {
    administrador: '<span class="badge-custom badge-gold">Administrador</span>',
    usuario:       '<span class="badge-custom badge-blue">Usuario</span>',
    webservice:    '<span class="badge-custom badge-green">Webservice</span>',
  };
  return map[rol] || `<span class="badge-custom">${rol}</span>`;
}

/**
 * badgeEstado — de views/admin/usuarios.html y proveedores.html
 * Verde si "activo", rojo en otro caso.
 */
function badgeEstado(estado) {
  return estado === 'activo'
    ? '<span class="badge-custom badge-green">Activo</span>'
    : '<span class="badge-custom badge-red">Inactivo</span>';
}

/**
 * badgeTipo — de views/admin/proveedores.html
 * Azul con ícono de avión para aerolínea, dorado con ícono de edificio para hotel.
 */
function badgeTipo(tipo) {
  return tipo === 'aerolinea'
    ? '<span class="badge-custom badge-blue"><i class="fas fa-plane"></i> Aerolínea</span>'
    : '<span class="badge-custom badge-gold"><i class="fas fa-building"></i> Hotel</span>';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('badgeRol — badge HTML según rol de usuario', () => {

  test('rol "administrador" → badge dorado', () => {
    expect(badgeRol('administrador'))
      .toBe('<span class="badge-custom badge-gold">Administrador</span>');
  });

  test('rol "usuario" → badge azul', () => {
    expect(badgeRol('usuario'))
      .toBe('<span class="badge-custom badge-blue">Usuario</span>');
  });

  test('rol "webservice" → badge verde', () => {
    expect(badgeRol('webservice'))
      .toBe('<span class="badge-custom badge-green">Webservice</span>');
  });

  test('rol desconocido "superadmin" → badge genérico con el texto tal cual', () => {
    const html = badgeRol('superadmin');
    expect(html).toBe('<span class="badge-custom">superadmin</span>');
    expect(html).not.toContain('badge-gold');
    expect(html).not.toContain('badge-blue');
    expect(html).not.toContain('badge-green');
  });

});

describe('badgeEstado — badge HTML según estado de usuario/proveedor', () => {

  test('estado "activo" → badge verde con texto "Activo"', () => {
    expect(badgeEstado('activo'))
      .toBe('<span class="badge-custom badge-green">Activo</span>');
  });

  test('estado "inactivo" → badge rojo con texto "Inactivo"', () => {
    expect(badgeEstado('inactivo'))
      .toBe('<span class="badge-custom badge-red">Inactivo</span>');
  });

  test('cualquier otro estado → también retorna badge rojo (fallback seguro)', () => {
    expect(badgeEstado('desconocido'))
      .toBe('<span class="badge-custom badge-red">Inactivo</span>');
    expect(badgeEstado(''))
      .toBe('<span class="badge-custom badge-red">Inactivo</span>');
  });

});

describe('badgeTipo — badge HTML según tipo de proveedor', () => {

  test('tipo "aerolinea" → badge azul con ícono de avión', () => {
    const html = badgeTipo('aerolinea');
    expect(html).toContain('badge-blue');
    expect(html).toContain('fa-plane');
    expect(html).toContain('Aerolínea');
  });

  test('tipo "hotel" → badge dorado con ícono de edificio', () => {
    const html = badgeTipo('hotel');
    expect(html).toContain('badge-gold');
    expect(html).toContain('fa-building');
    expect(html).toContain('Hotel');
  });

  test('cualquier otro tipo cae en la rama "hotel" (comportamiento actual)', () => {
    // Documentamos el comportamiento real del código: el ternario solo verifica
    // si tipo === 'aerolinea', cualquier otro valor retorna la rama de Hotel.
    const html = badgeTipo('desconocido');
    expect(html).toContain('badge-gold');
    expect(html).toContain('Hotel');
  });

});