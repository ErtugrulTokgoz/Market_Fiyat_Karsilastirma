export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  message: string;
}

export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject({ message: "Tarayıcınız konum servisini desteklemiyor." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Konum alınamadı.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum erişimine izin verin.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Konum bilgisine şu anda ulaşılamıyor.";
            break;
          case error.TIMEOUT:
            errorMessage = "Konum isteği zaman aşımına uğradı.";
            break;
        }
        reject({ message: errorMessage });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
