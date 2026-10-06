# Elf — локальная регистрация

final result: passed

Дата: 2026-10-06. Область: signup / login и локальный вход через онбординг до paywall. Преленд не входит в этот passed; общий блокер отражен в design-qa.md.

## Визуальная правда и сравнение

Источник: авторизованная сессия завершена, гостевые https://app.foxy.ai/sign-up и /sign-in прочитаны в IAB. Скриншоты: evidence/signup-source-desktop.png, signup-source-mobile.png, signup-email-source-desktop.png, signup-email-source-mobile.png, login-source-desktop.png и login-source-mobile.png. DOM/styles и SVG: evidence/auth-capture.json.

Реализация: evidence/signup-elf-desktop.png и signup-elf-mobile.png. Полное сравнение: evidence/compare-signup-desktop.png и compare-signup-mobile.png. CSS viewport: 1440×900 / 390×844. Source screenshots: 1440×900 и 390×844. Implementation: 1425×891 и 375×812 из IAB; перед сравнением приведены к размерам источника, без браузерной рамки. Разница растров и scrollbar явно учтена; абсолютная пиксельная идентичность не заявляется. Формы читаемы в full-view мобильного сравнения; desktop сравнен с областью формы в исходном разрешении.

Проверены пять поверхностей: Rethink Sans и 40px/48px заголовок; карта 512px с 80px padding на desktop / 24px mobile; отступы 16px, социальные кнопки 56px, поля 45.6px; белый/серый/red/pink токены; реальные SVG социальных значков и фона; тексты/порядок элементов регистрации. Название Elf и локальное пояснение намеренно отличаются от Foxy.

## История сравнения

Начальная desktop-пара имела разные viewport и давала ложное различие масштаба. Viewport выставлен повторно на 1440×900; повторная пара compare-signup-desktop.png показывает совпадающую ширину карты, заголовка и кнопок. Mobile-пара проверена отдельно: порядок email → разделитель → соцкнопки совпадает. Видимая дополнительная строка Local preview увеличивает карту; это осознанное пояснение демонстрационного входа. Неустраненных P0/P1/P2 в регистрации не найдено.

## Функциональная проверка

В IAB создан синтетический профиль с тестовыми данными, не аккаунт Foxy. Пройдены email → раскрытие пароля → Continue → interests → AI character → paywall. Проверены reload, восстановление экрана при открытии корня, logout, неверный пароль с ошибкой и правильный повторный вход. Соцкнопки открывают честное пояснение и переводят к email, recovery не имитирует отправку письма.

npm test: профиль, salted verifier без plaintext password, session restore, logout, invalid / valid password, mismatched session, storage error. npm run build и node --check проходят. Production-сборка отдельно открыта на 4174: проверены social → email, отсутствие console error/warn, битых изображений и горизонтального переполнения (signup-elf-production-mobile.png). Пароль не записывается в события или HTML.

## Остаток

Точное воспроизведение серверной регистрации, реальный OAuth, подтверждение email и recovery исключены пользовательским объемом локальной регистрации. Минимальная длина пароля 8 — собственное правило, не утверждение об ограничениях Foxy. PBKDF2 не превращает localStorage в серверную защиту. P3: фазу декоративной анимации фона можно уточнить позднее; кадры источника меняются.
