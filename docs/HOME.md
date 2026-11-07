# Home

Halaman / memakai hero sinematik dengan identitas PlayHaven, gradasi gelap, font sans-serif global, header bersama, dan konten compact di container tengah 896 px.

## Popular this week

Home menampilkan hingga enam game lokal, diurutkan berdasarkan jumlah pemain unik pada profil publik yang aktif dalam tujuh hari terakhir. Aktivitas yang dihitung:

- menambahkan game ke Library;
- mengubah status game, memakai status_changed_at;
- memberi atau memperbarui rating;
- menulis atau memperbarui review publik.

Satu pemain dihitung paling banyak sekali per game, termasuk jika beberapa aktivitas terjadi pada periode yang sama. Profil privat, profil tanpa username, review privat, isi Diary, catatan sesi, serta perubahan metadata Library saja tidak menjadi aktivitas mingguan. Tanggal di luar rentang, termasuk masa depan, tidak dihitung. Peringkat memakai agregat; identitas pemain dan teks review tidak disertakan.

Rentang tujuh hari bergerak mengikuti waktu aplikasi pada setiap request home. Peringkat dan hero otomatis mengikuti perubahan aktivitas serta keluarnya aktivitas lama dari rentang, tanpa job, scheduler, panggilan TheGamesDB, atau impor katalog saat halaman dibuka. Urutan seri memakai jumlah pemain keseluruhan, jumlah rating, lalu ID game agar hasil stabil. Game dengan nol aktivitas mingguan mengisi sisa tempat bila jumlah game aktif kurang dari enam.

Jika seluruh katalog belum memiliki aktivitas mingguan, home tetap menampilkan hingga enam game berdasarkan popularitas keseluruhan. Kartu ditampilkan sesuai urutan dari kiri ke kanan tanpa nomor peringkat, jumlah pemain, penjelasan perhitungan, atau jumlah katalog. Katalog kosong memiliki tampilan pengganti tanpa game atau banner contoh.

## Hero dan artwork

Game pada peringkat pertama menjadi satu-satunya sumber hero, judul, tautan detail, dan nama developer di bawah hero. Banner menggunakan games.banner_url yang sudah tersimpan dan tervalidasi, kemudian cover game yang sama jika banner tidak tersedia atau gagal dimuat. Bila kedua gambar tidak tersedia/gagal, hero memakai latar gradasi tanpa gambar. Tidak ada gambar RDR2 atau kredit Rockstar yang dipaksakan untuk game lain.

Banner URL dibatasi oleh validator metadata katalog yang ada. URL eksternal tidak tepercaya, URL berkredensial, dan parameter provider tidak diteruskan. Hero mendapat preload dan fetch priority tinggi; preload mengikuti gambar yang benar-benar dipakai, termasuk saat fallback. Artwork tetap diberi kredit metadata katalog melalui TheGamesDB. Asset RDR2 lokal lama boleh tetap tersimpan, tetapi tidak lagi dipakai otomatis oleh home.

## Navigasi dan aksesibilitas

Header global menyediakan Games, Lists, Community, Players, pencarian, dan menu akun. Tamu mendapat Log in/Join PlayHaven; pengguna masuk mendapat Your haven dan Back to your library. Nama game pada hero dan enam kartu membuka detail game yang sesuai. Bagian fitur lain tetap menghubungkan Library, rating/review, Diary, Lists, Community, dan statistik.

Skip link, landmark navigasi, focus outline, pencarian berlabel, dan menu mobile dengan Escape tetap tersedia. Gambar hero bersifat dekoratif; judul game tetap tersedia sebagai teks dan tautan. Kartu menampilkan cover dan nama game; urutan kiri ke kanan menunjukkan popularitas tanpa nomor atau angka aktivitas.

## Verifikasi

HomePageTest mencakup urutan enam game unik, pemilihan hero/developer/artwork, penghitungan pemain unik, seluruh sumber aktivitas, pengecualian aktivitas privat/metadata, batas rentang tujuh hari dan pergantian pemimpin, fallback tanpa aktivitas, katalog kosong, validasi URL, akses tamu/pengguna masuk, serta tidak adanya panggilan provider atau perubahan data Library.

Tes SQLite memakai database in-memory dan tes PostgreSQL hanya menargetkan playhaven_testing. Pengecekan browser memeriksa hero dinamis, fallback banner ke cover, artwork gagal/kosong, urutan kartu tanpa teks angka/perhitungan, navigasi, dan layout desktop/mobile.

## Footer global dan autentikasi

SiteFooter dipakai pada home, layout katalog, layout aplikasi/pengaturan, dan layout autentikasi. Container tengah 896 px menyusun brand, Explore, dan Your account, lalu baris copyright/kredit TheGamesDB. Semua tautan menuju halaman yang sudah tersedia. Tautan akun mengikuti status login, dengan target fokus keyboard dan ukuran teks/tombol compact. Footer menempati akhir halaman tanpa duplikasi.

Login dan pendaftaran memakai hero dari WeeklyPopularGames yang sama dengan home, termasuk fallback banner ke cover game yang sama dan gradasi bila artwork gagal. PopularGameBackdrop menyatukan render dan preload artwork untuk ketiganya. Tidak ada permintaan API game saat membuka form.

Form autentikasi menggunakan panel tengah maksimal 384 px, padding 16–20 px, input/tombol utama 32 px, label/body 11–12 px, dan font sans-serif global. Login, password reveal, remember me, password recovery, passkey, password rules, validasi, CSRF, rate limit, serta redirect Fortify tetap memakai implementasi yang ada. Halaman recovery/verification tidak memuat peringkat hero. AuthHeroTest memeriksa sumber hero yang sama, pergantian pemimpin, artwork kosong/tidak tepercaya, dan tidak adanya panggilan provider.
