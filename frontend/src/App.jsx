import React, { useState, useEffect } from 'react';
import {
  Code2,
  GraduationCap,
  Globe,
  Bot,
  Calculator,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Video,
  FileText,
  ChevronRight,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Upload,
  AlertCircle,
  HelpCircle,
  Laptop,
  Users,
  Terminal,
  ExternalLink,
  Star,
  Quote,
  Lock,
  X,
  Menu,
  BookOpen,
  Award,
  Zap,
  Target,
  HeartHandshake,
  TrendingUp,
  Layers,
  ChevronDown,
  Sun,
  Moon,
  Smartphone,
  Check,
  Calendar,
} from 'lucide-react';
import axios from 'axios';
import AdminPortal from './components/AdminPortal';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.origin.includes('5173')
    ? 'http://127.0.0.1:8000/api/v1'
    : '/api/v1');

// Helper untuk memastikan kode teknologi hanya menampilkan karakter ASCII/Monospace tanpa emoji
const getCleanTechTag = (rawCode, fallbackName = '') => {
  const cleaned = String(rawCode || '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
  if (cleaned) return cleaned.toUpperCase().slice(0, 4);
  return String(fallbackName || 'DEV')
    .replace(/[^A-Za-z0-9+]/g, '')
    .toUpperCase()
    .slice(0, 3);
};

// Logo Resmi Rizofara Technology (Sesuai Desain Awal)
export function RizofaraBrandLogo({ className = 'w-9 h-9' }) {
  return (
    <img
      src="/logo-icon.png"
      alt="Rizofara Technology Logo"
      className={`${className} object-contain rounded-xl transition-transform duration-200 hover:scale-105`}
    />
  );
}

export default function App() {
  // Theme State (Dark / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('rizofara_theme');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rizofara_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rizofara_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Navigation State
  const [activeTab, setActiveTab] = useState(() =>
    window.location.pathname.startsWith('/admin') ? 'admin' : 'home'
  );

  // Pintu Rahasia Admin: Tekan Ctrl + Shift + A untuk membuka Portal Admin
  useEffect(() => {
    const handleAdminShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setActiveTab('admin');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, []);

  // Otomatis scroll ke paling atas saat berpindah tab (Home <-> Admin)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState(null);

  // Dynamic Pricing Config State (Modul M3 & M4)
  const [pricingConfig, setPricingConfig] = useState({
    services: [
      {
        id: 1,
        slug: 'skripsi',
        name: 'Program Skripsi & Tugas Akhir',
        short_label: 'Skripsi IT',
        description:
          'Pembuatan sistem skripsi lengkap: Web, Mobile, AI/Machine Learning, IoT, Sistem Informasi & SPK.',
        features: [
          'Algoritma: CNN, YOLO, SAW, TOPSIS, K-Means, dll.',
          'Sistem Informasi Web, Mobile (Flutter), atau Data Science',
          'Bantuan Instalasi, Setup Database, & Simulasi Sidang',
          'Garansi Revisi Program Sesuai Catatan Dosen Penguji',
        ],
        icon: 'GraduationCap',
        color: 'indigo',
        category: 'akademik',
        base_price_min: 1800000,
        base_price_max: 3500000,
        standard_days: 21,
        min_days: 5,
        max_days: 60,
      },
      {
        id: 2,
        slug: 'website',
        name: 'Jasa Pembuatan Website',
        short_label: 'Website Bisnis',
        description:
          'Website Company Profile UMKM/Bisnis, Toko Online (E-Commerce), Portal Web, & Web App Custom.',
        features: [
          'Desain Modern & Responsif (Mobile-Friendly Tailwind CSS)',
          'Dashboard Admin CMS untuk Kelola Konten Mandiri',
          'Optimasi Kecepatan & Struktur Dasar SEO',
          'Integrasi Tombol WhatsApp, Maps, & Formulir Order',
        ],
        icon: 'Globe',
        color: 'emerald',
        category: 'bisnis',
        base_price_min: 500000,
        base_price_max: 3800000,
        standard_days: 14,
        min_days: 5,
        max_days: 60,
      },
      {
        id: 3,
        slug: 'chatbot',
        name: 'Jasa Pembuatan Chatbot',
        short_label: 'Chatbot AI/WA',
        description:
          'Chatbot Customer Service WhatsApp, Telegram Bot Automation, dan AI Assistant RAG dengan Gemini/OpenAI.',
        features: [
          'Integrasi WhatsApp Gateway, Telegram Bot, atau Web Widget',
          'Berbasis AI Pintar (OpenAI / Gemini / Custom Knowledge Base)',
          'Auto-Reply FAQ, Katalog Produk, & Pencatatan Pesanan ke DB',
          'Dashboard Monitoring Percakapan & Handover ke Admin',
        ],
        icon: 'Bot',
        color: 'amber',
        category: 'bisnis',
        base_price_min: 750000,
        base_price_max: 2800000,
        standard_days: 10,
        min_days: 5,
        max_days: 45,
      },
      {
        id: 4,
        slug: 'tugas',
        name: 'Tugas Kuliah Pemrograman',
        short_label: 'Tugas Kuliah',
        description:
          'Bantuan asistensi tugas koding mingguan, praktikum laboratorium, algoritma & basis data SQL.',
        features: [
          'Algoritma, Struktur Data, OOP, & Basis Data',
          'Web Dasar (HTML/CSS/JS, PHP Native, Laravel, React)',
          'Python, C/C++, Java, atau Dart',
          'Komentar Kode Rapi + Penjelasan Cara Kerja',
        ],
        icon: 'Code2',
        color: 'teal',
        category: 'akademik',
        base_price_min: 50000,
        base_price_max: 350000,
        standard_days: 3,
        min_days: 1,
        max_days: 30,
      },
    ],
    complexity_factors: [
      { code: 'basic', label: 'Dasar (CRUD)', multiplier: 1.0 },
      { code: 'intermediate', label: 'Menengah', multiplier: 1.3 },
      { code: 'advanced', label: 'Lanjutan (AI/API)', multiplier: 1.7 },
      { code: 'expert', label: 'Kompleks / Riset', multiplier: 2.2 },
    ],
    platform_factors: [
      { code: 'web', label: 'Web', multiplier: 1.0, applicable_services: null },
      { code: 'mobile', label: 'Mobile (Flutter)', multiplier: 1.35, applicable_services: null },
      { code: 'ai_ml', label: 'AI / ML / Data', multiplier: 1.45, applicable_services: null },
      { code: 'iot', label: 'IoT', multiplier: 1.4, applicable_services: ['skripsi', 'tugas'] },
      { code: 'desktop', label: 'Desktop', multiplier: 1.15, applicable_services: null },
    ],
    addons: [
      {
        code: 'report',
        label: 'Bantuan Laporan / Bab Pembahasan Program',
        description: 'Penjelasan alur kode, struktur tabel database, flowchart, dan UML/DFD.',
        price_type: 'fixed',
        price_min: 200000,
        price_max: 400000,
        benefit_text: 'Bantuan Penyusunan Laporan / Pembahasan Algoritma & Flowchart',
        applicable_services: ['skripsi', 'tugas'],
        is_default_checked: true,
      },
      {
        code: 'wireframe',
        label: 'Desain Wireframe UI/UX (Balsamiq)',
        description: 'Perancangan sketsa antarmuka layar sebelum masuk tahap koding.',
        price_type: 'fixed',
        price_min: 100000,
        price_max: 250000,
        benefit_text: 'Desain Wireframe UI/UX dengan Balsamiq Mockups',
        applicable_services: null,
        is_default_checked: false,
      },
    ],
  });

  // Calculator State
  const [calcService, setCalcService] = useState('website');
  const [calcComplexity, setCalcComplexity] = useState('intermediate');
  const [calcPlatform, setCalcPlatform] = useState('web');
  const [calcDays, setCalcDays] = useState(14);
  const [selectedAddons, setSelectedAddons] = useState(['report']);
  const [estimateResult, setEstimateResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Order Tracker State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackWaLast4, setTrackWaLast4] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    client_name: '',
    client_whatsapp: '',
    client_email: '',
    campus_or_company: '',
    service_type: 'skripsi',
    tech_stack: 'Web (React/Laravel/Python)',
    title: '',
    description: '',
    deadline: '14 Hari',
  });
  const [orderFile, setOrderFile] = useState(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Revision Modal State
  const [revisionCode, setRevisionCode] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  // Showcase State (Portofolio & Testimoni)
  const [showcaseData, setShowcaseData] = useState({
    portfolio_items: [
      {
        id: 1,
        title: 'Company Profile UMKM Retail',
        slug: 'company-profile-umkm',
        category: 'Website',
        badge_color: 'emerald',
        summary: 'Website profil toko interaktif dengan CMS dashboard, katalog produk, dan integrasi WhatsApp.',
        tech_tags: ['React', 'Tailwind', 'FastAPI'],
        highlight_metric: 'Responsif & Cepat',
      },
      {
        id: 2,
        title: 'Chatbot Customer Service AI',
        slug: 'chatbot-customer-service-ai',
        category: 'Chatbot AI',
        badge_color: 'teal',
        summary: 'Integrasi WhatsApp Gateway pintar dengan AI Gemini untuk rekomendasi produk dan pencatatan pesanan otomatis.',
        tech_tags: ['Node.js', 'Gemini API', 'PostgreSQL'],
        highlight_metric: 'Respon Otomatis 24/7',
      },
      {
        id: 3,
        title: 'Manajemen Data & POS Cloud',
        slug: 'manajemen-data-pos-cloud',
        category: 'Sistem Informasi',
        badge_color: 'sky',
        summary: 'Dashboard kasir multi-cabang, laporan laba rugi bulanan, cetak struk thermal, dan rekap inventaris.',
        tech_tags: ['Laravel 11', 'Tailwind', 'MySQL'],
        highlight_metric: 'Multi-Role & POS',
      },
      {
        id: 4,
        title: 'Landing Page Produk SaaS',
        slug: 'landing-page-produk-saas',
        category: 'Website',
        badge_color: 'indigo',
        summary: 'Landing page modern dengan form lead generation, animasi halus, dan skor SEO Google 98/100.',
        tech_tags: ['Next.js', 'Tailwind', 'Vercel'],
        highlight_metric: 'SEO Score 98/100',
      },
    ],
    testimonials: [
      {
        id: 1,
        client_name: 'Ahmad Rizky',
        client_role: 'Mahasiswa, Universitas XYZ',
        project_label: 'Skripsi AI Deteksi CNN',
        tag: 'Lulus Sidang Nilai A',
        comment:
          'Hasilnya sangat memuaskan, pengerjaan cepat dan komunikatif. Website dan model AI sesuai dengan keinginan dospem!',
        rating: 5,
        avatar_initials: 'AR',
        avatar_color: 'from-[#07C995] to-[#17C455]',
        source: 'admin',
      },
      {
        id: 2,
        client_name: 'Siti Nurhaliza',
        client_role: 'Pemilik UMKM Kuliner',
        project_label: 'Website Company Profile + WhatsApp',
        tag: 'Bisnis UMKM',
        comment:
          'Tim sangat profesional dan responsif. Revisi dikerjakan dengan cepat sesuai permintaan. Sangat recommended!',
        rating: 5,
        avatar_initials: 'SN',
        avatar_color: 'from-[#00C4D7] to-[#0093E3]',
        source: 'admin',
      },
      {
        id: 3,
        client_name: 'Dimas Pratama',
        client_role: 'Praktisi & Professional',
        project_label: 'Chatbot AI Customer Care',
        tag: 'Otomasi CS 24 Jam',
        comment:
          'Penjelasan alur kerja jelas, estimasi harga transparan, dan hasilnya sesuai ekspektasi. Sangat direkomendasikan!',
        rating: 5,
        avatar_initials: 'DP',
        avatar_color: 'from-[#0093E3] to-[#005CDF]',
        source: 'admin',
      },
    ],
    rating_summary: {
      average_rating: 4.9,
      total_reviews: 120,
      verified_count: 85,
    },
  });
  const [portfolioCategory, setPortfolioCategory] = useState('Semua');
  const [clientTestiModal, setClientTestiModal] = useState(null);
  const [clientTestiStatus, setClientTestiStatus] = useState({ loading: false, error: '', success: '' });

  // CMS State
  const [cmsData, setCmsData] = useState({
    settings: {
      brand_name: 'Rizofara Technology',
      tagline: 'Digital roots endless possibilities',
      whatsapp_number: '6285141396021',
      hero_badge: 'Solusi Digital untuk Mahasiswa & Bisnis',
      hero_title: 'Solusi Skripsi IT, Pembuatan',
      hero_highlight: 'Website & Chatbot AI',
      hero_subtitle:
        'Dikerjakan oleh tim berpengalaman dengan hasil berkualitas, tepat waktu, dan bergaransi.',
      payment_bank_info:
        'BCA / Mandiri / Gopay / Dana / QRIS (Hubungi Admin untuk Nomor Rekening Resmi)',
      company_values: null,
    },
    faqs: [
      {
        id: 1,
        question: 'Bagaimana cara memesan layanan?',
        answer:
          'Pilih jenis layanan di menu Katalog atau hitung estimasi di Kalkulator, lalu klik tombol Ajukan Order atau langsung hubungi tim kami via WhatsApp untuk konsultasi awal.',
        category: 'pemesanan',
      },
      {
        id: 2,
        question: 'Apakah data saya aman?',
        answer:
          'Sangat aman. Kami menerapkan jaminan kerahasiaan penuh (NDA) terhadap identitas klien, data penelitian, judul skripsi, maupun dokumen bisnis Anda.',
        category: 'keamanan',
      },
      {
        id: 3,
        question: 'Berapa lama waktu pengerjaan?',
        answer:
          'Durasi pengerjaan fleksibel mulai dari 5 hari (paket kilat) hingga 21 hari kerja sesuai kompleksitas sistem dan kesepakatan jadwal Anda.',
        category: 'waktu',
      },
      {
        id: 5,
        question: 'Apakah bisa revisi setelah selesai?',
        answer:
          'Ya, kami memberikan Garansi Revisi Tanpa Biaya Tambahan untuk perbaikan catatan dosen pembimbing atau penyesuaian fitur dalam scope awal yang disepakati.',
        category: 'garansi',
      },
      {
        id: 6,
        question: 'Apakah bisa konsultasi terlebih dahulu?',
        answer:
          'Tentu bisa! Sesi konsultasi awal, diskusi judul, pemilihan metode algoritma, atau perencanaan arsitektur web bersifat gratis 100%.',
        category: 'konsultasi',
      },
    ],
    tech_stacks: [
      { id: 1, name: 'Python', emoji: 'PY', color: 'text-teal-600', is_highlighted: false },
      { id: 2, name: 'React', emoji: 'RCT', color: 'text-sky-600', is_highlighted: true },
      { id: 3, name: 'Node.js', emoji: 'NODE', color: 'text-emerald-600', is_highlighted: false },
      { id: 4, name: 'Laravel', emoji: 'LRV', color: 'text-rose-600', is_highlighted: false },
      { id: 5, name: 'Flutter', emoji: 'FLT', color: 'text-cyan-600', is_highlighted: false },
      { id: 6, name: 'FastAPI', emoji: 'FAST', color: 'text-teal-600', is_highlighted: false },
      { id: 7, name: 'Balsamiq', emoji: 'UI', color: 'text-indigo-600', is_highlighted: true },
    ],
  });

  // Ekstraksi 7 Nilai Perusahaan
  const getCompanyValues = () => {
    if (Array.isArray(cmsData.settings?.company_values)) {
      return cmsData.settings.company_values;
    }
    if (typeof cmsData.settings?.company_values === 'string') {
      try {
        const parsed = JSON.parse(cmsData.settings.company_values);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 1,
        name: 'Growth Mindset',
        desc: 'Terus belajar, berkembang menghadapi kemajuan teknologi terbaru, dan selalu terbuka pada solusi kreatif.',
      },
      {
        id: 2,
        name: 'Innovation',
        desc: 'Mengembangkan arsitektur perangkat lunak dan implementasi AI yang relevan, mutakhir, dan berdampak nyata.',
      },
      {
        id: 3,
        name: 'Never Give Up',
        desc: 'Tangguh menuntaskan setiap tantangan koding, perbaikan bug rumit, hingga bimbingan sidang selesai beres.',
      },
      {
        id: 4,
        name: 'Integrity',
        desc: 'Kejujuran penuh dalam kesepakatan scope, kerahasiaan data terjamin aman, dan orisinalitas kode terjaga.',
      },
      {
        id: 5,
        name: 'Collaborative',
        desc: 'Komunikasi solutif, mendengar masukan klien dan dosen penguji, serta bermitra erat selama pengerjaan.',
      },
      {
        id: 6,
        name: 'Good services',
        desc: 'Pelayanan prima, ramah, responsif, bergaransi revisi, serta pendampingan pemahaman logika sistem secara tuntas.',
      },
      {
        id: 7,
        name: 'Transparent',
        desc: 'Alur kerja terbuka per Bab, estimasi biaya jelas tanpa biaya tersembunyi, dan progres dapat dipantau real-time.',
      },
    ];
  };

  const fetchPublicCms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cms/public`);
      if (res.data) {
        setCmsData((prev) => ({
          settings: { ...prev.settings, ...(res.data.settings || {}) },
          faqs: res.data.faqs?.length > 0 ? res.data.faqs : prev.faqs,
          tech_stacks: res.data.tech_stacks?.length > 0 ? res.data.tech_stacks : prev.tech_stacks,
        }));
      }
    } catch (err) {
      // Gunakan fallback
    }
  };

  const fetchPublicShowcase = async () => {
    try {
      const res = await axios.get(`${API_BASE}/showcase/public`);
      if (res.data) {
        setShowcaseData(res.data);
      }
    } catch (err) {
      // Gunakan fallback
    }
  };

  const fetchPricingConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/services/config`);
      if (res.data && res.data.services?.length > 0) {
        setPricingConfig(res.data);
        const defaultChecked = (res.data.addons || [])
          .filter((a) => a.is_default_checked)
          .map((a) => a.code);
        if (defaultChecked.length > 0) {
          setSelectedAddons(defaultChecked);
        }
      }
    } catch (err) {
      // Gunakan fallback
    }
  };

  useEffect(() => {
    fetchPricingConfig();
    fetchPublicShowcase();
    fetchPublicCms();
  }, []);

  // Sinkronisasi Title dan Meta Description Dinamis
  useEffect(() => {
    const brand = cmsData.settings?.brand_name || 'Rizofara Technology';
    const tagline = cmsData.settings?.tagline || 'Digital roots endless possibilities';
    document.title = `${brand} - ${tagline}`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && cmsData.settings?.hero_subtitle) {
      metaDesc.setAttribute('content', cmsData.settings.hero_subtitle);
    }
  }, [cmsData.settings]);

  // Kalkulasi estimasi otomatis saat parameter berubah
  useEffect(() => {
    fetchEstimate();
  }, [calcService, calcComplexity, calcPlatform, calcDays, selectedAddons, pricingConfig]);

  const toggleAddonCode = (code) => {
    setSelectedAddons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const currentServiceObj =
    pricingConfig.services.find((s) => s.slug === calcService) || pricingConfig.services[0];

  const fetchEstimate = async () => {
    setIsCalculating(true);
    try {
      const response = await axios.post(`${API_BASE}/calculator/estimate`, {
        service_type: calcService,
        complexity: calcComplexity,
        urgency_days: parseInt(calcDays),
        tech_platform: calcPlatform,
        selected_addons: selectedAddons,
        include_report: selectedAddons.includes('report'),
        include_wireframe: selectedAddons.includes('wireframe'),
      });
      setEstimateResult(response.data);
    } catch (err) {
      // Fallback lokal jika backend belum merespons
      const svc =
        pricingConfig.services.find((s) => s.slug === calcService) || pricingConfig.services[0];
      const compObj =
        pricingConfig.complexity_factors.find((c) => c.code === calcComplexity) || {
          multiplier: 1.3,
          label: 'Menengah',
        };
      const platObj =
        pricingConfig.platform_factors.find((p) => p.code === calcPlatform) || {
          multiplier: 1.0,
          label: 'Web',
        };

      const daysNum = parseInt(calcDays) || 14;
      const ratio = daysNum / (svc.standard_days || 14);
      let urgMult = 1.0;
      let urgTier = 'Fleksibel (Ekonomis)';
      if (ratio < 0.35) {
        urgMult = 1.35;
        urgTier = 'Express (Prioritas)';
      } else if (ratio < 0.65) {
        urgMult = 1.2;
        urgTier = 'Fast-Track (Cepat)';
      } else if (ratio < 1.0) {
        urgMult = 1.1;
        urgTier = 'Standar (Optimal)';
      }

      const totalMult = compObj.multiplier * platObj.multiplier * urgMult;
      let min = svc.base_price_min * totalMult;
      let max = svc.base_price_max * totalMult;

      const activeBenefits = [
        'Full Source Code 100% Hak Milik',
        'Garansi Revisi Tanpa Biaya Tambahan (Sesuai Scope Awal)',
        'Video Panduan / Readme Cara Menjalankan Program',
      ];

      (pricingConfig.addons || []).forEach((addon) => {
        if (!selectedAddons.includes(addon.code)) return;
        if (
          addon.applicable_services?.length > 0 &&
          !addon.applicable_services.includes(svc.slug)
        ) {
          return;
        }
        if (addon.price_type === 'percent') {
          min += min * (addon.price_min / 100);
          max += max * (addon.price_max / 100);
        } else {
          min += addon.price_min;
          max += addon.price_max;
        }
        activeBenefits.push(addon.benefit_text);
      });

      const round50k = (val) => Math.round(val / 50000) * 50000;
      const roundedMin = round50k(min);
      const roundedMax = round50k(max);
      const recDp = round50k(roundedMin * 0.4);

      setEstimateResult({
        service_type: svc.slug,
        service_name: svc.name,
        estimated_min_price: roundedMin,
        estimated_max_price: roundedMax,
        recommended_dp: recDp,
        estimated_days: daysNum,
        urgency_tier: urgTier,
        is_feasible: daysNum >= (svc.min_days || 1),
        min_allowed_days: svc.min_days || 1,
        breakdown: [],
        benefits: activeBenefits,
        notes: 'Estimasi indikatif. Diskusikan spesifikasi final bersama kami via WhatsApp.',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const openOrderModalFromCalc = () => {
    setOrderForm((prev) => ({
      ...prev,
      service_type: calcService,
      deadline: `${calcDays} Hari`,
    }));
    setIsOrderModalOpen(true);
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResults(null);
    try {
      const params = {};
      if (trackWaLast4.trim()) {
        params.wa_last4 = trackWaLast4.trim();
      }
      const res = await axios.get(
        `${API_BASE}/orders/track/${encodeURIComponent(trackQuery.trim())}`,
        { params }
      );
      setTrackResults(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Order tidak ditemukan. Pastikan Kode Order lengkap (contoh: RZ-2610-SKR1) dan 4 digit terakhir Nomor WhatsApp sudah benar.';
      setTrackError(msg);
    } finally {
      setTrackLoading(false);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderSubmitting(true);
    try {
      const payload = {
        ...orderForm,
        complexity: calcComplexity,
        tech_platform: calcPlatform,
        urgency_days: parseInt(calcDays) || 14,
        selected_addons: selectedAddons,
        include_report: selectedAddons.includes('report'),
        include_wireframe: selectedAddons.includes('wireframe'),
        price_estimate: estimateResult ? estimateResult.estimated_min_price : 0,
      };
      const res = await axios.post(`${API_BASE}/orders/`, payload);
      const createdOrder = res.data;

      if (orderFile) {
        const formData = new FormData();
        formData.append('file', orderFile);
        await axios.post(`${API_BASE}/orders/${createdOrder.id}/upload-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setOrderSuccessData(createdOrder);
      setOrderFile(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(
        detail ||
          'Gagal membuat order. Mohon pastikan backend berjalan atau hubungi kami langsung via WhatsApp.'
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleRevisionSubmit = async (e) => {
    e.preventDefault();
    setRevisionSubmitting(true);
    try {
      await axios.post(`${API_BASE}/orders/${revisionCode}/revision`, {
        notes: revisionNotes,
      });
      setRevisionSuccess(true);
      setTimeout(() => {
        setRevisionSuccess(false);
        setRevisionNotes('');
      }, 3000);
    } catch (err) {
      alert('Gagal mengirim catatan revisi. Pastikan Kode Order benar.');
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const openClientTestimonialModal = (orderObj = null) => {
    setClientTestiStatus({ loading: false, error: '', success: '' });
    setClientTestiModal({
      order_code: orderObj?.order_code || '',
      wa_last4: trackWaLast4 || '',
      client_name: orderObj?.client_name || '',
      client_role: orderObj?.campus_or_company || 'Mahasiswa / Klien',
      project_label: orderObj?.title || '',
      tag: 'Klien Terverifikasi',
      comment: '',
      rating: 5,
      consent_publish: true,
    });
  };

  const handleClientTestimonialSubmit = async (e) => {
    e.preventDefault();
    if (!clientTestiModal) return;
    setClientTestiStatus({ loading: true, error: '', success: '' });
    try {
      await axios.post(`${API_BASE}/showcase/testimonials/submit`, clientTestiModal);
      setClientTestiStatus({
        loading: false,
        error: '',
        success:
          'Terima kasih! Ulasan Anda berhasil dikirim dan sedang menunggu persetujuan (moderasi) Admin sebelum ditampilkan.',
      });
    } catch (err) {
      setClientTestiStatus({
        loading: false,
        error:
          err.response?.data?.detail ||
          'Gagal mengirim ulasan. Pastikan Kode Order & 4 digit WA benar.',
        success: '',
      });
    }
  };

  const openWhatsAppDirect = (topic = 'Konsultasi Layanan') => {
    let waNum = (cmsData.settings?.whatsapp_number || '6285141396021').replace(/\D/g, '');
    if (waNum.startsWith('0')) {
      waNum = '62' + waNum.slice(1);
    }
    const brand = cmsData.settings?.brand_name || 'Rizofara Technology';
    const text = encodeURIComponent(
      `Halo Tim ${brand},\nSaya tertarik konsultasi terkait: ${topic}.\nMohon informasi ketersediaan jadwal dan estimasinya ya kak. Terima kasih!`
    );
    window.open(`https://wa.me/${waNum}?text=${text}`, '_blank');
  };

  if (activeTab === 'admin') {
    return (
      <AdminPortal
        onBackToPublic={() => {
          window.history.pushState({}, '', '/');
          setActiveTab('home');
          fetchPricingConfig();
          fetchPublicShowcase();
          fetchPublicCms();
        }}
        onConfigUpdated={fetchPricingConfig}
        onShowcaseUpdated={fetchPublicShowcase}
        onCmsUpdated={fetchPublicCms}
      />
    );
  }

  const companyValues = getCompanyValues();

  return (
    <div className="min-h-screen bg-white dark:bg-[#020B18] text-slate-900 dark:text-[#F1F5F9] flex flex-col font-sans selection:bg-[#07C995] selection:text-white transition-colors duration-200">
      {/* ========================================================= */}
      {/* 1. STICKY NAVBAR DENGAN JARAK ATAS (FLOATING ISLAND) */}
      {/* ========================================================= */}
      <div className="sticky top-0 z-40 pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8 pointer-events-none">
        <header className="max-w-7xl mx-auto bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-md border border-slate-200/90 dark:border-[#183247] rounded-2xl shadow-sm overflow-hidden pointer-events-auto transition-all duration-200">
          <div className="px-4 sm:px-6 h-18 flex items-center justify-between gap-3">
          {/* Logo & Brand Name */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <RizofaraBrandLogo className="w-9 h-9 shrink-0 drop-shadow-xs" />
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-[#F1F5F9] block leading-tight">
                {cmsData.settings?.brand_name || 'Rizofara Technology'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">
                {cmsData.settings?.tagline || 'Digital roots endless possibilities'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold text-slate-600 dark:text-[#94A3B8]">
            <a
              href="#home"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              Beranda
            </a>
            <a
              href="#services"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              Layanan
            </a>
            <a
              href="#about"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition font-bold text-slate-800 dark:text-[#F1F5F9]"
            >
              About
            </a>
            <a
              href="#workflow"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              Alur Kerja
            </a>
            <a
              href="#calculator"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              Kalkulator
            </a>
            <a
              href="#tracking"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              Cek Order
            </a>
            <a
              href="#portfolio"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              Portofolio
            </a>
            <a
              href="#testimonials"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              Testimoni
            </a>
            <a
              href="#faq"
              className="px-3 py-2 rounded-xl hover:text-[#00C4D7] dark:hover:text-[#00C4D7] hover:bg-slate-50 dark:hover:bg-[#0B1929] transition"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1929] dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-slate-700 dark:text-[#F1F5F9] transition cursor-pointer flex items-center gap-1.5"
              title={isDarkMode ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#07C995] to-[#00C4D7] hover:opacity-95 text-slate-950 text-xs sm:text-sm font-extrabold shadow-md shadow-teal-500/20 transition cursor-pointer"
              title="Buat Pengajuan Order Proyek"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Order Sekarang</span>
            </button>
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-slate-700 dark:text-[#F1F5F9] transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900 dark:text-[#F1F5F9]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#06111F] border-t border-slate-100 dark:border-[#183247] px-4 pt-3 pb-5 space-y-3 shadow-xl">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {[
                { href: '#home', label: 'Beranda' },
                { href: '#services', label: 'Layanan Kami' },
                { href: '#about', label: 'About (7 Nilai)' },
                { href: '#workflow', label: 'Alur Kerja' },
                { href: '#calculator', label: 'Kalkulator Biaya' },
                { href: '#tracking', label: 'Cek Status Order' },
                { href: '#portfolio', label: 'Portofolio' },
                { href: '#testimonials', label: 'Testimoni' },
                { href: '#faq', label: 'FAQ' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-100 dark:border-[#183247] text-slate-800 dark:text-[#F1F5F9] flex items-center justify-between transition"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#183247]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsOrderModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0093E3] hover:bg-[#005CDF] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                Buat Order
              </button>
            </div>
          </div>
        )}
        </header>
      </div>

      {/* ========================================================= */}
      {/* 2. HERO SECTION PERSIS MOCKUP (Light Mode Putih) */}
      {/* ========================================================= */}
      <section id="home" className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden bg-white dark:bg-[#020B18]">
        {/* Soft Ambient Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/30 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-sky-100/30 dark:bg-sky-950/20 rounded-full blur-3xl pointer-events-none -ml-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-[#06111F] border border-emerald-200/70 dark:border-[#183247] text-emerald-700 dark:text-[#07C995] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#17C455]" />
                  <span>Solusi Digital untuk Mahasiswa & Bisnis</span>
                </div>
                <div className="text-xs font-medium text-slate-500 italic hidden sm:inline-block">
                  Dari ide hingga digital roots
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-[1.15]">
                Solusi Skripsi IT,<br />
                Pembuatan <span style={{ color: '#0093E3' }}>Website</span> &<br />
                <span style={{ color: '#07C995' }}>Chatbot AI</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-[#94A3B8] max-w-xl leading-relaxed">
                {cmsData.settings?.hero_subtitle ||
                  'Dikerjakan oleh tim berpengalaman dengan hasil berkualitas, tepat waktu, dan bergaransi.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0093E3] hover:bg-[#005CDF] text-white font-bold text-sm shadow-md shadow-sky-500/20 transition cursor-pointer"
                >
                  <span>Lihat Layanan</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#calculator"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#0B1929] dark:hover:bg-[#183247] text-slate-800 dark:text-[#F1F5F9] font-bold text-sm border border-slate-200 dark:border-[#183247] shadow-xs transition cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-slate-600" />
                  <span>Hitung Estimasi Biaya</span>
                </a>
              </div>
</div>

            {/* Right Laptop Mockup Column with Floating Badges */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              {/* Floating Badge 1: Website Modern */}
              <div className="absolute -top-3 left-4 sm:left-8 z-20 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-md border border-slate-200/90 dark:border-[#183247] rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 animate-bounce-slow text-slate-800 dark:text-[#F1F5F9]">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0093E3] flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F1F5F9]">Website Modern</span>
              </div>

              {/* Floating Badge 2: Chatbot AI */}
              <div className="absolute top-1/3 -left-4 sm:-left-6 z-20 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-md border border-slate-200/90 dark:border-[#183247] rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 text-slate-800 dark:text-[#F1F5F9]">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#07C995] flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F1F5F9]">Chatbot AI</span>
              </div>

              {/* Floating Badge 3: Tugas & Skripsi */}
              <div className="absolute -bottom-3 left-6 sm:left-12 z-20 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-md border border-slate-200/90 dark:border-[#183247] rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 text-slate-800 dark:text-[#F1F5F9]">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F1F5F9]">Tugas & Skripsi</span>
              </div>

              {/* Laptop Screen Frame Container */}
              <div className="w-full max-w-md bg-slate-900 rounded-3xl p-3 shadow-2xl border-4 border-slate-800 relative">
                {/* Screen Camera & Bezel */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 mb-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">rizofara.tech/app</span>
                  <div className="w-3" />
                </div>

                {/* Inner Screen Preview */}
                <div className="bg-white rounded-xl overflow-hidden p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RizofaraBrandLogo className="w-6 h-6" />
                      <span className="text-xs font-bold text-slate-900">Rizofara System</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                      Live V2.0
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-800">Progres Aktif Skripsi IT:</div>
                    <div className="text-xs font-semibold text-[#0093E3]">
                      Bab 4: Integrasi Model CNN (Akurasi 94.6%)
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-[#07C995] to-[#0093E3] w-3/4 rounded-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded bg-sky-50 text-sky-800 border border-sky-100 font-medium">
                      ✓ Full Source Code
                    </div>
                    <div className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
                      ✓ Garansi Revisi
                    </div>
                  </div>
                </div>

                {/* Laptop Base Stand */}
                <div className="w-32 h-1 bg-slate-700 mx-auto mt-2 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. LAYANAN KAMI (PILIH SESUAI KEBUTUHAN ANDA) */}
      {/* ========================================================= */}
      <section id="services" className="py-20 bg-slate-50/70 dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-[#0093E3] uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full border border-sky-200/60">
                LAYANAN KAMI
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F1F5F9] mt-2">
                Pilih layanan sesuai kebutuhan Anda
              </h2>
            </div>
            <a
              href="#calculator"
              className="text-sm font-bold text-[#0093E3] hover:text-[#005CDF] inline-flex items-center gap-1 transition"
            >
              Lihat Semua Layanan <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Pembuatan Website */}
            <div className="bg-white dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#0093E3] flex items-center justify-center mb-5">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#F1F5F9] mb-2">Pembuatan Website</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Website company profile, web app, landing page, dan sistem informasi.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Mulai dari</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-[#07C995]">Rp 500.000</span>
                </div>
                <button
                  onClick={() => {
                    setCalcService('website');
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-9 h-9 rounded-full bg-[#0093E3] hover:bg-[#005CDF] text-white flex items-center justify-center transition cursor-pointer"
                  title="Hitung Estimasi Website"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: Tugas Kuliah */}
            <div className="bg-white dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#07C995] flex items-center justify-center mb-5">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#F1F5F9] mb-2">Tugas Kuliah</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Makalah, presentasi, dan proyek koding jurusan pemrograman/IT.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Mulai dari</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-[#07C995]">Rp 50.000</span>
                </div>
                <button
                  onClick={() => {
                    setCalcService('tugas');
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-9 h-9 rounded-full bg-[#0093E3] hover:bg-[#005CDF] text-white flex items-center justify-center transition cursor-pointer"
                  title="Hitung Estimasi Tugas Kuliah"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 3: Skripsi */}
            <div className="bg-white dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-5">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#F1F5F9] mb-2">Skripsi</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Bantuan analisis data, penulisan laporan per bab, dan dokumentasi sistem.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Mulai dari</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-[#07C995]">Rp 200.000</span>
                </div>
                <button
                  onClick={() => {
                    setCalcService('skripsi');
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-9 h-9 rounded-full bg-[#0093E3] hover:bg-[#005CDF] text-white flex items-center justify-center transition cursor-pointer"
                  title="Hitung Estimasi Skripsi"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 4: Chatbot AI */}
            <div className="bg-white dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#17C455] flex items-center justify-center mb-5">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#F1F5F9] mb-2">Chatbot AI</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Integrasi AI untuk bisnis dan edukasi, WhatsApp Gateway & RAG LLM.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Mulai dari</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-[#07C995]">Rp 750.000</span>
                </div>
                <button
                  onClick={() => {
                    setCalcService('chatbot');
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-9 h-9 rounded-full bg-[#0093E3] hover:bg-[#005CDF] text-white flex items-center justify-center transition cursor-pointer"
                  title="Hitung Estimasi Chatbot AI"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. MENGAPA MEMILIH KAMI? */}
      {/* ========================================================= */}
      <section className="py-16 bg-white dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F1F5F9]">
                Mengapa Memilih Kami?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Kami berkomitmen memberikan hasil terbaik dengan proses yang transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0B1929] border border-slate-100 dark:border-[#183247] flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0093E3] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">Hasil Berkualitas</h4>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">Dikerjakan oleh tim berpengalaman.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0B1929] border border-slate-100 dark:border-[#183247] flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">Tepat Waktu</h4>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">Timeline jelas dan sesuai kesepakatan.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0B1929] border border-slate-100 dark:border-[#183247] flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#17C455] flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">Harga Transparan</h4>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">Estimasi jelas dengan kalkulator harga.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0B1929] border border-slate-100 dark:border-[#183247] flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">Garansi Revisi</h4>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">Revisi hingga sesuai kebutuhan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. TENTANG KAMI & 7 NILAI PERUSAHAAN (#about) */}
      {/* ========================================================= */}
      <section id="about" className="py-20 bg-slate-50/80 dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-[#07C995] uppercase tracking-wider bg-emerald-50 dark:bg-[#06111F] px-3.5 py-1 rounded-full border border-emerald-200/60 dark:border-[#183247]">
              TENTANG KAMI
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F1F5F9] mt-3 tracking-tight">
              {cmsData.settings?.brand_name || 'Rizofara Technology'}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#0093E3] dark:text-[#00C4D7] mt-1.5 italic">
              "{cmsData.settings?.tagline || 'Digital roots endless possibilities'}"
            </p>
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs sm:text-sm mt-2 max-w-xl mx-auto leading-relaxed">
              7 Nilai inti yang menjadi fondasi integritas, etos pantang menyerah, dan dedikasi teknologi yang mendasari setiap baris kode yang kami kembangkan untuk mahasiswa dan mitra bisnis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {companyValues.map((val, idx) => {
              const icons = [TrendingUp, Zap, Target, ShieldCheck, HeartHandshake, Award, CheckCircle2];
              const IconComp = icons[idx % icons.length];
              return (
                <div
                  key={val.id || idx}
                  className="bg-white dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] p-6 shadow-xs hover:shadow-md hover:border-[#0093E3]/40 dark:hover:border-[#00C4D7]/50 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#06111F] group-hover:bg-sky-50 dark:group-hover:bg-[#183247] text-[#0093E3] dark:text-[#00C4D7] flex items-center justify-center transition">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-extrabold text-slate-300 dark:text-slate-600 group-hover:text-[#07C995] transition">
                        0{val.id || idx + 1}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-[#F1F5F9] mb-2 group-hover:text-[#0093E3] dark:group-hover:text-[#00C4D7] transition">
                      {val.name || val.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                      {val.desc || 'Komitmen dedikasi penuh untuk memberikan hasil terbaik dan beretika.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 dark:border-[#183247] flex items-center gap-1.5 text-[11px] font-semibold text-[#07C995]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#17C455]" />
                    <span>Budaya Resmi Rizofara</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. ALUR KERJA (DARI KONSULTASI HINGGA PROJECT SELESAI) */}
      {/* ========================================================= */}
      <section id="workflow" className="py-20 bg-white dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-xs font-bold text-[#07C995] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                ALUR KERJA
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F1F5F9] mt-2">
                Dari Konsultasi hingga Project Selesai
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] max-w-xs">
              Proses mudah, transparan, dan terarah untuk hasil terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: '1',
                title: 'Konsultasi',
                desc: 'Diskusi kebutuhan, penentuan scope fitur, dan estimasi biaya.',
                icon: MessageSquare,
                color: 'text-sky-500',
                bg: 'bg-sky-50',
              },
              {
                step: '2',
                title: 'Pengerjaan',
                desc: 'Tim mulai selalu mengerjakan kode per Bab sesuai timeline.',
                icon: Layers,
                color: 'text-indigo-500',
                bg: 'bg-indigo-50',
              },
              {
                step: '3',
                title: 'Review',
                desc: 'Periksa progres secara real-time via menu Cek Status.',
                icon: Search,
                color: 'text-teal-500',
                bg: 'bg-teal-50',
              },
              {
                step: '4',
                title: 'Selesai',
                desc: 'Terima hasil akhir dengan garansi revisi dan panduan sistem.',
                icon: CheckCircle2,
                color: 'text-emerald-500',
                bg: 'bg-emerald-50',
              },
            ].map((st, i) => (
              <div
                key={st.step}
                className="bg-slate-50/70 dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] p-6 flex flex-col justify-between hover:bg-white dark:hover:bg-[#0B1929] hover:shadow-md hover:border-slate-200 dark:hover:border-[#00C4D7]/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                      {st.step}
                    </span>
                    <div className={`w-9 h-9 rounded-xl ${st.bg} ${st.color} flex items-center justify-center`}>
                      <st.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-[#F1F5F9] mb-2">{st.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. KALKULATOR ESTIMASI BIAYA & SPESIFIKASI PROYEK (ENTERPRISE GRADE) */}
      {/* ========================================================= */}
      <section id="calculator" className="py-24 bg-slate-50/70 dark:bg-[#020B18] border-t border-slate-200/80 dark:border-[#183247] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/5 dark:bg-emerald-500/10 border border-slate-200 dark:border-emerald-500/20 text-slate-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Calculator className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Interactive Project Estimator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-[#F1F5F9] tracking-tight">
              Kalkulator Estimasi Biaya & Arsitektur
            </h2>
            <p className="text-slate-600 dark:text-[#94A3B8] text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
              Konfigurasikan spesifikasi teknis kebutuhan Anda secara transparan. Dapatkan rincian investasi akurat dan rekomendasi timeline secara instan.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls Card (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0B1929] border border-slate-200/90 dark:border-[#183247] rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
              {/* 01. Kategori Layanan Utama */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-500 text-slate-950 flex items-center justify-center text-[10px] font-black">01</span>
                    Pilih Kategori Layanan
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">Pilih 1 kategori utama</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pricingConfig.services.map((s) => {
                    const isSelected = calcService === s.slug;
                    const getServiceIcon = () => {
                      if (s.slug === 'skripsi') return <GraduationCap className="w-5 h-5" />;
                      if (s.slug === 'website') return <Globe className="w-5 h-5" />;
                      if (s.slug === 'chatbot') return <Bot className="w-5 h-5" />;
                      return <Code2 className="w-5 h-5" />;
                    };
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        onClick={() => {
                          setCalcService(s.slug);
                          setCalcDays(s.standard_days || 14);
                        }}
                        className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-br from-teal-50/80 via-white to-sky-50/50 dark:from-[#0B1E33] dark:to-[#08223B] border-teal-500 dark:border-teal-400 shadow-md shadow-teal-500/10 ring-2 ring-teal-500/20'
                            : 'bg-slate-50/60 dark:bg-[#06111F] border-slate-200 dark:border-[#183247] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className={`p-2.5 rounded-xl ${
                            isSelected
                              ? 'bg-teal-500 text-slate-950 shadow-sm'
                              : 'bg-white dark:bg-[#0B1929] text-slate-600 dark:text-[#94A3B8] border border-slate-200/80 dark:border-[#183247]'
                          }`}>
                            {getServiceIcon()}
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 dark:text-[#F1F5F9]">
                            {s.short_label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                            {s.name}
                          </div>
                          <div className="mt-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 font-mono">
                            Mulai Rp {(s.base_price_min || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 02. Arsitektur Platform */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-500 text-slate-950 flex items-center justify-center text-[10px] font-black">02</span>
                    Arsitektur Platform Sistem
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">Stack target</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(pricingConfig.platform_factors || [])
                    .filter(
                      (p) =>
                        !p.applicable_services ||
                        p.applicable_services.length === 0 ||
                        p.applicable_services.includes(calcService)
                    )
                    .map((p) => {
                      const isSelected = calcPlatform === p.code;
                      const getPlatformIcon = () => {
                        if (p.code === 'web') return <Globe className="w-3.5 h-3.5" />;
                        if (p.code === 'mobile') return <Smartphone className="w-3.5 h-3.5" />;
                        if (p.code === 'ai_ml') return <Sparkles className="w-3.5 h-3.5" />;
                        if (p.code === 'iot') return <Zap className="w-3.5 h-3.5" />;
                        return <Laptop className="w-3.5 h-3.5" />;
                      };
                      return (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => setCalcPlatform(p.code)}
                          className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-slate-900 text-white dark:bg-teal-400 dark:text-slate-950 border-slate-900 dark:border-teal-400 font-bold shadow-md shadow-slate-900/10'
                              : 'bg-slate-50/70 dark:bg-[#06111F] border-slate-200 dark:border-[#183247] text-slate-700 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#183247]'
                          }`}
                        >
                          <span className={`${isSelected ? 'text-teal-400 dark:text-slate-950' : 'text-slate-500 dark:text-[#94A3B8]'}`}>
                            {getPlatformIcon()}
                          </span>
                          <span className="text-xs font-semibold leading-tight">{p.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 03. Tingkat Kompleksitas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-500 text-slate-950 flex items-center justify-center text-[10px] font-black">03</span>
                    Tingkat Kompleksitas Algoritma & Fitur
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">Skala kesulitan sistem</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(pricingConfig.complexity_factors || [])
                    .filter(
                      (c) =>
                        !c.applicable_services ||
                        c.applicable_services.length === 0 ||
                        c.applicable_services.includes(calcService)
                    )
                    .map((c) => {
                      const isSelected = calcComplexity === c.code;
                      const getComplexityHint = () => {
                        if (c.code === 'basic') return 'CRUD & Form Standar';
                        if (c.code === 'intermediate') return 'Multi-Role & Logika Bisnis';
                        if (c.code === 'advanced') return 'Integrasi API & Algoritma';
                        return 'Custom Riset / Machine Learning';
                      };
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setCalcComplexity(c.code)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white dark:bg-teal-400 dark:text-slate-950 border-slate-900 dark:border-teal-400 shadow-md ring-2 ring-slate-900/10 dark:ring-teal-400/20'
                              : 'bg-slate-50/70 dark:bg-[#06111F] border-slate-200 dark:border-[#183247] text-slate-700 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#183247]'
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>{c.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-teal-400 dark:text-slate-950" />}
                          </div>
                          <div className={`text-[10px] mt-1 line-clamp-1 ${
                            isSelected ? 'text-slate-300 dark:text-slate-800' : 'text-slate-400'
                          }`}>
                            {getComplexityHint()}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 04. Fitur Tambahan & Add-ons */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-500 text-slate-950 flex items-center justify-center text-[10px] font-black">04</span>
                    Paket Dokumentasi & Add-ons (Opsional)
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">Centang sesuai kebutuhan</span>
                </div>
                <div className="space-y-2.5">
                  {(pricingConfig.addons || [])
                    .filter(
                      (addon) =>
                        !addon.applicable_services ||
                        addon.applicable_services.length === 0 ||
                        addon.applicable_services.includes(calcService)
                    )
                    .map((addon) => {
                      const isChecked = selectedAddons.includes(addon.code);
                      return (
                        <label
                          key={addon.code}
                          className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500/50 dark:border-teal-500/40 shadow-xs'
                              : 'bg-slate-50/70 dark:bg-[#06111F] border-slate-200 dark:border-[#183247] hover:bg-slate-100/70 dark:hover:bg-[#183247]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddonCode(addon.code)}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-[#F1F5F9] block">
                                {addon.label}
                              </span>
                              {addon.description && (
                                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">{addon.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400 shrink-0 font-mono bg-teal-100/60 dark:bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-200/60 dark:border-teal-700/50">
                            {addon.price_type === 'percent'
                              ? `+${addon.price_min}%`
                              : `+Rp ${(addon.price_min).toLocaleString('id-ID')}`}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* 05. Target Delivery & Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-500 text-slate-950 flex items-center justify-center text-[10px] font-black">05</span>
                    Target Delivery & Waktu Pengerjaan
                  </label>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    calcDays <= (currentServiceObj?.standard_days ? currentServiceObj.standard_days * 0.35 : 5)
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                      : calcDays <= (currentServiceObj?.standard_days ? currentServiceObj.standard_days * 0.65 : 9)
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                      : calcDays <= (currentServiceObj?.standard_days || 14)
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-100 dark:bg-[#183247] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#183247]'
                  }`}>
                    {calcDays} Hari Kerja ({
                      calcDays <= (currentServiceObj?.standard_days ? currentServiceObj.standard_days * 0.35 : 5)
                        ? '⚡ Express / Prioritas'
                        : calcDays <= (currentServiceObj?.standard_days ? currentServiceObj.standard_days * 0.65 : 9)
                        ? '🚀 Fast-Track'
                        : calcDays <= (currentServiceObj?.standard_days || 14)
                        ? '✨ Standar Rekomendasi'
                        : '⏱ Fleksibel (Paling Hemat)'
                    })
                  </span>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] rounded-2xl p-4 space-y-3">
                  <input
                    type="range"
                    min={currentServiceObj?.min_days || 1}
                    max={currentServiceObj?.max_days || 60}
                    value={calcDays}
                    onChange={(e) => setCalcDays(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-[#183247] rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">
                    <span>Min {currentServiceObj?.min_days || 1} Hari</span>
                    <span>Standar {currentServiceObj?.standard_days || 14} Hari</span>
                    <span>Max {currentServiceObj?.max_days || 60} Hari</span>
                  </div>
                  {/* Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-[#183247]">
                    <button
                      type="button"
                      onClick={() => setCalcDays(currentServiceObj?.min_days || 3)}
                      className="py-1.5 px-2 rounded-lg bg-white dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-[11px] font-semibold text-slate-700 dark:text-[#F1F5F9] transition"
                    >
                      ⚡ Express ({currentServiceObj?.min_days || 3}h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcDays(currentServiceObj?.standard_days || 14)}
                      className="py-1.5 px-2 rounded-lg bg-white dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-[11px] font-semibold text-slate-700 dark:text-[#F1F5F9] transition"
                    >
                      ✨ Rekomendasi ({currentServiceObj?.standard_days || 14}h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcDays(Math.min(currentServiceObj?.max_days || 30, (currentServiceObj?.standard_days || 14) + 7))}
                      className="py-1.5 px-2 rounded-lg bg-white dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-[11px] font-semibold text-slate-700 dark:text-[#F1F5F9] transition"
                    >
                      ⏱ Fleksibel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rincian Estimasi (Enterprise Sticky Sidebar, 5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white dark:bg-[#0B1929] border border-slate-200/90 dark:border-[#183247] rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#183247]">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#F1F5F9] uppercase tracking-wider">
                      Rincian Estimasi Proyek
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">Spesifikasi & Rencana Biaya</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Calculator</span>
                  </span>
                </div>

                {/* Spec Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100/70 dark:border-[#183247]/50">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Layanan Utama:</span>
                    <span className="font-bold text-slate-900 dark:text-[#F1F5F9]">{currentServiceObj?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100/70 dark:border-[#183247]/50">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Platform & Stack:</span>
                    <span className="font-bold text-slate-900 dark:text-[#F1F5F9] uppercase">{calcPlatform}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100/70 dark:border-[#183247]/50">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Kompleksitas:</span>
                    <span className="font-bold text-slate-900 dark:text-[#F1F5F9] capitalize">{calcComplexity}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100/70 dark:border-[#183247]/50">
                    <span className="text-slate-500 dark:text-[#94A3B8]">Target Delivery:</span>
                    <span className="font-bold text-slate-900 dark:text-[#F1F5F9]">{calcDays} Hari Kerja</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="pt-1">
                      <span className="text-slate-500 dark:text-[#94A3B8] block mb-1.5">Add-ons Terpilih:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(pricingConfig.addons || [])
                          .filter((a) => selectedAddons.includes(a.code))
                          .map((a) => (
                            <span
                              key={a.code}
                              className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800 text-[10px] font-semibold"
                            >
                              + {a.label}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Highlighted Total Investment */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 dark:from-[#06111F] dark:to-[#0B1E33] border border-slate-800 text-white space-y-1">
                  <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Total Estimasi Investasi
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                      Rp {estimateResult ? (estimateResult.estimated_min_price).toLocaleString('id-ID') : '...'}
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      IDR
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Rentang wajar: Rp {estimateResult ? (estimateResult.estimated_max_price).toLocaleString('id-ID') : '...'}
                  </div>
                </div>

                {/* DP Commitment Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-[#94A3B8] font-medium">Komitmen DP Awal (40%):</span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 font-mono text-sm">
                      Rp {estimateResult ? (estimateResult.recommended_dp).toLocaleString('id-ID') : '...'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    Sisa 60% pelunasan setelah program selesai dikerjakan, diuji coba, dan siap didemokan bersama Anda.
                  </p>
                </div>

                {/* Enterprise Guarantees */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#183247] space-y-2 text-[11px] text-slate-600 dark:text-[#94A3B8]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Full Source Code 100% Hak Milik</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Garansi Revisi & Bimbingan Pengujian</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Panduan Setup Database & Video Tutorial</span>
                  </div>
                </div>

                {/* Action Button (Tunggal & Fokus Langsung Order) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={openOrderModalFromCalc}
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#07C995] to-[#00C4D7] hover:opacity-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition cursor-pointer"
                  >
                    <span>Ajukan Order dari Simulasi Ini</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. CEK STATUS & PROGRES BAB PENGERJAAN (#tracking) */}
      {/* ========================================================= */}
      <section id="tracking" className="py-20 bg-white dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#0093E3] uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full border border-sky-200/60">
              CEK PROGRES
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-[#F1F5F9] mt-2">
              Cek Status & Progres Bab Pengerjaan
            </h2>
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs sm:text-sm mt-2 max-w-xl mx-auto">
              Masukkan kode order untuk melihat detail progres, catatan revisi, dan estimasi waktu selesai.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleTrackOrder}
            className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-4"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Contoh: RZ-2610-SKR1"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0093E3] transition shadow-xs"
              />
            </div>
            <input
              type="text"
              maxLength={4}
              value={trackWaLast4}
              onChange={(e) => setTrackWaLast4(e.target.value.replace(/\D/g, ''))}
              placeholder="4 Digit WA"
              className="w-full sm:w-32 px-3 py-3 bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0093E3] transition text-center font-mono shadow-xs"
            />
            <button
              type="submit"
              disabled={trackLoading}
              className="px-6 py-3 bg-[#0093E3] hover:bg-[#005CDF] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {trackLoading ? 'Mencari...' : 'Lacak Progres'}
            </button>
          </form>

          {/* Quick sample pills with correct 4-digit WA from database */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-[11px] text-slate-500">
            <span>Contoh kode:</span>
            {[
              { code: 'RZ-2610-SKR1', wa: '7890', label: 'Skripsi CNN (Bab 4)' },
              { code: 'RZ-2610-WEB2', wa: '3344', label: 'Web POS (Tahap 3)' },
              { code: 'RZ-2610-SPK3', wa: '7766', label: 'Skripsi TOPSIS (Selesai)' },
            ].map((sample) => (
              <button
                key={sample.code}
                type="button"
                onClick={async () => {
                  setTrackQuery(sample.code);
                  setTrackWaLast4(sample.wa);
                  setTrackLoading(true);
                  setTrackError('');
                  try {
                    const res = await axios.get(`${API_BASE}/orders/track/${sample.code}`, {
                      params: { wa_last4: sample.wa },
                    });
                    setTrackResults([res.data]);
                  } catch (err) {
                    setTrackError(
                      err.response?.data?.detail || 'Gagal memuat contoh order.'
                    );
                  } finally {
                    setTrackLoading(false);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-[#0093E3] dark:text-[#00C4D7] font-mono font-semibold transition cursor-pointer"
              >
                {sample.code}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {trackError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {/* Tracking Result Card */}
          {trackResults && trackResults.length > 0 && (
            <div className="space-y-6">
              {trackResults.map((order, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl p-6 sm:p-8 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-[#0093E3] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                          {order.order_code}
                        </span>
                        <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          {order.service_type}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#F1F5F9] mt-2">{order.title}</h3>
                      <p className="text-xs text-slate-500">
                        Pemesan: <strong className="text-slate-800">{order.client_name}</strong> • Deadline:{' '}
                        {order.deadline}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400">Status Saat Ini:</span>
                      <div className="text-sm font-extrabold text-[#07C995] uppercase mt-0.5">
                        {order.status.replaceAll('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Highlight Box: Sedang Mengerjakan Bab Berapa */}
                  <div className="mt-5 p-4 rounded-2xl bg-emerald-50/80 dark:bg-[#06111F] border border-emerald-200 dark:border-[#183247] flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[11px] uppercase font-extrabold tracking-wider text-emerald-800">
                        Sedang Mengerjakan Bab / Tahapan Berapa Saat Ini:
                      </div>
                      <div className="text-sm font-bold text-emerald-950 dark:text-[#07C995] mt-1 leading-relaxed">
                        {order.current_stage ||
                          'Proyek sedang dalam tahap pengerjaan aktif oleh tim teknis.'}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-slate-500">Total Tagihan Efektif</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        Rp {(order.effective_bill || order.final_price || order.price_estimate || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <div className="text-[11px] text-emerald-700">Sudah Terbayar</div>
                      <div className="text-sm font-extrabold text-emerald-800 mt-0.5">
                        Rp {(order.total_paid || order.dp_amount || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-amber-700">Sisa Pelunasan</div>
                        <div className="text-sm font-extrabold text-amber-900 mt-0.5">
                          Rp {(order.remaining_balance ?? 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800">
                        {order.payment_status?.toUpperCase() || 'STATUS'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700">Progres Keseluruhan:</span>
                      <span className="text-[#0093E3] font-mono font-bold">
                        {order.progress_percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#07C995] to-[#0093E3] h-full rounded-full transition-all duration-500"
                        style={{ width: `${order.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  {order.milestones && order.milestones.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                        Tahapan Pengerjaan Bab:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {order.milestones.map((m, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                              m.is_completed
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-[#07C995]'
                                : 'bg-slate-50 dark:bg-[#06111F] border-slate-100 dark:border-[#183247] text-slate-600 dark:text-[#94A3B8]'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 ${
                                m.is_completed ? 'text-[#17C455]' : 'text-slate-300'
                              }`}
                            />
                            <span className="font-medium">{m.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setRevisionCode(order.order_code)}
                      className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Ajukan Catatan Revisi
                    </button>
                    {order.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => openClientTestimonialModal(order)}
                        className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0093E3] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-sky-400" />
                        Beri Ulasan Terverifikasi
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsAppDirect(
                          `Update Progres Order ${order.order_code} (${order.title})`
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ml-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat Tim Teknis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. PORTOFOLIO & STUDI KASUS (#portfolio) */}
      {/* ========================================================= */}
      <section id="portfolio" className="py-20 bg-slate-50/70 dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-[#0093E3] uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full border border-sky-200/60">
                PORTOFOLIO & STUDI KASUS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F1F5F9] mt-2">
                Hasil Implementasi Sistem
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Dokumentasi beberapa sistem yang telah kami kembangkan.
              </p>
            </div>
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {['Semua', 'Website', 'Sistem Informasi', 'Chatbot AI'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPortfolioCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                    portfolioCategory === cat
                      ? 'bg-slate-900 dark:bg-[#00C4D7] border-slate-900 dark:border-[#00C4D7] text-white dark:text-[#020B18]'
                      : 'bg-white dark:bg-[#0B1929] border-slate-200 dark:border-[#183247] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#183247]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              const filteredPortfolios = (showcaseData.portfolio_items || []).filter(
                (item) =>
                  portfolioCategory === 'Semua' ||
                  item.category?.toLowerCase().includes(portfolioCategory.toLowerCase())
              );

              if (filteredPortfolios.length === 0) {
                return (
                  <div className="col-span-full py-16 px-6 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0093E3] flex items-center justify-center mb-3.5">
                      <Laptop className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Belum Ada Portofolio untuk Kategori Ini</h3>
                    <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                      Portofolio untuk kategori <strong>"{portfolioCategory}"</strong> sedang dalam tahap kurasi dan pengujian atau Anda dapat melihat seluruh portofolio kami.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPortfolioCategory('Semua')}
                      className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Tampilkan Semua Portofolio
                    </button>
                  </div>
                );
              }

              return filteredPortfolios.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-[#00C4D7]/50 transition flex flex-col justify-between"
                >
                  {/* Mock Screenshot Banner */}
                  <div className="h-36 bg-gradient-to-br from-slate-100 dark:from-[#06111F] via-sky-50 dark:via-[#0B1929] to-emerald-50 dark:to-[#06111F] p-4 flex flex-col justify-between border-b border-slate-100 dark:border-[#183247]">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/90 text-slate-700 w-max shadow-xs">
                      {item.category}
                    </span>
                    <div className="font-mono text-xs font-extrabold text-[#0093E3]">
                      {item.highlight_metric || 'Teruji & Valid'}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-[#F1F5F9] mb-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed mb-4">
                        {item.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(item.tech_tags || []).slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#06111F] text-slate-600 dark:text-[#94A3B8] font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. TESTIMONI KLIEN (#testimonials) */}
      {/* ========================================================= */}
      <section id="testimonials" className="py-20 bg-white dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-[#07C995] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                TESTIMONI KLIEN
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F1F5F9] mt-2">
                Apa kata mereka tentang kami?
              </h2>
            </div>
            <button
              onClick={() => openClientTestimonialModal()}
              className="text-xs font-bold text-[#0093E3] hover:text-[#005CDF] inline-flex items-center gap-1 transition cursor-pointer"
            >
              + Beri Ulasan Klien Terverifikasi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(showcaseData.testimonials || []).map((testi, idx) => (
              <div
                key={testi.id || idx}
                className="bg-slate-50/70 dark:bg-[#0B1929] rounded-2xl border border-slate-100 dark:border-[#183247] p-6 flex flex-col justify-between hover:bg-white dark:hover:bg-[#0B1929] hover:shadow-md hover:border-slate-200 dark:hover:border-[#00C4D7]/50 transition"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(testi.rating || 5)].map((_, sIdx) => (
                      <Star key={sIdx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-6 italic">
                    "{testi.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-tr ${
                      testi.avatar_color || 'from-[#07C995] to-[#0093E3]'
                    } text-white font-bold text-xs flex items-center justify-center shrink-0`}
                  >
                    {testi.avatar_initials || 'KL'}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-[#F1F5F9]">{testi.client_name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{testi.client_role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. FAQ ACCORDION (#faq) */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 bg-slate-50/60 dark:bg-[#020B18] border-t border-slate-100 dark:border-[#183247]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#0093E3] uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full border border-sky-200/60">
              FAQ
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-[#F1F5F9] mt-2">Pertanyaan Umum</h2>
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs sm:text-sm mt-2">
              Jawaban untuk pertanyaan yang paling sering ditanyakan seputar pengerjaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(cmsData.faqs || []).map((faq, idx) => {
              const isExpanded = openFaqId === (faq.id || idx);
              return (
                <div
                  key={faq.id || idx}
                  onClick={() => setOpenFaqId(isExpanded ? null : (faq.id || idx))}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0B1929] border border-slate-200/80 dark:border-[#183247] shadow-xs cursor-pointer hover:border-[#0093E3]/40 dark:hover:border-[#00C4D7]/50 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-[#F1F5F9] leading-snug">
                      {faq.question}
                    </h4>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180 text-[#0093E3]' : ''
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-2.5 leading-relaxed">{faq.answer}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 12. FOOTER RESMI (LIGHT MODE) */}
      {/* ========================================================= */}
      <footer className="mt-auto border-t border-slate-100 dark:border-[#183247] bg-white dark:bg-[#06111F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <RizofaraBrandLogo className="w-8 h-8 shrink-0" />
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-[#F1F5F9] block">
                {cmsData.settings?.brand_name || 'Rizofara Technology'}
              </span>
              <span className="text-slate-500 text-[11px]">
                {cmsData.settings?.tagline || 'Digital roots endless possibilities'}
              </span>
            </div>
          </div>

          {/* Footer Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
            <a href="#home" className="hover:text-[#0093E3] transition">
              Beranda
            </a>
            <a href="#services" className="hover:text-[#0093E3] transition">
              Layanan
            </a>
            <a href="#about" className="hover:text-[#0093E3] transition">
              About
            </a>
            <a href="#portfolio" className="hover:text-[#0093E3] transition">
              Portofolio
            </a>
            <a href="#testimonials" className="hover:text-[#0093E3] transition">
              Testimoni
            </a>
            <a href="#faq" className="hover:text-[#0093E3] transition">
              FAQ
            </a>
          </div>

          {/* Media Sosial Resmi */}
          <div className="flex items-center gap-2.5">
            <a
              href="https://www.tiktok.com/@rizofaratechnology"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] text-slate-700 dark:text-[#F1F5F9] hover:text-black border border-slate-200/80 dark:border-[#183247] transition text-xs font-semibold"
              title="TikTok Rizofara Technology"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.81a8.23 8.23 0 0 0 4.76 1.5V6.87a4.83 4.83 0 0 1-1-.18z"/>
              </svg>
              <span>TikTok</span>
            </a>
            <a
              href="https://www.instagram.com/rizofaratechnology/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B1929] hover:bg-slate-100 dark:hover:bg-[#183247] text-slate-700 dark:text-[#F1F5F9] hover:text-pink-600 border border-slate-200/80 dark:border-[#183247] transition text-xs font-semibold"
              title="Instagram Rizofara Technology"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              <span>Instagram</span>
            </a>
          </div>

          <div>
            <span>
              © {new Date().getFullYear()}{' '}
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/admin');
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="hover:underline cursor-default focus:outline-none"
                title=""
              >
                {cmsData.settings?.brand_name || 'Rizofara Technology'}
              </a>
              . All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* MODAL 1: FORM PENGAJUAN ORDER */}
      {/* ========================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Sticky dengan Tombol X Permanen di Atas */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 dark:border-[#183247] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F1F5F9]">
                  {orderSuccessData ? 'Order Berhasil Dibuat' : 'Form Pengajuan Order'}
                </h3>
                <p className="text-xs text-slate-500">
                  {orderSuccessData ? 'Simpan kode order Anda' : 'Lengkapi detail spesifikasi proyek'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setOrderSuccessData(null);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] text-slate-600 dark:text-[#F1F5F9] hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {orderSuccessData ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#17C455] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-xl text-slate-900">Order Berhasil Dibuat</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Simpan Kode Order ini untuk memantau progres pengerjaan di menu Cek Status:
                  </p>
                  <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-emerald-200 text-[#0093E3] font-mono text-xl font-bold">
                    {orderSuccessData.order_code}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-6">
                    Tim kami akan menghubungi WhatsApp Anda ({orderSuccessData.client_whatsapp}) untuk konfirmasi teknis.
                  </p>
                  <button
                    onClick={() => {
                      openWhatsAppDirect(`Konfirmasi Order ${orderSuccessData.order_code}`);
                      setIsOrderModalOpen(false);
                      setOrderSuccessData(null);
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#07C995] to-[#17C455] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Konfirmasi via WhatsApp
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                      Nama Lengkap / Panggilan *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.client_name}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, client_name: e.target.value })
                      }
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0093E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                      Nomor WhatsApp Aktif *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.client_whatsapp}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, client_whatsapp: e.target.value })
                      }
                      placeholder="Contoh: 085141396021"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0093E3]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Layanan *</label>
                      <select
                        value={orderForm.service_type}
                        onChange={(e) => {
                          setOrderForm({ ...orderForm, service_type: e.target.value });
                          setCalcService(e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0093E3]"
                      >
                        {pricingConfig.services.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                        Target Deadline *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderForm.deadline}
                        onChange={(e) => setOrderForm({ ...orderForm, deadline: e.target.value })}
                        placeholder="Contoh: 14 Hari"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0093E3]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                      Judul / Topik Proyek *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.title}
                      onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
                      placeholder="Contoh: Sistem Klasifikasi Citra CNN & Web Dashboard"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0093E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                      Deskripsi & Kebutuhan Spesifik *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={orderForm.description}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, description: e.target.value })
                      }
                      placeholder="Jelaskan fitur utama, algoritma/metode, dan bahasa pemrograman yang dibutuhkan..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0093E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                      Unggah Panduan / Dokumen (Opsional)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setOrderFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={orderSubmitting}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#07C995] to-[#17C455] hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {orderSubmitting ? 'Mengirim Data...' : 'Kirim & Dapatkan Kode Order'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CATATAN REVISI */}
      {/* ========================================================= */}
      {revisionCode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Sticky dengan Tombol X Permanen di Atas */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 dark:border-[#183247] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F1F5F9]">Ajukan Catatan Revisi</h3>
                <p className="text-xs text-slate-500">
                  Kode Order: <span className="text-[#0093E3] font-mono font-bold">{revisionCode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevisionCode('')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] text-slate-600 dark:text-[#F1F5F9] hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {revisionSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                  Catatan revisi berhasil dikirim ke tim pengembang dan akan segera ditindaklanjuti.
                </div>
              ) : (
                <form onSubmit={handleRevisionSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                      Poin-poin Perbaikan:
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Tuliskan rincian perbaikan bab atau fungsi program di sini..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={revisionSubmitting}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    {revisionSubmitting ? 'Mengirim...' : 'Kirim Catatan Revisi'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: KIRIM TESTIMONI KLIEN TERVERIFIKASI */}
      {/* ========================================================= */}
      {clientTestiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Sticky dengan Tombol X Permanen di Atas */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#06111F]/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 dark:border-[#183247] flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-1.5 text-[#07C995] text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ulasan Klien Terverifikasi</span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-0.5">
                  Bagikan Pengalaman Anda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClientTestiModal(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] text-slate-600 dark:text-[#F1F5F9] hover:text-slate-900 transition cursor-pointer shrink-0 ml-3 shadow-xs"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 mb-4">
                Masukkan <b>Kode Order</b> yang telah berstatus <b>Selesai (Completed)</b> beserta 4 digit terakhir WhatsApp.
              </p>

              {clientTestiStatus.success ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-3 text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#17C455] mx-auto" />
                  <p className="leading-relaxed">{clientTestiStatus.success}</p>
                  <button
                    type="button"
                    onClick={() => setClientTestiModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleClientTestimonialSubmit} className="space-y-3.5 text-xs">
                  {clientTestiStatus.error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{clientTestiStatus.error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">Kode Order *</label>
                      <input
                        type="text"
                        required
                        placeholder="RZ-2610-XXXX"
                        value={clientTestiModal.order_code}
                        onChange={(e) =>
                          setClientTestiModal({
                            ...clientTestiModal,
                            order_code: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-[#0093E3] dark:text-[#00C4D7] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                        4 Digit Terakhir WA *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="Contoh: 7890"
                        value={clientTestiModal.wa_last4}
                        onChange={(e) =>
                          setClientTestiModal({
                            ...clientTestiModal,
                            wa_last4: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                        Nama Tampilan *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Ahmad Rizky"
                        value={clientTestiModal.client_name}
                        onChange={(e) =>
                          setClientTestiModal({ ...clientTestiModal, client_name: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                        Status / Instansi *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mahasiswa Teknik Informatika"
                        value={clientTestiModal.client_role}
                        onChange={(e) =>
                          setClientTestiModal({ ...clientTestiModal, client_role: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                        Rating Kepuasan *
                      </label>
                      <select
                        value={clientTestiModal.rating}
                        onChange={(e) =>
                          setClientTestiModal({
                            ...clientTestiModal,
                            rating: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] font-semibold"
                      >
                        <option value={5}>5 / 5 - Sangat Puas</option>
                        <option value={4}>4 / 5 - Puas</option>
                        <option value={3}>3 / 5 - Cukup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                        Label Highlight Singkat
                      </label>
                      <input
                        type="text"
                        placeholder="Lulus Sidang Nilai A"
                        value={clientTestiModal.tag}
                        onChange={(e) =>
                          setClientTestiModal({ ...clientTestiModal, tag: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-[#F1F5F9] font-semibold mb-1">
                      Komentar & Pengalaman Anda *
                    </label>
                    <textarea
                      rows={3}
                      required
                      minLength={10}
                      placeholder="Ceritakan pengalaman pengerjaan, komunikasi teknis, atau hasil akhir proyek Anda..."
                      value={clientTestiModal.comment}
                      onChange={(e) =>
                        setClientTestiModal({ ...clientTestiModal, comment: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#06111F] border border-slate-200 dark:border-[#183247] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={clientTestiModal.consent_publish}
                      onChange={(e) =>
                        setClientTestiModal({
                          ...clientTestiModal,
                          consent_publish: e.target.checked,
                        })
                      }
                      className="rounded text-[#0093E3] border-slate-300"
                    />
                    <span>Saya mengizinkan ulasan ini ditampilkan di halaman utama Rizofara.</span>
                  </label>

                  <button
                    type="submit"
                    disabled={clientTestiStatus.loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#07C995] to-[#17C455] hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm"
                  >
                    {clientTestiStatus.loading ? 'Memverifikasi...' : 'Kirim Ulasan Terverifikasi'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
