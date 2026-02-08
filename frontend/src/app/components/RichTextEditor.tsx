'use client';

import React, { useEffect, useRef, useState } from 'react';

// Common interface for props
interface RichTextEditorProps {
    value: string;
    onChange: (data: string) => void;
    placeholder?: string;
    style?: React.CSSProperties;
}

export default function RichTextEditor({ value, onChange, placeholder, style }: RichTextEditorProps) {
    const editorRef = useRef<any>(null);
    const [editorLoaded, setEditorLoaded] = useState(false);
    const { CKEditor, ClassicEditor } = editorRef.current || {};

    useEffect(() => {
        // Dynamic import to avoid SSR issues
        // @ts-ignore
        import('@ckeditor/ckeditor5-react').then(CKEditorModule => {
            // @ts-ignore
            import('@ckeditor/ckeditor5-build-classic').then(ClassicEditorModule => {
                editorRef.current = {
                    CKEditor: CKEditorModule.CKEditor,
                    ClassicEditor: ClassicEditorModule.default
                };
                setEditorLoaded(true);
            });
        });
    }, []);

    if (!editorLoaded) {
        return <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', color: '#888' }}>Loading Editor...</div>;
    }

    return (
        <div style={style}>
            <CKEditor
                editor={ClassicEditor}
                data={value || ''}
                config={{
                    placeholder: placeholder || 'Type here...',
                    toolbar: [
                        'heading', '|',
                        'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                        'outdent', 'indent', '|',
                        'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo'
                    ]
                }}
                onChange={(event: any, editor: any) => {
                    const data = editor.getData();
                    onChange(data);
                }}
            />
            <style jsx global>{`
                .ck-editor__editable {
                    min-height: 150px;
                    max-height: 400px;
                }
            `}</style>
        </div>
    );
}
