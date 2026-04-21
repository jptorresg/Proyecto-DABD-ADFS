resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
        const prov   = proveedores[i];
        const status = r.reason?.response?.status;
        const body   = r.reason?.response?.data?.message;
        console.error(
            `[Search] Proveedor hotel ${prov.id_proveedor} (${prov.nombre ?? '?'}) fallo` +
            (status ? ` [HTTP ${status}]` : '') + ':',
            body || r.reason?.message
        );
    }
});