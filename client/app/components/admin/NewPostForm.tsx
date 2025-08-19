'use client';
import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import RoundLoader from '@/app/components/ui/RoundLoader';
import { useToast } from '@/app/components/ui/ToastProvider';

function wrapSelection(textarea: HTMLTextAreaElement, left: string, right = left) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const before = val.slice(0, start);
  const sel = val.slice(start, end);
  const after = val.slice(end);
  const newVal = before + left + sel + right + after;
  textarea.value = newVal;
  textarea.focus();
  textarea.setSelectionRange(start + left.length, start + left.length + sel.length);
}

export default function NewPostForm() {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredUrl, setFeaturedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

  function addCategory() {
    const c = newCategory.trim();
    if (!c) return;
    if (!categories.includes(c)) setCategories(prev => [c, ...prev]);
    setNewCategory('');
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return toast.error('Title required');
    if (!body.trim()) return toast.error('Body required');
    setLoading(true);

    try {
      let res;
      if (featuredFile) {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('body', body);
        fd.append('categories', JSON.stringify(categories));
        fd.append('featured', featuredFile);
        res = await fetch(`${API}/admin/posts`, {
          method: 'POST',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          credentials: 'include',
          body: fd
        });
      } else {
        res = await fetch(`${API}/admin/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({ title, body, categories, featuredUrl: featuredUrl || undefined })
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      toast.success('Post created');
      // optionally redirect to admin posts list
      setTitle(''); setBody(''); setCategories([]); setFeaturedFile(null); setFeaturedUrl('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to create post', String(err?.message || ''));
    } finally {
      setLoading(false);
    }
  }

  // toolbar actions
  function onBold() {
    const ta = taRef.current!;
    wrapSelection(ta, '<strong>', '</strong>');
    setBody(ta.value);
  }
  function onItalic() {
    const ta = taRef.current!;
    wrapSelection(ta, '<em>', '</em>');
    setBody(ta.value);
  }
  function onNumbered() {
    const ta = taRef.current!;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lines = ta.value.slice(start, end).split('\n').map((ln, i) => `${i+1}. ${ln}`).join('\n');
    const newVal = ta.value.slice(0, start) + lines + ta.value.slice(end);
    ta.value = newVal;
    setBody(ta.value);
  }
  function onBullet() {
    const ta = taRef.current!;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lines = ta.value.slice(start, end).split('\n').map(ln => `- ${ln}`).join('\n');
    const newVal = ta.value.slice(0, start) + lines + ta.value.slice(end);
    ta.value = newVal;
    setBody(ta.value);
  }
  function onInsertImageUrl() {
    const url = prompt('Image URL');
    if (!url) return;
    const ta = taRef.current!;
    const pos = ta.selectionStart;
    const insert = `<img src="${url}" alt="" style="max-width:100%;height:auto;" />`;
    ta.value = ta.value.slice(0, pos) + insert + ta.value.slice(pos);
    setBody(ta.value);
  }

  // drag-drop handlers
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFeaturedFile(f);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <form onSubmit={submit} className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">New Post</h2>
        <div>
          <button type="button" onClick={() => { /* preview could open a modal */ }} className="mr-2 btn">Preview</button>
          <button type="submit" disabled={loading} className="btn primary">
            {loading ? <RoundLoader size={18} /> : 'Publish'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="input mt-1" />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button type="button" onClick={onBold} title="Bold" className="p-2 rounded border">B</button>
          <button type="button" onClick={onItalic} title="Italic" className="p-2 rounded border"><em>I</em></button>
          <button type="button" onClick={onNumbered} title="Numbered list" className="p-2 rounded border">1.</button>
          <button type="button" onClick={onBullet} title="Bullet list" className="p-2 rounded border">•</button>
          <button type="button" onClick={onInsertImageUrl} title="Insert image URL" className="p-2 rounded border">Img URL</button>
        </div>

        <label className="block text-sm font-medium">Body (HTML)</label>
        <textarea
          ref={taRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          className="textarea mt-1 min-h-[260px] w-full"
          placeholder="Write your post here. Use toolbar to wrap selection in bold/italic etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Categories</label>
          <div className="flex gap-2 mt-2">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Add category" className="input" />
            <button type="button" onClick={addCategory} className="btn">Add</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c} className="px-2 py-1 border rounded text-sm flex items-center gap-2">
                {c}
                <button type="button" onClick={() => setCategories(prev => prev.filter(x => x !== c))} aria-label="remove">✕</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Featured image</label>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="mt-2 p-3 border-dashed border rounded text-sm"
          >
            <div className="mb-2">Drag & drop image here, or upload, or provide URL</div>
            <input type="file" accept="image/*" onChange={e => setFeaturedFile(e.target.files?.[0] || null)} />
            <div className="mt-2 text-xs">or Image URL</div>
            <input value={featuredUrl} onChange={e => setFeaturedUrl(e.target.value)} placeholder="https://..." className="input mt-1" />
            {featuredFile && <div className="mt-2 text-sm">Selected: {featuredFile.name}</div>}
            {featuredUrl && <div className="mt-2 text-sm">Using URL: {featuredUrl}</div>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => {
          // quick fill example
          setTitle('Example Title');
          const sample = '<p><strong>Intro</strong></p><p>More content...</p>';
          setBody(sample);
        }} className="btn">Insert sample</button>

        <button type="button" onClick={() => { setTitle(''); setBody(''); setCategories([]); setFeaturedFile(null); setFeaturedUrl(''); }} className="btn">Clear</button>
      </div>
    </form>
  );
}