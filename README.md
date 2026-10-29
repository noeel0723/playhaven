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
| Game catalog       | RAWG melalui backend Laravel                         |
| Build              | Vite, melalui Vite+ bawaan starter kit resmi terbaru |
| Mobile mendatang   | React Native + Expo, belum dibuat                    |

`composer.lock` dan `package-lock.json` mengunci versi dependensi yang terpasang.
Dependensi yang terkunci memerlukan PHP minimal 8.4.1; mesin ini dan konfigurasi CI menggunakan PHP 8.5.

## Menjalankan di Windows / Laragon

Untuk membuka situs dengan aset yang sudah dibuild: jalankan Apache dari Laragon, lalu klik dua kali **`start-playhaven.cmd`** di folder proyek. Launcher ini hanya menyalakan PostgreSQL khusus PlayHaven, memeriksa situs, dan membukanya di browser. Tidak perlu menjalankan terminal development jika hanya ingin melihat situs.

Untuk development dengan Apache Laragon:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1 -Service laragon
```

PlayHaven memakai PostgreSQL `5433` dan Vite `5181` yang terpisah dari Literahaven. Vite memakai `strictPort`, sehingga tidak pindah diam-diam ke port lain. Database proyek ini tidak otomatis menyala hanya dengan menyalakan Apache; jalankan launcher lagi setelah restart komputer. Launcher tidak mengubah proyek lain atau mendaftarkan service Windows.

Jalankan dari `D:\laragon\www\playhaven`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

Mode `all` menyalakan PostgreSQL khusus proyek, Laravel pada **http://127.0.0.1:8001**, Vite pada `5181`, dan queue worker. Hentikan proses web dengan `Ctrl+C`.

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

## Library pribadi

Buka detail game dari `/games`, pilih status bermain dan favorit di **Your experience**, lalu simpan ke library. Halaman `/library` menyediakan pencarian, filter status/favorit, dan pagination. Dashboard sekarang menampilkan ringkasan serta game terbaru dari koleksi akun yang login. Detail kepemilikan, penghapusan, dan alur fitur ada di [panduan library](docs/LIBRARY.md).

## Rating dan review

Setelah menambahkan game ke library, gunakan **Your rating** pada detail game untuk memberi 0,5–5 bintang. Tulis review di **Your story**, tandai spoiler bila diperlukan, dan pilih apakah ingin membagikannya ke publik. Review baru dimulai sebagai privat; review publik tampil pada **From the community**. Rating pribadi juga tampil pada kartu library. Lihat [panduan rating dan review](docs/RATINGS_REVIEWS.md).

## Playthrough dan diary

Dari detail game yang sudah ada di library, pilih **Playthroughs & diary** untuk membuat perjalanan pertama atau replay. Catat sesi beserta tanggal, durasi, dan catatan pribadi; buka **Diary** untuk mencari riwayat dari semua game. Status library, rating, dan review tetap dipertahankan saat mengelola playthrough. Lihat [panduan riwayat bermain](docs/PLAYING_HISTORY.md).

## Custom lists dan pencarian game lain

Buka **Lists** untuk membuat koleksi privat, unlisted, atau publik. Tambahkan game lewat pencarian dalam list, lalu atur catatan dan posisinya. List publik dapat ditemukan pada **Community lists**. Lihat [panduan list](docs/LISTS.md).

Untuk mencari judul yang belum ada di katalog, buka **Games → Find more games**, masukkan nama game di **Search RAWG**, lalu pilih **Add to catalog**. Game yang sudah tersedia menampilkan **Open game**. Pencarian ini memakai API key di backend; detail ada di [panduan katalog](docs/CATALOG.md#search-and-import-from-the-website).

## Verifikasi email saat development

Untuk pengembangan lokal, gunakan `APP_ENV=local` dan `AUTH_REQUIRE_EMAIL_VERIFICATION=false` di `.env`. Akun baru maupun akun lama bisa membuka dashboard dan pengaturan tanpa verifikasi, dan email verifikasi tidak dikirim. Status `email_verified_at` tetap mengikuti verifikasi asli.

Untuk mengaktifkannya kembali, ubah `AUTH_REQUIRE_EMAIL_VERIFICATION=true`, lalu jalankan `php artisan config:clear`. Lingkungan selain `local` selalu mewajibkan verifikasi email.

## RAWG

Provider katalog aktif adalah RAWG. Isi `RAWG_API_KEY` di `.env` lokal, lalu jalankan:

```powershell
. .\scripts\env.ps1
php artisan config:clear
php artisan migrate
php artisan rawg:check
php artisan catalog:sync --inline
```

Default import mengambil 20 game dan deskripsi lengkapnya. Untuk background jobs:

```powershell
php artisan catalog:sync --page=1 --pages=5 --per-page=20
php artisan queue:work
```

ID RAWG dipisahkan dari ID IGDB lama. Import mempertahankan ID lokal, URL, library, rating, dan riwayat pemain. RAWG menggunakan API key langsung; tidak membutuhkan Twitch. Key tidak dicetak di output, dikirim ke frontend, atau disimpan di contoh konfigurasi. Detail ada di [panduan katalog](docs/CATALOG.md).

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
  Services/Rawg/     Client dan sinkronisasi katalog aktif
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
