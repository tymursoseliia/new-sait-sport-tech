import { Metadata } from 'next';

const siteUrl = 'https://volga-auto-premier.ru';
const siteName = 'СПОРТ ТЕХ';
const defaultTitle = 'Автопригон из Европы под ключ - СПОРТ ТЕХ';
const defaultDescription =
  'Профессиональный автопригон из Европы. Подбор, проверка, доставка и растаможка автомобилей. Более 500 довольных клиентов. Гарантия юридической чистоты.';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s - ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'автопригон из европы',
    'пригон авто из германии',
    'купить авто в европе',
    'растаможка автомобилей',
    'доставка авто из европы',
    'проверка авто перед покупкой',
    'автомобили из германии',
    'европейские автомобили',
    'автопригон под ключ',
    'СПОРТ ТЕХ',
  ],
  authors: [{ name: 'СПОРТ ТЕХ' }],
  creator: 'СПОРТ ТЕХ',
  publisher: 'СПОРТ ТЕХ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'СПОРТ ТЕХ - Автопригон из Европы',
        type: 'image/jpeg',
      },
      {
        url: `${siteUrl}/logo-square.png`,
        width: 500,
        height: 500,
        alt: 'СПОРТ ТЕХ Logo',
        type: 'image/png',
      },
      {
        url: `${siteUrl}/icon.svg`,
        width: 512,
        height: 512,
        alt: 'СПОРТ ТЕХ Icon',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Добавьте коды верификации когда получите их
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'ru-RU': siteUrl,
      'en-US': `${siteUrl}/en`,
    },
  },
};

export function generatePageMetadata(
  title: string,
  description: string,
  path: string = '',
  image?: string
): Metadata {
  const url = `${siteUrl}${path}`;
  const ogImage = image || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Метаданные для конкретных страниц
export const pageMetadata = {
  home: {
    title: 'Автопригон из Европы под ключ - СПОРТ ТЕХ',
    description:
      'Профессиональный автопригон автомобилей из Европы. Подбор, проверка документов, доставка и растаможка. 6+ лет опыта, 500+ довольных клиентов. Юридическая чистота гарантирована.',
    keywords: [
      'автопригон',
      'автомобили из европы',
      'пригон авто',
      'купить авто в европе',
      'растаможка авто',
    ],
  },
  catalog: {
    title: 'Каталог автомобилей из Европы - актуальные предложения',
    description:
      'Актуальный каталог автомобилей из Европы. BMW, Mercedes, Audi, Volkswagen и другие марки. Проверенные авто с историей обслуживания. Гарантия юридической чистоты.',
    keywords: [
      'каталог авто из европы',
      'купить bmw из германии',
      'mercedes из европы',
      'audi из германии',
      'автомобили в наличии',
    ],
  },
  services: {
    title: 'Услуги автопригона из Европы - полный спектр услуг',
    description:
      'Полный спектр услуг по автопригону: подбор авто, техническая проверка, юридическое сопровождение, логистика, растаможка. Прозрачные условия и фиксированные цены.',
    keywords: [
      'услуги автопригона',
      'подбор авто из европы',
      'растаможка автомобилей',
      'доставка авто',
      'проверка авто',
    ],
  },
  about: {
    title: 'О компании СПОРТ ТЕХ - 6+ лет в автопригоне',
    description:
      'СПОРТ ТЕХ - профессиональная команда по автопригону из Европы. 6+ лет на рынке, 500+ довольных клиентов, прямые контракты с европейскими дилерами.',
    keywords: [
      'sport tech',
      'о компании',
      'автопригон из европы',
      'команда специалистов',
    ],
  },
  reviews: {
    title: 'Отзывы СПОРТ ТЕХ - реальные отзывы клиентов СПОРТ ТЕХ',
    description:
      'Отзывы СПОРТ ТЕХ: читайте реальные отзывы клиентов о работе СПОРТ ТЕХ. Более 500 довольных клиентов из России. Автопригон из Европы под ключ - честные отзывы и рейтинги.',
    keywords: [
      'спорт тех отзывы',
      'sport tech отзывы',
      'отзывы спорт тех',
      'отзывы sport tech',
      'автопригон отзывы',
      'реальные отзывы клиентов',
      'покупка авто из европы отзывы',
      'отзывы о компании спорт тех',
    ],
  },
  blog: {
    title: 'Блог о автопригоне - полезные статьи и советы',
    description:
      'Полезные статьи об автопригоне из Европы: как выбрать авто, проверка перед покупкой, таможенное оформление, сравнение моделей и брендов. Экспертные советы от СПОРТ ТЕХ.',
    keywords: [
      'блог автопригон',
      'статьи об автомобилях',
      'как купить авто в европе',
      'советы по покупке авто',
    ],
  },
  contacts: {
    title: 'Контакты СПОРТ ТЕХ - связаться с нами',
    description:
      'Контакты СПОРТ ТЕХ: телефон +7 (934) 005-11-27, WhatsApp, Telegram. Офис в Екатеринбурге и Гродно. Работаем Пн-Пт 09:00-19:00, Сб 10:00-16:00. Бесплатная консультация по автопригону.',
    keywords: [
      'контакты sport tech',
      'телефон автопригон',
      'офис екатеринбург',
      'консультация автопригон',
    ],
  },
  faq: {
    title: 'Часто задаваемые вопросы об автопригоне из Европы',
    description:
      'Ответы на часто задаваемые вопросы о автопригоне: сроки доставки, стоимость, таможня, документы, гарантии. Получите исчерпывающую информацию от экспертов СПОРТ ТЕХ.',
    keywords: [
      'faq автопригон',
      'вопросы автопригон',
      'как купить авто в европе',
      'стоимость автопригона',
    ],
  },
  howWeWork: {
    title: 'Как мы работаем - этапы автопригона под ключ',
    description:
      'Подробное описание процесса автопригона: от заявки до получения ключей. Прозрачная схема работы, фиксированные сроки, контроль на каждом этапе.',
    keywords: [
      'этапы автопригона',
      'как работает автопригон',
      'процесс покупки авто',
      'схема работы',
    ],
  },
};
