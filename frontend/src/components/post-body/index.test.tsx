import React from 'react';
import { render, screen } from '@testing-library/react';
import PostBody from './index';

jest.mock('@tiptap/react', () => ({
  useEditor: () => ({ commands: {}, isDestroyed: false }),
  EditorContent: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/lib/tiptapGalleryExtension', () => ({ GalleryNode: {} }));

const content = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
};

test('рендерится без ошибок', () => {
  const { container } = render(<PostBody content={content} />);
  expect(container.firstChild).toBeInTheDocument();
});


