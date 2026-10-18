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
  Quote
} from 'lucide-react';
import axios from 'axios';

const API_BASE = window.location.origin.includes('5173')
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('home');

  // Calculator State
  const [calcService, setCalcService] = useState('skripsi');
  const [calcComplexity, setCalcComplexity] = useState('intermediate');
  const [calcPlatform, setCalcPlatform] = useState('web');
  const [calcDays, setCalcDays] = useState(14);
  const [calcReport, setCalcReport] = useState(true);
  const [calcWireframe, setCalcWireframe] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Order Tracker State
  const [trackQuery, setTrackQuery] = useState('');
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
    deadline: '',
  });
  const [orderFile, setOrderFile] = useState(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Revision Modal State
  const [revisionCode, setRevisionCode] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  // Auto calculate when params change
  useEffect(() => {
    fetchEstimate();
  }, [calcService, calcComplexity, calcPlatform, calcDays, calcReport, calcWireframe]);

  const fetchEstimate = async () => {
    setIsCalculating(true);
    try {
      const response = await axios.post(`${API_BASE}/calculator/estimate`, {
        service_type: calcService,
        complexity: calcComplexity,
        urgency_days: parseInt(calcDays),
        tech_platform: calcPlatform,
        include_report: calcReport,
        include_wireframe: calcWireframe,
      });
      setEstimateResult(response.data);
    } catch (err) {
      // Fallback calculation in case backend is not running yet
      let min = 1800000;
      let max = 3200000;
      if (calcService === 'tugas') { min = 150000; max = 350000; }
      else if (calcService === 'website') { min = 1200000; max = 3500000; }
      else if (calcService === 'chatbot') { min = 900000; max = 2500000; }

      if (calcComplexity === 'advanced') { min *= 1.4; max *= 1.4; }
      if (calcComplexity === 'expert') { min *= 1.8; max *= 1.8; }
      if (calcDays <= 6) { min *= 1.35; max *= 1.35; }
      else if (calcDays <= 10) { min *= 1.20; max *= 1.20; }

      if (calcWireframe) { min += 100000; max += 250000; }

      setEstimateResult({
        service_type: calcService,
        estimated_min_price: Math.round(min),
        estimated_max_price: Math.round(max),
        recommended_dp: Math.round(min * 0.4),
        estimated_days: calcDays,
        benefits: [
          'Full Source Code 100% Hak Milik',
          'Garansi Revisi Tanpa Biaya Tambahan',
          'Video Panduan / Dokumentasi Menjalankan Program',
          calcReport ? 'Bantuan Pembahasan Algoritma & Flowchart' : null,
          calcWireframe ? 'Desain Wireframe UI/UX (Balsamiq Mockups)' : null,
        ].filter(Boolean),
        notes: 'Estimasi indikatif. Diskusikan spesifikasi final bersama kami via WhatsApp.'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResults(null);
    try {
      const res = await axios.get(`${API_BASE}/orders/track/${encodeURIComponent(trackQuery.trim())}`);
      setTrackResults(res.data);
    } catch (err) {
      setTrackError('Order tidak ditemukan. Pastikan Kode Order (misal: JT-2610-XXXX) atau Nomor WhatsApp sudah benar.');
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
    } catch (err) {
      alert('Gagal membuat order. Mohon pastikan backend berjalan atau hubungi kami langsung via WhatsApp.');
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

  const openWhatsAppDirect = (topic = 'Konsultasi Layanan') => {
    const text = encodeURIComponent(
      `Halo Tim Rizofara Technology,\nSaya tertarik konsultasi terkait: ${topic}.\nMohon informasi ketersediaan jadwal dan estimasinya ya kak. Terima kasih!`
    );
    window.open(`https://wa.me/6285692390483?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">


      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <img
              src="/logo-icon.png"
              alt="Rizofara Technology Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105"
            />
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                Rizofara <span className="text-teal-400">Technology</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Digital Roots for a Brighter Tomorrow</p>
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
            <a href="#calculator" className="hover:text-teal-400 transition flex items-center gap-1">
              <Calculator className="w-4 h-4 text-teal-400" />
              Kalkulator Biaya
            </a>
            <a href="#tracking" className="hover:text-teal-400 transition flex items-center gap-1">
              <Search className="w-4 h-4 text-indigo-400" />
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              Buat Order
            </button>
            <button
              onClick={() => openWhatsAppDirect('Konsultasi Skripsi/Web')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 transition transform hover:-translate-y-0.5"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Kami
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-teal-400 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Asistensi Kode Bersih • Bebas Plagiasi • Wireframe Balsamiq & Video Panduan</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Solusi Skripsi IT, Pembuatan{' '}
            <span className="gradient-text">Website & Chatbot AI</span> Tanpa Pusing
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Dikerjakan langsung oleh tim software engineer berpengalaman. Bukan hanya menyerahkan file kodingan,
            kami bantu jelaskan logika dan alur algoritma sistemnya sampai Anda benar-benar paham.
          </p>

          {/* CTA Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#calculator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/25 transition transform hover:-translate-y-0.5"
            >
              <Calculator className="w-4 h-4" />
              Hitung Estimasi Biaya
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#tracking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 hover:border-slate-700 transition"
            >
              <Search className="w-4 h-4 text-indigo-400" />
              Lacak Progres Order Anda
            </a>
          </div>

          {/* Trust Value Badges */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <GraduationCap className="w-6 h-6 text-teal-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Source Code Bersih</h4>
              <p className="text-xs text-slate-400 mt-1">100% hak milik kode rapi dengan penjelasan komentar lengkap.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <ShieldCheck className="w-6 h-6 text-indigo-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Garansi Revisi</h4>
              <p className="text-xs text-slate-400 mt-1">Revisi tanpa biaya tambahan sesuai batasan scope awal.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <Clock className="w-6 h-6 text-amber-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Opsi Kilat Tersedia</h4>
              <p className="text-xs text-slate-400 mt-1">Deadline mepet? Tersedia pengerjaan intensif mulai 5-7 hari.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <Video className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Video Panduan</h4>
              <p className="text-xs text-slate-400 mt-1">Diberikan video tutorial instalasi & cara running sistem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stacks & Tools Showcase */}
      <section className="py-8 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Stack Teknologi & Bahasa Pemrograman yang Kami Kuasai:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold">
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-teal-400 shadow-sm flex items-center gap-1.5">
              <span>🐍</span> Python
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-red-400 shadow-sm flex items-center gap-1.5">
              <span>☕</span> Java
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 shadow-sm flex items-center gap-1.5">
              <span>⚡</span> C++
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 shadow-sm flex items-center gap-1.5">
              <span>🐘</span> PHP
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 shadow-sm flex items-center gap-1.5">
              <span>🗄️</span> SQL
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-red-500 shadow-sm flex items-center gap-1.5">
              <span>🔴</span> Laravel
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sky-400 shadow-sm flex items-center gap-1.5">
              <span>⚛️</span> Next.js
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 shadow-sm flex items-center gap-1.5">
              <span>🟢</span> Django
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-teal-500/40 text-teal-300 shadow-sm flex items-center gap-1.5">
              <span>📐</span> Balsamiq (Wireframing UI/UX)
            </span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Katalog Layanan</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Apa yang Bisa Kami Bantu Selesaikan?
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Mulai dari tugas kuliah mingguan, tugas akhir skripsi, hingga software house pembuatan web dan chatbot komersial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service 1 */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between hover:border-teal-500/40 transition group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Program Skripsi & Tugas Akhir</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Pembuatan sistem skripsi lengkap: Web, Mobile, AI/Machine Learning, IoT, Sistem Informasi & SPK.
                </p>
                <ul className="text-xs text-slate-300 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Algoritma: CNN, YOLO, SAW, AHP, dll.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Lengkap Flowchart & DFD/UML</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Desain Wireframe UI/UX (Balsamiq)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setCalcService('skripsi');
                  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-teal-400 flex items-center justify-center gap-1 transition"
              >
                Cek Harga Skripsi
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Service 2 */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Jasa Pembuatan Website</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Website Company Profile UMKM/Bisnis, Toko Online (E-Commerce), Portal Web, & Web App Custom.
                </p>
                <ul className="text-xs text-slate-300 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Desain Modern & Mobile Responsive</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Stack: React, Next.js, Laravel, Django</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Gratis Setup Hosting & Domain</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setCalcService('website');
                  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-400 flex items-center justify-center gap-1 transition"
              >
                Cek Harga Website
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Service 3 */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between hover:border-emerald-500/40 transition group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Jasa Pembuatan Chatbot</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Chatbot Customer Service WhatsApp, Telegram Bot Automation, dan AI Assistant RAG dengan Gemini/OpenAI.
                </p>
                <ul className="text-xs text-slate-300 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Respon Otomatis 24 Jam Nonstop</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Koneksi Database & API Toko/Web</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Bisa untuk Skripsi AI / Kebutuhan Bisnis</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setCalcService('chatbot');
                  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1 transition"
              >
                Cek Harga Chatbot
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Service 4 */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between hover:border-amber-500/40 transition group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                  <Terminal className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Tugas Kuliah Pemrograman</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Bantuan asistensi tugas koding mingguan, praktikum laboratorium, algoritma & basis data SQL.
                </p>
                <ul className="text-xs text-slate-300 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Bahasa: Python, Java, C++, PHP, SQL</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Komentar penjelasan di setiap baris kode</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Pengerjaan fleksibel & tepat waktu</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setCalcService('tugas');
                  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 flex items-center justify-center gap-1 transition"
              >
                Cek Harga Tugas
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Calculator Section */}
      <section id="calculator" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Transparan & Terjangkau</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Kalkulator Estimasi Biaya
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Ketahui estimasi biaya dan durasi pengerjaan sebelum Anda memutuskan. Tidak ada biaya tersembunyi!
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Pilih Jenis Layanan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'skripsi', label: 'Skripsi IT', icon: GraduationCap },
                    { id: 'tugas', label: 'Tugas Kuliah', icon: Terminal },
                    { id: 'website', label: 'Website Dev', icon: Globe },
                    { id: 'chatbot', label: 'Chatbot AI', icon: Bot },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCalcService(s.id)}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                          calcService === s.id
                            ? 'bg-teal-500/10 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform / Tech */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  2. Platform / Fokus Teknologi
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'web', label: 'Web' },
                    { id: 'mobile', label: 'Mobile (Flutter)' },
                    { id: 'ai_ml', label: 'AI / ML / Data' },
                    { id: 'iot', label: 'IoT' },
                    { id: 'desktop', label: 'Desktop' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCalcPlatform(p.id)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition ${
                        calcPlatform === p.id
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  3. Tingkat Kompleksitas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'basic', label: 'Dasar (CRUD)' },
                    { id: 'intermediate', label: 'Menengah' },
                    { id: 'advanced', label: 'Lanjutan (AI/API)' },
                    { id: 'expert', label: 'Kompleks / Riset' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCalcComplexity(c.id)}
                      className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition ${
                        calcComplexity === c.id
                          ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    4. Target Waktu Deadline
                  </label>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {calcDays} Hari Pengerjaan {calcDays <= 6 ? '(Express Kilat)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={calcDays}
                  onChange={(e) => setCalcDays(e.target.value)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>5 Hari (Kilat)</span>
                  <span>7 Hari (Cepat)</span>
                  <span>14 Hari (Standar)</span>
                  <span>30 Hari (Santai)</span>
                </div>
              </div>

              {/* Add-ons Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  5. Fasilitas Tambahan
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={calcReport}
                      onChange={(e) => setCalcReport(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Bantuan Laporan / Bab Pembahasan Program</span>
                      <p className="text-[10px] text-slate-400">Termasuk diagram alur, arsitektur, dan penjelasan algoritma.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={calcWireframe}
                      onChange={(e) => setCalcWireframe(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Desain Wireframe UI/UX (Balsamiq Mockups)</span>
                      <p className="text-[10px] text-slate-400">Rancangan sketsa antarmuka visual halaman aplikasi sebelum dikoding.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Estimate Summary Result */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <span className="px-3 py-1 bg-teal-500 text-slate-950 text-[10px] font-extrabold uppercase rounded-full shadow-lg">
                  Hasil Estimasi
                </span>
              </div>

              <div className="text-xs text-slate-400 font-medium">Perkiraan Biaya Investasi:</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Rp {estimateResult ? (estimateResult.estimated_min_price).toLocaleString('id-ID') : '...'}
                </span>
                <span className="text-xs text-slate-400">
                  - Rp {estimateResult ? (estimateResult.estimated_max_price).toLocaleString('id-ID') : '...'}
                </span>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 text-xs text-teal-300">
                <div className="flex justify-between items-center">
                  <span>Rekomendasi DP (30-40%):</span>
                  <span className="font-bold">
                    Rp {estimateResult ? (estimateResult.recommended_dp).toLocaleString('id-ID') : '...'}
                  </span>
                </div>
                <div className="text-[10px] text-teal-400/80 mt-1">
                  *Pelunasan hanya dibayar setelah demo program berjalan dan Anda puas.
                </div>
              </div>

              {/* Benefits included */}
              <div className="mt-6 border-t border-slate-800 pt-5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Yang Sudah Termasuk:
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
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Buat Form Order Sekarang
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
                  Kunci Harga via WhatsApp
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center mt-4">
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
              <span>Transparansi Penuh</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Cek Status & Progres Pengerjaan
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Masukkan <b>Kode Order</b> (contoh: <code>JT-2610-A1B2</code>) atau <b>Nomor WhatsApp</b> yang Anda daftarkan.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleTrackOrder} className="flex gap-2 max-w-xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Masukkan Kode Order atau No. WhatsApp..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={trackLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition shrink-0 flex items-center gap-1.5"
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
                        {order.status.replace('_', ' ')}
                      </div>
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

                  {/* Stepper Timeline */}
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

                  {/* Revision Form Toggle */}
                  <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Ada catatan perbaikan dari dosen pembimbing?
                    </span>
                    <button
                      onClick={() => setRevisionCode(order.order_code)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition"
                    >
                      Ajukan Catatan Revisi
                    </button>
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
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Portofolio & Studi Kasus</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Contoh Project yang Pernah Kami Bangun
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Beberapa contoh implementasi nyata skripsi dan aplikasi web/chatbot yang telah berhasil diuji dan disidangkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  Skripsi AI & Machine Learning
                </span>
                <h3 className="font-bold text-base text-white mt-3 mb-2">
                  Deteksi Penyakit Daun Tanaman dengan Algoritma CNN (ResNet-50) & FastAPI
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aplikasi upload gambar berbasis web untuk mendeteksi hama daun secara real-time dengan akurasi 94.2%.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800 flex gap-2">
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">Python</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">PyTorch</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">FastAPI</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">React</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Chatbot & AI LLM
                </span>
                <h3 className="font-bold text-base text-white mt-3 mb-2">
                  WhatsApp Customer Service AI Terintegrasi Google Gemini & Katalog Produk
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bot asisten WhatsApp pintar yang melayani pertanyaan stok barang, rekomendasi produk, dan rekap pesanan otomatis.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800 flex gap-2">
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">Node.js</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">Gemini API</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">PostgreSQL</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Web & Sistem Informasi
                </span>
                <h3 className="font-bold text-base text-white mt-3 mb-2">
                  Sistem Informasi Inventaris & Kasir (POS) Toko Retail Berbasis Cloud
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Web aplikasi pencatatan transaksi kasir, print struk thermal, laporan laba rugi bulanan, dan audit stok opname.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800 flex gap-2">
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">Laravel 11</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">Tailwind</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded">MySQL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-900/60 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
              Kepuasan & Bukti Nyata
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Apa Kata Klien Kami?
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Ulasan nyata dari rekan mahasiswa dan pemilik bisnis yang telah mempercayakan sistemnya kepada kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Rizky Ananda",
                role: "Mahasiswa Teknik Informatika",
                project: "Skripsi AI Klasifikasi Citra CNN",
                tag: "Lulus Sidang Nilai A",
                comment:
                  "Awalnya pusing banget dospem minta akurasi dinaikkan di atas 90%. Dibantu perbaiki arsitektur model dan dikasih video panduan alur logika program sampai paham detailnya. Pas sidang penguji terkesan!",
                initials: "RA",
                color: "from-teal-500 to-emerald-600"
              },
              {
                name: "Dimas Saputra",
                role: "Owner Toko Retail & Fashion",
                project: "Chatbot WhatsApp AI + Katalog",
                tag: "Bisnis UMKM",
                comment:
                  "Respon pelanggan jadi otomatis 24 jam nonstop. Admin toko nggak perlu bales manual satu-satu lagi untuk tanya stok dan rekapan invoice. Sangat mempermudah operasional bisnis saya.",
                initials: "DS",
                color: "from-indigo-500 to-purple-600"
              },
              {
                name: "Mega Febriyanti",
                role: "Mahasiswi Sistem Informasi",
                project: "Skripsi SPK Metode TOPSIS & Web",
                tag: "Garansi Revisi Cepat",
                comment:
                  "Waktu revisi bab 4 dan 5 mepet banget H-3 pendaftaran sidang. Tim gercep bantu perbaiki rumus pembobotan dan tambah fitur export Excel. Komunikasinya ramah dan fast response!",
                initials: "MF",
                color: "from-amber-500 to-orange-600"
              },
              {
                name: "Aldi Pratama",
                role: "Mahasiswa Ilmu Komputer",
                project: "Tugas Besar Pemrograman Python",
                tag: "Koding Bersih & Rapi",
                comment:
                  "Setiap baris kode dikasih komentar penjelasan, jadi pas dosen tanya 'fungsi baris ini buat apa', aku bisa jawab dengan lancar tanpa ragu. Nilai praktikum dapet 95!",
                initials: "AP",
                color: "from-cyan-500 to-blue-600"
              }
            ].map((t, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition relative group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      {t.tag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic mb-6">
                    "{t.comment}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-tr ${t.color} text-white font-bold text-xs flex items-center justify-center shadow-md`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                    <span className="text-[9px] text-teal-400/80 font-mono block">{t.project}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial CTA Banner */}
          <div className="mt-12 bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h3 className="font-bold text-base text-white">Sudah Pernah Menggunakan Jasa Kami?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Kirimkan feedback atau tangkapan layar review Anda untuk kami tampilkan di sini!
              </p>
            </div>
            <button
              onClick={() => openWhatsAppDirect('Kirim Ulasan & Feedback')}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-teal-500/20 shrink-0"
            >
              Kirim Testimoni via WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">Pertanyaan Sering Diajukan (FAQ)</h2>
            <p className="text-slate-400 text-sm mt-2">Segala hal yang perlu Anda ketahui mengenai kerja sama kita.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-bold text-sm text-teal-300">Bagaimana jika dosen saya meminta banyak revisi?</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tenang! Kami memberikan <b>Garansi Revisi Tanpa Biaya Tambahan</b> selama revisi tersebut masih sesuai dengan ruang lingkup (scope) judul dan perancangan awal yang kita sepakati.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-bold text-sm text-teal-300">Apakah saya akan diajari cara menjalankan programnya?</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Pasti! Kami menyediakan <b>Video Tutorial Instalasi</b> di laptop Anda, file <code>README.md</code>, dan dokumentasi alur logika program agar Anda siap menjawab pertanyaan penguji.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-bold text-sm text-teal-300">Bagaimana skema pembayarannya?</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sangat aman: Cukup DP 30% - 40% di awal sebagai tanda jadi. Kami akan mendemokan progres aplikasi secara berkala. Pelunasan 100% baru dibayarkan saat aplikasi sudah selesai dan lolos uji coba bersama Anda.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-bold text-sm text-teal-300">Apakah kerahasiaan identitas saya terjamin?</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                100% Terjamin. Identitas kampus, nama mahasiswa, dan judul Anda dijaga kerahasiaannya dan tidak akan pernah kami publikasikan tanpa izin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="Rizofara Technology Logo" className="w-6 h-6 object-contain rounded" />
            <div>
              <span className="font-bold text-slate-300">Rizofara Technology</span>
              <span className="text-slate-400"> — Digital Roots for a Brighter Tomorrow</span>
            </div>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Rizofara Technology. All rights reserved. Solusi Digital & Asistensi IT.</span>
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
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            {orderSuccessData ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-xl text-white">Order Berhasil Dibuat!</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Simpan Kode Order ini untuk memantau progres pengerjaan di menu Cek Status:
                </p>
                <div className="my-4 p-3 rounded-xl bg-slate-950 border border-teal-500/40 text-teal-300 font-mono text-lg font-bold">
                  {orderSuccessData.order_code}
                </div>
                <p className="text-[11px] text-slate-400 mb-6">
                  Tim kami akan segera menghubungi WhatsApp Anda ({orderSuccessData.client_whatsapp}) untuk konfirmasi detail teknis.
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
                  Konfirmasi Sekarang via WhatsApp
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-extrabold text-xl text-white">Form Pengajuan Order</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Isi data proyek Anda. Kami akan meninjau dan mengirimkan penawaran terbaik.
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
                        onChange={(e) => setOrderForm({ ...orderForm, service_type: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                      >
                        <option value="skripsi">Skripsi / Tugas Akhir</option>
                        <option value="tugas">Tugas Kuliah Koding</option>
                        <option value="website">Pembuatan Website</option>
                        <option value="chatbot">Pembuatan Chatbot</option>
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
                      >
                      </input>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Judul / Topik Project *</label>
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
                      placeholder="Jelaskan fitur apa saja yang wajib ada, bahasa pemrograman yang diminta dosen, dll..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Unggah Panduan / Soal (Opsional)</label>
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
                      className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>

            <h3 className="font-bold text-lg text-white">Ajukan Catatan Revisi</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Order Code: <span className="text-teal-400 font-mono font-bold">{revisionCode}</span>
            </p>

            {revisionSuccess ? (
              <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs text-center">
                Catatan revisi berhasil dikirim ke tim pengembang! Kami akan segera menindaklanjuti.
              </div>
            ) : (
              <form onSubmit={handleRevisionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Poin-poin Perbaikan dari Dosen:</label>
                  <textarea
                    rows={4}
                    required
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Tuliskan catatan revisi dosen secara rinci di sini..."
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
    </div>
  );
}
