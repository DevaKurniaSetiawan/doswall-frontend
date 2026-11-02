import type { Announcement, DoswallUser, LocationSuggestion, QueueItem } from './doswall-api'

const FACULTIES = ['FIP', 'FBS', 'FMIPA', 'FIS', 'FT', 'FIK', 'FE', 'FH', 'Pascasarjana', 'LPPM']
const LOCATIONS = ['Semarang', 'Ungaran', 'Kendal', 'Demak', 'Salatiga', 'Kudus', 'Jepara', 'Pati', 'Magelang', 'Solo']
const ROLES: DoswallUser['role'][] = ['user', 'user', 'user', 'user', 'admin', 'user', 'user', 'user', 'user', 'superadmin']
const DUMMY_PASSWORD = 'Doswall123!'

function pad(n: number) { return String(n).padStart(2, '0') }
function dummyDate(daysAgo: number) {
  const d = new Date(2026, 9, 31 - daysAgo)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(8 + (daysAgo % 10))}:${pad(daysAgo % 60)}:00`
}

export const DUMMY_USERS: DoswallUser[] = Array.from({ length: 50 }, (_, i) => {
  const faculty = FACULTIES[i % FACULTIES.length]
  const firstName = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gilang', 'Hana', 'Irfan', 'Joko',
    'Kartika', 'Luthfi', 'Maya', 'Novan', 'Okta', 'Putri', 'Qori', 'Rafi', 'Sari', 'Tio',
    'Umar', 'Vina', 'Wahyu', 'Xenia', 'Yuda', 'Zara', 'Andi', 'Bella', 'Cahyo', 'Dian',
    'Elang', 'Fara', 'Galih', 'Hesti', 'Imam', 'Julia', 'Kevin', 'Laras', 'Miko', 'Nisa',
    'Oscar', 'Pita', 'Qiran', 'Reza', 'Sinta', 'Teguh', 'Ulfah', 'Vito', 'Wendi', 'Yani'][i]
  const lastName = ['Pratama', 'Setiawan', 'Rahayu', 'Santoso', 'Wijaya', 'Kusuma', 'Nugraha', 'Handoko',
    'Maulana', 'Susanto', 'Pramono', 'Hidayat', 'Saputra', 'Lestari', 'Firmansyah', 'Andriani',
    'Wibowo', 'Puspita', 'Surya', 'Hartono', 'Utomo', 'Ningrum', 'Hakim', 'Anggraeni',
    'Saputro', 'Permata', 'Budiman', 'Dewanti', 'Prasetyo', 'Maharani', 'Kurniawan', 'Febriani',
    'Adiputra', 'Wahyuni', 'Iskandar', 'Novitasari', 'Syahputra', 'Ratnasari', 'Hermawan', 'Pramesti',
    'Gunawan', 'Fitriani', 'Ardiansyah', 'Sulistyowati', 'Pangestu', 'Trisnawati', 'Mulyono',
    'Wulandari', 'Darwanto', 'Kusumawardani'][i]
  const name = `${firstName} ${lastName}`
  const emailSlug = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`

  return {
    user_id: `USR${String(i + 1).padStart(3, '0')}`,
    name,
    email: i === 9 ? 'superadmin@gmail.com' : `${emailSlug}@unnes.ac.id`,
    password: DUMMY_PASSWORD,
    role: ROLES[i % ROLES.length],
    status: i % 3 === 0 ? 1 : 0,
    geotag: i % 3 === 0 ? LOCATIONS[i % LOCATIONS.length] : '',
    notes: i % 3 === 0 ? `Tugas ${faculty} hari ini` : '',
    last_update: dummyDate(i % 15),
    created_at: dummyDate(30 + i),
    token: `dummy-token-${i + 1}`,
  }
})

export const DUMMY_ANNOUNCEMENTS: Announcement[] = [
  { announcement_id: 'ANN001', title: 'PEMELIHARAAN SISTEM AKADEMIK', content: 'Pemeliharaan terjadwal portal akademik pada Minggu pukul 04.00–06.00 WIB. Harap selesaikan input nilai sebelumnya.', user_id: 'USR005', creator_name: 'Admin FIP', created_at: dummyDate(0) },
  { announcement_id: 'ANN002', title: 'PEDOMAN PENGGUNAAN DOSWALL', content: 'Pedoman penggunaan sistem Doswall versi terbaru telah diterbitkan. Wajib dibaca oleh semua pengguna.', user_id: 'USR005', creator_name: 'Admin FBS', created_at: dummyDate(1) },
  { announcement_id: 'ANN003', title: 'SINKRONISASI DATA SEMESTER', content: 'Pastikan data kehadiran Anda tersinkronisasi sebelum akhir semester untuk menghindari ketidaksesuaian laporan.', user_id: 'USR010', creator_name: 'Admin FMIPA', created_at: dummyDate(2) },
  { announcement_id: 'ANN004', title: 'PERUBAHAN JAM OPERASIONAL', content: 'Mulai pekan depan, jam operasional layanan administrasi berubah menjadi 08.00–15.00 WIB setiap hari kerja.', user_id: 'USR005', creator_name: 'Admin FIS', created_at: dummyDate(3) },
  { announcement_id: 'ANN005', title: 'RAPAT KOORDINASI BULANAN', content: 'Rapat koordinasi bulanan akan dilaksanakan pada Rabu, 4 November 2026 pukul 09.00 WIB di Aula Rektorat.', user_id: 'USR010', creator_name: 'Admin FT', created_at: dummyDate(4) },
  { announcement_id: 'ANN006', title: 'PEMBARUAN KEBIJAKAN KEAMANAN', content: 'Kebijakan keamanan akun telah diperbarui. Harap ganti kata sandi Anda dalam 7 hari ke depan.', user_id: 'USR005', creator_name: 'Admin FIK', created_at: dummyDate(5) },
]

export const DUMMY_QUEUE: QueueItem[] = [
  { order: 1, duration: '30', announcement_id: 'ANN001', title: 'PEMELIHARAAN SISTEM AKADEMIK', content: DUMMY_ANNOUNCEMENTS[0].content },
  { order: 2, duration: '20', announcement_id: 'ANN004', title: 'PERUBAHAN JAM OPERASIONAL', content: DUMMY_ANNOUNCEMENTS[3].content },
  { order: 3, duration: '25', announcement_id: 'ANN005', title: 'RAPAT KOORDINASI BULANAN', content: DUMMY_ANNOUNCEMENTS[4].content },
]

export const DUMMY_LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  { name: 'Gedung Rektorat UNNES', distance: 45 },
  { name: 'Fakultas Ilmu Pendidikan UNNES', distance: 120 },
  { name: 'Perpustakaan Pusat UNNES', distance: 180 },
  { name: 'Auditorium UNNES', distance: 220 },
  { name: 'Kantin Sekaran', distance: 310 },
]

export const DUMMY_PASSWORD_VALUE = DUMMY_PASSWORD
