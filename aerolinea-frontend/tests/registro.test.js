// registro.test.js

// ============================
// MOCKS GLOBALES
// ============================

global.showNotification = jest.fn();
global.redirectIfAuthenticated = jest.fn();

global.API_BASE = "http://localhost:8080/api";

// Mock fetch
global.fetch = jest.fn();

// ============================
// IMPORTAR FUNCION
// ============================

const { registroData } = require('../js/registro.js');

// ============================
// TEST SUITE
// ============================

describe("registroData Alpine component", () => {

    let data;

    beforeEach(() => {
        jest.clearAllMocks();
        data = registroData();
    });

    // =========================
    // PASSWORD STRENGTH
    // =========================
    test("passwordStrength debe ser weak si < 8 chars", () => {
        data.formData.password = "123";
        expect(data.passwordStrength).toBe("weak");
    });

    test("passwordStrength debe ser medium si < 12 chars", () => {
        data.formData.password = "12345678";
        expect(data.passwordStrength).toBe("medium");
    });

    test("passwordStrength debe ser strong si >= 12 chars", () => {
        data.formData.password = "123456789012";
        expect(data.passwordStrength).toBe("strong");
    });

    // =========================
    // PASSWORD MATCH
    // =========================
    test("passwordsMatch debe ser true cuando coinciden", () => {
        data.formData.password = "abc12345";
        data.formData.confirmPassword = "abc12345";

        expect(data.passwordsMatch).toBe(true);
    });

    test("passwordsMatch debe ser false cuando no coinciden", () => {
        data.formData.password = "abc12345";
        data.formData.confirmPassword = "otro";

        expect(data.passwordsMatch).toBe(false);
    });

    // =========================
    // CAPTCHA
    // =========================
    test("generateCaptcha debe generar números válidos", () => {
        data.generateCaptcha();

        expect(data.captcha.num1).toBeGreaterThan(0);
        expect(data.captcha.num2).toBeGreaterThan(0);
        expect(["+", "-", "×"]).toContain(data.captcha.operation);
    });

    // =========================
    // VALIDACIONES submitRegistro
    // =========================
    test("debe mostrar error si campos están vacíos", async () => {
        await data.submitRegistro();

        expect(showNotification).toHaveBeenCalledWith(
            "Por favor completa todos los campos obligatorios",
            "error"
        );
    });

    test("debe fallar si passwords no coinciden", async () => {
        data.formData.email = "test@test.com";
        data.formData.password = "12345678";
        data.formData.confirmPassword = "99999999";
        data.formData.nombres = "Juan";
        data.formData.apellidos = "Perez";
        data.formData.edad = "20";
        data.formData.codigoPais = "GT";
        data.formData.numPasaporte = "A123456";

        await data.submitRegistro();

        expect(showNotification).toHaveBeenCalledWith(
            "Las contraseñas no coinciden",
            "error"
        );
    });

    test("debe fallar si contraseña es corta", async () => {
        data.formData.password = "123";
        data.formData.confirmPassword = "123";

        data.formData.email = "test@test.com";
        data.formData.nombres = "Juan";
        data.formData.apellidos = "Perez";
        data.formData.edad = "20";
        data.formData.codigoPais = "GT";
        data.formData.numPasaporte = "A123456";

        await data.submitRegistro();

        expect(showNotification).toHaveBeenCalledWith(
            "La contraseña debe tener al menos 8 caracteres",
            "error"
        );
    });

    test("debe fallar si CAPTCHA es incorrecto", async () => {
        data.formData = {
            email: "test@test.com",
            password: "12345678",
            confirmPassword: "12345678",
            nombres: "Juan",
            apellidos: "Perez",
            edad: "20",
            codigoPais: "GT",
            numPasaporte: "A123456"
        };

        data.captcha.correctAnswer = 10;
        data.captcha.answer = "999";

        await data.submitRegistro();

        expect(showNotification).toHaveBeenCalledWith(
            "Respuesta CAPTCHA incorrecta",
            "error"
        );
    });

    // =========================
    // SUCCESS FETCH
    // =========================
    test("debe registrar usuario correctamente", async () => {

        // mock response
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });

        data.formData = {
            email: "test@test.com",
            password: "12345678",
            confirmPassword: "12345678",
            nombres: "Juan",
            apellidos: "Perez",
            edad: "20",
            codigoPais: "GT",
            numPasaporte: "A123456"
        };

        data.captcha.correctAnswer = 5;
        data.captcha.answer = "5";
        data.termsAccepted = true;

        await data.submitRegistro();

        expect(fetch).toHaveBeenCalled();
        expect(showNotification).toHaveBeenCalledWith(
            "¡Registro exitoso! Redirigiendo al login...",
            "success"
        );
    });

});