# PlayHaven

**Your Games. Your Stories.**

Fondasi lokal platform social game cataloging menggunakan Laravel dan React. Bahasa antarmuka: English.

## Stack

| Bagian             | Teknologi                                            |
| ------------------ | ---------------------------------------------------- |
| Backend            | Laravel 13, PHP 8.5 pada mesin ini                   |
| Frontend           | React 19 + TypeScript                                |
| Routing            | Laravel routes + Inertia.js 3 + Wayfinder            |
| Styling            | Tailwind CSS 4                                       |
| Components         | shadcn/ui + Lucide                                   |
| Database aplikasi  | PostgreSQL 16                                        |
| Web authentication | Laravel Fortify, session, CSRF                       |
| API authentication | Laravel Sanctum                                      |
| Game catalog       | IGDB melalui backend Laravel                         |
| Build              | Vite, melalui Vite+ bawaan starter kit resmi terbaru |
| Mobile mendatang   | React Native + Expo, belum dibuat                    |

`composer.lock` dan `package-lock.json` mengunci versi dependensi yang terpasang.
Dependensi yang terkunci memerlukan PHP minimal 8.4.1; mesin ini dan konfigurasi CI menggunakan PHP 8.5.

## Menjalankan di Windows / Laragon

Jalankan dari `D:\laragon\www\playhaven`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

Script menyalakan PostgreSQL khusus proyek, Laravel pada **http://127.0.0.1:8000**, Vite, dan queue worker. Hentikan proses web dengan `Ctrl+C`.

Database tetap berjalan. Hentikan terpisah jika tidak dipakai:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\database.ps1 stop
```

Untuk terminal yang sudah mengizinkan script lokal:

```powershell
. .\scripts\env.ps1
php artisan about
npm run build
php artisan test
```

`env.ps1` hanya menambahkan PHP, Composer, dan PostgreSQL ke PATH terminal saat ini. Lokasi instalasi mesin ini tercantum dalam script tersebut. Jika memindahkan proyek ke komputer lain, sesuaikan path.

Database development tersimpan di `.local/postgres`, hanya mendengarkan `127.0.0.1:5433`, dan menggunakan password acak pada `.env`. Cluster ini terpisah dari instalasi PostgreSQL utama. Akun lokal `playhaven` memiliki hak pengelola cluster untuk development; gunakan akun aplikasi dengan hak terbatas saat deployment. Jangan menghapus `.local/postgres` jika ingin mempertahankan data. `.env` dan `.local/` diabaikan Git. Jangan mengganti `DB_PASSWORD` tanpa mengubah password role PostgreSQL juga.

Tes default memakai SQLite in-memory sesuai starter kit, sehingga tidak mengubah database development. Migrasi aplikasi dijalankan pada PostgreSQL.

PHP Laragon sudah diaktifkan untuk `pdo_pgsql`, `pgsql`, `pdo_sqlite`, dan `sqlite3`. Jika memakai Apache Laragon yang sudah berjalan sebelum perubahan itu, restart Apache. Document root web server harus menunjuk ke `public/`.

## IGDB

1. Buat aplikasi **Confidential** di [Twitch Developer Console](https://dev.twitch.tv/console/apps), sesuai [panduan IGDB](https://api-docs.igdb.com/#getting-started).
2. Isi `IGDB_CLIENT_ID` dan `IGDB_CLIENT_SECRET` di `.env` lokal. Jangan memakai prefix `VITE_` untuk secret.
3. Uji dari terminal yang sudah memuat `scripts/env.ps1`:

```powershell
php artisan config:clear
php artisan igdb:check
```

`App\Services\Igdb\IgdbClient` menangani OAuth di server, cache token/hasil, timeout, pacing bersama, dan cooldown saat respons 429. Katalog publik tersedia di `/games`, dengan pencarian, filter, pagination, dan halaman detail. Sinkronisasi memakai unique jobs dan upsert yang menjaga riwayat pemain.

```powershell
php artisan catalog:sync --inline
# Atau antrekan beberapa halaman:
php artisan catalog:sync --pages=5 --per-page=100 --offset=0
php artisan queue:work
```

Koneksi IGDB langsung belum diverifikasi karena credential belum diberikan. Katalog development tetap kosong sampai import berhasil. Lihat [panduan katalog](docs/CATALOG.md) untuk alur import dan batasannya.

## Akses lewat Laragon

Virtual host `playhaven.test` dan alias `www.playhaven.test` sudah disiapkan dengan document root `public/`. Domain utama sudah terdaftar dan diverifikasi lewat Apache. Panduan menjalankan Laragon sebagai Administrator serta penyesuaian lokal Carbon/OPcache tersedia di `docs/LARAGON.md`. Untuk development:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1 -Service laragon
```

Mode ini menyalakan PostgreSQL, Vite, dan queue; Apache Laragon melayani web. Detail terdapat di [panduan Laragon](docs/LARAGON.md). Mode localhost sebelumnya tetap tersedia.

## Authentication dan API

Starter menyediakan register, login, logout, reset password, verifikasi email, account settings, serta fitur keamanan bawaan. Email lokal memakai `MAIL_MAILER=log`; tautan verifikasi/reset ada di `storage/logs/laravel.log`. Konfigurasikan penyedia email sebelum production.

Endpoint fondasi `GET /api/v1/user` dilindungi `auth:sanctum`, menerima bearer token Sanctum, dan menyembunyikan atribut rahasia model. Belum ada endpoint penerbitan token mobile. Web Inertia memakai session Laravel; React Native/Expo dan alur login mobile dikerjakan pada tahap berikutnya.

## Pemeriksaan

```powershell
. .\scripts\env.ps1
npm run build
npm run types:check
php artisan test
php vendor/bin/pint --test
php vendor/bin/phpstan analyse --memory-limit=1G
```

## Struktur utama

```text
app/                 Backend, models, actions, services
  Services/Igdb/     Client katalog eksternal
resources/js/        React + TypeScript
  components/ui/     Komponen shadcn/ui
  pages/             Halaman Inertia
resources/css/       Tailwind dan token palet PlayHaven
routes/web.php       Halaman web
routes/api.php       API versi v1
database/migrations/ Skema database
scripts/             Helper development Windows
docs/                Product brief dan urutan pengembangan
```

Halaman pembuka dan token palet sudah diberi identitas PlayHaven. Fondasi database inti sudah mencakup katalog, profil, library, playthrough, diary, rating, review, lists, dan follows. Model, factory, serta tes integritas tersedia; layar dan endpoint fitur tersebut belum dibuat. Lihat [data model](docs/DATA_MODEL.md) dan [product brief](docs/PRODUCT.md).

Untuk menjalankan seluruh tes pada PostgreSQL yang terpisah dari database development:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-postgres.ps1
```

Script memakai database disposable `playhaven_testing` dan memverifikasi targetnya sebelum tes mereset tabel. Database development `playhaven` tidak dipakai oleh tes tersebut.
