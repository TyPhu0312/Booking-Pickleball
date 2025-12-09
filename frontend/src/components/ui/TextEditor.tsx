/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import dynamic from "next/dynamic";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((m) => m.CKEditor),
  { ssr: false }
);

export default function TextEditor({ value, onChange }: any) {
  return (
    <div className="min-h-[200px]" >
      <CKEditor
        editor={ClassicEditor as any}
        data={value}
        config={{
          toolbar: [
            'heading', '|',
            'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
            'blockQuote', 'insertTable', '|',
            'undo', 'redo'
          ],
        }}
        onChange={(event: any, editor: any) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
      <style jsx global>{`
        .ck-editor__editable {
          min-height: 200px !important;
          max-height: 400px !important;
        }
      `}</style>
    </div>
  );
}
