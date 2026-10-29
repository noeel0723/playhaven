# Home

Halaman `/` memakai komposisi hero sinematik dengan identitas PlayHaven: palet Caviar, Rein, Shadow, Saddle, dan Mustang, logo gamepad, headline serif, serta teks antarmuka berbahasa Inggris.

Header home menggunakan komponen global `resources/js/components/site-header.tsx`, yang juga dipakai katalog, dashboard, halaman publik, halaman privat, login/registrasi, dan pengaturan. Tinggi tetap dan container yang sama menjaga posisi logo serta navigasi konsisten sebelum dan setelah login. Home mempertahankan header transparan di atas artwork; halaman katalog menambahkan garis pemisah di bawahnya.

## Konten dan navigasi

- Hero **Red Dead Redemption 2** memakai gambar lokal yang telah dioptimalkan, dengan gradasi gelap agar menyatu ke konten.
- Header menyediakan Games, Lists, Community, Players, dan pencarian GET ke `/games?q=...`. Untuk mencari judul di RAWG, lanjutkan melalui **Find more games** di katalog.
- Tamu mendapat tautan Log in dan Join PlayHaven. Setelah login, tersedia Your haven, menu akun desktop, dan tombol **Back to your library**. Menu mobile menyediakan Your library dan Your haven.
- Enam cover berasal dari database lokal: RDR2 diprioritaskan, lalu jumlah rating, jumlah pemain, tanggal rilis, dan ID. Jumlah game berasal dari database, bukan angka contoh.
- Tautan **Featured world** membuka detail RDR2 bila game tersebut sudah tersedia di katalog. Tanpa data itu, judul tetap tampil sebagai teks. Katalog kosong memiliki tampilan pengganti.
- Bagian pengalaman menghubungkan library, rating/review, diary, list, komunitas, dan statistik pribadi yang sudah tersedia. Tautan privat tetap mengikuti autentikasi aplikasi.
- Halaman ini tidak melakukan pencarian atau impor RAWG otomatis dan tidak menampilkan kredensial provider, review privat, atau data library pribadi.

## Artwork

Hero menggunakan screenshot Red Dead Redemption 2 yang tersedia melalui metadata RAWG (`background_image_additional`, game ID 28):

- Sumber gambar: <https://media.rawg.io/media/screenshots/f3d/f3d6c0eaf1db2bdbb44ad84f15e43f4f.jpg>
- Game dan pemilik artwork: [Rockstar Games — Red Dead Redemption 2](https://www.rockstargames.com/reddeadredemption2/).
- Penyedia metadata dan cover: [RAWG](https://rawg.io).

Gambar sumber diubah ukuran dan dikompresi ke WebP; tidak ada logo atau artwork Letterboxd yang digunakan. Kredit RAWG dan Rockstar Games juga tampil di footer.

| Asset lokal                              | Dimensi     | Ukuran        |
| ---------------------------------------- | ----------- | ------------- |
| `public/images/home/rdr2-hero-1920.webp` | 1920 × 1080 | 158,430 bytes |
| `public/images/home/rdr2-hero-960.webp`  | 960 × 540   | 63,498 bytes  |

Browser memilih ukuran melalui `srcSet`; hero mendapat preload dan fetch priority tinggi. Cover katalog memakai komponen GameCover yang sudah tersedia.

## Aksesibilitas dan verifikasi

Tersedia skip link, landmark navigasi, label pencarian, outline keyboard, serta menu mobile native `details` yang bisa ditutup dengan Escape. Gambar hero bersifat dekoratif karena informasi game tampil sebagai teks di bawahnya.

`HomePageTest` memeriksa katalog kosong, pemilihan enam game tanpa duplikasi, pembatasan data publik, akses setelah login, dan tidak adanya panggilan provider. Tes default menggunakan SQLite in-memory; `scripts/test-postgres.ps1` memakai database `playhaven_testing` terpisah. Pemeriksaan browser mencakup pencarian desktop/mobile, navigasi setelah login, dan lebar 320–1920 px.
