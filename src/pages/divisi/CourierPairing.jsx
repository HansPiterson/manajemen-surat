import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock3,
  Link2,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Unlink,
  UserRound,
} from 'lucide-react';
import { api } from '../../lib/api';

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const remainder = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function calculateRemaining(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export default function CourierPairing() {
  const [status, setStatus] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);

  const currentUser = useMemo(() => api.getCurrentUser(), []);

  const refreshStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    const { data, error: requestError } = await api.getPairingStatus();
    if (requestError) {
      if (!silent) setError(requestError);
    } else {
      setStatus(data);
      setError(null);
      if (data?.connected) {
        setQrData(null);
        setRemainingSeconds(0);
      }
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!qrData?.expires_at) return undefined;

    const updateCountdown = () => {
      const remaining = calculateRemaining(qrData.expires_at);
      setRemainingSeconds(remaining);
      if (remaining === 0) setQrData(null);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [qrData?.expires_at]);

  useEffect(() => {
    if (!qrData || status?.connected) return undefined;
    const poller = window.setInterval(() => refreshStatus({ silent: true }), 2500);
    return () => window.clearInterval(poller);
  }, [qrData, status?.connected, refreshStatus]);

  const generateQr = async () => {
    setGenerating(true);
    setError(null);
    const { data, error: requestError } = await api.createPairingToken();
    if (requestError) {
      setError(requestError);
    } else {
      setQrData(data);
      setRemainingSeconds(calculateRemaining(data.expires_at));
    }
    setGenerating(false);
  };

  const disconnect = async () => {
    const courierName = status?.courier?.nama_lengkap || 'kurir ini';
    if (!window.confirm(`Putuskan koneksi dengan ${courierName}? Surat lama yang sudah dimiliki kurir tetap tersimpan.`)) {
      return;
    }

    setDisconnecting(true);
    setError(null);
    const { error: requestError } = await api.disconnectPairing();
    if (requestError) {
      setError(requestError);
    } else {
      setStatus((previous) => ({ ...previous, connected: false, courier: null }));
      setQrData(null);
    }
    setDisconnecting(false);
  };

  const tu = status?.tu || currentUser;
  const connected = status?.connected === true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Koneksi Operasional</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">Hubungkan Kurir</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            QR ini menghubungkan akun Tata Usaha Anda dengan satu kurir. Surat baru yang Anda buat hanya dikirim ke kurir tersebut.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshStatus()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Perbarui status
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/40 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-50">Akun Tata Usaha</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pemilik koneksi dan pembuat surat</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nama TU</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-slate-50">{tu?.nama_lengkap || '-'}</p>
                <p className="mt-1 break-all text-sm text-slate-500">{tu?.email || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Divisi</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-slate-50">{tu?.divisi_nama || currentUser?.divisi_nama || '-'}</p>
                <p className="mt-1 text-sm text-slate-500">Kode: {tu?.divisi_kode || currentUser?.divisi_kode || '-'}</p>
              </div>
            </div>

            {loading && !status ? (
              <div className="flex min-h-40 items-center justify-center gap-3 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Memeriksa koneksi kurir...
              </div>
            ) : connected ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Kurir terhubung</p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">{status.courier?.nama_lengkap}</p>
                      <p className="break-all text-sm text-slate-600 dark:text-slate-400">{status.courier?.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={disconnect}
                    disabled={disconnecting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/70 dark:bg-slate-900 dark:text-red-300"
                  >
                    {disconnecting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                    Putuskan koneksi
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
                <div className="flex items-start gap-3">
                  <Link2 className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-50">Belum ada kurir terhubung</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Buat QR baru, lalu minta kurir membuka menu Akun dan memilih Scan QR Tata Usaha.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <p>QR berlaku 5 menit, hanya dapat dipakai sekali, dan tidak menyimpan password atau token login akun Anda.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-50">QR Pairing Kurir</h2>
              <p className="mt-1 text-sm text-slate-500">Tampilkan pada perangkat kurir</p>
            </div>
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <QrCode className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 flex min-h-[330px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-900/50">
            {qrData ? (
              <>
                <div className="max-w-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <QRCodeSVG
                    value={qrData.pairing_url}
                    size={240}
                    level="M"
                    marginSize={1}
                    className="h-auto max-w-full"
                  />
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
                  <Clock3 className="h-4 w-4" />
                  Berlaku {formatCountdown(remainingSeconds)}
                </div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  Status akan berubah otomatis setelah kurir berhasil melakukan scan.
                </p>
              </>
            ) : connected ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                <p className="mt-4 font-bold text-slate-900 dark:text-slate-50">Koneksi sudah aktif</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Putuskan koneksi lama jika Anda perlu menghubungkan kurir yang berbeda.</p>
              </>
            ) : (
              <>
                <Smartphone className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                <p className="mt-4 font-bold text-slate-900 dark:text-slate-50">QR belum dibuat</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">QR lama otomatis dibatalkan ketika Anda membuat QR baru.</p>
              </>
            )}
          </div>

          {!connected && (
            <button
              type="button"
              onClick={generateQr}
              disabled={generating}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              {generating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
              {qrData ? 'Buat ulang QR' : 'Buat QR koneksi'}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
