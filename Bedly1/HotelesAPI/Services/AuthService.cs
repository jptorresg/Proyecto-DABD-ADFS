using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;
using HotelesAPI.Utils;

namespace HotelesAPI.Services
{
    public class AuthService
    {
        private readonly UsuarioDAO _usuarioDAO;

        public AuthService()
        {
            _usuarioDAO = new UsuarioDAO();
        }

        public Usuario Login(string email, string password)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                throw new ArgumentException("Email y contraseña son requeridos");

            var usuario = _usuarioDAO.FindByEmail(email)
                ?? throw new ArgumentException("Usuario no encontrado");

            if (!usuario.Activo)
                throw new ArgumentException("Usuario inactivo");

            if (string.IsNullOrEmpty(usuario.PasswordHash))
                throw new ArgumentException("Error en credenciales del usuario");

            if (!PasswordUtil.VerifyPassword(password, usuario.PasswordHash))
                throw new ArgumentException("Contraseña incorrecta");

            usuario.PasswordHash = null;
            return usuario;
        }

        public Usuario Registrar(RegistroDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email) || !dto.Email.Contains("@"))
                throw new ArgumentException("Email inválido");

            if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < 8)
                throw new ArgumentException("La contraseña debe tener al menos 8 caracteres");

            if (string.IsNullOrEmpty(dto.Nombre))
                throw new ArgumentException("El nombre es requerido");

            if (string.IsNullOrEmpty(dto.Apellidos))
                throw new ArgumentException("Los apellidos son requeridos");

            if (dto.Edad < 18 || dto.Edad > 120)
                throw new ArgumentException("La edad debe estar entre 18 y 120 años");

            if (string.IsNullOrEmpty(dto.Pais))
                throw new ArgumentException("El país es requerido");

            if (string.IsNullOrEmpty(dto.Pasaporte))
                throw new ArgumentException("El pasaporte o DPI es requerido");

            if (_usuarioDAO.FindByEmail(dto.Email) != null)
                throw new ArgumentException("El email ya está registrado");

            var usuario = new Usuario
            {
                Nombre = dto.Nombre,
                Apellidos = dto.Apellidos,
                Email = dto.Email,
                PasswordHash = PasswordUtil.HashPassword(dto.Password),
                Telefono = dto.Telefono,
                Edad = dto.Edad,
                Pais = dto.Pais,
                Pasaporte = dto.Pasaporte,
                Rol = dto.Rol
            };

            int idCreado = _usuarioDAO.Create(usuario);

            var usuarioCreado = _usuarioDAO.FindById(idCreado)
                ?? throw new Exception("Error al crear el usuario");

            usuarioCreado.PasswordHash = null;
            return usuarioCreado;
        }
    }
}