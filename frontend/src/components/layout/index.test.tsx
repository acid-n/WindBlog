import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from './index';

jest.mock('../header', () => () => <div>HeaderMock</div>);
jest.mock('../footer', () => () => <div>FooterMock</div>);

test('рендерит детей и обертку', () => {
  render(<Layout><p>Child</p></Layout>);
  expect(screen.getByText('HeaderMock')).toBeInTheDocument();
  expect(screen.getByText('FooterMock')).toBeInTheDocument();
  expect(screen.getByText('Child')).toBeInTheDocument();
});
