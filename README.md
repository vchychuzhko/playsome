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

💡 File `nginx.conf.sample` contains needed configurations, including secure connection and redirects. Replace `domain.com` and `user` placeholders with the actual data.

## Deploying

1) Create local `.env` file:

```bash
cp .env .env.local
```

  * Change app mode to `prod`, along with generating production `APP_SECRET` key:

```bash
php -r 'echo bin2hex(random_bytes(16)) . "\n";'
```

  * Specify database credentials via `DATABASE_URL` variable.

```dotenv
DATABASE_URL="mysql://..."
```

2) Install dependencies:

```bash
composer install --no-dev
npm install --only=production
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

### Assets generation

```bash
npm run lint  # test js and css files against lint configurations
npm run dev   # build assets once
npm run watch # build and watch after assets changes
```

---

###### [Symfony 5.4](https://symfony.com/doc/5.4/index.html) is used
