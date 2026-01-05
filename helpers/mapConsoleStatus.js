const mapConsoleStatus = (
  ps,
  sewaAktif,
  idSewaDitempat = null,
  rentalData = null
) => {
  let color = "gray";
  let text = "Tidak Diketahui";
  let actions = [];

  switch (ps.status_fisik) {
    case "available":
      if (sewaAktif) {
        color = "blue";
        text = "Sedang Disewa";
        actions = [{ label: "Selesaikan Sewa", action: "selesaikan_sewa" }];
      } else {
        color = "green";
        text = "Tersedia";
        actions = [
          { label: "Sewa di Tempat", action: "sewa_ditempat" },
          { label: "Sewa Dibawa Pulang", action: "sewa_bawa_pulang" },
          { label: "Tandai Maintenance", action: "ubah_status_maintenance" },
        ];
      }
      break;

    case "in_use":
      color = "blue";
      text = "Sedang Disewa di Tempat";
      actions = [{ label: "Selesaikan Sewa", action: "selesaikan_sewa" }];
      break;

    case "borrowed_out":
      color = "silver";
      text = "Sewa Dibawa Pulang";
      // actions = [{ label: "Selesaikan Sewa", action: "selesaikan_sewa" }];
      break;

    case "maintenance":
      color = "black";
      text = "Maintenance";
      actions = [
        { label: "Selesaikan Maintenance", action: "ubah_status_available" },
      ];
      break;

    case "rusak":
      color = "darkred";
      text = "Rusak";
      break;
  }
  return {
    id_ps: ps.id_ps,
    id_cabang: ps.id_cabang ?? null, // ⬅ Tambahkan agar frontend bisa akses
    label: ps.label || ps.nama_ps || `PS ${ps.id_ps}`,
    statusFisik: ps.status_fisik,
    statusText: text,
    color,
    actions,
    id_sewa_ditempat: idSewaDitempat,
    nama: rentalData?.nama_penyewa ?? null,
    waktu_selesai: rentalData?.waktu_selesai_estimasi ?? null,
    tanggal_kembali: rentalData?.tanggal_kembali ?? null,
    id_jenis_ps: ps.id_jenis_ps ?? null,
    nama_jenis: ps.nama_jenis ?? null,
  };
};

module.exports = mapConsoleStatus;
