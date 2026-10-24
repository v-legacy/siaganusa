/**
 * @file constants/coachmark.ts
 * @description Konstanta Coach Mark Tour yang dipisah dari komponennya agar
 * bisa di-import tanpa ikut menarik modul CoachMarkTour ke bundle awal
 * (komponen tersebut di-lazy-load via next/dynamic).
 */

export const COACHMARK_STORAGE_KEY = 'siaganusa_coachmark_dismissed';
