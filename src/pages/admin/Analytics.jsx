import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, Mail, Send, CheckCircle, FileText } from 'lucide-react';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// Status colors — matches SuratViewer badges
const COLOR_DRAFT    = '#6b7280'; // gray-500  → Draft
const COLOR_DIKIRIM  = '#d97706'; // amber-600 → Dikirim
const COLOR_DITERIMA = '#2563eb'; // blue-600  → Diterima
const CHART_PRIMARY   = COLOR_DITERIMA;
const CHART_SECONDARY = COLOR_DIKIRIM;
const PIE_COLORS      = [COLOR_DRAFT, COLOR_DIKIRIM, COLOR_DITERIMA];

function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
        <Icon size={18} className="text-slate-600 dark:text-slate-300" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="font-medium">{p.name}:</span> {p.value}
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">Belum ada data</p>;
}

export default function Analytics() {
  const [suratList, setSuratList] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [suratRes, divisiRes] = await Promise.all([api.getSurat(), api.getDivisi()]);
      if (suratRes.error) throw new Error(suratRes.error);
      if (divisiRes.error) throw new Error(divisiRes.error);
      setSuratList(suratRes.data ?? []);
      setDivisiList(divisiRes.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (period === 'all') return suratList;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return suratList.filter(s => new Date(s.tanggal_surat) >= cutoff);
  }, [suratList, period]);

  const divisiMap = useMemo(() => {
    const map = {};
    divisiList.forEach(d => { map[d.id] = d.nama_divisi; });
    return map;
  }, [divisiList]);

  const divisiFlowData = useMemo(() => {
    const flow = {};
    filtered.forEach(s => {
      const pengirim = s.divisi_pengirim?.nama_divisi || divisiMap[s.divisi_pengirim_id] || 'Unknown';
      const tujuan   = s.divisi_tujuan?.nama_divisi   || divisiMap[s.divisi_tujuan_id]   || 'Unknown';
      if (!flow[pengirim]) flow[pengirim] = { divisi: pengirim, keluar: 0, masuk: 0 };
      if (!flow[tujuan])   flow[tujuan]   = { divisi: tujuan,   keluar: 0, masuk: 0 };
      flow[pengirim].keluar += 1;
      flow[tujuan].masuk    += 1;
    });
    return Object.values(flow).sort((a, b) => (b.masuk + b.keluar) - (a.masuk + a.keluar));
  }, [filtered, divisiMap]);

  const statusData = useMemo(() => {
    const counts = { draft: 0, dikirim: 0, diterima: 0 };
    filtered.forEach(s => {
      const key = String(s.status || '').toLowerCase().trim();
      if (key in counts) counts[key]++;
    });
    return [
      { name: 'Draft',    value: counts.draft,    color: COLOR_DRAFT    },
      { name: 'Dikirim',  value: counts.dikirim,  color: COLOR_DIKIRIM  },
      { name: 'Diterima', value: counts.diterima, color: COLOR_DITERIMA },
    ].filter(d => d.value > 0);
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()], total: 0, diterima: 0 };
    });
    suratList.forEach(s => {
      const d   = new Date(s.tanggal_surat);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = months.find(m => m.key === key);
      if (entry) {
        entry.total++;
        if (String(s.status || '').toLowerCase().trim() === 'diterima') entry.diterima++;
      }
    });
    return months;
  }, [suratList]);

  const total    = filtered.length;
  const diterima = filtered.filter(s => String(s.status || '').toLowerCase().trim() === 'diterima').length;
  const dikirim  = filtered.filter(s => String(s.status || '').toLowerCase().trim() === 'dikirim').length;
  const draft    = filtered.filter(s => String(s.status || '').toLowerCase().trim() === 'draft').length;

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 sm:h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-60 sm:h-72" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">Analitik Surat</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Arus surat masuk dan keluar antar divisi</p>
        </div>

        {/* Period filter — scrollable on mobile */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs sm:text-sm self-start sm:self-auto overflow-x-auto shrink-0">
          {[['all','Semua'],['30','30 Hari'],['90','90 Hari'],['365','1 Tahun']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                period === val
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Surat"  value={total}    icon={FileText}    sub="dalam periode" />
        <StatCard label="Draft"        value={draft}    icon={Mail} />
        <StatCard label="Dikirim"      value={dikirim}  icon={Send} />
        <StatCard label="Diterima"     value={diterima} icon={CheckCircle}
          sub={total ? `${Math.round(diterima / total * 100)}% dari total` : '-'} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Masuk vs Keluar per Divisi */}
        <ChartCard title="Surat Masuk & Keluar per Divisi">
          {divisiFlowData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={divisiFlowData.slice(0, 8)}
                margin={{ top: 4, right: 4, left: -16, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="divisi"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                <Bar dataKey="masuk"  name="Masuk"  fill={COLOR_DITERIMA} radius={[3,3,0,0]} />
                <Bar dataKey="keluar" name="Keluar" fill={COLOR_DIKIRIM}  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Status Pie */}
        <ChartCard title="Distribusi Status Surat">
          {statusData.length === 0 ? <EmptyState /> : (
            <div className="flex flex-col items-center gap-3">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 flex-wrap justify-center text-sm">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: d.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Monthly trend */}
        <ChartCard title="Tren Surat 12 Bulan Terakhir">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLOR_DITERIMA} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLOR_DITERIMA} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDiterima" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLOR_DIKIRIM} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLOR_DIKIRIM} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="total"    name="Total"    stroke={COLOR_DITERIMA} fill="url(#gradTotal)"    strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="diterima" name="Diterima" stroke={COLOR_DIKIRIM}  fill="url(#gradDiterima)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Per-divisi summary table */}
        <ChartCard title="Ringkasan per Divisi">
          {divisiFlowData.length === 0 ? <EmptyState /> : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[280px]">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-2 pr-3">Divisi</th>
                    <th className="pb-2 pr-3 text-right">Masuk</th>
                    <th className="pb-2 pr-3 text-right">Keluar</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {divisiFlowData.map((d, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 font-medium text-slate-800 dark:text-slate-200 max-w-[120px] sm:max-w-none truncate">{d.divisi}</td>
                      <td className="py-2 pr-3 text-right">
                        <span className="inline-flex items-center justify-end gap-0.5 text-slate-600 dark:text-slate-300 font-medium">
                          <TrendingDown size={12} className="text-slate-400" />{d.masuk}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span className="inline-flex items-center justify-end gap-0.5 text-slate-600 dark:text-slate-300 font-medium">
                          <TrendingUp size={12} className="text-slate-400" />{d.keluar}
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{d.masuk + d.keluar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
