'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Common interface for props
interface RichTextEditorProps {
    value: string;
    onChange: (data: string) => void;
    placeholder?: string;
    style?: React.CSSProperties;
}

export default function RichTextEditor({ value, onChange, placeholder, style }: RichTextEditorProps) {
    const { t } = useLanguage();
    const [editorComponents, setEditorComponents] = useState<{ CKEditor: any, ClassicEditor: any } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        // Dynamic import to avoid SSR issues
        const loadEditor = async () => {
            try {
                const [CKEditorModule, ClassicEditorModule] = await Promise.all([
                    import('@ckeditor/ckeditor5-react'),
                    import('@ckeditor/ckeditor5-build-classic')
                ]);

                if (isMounted) {
                    setEditorComponents({
                        CKEditor: CKEditorModule.CKEditor,
                        ClassicEditor: ClassicEditorModule.default
                    });
                }
            } catch (err) {
                console.error('Failed to load CKEditor:', err);
                if (isMounted) {
                    setError('Failed to load text editor');
                }
            }
        };

        loadEditor();

        return () => {
            isMounted = false;
        };
    }, []);

    // Configuration for the editor
    const config = useMemo(() => ({
        placeholder: placeholder || t('type_here') || 'Type here...',
        toolbar: [
            'heading', '|',
            'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
            'outdent', 'indent', '|',
            'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo'
        ]
    }), [placeholder, t]);

    if (error) {
        return <div style={{ padding: '1rem', border: '1px solid var(--danger, #ef4444)', borderRadius: '4px', color: 'var(--danger, #ef4444)', fontSize: '0.875rem' }}>{error}</div>;
    }

    if (!editorComponents) {
        return <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', color: '#888', background: '#f9f9f9', fontSize: '0.875rem' }}>{t('loading_editor') || 'Loading editor...'}</div>;
    }

    const { CKEditor, ClassicEditor } = editorComponents;

    return (
        <div style={style} className="rich-text-editor-container">
            <CKEditor
                editor={ClassicEditor}
                data={value || ''}
                config={config}
                onChange={(event: any, editor: any) => {
                    const data = editor.getData();
                    // Only call onChange if data actually changed to avoid unnecessary re-renders
                    if (data !== value) {
                        onChange(data);
                    }
                }}
            />
            <style jsx global>{`
                .ck-editor__editable {
                    min-height: 150px;
                    max-height: 400px;
                }
                .ck-editor {
                    width: 100% !important;
                }
            `}</style>
        </div>
    );
}
