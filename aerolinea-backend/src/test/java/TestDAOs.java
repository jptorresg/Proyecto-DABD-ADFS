package com.halcon.aerolineas.test;

import java.sql.SQLException;
import java.util.List;

import com.halcon.aerolineas.dao.PaisDAO;
import com.halcon.aerolineas.dao.ReservacionDAO;
import com.halcon.aerolineas.dao.UsuarioDAO;
import com.halcon.aerolineas.dao.VueloDAO;
import com.halcon.aerolineas.models.Pais;
import com.halcon.aerolineas.models.Reservacion;
import com.halcon.aerolineas.models.Usuario;
import com.halcon.aerolineas.models.Vuelo;

public class TestDAOs {
    
    public static void main(String[] args) {
        System.out.println("╔════════════════════════════════════════╗");
        System.out.println("║   TEST DE DAOs - Aerolíneas Halcón    ║");
        System.out.println("╚════════════════════════════════════════╝\n");
        
        testPaisDAO();
        testUsuarioDAO();
        testVueloDAO();
        testReservacionDAO();
        
        System.out.println("\n╔════════════════════════════════════════╗");
        System.out.println("║         ✅ TESTS COMPLETADOS           ║");
        System.out.println("╚════════════════════════════════════════╝");
    }
    
    private static void testPaisDAO() {
        System.out.println("─── TEST 1: PaisDAO ───");
        try {
            PaisDAO dao = new PaisDAO();
            List<Pais> paises = dao.findAll();
            System.out.println("✅ Total países: " + paises.size());
            
            Pais guatemala = dao.findByAlfa2("GT");
            if (guatemala != null) {
                System.out.println("✅ País GT: " + guatemala.getName() + " (ID: " + guatemala.getId() + ")");
            }
        } catch (SQLException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
        System.out.println();
    }
    
    private static void testUsuarioDAO() {
        System.out.println("─── TEST 2: UsuarioDAO ───");
        try {
            UsuarioDAO dao = new UsuarioDAO();
            Usuario admin = dao.findByEmail("admin@halcon.com");
            
            if (admin != null) {
                System.out.println("✅ Usuario encontrado:");
                System.out.println("   Email: " + admin.getEmail());
                System.out.println("   Nombre: " + admin.getNombres() + " " + admin.getApellidos());
                System.out.println("   País: " + admin.getNombrePais() + " (" + admin.getCodigoPais() + ")");
                System.out.println("   Tipo: " + admin.getTipoUsuario());
            } else {
                System.out.println("❌ Usuario no encontrado");
            }
        } catch (SQLException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
        System.out.println();
    }
    
    private static void testVueloDAO() {
        System.out.println("─── TEST 3: VueloDAO ───");
        try {
            VueloDAO dao = new VueloDAO();
            
            // Buscar vuelos Guatemala → México
            List<Vuelo> vuelos = dao.buscarVuelos("GUA", "MEX", null, "TURISTA");
            System.out.println("✅ Vuelos GUA→MEX (Turista): " + vuelos.size());
            
            if (!vuelos.isEmpty()) {
                Vuelo v = vuelos.get(0);
                System.out.println("   Primer vuelo: " + v.getCodigoVuelo());
                System.out.println("   Precio: Q" + v.getPrecioBase());
                System.out.println("   Asientos disponibles: " + v.getAsientosDisponibles());
            }
        } catch (SQLException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
        System.out.println();
    }
    
    private static void testReservacionDAO() {
        System.out.println("─── TEST 4: ReservacionDAO ───");
        try {
            ReservacionDAO dao = new ReservacionDAO();
            
            // Buscar reservaciones del usuario ID 2
            List<Reservacion> reservaciones = dao.findByUsuario(2L);
            System.out.println("✅ Reservaciones usuario #2: " + reservaciones.size());
            
            if (!reservaciones.isEmpty()) {
                Reservacion r = reservaciones.get(0);
                System.out.println("   Código: " + r.getCodigoReservacion());
                System.out.println("   Pasajeros: " + r.getNumPasajeros());
                System.out.println("   Total: Q" + r.getPrecioTotal());
            }
        } catch (SQLException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
        System.out.println();
    }
}