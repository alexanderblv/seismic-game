# 🌊 Seismic Transaction Sender

Отправка зашифрованных транзакций через Seismic Devnet

## Быстрый старт

1. Откройте приложение: https://seismic-transaction-sender.vercel.app
2. Нажмите "Connect Wallet" для подключения кошелька
3. Добавьте Seismic Network (если требуется)
4. Отправляйте транзакции!

## Основные функции

### 💼 Кошелек
- Подключение через Privy Auth
- Просмотр адреса и баланса
- Автоматическое добавление Seismic devnet

### 💸 Транзакции
- Обычные ETH переводы
- Зашифрованные транзакции Seismic
- Просмотр истории транзакций

### 🔐 Зашифрованные типы
- `suint` - зашифрованные числа
- `saddress` - зашифрованные адреса
- `sbool` - зашифрованные логические значения

## Seismic Devnet

- **Chain ID**: 5124
- **RPC URL**: https://node-2.seismicdev.net/rpc
- **Explorer**: https://explorer.seismicdev.net
- **Faucet**: https://faucet.seismicdev.net

## Локальный запуск

```bash
# Простой HTTP сервер
python -m http.server 8080

# Или с Node.js
npx serve .
```

## Поддержка

- [Документация Seismic](https://docs.seismic.systems/)
- [Privy SDK](https://docs.privy.io/)

---

**Внимание**: Используйте только тестовые средства на Seismic devnet! 