@tailwind base;
@tailwind components;
@tailwind utilities;

html { scroll-behavior: smooth; }
body { @apply bg-[#faf9fc] text-slate-800 font-sans antialiased; }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { @apply bg-brand-200 rounded-full; }
::-webkit-scrollbar-track { background: transparent; }

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none;
  }
  .btn-primary {
    @apply btn bg-brand-500 text-white px-6 py-2.5 hover:bg-brand-600 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30;
  }
  .btn-accent {
    @apply btn bg-accent-500 text-white px-6 py-2.5 hover:bg-accent-600 shadow-lg shadow-accent-500/20;
  }
  .btn-outline {
    @apply btn border-2 border-brand-500 text-brand-600 px-6 py-2.5 hover:bg-brand-50;
  }
  .btn-ghost {
    @apply btn text-slate-600 px-4 py-2 hover:bg-slate-100;
  }
  .card {
    @apply bg-white rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow duration-300;
  }
  .input {
    @apply w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition;
  }
  .label {
    @apply block text-sm font-semibold text-slate-700 mb-1.5;
  }
  .section-title {
    @apply font-display text-2xl md:text-3xl font-semibold text-slate-900;
  }
  .container-app {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}
