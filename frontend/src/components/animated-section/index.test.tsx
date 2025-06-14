import React from 'react';
import { render, screen } from '@testing-library/react';
import AnimatedSection from './index';

test('рендерит детей', () => {
  render(<AnimatedSection>Тест</AnimatedSection>);
  expect(screen.getByText('Тест')).toBeInTheDocument();
});
