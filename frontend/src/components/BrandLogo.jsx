function BrandLogo() {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center">
        <img
          src={`${import.meta.env.BASE_URL}homeasy-navbar-logo-v3.png?v=202607281035`}
          alt="The homeasy logo"
          className="h-full w-full max-w-none scale-[2.25] object-contain object-center mix-blend-screen brightness-110 contrast-110 drop-shadow-[0_4px_7px_rgba(0,0,0,0.25)]"
        />
      </span>

      <span className="min-w-0 leading-tight">
        <span className="block truncate text-lg font-black text-white">
          The homeasy
        </span>

        <span className="block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
          Smart Real Estate
        </span>
      </span>
    </span>
  );
}

export default BrandLogo;
