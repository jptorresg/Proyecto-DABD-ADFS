using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;
using HotelesAPI.Utils;

namespace HotelesAPI.Services
{
    public class UsuarioService
    {
        private readonly UsuarioDAO _usuarioDAO;

        public UsuarioService()
        {
            _usuarioDAO = new UsuarioDAO();
        }

        public Usuario GetById(int id)
        {
            var usuario = _usuarioDAO.FindById(id)
                ?? throw new ArgumentException("Usuario no encontrado");

            usuario.PasswordHash = null;
            return usuario;
        }

        public Usuario Actualizar(int id, UsuarioDto dto)
        {
            var usuario = _usuarioDAO.FindById(id)
                ?? throw new ArgumentException("Usuario no encontrado");

            if (string.IsNullOrEmpty(dto.Nombre))
                throw new ArgumentException("El nombre es requerido");

            if (string.IsNullOrEmpty(dto.Email) || !dto.Email.Contains("@"))
                throw new ArgumentException("Email inválido");

            // Verificar que el email no lo use otro usuario
            var existeEmail = _usuarioDAO.FindByEmail(dto.Email);
            if (existeEmail != null && existeEmail.IdUsuario != id)
                throw new ArgumentException("El email ya está en uso por otro usuario");

            usuario.Nombre = dto.Nombre;
            usuario.Email = dto.Email;
            usuario.Telefono = dto.Telefono;

            _usuarioDAO.Update(usuario);

            var actualizado = _usuarioDAO.FindById(id)!;
            actualizado.PasswordHash = null;
            return actualizado;
        }

        public bool CambiarPassword(int id, CambiarPasswordDto dto)
        {
            var usuario = _usuarioDAO.FindById(id)
                ?? throw new ArgumentException("Usuario no encontrado");

            if (!PasswordUtil.VerifyPassword(dto.PasswordActual, usuario.PasswordHash!))
                throw new ArgumentException("La contraseña actual es incorrecta");

            if (dto.PasswordNuevo.Length < 8)
                throw new ArgumentException("La nueva contraseña debe tener al menos 8 caracteres");

            usuario.PasswordHash = PasswordUtil.HashPassword(dto.PasswordNuevo);
            return _usuarioDAO.Update(usuario);
        }
    }
}