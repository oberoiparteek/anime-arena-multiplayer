import { Role } from './types';

export const ROLES: Role[] = ['Captain', 'Vice Captain', 'Tank', 'Healer', 'Support'];

export const INITIAL_CREW_SLOTS: { name: Role; count: number }[] = [
    { name: 'Captain', count: 1 },
    { name: 'Vice Captain', count: 1 },
    { name: 'Tank', count: 1 },
    { name: 'Healer', count: 1 },
    { name: 'Support', count: 2 }
];
