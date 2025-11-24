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
    <div>
      <CKEditor
        editor={ClassicEditor as any}
        data={value}
        onChange={(event: any, editor: any) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
    </div>
  );
}
