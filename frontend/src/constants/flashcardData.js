// TODO: [BACKEND-MIGRATION] File này hiện dùng làm fallback data ở frontend.
// Khi xây backend thực, chuyển data này về backend và xóa file này.
// Xem: backend/db.json → flashcards collection

export const FLASHCARDS = [
  {
    id: 1,
    word: "Apple",
    phonetic: "/ˈæp.əl/",
    meaning: "Quả táo",
    imageUrl: "https://images.unsplash.com/photo-1669999207738-fcdb7103a6f3?..." 
  },
  {
    id: 2,
    word: "Dog",
    phonetic: "/dɔːɡ/",
    meaning: "Con chó",
    imageUrl: "https://images.unsplash.com/photo-1632351459705-22a52c7a3d1d?..."
  },
  {
    id: 3,
    word: "Book",
    phonetic: "/bʊk/",
    meaning: "Quyển sách",
    imageUrl: "https://images.unsplash.com/photo-1637962638310-e6787f7eb324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYm9vayUyMHJlYWRpbmd8ZW58MXx8fHwxNzczNjI5MDg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: 4,
    word: "Coffee",
    phonetic: "/ˈkɒf.i/",
    meaning: "Cà phê",
    imageUrl: "https://images.unsplash.com/photo-1645771321012-919d2e7aa858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBjdXAlMjBtb3JuaW5nfGVufDF8fHx8MTc3MzYwMTYzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: 5,
    word: "Bicycle",
    phonetic: "/ˈbaɪ.sɪ.kəl/",
    meaning: "Xe đạp",
    imageUrl: "https://images.unsplash.com/photo-1720839011417-15a31c24bc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWN5Y2xlJTIwcmlkZSUyMG91dGRvb3J8ZW58MXx8fHwxNzczNjI5MDg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  }
];
