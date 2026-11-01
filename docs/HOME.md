# Home

Halaman / memakai hero sinematik dengan identitas PlayHaven, gradasi gelap, font sans-serif global, header bersama, dan konten compact di container tengah 896 px.

## Popular this week

Home menampilkan hingga enam game lokal, diurutkan berdasarkan jumlah pemain unik pada profil publik yang aktif dalam tujuh hari terakhir. Aktivitas yang dihitung:

- menambahkan game ke Library;
- mengubah status game, memakai status_changed_at;
- memberi atau memperbarui rating;
- menulis atau memperbarui review publik.

Satu pemain dihitung paling banyak sekali per game, termasuk jika beberapa aktivitas terjadi pada periode yang sama. Profil privat, profil tanpa username, review privat, isi Diary, catatan sesi, serta perubahan metadata Library saja tidak menjadi aktivitas mingguan. Tanggal di luar rentang, termasuk masa depan, tidak dihitung. Jumlah yang ditampilkan merupakan agregat; identitas pemain dan teks review tidak disertakan.

Rentang tujuh hari bergerak mengikuti waktu aplikasi pada setiap request home. Peringkat dan hero otomatis mengikuti perubahan aktivitas serta keluarnya aktivitas lama dari rentang, tanpa job, scheduler, panggilan RAWG, atau impor katalog saat halaman dibuka. Urutan seri memakai jumlah pemain keseluruhan, jumlah rating, lalu ID game agar hasil stabil. Game dengan nol aktivitas mingguan mengisi sisa tempat bila jumlah game aktif kurang dari enam.

Jika seluruh katalog belum memiliki aktivitas mingguan, home tetap menampilkan hingga enam game berdasarkan popularitas keseluruhan dan memberi keterangan **No activity in the last 7 days. Showing overall popularity.** Angka pada kartu saat itu adalah jumlah pemain keseluruhan, bukan jumlah mingguan. Katalog kosong memiliki tampilan pengganti tanpa game atau banner contoh.

## Hero dan artwork

Game pada peringkat pertama menjadi satu-satunya sumber hero, judul, tautan detail, dan nama developer di bawah hero. Banner menggunakan games.banner_url yang sudah tersimpan dan tervalidasi, kemudian cover game yang sama jika banner tidak tersedia atau gagal dimuat. Bila kedua gambar tidak tersedia/gagal, hero memakai latar gradasi tanpa gambar. Tidak ada gambar RDR2 atau kredit Rockstar yang dipaksakan untuk game lain.

Banner URL dibatasi oleh validator metadata katalog yang ada. URL eksternal tidak tepercaya, URL berkredensial, dan parameter provider tidak diteruskan. Hero mendapat preload dan fetch priority tinggi; preload mengikuti gambar yang benar-benar dipakai, termasuk saat fallback. Artwork tetap diberi kredit metadata katalog melalui RAWG. Asset RDR2 lokal lama boleh tetap tersimpan, tetapi tidak lagi dipakai otomatis oleh home.

## Navigasi dan aksesibilitas

Header global menyediakan Games, Lists, Community, Players, pencarian, dan menu akun. Tamu mendapat Log in/Join PlayHaven; pengguna masuk mendapat Your haven dan Back to your library. Nama game pada hero dan enam kartu membuka detail game yang sesuai. Bagian fitur lain tetap menghubungkan Library, rating/review, Diary, Lists, Community, dan statistik.

Skip link, landmark navigasi, focus outline, pencarian berlabel, dan menu mobile dengan Escape tetap tersedia. Gambar hero bersifat dekoratif; judul game tetap tersedia sebagai teks dan tautan. Kartu menunjukkan posisi serta jumlah pemain mingguan atau keseluruhan sesuai mode ranking.

## Verifikasi

HomePageTest mencakup urutan enam game unik, pemilihan hero/developer/artwork, penghitungan pemain unik, seluruh sumber aktivitas, pengecualian aktivitas privat/metadata, batas rentang tujuh hari dan pergantian pemimpin, fallback tanpa aktivitas, katalog kosong, validasi URL, akses tamu/pengguna masuk, serta tidak adanya panggilan provider atau perubahan data Library.

Tes SQLite memakai database in-memory dan tes PostgreSQL hanya menargetkan playhaven_testing. Pengecekan browser memeriksa hero dinamis, fallback banner ke cover, artwork gagal/kosong, label weekly/fallback, navigasi, dan layout desktop/mobile.
