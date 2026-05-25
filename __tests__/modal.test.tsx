import { render, screen } from '@testing-library/react-native';
import ModalScreen from '../app/modal';

// Mock components
jest.mock('@/components/EditScreenInfo', () => 'EditScreenInfo');
jest.mock('@/components/Themed', () => {
  const React = require('react');
  return {
    Text: (props: any) => React.createElement('Text', props),
    View: (props: any) => React.createElement('View', props),
  };
});

describe('ModalScreen', () => {
  it('renders the modal title', () => {
    render(<ModalScreen />);
    expect(screen.getByText('Modal')).toBeTruthy();
  });
});
