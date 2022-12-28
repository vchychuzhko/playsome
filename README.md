# PlaySome

[![version](https://img.shields.io/static/v1?label=version&message=v0.9.4&color=orange)](https://playsome.fun)
[![lint](https://github.com/vchychuzhko/playsome/actions/workflows/lint.yml/badge.svg?branch=master)](https://github.com/vchychuzhko/playsome/actions/workflows/lint.yml)

Web application to visualize music in real time.

## Table of contents

- [Requirements](#requirements)
- [Deploying](#deploying)
- [Development](#development)

## Requirements

* Web server pointed to `public` folder
* PHP 8.1
* Composer v2
* Node 18

💡 `nginx.conf.sample` contains needed configurations, including secure connection and redirects. Replace `domain.com` and `user` placeholders with the actual data.

💡 `ispconfig.conf` file can be used for ISPConfig panel: Website > Options > "nginx Directives"

## Deploying

1) Create local `.env` file:

```bash
cp .env .env.local
```

  * Change `APP_ENV` to `prod`, along with generating production `APP_SECRET` key:

```bash
php -r 'echo bin2hex(random_bytes(16)) . "\n";'
```

  * Set `DATABASE_URL` credentials:

```dotenv
DATABASE_URL="mysql://..."
```

2) Install dependencies:

```bash
composer install --no-dev
npm install --omit=dev
```

3) Build production assets:

```bash
npm run build
```

## Development

Deploying is the same as [production deploy](#deploying), but step with dependencies installation goes **without** flags.

### Database

```bash
php bin/console make:entity Podcast         # add new fields to Podcast entity
php bin/console make:migration              # create array migration file with new changes
php bin/console doctrine:migrations:migrate # apply changes to the database
```

### Assets

```bash
npm run lint  # test js and css files against lint configurations
npm run dev   # build assets once
npm run watch # build and watch after assets changes
```

---

###### [Symfony 5.4](https://symfony.com/doc/5.4/index.html) is used
