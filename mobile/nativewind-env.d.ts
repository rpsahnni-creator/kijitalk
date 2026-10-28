/// <reference types="nativewind/types" />

// TypeScript 6's stricter side-effect-import check (TS2882) needs an explicit
// module declaration for the global.css import in app/_layout.tsx.
declare module '*.css';
