# Зафиксированный путь Foxy

- `/sign-in?redirect_url=%2F`: вход, социальные провайдеры, email.
- `/welcome?step=1`: интересы, множественный выбор.
- `/welcome?step=2`: Me / An AI character, затем Continue.
- `/welcome?step=4`: Monthly / Annual, промокод, отзывы, FAQ, Close. Checkout не запускался.
- `/explore`: каталог, Social, категории, Newest, тип медиа, поиск; мобильные Search / Filters, нижнее меню.
- Карточка шаблона: Choose how to use this template → Use your photos / Use an AI influencer.
- `/characters?c=0`: Upload a photo of your face, 10MB, See tips for best results. Файлы на Foxy не загружались.
- `/shop`: этнические категории, сортировка Relevant, Filter, карточки, Load more.
- `/shop/01887ae3-b33b-42d4-a913-60056ea1f055`: Kanya, видео / фото, планы, Proceed to checkout, Promo code, рекомендации.
- Create / Characters / Gallery в доступной сессии: You need to finish character creation to access this feature.

Первичный источник — реальная авторизованная сессия во встроенном браузере. Скриншоты и DOM/style evidence сохранены локально, а не подменены пересказом. Дополнительный экран с целями мелькнул при повторном входе в welcome и перенаправил на Explore после загрузки; в выбранный стабильный путь не включен.

## Регистрация и преленд — 6 октября 2026

- `https://foxy.ai/of-creators`: после первоначальных ошибок доступа страница открылась. Сняты первый экран, полная страница, desktop/mobile секции, monthly/yearly, открытый FAQ, DOM/CSS и публичные медиа. Get started ведет на `https://app.foxy.ai/sign-up`; в Elf — на локальный `index.html#signup` с сохранением query/UTM. Изначальный блокер преленда снят.
- `/sign-up`: Start creating, Google / Facebook / Apple / X, Your email, Already have an account? Log in, Forgot password, правовые ссылки. Desktop: соцкнопки над email; mobile: email над соцкнопками. Непустой email раскрывает Enter password и Continue. Формы на Foxy не отправлялись, новый аккаунт не создавался.
- `/sign-in`: Welcome back, те же способы входа, ссылка Sign up. Для снятия гостевых экранов текущая сессия Foxy завершена.
- `/forgot-password`: доступный отрисованный экран оказался пустым; восстановление на Foxy не проверено. В Elf — пояснение об отсутствии email recovery в локальном прототипе.
