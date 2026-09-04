# Utinochat

Utinochat is an independent web messenger built for the Utinochat service with React, Vite and Supabase.

## Upstream references

The implementation and UX work are informed by the following public Telegram projects:

- Telegram Web K (`morethanwords/tweb`)
- Telegram Web A (`Ajaxy/telegram-tt`)
- Webogram (`zhukov/webogram`)
- Telegram Desktop (`telegramdesktop/tdesktop`)
- Telegram's public website and product UX (`telegram.org`)

The web projects above are GPL-licensed, and Telegram Desktop is also GPL-licensed. Their repositories use different technology stacks, so their source cannot honestly be treated as one directly interchangeable web application. Utinochat adapts relevant public interaction patterns and implementation ideas to its own React/Vite/Supabase architecture.

Utinochat is not Telegram, does not use Telegram branding as its service identity, and does not connect to Telegram's MTProto service.

If GPL-covered upstream source is copied into Utinochat in the future, the applicable source files, copyright notices and license terms must be preserved and the corresponding source made available as required by the GPL.

## Build

npm install
npm run build

## Development

npm run dev
