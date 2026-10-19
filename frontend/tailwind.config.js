/** @type {import('tailwindcss').Config} */
export default {
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
        }
      }
    },
  },
  plugins: [],
}

