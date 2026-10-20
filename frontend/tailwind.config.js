/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#17C455',     // [ Daun Hijau ] Fresh Green
          teal: '#07C995',      // [ Pangkal Daun/Tunas ] Teal / Mint
          cyan: '#00C4D7',      // [ Lengkungan Atas R ] Electric Cyan
          sky: '#0093E3',       // [ Badan Tengah R ] Sky Blue
          royal: '#005CDF',     // [ Kaki & Akar Bawah ] Royal Blue
          marine: '#005A91',    // [ Kaki & Akar Bawah ] Deep Marine
        },
        dark: {
          bg: '#020B18',        // Background website
          nav: '#06111F',       // Navbar
          card: '#0B1929',      // Card layanan
          border: '#183247',    // Border kartu
          active: '#00C4D7',    // Link aktif
          success: '#07C995',   // Harga dan status sukses
          text: '#F1F5F9',      // Teks utama
          desc: '#94A3B8',      // Teks deskripsi
          rating: '#FACC15',    // Rating testimoni
        }
      }
    },
  },
  plugins: [],
}
