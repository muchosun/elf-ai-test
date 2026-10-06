# Elf → MAVS: отдельная Vercel Function

Самостоятельный проект Vercel. Основной сайт продолжает работать на GitHub Pages.
Документация поставщика: файл `Untitled.txt` в переписке с Ильёй от 24 июля 2026:
https://addop.slack.com/archives/D0BHYMLQ5CN/p1784889109509729

## Что реализовано

- `GET /api/health` — доступность функции и `checkoutEnabled`.
- `POST /api/checkout` — серверный вызов MAVS `/v1/checkout`, ответ с URL их hosted формы.
- `OPTIONS /api/checkout` — CORS для `https://muchosun.github.io`.
- Принимаются только `plan`, `customerId` и `requestId` (UUID). Реквизиты карт, email,
  пароли, клиентские суммы и URL возврата не принимаются.
- Суммы фиксируются на сервере: monthly = 9 USD, annual = 72 USD.
- Используется разовая sandbox sale для проверки выбора тарифа, без рекуррентных
  списаний. Это не подключение реальной подписки.
- Проверяются HTTPS и разрешённые origins возвращаемой формы. Ключ не выдаётся клиенту.
- Функция не хранит карточные данные, аккаунты и результаты платежей.

## Активация

До подтверждения поставщика функция возвращает `503 sandbox_not_confirmed` и не
обращается к MAVS. `MAVS_SANDBOX_CONFIRMED` — наша защита, **не параметр API MAVS**.
В полученной документации нет описания параметра `sandbox` или способа переключения
процессора. Нужно подтвердить sandbox для конкретного проекта и корректный API base.

Настройки задаются в Vercel Environment Variables по именам из `.env.example`.
Ключ вводится напрямую в Vercel, не в Git/HTML и не в аргументы команд.
Не используйте live-ключ, не меняйте webhook существующего LustAI.

Пример запроса после активации:

```js
const response = await fetch('https://YOUR-VERCEL-PROJECT.vercel.app/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ plan: 'monthly', customerId: account.id, requestId: crypto.randomUUID() })
});
const data = await response.json();
if (!response.ok) throw new Error(data.error);
location.assign(data.url);
```

Не повторяйте запрос автоматически с новым `requestId` при неизвестном результате:
таймаут мог произойти после создания заказа. Повтор с тем же ID получает `409`.

## Граница текущего этапа

Публичный frontend пока не переключён на функцию: сначала подтверждаем sandbox и
проверяем hosted форму. Возврат `success` не означает подтверждённую оплату.
Для измерения завершённых оплат следующим этапом нужен отдельный sandbox-проект,
приём и проверка подписанных webhook, долговременное хранилище заказов/событий и
связь с источником трафика. Этот обработчик этого результата не заявляет.
Перед включением на рекламный трафик настройте rate limit в Vercel Firewall:
CORS ограничивает браузеры, но не является аутентификацией и защитой от curl.

Проверка: `npm test` из этой директории. Деплой: `vercel deploy --prod` из неё же.
