const probarConexionProveedor = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await proveedorService.probarConexionHotel(id);
        // Devolvemos siempre 200 para que el frontend pueda mostrar el diagnostico
        // sin entrar al catch. El campo `ok` indica el resultado real.
        return res.status(200).json(resultado);
    } catch (e) {
        return res.status(500).json({ ok: false, etapa: 'inesperado', mensaje: e.message });
    }
};

module.exports.probarConexionProveedor = probarConexionProveedor;