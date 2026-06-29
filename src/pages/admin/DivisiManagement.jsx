import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
  const [deleteTarget, setDeleteTarget] = useState(null); // For Custom Dialog

  useEffect(() => {
    fetchDivisi();
  }, []);

  const fetchDivisi = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('divisi')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDivisiList(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('divisi')
          .update({
            kode_divisi: formData.kode_divisi,
            nama_divisi: formData.nama_divisi,
            updated_at: new Date()
          })
          .eq('id', currentId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('divisi')
          .insert([{
            kode_divisi: formData.kode_divisi,
            nama_divisi: formData.nama_divisi
          }]);
        
        if (error) throw error;
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
    setFormData({ kode_divisi: divisi.kode_divisi, nama_divisi: divisi.nama_divisi });
    setCurrentId(divisi.id);
    setIsEditing(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      // Hard delete
      const { error } = await supabase
        .from('divisi')
        .delete()
        .eq('id', deleteTarget.id);
      
      if (error) throw error;
      setDeleteTarget(null);
      fetchDivisi();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manajemen Divisi</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola data divisi perusahaan (CRUD).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">
              {isEditing ? 'Edit Divisi' : 'Tambah Divisi Baru'}
            </h2>
            
            {error && <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kode Divisi</label>
                <input
                  type="text"
                  name="kode_divisi"
                  value={formData.kode_divisi}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Misal: HRD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Divisi</label>
                <input
                  type="text"
                  name="nama_divisi"
                  value={formData.nama_divisi}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Misal: Human Resources"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : (isEditing ? 'Update' : 'Simpan')}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ kode_divisi: '', nama_divisi: '' });
                      setCurrentId(null);
                    }}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daftar Divisi</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
                    <th className="px-6 py-3 font-medium">Kode</th>
                    <th className="px-6 py-3 font-medium">Nama Divisi</th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loading ? (
                    // Skeleton Loading
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                        <td className="px-6 py-4 flex justify-end gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </td>
                      </tr>
                    ))
                  ) : divisiList.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        Belum ada data divisi.
                      </td>
                    </tr>
                  ) : (
                    divisiList.map((divisi) => (
                      <tr key={divisi.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{divisi.kode_divisi}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{divisi.nama_divisi}</td>
                        <td className="px-6 py-4 text-sm text-right space-x-2">
                          <button 
                            onClick={() => handleEdit(divisi)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2 py-1"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeleteTarget({ id: divisi.id, nama_divisi: divisi.nama_divisi })}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
