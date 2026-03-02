import { cn } from '@/lib/utils';

describe('cn (class name utility)', () => {
  it('returns empty string when no arguments given', () => {
    expect(cn()).toBe('');
  });

  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('merges multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional class names (falsy values excluded)', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', undefined, 'baz')).toBe('foo baz');
    expect(cn('foo', null, 'baz')).toBe('foo baz');
  });

  it('resolves Tailwind conflicts – last class wins', () => {
    // tailwind-merge should resolve conflicting utilities
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles object syntax from clsx', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true, bar: true })).toBe('foo bar');
  });

  it('handles array syntax from clsx', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles mixed input types', () => {
    expect(cn('base', { active: true }, ['extra'])).toBe('base active extra');
  });
});
