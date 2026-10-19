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
  X
} from 'lucide-react';
import axios from 'axios';
import AdminPortal from './components/AdminPortal';

const API_BASE = window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

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

export default function App() {
  // Navigation State (Otomatis buka 'admin' jika URL diawali /admin)
  const [activeTab, setActiveTab] = useState(() =>
    window.location.pathname.startsWith('/admin') ? 'admin' : 'home'
  );


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
        base_price_min: 1200000,
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
        base_price_min: 900000,
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
        base_price_min: 100000,
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
  const [calcService, setCalcService] = useState('skripsi');
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

  // Showcase State (Modul M9 Testimoni & M10 Portofolio)
  const [showcaseData, setShowcaseData] = useState({
    portfolio_items: [
      {
        id: 1,
        title: 'Deteksi Penyakit Daun Tanaman dengan Algoritma CNN (ResNet-50) & FastAPI',
        slug: 'deteksi-penyakit-daun-cnn',
        category: 'Skripsi AI & Machine Learning',
        badge_color: 'teal',
        summary:
          'Aplikasi upload gambar berbasis web untuk mendeteksi hama daun secara real-time dengan akurasi 94.2%.',
        tech_tags: ['Python', 'PyTorch', 'FastAPI', 'React'],
        highlight_metric: 'Akurasi 94.2%',
      },
      {
        id: 2,
        title: 'WhatsApp Customer Service AI Terintegrasi Google Gemini & Katalog Produk',
        slug: 'whatsapp-cs-ai-gemini',
        category: 'Chatbot & AI LLM',
        badge_color: 'indigo',
        summary:
          'Bot asisten WhatsApp pintar yang melayani pertanyaan stok barang, rekomendasi produk, dan rekap pesanan otomatis.',
        tech_tags: ['Node.js', 'Gemini API', 'PostgreSQL'],
        highlight_metric: 'Respon Otomatis 24/7',
      },
      {
        id: 3,
        title: 'Sistem Informasi Inventaris & Kasir (POS) Toko Retail Berbasis Cloud',
        slug: 'sistem-informasi-pos-retail',
        category: 'Web & Sistem Informasi',
        badge_color: 'emerald',
        summary:
          'Web aplikasi pencatatan transaksi kasir, print struk thermal, laporan laba rugi bulanan, dan audit stok opname.',
        tech_tags: ['Laravel 11', 'Tailwind', 'MySQL'],
        highlight_metric: 'Multi-Role & Print Struk',
      },
    ],
    testimonials: [
      {
        id: 1,
        client_name: 'Rizky Ananda',
        client_role: 'Mahasiswa Teknik Informatika',
        project_label: 'Skripsi AI Klasifikasi Citra CNN',
        tag: 'Lulus Sidang Nilai A',
        comment:
          'Awalnya pusing banget dospem minta akurasi dinaikkan di atas 90%. Dibantu perbaiki arsitektur model dan dikasih video panduan alur logika program sampai paham detailnya. Pas sidang penguji terkesan!',
        rating: 5,
        avatar_initials: 'RA',
        avatar_color: 'from-teal-500 to-emerald-600',
        source: 'admin',
      },
      {
        id: 2,
        client_name: 'Dimas Saputra',
        client_role: 'Owner Toko Retail & Fashion',
        project_label: 'Chatbot WhatsApp AI + Katalog',
        tag: 'Bisnis UMKM',
        comment:
          'Respon pelanggan jadi otomatis 24 jam nonstop. Admin toko nggak perlu bales manual satu-satu lagi untuk tanya stok dan rekapan invoice. Sangat mempermudah operasional bisnis saya.',
        rating: 5,
        avatar_initials: 'DS',
        avatar_color: 'from-indigo-500 to-purple-600',
        source: 'admin',
      },
      {
        id: 3,
        client_name: 'Mega Febriyanti',
        client_role: 'Mahasiswi Sistem Informasi',
        project_label: 'Skripsi SPK Metode TOPSIS & Web',
        tag: 'Garansi Revisi Cepat',
        comment:
          'Waktu revisi bab 4 dan 5 mepet banget H-3 pendaftaran sidang. Tim gercep bantu perbaiki rumus pembobotan dan tambah fitur export Excel. Komunikasinya ramah dan fast response!',
        rating: 5,
        avatar_initials: 'MF',
        avatar_color: 'from-amber-500 to-orange-600',
        source: 'admin',
      },
      {
        id: 4,
        client_name: 'Aldi Pratama',
        client_role: 'Mahasiswa Ilmu Komputer',
        project_label: 'Tugas Besar Pemrograman Python',
        tag: 'Koding Bersih & Rapi',
        comment:
          "Setiap baris kode dikasih komentar penjelasan, jadi pas dosen tanya 'fungsi baris ini buat apa', aku bisa jawab dengan lancar tanpa ragu. Nilai praktikum dapet 95!",
        rating: 5,
        avatar_initials: 'AP',
        avatar_color: 'from-cyan-500 to-blue-600',
        source: 'admin',
      },
    ],
    rating_summary: {
      average_rating: 5.0,
      total_reviews: 4,
      verified_count: 0,
    },
  });
  const [portfolioCategory, setPortfolioCategory] = useState('Semua');
  const [clientTestiModal, setClientTestiModal] = useState(null);
  const [clientTestiStatus, setClientTestiStatus] = useState({ loading: false, error: '', success: '' });

  // CMS State (Modul M2.A Site Settings & M11 FAQ + Tech Stack)
  const [cmsData, setCmsData] = useState({
    settings: {
      brand_name: 'Rizofara Technology',
      tagline: 'Digital Roots for a Brighter Tomorrow',
      whatsapp_number: '6285692390483',
      hero_badge:
        'Asistensi Kode Terstruktur • Dokumentasi Lengkap • Wireframe & Panduan Teknis',
      hero_title: 'Pengembangan Sistem Skripsi IT,',
      hero_highlight: 'Aplikasi Web & Chatbot AI',
      hero_subtitle:
        'Dirancang dan dikerjakan oleh tim software engineer. Setiap proyek dilengkapi source code yang terstruktur, dokumentasi arsitektur, serta sesi penjelasan alur program.',
      payment_bank_info:
        'BCA / Mandiri / Gopay / Dana / QRIS (Hubungi Admin untuk Nomor Rekening Resmi)',
    },
    faqs: [
      {
        id: 1,
        question: 'Bagaimana ketentuan revisi jika ada catatan dari dosen pembimbing atau penguji?',
        answer:
          'Kami memberikan garansi revisi tanpa biaya tambahan selama poin perbaikan masih berada dalam ruang lingkup (scope) fitur dan spesifikasi awal yang disepakati.',
        category: 'revisi',
      },
      {
        id: 2,
        question: 'Apakah disertakan panduan instalasi dan penjelasan alur kode?',
        answer:
          'Setiap penyerahan proyek mencakup panduan instalasi di perangkat Anda, dokumentasi README, serta penjelasan struktur database dan logika program untuk persiapan sidang.',
        category: 'umum',
      },
      {
        id: 3,
        question: 'Bagaimana tahapan pembayaran yang berlaku?',
        answer:
          'Pembayaran diawali dengan uang muka (DP) sebesar 30% hingga 40% setelah spesifikasi disepakati. Pelunasan dilakukan setelah sistem didemokan dan berjalan sesuai kesepakatan.',
        category: 'pembayaran',
      },
      {
        id: 4,
        question: 'Bagaimana kebijakan privasi data dan identitas klien?',
        answer:
          'Identitas klien, instansi atau kampus, serta dokumen penelitian bersifat rahasia dan tidak dipublikasikan ke halaman portofolio tanpa persetujuan klien.',
        category: 'privasi',
      },
    ],
    tech_stacks: [
      { id: 1, name: 'Python', emoji: 'PY', color: 'text-teal-400', is_highlighted: false },
      { id: 2, name: 'Java', emoji: 'JV', color: 'text-slate-200', is_highlighted: false },
      { id: 3, name: 'C++', emoji: 'CPP', color: 'text-slate-200', is_highlighted: false },
      { id: 4, name: 'PHP', emoji: 'PHP', color: 'text-slate-200', is_highlighted: false },
      { id: 5, name: 'SQL', emoji: 'SQL', color: 'text-teal-400', is_highlighted: false },
      { id: 6, name: 'Laravel', emoji: 'LRV', color: 'text-slate-200', is_highlighted: false },
      { id: 7, name: 'Next.js', emoji: 'NXT', color: 'text-slate-200', is_highlighted: false },
      { id: 8, name: 'Django', emoji: 'DJ', color: 'text-teal-400', is_highlighted: false },
      {
        id: 9,
        name: 'Balsamiq Wireframe',
        emoji: 'UI',
        color: 'text-teal-300',
        is_highlighted: true,
      },
    ],
  });

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
      // Gunakan fallback cmsData jika backend belum menyala
    }
  };

  const fetchPublicShowcase = async () => {
    try {
      const res = await axios.get(`${API_BASE}/showcase/public`);
      if (res.data) {
        setShowcaseData(res.data);
      }
    } catch (err) {
      // Gunakan fallback showcaseData jika backend belum menyala
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
      // Gunakan fallback config default jika backend belum menyala
    }
  };

  useEffect(() => {
    fetchPricingConfig();
    fetchPublicShowcase();
    fetchPublicCms();
  }, []);

  // Auto calculate when params change
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
      // Fallback calculation menggunakan pricingConfig di memori (100% identik dengan pricing_engine.py)
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
      let urgTier = 'Santai';
      if (ratio < 0.35) {
        urgMult = 1.35;
        urgTier = 'Kilat';
      } else if (ratio < 0.65) {
        urgMult = 1.2;
        urgTier = 'Cepat';
      } else if (ratio < 1.0) {
        urgMult = 1.1;
        urgTier = 'Standar';
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
    // Sinkronkan pilihan kalkulator ke form order (Perbaikan B-01)
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
      setTrackResults(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Order tidak ditemukan. Pastikan Kode Order lengkap (contoh: RZ-2610-XXXX) dan 4 digit terakhir Nomor WhatsApp sudah benar.';
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

      // Upload file if exists
      if (orderFile) {
        const formData = new FormData();
        formData.append('file', orderFile);
        await axios.post(`${API_BASE}/orders/${createdOrder.id}/upload-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setOrderSuccessData(createdOrder);
      setOrderFile(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(detail || 'Gagal membuat order. Mohon pastikan backend berjalan atau hubungi kami langsung via WhatsApp.');
    } finally {
      setOrderSubmitting(false);
    }
  };


  const handleRevisionSubmit = async (e) => {
    e.preventDefault();
    setRevisionSubmitting(true);
    try {
      await axios.post(`${API_BASE}/orders/${revisionCode}/revision`, {
        notes: revisionNotes
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
        error: err.response?.data?.detail || 'Gagal mengirim ulasan. Pastikan Kode Order & 4 digit WA benar.',
        success: '',
      });
    }
  };

  const openWhatsAppDirect = (topic = 'Konsultasi Layanan') => {
    const waNum = cmsData.settings?.whatsapp_number || '6285692390483';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">


      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <img
              src="/favicon.png"
              alt="Rizofara Technology Favicon"
              className="w-9 h-9 object-contain rounded-lg border border-slate-800 bg-slate-900 p-0.5"
            />
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block leading-none">
                {cmsData.settings?.brand_name || 'Rizofara Technology'}
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {cmsData.settings?.tagline || 'Digital Roots for a Brighter Tomorrow'}
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-teal-400 transition ${activeTab === 'home' ? 'text-teal-400 font-semibold' : ''}`}
            >
              Beranda
            </button>
            <a href="#services" className="hover:text-teal-400 transition">
              Layanan
            </a>
            <a href="#calculator" className="hover:text-teal-400 transition flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-teal-400" />
              Kalkulator Biaya
            </a>
            <a href="#tracking" className="hover:text-teal-400 transition flex items-center gap-1.5">
              <Search className="w-4 h-4 text-teal-400" />
              Cek Status Order
            </a>
            <a href="#portfolio" className="hover:text-teal-400 transition">
              Portofolio
            </a>
            <a href="#testimonials" className="hover:text-teal-400 transition">
              Testimoni
            </a>
            <a href="#faq" className="hover:text-teal-400 transition">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/admin');
                setActiveTab('admin');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-400 text-xs font-semibold border border-slate-800 transition"
              title="Portal Login Admin"
            >
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden lg:inline">Admin</span>
            </button>
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              Buat Order
            </button>
            <button
              onClick={() => openWhatsAppDirect('Konsultasi Skripsi/Web')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Kami
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Dinamis dari CMS Settings) */}
      <section className="pt-14 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-teal-400 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>
              {cmsData.settings?.hero_badge ||
                'Asistensi Kode Terstruktur • Dokumentasi Lengkap • Wireframe & Panduan Teknis'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            {cmsData.settings?.hero_title || 'Pengembangan Sistem Skripsi IT,'}{' '}
            <span className="text-teal-400">
              {cmsData.settings?.hero_highlight || 'Aplikasi Web & Chatbot AI'}
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {cmsData.settings?.hero_subtitle ||
              'Dirancang dan dikerjakan oleh tim software engineer. Setiap proyek dilengkapi source code yang terstruktur, dokumentasi arsitektur, serta sesi penjelasan alur program.'}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href="#calculator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition"
            >
              <Calculator className="w-4 h-4" />
              Hitung Estimasi Biaya
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#tracking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 hover:border-slate-700 transition"
            >
              <Search className="w-4 h-4 text-teal-400" />
              Lacak Progres Order
            </a>
          </div>

          {/* Trust Value Cards */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
              <GraduationCap className="w-5 h-5 text-teal-400 mb-2.5" />
              <h4 className="font-bold text-sm text-white">Source Code Terstruktur</h4>
              <p className="text-xs text-slate-400 mt-1">Hak milik penuh dengan komentar penjelasan pada modul utama.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
              <ShieldCheck className="w-5 h-5 text-teal-400 mb-2.5" />
              <h4 className="font-bold text-sm text-white">Garansi Revisi Scope</h4>
              <p className="text-xs text-slate-400 mt-1">Perbaikan tanpa biaya tambahan sesuai spesifikasi awal yang disepakati.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
              <Clock className="w-5 h-5 text-teal-400 mb-2.5" />
              <h4 className="font-bold text-sm text-white">Jadwal Terukur</h4>
              <p className="text-xs text-slate-400 mt-1">Tersedia opsi pengerjaan reguler maupun prioritas sesuai tenggat waktu.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
              <Video className="w-5 h-5 text-teal-400 mb-2.5" />
              <h4 className="font-bold text-sm text-white">Dokumentasi & Panduan</h4>
              <p className="text-xs text-slate-400 mt-1">Dilengkapi panduan instalasi lokal dan penjelasan alur kerja sistem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stacks & Tools Showcase (Tanpa Emoji) */}
      <section className="py-7 bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
            Teknologi, Bahasa Pemrograman & Perangkat Desain
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold">
            {(cmsData.tech_stacks || []).map((t, idx) => (
              <span
                key={t.id || idx}
                className={`px-3 py-1.5 rounded-lg bg-slate-950 border ${
                  t.is_highlighted ? 'border-teal-500/40 text-teal-300' : 'border-slate-800 text-slate-200'
                } flex items-center gap-2`}
              >
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-teal-400">
                  {getCleanTechTag(t.emoji, t.name)}
                </span>
                <span>{t.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Katalog Layanan</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Ruang Lingkup Pengembangan Sistem
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Layanan teknis untuk kebutuhan penelitian akademik, tugas pemrograman, hingga pengembangan aplikasi web dan otomasi bisnis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingConfig.services.map((svc) => {
              const iconMap = {
                GraduationCap,
                Globe,
                Bot,
                Code2,
                Terminal,
                Laptop,
              };
              const IconComp = iconMap[svc.icon] || Code2;
              return (
                <div
                  key={svc.slug}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-teal-300 border border-slate-800">
                        Mulai Rp {(svc.base_price_min || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-white mb-2">{svc.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {svc.description}
                    </p>
                    <ul className="text-xs text-slate-300 space-y-2 mb-6">
                      {(svc.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setCalcService(svc.slug);
                      setCalcDays(svc.standard_days || 14);
                      document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-teal-400 flex items-center justify-center gap-1 transition"
                  >
                    Hitung Estimasi {svc.short_label}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Pricing Calculator Section */}
      <section id="calculator" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Simulasi Biaya</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Kalkulator Estimasi Proyek
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Sesuaikan jenis layanan, platform, tingkat kompleksitas, dan target waktu pengerjaan untuk melihat rincian estimasi biaya.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              {/* 1. Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Pilih Jenis Layanan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {pricingConfig.services.map((s) => {
                    const iconMap = {
                      GraduationCap,
                      Globe,
                      Bot,
                      Code2,
                      Terminal,
                      Laptop,
                    };
                    const Icon = iconMap[s.icon] || Code2;
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        onClick={() => {
                          setCalcService(s.slug);
                          setCalcDays(s.standard_days || 14);
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                          calcService === s.slug
                            ? 'bg-teal-500/10 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="truncate max-w-full">{s.short_label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Platform / Tech */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  2. Platform / Fokus Teknologi
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(pricingConfig.platform_factors || [])
                    .filter(
                      (p) =>
                        !p.applicable_services ||
                        p.applicable_services.length === 0 ||
                        p.applicable_services.includes(calcService)
                    )
                    .map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => setCalcPlatform(p.code)}
                        className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition ${
                          calcPlatform === p.code
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* 3. Complexity */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  3. Tingkat Kompleksitas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(pricingConfig.complexity_factors || [])
                    .filter(
                      (c) =>
                        !c.applicable_services ||
                        c.applicable_services.length === 0 ||
                        c.applicable_services.includes(calcService)
                    )
                    .map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setCalcComplexity(c.code)}
                        className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition ${
                          calcComplexity === c.code
                            ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* 4. Deadline Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    4. Target Waktu Deadline
                  </label>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {calcDays} Hari Pengerjaan ({estimateResult?.urgency_tier || 'Standar'})
                  </span>
                </div>
                <input
                  type="range"
                  min={currentServiceObj?.min_days || 1}
                  max={currentServiceObj?.max_days || 60}
                  value={calcDays}
                  onChange={(e) => setCalcDays(e.target.value)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Min {currentServiceObj?.min_days || 1} Hari (Kilat)</span>
                  <span>Standar {currentServiceObj?.standard_days || 14} Hari</span>
                  <span>Max {currentServiceObj?.max_days || 60} Hari (Santai)</span>
                </div>
              </div>

              {/* 5. Dynamic Add-ons Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  5. Fasilitas Tambahan (Add-ons)
                </label>
                <div className="space-y-2">
                  {(pricingConfig.addons || [])
                    .filter(
                      (addon) =>
                        !addon.applicable_services ||
                        addon.applicable_services.length === 0 ||
                        addon.applicable_services.includes(calcService)
                    )
                    .map((addon) => (
                      <label
                        key={addon.code}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(addon.code)}
                            onChange={() => toggleAddonCode(addon.code)}
                            className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0"
                          />
                          <div>
                            <span className="text-xs font-semibold text-slate-200">
                              {addon.label}
                            </span>
                            {addon.description && (
                              <p className="text-[10px] text-slate-400">{addon.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-teal-400 shrink-0">
                          {addon.price_type === 'percent'
                            ? `+${addon.price_min}%`
                            : `+Rp ${(addon.price_min / 1000).toFixed(0)}rb`}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            {/* Estimate Summary Result */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ringkasan Estimasi Biaya
                </span>
                <span className="px-2.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-bold uppercase rounded">
                  Simulasi Otomatis
                </span>
              </div>

              <div className="text-xs text-slate-400 font-medium">Rentang Estimasi Investasi:</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                  Rp {estimateResult ? (estimateResult.estimated_min_price).toLocaleString('id-ID') : '...'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  – Rp {estimateResult ? (estimateResult.estimated_max_price).toLocaleString('id-ID') : '...'}
                </span>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Uang Muka (DP 40%):</span>
                  <span className="font-bold text-teal-400 font-mono">
                    Rp {estimateResult ? (estimateResult.recommended_dp).toLocaleString('id-ID') : '...'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Pelunasan dilakukan setelah sistem didemokan dan sesuai ruang lingkup.
                </div>
              </div>

              {/* Rincian Perhitungan (Breakdown) */}
              {estimateResult?.breakdown && estimateResult.breakdown.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1.5">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                    Komponen Perhitungan:
                  </div>
                  {estimateResult.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-400">
                      <span>{item.label}</span>
                      <span className="font-mono text-slate-200">
                        {item.multiplier
                          ? `×${item.multiplier.toFixed(2)}`
                          : item.amount_min
                          ? `+Rp ${(item.amount_min / 1000).toLocaleString('id-ID')}rb`
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Benefits included */}
              <div className="mt-6 border-t border-slate-800 pt-5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Cakupan Deliverables:
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {estimateResult?.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-2.5">
                <button
                  onClick={openOrderModalFromCalc}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Ajukan Spesifikasi Order
                </button>
                <button
                  onClick={() =>
                    openWhatsAppDirect(
                      `Estimasi ${calcService.toUpperCase()} (${calcPlatform}) - Budget ~Rp ${
                        estimateResult ? (estimateResult.estimated_min_price).toLocaleString('id-ID') : ''
                      }`
                    )
                  }
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  Diskusikan Spesifikasi via WhatsApp
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center mt-4">
                {estimateResult?.notes}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Order Tracker Section */}
      <section id="tracking" className="py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold mb-3">
              <Search className="w-3.5 h-3.5" />
              <span>Transparansi & Privasi Aman</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Cek Status & Progres Pengerjaan
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Masukkan <b>Kode Order</b> (contoh: <code>RZ-2610-K7Q2</code>) beserta <b>4 digit terakhir Nomor WhatsApp</b> Anda untuk verifikasi keamanan.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Kode Order (misal: RZ-2610-XXXX)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <input
              type="text"
              maxLength={4}
              value={trackWaLast4}
              onChange={(e) => setTrackWaLast4(e.target.value.replace(/\D/g, ''))}
              placeholder="4 Digit Akhir WA"
              className="w-full sm:w-40 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-center font-mono"
            />
            <button
              type="submit"
              disabled={trackLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition shrink-0 flex items-center justify-center gap-1.5"
            >
              {trackLoading ? 'Mencari...' : 'Lacak'}
            </button>
          </form>

          {/* Error Message */}
          {trackError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {/* Tracking Result Card */}
          {trackResults && trackResults.length > 0 && (
            <div className="space-y-6">
              {trackResults.map((order, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-teal-400 bg-teal-950/50 px-2.5 py-1 rounded-lg border border-teal-500/30">
                          {order.order_code}
                        </span>
                        <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {order.service_type}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-white mt-2">{order.title}</h3>
                      <p className="text-xs text-slate-400">Pemesan: {order.client_name} • Deadline: {order.deadline}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400">Status Saat Ini:</span>
                      <div className="text-sm font-extrabold text-teal-300 uppercase mt-0.5">
                        {order.status.replaceAll('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan Tagihan & Pembayaran (Modul M7) */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Total Tagihan Efektif</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">
                        Rp {(order.effective_bill || order.final_price || order.price_estimate || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-500/20">
                      <div className="text-[11px] text-teal-300">Sudah Terbayar</div>
                      <div className="text-sm font-extrabold text-teal-400 mt-0.5">
                        Rp {(order.total_paid || order.dp_amount || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-amber-300">Sisa Pelunasan</div>
                        <div className="text-sm font-extrabold text-amber-400 mt-0.5">
                          Rp {(order.remaining_balance ?? 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        order.payment_status === 'paid_in_full'
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : order.payment_status === 'dp_paid'
                          ? 'bg-teal-950/60 border-teal-500/40 text-teal-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {order.payment_status === 'paid_in_full' ? 'LUNAS' : order.payment_status === 'dp_paid' ? 'DP MASUK' : 'BELUM DP'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-300">Progres Keseluruhan:</span>
                      <span className="text-teal-400 font-mono">{order.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${order.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Milestones Checklist (Modul M6) */}
                  {order.milestones && order.milestones.length > 0 ? (
                    <div className="mt-6">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Tahapan Pengerjaan (Milestones)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[...order.milestones]
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((m) => (
                            <div
                              key={m.id}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                                m.is_completed
                                  ? 'bg-teal-950/20 border-teal-500/30 text-teal-200'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-400'
                              }`}
                            >
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  m.is_completed ? 'text-teal-400' : 'text-slate-600'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold truncate">{m.title}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                                    {m.weight_percent}%
                                  </span>
                                </div>
                                {m.notes && (
                                  <p className="text-[11px] text-slate-400 mt-1">{m.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div className={`p-2 rounded-lg border ${order.progress_percent >= 15 ? 'bg-teal-950/30 border-teal-500/30 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                        1. Konsultasi & DP
                      </div>
                      <div className={`p-2 rounded-lg border ${order.progress_percent >= 35 ? 'bg-teal-950/30 border-teal-500/30 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                        2. Analisis & Desain
                      </div>
                      <div className={`p-2 rounded-lg border ${order.progress_percent >= 70 ? 'bg-teal-950/30 border-teal-500/30 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                        3. Koding Sistem
                      </div>
                      <div className={`p-2 rounded-lg border ${order.progress_percent >= 90 ? 'bg-teal-950/30 border-teal-500/30 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                        4. Demo & Review
                      </div>
                      <div className={`p-2 rounded-lg border ${order.progress_percent >= 100 ? 'bg-teal-950/30 border-teal-500/30 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                        5. Selesai & Bimbingan
                      </div>
                    </div>
                  )}

                  {/* Riwayat Timeline Progres (Modul M6) */}
                  {order.timeline_logs && order.timeline_logs.filter((l) => l.is_public).length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Log Aktivitas & Riwayat Progres
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {[...order.timeline_logs]
                          .filter((l) => l.is_public)
                          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                          .map((log) => (
                            <div key={log.id} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/90 flex items-start justify-between gap-3 text-xs">
                              <div>
                                <span className="font-semibold text-slate-200">{log.title}</span>
                                {log.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">{log.description}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                {log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID') : ''}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Riwayat Revisi & Balasan Developer (Modul M8) */}
                  {order.revisions && order.revisions.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-800/80">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
                        Daftar Catatan Revisi ({order.revisions.length})
                      </h4>
                      <div className="space-y-2.5">
                        {order.revisions.map((rev) => (
                          <div key={rev.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white">{rev.description}</span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                rev.status === 'completed'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                  : rev.status === 'rejected_out_of_scope'
                                  ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                              }`}>
                                {rev.status}
                              </span>
                            </div>
                            {rev.is_out_of_scope && rev.extra_cost > 0 && (
                              <div className="text-[11px] text-amber-300">
                                Diluar Scope Awal • Biaya Tambahan: <b>Rp {rev.extra_cost.toLocaleString('id-ID')}</b>
                              </div>
                            )}
                            {rev.admin_response && (
                              <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-200">
                                <b>Balasan Developer:</b> {rev.admin_response}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Demo Link if available */}
                  {order.demo_url && (
                    <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-indigo-300">Link Demo Aplikasi Sudah Tersedia:</span>
                        <p className="text-xs text-slate-400">Silakan uji coba dan pastikan sesuai kebutuhan Anda.</p>
                      </div>
                      <a
                        href={order.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                      >
                        Buka Demo
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Revision & Testimonial Form Toggle */}
                  <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {order.status === 'completed'
                        ? 'Pesanan Anda telah selesai! Bagikan pengalaman Anda atau ajukan catatan tambahan:'
                        : 'Ada catatan perbaikan dari dosen pembimbing?'}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === 'completed' && (
                        <button
                          onClick={() => openClientTestimonialModal(order)}
                          className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          Beri Ulasan & Testimoni
                        </button>
                      )}
                      <button
                        onClick={() => setRevisionCode(order.order_code)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition"
                      >
                        Ajukan Catatan Revisi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Portfolio Showcase Section */}
      <section id="portfolio" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
              Portofolio & Studi Kasus
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Arsip Implementasi Sistem
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Dokumentasi beberapa sistem penelitian akademik, aplikasi web, dan otomasi yang telah dikembangkan.
            </p>
          </div>

          {/* Filter Kategori Portofolio */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {['Semua', ...new Set((showcaseData.portfolio_items || []).map((p) => p.category))].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setPortfolioCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    portfolioCategory === cat
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showcaseData.portfolio_items || [])
              .filter((p) => portfolioCategory === 'Semua' || p.category === portfolioCategory)
              .map((item) => {
                return (
                  <div
                    key={item.id || item.slug}
                    className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border bg-teal-500/10 text-teal-400 border-teal-500/30">
                          {item.category}
                        </span>
                        {item.highlight_metric && (
                          <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                            {item.highlight_metric}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-white mt-3 mb-2">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.summary}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex flex-wrap gap-1.5">
                        {(item.tech_tags || []).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {item.demo_url && (
                        <a
                          href={item.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-teal-400 hover:underline inline-flex items-center gap-1"
                        >
                          Demo <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-900/50 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
              Ulasan Klien
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Catatan dari Klien & Mahasiswa
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Umpan balik dari klien bisnis dan mahasiswa yang telah menyelesaikan proyek bersama tim kami.
            </p>
            {showcaseData.rating_summary && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>
                  Rata-rata {showcaseData.rating_summary.average_rating} / 5.0 ({showcaseData.rating_summary.total_reviews} Ulasan)
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(showcaseData.testimonials || []).map((t, idx) => (
              <div
                key={t.id || idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-teal-400 border border-slate-800 truncate">
                      {t.tag || 'Klien Terverifikasi'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    "{t.comment}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {t.avatar_initials || 'KL'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-white truncate">{t.client_name}</h4>
                      {(t.source === 'client' || t.order_code) && (
                        <ShieldCheck
                          className="w-3.5 h-3.5 text-teal-400 shrink-0"
                          title="Klien Terverifikasi Kode Order"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{t.client_role}</p>
                    {t.project_label && (
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        {t.project_label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial CTA Banner */}
          <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h3 className="font-bold text-base text-white">Proyek Anda Telah Selesai?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Kirimkan ulasan menggunakan Kode Order dan 4 digit terakhir nomor WhatsApp untuk mendapatkan penanda Klien Terverifikasi.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <button
                onClick={() => openClientTestimonialModal()}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                Tulis Ulasan Klien
              </button>
              <button
                onClick={() => openWhatsAppDirect('Kirim Ulasan & Feedback')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                Hubungi WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
              Informasi Layanan
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Pertanyaan Umum (FAQ)</h2>
            <p className="text-slate-400 text-sm mt-2">Ketentuan teknis, alur pembayaran, dan garansi revisi pengerjaan proyek.</p>
          </div>

          <div className="space-y-4">
            {(cmsData.faqs || []).map((faq, idx) => (
              <div key={faq.id || idx} className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-white">{faq.question}</h4>
                  {faq.category && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-teal-400 border border-slate-800">
                      {faq.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Rizofara Technology Favicon"
              className="w-7 h-7 object-contain rounded-md border border-slate-800 bg-slate-900 p-0.5"
            />
            <div>
              <span className="font-bold text-slate-300">
                {cmsData.settings?.brand_name || 'Rizofara Technology'}
              </span>
              <span className="text-slate-400"> — {cmsData.settings?.tagline || 'Digital Roots for a Brighter Tomorrow'}</span>
            </div>
          </div>
          <div>
            <span>© {new Date().getFullYear()} {cmsData.settings?.brand_name || 'Rizofara Technology'}. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* MODAL ORDER FORM */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl my-8">
            <button
              onClick={() => {
                setIsOrderModalOpen(false);
                setOrderSuccessData(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            {orderSuccessData ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-xl text-white">Order Berhasil Dibuat</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Simpan Kode Order ini untuk memantau progres pengerjaan di menu Cek Status:
                </p>
                <div className="my-4 p-3 rounded-xl bg-slate-950 border border-teal-500/40 text-teal-300 font-mono text-lg font-bold">
                  {orderSuccessData.order_code}
                </div>
                <p className="text-[11px] text-slate-400 mb-6">
                  Tim kami akan menghubungi nomor WhatsApp Anda ({orderSuccessData.client_whatsapp}) untuk konfirmasi detail teknis.
                </p>
                <button
                  onClick={() => {
                    openWhatsAppDirect(`Konfirmasi Order ${orderSuccessData.order_code}`);
                    setIsOrderModalOpen(false);
                    setOrderSuccessData(null);
                  }}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Konfirmasi via WhatsApp
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-extrabold text-xl text-white">Form Pengajuan Order</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Lengkapi spesifikasi proyek Anda untuk mendapatkan Kode Order dan penjadwalan.
                </p>

                <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap / Panggilan *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.client_name}
                      onChange={(e) => setOrderForm({ ...orderForm, client_name: e.target.value })}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nomor WhatsApp Aktif *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.client_whatsapp}
                      onChange={(e) => setOrderForm({ ...orderForm, client_whatsapp: e.target.value })}
                      placeholder="Contoh: 085692390483"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Layanan *</label>
                      <select
                        value={orderForm.service_type}
                        onChange={(e) => {
                          setOrderForm({ ...orderForm, service_type: e.target.value });
                          setCalcService(e.target.value);
                        }}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                      >
                        {pricingConfig.services.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Target Deadline *</label>
                      <input
                        type="text"
                        required
                        value={orderForm.deadline}
                        onChange={(e) => setOrderForm({ ...orderForm, deadline: e.target.value })}
                        placeholder="Contoh: 14 Hari / 25 Nov"
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Judul / Topik Proyek *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.title}
                      onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
                      placeholder="Contoh: Sistem Klasifikasi Penyakit Daun Berbasis CNN"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Deskripsi & Kebutuhan Spesifik *</label>
                    <textarea
                      rows={3}
                      required
                      value={orderForm.description}
                      onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                      placeholder="Jelaskan fitur utama, algoritma/metode, dan bahasa pemrograman yang dibutuhkan..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Unggah Panduan / Dokumen (Opsional)</label>
                    <input
                      type="file"
                      onChange={(e) => setOrderFile(e.target.files[0])}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={orderSubmitting}
                      className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                    >
                      {orderSubmitting ? 'Mengirim Data...' : 'Kirim & Dapatkan Kode Order'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL REVISION */}
      {revisionCode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setRevisionCode('')}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-lg text-white">Ajukan Catatan Revisi</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Kode Order: <span className="text-teal-400 font-mono font-bold">{revisionCode}</span>
            </p>

            {revisionSuccess ? (
              <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs text-center">
                Catatan revisi berhasil dikirim ke tim pengembang dan akan segera ditindaklanjuti.
              </div>
            ) : (
              <form onSubmit={handleRevisionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Poin-poin Perbaikan:</label>
                  <textarea
                    rows={4}
                    required
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Tuliskan rincian perbaikan secara terstruktur di sini..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={revisionSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition"
                >
                  {revisionSubmitting ? 'Mengirim...' : 'Kirim Catatan Revisi'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL KIRIM TESTIMONI KLIEN TERVERIFIKASI */}
      {clientTestiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => setClientTestiModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Ulasan Klien Terverifikasi</span>
            </div>
            <h3 className="font-extrabold text-lg text-white">Bagikan Pengalaman Anda</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Masukkan <b>Kode Order</b> yang telah berstatus <b>Selesai (Completed)</b> beserta 4 digit terakhir nomor WhatsApp Anda.
            </p>

            {clientTestiStatus.success ? (
              <div className="p-4 rounded-xl bg-teal-950/50 border border-teal-500/40 text-teal-200 text-xs space-y-3 text-center">
                <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
                <p className="leading-relaxed">{clientTestiStatus.success}</p>
                <button
                  type="button"
                  onClick={() => setClientTestiModal(null)}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleClientTestimonialSubmit} className="space-y-3.5 text-xs">
                {clientTestiStatus.error && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{clientTestiStatus.error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kode Order *</label>
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      4 Digit Terakhir WA *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="Contoh: 0483"
                      value={clientTestiModal.wa_last4}
                      onChange={(e) =>
                        setClientTestiModal({
                          ...clientTestiModal,
                          wa_last4: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nama Tampilan (Bisa Inisial) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rizky A."
                      value={clientTestiModal.client_name}
                      onChange={(e) =>
                        setClientTestiModal({ ...clientTestiModal, client_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Status / Jurusan / Bisnis *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Mahasiswa Teknik Informatika"
                      value={clientTestiModal.client_role}
                      onChange={(e) =>
                        setClientTestiModal({ ...clientTestiModal, client_role: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                    >
                      <option value={5}>5 / 5 — Sangat Puas</option>
                      <option value={4}>4 / 5 — Puas</option>
                      <option value={3}>3 / 5 — Cukup</option>
                      <option value={2}>2 / 5 — Kurang</option>
                      <option value={1}>1 / 5 — Sangat Kurang</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Label Highlight Singkat
                    </label>
                    <input
                      type="text"
                      placeholder="Lulus Sidang Nilai A"
                      value={clientTestiModal.tag}
                      onChange={(e) =>
                        setClientTestiModal({ ...clientTestiModal, tag: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={clientTestiModal.consent_publish}
                    onChange={(e) =>
                      setClientTestiModal({
                        ...clientTestiModal,
                        consent_publish: e.target.checked,
                      })
                    }
                    className="rounded border-slate-700"
                  />
                  <span>Saya mengizinkan ulasan ini ditampilkan di halaman utama Rizofara.</span>
                </label>

                <button
                  type="submit"
                  disabled={clientTestiStatus.loading}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition"
                >
                  {clientTestiStatus.loading ? 'Memverifikasi & Mengirim...' : 'Kirim Ulasan Terverifikasi'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
