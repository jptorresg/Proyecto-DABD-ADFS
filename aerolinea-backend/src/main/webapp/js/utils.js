JavaScript
const Utils = {
    formatMoney(val) {
        return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val);
    },
    
    showNotification(msg, type = 'success') {
        // Esta función puede disparar un evento que el partial de toast escuche
        window.dispatchEvent(new CustomEvent('notify', { detail: { msg, type } }));
    }
};