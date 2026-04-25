const { loginData } = require('../js/login.js');

// ============================
// MOCKS GLOBALES
// ============================

global.showNotification = jest.fn();
global.redirectIfAuthenticated = jest.fn();
global.saveUserSession = jest.fn();

global.API_BASE = "http://localhost:8080/api";
global.BASE_PATH = "";

global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
    let store = {};

    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// ============================
// TEST SUITE
// ============================

describe("loginData Alpine component", () => {

    let data;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        data = loginData();
    });

    // =========================
    // INIT
    // =========================

    test("init debe cargar email guardado", () => {
        localStorage.setItem("rememberedEmail", "test@test.com");

        data.init();

        expect(data.email).toBe("test@test.com");
        expect(data.rememberMe).toBe(true);
    });

    test("init debe redirigir si ya está autenticado", () => {
        data.init();
        expect(redirectIfAuthenticated).toHaveBeenCalled();
    });

    // =========================
    // VALIDACIONES LOGIN
    // =========================

    test("debe mostrar error si campos vacíos", async () => {
        await data.submitLogin();

        expect(showNotification).toHaveBeenCalledWith(
            "Por favor completa todos los campos",
            "error"
        );
    });

    test("debe mostrar error si email inválido", async () => {
        data.email = "invalid-email";
        data.password = "123456";

        await data.submitLogin();

        expect(showNotification).toHaveBeenCalledWith(
            "Por favor ingresa un correo válido",
            "error"
        );
    });

    // =========================
    // LOGIN EXITOSO
    // =========================

    test("debe hacer login correctamente", async () => {

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    idUsuario: 1,
                    email: "test@test.com",
                    tipoUsuario: "USER"
                }
            })
        });

        data.email = "test@test.com";
        data.password = "123456";

        data.rememberMe = true;

        await data.submitLogin();

        expect(fetch).toHaveBeenCalled();

        expect(saveUserSession).toHaveBeenCalledWith(
            expect.objectContaining({
                idUsuario: 1
            })
        );

        expect(localStorage.setItem).toHaveBeenCalledWith(
            "rememberedEmail",
            "test@test.com"
        );

        expect(showNotification).toHaveBeenCalledWith(
            "¡Inicio de sesión exitoso!",
            "success"
        );
    });

    // =========================
    // GOOGLE LOGIN
    // =========================

    test("loginWithGoogle muestra notificación info", () => {
        data.loginWithGoogle();

        expect(showNotification).toHaveBeenCalledWith(
            "Funcionalidad de Google OAuth próximamente",
            "info"
        );
    });

    // =========================
    // RECOVERY EMAIL
    // =========================

    test("sendRecoveryEmail valida email vacío", async () => {
        await data.sendRecoveryEmail();

        expect(showNotification).toHaveBeenCalledWith(
            "Por favor ingresa tu correo",
            "error"
        );
    });

    test("sendRecoveryEmail envía correctamente", async () => {
        data.recoveryEmail = "test@test.com";

        await data.sendRecoveryEmail();

        expect(showNotification).toHaveBeenCalledWith(
            "Enlace de recuperación enviado a test@test.com",
            "success"
        );
    });

});