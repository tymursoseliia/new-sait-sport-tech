'use client';

import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center transition-transform active:scale-95 duration-150">
      <img
        src="/logo-sport-tech.png"
        alt="СПОРТ ТЕХ"
        className="h-16 md:h-20 w-auto transition-all duration-300"
        loading="eager"
      />
    </Link>
  );
}
