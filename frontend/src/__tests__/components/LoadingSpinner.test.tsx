import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('has spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('wraps in loading-spinner class', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });
});
