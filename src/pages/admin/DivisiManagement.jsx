import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import Dialog from '../../components/ui/Dialog';

export default function DivisiManagement() {
  const [divisiList, setDivisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ kode_divisi: '', nama_divisi: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchDivisi();
  }, []);

  const fetchDivisi = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.getDivisi();
      if (error) throw new Error(error);
      setDivisiList(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const { error } = await api.updateDivisi(currentId, formData);
        if (error) throw new Error(error);
      } else {
        const { error } = await api.createDivisi(formData);
        if (error) throw new Error(error);
      }
      
      setFormData({ kode_divisi: '', nama_divisi: '' });
      setIsEditing(false);
      setCurrentId(null);
      fetchDivisi();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (divisi) => {
    setIsEditing(true);
    setCurrentId(divisi.id);
    setFormData({
      kode_divisi: divisi.kode_divisi,
      nama_divisi: divisi.nama_divisi,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setFormLoading(true);
    try {
      const { error } = await api.deleteDivisi(deleteTarget.id);
      if (error) throw new Error(error);
      fetchDivisi();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manajemen Divisi</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola divisi dalam organisasi</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {isEditing ? 'Edit Divisi' : 'Tambah Divisi Baru'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kode Divisi
            </label>
            <input
              type="text"
              value={formData.kode_divisi}
              onChange={(e) => setFormData({ ...formData, kode_divisi: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nama Divisi
            </label>
            <input
              type="text"
              value={formData.nama_divisi}
              onChange={(e) => setFormData({ ...formData, nama_divisi: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {formLoading ? 'Menyimpan...' : isEditing ? 'Update' : 'Tambah'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentId(null);
                  setFormData({ kode_divisi: '', nama_divisi: '' });
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daftar Divisi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {divisiList.map((divisi) => (
                <tr key={divisi.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-50">{divisi.kode_divisi}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-50">{divisi.nama_divisi}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEdit(divisi)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(divisi)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        isOpen={!!deleteTarget}
        title="Hapus Divisi"
        message={`Apakah Anda yakin ingin menghapus divisi "${deleteTarget?.nama_divisi}"? Tindakan ini akan menghapus divisi secara permanen dari database.`}
        type="alert"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
