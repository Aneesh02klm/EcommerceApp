"use client";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-white">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        style={{ height: '200px', marginBottom: '50px' }}
      />
    </div>
  );
}
