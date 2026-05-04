import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = (() => false) as Element['hasPointerCapture'];
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = (() => {}) as Element['releasePointerCapture'];
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = (() => {}) as Element['setPointerCapture'];
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = (() => {}) as Element['scrollIntoView'];
}
