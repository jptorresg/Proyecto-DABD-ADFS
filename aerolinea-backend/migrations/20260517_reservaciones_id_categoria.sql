-- =============================================================================
-- Migración 20260517_reservaciones_id_categoria
-- =============================================================================
-- Agrega RESERVACIONES.ID_CATEGORIA NULL + FK a CATEGORIAS_VUELO.
--
-- Por qué: el write-side multi-categoría (POST /api/b2b/v2/reservaciones)
-- decrementa CATEGORIAS_VUELO.asientos_disponibles directamente, en vez de
-- VUELOS.asientos_disponibles como hace v1. Para que cancelar una reserva
-- pueda devolver los asientos a la categoría correcta —y no a una al azar—
-- guardamos el id_categoria en RESERVACIONES.
--
-- Aditiva y backwards-compatible:
--   - La columna es NULL. Reservas creadas por v1 quedan con ID_CATEGORIA=NULL
--     y cancelar() sigue tocando VUELOS (flujo viejo).
--   - Reservas creadas por v2 tienen ID_CATEGORIA y cancelar() devuelve a
--     CATEGORIAS_VUELO (los triggers sincronizan VUELOS).
-- =============================================================================

ALTER TABLE USUARIO_AEROLINEA.RESERVACIONES
  ADD ID_CATEGORIA NUMBER NULL;

ALTER TABLE USUARIO_AEROLINEA.RESERVACIONES
  ADD CONSTRAINT FK_RESERVACIONES_CATEGORIA
    FOREIGN KEY (ID_CATEGORIA)
    REFERENCES USUARIO_AEROLINEA.CATEGORIAS_VUELO(ID_CATEGORIA);

CREATE INDEX IDX_RESERVACIONES_CATEGORIA
  ON USUARIO_AEROLINEA.RESERVACIONES(ID_CATEGORIA);

COMMIT;
