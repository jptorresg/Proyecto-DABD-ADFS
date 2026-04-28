// ===================================
// PÁGINAS INFORMATIVAS - Alpine Data
// Aerolíneas Halcón
// ===================================

// ---- Check-in & Abordaje ----
document.addEventListener('alpine:init', () => {

    Alpine.data('checkinPage', () => ({
        activeTab: 'online',
        tabs: [
            { id: 'online',    label: 'Check-in Online',    icon: 'fa-laptop' },
            { id: 'airport',   label: 'En Aeropuerto',      icon: 'fa-building' },
            { id: 'abordaje',  label: 'Reglas de Abordaje', icon: 'fa-plane-departure' },
        ],
        setTab(id) { this.activeTab = id; },
        isActive(id) { return this.activeTab === id; }
    }));

    // ---- Destinos ----
    Alpine.data('destinosPage', () => ({
        activeFilter: 'todos',
        filters: ['todos', 'América', 'Europa', 'Asia', 'Caribe'],
        destinos: [
            { city: 'Nueva York',    country: 'Estados Unidos', region: 'América del Norte', tags: ['Cultura','Negocios','Gastronomía'], price: 'Desde $389', img: 'https://images.unsplash.com/photo-1492581948879-c71f1c0b22ae?w=600&q=80', filter: 'América' },
            { city: 'París',         country: 'Francia',        region: 'Europa Occidental', tags: ['Romance','Arte','Moda'],           price: 'Desde $520', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', filter: 'Europa' },
            { city: 'Tokio',         country: 'Japón',          region: 'Asia Oriental',     tags: ['Tecnología','Cultura','Sushi'],    price: 'Desde $780', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80', filter: 'Asia' },
            { city: 'Cancún',        country: 'México',         region: 'Caribe',            tags: ['Playa','Todo Incluido','Ocio'],    price: 'Desde $210', img: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=600&q=80', filter: 'Caribe' },
            { city: 'Barcelona',     country: 'España',         region: 'Europa Mediterránea',tags: ['Arquitectura','Playa','Cultura'], price: 'Desde $490', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', filter: 'Europa' },
            { city: 'Miami',         country: 'Estados Unidos', region: 'América del Norte', tags: ['Playa','Vida nocturna','Arte'],    price: 'Desde $180', img: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80', filter: 'América' },
            { city: 'Bali',          country: 'Indonesia',      region: 'Asia Sudoriental',  tags: ['Naturaleza','Espiritualidad','Surf'],price:'Desde $650',img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', filter: 'Asia' },
            { city: 'Punta Cana',    country: 'Rep. Dominicana',region: 'Caribe',            tags: ['Playa','Resort','Snorkel'],        price: 'Desde $240', img: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80', filter: 'Caribe' },
            { city: 'Buenos Aires',  country: 'Argentina',      region: 'América del Sur',   tags: ['Tango','Gastronomía','Teatro'],    price: 'Desde $310', img: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&q=80', filter: 'América' },
        ],
        get filteredDestinos() {
            if (this.activeFilter === 'todos') return this.destinos;
            return this.destinos.filter(d => d.filter === this.activeFilter);
        },
        setFilter(f) { this.activeFilter = f; }
    }));

    // ---- Hoteles ----
    Alpine.data('hotelesPage', () => ({
        hoteles: [
            {
                name: 'Grand Halcón Tower',
                location: 'Nueva York, EE.UU.',
                stars: 5,
                desc: 'Ubicado en el corazón de Manhattan con vistas panorámicas a Central Park. Lujo redefinido.',
                amenities: ['wifi','pool','spa','restaurant','gym','parking'],
                discount: '20% OFF con vuelo',
                img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'
            },
            {
                name: 'Halcón Riviera Cancún',
                location: 'Cancún, México',
                stars: 5,
                desc: 'Resort todo incluido frente al mar Caribe. Gastronomía, entretenimiento y playa sin límites.',
                amenities: ['wifi','pool','spa','restaurant','beach','bar'],
                discount: '25% OFF con vuelo',
                img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80'
            },
            {
                name: 'Le Halcón Paris',
                location: 'París, Francia',
                stars: 4,
                desc: 'Boutique hotel a metros de los Campos Elíseos. Diseño parisino y servicio excepcional.',
                amenities: ['wifi','restaurant','bar','gym','concierge'],
                discount: '15% OFF con vuelo',
                img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80'
            },
            {
                name: 'Halcón Barcelona Suites',
                location: 'Barcelona, España',
                stars: 4,
                desc: 'En el Passeig de Gràcia, rodeado de la arquitectura modernista de Gaudí. Terraza con vistas.',
                amenities: ['wifi','pool','restaurant','bar','rooftop'],
                discount: '18% OFF con vuelo',
                img: 'https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=600&q=80'
            },
            {
                name: 'Tokyo Halcón Garden',
                location: 'Tokio, Japón',
                stars: 5,
                desc: 'Fusión perfecta de modernidad japonesa y hospitalidad tradicional. Jardín zen privado.',
                amenities: ['wifi','spa','restaurant','gym','onsen'],
                discount: '22% OFF con vuelo',
                img: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80'
            },
            {
                name: 'Halcón Miami Beach',
                location: 'Miami, EE.UU.',
                stars: 4,
                desc: 'En Ocean Drive, con acceso directo a la playa y vibrante vida nocturna de South Beach.',
                amenities: ['wifi','pool','beach','bar','gym','parking'],
                discount: '12% OFF con vuelo',
                img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'
            },
        ],
        amenityIcon(code) {
            const map = {
                wifi:'fa-wifi', pool:'fa-water', spa:'fa-spa', restaurant:'fa-utensils',
                gym:'fa-dumbbell', parking:'fa-car', beach:'fa-umbrella-beach',
                bar:'fa-cocktail', rooftop:'fa-building', concierge:'fa-concierge-bell',
                onsen:'fa-hot-tub'
            };
            return map[code] || 'fa-check';
        },
        amenityLabel(code) {
            const map = {
                wifi:'Wi-Fi', pool:'Piscina', spa:'Spa', restaurant:'Restaurante',
                gym:'Gimnasio', parking:'Estacionamiento', beach:'Playa privada',
                bar:'Bar', rooftop:'Rooftop', concierge:'Conserje', onsen:'Onsen'
            };
            return map[code] || code;
        },
        starsArray(n) { return Array(n).fill(0); }
    }));

});