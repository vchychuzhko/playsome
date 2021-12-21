# PlaySome

Web application to visualize your music in real time. Just drop the file [on it](https://playsome.fun/)!

## Table of contents

- [Requirements](#requirements)
- [Deploying](#deploying)
- [Development](#development)

## Requirements

* Web server (Apache/Nginx) pointed to `public` folder
* PHP 7.4+
* Composer
* Node.js

## Deploying

1) Create local `.env` file:

```bash
cp .env .env.local
```

Then change app mode to `prod`, along with generating production `APP_SECRET` key.

2) Install dependencies:

```bash
composer install --no-dev
npm install --only=production
```

3) Build production assets:

```bash
npm run build
```

💡 File `nginx.conf.sample` contains needed configurations, including secure connection and redirects. Replace `domain.com` and `user` placeholders with your actual data.

## Development

Same as [Deploying](#deploying) but step with dependencies installation goes without flags.

Useful commands:

```bash
npm run watch # watch after assets changes
npm run dev # build assets once
```

---

###### [Symfony 5.4](https://symfony.com/doc/5.4/index.html) is used
