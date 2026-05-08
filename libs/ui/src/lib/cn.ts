import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge tailwind classes with clsx semantics.
 * `cn('p-md', condition && 'p-lg')` → later wins, conflicts resolved.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
