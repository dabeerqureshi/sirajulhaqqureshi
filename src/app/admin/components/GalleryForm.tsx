'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { encryptFile, toBase64Url } from '@/lib/crypto';
import type { GalleryItem, Visibility } from '@/types/database';

interface Props { isEdit: boolean; item?: Partial<GalleryItem> | null; onSave: (v: Record<string, unknown>) => void; onDelete: () => void; onClose: () => void; }

export function GalleryForm({ isEdit, item, onSave, onDelete, onClose }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const encrypted = !!item?.is_encrypted;
  const [password, setPassword] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget as HTMLFormElement);
    const v: Record<string, unknown> = Object.fromEntries(f.entries());
    v.visibility = f.get('visibility') as Visibility;
    v.is_encrypted = f.get('is_encrypted') === 'on';
    if (imageFile) v._imageFile = imageFile;
    if (removeImage) v._removeImage = true;
    if (encrypted && password) {
      const { salt } = await encryptFile(new Blob([password]), password);
      v.encryption_salt = toBase64Url(salt);
    }
    onSave(v);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-3 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input name="title_en" defaultValue={item?.title_en||''} className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500" required />
        <input name="title_ur" defaultValue={item?.title_ur||''} dir="rtl" className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm font-urdu focus:ring-2 focus:ring-amber-500" required />
      </div>
      <textarea name="description_en" rows={2} defaultValue={item?.description_en||''} className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500" />
      <textarea name="description_ur" rows={2} dir="rtl" defaultValue={item?.description_ur||''} className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm font-urdu focus:ring-2 focus:ring-amber-500" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input name="category" defaultValue={item?.category||'General'} className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500" />
        <input type="number" name="sort_order" defaultValue={item?.sort_order??0} className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500" />
        <input name="taken_date" defaultValue={item?.taken_date||''} className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select name="visibility" defaultValue={item?.visibility||'public'} className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500">
          <option value="public">Public</option><option value="restricted">Restricted</option>
        </select>
      </div>

      <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
        <div className="flex items-center gap-1 mb-1"><ImageIcon className="w-4 h-4 text-amber-700" /><span className="text-xs font-bold text-stone-700 uppercase">Image</span></div>
        <input type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files?.[0]||null)} className="w-full mb-1" />
        {item?.file_path && (
          <div className="flex items-center gap-1 text-xs">{item.file_path}
            {removeImage ? (
              <button type="button" onClick={()=>setRemoveImage(false)} className="text-green-600 hover:text-green-800">Keep</button>
            ) : (
              <button type="button" onClick={()=>setRemoveImage(true)} className="text-rose-600 hover:text-rose-800">Remove</button>
            )}
          </div>
        )}
      </div>

      {encrypted && (
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-amber-800">Secret Password</label>
            <input type="password" onChange={(e)=>setPassword(e.target.value)} placeholder="Secret password" className="px-2.5 py-1.5 rounded-lg border border-amber-200 text-sm focus:ring-2 focus:ring-amber-500" />
          </div>
          <p className="text-xs text-amber-600">Client-side encrypted. Key never stored server-side.</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
        {isEdit && (<button type="button" onClick={onDelete} className="px-4 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-semibold">Delete</button>)}
        <button type="submit" className="px-5 py-1.5 rounded-lg bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900">Save</button>
      </div>
    </form>
  );
}