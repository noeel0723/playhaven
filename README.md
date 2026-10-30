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

## Home

Home menampilkan hero sinematik **Red Dead Redemption 2**, navigasi dan pencarian katalog, enam game dari katalog lokal, serta pengenalan fitur PlayHaven. Tombol utama mengarah ke pendaftaran untuk tamu dan library untuk pengguna yang sudah login. Layout menyesuaikan desktop dan ponsel; menu mobile mendukung keyboard dan Escape. Lihat [panduan home dan sumber artwork](docs/HOME.md).

Header tersebut dipakai secara global dengan posisi yang sama sebelum dan setelah login. Halaman **Games** menyediakan toolbar **Browse by**, cover 2:3 dalam enam kolom desktop, tiga kolom tablet, dan dua kolom ponsel. Gunakan **Apply** untuk menerapkan pencarian dan filter; **Studio & publisher** membuka filter studio tambahan.

## Developer dan discovery

Detail game menampilkan developer, penerbit, dan tautan situs resmi bila tersedia. Klik nama developer atau penerbit untuk menjelajahi game lain dalam katalog lokal, atau gunakan filter **Studio & publisher** di `/games`. Game baru yang diimpor dari RAWG langsung menyimpan informasi tersebut. Untuk melengkapi game lama, jalankan `php artisan catalog:enrich --limit=100` setelah memuat `scripts/env.ps1`. Lihat [panduan katalog](docs/CATALOG.md).

## Statistik pribadi

Buka **Your statistics** dari dashboard atau menu akun untuk melihat ringkasan koleksi, distribusi rating, waktu diary, grafik tahunan, game dengan waktu tercatat terbanyak, genre, dan platform playthrough. Statistik hanya dapat dilihat oleh pemilik akun. Pemilihan tahun mengubah bagian aktivitas diary; ringkasan koleksi dan rating tetap mencerminkan data keseluruhan. Lihat [panduan statistik](docs/STATISTICS.md).

## Community dan profil pemain

Saat login, Community menampilkan **New from friends** dan **Popular with friends** di atas review pada halaman pertama. Sumbernya adalah pemain yang kamu follow dengan profil Public dan status Playing, Paused, atau Completed. Popular dihitung dari jumlah pemain berbeda; tanggal perubahan status terpisah dari edit rating/review. Tiap section menampilkan enam cover compact dengan pilihan Show more sampai dua belas game/aktivitas.

**Profile** kini merupakan ringkasan pribadi dengan Top 4, empat game yang paling baru aktif, dan review terbaru. Tombol **Edit profile** membuka `/community/profile/edit`, dengan informasi profil di kiri dan pengaturan Top 4 di kanan pada desktop. Aktivitas dan review privat dalam ringkasan hanya dapat dilihat pemilik akun.

Halaman **Players** menampilkan portrait pemain publik, follower, jumlah review publik, dan Top 4 pilihan mereka. Profil sendiri dikecualikan saat login. Jika belum ada pemain publik lain, halaman menampilkan **No other players yet.**, bukan akun contoh. Layout memakai lima kolom desktop, tiga kolom tablet, dan dua kolom ponsel.

Untuk menambahkan foto, buka **Profile → Edit profile → Profile photo**, pilih gambar JPEG/PNG/WebP maksimal 5 MB, lalu **Save photo**. Foto dan Top 4 dapat disimpan tanpa menyimpan informasi profil terlebih dahulu. Profil baru tetap privat. Tersedia pratinjau, pembatalan pilihan, penggantian, dan penghapusan foto. Foto mengikuti visibilitas profil dan tampil di komunitas serta avatar akun. Lihat [panduan foto profil](docs/PROFILE_PHOTOS.md).

Buka **Community** untuk membaca ulasan publik, lalu **Find players** untuk mencari pemain. Gunakan **Profile → Edit profile** untuk memilih username, nama publik, dan bio, kemudian pilih **Public** pada menu **Profile visibility** jika ingin profilmu tampil di komunitas. Profil tidak dipublikasikan otomatis. Dari profil pemain lain, pilih **Follow**; ulasan publik mereka muncul di tab **Following**. Diary, review privat, serta list privat/unlisted tidak tampil di profil publik. Library lengkap tetap privat. Profil Public membagikan empat Completed terbaru serta status Playing, Paused, dan Completed kepada followers melalui Community. Lihat [panduan komunitas](docs/COMMUNITY.md).

Profil juga memiliki rak **Top 4 Games** yang bisa dipilih dan diurutkan melalui **Edit profile → Top 4 Games**. Gunakan menu kecil **Profile visibility** untuk memilih Private atau Public. Profil Public otomatis menampilkan empat game Completed terbaru beserta rating dan tanggal selesai; tidak ada pengaturan berbagi terpisah. Lihat [panduan rak profil](docs/PROFILE_SHELVES.md).

## Library pribadi

Buka detail game dari `/games`, lalu gunakan kartu aksi di kanan untuk library, favorit, diary, rating, review, dan list. Status hanya Playing, Completed, Paused, dan Dropped; game juga dapat disimpan tanpa status. Lihat [panduan kartu aksi](docs/GAME_ACTIONS.md). Halaman `/library` menyediakan pencarian, filter status/favorit, dan pagination. Dashboard sekarang menampilkan ringkasan serta game terbaru dari koleksi akun yang login. Detail kepemilikan, penghapusan, dan alur fitur ada di [panduan library](docs/LIBRARY.md).

## Rating dan review

Setelah menambahkan game ke library, gunakan **Your rating** pada detail game untuk memberi 0,5–5 bintang. Tulis review di **Your story**, tandai spoiler bila diperlukan, dan pilih apakah ingin membagikannya ke publik. Review baru dimulai sebagai privat; review publik tampil pada **From the community**. Rating pribadi juga tampil pada kartu library. Lihat [panduan rating dan review](docs/RATINGS_REVIEWS.md).

## Playthrough dan diary

Dari detail game yang sudah ada di library, pilih **Playthroughs & diary** untuk membuat perjalanan pertama atau replay. Catat sesi beserta tanggal, durasi, dan catatan pribadi; buka **Diary** untuk mencari riwayat dari semua game. Status library, rating, dan review tetap dipertahankan saat mengelola playthrough. Lihat [panduan riwayat bermain](docs/PLAYING_HISTORY.md).

## Custom lists dan pencarian game lain

Buka **Lists** untuk membuat koleksi privat, unlisted, atau publik. Tambahkan game lewat pencarian dalam list, lalu atur catatan dan posisinya. List publik dapat ditemukan pada **Community lists**. Lihat [panduan list](docs/LISTS.md).

Untuk mencari judul yang belum ada di katalog, buka **Games → Find more games**, masukkan nama game di **Search RAWG**, lalu pilih cover, judul, atau **Open game**. Game yang dipilih otomatis tersimpan di katalog lokal sebelum detail dibuka. API key tetap di backend; detail ada di [panduan katalog](docs/CATALOG.md#search-and-import-from-the-website).

Halaman detail juga menampilkan **Connected worlds** untuk game dalam seri yang sama, ekspansi/edisi, game induk, dan relasi cerita terkurasi. Lihat [panduan relasi game](docs/GAME_CONNECTIONS.md) untuk menambahkan prequel/sequel/shared universe dengan sumber yang jelas.

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

Halaman pembuka dan token palet sudah diberi identitas PlayHaven. Katalog, library, playthrough, diary, rating, review, custom lists, profil pemain, follows, dan feed ulasan publik sudah memiliki layar serta endpoint. Model, factory, dan tes integritas mendukung fitur tersebut. Statistik pribadi serta tahap berikutnya tercantum dalam [data model](docs/DATA_MODEL.md) dan [product brief](docs/PRODUCT.md).

Untuk menjalankan seluruh tes pada PostgreSQL yang terpisah dari database development:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-postgres.ps1
```

Script memakai database disposable `playhaven_testing` dan memverifikasi targetnya sebelum tes mereset tabel. Database development `playhaven` tidak dipakai oleh tes tersebut.
