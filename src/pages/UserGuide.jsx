import React, { useMemo, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Truck,
  UserCog,
  Users,
  Wifi,
  XCircle,
} from 'lucide-react';

const sections = [
  { id: 'mulai', label: 'Mulai Menggunakan' },
  { id: 'fitur', label: 'Fitur Utama' },
  { id: 'alur', label: 'Alur Surat' },
  { id: 'menu', label: 'Panduan Menu' },
  { id: 'status', label: 'Status Surat' },
  { id: 'bukti', label: 'Bukti Pengiriman' },
  { id: 'masalah', label: 'Troubleshooting' },
];

const adminFeatures = [
  { icon: LayoutDashboard, title: 'Dashboard Terpusat', text: 'Memantau jumlah surat, status pengiriman, kurir aktif, divisi, dan aktivitas terbaru.' },
  { icon: Building2, title: 'Manajemen Divisi', text: 'Menambah, mengubah, serta mengelola identitas divisi pengirim dan divisi tujuan.' },
  { icon: UserCog, title: 'Manajemen Pengguna', text: 'Mengelola akun admin, divisi, dan kurir beserta hak aksesnya.' },
  { icon: FileText, title: 'Surat Ekspedisi', text: 'Membuat, mencari, memfilter, melihat detail, mengubah, dan menghapus surat sesuai status.' },
  { icon: BarChart3, title: 'Analitik', text: 'Melihat distribusi surat dan performa pengiriman berdasarkan data operasional.' },
  { icon: Activity, title: 'Update Otomatis', text: 'Perubahan surat diterima secara real-time tanpa perlu memuat ulang halaman.' },
];

const divisiFeatures = [
  { icon: LayoutDashboard, title: 'Dashboard Divisi', text: 'Melihat statistik dan surat terbaru yang berkaitan dengan divisi Anda.' },
  { icon: FileText, title: 'Surat Masuk & Keluar', text: 'Melihat surat yang dikirim oleh divisi atau ditujukan kepada divisi Anda.' },
  { icon: PackageCheck, title: 'Buat Surat Baru', text: 'Membuat tugas pengiriman baru dengan memilih tujuan dan mengisi perihal surat.' },
  { icon: Search, title: 'Pencarian Cepat', text: 'Menemukan surat berdasarkan nomor, perihal, pengirim, tujuan, atau status.' },
  { icon: Camera, title: 'Bukti Pengiriman', text: 'Melihat foto bukti, nama penerima, waktu penerimaan, dan koordinat GPS.' },
  { icon: Wifi, title: 'Sinkronisasi Langsung', text: 'Status akan diperbarui ketika kurir mengambil dan menyelesaikan pengiriman.' },
];

const adminMenus = [
  { icon: LayoutDashboard, title: 'Dashboard', text: 'Ringkasan kondisi operasional. Klik ikon lihat pada aktivitas terbaru untuk membuka surat terkait.' },
  { icon: Building2, title: 'Manajemen Divisi', text: 'Gunakan untuk memastikan nama dan kode divisi tersedia sebelum membuat surat.' },
  { icon: Users, title: 'Manajemen Pengguna', text: 'Buat akun kurir/divisi, perbarui profil pengguna, dan kelola akses aplikasi.' },
  { icon: FileText, title: 'Surat Ekspedisi', text: 'Pusat CRUD surat. Surat selesai dilindungi agar bukti pengiriman tidak berubah sembarangan.' },
  { icon: BarChart3, title: 'Analitik', text: 'Membaca tren volume surat dan distribusi status untuk evaluasi operasional.' },
  { icon: Settings, title: 'Settings', text: 'Mengatur tema terang, gelap, atau mengikuti pengaturan perangkat.' },
];

const divisiMenus = [
  { icon: LayoutDashboard, title: 'Dashboard', text: 'Menampilkan statistik surat hari ini, minggu ini, bulan ini, dan aktivitas terbaru divisi.' },
  { icon: FileText, title: 'Surat Masuk / Keluar', text: 'Membuat surat keluar dan memantau surat yang dikirim atau diterima oleh divisi.' },
  { icon: Settings, title: 'Pengaturan', text: 'Memilih tema tampilan yang nyaman digunakan.' },
];

const faqs = [
  { q: 'Mengapa surat baru belum muncul?', a: 'Pastikan indikator server berstatus Online. Tunggu beberapa detik karena pembaruan real-time dapat dipengaruhi koneksi, lalu muat ulang jika diperlukan.' },
  { q: 'Mengapa surat selesai tidak dapat diedit?', a: 'Surat berstatus Diterima telah memiliki bukti pengiriman dan diperlakukan sebagai catatan final untuk menjaga integritas data.' },
  { q: 'Mengapa foto bukti tidak tampil?', a: 'Pastikan kurir sudah menyelesaikan pengiriman dan mengunggah bukti. Periksa juga koneksi internet serta akses ke server gambar.' },
  { q: 'Apa yang dilakukan jika salah memilih divisi?', a: 'Selama surat belum selesai, buka menu Surat Ekspedisi, pilih Edit, lalu perbarui divisi pengirim atau tujuan.' },
  { q: 'Bagaimana mencari surat tertentu?', a: 'Gunakan pencarian atau filter pada daftar surat. Nomor surat adalah kata kunci paling akurat.' },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function UserGuide() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const defaultRole = pathname.startsWith('/divisi') ? 'divisi' : 'admin';
  const [role, setRole] = useState(defaultRole);
  const [openFaq, setOpenFaq] = useState(0);
  const features = role === 'admin' ? adminFeatures : divisiFeatures;
  const menus = role === 'admin' ? adminMenus : divisiMenus;
  const roleLabel = role === 'admin' ? 'Administrator' : 'Pengguna Divisi';

  const quickSteps = useMemo(() => role === 'admin' ? [
    ['Siapkan master data', 'Pastikan divisi dan akun kurir telah dibuat.'],
    ['Buat surat', 'Isi nomor, perihal, divisi pengirim, dan divisi tujuan.'],
    ['Pantau pengiriman', 'Status berubah dari Draft menjadi Dikirim saat tugas diambil kurir.'],
    ['Verifikasi penyelesaian', 'Buka detail surat untuk melihat penerima, foto, waktu, dan GPS.'],
  ] : [
    ['Buka surat keluar', 'Masuk ke menu Surat Masuk / Keluar.'],
    ['Buat tugas baru', 'Isi perihal dan pilih divisi tujuan dengan benar.'],
    ['Pantau status', 'Tunggu kurir mengambil surat hingga status menjadi Dikirim.'],
    ['Periksa bukti', 'Saat Diterima, buka detail untuk melihat bukti pengiriman.'],
  ], [role]);

  return (
    <div className="space-y-8 pb-12 text-slate-900 dark:text-slate-50">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-5 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-8 sm:py-10 lg:px-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 right-28 h-56 w-56 rounded-full bg-cyan-300/20" />
        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <BookOpen size={15} /> Pusat Panduan Pengguna
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Panduan Website Surat Ekspedisi Digital</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">
            Dokumentasi lengkap untuk membuat surat, memantau kurir, memahami status, dan memverifikasi bukti pengiriman secara aman.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => scrollToSection('mulai')} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50">
              Mulai Panduan
            </button>
            <button onClick={() => scrollToSection('masalah')} className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
              Bantuan Masalah
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">Daftar Isi</p>
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
              {sections.map((section) => (
                <button key={section.id} onClick={() => scrollToSection(section.id)} className="shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 lg:w-full">
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <section id="mulai" className="scroll-mt-6 space-y-5">
            <SectionHeading eyebrow="Langkah pertama" title="Mulai Menggunakan Website" description="Pilih jenis akun agar isi panduan menyesuaikan fitur yang dapat Anda akses." />
            <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto">
              {[
                ['admin', 'Administrator', ShieldCheck],
                ['divisi', 'Pengguna Divisi', Building2],
              ].map(([value, label, Icon]) => (
                <button key={value} onClick={() => setRole(value)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${role === value ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>
                  <Icon size={17} /> {label}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickSteps.map(([title, text], index) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">{index + 1}</div>
                  <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section id="fitur" className="scroll-mt-6 space-y-5">
            <SectionHeading eyebrow={`Fitur untuk ${roleLabel}`} title="Highlight Fungsi Utama" description="Fitur penting yang mendukung proses pengiriman surat dari pencatatan sampai bukti diterima." />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-800">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/50 dark:text-blue-300"><Icon size={22} /></div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="alur" className="scroll-mt-6 space-y-5">
            <SectionHeading eyebrow="Workflow end-to-end" title="Alur Pengiriman Surat" description="Satu rangkaian data yang terhubung antara website dan aplikasi kurir." />
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {[
                ['Surat dibuat', 'Admin atau divisi mengisi informasi surat. Sistem menyimpan surat sebagai Draft.', FileText, 'bg-blue-600'],
                ['Tugas masuk ke aplikasi kurir', 'Surat Draft otomatis tersedia bagi kurir dan dapat disertai notifikasi perangkat.', Smartphone, 'bg-violet-600'],
                ['Kurir mengambil tugas', 'Kurir memilih Ambil Tugas. Status surat berubah menjadi Dikirim dan kurir tercatat.', Truck, 'bg-amber-500'],
                ['Bukti pengiriman direkam', 'Kurir mengisi nama penerima, mengambil foto, serta merekam GPS dan waktu.', Camera, 'bg-cyan-600'],
                ['Surat selesai', 'Data tersinkron ke server, status menjadi Diterima, dan bukti dapat dilihat di website.', CheckCircle2, 'bg-emerald-600'],
              ].map(([title, text, Icon, color], index, items) => (
                <div key={title} className="relative flex gap-4 px-5 py-5 sm:px-6">
                  {index < items.length - 1 && <div className="absolute left-[42px] top-14 h-full w-px bg-slate-200 dark:bg-slate-700 sm:left-[46px]" />}
                  <div className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${color}`}><Icon size={21} /></div>
                  <div className="pb-2"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tahap {index + 1}</div><h3 className="mt-1 font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section id="menu" className="scroll-mt-6 space-y-5">
            <SectionHeading eyebrow="Navigasi" title={`Panduan Menu ${roleLabel}`} description="Kenali fungsi setiap menu yang tersedia pada sidebar." />
            <div className="grid gap-4 md:grid-cols-2">
              {menus.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-blue-600 dark:bg-slate-700 dark:text-blue-300"><Icon size={20} /></div>
                  <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p></div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <Menu className="mt-0.5 shrink-0" size={19} />
              <p>Pada layar ponsel, tekan ikon menu di kiri atas untuk membuka sidebar. Tekan area gelap di luar sidebar untuk menutupnya.</p>
            </div>
          </section>

          <section id="status" className="scroll-mt-6 space-y-5">
            <SectionHeading eyebrow="Pelacakan" title="Memahami Status Surat" description="Status menunjukkan posisi surat pada proses ekspedisi." />
            <div className="grid gap-4 md:grid-cols-3">
              <StatusCard color="blue" label="Draft" icon={FileText} text="Surat baru dibuat dan belum diambil oleh kurir. Informasi masih dapat diperbarui sesuai hak akses." />
              <StatusCard color="amber" label="Dikirim" icon={Truck} text="Tugas telah diambil kurir dan sedang dalam proses pengantaran ke divisi tujuan." />
              <StatusCard color="emerald" label="Diterima" icon={CheckCircle2} text="Pengiriman selesai. Nama penerima, foto, GPS, dan waktu penerimaan telah tercatat." />
            </div>
          </section>

          <section id="bukti" className="scroll-mt-6 space-y-5">
            <SectionHeading eyebrow="Proof of delivery" title="Melihat Bukti Pengiriman" description="Bukti pengiriman tersedia pada halaman detail setelah kurir menyelesaikan tugas." />
            <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <div className="text-center text-slate-400"><Camera className="mx-auto mb-2" size={36} /><p className="text-sm font-semibold">Preview foto bukti</p><p className="mt-1 text-xs">Klik “Lihat Foto” untuk mode layar penuh</p></div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  [Users, 'Nama penerima', 'Identitas orang yang menerima surat.'],
                  [MapPin, 'Lokasi GPS', 'Koordinat pengambilan bukti dari perangkat kurir.'],
                  [Camera, 'Foto ber-watermark', 'Foto memuat nomor surat, penerima, lokasi, dan waktu.'],
                  [ShieldCheck, 'Hash foto', 'Digunakan sistem untuk membantu menjaga integritas bukti tanpa ditampilkan ke UI.'],
                ].map(([Icon, title, text]) => (
                  <div key={title} className="flex gap-3"><Icon className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" size={20} /><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p></div></div>
                ))}
              </div>
            </div>
          </section>

          <section id="masalah" className="scroll-mt-6 space-y-5">
            <SectionHeading eyebrow="Bantuan" title="Troubleshooting & Pertanyaan Umum" description="Solusi cepat untuk kendala yang paling sering ditemui." />
            <div className="space-y-3">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return <div key={item.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <button onClick={() => setOpenFaq(isOpen ? -1 : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                    <span className="flex items-center gap-3 font-bold"><CircleHelp className="shrink-0 text-blue-600 dark:text-blue-400" size={20} />{item.q}</span>
                    <ChevronDown size={20} className={`shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <div className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600 dark:border-slate-700 dark:text-slate-400">{item.a}</div>}
                </div>;
              })}
            </div>
            <div className="rounded-2xl bg-slate-900 p-5 text-white dark:bg-blue-950 sm:p-6">
              <div className="flex items-start gap-4"><XCircle className="mt-0.5 shrink-0 text-amber-400" size={24} /><div><h3 className="font-bold">Jika masalah tetap terjadi</h3><p className="mt-2 text-sm leading-6 text-slate-300">Catat nomor surat, menu yang digunakan, waktu kejadian, dan pesan error. Informasi tersebut membantu administrator atau tim teknis menemukan masalah lebih cepat.</p></div></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">{description}</p></div>;
}

function StatusCard({ color, label, icon: Icon, text }) {
  const styles = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
  };
  return <article className={`rounded-2xl border p-5 ${styles[color]}`}><div className="flex items-center gap-3"><div className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-950/30"><Icon size={22} /></div><h3 className="text-lg font-bold">{label}</h3></div><p className="mt-4 text-sm leading-6 opacity-90">{text}</p></article>;
}
